const request = require('supertest');
const app = require('../app');

describe('Health API', () => {
  it('GET /api/v1/health should return status ok', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('stockify-backend');
    expect(res.body.timestamp).toBeDefined();
  });
});
