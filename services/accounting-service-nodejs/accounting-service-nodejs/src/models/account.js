const { q } = require('../config/database');

async function createAccount({ code, name, type, currency = 'KES' }) {
  const { rows } = await q(
    `INSERT INTO accounts (code, name, type, currency)
     VALUES ($1,$2,$3,$4)
     RETURNING id, code, name, type, currency, created_at`,
    [code, name, type, currency]
  );
  return rows[0];
}

async function getAccountByCode(code) {
  const { rows } = await q(`SELECT * FROM accounts WHERE code=$1`, [code]);
  return rows[0] || null;
}

async function listAccounts() {
  const { rows } = await q(
    `SELECT id, code, name, type, currency, created_at
     FROM accounts ORDER BY code`
  );
  return rows;
}

module.exports = { createAccount, getAccountByCode, listAccounts };
