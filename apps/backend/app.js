import express from 'express';
import client from 'prom-client';

// App factory with an injectable pg pool so tests can supply a fake.
export function createApp(pool) {
    const app = express();
    app.use(express.json());

    const register = new client.Registry();
    client.collectDefaultMetrics({ register });

    // Express 4 does not catch rejected promises from async handlers; without
    // this wrapper a DB error becomes an unhandled rejection that kills the
    // process on Node 20.
    const asyncHandler = (fn) => (req, res, next) => fn(req, res, next).catch(next);

    const validateContact = (req, res, next) => {
        const { name, phone } = req.body ?? {};
        if (typeof name !== 'string' || name.trim() === '' ||
            typeof phone !== 'string' || phone.trim() === '') {
            return res.status(400).json({ error: 'name and phone are required' });
        }
        next();
    };

    // CRUD Endpoints
    app.get('/api/contacts', asyncHandler(async (req, res) => {
        const { rows } = await pool.query('SELECT * FROM contacts ORDER BY id');
        res.json(rows);
    }));

    app.get('/api/contacts/:id', asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { rows } = await pool.query('SELECT * FROM contacts WHERE id = $1', [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(rows[0]);
    }));

    app.post('/api/contacts', validateContact, asyncHandler(async (req, res) => {
        const { name, phone, email } = req.body;
        const { rows } = await pool.query(
            'INSERT INTO contacts (name, phone, email) VALUES ($1, $2, $3) RETURNING *',
            [name, phone, email]
        );
        res.status(201).json(rows[0]);
    }));

    app.put('/api/contacts/:id', validateContact, asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { name, phone, email } = req.body;
        const { rowCount, rows } = await pool.query(
            'UPDATE contacts SET name = $1, phone = $2, email = $3 WHERE id = $4 RETURNING *',
            [name, phone, email, id]
        );
        if (rowCount === 0) return res.status(404).json({ error: 'Not found' });
        res.json(rows[0]);
    }));

    app.delete('/api/contacts/:id', asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { rowCount } = await pool.query('DELETE FROM contacts WHERE id = $1', [id]);
        if (rowCount === 0) return res.status(404).json({ error: 'Not found' });
        res.status(204).end();
    }));

    app.get('/api/hello', (req, res) => {
        res.json({ message: 'Hello from backend!' });
    });

    // Liveness: process-only, never touches the DB.
    app.get('/api/health', (req, res) => {
        res.json({ status: 'ok' });
    });

    // Readiness: DB-aware, so the pod is pulled from rotation when PostgreSQL
    // is unreachable instead of serving 500s.
    app.get('/api/ready', async (req, res) => {
        try {
            await pool.query('SELECT 1');
            res.json({ status: 'ready' });
        } catch {
            res.status(503).json({ status: 'unavailable' });
        }
    });

    app.get('/metrics', asyncHandler(async (req, res) => {
        res.set('Content-Type', register.contentType);
        res.end(await register.metrics());
    }));

    // eslint-disable-next-line no-unused-vars
    app.use((err, req, res, next) => {
        console.error(err);
        if (res.headersSent) return next(err);
        res.status(500).json({ error: 'Internal server error' });
    });

    return app;
}
