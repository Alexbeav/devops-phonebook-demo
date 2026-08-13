import pkg from 'pg';
import dotenv from 'dotenv';
import { createApp } from './app.js';
dotenv.config();

const { Pool } = pkg;
const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 5432,
});

// An idle client erroring (e.g. DB restart) emits on the pool; without a
// listener that is an uncaught exception.
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});

const port = process.env.PORT || 5000;
createApp(pool).listen(port, () => {
    console.log(`Backend listening on port ${port}`);
});
