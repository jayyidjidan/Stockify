const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { email, password } = req.body;
      const { rows } = await pool.query(
        `SELECT u.id, u.email, u.password_hash, u.status, u.full_name, r.name AS role
         FROM users u
         JOIN roles r ON r.id = u.role_id
         WHERE u.email = $1`,
        [email]
      );

      if (!rows.length) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      const user = rows[0];

      if (user.status !== 'active') {
        return res.status(403).json({ success: false, message: 'Account is inactive' });
      }

      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
      );

      res.json({
        success: true,
        data: { token, user: { id: user.id, email: user.email, role: user.role, full_name: user.full_name } },
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out' });
});

router.get('/me', auth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.status, u.last_login_at, u.created_at, r.name AS role
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.id = $1`,
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
