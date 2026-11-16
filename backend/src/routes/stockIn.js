const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { generateTransactionNumber } = require('../helpers/generateTransactionNumber');

const router = express.Router();

router.get('/', auth, async (req, res, next) => {
  try {
    const { q, supplier_id, from_date, to_date, page = 1, limit = 10 } = req.query;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const conditions = ["st.transaction_type = 'stock_in'"];
    const params = [];

    if (q) {
      params.push(`%${q}%`);
      conditions.push(`(st.transaction_number ILIKE $${params.length} OR s.name ILIKE $${params.length})`);
    }

    if (supplier_id) {
      params.push(supplier_id);
      conditions.push(`st.supplier_id = $${params.length}`);
    }

    if (from_date) {
      params.push(from_date);
      conditions.push(`st.transaction_date >= $${params.length}`);
    }

    if (to_date) {
      params.push(to_date);
      conditions.push(`st.transaction_date <= $${params.length}`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM stock_transactions st LEFT JOIN suppliers s ON s.id = st.supplier_id ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    params.push(take, offset);
    const query = `
      SELECT 
        st.id,
        st.transaction_number,
        st.transaction_date,
        st.notes,
        st.status,
        st.created_at,
        s.id AS supplier_id,
        s.name AS supplier_name,
        u.id AS user_id,
        u.full_name AS created_by_name,
        COUNT(sti.id)::int AS total_items,
        COALESCE(SUM(sti.quantity), 0)::int AS total_quantity,
        COALESCE(SUM(sti.subtotal), 0)::numeric AS total_amount
      FROM stock_transactions st
      LEFT JOIN suppliers s ON s.id = st.supplier_id
      JOIN users u ON u.id = st.user_id
      LEFT JOIN stock_transaction_items sti ON sti.transaction_id = st.id
      ${whereClause}
      GROUP BY st.id, s.id, s.name, u.id, u.full_name
      ORDER BY st.transaction_date DESC, st.created_at DESC
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
         st.*,
         s.name AS supplier_name,
         s.contact_person,
         s.phone AS supplier_phone,
         s.email AS supplier_email,
         u.full_name AS created_by_name
       FROM stock_transactions st
       LEFT JOIN suppliers s ON s.id = st.supplier_id
       JOIN users u ON u.id = st.user_id
       WHERE st.id = $1 AND st.transaction_type = 'stock_in'`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Stock In transaction not found' });
    }

    const header = rows[0];

    const itemsResult = await pool.query(
      `SELECT 
         sti.*,
         p.name AS product_name,
         p.sku,
         p.unit
       FROM stock_transaction_items sti
       JOIN products p ON p.id = sti.product_id
       WHERE sti.transaction_id = $1
       ORDER BY sti.created_at ASC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...header,
        items: itemsResult.rows,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  auth,
  authorize('Admin', 'Warehouse Staff'),
  [
    body('supplier_id').isUUID().withMessage('Valid supplier ID is required'),
    body('transaction_date').isISO8601().withMessage('Valid transaction date is required'),
    body('notes').optional().trim(),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required in the transaction'),
    body('items.*.product_id').isUUID().withMessage('Valid product ID is required for each item'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be greater than zero'),
    body('items.*.unit_price').isFloat({ min: 0 }).withMessage('Unit price cannot be negative'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const { supplier_id, transaction_date, notes, items } = req.body;

      const supplierCheck = await client.query('SELECT id, status FROM suppliers WHERE id = $1', [supplier_id]);
      if (supplierCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: 'Supplier not found' });
      }
      if (supplierCheck.rows[0].status !== 'active') {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: 'Supplier is inactive' });
      }

      for (const item of items) {
        const prodCheck = await client.query('SELECT id, name, status FROM products WHERE id = $1', [item.product_id]);
        if (prodCheck.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({ success: false, message: `Product ${item.product_id} not found` });
        }
        if (prodCheck.rows[0].status !== 'active') {
          await client.query('ROLLBACK');
          return res.status(400).json({
            success: false,
            message: `Product "${prodCheck.rows[0].name}" is inactive and cannot be selected`,
          });
        }
      }

      const transactionNumber = await generateTransactionNumber('stock_in', client);

      const headerResult = await client.query(
        `INSERT INTO stock_transactions 
         (supplier_id, user_id, transaction_number, transaction_type, transaction_date, notes, status)
         VALUES ($1, $2, $3, 'stock_in', $4, $5, 'completed')
         RETURNING *`,
        [supplier_id, req.user.id, transactionNumber, transaction_date, notes || null]
      );
      const transaction = headerResult.rows[0];

      const insertedItems = [];
      for (const item of items) {
        const subtotal = Number(item.quantity) * Number(item.unit_price);

        const itemResult = await client.query(
          `INSERT INTO stock_transaction_items 
           (transaction_id, product_id, quantity, unit_price, subtotal)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [transaction.id, item.product_id, item.quantity, item.unit_price, subtotal]
        );
        insertedItems.push(itemResult.rows[0]);

        const prodStockResult = await client.query(
          `SELECT current_stock FROM products WHERE id = $1 FOR UPDATE`,
          [item.product_id]
        );
        const prevStock = prodStockResult.rows[0].current_stock;
        const newStock = prevStock + Number(item.quantity);

        await client.query(
          `UPDATE products 
           SET current_stock = $1, purchase_price = $2, updated_at = NOW() 
           WHERE id = $3`,
          [newStock, item.unit_price, item.product_id]
        );

        await client.query(
          `INSERT INTO stock_movements 
           (product_id, transaction_id, user_id, movement_type, quantity_in, quantity_out, previous_stock, current_stock)
           VALUES ($1, $2, $3, 'stock_in', $4, 0, $5, $6)`,
          [item.product_id, transaction.id, req.user.id, item.quantity, prevStock, newStock]
        );
      }

      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        message: 'Stock In transaction recorded successfully',
        data: {
          ...transaction,
          items: insertedItems,
        },
      });
    } catch (err) {
      await client.query('ROLLBACK');
      next(err);
    } finally {
      client.release();
    }
  }
);

module.exports = router;
