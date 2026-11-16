const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.get('/', auth, async (req, res, next) => {
  try {
    const { q } = req.query;
    let query = `
      SELECT 
        c.id, 
        c.name, 
        c.description, 
        c.created_at, 
        c.updated_at,
        COUNT(p.id)::int AS total_products
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
    `;
    const params = [];

    if (q) {
      params.push(`%${q}%`);
      query += ` WHERE c.name ILIKE $${params.length} OR c.description ILIKE $${params.length}`;
    }

    query += ` GROUP BY c.id, c.name, c.description, c.created_at, c.updated_at ORDER BY c.name ASC`;

    const { rows } = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  auth,
  authorize('Admin'),
  [
    body('name').trim().notEmpty().withMessage('Category name is required'),
    body('description').optional().trim(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { name, description } = req.body;

      const existing = await pool.query('SELECT id FROM categories WHERE LOWER(name) = LOWER($1)', [name]);
      if (existing.rows.length > 0) {
        return res.status(400).json({ success: false, message: 'Category name already exists' });
      }

      const { rows } = await pool.query(
        `INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *`,
        [name, description || null]
      );

      res.status(201).json({ success: true, data: rows[0], message: 'Category created' });
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
    body('name').trim().notEmpty().withMessage('Category name is required'),
    body('description').optional().trim(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const { name, description } = req.body;

      const duplicate = await pool.query(
        'SELECT id FROM categories WHERE LOWER(name) = LOWER($1) AND id != $2',
        [name, id]
      );
      if (duplicate.rows.length > 0) {
        return res.status(400).json({ success: false, message: 'Category name already exists' });
      }

      const { rows } = await pool.query(
        `UPDATE categories 
         SET name = $1, description = $2, updated_at = NOW() 
         WHERE id = $3 
         RETURNING *`,
        [name, description || null, id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }

      res.json({ success: true, data: rows[0], message: 'Category updated' });
    } catch (err) {
      next(err);
    }
  }
);

router.delete('/:id', auth, authorize('Admin'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const productsInCat = await pool.query('SELECT id FROM products WHERE category_id = $1 LIMIT 1', [id]);
    if (productsInCat.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category that is currently used by products',
      });
    }

    const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
