const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res, next) => {
  try {
    const { q, product_id, movement_type, from_date, to_date, page = 1, limit = 10 } = req.query;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const conditions = [];
    const params = [];

    if (q) {
      params.push(`%${q}%`);
      conditions.push(`(p.name ILIKE $${params.length} OR p.sku ILIKE $${params.length} OR st.transaction_number ILIKE $${params.length})`);
    }

    if (product_id) {
      params.push(product_id);
      conditions.push(`sm.product_id = $${params.length}`);
    }

    if (movement_type) {
      params.push(movement_type);
      conditions.push(`sm.movement_type = $${params.length}`);
    }

    if (from_date) {
      params.push(from_date);
      conditions.push(`sm.created_at::date >= $${params.length}`);
    }

    if (to_date) {
      params.push(to_date);
      conditions.push(`sm.created_at::date <= $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await pool.query(
      `SELECT COUNT(*)
       FROM stock_movements sm
       JOIN products p ON p.id = sm.product_id
       JOIN stock_transactions st ON st.id = sm.transaction_id
       ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    params.push(take, offset);
    const query = `
      SELECT 
        sm.id,
        sm.movement_type,
        sm.quantity_in,
        sm.quantity_out,
        sm.previous_stock,
        sm.current_stock,
        sm.created_at,
        p.id AS product_id,
        p.name AS product_name,
        p.sku AS product_sku,
        p.unit AS product_unit,
        st.id AS transaction_id,
        st.transaction_number,
        st.transaction_date,
        st.destination,
        u.id AS user_id,
        u.full_name AS created_by_name
      FROM stock_movements sm
      JOIN products p ON p.id = sm.product_id
      JOIN stock_transactions st ON st.id = sm.transaction_id
      JOIN users u ON u.id = sm.user_id
      ${whereClause}
      ORDER BY sm.created_at DESC
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
         sm.*,
         p.name AS product_name,
         p.sku AS product_sku,
         p.unit AS product_unit,
         st.transaction_number,
         st.transaction_date,
         st.destination,
         st.reason,
         st.notes,
         u.full_name AS created_by_name
       FROM stock_movements sm
       JOIN products p ON p.id = sm.product_id
       JOIN stock_transactions st ON st.id = sm.transaction_id
       JOIN users u ON u.id = sm.user_id
       WHERE sm.id = $1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Stock movement record not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
