const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const q = (text, params) => pool.query(text, params);
async function withTx(fn){ const client = await pool.connect(); try{ await client.query('BEGIN'); const res = await fn(client); await client.query('COMMIT'); return res; } catch(e){ await client.query('ROLLBACK'); throw e; } finally { client.release(); } }
module.exports = { pool, q, withTx };
