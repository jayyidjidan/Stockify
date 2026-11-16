const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');
const pool = require('../config/db');

jest.mock('../config/db', () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));

describe('Reports API Unit Tests', () => {
  let managerToken;
  let staffToken;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test_secret_key_12345';
    managerToken = jwt.sign(
      { id: '11111111-1111-1111-1111-111111111111', email: 'manager@stockify.com', role: 'Manager' },
      process.env.JWT_SECRET
    );
    staffToken = jwt.sign(
      { id: '22222222-2222-2222-2222-222222222222', email: 'staff@stockify.com', role: 'Warehouse Staff' },
      process.env.JWT_SECRET
    );
  });

  it('rejects staff from accessing reports with 403', async () => {
    const res = await request(app)
      .get('/api/v1/reports/inventory')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.statusCode).toBe(403);
  });

  it('allows Manager to access inventory report with summary valuation', async () => {
    pool.query
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'prod-1',
            sku: 'ELEC-001',
            product_name: 'Laptop ASUS',
            category_name: 'Electronics',
            current_stock: 5,
            unit: 'unit',
            minimum_stock: 3,
            purchase_price: '7000000.00',
            inventory_value: '35000000.00',
            stock_status: 'in_stock',
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [{ total_products: 1, total_units: 5, total_valuation: '35000000.00' }],
      });

    const res = await request(app)
      .get('/api/v1/reports/inventory')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.summary.total_valuation).toBe('35000000.00');
  });

  it('exports CSV with correct content-type header', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          sku: 'ELEC-001',
          name: 'Laptop ASUS',
          category: 'Electronics',
          current_stock: 5,
          unit: 'unit',
          minimum_stock: 3,
          purchase_price: '7000000.00',
          valuation: '35000000.00',
          status: 'In Stock',
        },
      ],
    });

    const res = await request(app)
      .get('/api/v1/reports/export?type=inventory')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.headers['content-disposition']).toMatch(/attachment; filename="inventory-report/);
    expect(res.text).toContain('SKU,Product Name,Category');
    expect(res.text).toContain('ELEC-001,Laptop ASUS,Electronics');
  });
});
