const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');
const pool = require('../config/db');

jest.mock('../config/db', () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));

describe('Products API Unit Tests', () => {
  let adminToken;
  let staffToken;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test_secret_key_12345';
    adminToken = jwt.sign(
      { id: '11111111-1111-1111-1111-111111111111', email: 'admin@stockify.com', role: 'Admin' },
      process.env.JWT_SECRET
    );
    staffToken = jwt.sign(
      { id: '22222222-2222-2222-2222-222222222222', email: 'staff@stockify.com', role: 'Warehouse Staff' },
      process.env.JWT_SECRET
    );
  });

  describe('POST /api/v1/products', () => {
    it('rejects creation from non-admin with 403', async () => {
      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          name: 'Staff Laptop',
          sku: 'LAP-001',
          category_id: '33333333-3333-3333-3333-333333333333',
          unit: 'unit',
          purchase_price: 5000000,
          selling_price: 6000000,
          minimum_stock: 5,
        });

      expect(res.statusCode).toBe(403);
    });

    it('rejects negative prices and invalid payload', async () => {
      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '',
          sku: '',
          category_id: 'not-a-uuid',
          unit: '',
          purchase_price: -500,
          selling_price: -100,
          minimum_stock: -5,
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('rejects duplicate SKU', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 'existing-id' }] }); // sku check

      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Duplicate Laptop',
          sku: 'ELEC-001',
          category_id: '33333333-3333-3333-3333-333333333333',
          unit: 'unit',
          purchase_price: 5000000,
          selling_price: 6000000,
          minimum_stock: 5,
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/sku already exists/i);
    });

    it('successfully creates product with initial stock 0', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] }) // sku unique check passes
        .mockResolvedValueOnce({ rows: [{ id: '33333333-3333-3333-3333-333333333333', name: 'Electronics' }] }) // category check
        .mockResolvedValueOnce({
          rows: [
            {
              id: '44444444-4444-4444-4444-444444444444',
              sku: 'NEW-001',
              name: 'New Product',
              category_id: '33333333-3333-3333-3333-333333333333',
              current_stock: 0,
              minimum_stock: 5,
              purchase_price: '5000000.00',
              selling_price: '6000000.00',
              status: 'active',
            },
          ],
        });

      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New Product',
          sku: 'NEW-001',
          category_id: '33333333-3333-3333-3333-333333333333',
          unit: 'unit',
          purchase_price: 5000000,
          selling_price: 6000000,
          minimum_stock: 5,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.current_stock).toBe(0);
    });
  });

  describe('GET /api/v1/products', () => {
    it('returns paginated list of products for authenticated user', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: '44444444-4444-4444-4444-444444444444',
              sku: 'ELEC-001',
              name: 'ASUS Laptop',
              category_name: 'Electronics',
              current_stock: 5,
              stock_status: 'in_stock',
            },
          ],
        });

      const res = await request(app)
        .get('/api/v1/products?page=1&limit=10')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.pagination.total).toBe(1);
    });
  });
});
