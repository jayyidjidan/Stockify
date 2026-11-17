const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');
const pool = require('../config/db');

jest.mock('../config/db', () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));

describe('Stock Operations Unit Tests', () => {
  let staffToken;
  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test_secret_key_12345';
    staffToken = jwt.sign(
      {
        id: '650e8400-e29b-41d4-a716-446655440000',
        email: 'staff@stockify.com',
        role: 'Warehouse Staff',
      },
      process.env.JWT_SECRET
    );

    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    pool.connect.mockResolvedValue(mockClient);
  });

  describe('POST /api/v1/stock-in', () => {
    it('rejects transaction when supplier is inactive', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: '550e8400-e29b-41d4-a716-446655440000', status: 'inactive' }] }) // supplier check
        .mockResolvedValueOnce({ rows: [] }); // ROLLBACK

      const res = await request(app)
        .post('/api/v1/stock-in')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          supplier_id: '550e8400-e29b-41d4-a716-446655440000',
          transaction_date: '2026-11-16',
          items: [{ product_id: '650e8400-e29b-41d4-a716-446655440000', quantity: 10, unit_price: 50000 }],
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/supplier is inactive/i);
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('rejects transaction when quantity is zero or negative', async () => {
      const res = await request(app)
        .post('/api/v1/stock-in')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          supplier_id: '550e8400-e29b-41d4-a716-446655440000',
          transaction_date: '2026-11-16',
          items: [{ product_id: '650e8400-e29b-41d4-a716-446655440000', quantity: 0, unit_price: 50000 }],
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('successfully processes stock in, increases stock, and records movement', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: '550e8400-e29b-41d4-a716-446655440000', status: 'active' }] }) // supplier check
        .mockResolvedValueOnce({ rows: [{ id: '650e8400-e29b-41d4-a716-446655440000', name: 'Product 1', status: 'active' }] }) // product active check
        .mockResolvedValueOnce({ rows: [] }) // generate transaction number search
        .mockResolvedValueOnce({ rows: [{ id: 'tx-1', transaction_number: 'SI-20261116-0001' }] }) // insert header
        .mockResolvedValueOnce({ rows: [{ id: 'item-1', quantity: 10, subtotal: 500000 }] }) // insert item
        .mockResolvedValueOnce({ rows: [{ current_stock: 5 }] }) // get prev stock FOR UPDATE
        .mockResolvedValueOnce({ rows: [] }) // update product current_stock to 15
        .mockResolvedValueOnce({ rows: [] }) // insert movement
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      const res = await request(app)
        .post('/api/v1/stock-in')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          supplier_id: '550e8400-e29b-41d4-a716-446655440000',
          transaction_date: '2026-11-16',
          items: [{ product_id: '650e8400-e29b-41d4-a716-446655440000', quantity: 10, unit_price: 50000 }],
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });
  });

  describe('POST /api/v1/stock-out', () => {
    it('rejects stock out when quantity exceeds available stock', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({
          rows: [
            {
              id: '650e8400-e29b-41d4-a716-446655440000',
              name: 'Laptop ASUS',
              sku: 'ELEC-001',
              current_stock: 5,
              status: 'active',
            },
          ],
        }) // check stock FOR UPDATE
        .mockResolvedValueOnce({ rows: [] }); // ROLLBACK

      const res = await request(app)
        .post('/api/v1/stock-out')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          destination: 'Customer Budi',
          transaction_date: '2026-11-16',
          reason: 'Customer Delivery',
          items: [{ product_id: '650e8400-e29b-41d4-a716-446655440000', quantity: 10 }], // requested 10, only 5 available!
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/insufficient stock/i);
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('successfully processes stock out when stock is sufficient', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({
          rows: [{ id: '650e8400-e29b-41d4-a716-446655440000', name: 'Laptop ASUS', sku: 'ELEC-001', current_stock: 10, status: 'active' }],
        }) // validation check
        .mockResolvedValueOnce({ rows: [] }) // generate transaction number search
        .mockResolvedValueOnce({ rows: [{ id: '750e8400-e29b-41d4-a716-446655440000', transaction_number: 'SO-20261116-0001' }] }) // insert header
        .mockResolvedValueOnce({ rows: [{ current_stock: 10, selling_price: 100000 }] }) // select for deduction
        .mockResolvedValueOnce({ rows: [{ id: '850e8400-e29b-41d4-a716-446655440000', quantity: 4 }] }) // insert item
        .mockResolvedValueOnce({ rows: [] }) // update product stock to 6
        .mockResolvedValueOnce({ rows: [] }) // insert movement
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      const res = await request(app)
        .post('/api/v1/stock-out')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          destination: 'Customer Budi',
          transaction_date: '2026-11-16',
          reason: 'Customer Delivery',
          items: [{ product_id: '650e8400-e29b-41d4-a716-446655440000', quantity: 4 }],
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });
  });
});
