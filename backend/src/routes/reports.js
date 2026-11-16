const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

function toCSV(headers, rows) {
  const escapeCell = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [headers.map(escapeCell).join(',')];
  for (const row of rows) {
    lines.push(row.map(escapeCell).join(','));
  }
  return lines.join('\r\n');
}

router.get('/inventory', auth, authorize('Admin', 'Manager'), async (req, res, next) => {
  try {
    const { q, category_id, stock_status } = req.query;
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

    if (stock_status === 'low_stock') {
      conditions.push(`p.current_stock <= p.minimum_stock AND p.current_stock > 0`);
    } else if (stock_status === 'out_of_stock') {
      conditions.push(`p.current_stock = 0`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        p.id,
        p.sku,
        p.name AS product_name,
        c.name AS category_name,
        p.current_stock,
        p.unit,
        p.minimum_stock,
        p.purchase_price,
        (p.current_stock * p.purchase_price)::numeric(15,2) AS inventory_value,
        CASE
          WHEN p.current_stock = 0 THEN 'out_of_stock'
          WHEN p.current_stock <= p.minimum_stock THEN 'low_stock'
          ELSE 'in_stock'
        END AS stock_status,
        p.status
      FROM products p
      JOIN categories c ON c.id = p.category_id
      ${whereClause}
      ORDER BY p.name ASC
    `;

    const { rows } = await pool.query(query, params);

    const totalsResult = await pool.query(`
      SELECT 
        COUNT(p.id)::int AS total_products,
        COALESCE(SUM(p.current_stock), 0)::int AS total_units,
        COALESCE(SUM(p.current_stock * p.purchase_price), 0)::numeric(15,2) AS total_valuation
      FROM products p
      ${whereClause}
    `, params);

    res.json({
      success: true,
      data: rows,
      summary: totalsResult.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

router.get('/stock-in', auth, authorize('Admin', 'Manager'), async (req, res, next) => {
  try {
    const { from_date, to_date, supplier_id, product_id, category_id, q } = req.query;
    const conditions = ["st.transaction_type = 'stock_in'"];
    const params = [];

    if (from_date) {
      params.push(from_date);
      conditions.push(`st.transaction_date >= $${params.length}`);
    }

    if (to_date) {
      params.push(to_date);
      conditions.push(`st.transaction_date <= $${params.length}`);
    }

    if (supplier_id) {
      params.push(supplier_id);
      conditions.push(`st.supplier_id = $${params.length}`);
    }

    if (product_id) {
      params.push(product_id);
      conditions.push(`sti.product_id = $${params.length}`);
    }

    if (category_id) {
      params.push(category_id);
      conditions.push(`p.category_id = $${params.length}`);
    }

    if (q) {
      params.push(`%${q}%`);
      conditions.push(`(st.transaction_number ILIKE $${params.length} OR p.name ILIKE $${params.length} OR s.name ILIKE $${params.length})`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const query = `
      SELECT 
        sti.id,
        st.transaction_number,
        st.transaction_date,
        s.name AS supplier_name,
        p.sku AS product_sku,
        p.name AS product_name,
        c.name AS category_name,
        sti.quantity,
        p.unit,
        sti.unit_price AS purchase_price,
        sti.subtotal,
        u.full_name AS created_by_name
      FROM stock_transaction_items sti
      JOIN stock_transactions st ON st.id = sti.transaction_id
      LEFT JOIN suppliers s ON s.id = st.supplier_id
      JOIN products p ON p.id = sti.product_id
      JOIN categories c ON c.id = p.category_id
      JOIN users u ON u.id = st.user_id
      ${whereClause}
      ORDER BY st.transaction_date DESC, sti.created_at DESC
    `;

    const { rows } = await pool.query(query, params);

    const totals = rows.reduce(
      (acc, r) => {
        acc.total_quantity += Number(r.quantity);
        acc.total_amount += Number(r.subtotal);
        return acc;
      },
      { total_quantity: 0, total_amount: 0 }
    );

    res.json({
      success: true,
      data: rows,
      summary: totals,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/stock-out', auth, authorize('Admin', 'Manager'), async (req, res, next) => {
  try {
    const { from_date, to_date, product_id, reason, q } = req.query;
    const conditions = ["st.transaction_type = 'stock_out'"];
    const params = [];

    if (from_date) {
      params.push(from_date);
      conditions.push(`st.transaction_date >= $${params.length}`);
    }

    if (to_date) {
      params.push(to_date);
      conditions.push(`st.transaction_date <= $${params.length}`);
    }

    if (product_id) {
      params.push(product_id);
      conditions.push(`sti.product_id = $${params.length}`);
    }

    if (reason) {
      params.push(reason);
      conditions.push(`st.reason = $${params.length}`);
    }

    if (q) {
      params.push(`%${q}%`);
      conditions.push(`(st.transaction_number ILIKE $${params.length} OR p.name ILIKE $${params.length} OR st.destination ILIKE $${params.length})`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const query = `
      SELECT 
        sti.id,
        st.transaction_number,
        st.transaction_date,
        st.destination,
        st.reason,
        p.sku AS product_sku,
        p.name AS product_name,
        p.unit,
        sti.quantity,
        u.full_name AS created_by_name
      FROM stock_transaction_items sti
      JOIN stock_transactions st ON st.id = sti.transaction_id
      JOIN products p ON p.id = sti.product_id
      JOIN users u ON u.id = st.user_id
      ${whereClause}
      ORDER BY st.transaction_date DESC, sti.created_at DESC
    `;

    const { rows } = await pool.query(query, params);

    const totals = rows.reduce(
      (acc, r) => {
        acc.total_quantity += Number(r.quantity);
        return acc;
      },
      { total_quantity: 0 }
    );

    res.json({
      success: true,
      data: rows,
      summary: totals,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/low-stock', auth, authorize('Admin', 'Manager'), async (req, res, next) => {
  try {
    const { q, category_id } = req.query;
    const conditions = ['p.status = $1', 'p.current_stock <= p.minimum_stock'];
    const params = ['active'];

    if (q) {
      params.push(`%${q}%`);
      conditions.push(`(p.sku ILIKE $${params.length} OR p.name ILIKE $${params.length})`);
    }

    if (category_id) {
      params.push(category_id);
      conditions.push(`p.category_id = $${params.length}`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const query = `
      SELECT 
        p.id,
        p.sku,
        p.name AS product_name,
        c.name AS category_name,
        p.current_stock,
        p.minimum_stock,
        p.unit,
        (p.minimum_stock - p.current_stock) AS deficit,
        CASE
          WHEN p.current_stock = 0 THEN 'out_of_stock'
          ELSE 'low_stock'
        END AS stock_status,
        p.purchase_price
      FROM products p
      JOIN categories c ON c.id = p.category_id
      ${whereClause}
      ORDER BY p.current_stock ASC
    `;

    const { rows } = await pool.query(query, params);

    res.json({
      success: true,
      data: rows,
      count: rows.length,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/export', auth, authorize('Admin', 'Manager'), async (req, res, next) => {
  try {
    const { type } = req.query;

    if (!type || !['inventory', 'stock-in', 'stock-out', 'low-stock'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid report export type' });
    }

    const timestamp = new Date().toISOString().slice(0, 10);

    if (type === 'inventory') {
      const { rows } = await pool.query(`
        SELECT 
          p.sku,
          p.name,
          c.name AS category,
          p.current_stock,
          p.unit,
          p.minimum_stock,
          p.purchase_price,
          (p.current_stock * p.purchase_price) AS valuation,
          CASE WHEN p.current_stock = 0 THEN 'Out of Stock' WHEN p.current_stock <= p.minimum_stock THEN 'Low Stock' ELSE 'In Stock' END AS status
        FROM products p
        JOIN categories c ON c.id = p.category_id
        ORDER BY p.name ASC
      `);

      const headers = ['SKU', 'Product Name', 'Category', 'Current Stock', 'Unit', 'Min Stock', 'Purchase Price', 'Inventory Value', 'Status'];
      const dataRows = rows.map(r => [
        r.sku,
        r.name,
        r.category,
        r.current_stock,
        r.unit,
        r.minimum_stock,
        r.purchase_price,
        r.valuation,
        r.status,
      ]);

      const csv = toCSV(headers, dataRows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="inventory-report-${timestamp}.csv"`);
      return res.send(csv);
    }

    if (type === 'stock-in') {
      const { rows } = await pool.query(`
        SELECT 
          st.transaction_number,
          st.transaction_date,
          s.name AS supplier,
          p.sku,
          p.name AS product,
          sti.quantity,
          sti.unit_price,
          sti.subtotal,
          u.full_name AS created_by
        FROM stock_transaction_items sti
        JOIN stock_transactions st ON st.id = sti.transaction_id
        LEFT JOIN suppliers s ON s.id = st.supplier_id
        JOIN products p ON p.id = sti.product_id
        JOIN users u ON u.id = st.user_id
        WHERE st.transaction_type = 'stock_in'
        ORDER BY st.transaction_date DESC
      `);

      const headers = ['Transaction Number', 'Date', 'Supplier', 'SKU', 'Product', 'Quantity', 'Unit Price', 'Subtotal', 'Created By'];
      const dataRows = rows.map(r => [
        r.transaction_number,
        r.transaction_date ? new Date(r.transaction_date).toISOString().slice(0, 10) : '',
        r.supplier || '-',
        r.sku,
        r.product,
        r.quantity,
        r.unit_price,
        r.subtotal,
        r.created_by,
      ]);

      const csv = toCSV(headers, dataRows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="stock-in-report-${timestamp}.csv"`);
      return res.send(csv);
    }

    if (type === 'stock-out') {
      const { rows } = await pool.query(`
        SELECT 
          st.transaction_number,
          st.transaction_date,
          st.destination,
          st.reason,
          p.sku,
          p.name AS product,
          sti.quantity,
          u.full_name AS created_by
        FROM stock_transaction_items sti
        JOIN stock_transactions st ON st.id = sti.transaction_id
        JOIN products p ON p.id = sti.product_id
        JOIN users u ON u.id = st.user_id
        WHERE st.transaction_type = 'stock_out'
        ORDER BY st.transaction_date DESC
      `);

      const headers = ['Transaction Number', 'Date', 'Destination', 'Reason', 'SKU', 'Product', 'Quantity', 'Created By'];
      const dataRows = rows.map(r => [
        r.transaction_number,
        r.transaction_date ? new Date(r.transaction_date).toISOString().slice(0, 10) : '',
        r.destination,
        r.reason,
        r.sku,
        r.product,
        r.quantity,
        r.created_by,
      ]);

      const csv = toCSV(headers, dataRows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="stock-out-report-${timestamp}.csv"`);
      return res.send(csv);
    }

    if (type === 'low-stock') {
      const { rows } = await pool.query(`
        SELECT 
          p.sku,
          p.name,
          c.name AS category,
          p.current_stock,
          p.minimum_stock,
          p.unit,
          p.purchase_price,
          (p.minimum_stock - p.current_stock) AS deficit
        FROM products p
        JOIN categories c ON c.id = p.category_id
        WHERE p.status = 'active' AND p.current_stock <= p.minimum_stock
        ORDER BY p.current_stock ASC
      `);

      const headers = ['SKU', 'Product Name', 'Category', 'Current Stock', 'Min Stock', 'Unit', 'Purchase Price', 'Deficit'];
      const dataRows = rows.map(r => [
        r.sku,
        r.name,
        r.category,
        r.current_stock,
        r.minimum_stock,
        r.unit,
        r.purchase_price,
        r.deficit,
      ]);

      const csv = toCSV(headers, dataRows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="low-stock-report-${timestamp}.csv"`);
      return res.send(csv);
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
