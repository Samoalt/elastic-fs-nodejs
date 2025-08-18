const { Pool } = require('pg');
const winston = require('winston');
require('dotenv').config();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [new winston.transports.Console()]
});

function buildConfig() {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL !== 'false' ? { rejectUnauthorized: false } : false,
      max: 20, idleTimeoutMillis: 30000, connectionTimeoutMillis: 2000
    };
  }
  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || 'elasticfs',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL !== 'false' ? false : false,
    max: 20, idleTimeoutMillis: 30000, connectionTimeoutMillis: 2000
  };
}

class Database {
  constructor() { this.pool = null; }

  async connect() {
    try {
      this.pool = new Pool(buildConfig());
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      logger.info('Database connection established');
    } catch (err) {
      logger.error('DB connect failed:', err);
      throw err;
    }
  }

  async query(text, params) {
    const client = await this.pool.connect();
    try { return await client.query(text, params); }
    finally { client.release(); }
  }

  async close() {
    if (this.pool) { await this.pool.end(); logger.info('DB pool closed'); }
  }
}

module.exports = new Database();
