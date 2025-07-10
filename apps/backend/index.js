import express from 'express';
import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;
const app = express();
app.use(express.json());

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 5432,
});

// CRUD Endpoints
app.get('/api/contacts', async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM contacts ORDER BY id');
    res.json(rows);
});

app.get('/api/contacts/:id', async (req, res) => {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM contacts WHERE id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
});

app.post('/api/contacts', async (req, res) => {
    const { name, phone, email } = req.body;
    const { rows } = await pool.query(
        'INSERT INTO contacts (name, phone, email) VALUES ($1, $2, $3) RETURNING *',
        [name, phone, email]
    );
    res.status(201).json(rows[0]);
});

app.put('/api/contacts/:id', async (req, res) => {
    const { id } = req.params;
    const { name, phone, email } = req.body;
    const { rowCount, rows } = await pool.query(
        'UPDATE contacts SET name = $1, phone = $2, email = $3 WHERE id = $4 RETURNING *',
        [name, phone, email, id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
});

app.delete('/api/contacts/:id', async (req, res) => {
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM contacts WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
});


app.get('/api/hello', (req, res) => {
    res.json({ message: 'Hello from backend! (updated)' });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
});
