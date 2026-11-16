const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.get('/roles', auth, async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT id, name, description FROM roles ORDER BY name ASC');
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

router.patch(
  '/profile',
  auth,
  [
    body('full_name').optional().trim().notEmpty().withMessage('Full name cannot be empty'),
    body('email').optional().isEmail().normalizeEmail().withMessage('Valid email format is required'),
    body('current_password').optional().notEmpty().withMessage('Current password is required to change password'),
    body('new_password').optional().isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { full_name, email, current_password, new_password } = req.body;

      const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
      if (userRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      const user = userRes.rows[0];

      if (email && email !== user.email) {
        const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, req.user.id]);
        if (emailCheck.rows.length > 0) {
          return res.status(400).json({ success: false, message: 'Email is already in use by another account' });
        }
      }

      let newPasswordHash = user.password_hash;
      if (new_password) {
        if (!current_password) {
          return res.status(400).json({ success: false, message: 'Current password is required to set a new password' });
        }
        const match = await bcrypt.compare(current_password, user.password_hash);
        if (!match) {
          return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }
        newPasswordHash = await bcrypt.hash(new_password, 12);
      }

      const { rows } = await pool.query(
        `UPDATE users
         SET full_name = COALESCE($1, full_name),
             email = COALESCE($2, email),
             password_hash = $3,
             updated_at = NOW()
         WHERE id = $4
         RETURNING id, full_name, email, status, updated_at`,
        [full_name, email, newPasswordHash, req.user.id]
      );

      res.json({ success: true, data: rows[0], message: 'Profile updated successfully' });
    } catch (err) {
      next(err);
    }
  }
);

router.get('/', auth, authorize('Admin'), async (req, res, next) => {
  try {
    const { q, role_id, status, page = 1, limit = 10 } = req.query;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const conditions = [];
    const params = [];

    if (q) {
      params.push(`%${q}%`);
      conditions.push(`(u.full_name ILIKE $${params.length} OR u.email ILIKE $${params.length})`);
    }

    if (role_id) {
      params.push(role_id);
      conditions.push(`u.role_id = $${params.length}`);
    }

    if (status) {
      params.push(status);
      conditions.push(`u.status = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await pool.query(`SELECT COUNT(*) FROM users u ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    params.push(take, offset);
    const query = `
      SELECT 
        u.id,
        u.full_name,
        u.email,
        u.status,
        u.last_login_at,
        u.created_at,
        u.updated_at,
        r.id AS role_id,
        r.name AS role_name
      FROM users u
      JOIN roles r ON r.id = u.role_id
      ${whereClause}
      ORDER BY u.created_at DESC
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

router.get('/:id', auth, authorize('Admin'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      `SELECT 
         u.id,
         u.full_name,
         u.email,
         u.status,
         u.last_login_at,
         u.created_at,
         u.updated_at,
         r.id AS role_id,
         r.name AS role_name
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.id = $1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  auth,
  authorize('Admin'),
  [
    body('full_name').trim().notEmpty().withMessage('Full name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email format is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role_id').isUUID().withMessage('Valid role ID is required'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { full_name, email, password, role_id, status = 'active' } = req.body;

      const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        return res.status(400).json({ success: false, message: 'Email is already registered' });
      }

      const roleCheck = await pool.query('SELECT id FROM roles WHERE id = $1', [role_id]);
      if (roleCheck.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'Role not found' });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const { rows } = await pool.query(
        `INSERT INTO users (full_name, email, password_hash, role_id, status)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, full_name, email, role_id, status, created_at`,
        [full_name, email, passwordHash, role_id, status]
      );

      res.status(201).json({ success: true, data: rows[0], message: 'User created successfully' });
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
    body('full_name').trim().notEmpty().withMessage('Full name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email format is required'),
    body('role_id').isUUID().withMessage('Valid role ID is required'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const { full_name, email, role_id, status } = req.body;

      const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, id]);
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ success: false, message: 'Email is already in use by another account' });
      }

      const roleCheck = await pool.query('SELECT id, name FROM roles WHERE id = $1', [role_id]);
      if (roleCheck.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'Role not found' });
      }

      const currentUserRole = await pool.query(
        `SELECT r.name FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = $1`,
        [id]
      );

      if (currentUserRole.rows.length > 0 && currentUserRole.rows[0].name === 'Admin' && roleCheck.rows[0].name !== 'Admin') {
        const adminCount = await pool.query(
          `SELECT COUNT(u.id)::int FROM users u JOIN roles r ON r.id = u.role_id WHERE r.name = 'Admin' AND u.status = 'active'`
        );
        if (adminCount.rows[0].count <= 1) {
          return res.status(400).json({
            success: false,
            message: 'Cannot demote the last active Admin account',
          });
        }
      }

      const { rows } = await pool.query(
        `UPDATE users
         SET full_name = $1, email = $2, role_id = $3, status = COALESCE($4, status), updated_at = NOW()
         WHERE id = $5
         RETURNING id, full_name, email, role_id, status, updated_at`,
        [full_name, email, role_id, status || null, id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      res.json({ success: true, data: rows[0], message: 'User updated successfully' });
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

    if (status === 'inactive') {
      const userRes = await pool.query(
        `SELECT r.name FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = $1`,
        [id]
      );

      if (userRes.rows.length > 0 && userRes.rows[0].name === 'Admin') {
        const adminCount = await pool.query(
          `SELECT COUNT(u.id)::int FROM users u JOIN roles r ON r.id = u.role_id WHERE r.name = 'Admin' AND u.status = 'active'`
        );
        if (adminCount.rows[0].count <= 1) {
          return res.status(400).json({
            success: false,
            message: 'Admin cannot deactivate the last active Admin account',
          });
        }
      }
    }

    const { rows } = await pool.query(
      `UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, full_name, email, status`,
      [status, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: rows[0], message: `User status changed to ${status}` });
  } catch (err) {
    next(err);
  }
});

router.patch(
  '/:id/reset-password',
  auth,
  authorize('Admin'),
  [body('new_password').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const { new_password } = req.body;

      const passwordHash = await bcrypt.hash(new_password, 12);

      const { rows } = await pool.query(
        `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 RETURNING id, full_name, email`,
        [passwordHash, id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      res.json({ success: true, message: 'Password reset successfully' });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
