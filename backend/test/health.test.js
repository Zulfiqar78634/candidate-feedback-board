import assert from 'node:assert/strict';
import { test } from 'node:test';
import request from 'supertest';
import app from '../src/app.js';

test('returns 404 for unknown routes', async () => {
  const response = await request(app).get('/unknown');

  assert.equal(response.status, 404);
  assert.equal(response.body.error, 'Not found');
});

test('rejects invalid candidate payload', async () => {
  const response = await request(app)
    .post('/api/candidates')
    .send({ name: '', email: 'not-an-email', role: '' });

  assert.equal(response.status, 400);
  assert.equal(response.body.error, 'Validation failed');
});
