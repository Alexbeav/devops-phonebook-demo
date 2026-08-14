import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../app.js';

const contact = { id: 1, name: 'Ada', phone: '555-0100', email: 'ada@example.com' };

function fakePool(impl) {
    const calls = [];
    return {
        calls,
        query: async (text, params) => {
            calls.push({ text, params });
            return impl(text, params);
        },
    };
}

test('GET /api/contacts returns rows', async () => {
    const pool = fakePool(async () => ({ rows: [contact], rowCount: 1 }));
    const res = await request(createApp(pool)).get('/api/contacts');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, [contact]);
});

test('GET /api/config reports deployment mode', async () => {
    const pool = fakePool(async () => ({ rows: [], rowCount: 0 }));
    const res = await request(createApp(pool, { readOnly: true })).get('/api/config');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { readOnly: true });
    assert.equal(pool.calls.length, 0);
});

test('contact API has an application-layer request ceiling', async () => {
    const pool = fakePool(async () => ({ rows: [contact], rowCount: 1 }));
    const app = createApp(pool, { contactRateLimit: 2 });
    assert.equal((await request(app).get('/api/contacts')).status, 200);
    assert.equal((await request(app).get('/api/contacts')).status, 200);
    assert.equal((await request(app).get('/api/contacts')).status, 429);
    assert.equal(pool.calls.length, 2);
});

test('GET /api/contacts/:id returns 404 when missing', async () => {
    const pool = fakePool(async () => ({ rows: [], rowCount: 0 }));
    const res = await request(createApp(pool)).get('/api/contacts/99');
    assert.equal(res.status, 404);
});

test('POST /api/contacts creates a contact', async () => {
    const pool = fakePool(async () => ({ rows: [contact], rowCount: 1 }));
    const res = await request(createApp(pool))
        .post('/api/contacts')
        .send({ name: 'Ada', phone: '555-0100', email: 'ada@example.com' });
    assert.equal(res.status, 201);
    assert.deepEqual(res.body, contact);
});

test('read-only mode rejects every contact mutation before touching the DB', async () => {
    const pool = fakePool(async () => ({ rows: [contact], rowCount: 1 }));
    const app = createApp(pool, { readOnly: true });

    for (const [method, path] of [
        ['post', '/api/contacts'],
        ['put', '/api/contacts/1'],
        ['patch', '/api/contacts/1'],
        ['delete', '/api/contacts/1'],
    ]) {
        const res = await request(app)[method](path).send(contact);
        assert.equal(res.status, 405);
        assert.equal(res.headers.allow, 'GET, HEAD, OPTIONS');
        assert.deepEqual(res.body, { error: 'This deployment is read-only' });
    }

    assert.equal(pool.calls.length, 0);
});

test('POST /api/contacts rejects missing fields with 400 before touching the DB', async () => {
    const pool = fakePool(async () => ({ rows: [], rowCount: 0 }));
    const res = await request(createApp(pool))
        .post('/api/contacts')
        .send({ name: 'No Phone' });
    assert.equal(res.status, 400);
    assert.equal(pool.calls.length, 0);
});

test('POST /api/contacts rejects oversized fields before touching the DB', async () => {
    const pool = fakePool(async () => ({ rows: [], rowCount: 0 }));
    const res = await request(createApp(pool))
        .post('/api/contacts')
        .send({ name: 'x'.repeat(101), phone: '555-0100' });
    assert.equal(res.status, 400);
    assert.equal(pool.calls.length, 0);
});

test('POST /api/contacts rejects bodies larger than 8 KiB', async () => {
    const pool = fakePool(async () => ({ rows: [], rowCount: 0 }));
    const res = await request(createApp(pool))
        .post('/api/contacts')
        .send({ name: 'Ada', phone: '555-0100', padding: 'x'.repeat(9 * 1024) });
    assert.equal(res.status, 413);
    assert.deepEqual(res.body, { error: 'Request body too large' });
    assert.equal(pool.calls.length, 0);
});

test('contact routes reject malformed IDs before touching the DB', async () => {
    const pool = fakePool(async () => ({ rows: [], rowCount: 0 }));
    const res = await request(createApp(pool)).get('/api/contacts/not-a-number');
    assert.equal(res.status, 400);
    assert.equal(pool.calls.length, 0);
});

test('PUT /api/contacts/:id returns 404 when missing', async () => {
    const pool = fakePool(async () => ({ rows: [], rowCount: 0 }));
    const res = await request(createApp(pool))
        .put('/api/contacts/99')
        .send({ name: 'Ada', phone: '555-0100' });
    assert.equal(res.status, 404);
});

test('DELETE /api/contacts/:id deletes', async () => {
    const pool = fakePool(async () => ({ rows: [], rowCount: 1 }));
    const res = await request(createApp(pool)).delete('/api/contacts/1');
    assert.equal(res.status, 204);
});

test('DB error returns 500 instead of crashing the process', async () => {
    const pool = fakePool(async () => { throw new Error('connection refused'); });
    const res = await request(createApp(pool)).get('/api/contacts');
    assert.equal(res.status, 500);
    assert.deepEqual(res.body, { error: 'Internal server error' });
});

test('readiness reflects DB availability', async () => {
    const up = fakePool(async () => ({ rows: [{ '?column?': 1 }], rowCount: 1 }));
    const down = fakePool(async () => { throw new Error('connection refused'); });
    assert.equal((await request(createApp(up)).get('/api/ready')).status, 200);
    assert.equal((await request(createApp(down)).get('/api/ready')).status, 503);
});

test('liveness never touches the DB', async () => {
    const pool = fakePool(async () => { throw new Error('connection refused'); });
    const res = await request(createApp(pool)).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(pool.calls.length, 0);
});
