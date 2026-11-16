const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.get('/', auth, async (req, res, next) => {
  try {
    const {
      q,
      category_id,
      status,
      stock_status,
      sort_by = 'created_at',
      sort_dir = 'desc',
      page = 1,
      limit = 10,
    } = req.query;

    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const conditions = [];
    const params = [];

    if (q) {
      params.push(`%${q}%`);
      conditions.push(`(p.sku ILIKE $${params.length} OR p.name ILIKE $${params.length})`);
    }

    if (category_id) {
      params.push(category_id);
      conditions.push(`p.category_id = $${params.length}`);
    }

    if (status) {
      params.push(status);
      conditions.push(`p.status = $${params.length}`);
    }

    if (stock_status === 'low_stock') {
      conditions.push(`p.current_stock <= p.minimum_stock AND p.current_stock > 0`);
    } else if (stock_status === 'out_of_stock') {
      conditions.push(`p.current_stock = 0`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const allowedSortFields = {
      sku: 'p.sku',
      name: 'p.name',
      current_stock: 'p.current_stock',
      purchase_price: 'p.purchase_price',
      selling_price: 'p.selling_price',
      created_at: 'p.created_at',
    };
    const sortField = allowedSortFields[sort_by] || 'p.created_at';
    const sortDirection = sort_dir.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const countResult = await pool.query(`SELECT COUNT(*) FROM products p ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    params.push(take, offset);
    const query = `
      SELECT 
        p.*,
        c.name AS category_name,
        CASE
          WHEN p.current_stock = 0 THEN 'out_of_stock'
          WHEN p.current_stock <= p.minimum_stock THEN 'low_stock'
          ELSE 'in_stock'
        END AS stock_status
      FROM products p
      JOIN categories c ON c.id = p.category_id
      ${whereClause}
      ORDER BY ${sortField} ${sortDirection}
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const { rows } = await pool.query(query, params);

    res.json({
      success: true,
      data: rows,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: take,
        totalPages: Math.ceil(total / take) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      `SELECT 
         p.*,
         c.name AS category_name,
         CASE
           WHEN p.current_stock = 0 THEN 'out_of_stock'
           WHEN p.current_stock <= p.minimum_stock THEN 'low_stock'
           ELSE 'in_stock'
         END AS stock_status
       FROM products p
       JOIN categories c ON c.id = p.category_id
       WHERE p.id = $1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const product = rows[0];

    const movementsResult = await pool.query(
      `SELECT 
         sm.*,
         st.transaction_number,
         u.full_name AS created_by_name
       FROM stock_movements sm
       JOIN stock_transactions st ON st.id = sm.transaction_id
       JOIN users u ON u.id = sm.user_id
       WHERE sm.product_id = $1
       ORDER BY sm.created_at DESC
       LIMIT 15`,
      [id]
    );

    const suppliersResult = await pool.query(
      `SELECT DISTINCT
         s.id,
         s.name,
         s.contact_person,
         s.phone,
         s.email,
         MAX(st.transaction_date) AS last_supply_date
       FROM stock_transaction_items sti
       JOIN stock_transactions st ON st.id = sti.transaction_id
       JOIN suppliers s ON s.id = st.supplier_id
       WHERE sti.product_id = $1 AND st.transaction_type = 'stock_in'
       GROUP BY s.id, s.name, s.contact_person, s.phone, s.email
       ORDER BY last_supply_date DESC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...product,
        recent_movements: movementsResult.rows,
        suppliers: suppliersResult.rows,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  auth,
  authorize('Admin'),
  [
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('sku').trim().notEmpty().withMessage('SKU is required'),
    body('category_id').isUUID().withMessage('Valid category ID is required'),
    body('unit').trim().notEmpty().withMessage('Unit is required'),
    body('purchase_price').isFloat({ min: 0 }).withMessage('Purchase price cannot be negative'),
    body('selling_price').isFloat({ min: 0 }).withMessage('Selling price cannot be negative'),
    body('minimum_stock').isInt({ min: 0 }).withMessage('Minimum stock cannot be negative'),
    body('description').optional().trim(),
    body('image_url').optional({ checkFalsy: true }).trim(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const {
        name,
        sku,
        category_id,
        unit,
        purchase_price,
        selling_price,
        minimum_stock,
        description,
        image_url,
      } = req.body;

      const skuCheck = await pool.query('SELECT id FROM products WHERE LOWER(sku) = LOWER($1)', [sku]);
      if (skuCheck.rows.length > 0) {
        return res.status(400).json({ success: false, message: 'SKU already exists' });
      }

      const categoryCheck = await pool.query('SELECT id FROM categories WHERE id = $1', [category_id]);
      if (categoryCheck.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'Category not found' });
      }

      const { rows } = await pool.query(
        `INSERT INTO products 
         (name, sku, category_id, unit, purchase_price, selling_price, current_stock, minimum_stock, description, image_url, status)
         VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $8, $9, 'active')
         RETURNING *`,
        [
          name,
          sku.toUpperCase(),
          category_id,
          unit,
          purchase_price,
          selling_price,
          minimum_stock,
          description || null,
          image_url || null,
        ]
      );

      res.status(201).json({ success: true, data: rows[0], message: 'Product created' });
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/:id',
  auth,
  authorize('Admin'),
  [
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('sku').trim().notEmpty().withMessage('SKU is required'),
    body('category_id').isUUID().withMessage('Valid category ID is required'),
    body('unit').trim().notEmpty().withMessage('Unit is required'),
    body('purchase_price').isFloat({ min: 0 }).withMessage('Purchase price cannot be negative'),
    body('selling_price').isFloat({ min: 0 }).withMessage('Selling price cannot be negative'),
    body('minimum_stock').isInt({ min: 0 }).withMessage('Minimum stock cannot be negative'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const {
        name,
        sku,
        category_id,
        unit,
        purchase_price,
        selling_price,
        minimum_stock,
        description,
        image_url,
      } = req.body;

      const skuCheck = await pool.query(
        'SELECT id FROM products WHERE LOWER(sku) = LOWER($1) AND id != $2',
        [sku, id]
      );
      if (skuCheck.rows.length > 0) {
        return res.status(400).json({ success: false, message: 'SKU already exists' });
      }

      const categoryCheck = await pool.query('SELECT id FROM categories WHERE id = $1', [category_id]);
      if (categoryCheck.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'Category not found' });
      }

      const { rows } = await pool.query(
        `UPDATE products 
         SET name = $1, sku = $2, category_id = $3, unit = $4, purchase_price = $5,
             selling_price = $6, minimum_stock = $7, description = $8, image_url = $9,
             updated_at = NOW()
         WHERE id = $10
         RETURNING *`,
        [
          name,
          sku.toUpperCase(),
          category_id,
          unit,
          purchase_price,
          selling_price,
          minimum_stock,
          description || null,
          image_url || null,
          id,
        ]
      );

      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      res.json({ success: true, data: rows[0], message: 'Product updated' });
    } catch (err) {
      next(err);
    }
  }
);

router.patch('/:id/status', auth, authorize('Admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const { rows } = await pool.query(
      `UPDATE products SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, data: rows[0], message: `Product status changed to ${status}` });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
