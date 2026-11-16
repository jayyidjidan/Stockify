const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = require('../app');
const pool = require('../config/db');

jest.mock('../config/db', () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));

describe('Auth API Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test_secret_key_12345';
  });

  describe('POST /api/v1/auth/login', () => {
    it('returns 400 if email or password missing', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({});
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 401 if user does not exist', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'unknown@stockify.com', password: 'password123' });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid email or password/i);
    });

    it('returns 403 if account is inactive', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [
          {
            id: '11111111-1111-1111-1111-111111111111',
            email: 'inactive@stockify.com',
            password_hash: '$2a$12$dummyhash',
            status: 'inactive',
            full_name: 'Inactive User',
            role: 'Warehouse Staff',
          },
        ],
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'inactive@stockify.com', password: 'password123' });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toMatch(/account is inactive/i);
    });

    it('returns 401 if password does not match', async () => {
      const hash = await bcrypt.hash('correct_password', 10);
      pool.query.mockResolvedValueOnce({
        rows: [
          {
            id: '11111111-1111-1111-1111-111111111111',
            email: 'active@stockify.com',
            password_hash: hash,
            status: 'active',
            full_name: 'Active User',
            role: 'Admin',
          },
        ],
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'active@stockify.com', password: 'wrong_password' });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toMatch(/invalid email or password/i);
    });

    it('returns 200 with jwt token and user data on valid credentials', async () => {
      const hash = await bcrypt.hash('valid_password', 10);
      pool.query
        .mockResolvedValueOnce({
          rows: [
            {
              id: '11111111-1111-1111-1111-111111111111',
              email: 'admin@stockify.com',
              password_hash: hash,
              status: 'active',
              full_name: 'Admin Stockify',
              role: 'Admin',
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] }); // Update last_login_at

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@stockify.com', password: 'valid_password' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe('admin@stockify.com');
      expect(res.body.data.user.role).toBe('Admin');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('returns 401 if authorization header is missing', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.statusCode).toBe(401);
    });

    it('returns 200 with user profile when valid token provided', async () => {
      const token = jwt.sign(
        {
          id: '11111111-1111-1111-1111-111111111111',
          email: 'admin@stockify.com',
          role: 'Admin',
          full_name: 'Admin Stockify',
        },
        process.env.JWT_SECRET
      );

      pool.query.mockResolvedValueOnce({
        rows: [
          {
            id: '11111111-1111-1111-1111-111111111111',
            email: 'admin@stockify.com',
            full_name: 'Admin Stockify',
            status: 'active',
            role: 'Admin',
            created_at: new Date().toISOString(),
          },
        ],
      });

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.email).toBe('admin@stockify.com');
      expect(res.body.data.role).toBe('Admin');
    });
  });
});
