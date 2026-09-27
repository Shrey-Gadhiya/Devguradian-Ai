const request = require('supertest');
const path = require('path');
const app = require('../src/index');

describe('DevGuardian API', () => {
  test('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('GET /api/agents returns agent list', async () => {
    const res = await request(app).get('/api/agents');
    expect(res.status).toBe(200);
    expect(res.body.agents).toHaveLength(6);
    expect(res.body.agents[0]).toHaveProperty('name');
  });

  test('GET /api/repository/demo returns demo repo info', async () => {
    const res = await request(app).get('/api/repository/demo');
    expect(res.status).toBe(200);
    expect(res.body.repoId).toBe('demo');
    expect(res.body.files).toBeGreaterThan(0);
  });

  test('POST /api/analysis/start with invalid repoId returns 404', async () => {
    const res = await request(app)
      .post('/api/analysis/start')
      .send({ repoId: 'nonexistent' });
    expect(res.status).toBe(404);
  });

  test('POST /api/analysis/start with demo repo starts session', async () => {
    // First load demo repo
    await request(app).get('/api/repository/demo');
    const res = await request(app)
      .post('/api/analysis/start')
      .send({ repoId: 'demo' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('sessionId');
    expect(['initializing', 'scanning']).toContain(res.body.status);
  }, 10000);

  test('GET /api/analysis/:sessionId/status returns session', async () => {
    await request(app).get('/api/repository/demo');
    const startRes = await request(app)
      .post('/api/analysis/start')
      .send({ repoId: 'demo' });
    const { sessionId } = startRes.body;

    const statusRes = await request(app).get(`/api/analysis/${sessionId}/status`);
    expect(statusRes.status).toBe(200);
    expect(statusRes.body.sessionId).toBe(sessionId);
  }, 10000);
});
