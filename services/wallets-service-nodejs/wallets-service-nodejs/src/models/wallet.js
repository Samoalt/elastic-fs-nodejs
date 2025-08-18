const { q } = require('../config/database');

async function createWallet({ ownerId, currency }) {
  const { rows } = await q(
    `INSERT INTO wallets (owner_id, currency, balance)
     VALUES ($1,$2,0) RETURNING id, owner_id AS "ownerId", currency, balance, created_at AS "createdAt"`,
    [ownerId, currency]
  );
  return rows[0];
}

async function getWallet(id) {
  const { rows } = await q(
    `SELECT id, owner_id AS "ownerId", currency, balance, created_at AS "createdAt" FROM wallets WHERE id=$1`,
    [id]
  );
  return rows[0] || null;
}

module.exports = { createWallet, getWallet };
