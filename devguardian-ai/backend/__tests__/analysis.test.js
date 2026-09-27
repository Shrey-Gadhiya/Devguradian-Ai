const request = require('supertest');
const path = require('path');
const app = require('../src/index');

const DEMO_PATH = path.resolve(__dirname, '../../demo-repo');

describe('Analysis API Integration', () => {
  let sessionId;

  test('POST /api/analysis/start returns sessionId', async () => {
    const res = await request(app)
      .post('/api/analysis/start')
      .send({ repoPath: DEMO_PATH });
    expect(res.status).toBe(200);
    expect(res.body.sessionId).toBeTruthy();
    expect(res.body.status).toBe('started');
    sessionId = res.body.sessionId;
  });

  test('GET /api/analysis/status returns running or complete', async () => {
    const res = await request(app).get(`/api/analysis/status/${sessionId}`);
    expect(res.status).toBe(200);
    expect(['running', 'complete', 'error']).toContain(res.body.status);
  });

  test('GET /api/analysis/status for unknown session returns 404', async () => {
    const res = await request(app).get('/api/analysis/status/nonexistent-id');
    expect(res.status).toBe(404);
  });

  test('GET /api/analysis/results waits for completion', async () => {
    // Wait up to 30 seconds for analysis to complete
    let results;
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 1000));
      const res = await request(app).get(`/api/analysis/results/${sessionId}`);
      if (res.status === 200) { results = res.body; break; }
    }
    expect(results).toBeTruthy();
    expect(results.findings).toBeDefined();
    expect(results.summary).toBeDefined();
    expect(results.summary.total).toBeGreaterThan(0);
  }, 35000);

  test('GET /api/repository/demo returns demo repo info', async () => {
    const res = await request(app).get('/api/repository/demo');
    expect(res.status).toBe(200);
    expect(res.body.repoId).toBe('demo');
  });

  test('GET /api/agents returns agent list', async () => {
    const res = await request(app).get('/api/agents');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(6);
  });

  test('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
