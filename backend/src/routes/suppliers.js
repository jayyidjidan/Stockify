const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.get('/', auth, async (req, res, next) => {
  try {
    const { q, status, page = 1, limit = 10 } = req.query;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const conditions = [];
    const params = [];

    if (q) {
      params.push(`%${q}%`);
      conditions.push(`(s.name ILIKE $${params.length} OR s.contact_person ILIKE $${params.length} OR s.email ILIKE $${params.length} OR s.phone ILIKE $${params.length})`);
    }

    if (status) {
      params.push(status);
      conditions.push(`s.status = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await pool.query(`SELECT COUNT(*) FROM suppliers s ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    params.push(take, offset);
    const query = `
      SELECT 
        s.*,
        COUNT(st.id)::int AS total_transactions
      FROM suppliers s
      LEFT JOIN stock_transactions st ON st.supplier_id = s.id AND st.transaction_type = 'stock_in'
      ${whereClause}
      GROUP BY s.id
      ORDER BY s.created_at DESC
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

    const { rows } = await pool.query(`SELECT * FROM suppliers WHERE id = $1`, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    const supplier = rows[0];

    const statsResult = await pool.query(
      `SELECT 
         COUNT(st.id)::int AS total_transactions,
         COALESCE(SUM(sti.quantity), 0)::int AS total_quantity_received
       FROM stock_transactions st
       LEFT JOIN stock_transaction_items sti ON sti.transaction_id = st.id
       WHERE st.supplier_id = $1 AND st.transaction_type = 'stock_in'`,
      [id]
    );

    const historyResult = await pool.query(
      `SELECT 
         st.id,
         st.transaction_number,
         st.transaction_date,
         st.notes,
         st.status,
         st.created_at,
         u.full_name AS created_by_name,
         COUNT(sti.id)::int AS total_items,
         COALESCE(SUM(sti.quantity), 0)::int AS total_quantity,
         COALESCE(SUM(sti.subtotal), 0)::numeric AS total_amount
       FROM stock_transactions st
       JOIN users u ON u.id = st.user_id
       LEFT JOIN stock_transaction_items sti ON sti.transaction_id = st.id
       WHERE st.supplier_id = $1 AND st.transaction_type = 'stock_in'
       GROUP BY st.id, u.full_name
       ORDER BY st.transaction_date DESC, st.created_at DESC
       LIMIT 20`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...supplier,
        stats: statsResult.rows[0],
        transactions: historyResult.rows,
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
    body('name').trim().notEmpty().withMessage('Supplier name is required'),
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email format'),
    body('phone').optional().trim(),
    body('contact_person').optional().trim(),
    body('address').optional().trim(),
    body('description').optional().trim(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { name, contact_person, email, phone, address, description, status = 'active' } = req.body;

      const { rows } = await pool.query(
        `INSERT INTO suppliers (name, contact_person, email, phone, address, description, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [name, contact_person || null, email || null, phone || null, address || null, description || null, status]
      );

      res.status(201).json({ success: true, data: rows[0], message: 'Supplier created' });
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
    body('name').trim().notEmpty().withMessage('Supplier name is required'),
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email format'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const { name, contact_person, email, phone, address, description, status } = req.body;

      const { rows } = await pool.query(
        `UPDATE suppliers
         SET name = $1, contact_person = $2, email = $3, phone = $4, address = $5, description = $6,
             status = COALESCE($7, status), updated_at = NOW()
         WHERE id = $8
         RETURNING *`,
        [name, contact_person || null, email || null, phone || null, address || null, description || null, status || null, id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Supplier not found' });
      }

      res.json({ success: true, data: rows[0], message: 'Supplier updated' });
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
      `UPDATE suppliers SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    res.json({ success: true, data: rows[0], message: `Supplier status changed to ${status}` });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
