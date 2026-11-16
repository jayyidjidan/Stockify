const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { generateTransactionNumber } = require('../helpers/generateTransactionNumber');

const router = express.Router();

router.get('/', auth, async (req, res, next) => {
  try {
    const { q, reason, from_date, to_date, page = 1, limit = 10 } = req.query;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const conditions = ["st.transaction_type = 'stock_out'"];
    const params = [];

    if (q) {
      params.push(`%${q}%`);
      conditions.push(`(st.transaction_number ILIKE $${params.length} OR st.destination ILIKE $${params.length})`);
    }

    if (reason) {
      params.push(reason);
      conditions.push(`st.reason = $${params.length}`);
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

    const countResult = await pool.query(`SELECT COUNT(*) FROM stock_transactions st ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    params.push(take, offset);
    const query = `
      SELECT 
        st.id,
        st.transaction_number,
        st.transaction_date,
        st.destination,
        st.reason,
        st.notes,
        st.status,
        st.created_at,
        u.id AS user_id,
        u.full_name AS created_by_name,
        COUNT(sti.id)::int AS total_items,
        COALESCE(SUM(sti.quantity), 0)::int AS total_quantity
      FROM stock_transactions st
      JOIN users u ON u.id = st.user_id
      LEFT JOIN stock_transaction_items sti ON sti.transaction_id = st.id
      ${whereClause}
      GROUP BY st.id, u.id, u.full_name
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
         u.full_name AS created_by_name
       FROM stock_transactions st
       JOIN users u ON u.id = st.user_id
       WHERE st.id = $1 AND st.transaction_type = 'stock_out'`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Stock Out transaction not found' });
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
    body('destination').trim().notEmpty().withMessage('Destination is required'),
    body('transaction_date').isISO8601().withMessage('Valid transaction date is required'),
    body('reason')
      .isIn(['Internal Usage', 'Customer Delivery', 'Damaged Goods', 'Other'])
      .withMessage('Valid reason option is required'),
    body('notes').optional().trim(),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required in the transaction'),
    body('items.*.product_id').isUUID().withMessage('Valid product ID is required for each item'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be greater than zero'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const { destination, transaction_date, reason, notes, items } = req.body;

      for (const item of items) {
        const prodCheck = await client.query(
          `SELECT id, name, sku, current_stock, status 
           FROM products 
           WHERE id = $1 
           FOR UPDATE`,
          [item.product_id]
        );

        if (prodCheck.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({ success: false, message: `Product ${item.product_id} not found` });
        }

        const product = prodCheck.rows[0];

        if (product.status !== 'active') {
          await client.query('ROLLBACK');
          return res.status(400).json({
            success: false,
            message: `Product "${product.name}" is inactive and cannot be selected`,
          });
        }

        if (product.current_stock < Number(item.quantity)) {
          await client.query('ROLLBACK');
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for product "${product.name}" (${product.sku}). Available: ${product.current_stock}, Requested: ${item.quantity}`,
          });
        }
      }

      const transactionNumber = await generateTransactionNumber('stock_out', client);

      const headerResult = await client.query(
        `INSERT INTO stock_transactions 
         (user_id, transaction_number, transaction_type, destination, reason, transaction_date, notes, status)
         VALUES ($1, $2, 'stock_out', $3, $4, $5, $6, 'completed')
         RETURNING *`,
        [req.user.id, transactionNumber, destination, reason, transaction_date, notes || null]
      );
      const transaction = headerResult.rows[0];

      const insertedItems = [];
      for (const item of items) {
        const prodResult = await client.query(
          `SELECT current_stock, selling_price FROM products WHERE id = $1 FOR UPDATE`,
          [item.product_id]
        );
        const prevStock = prodResult.rows[0].current_stock;
        const unitPrice = prodResult.rows[0].selling_price || 0;
        const subtotal = Number(item.quantity) * Number(unitPrice);
        const newStock = prevStock - Number(item.quantity);

        const itemResult = await client.query(
          `INSERT INTO stock_transaction_items 
           (transaction_id, product_id, quantity, unit_price, subtotal)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [transaction.id, item.product_id, item.quantity, unitPrice, subtotal]
        );
        insertedItems.push(itemResult.rows[0]);

        await client.query(
          `UPDATE products 
           SET current_stock = $1, updated_at = NOW() 
           WHERE id = $2`,
          [newStock, item.product_id]
        );

        await client.query(
          `INSERT INTO stock_movements 
           (product_id, transaction_id, user_id, movement_type, quantity_in, quantity_out, previous_stock, current_stock)
           VALUES ($1, $2, $3, 'stock_out', 0, $4, $5, $6)`,
          [item.product_id, transaction.id, req.user.id, item.quantity, prevStock, newStock]
        );
      }

      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        message: 'Stock Out transaction recorded successfully',
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
