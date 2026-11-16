const express = require('express');
const pool = require('../config/db');

const router = express.Router();

router.get('/summary', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'active') AS "totalProducts",
        COALESCE(SUM(current_stock) FILTER (WHERE status = 'active'), 0) AS "totalStock",
        COUNT(*) FILTER (WHERE status = 'active' AND current_stock <= minimum_stock AND current_stock > 0) AS "lowStock",
        COUNT(*) FILTER (WHERE status = 'active' AND current_stock = 0) AS "outOfStock"
      FROM products
    `);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
});

router.get('/stock-chart', async (req, res, next) => {
  try {
    const { days, from, to } = req.query;
    let fromDate, toDate;

    if (from && to) {
      fromDate = from;
      toDate = to;
    } else {
      const d = parseInt(days) || 7;
      toDate = new Date().toISOString().slice(0, 10);
      fromDate = new Date(Date.now() - (d - 1) * 86400000).toISOString().slice(0, 10);
    }

    const { rows } = await pool.query(
      `SELECT
         sm.created_at::date AS date,
         SUM(sm.quantity_in) AS stock_in,
         SUM(sm.quantity_out) AS stock_out
       FROM stock_movements sm
       WHERE sm.created_at::date BETWEEN $1 AND $2
       GROUP BY sm.created_at::date
       ORDER BY sm.created_at::date`,
      [fromDate, toDate]
    );

    // Build a full date series with zeros for missing days
    const dateMap = Object.fromEntries(rows.map(r => [r.date.toISOString().slice(0, 10), r]));
    const labels = [];
    const stockIn = [];
    const stockOut = [];
    const start = new Date(fromDate);
    const end = new Date(toDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      labels.push(key);
      stockIn.push(Number(dateMap[key]?.stock_in || 0));
      stockOut.push(Number(dateMap[key]?.stock_out || 0));
    }

    res.json({ success: true, data: { labels, stockIn, stockOut } });
  } catch (err) {
    next(err);
  }
});

router.get('/category-distribution', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.name AS category, COALESCE(SUM(p.current_stock), 0) AS total_stock, COUNT(p.id) AS product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.status = 'active'
      GROUP BY c.id, c.name
      ORDER BY total_stock DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

router.get('/recent-activities', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      (
        SELECT
          'stock_in' AS type,
          st.transaction_number AS reference,
          'Stock in created' AS description,
          st.created_at,
          u.full_name AS actor
        FROM stock_transactions st
        JOIN users u ON u.id = st.user_id
        WHERE st.transaction_type = 'stock_in'
      )
      UNION ALL
      (
        SELECT
          'stock_out' AS type,
          st.transaction_number AS reference,
          'Stock out created' AS description,
          st.created_at,
          u.full_name AS actor
        FROM stock_transactions st
        JOIN users u ON u.id = st.user_id
        WHERE st.transaction_type = 'stock_out'
      )
      UNION ALL
      (
        SELECT
          'product_created' AS type,
          p.sku AS reference,
          'Product created: ' || p.name AS description,
          p.created_at,
          NULL AS actor
        FROM products p
      )
      UNION ALL
      (
        SELECT
          'product_updated' AS type,
          p.sku AS reference,
          'Product updated: ' || p.name AS description,
          p.updated_at,
          NULL AS actor
        FROM products p
        WHERE p.updated_at > p.created_at
      )
      ORDER BY created_at DESC
      LIMIT 20
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

router.get('/low-stock', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT p.id, p.sku, p.name, p.current_stock, p.minimum_stock, p.unit, p.status, c.name AS category
      FROM products p
      JOIN categories c ON c.id = p.category_id
      WHERE p.status = 'active' AND p.current_stock <= p.minimum_stock
      ORDER BY p.current_stock ASC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
