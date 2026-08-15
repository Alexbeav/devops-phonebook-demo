import express from 'express';
import { rateLimit } from 'express-rate-limit';
import client from 'prom-client';

// App factory with an injectable pg pool so tests can supply a fake.
export function createApp(pool, { readOnly = false, contactRateLimit = 600 } = {}) {
    const app = express();

    // Production is a public CI/CD showcase, not a public data-entry service.
    // Enforce read-only mode here so bypassing the UI or edge cannot restore
    // write access. Reject mutations before parsing their request bodies.
    app.use('/api/contacts', (req, res, next) => {
        if (readOnly && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
            res.set('Allow', 'GET, HEAD, OPTIONS');
            return res.status(405).json({ error: 'This deployment is read-only' });
        }
        next();
    });

    // This is a backstop at the service hop, so it deliberately keys on the
    // directly connected Traefik proxy rather than trusting client-supplied
    // forwarding headers. Per-client enforcement remains at the edge.
    app.use('/api/contacts', rateLimit({
        windowMs: 60_000,
        limit: contactRateLimit,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        validate: { xForwardedForHeader: false },
    }));

    app.use(express.json({ limit: '8kb', strict: true }));

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
        if (name.trim().length > 100 || phone.trim().length > 50 ||
            (req.body.email != null &&
             (typeof req.body.email !== 'string' || req.body.email.trim().length > 254))) {
            return res.status(400).json({ error: 'contact fields exceed permitted lengths' });
        }
        next();
    };

    const validateId = (req, res, next) => {
        if (!/^[1-9]\d*$/.test(req.params.id)) {
            return res.status(400).json({ error: 'id must be a positive integer' });
        }
        next();
    };

    app.get('/api/config', (req, res) => {
        res.json({ readOnly });
    });

    // CRUD Endpoints
    app.get('/api/contacts', asyncHandler(async (req, res) => {
        const { rows } = await pool.query(
            'SELECT id, name, phone, email FROM contacts ORDER BY id LIMIT 500'
        );
        res.json(rows);
    }));

    app.get('/api/contacts/:id', validateId, asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { rows } = await pool.query('SELECT * FROM contacts WHERE id = $1', [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(rows[0]);
    }));

    app.post('/api/contacts', validateContact, asyncHandler(async (req, res) => {
        const name = req.body.name.trim();
        const phone = req.body.phone.trim();
        const email = req.body.email?.trim() || null;
        const { rows } = await pool.query(
            'INSERT INTO contacts (name, phone, email) VALUES ($1, $2, $3) RETURNING *',
            [name, phone, email]
        );
        res.status(201).json(rows[0]);
    }));

    app.put('/api/contacts/:id', validateId, validateContact, asyncHandler(async (req, res) => {
        const { id } = req.params;
        const name = req.body.name.trim();
        const phone = req.body.phone.trim();
        const email = req.body.email?.trim() || null;
        const { rowCount, rows } = await pool.query(
            'UPDATE contacts SET name = $1, phone = $2, email = $3 WHERE id = $4 RETURNING *',
            [name, phone, email, id]
        );
        if (rowCount === 0) return res.status(404).json({ error: 'Not found' });
        res.json(rows[0]);
    }));

    app.delete('/api/contacts/:id', validateId, asyncHandler(async (req, res) => {
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
        if (res.headersSent) return next(err);
        if (err.status === 413) {
            return res.status(413).json({ error: 'Request body too large' });
        }
        if (err.status === 400) {
            return res.status(400).json({ error: 'Invalid request body' });
        }
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    });

    return app;
}
