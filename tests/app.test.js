const request = require('supertest');
const app = require('../src/app');

describe('API Health Check', () => {
  it('should return status ok for health endpoint', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('message');
  });
});
