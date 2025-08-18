const { withTx } = require('../config/database');
const { AppError } = require('../utils/errors');

async function deposit({ walletId, amount }) {
  if (amount <= 0) throw new AppError('Amount must be > 0', 422);
  return withTx(async (client) => {
    const { rows } = await client.query(`UPDATE wallets SET balance = balance + $1 WHERE id=$2 RETURNING id, balance`, [amount, walletId]);
    if (!rows.length) throw new AppError('Wallet not found', 404);
    return rows[0];
  });
}

async function withdraw({ walletId, amount }) {
  if (amount <= 0) throw new AppError('Amount must be > 0', 422);
  return withTx(async (client) => {
    const { rows } = await client.query(`SELECT balance FROM wallets WHERE id=$1 FOR UPDATE`, [walletId]);
    if (!rows.length) throw new AppError('Wallet not found', 404);
    if (Number(rows[0].balance) < amount) throw new AppError('Insufficient funds', 409);
    const upd = await client.query(`UPDATE wallets SET balance = balance - $1 WHERE id=$2 RETURNING id, balance`, [amount, walletId]);
    return upd.rows[0];
  });
}

async function transfer({ fromId, toId, amount }) {
  if (fromId === toId) throw new AppError('Cannot transfer to same wallet', 422);
  if (amount <= 0) throw new AppError('Amount must be > 0', 422);
  return withTx(async (client) => {
    const from = await client.query(`SELECT id, balance FROM wallets WHERE id=$1 FOR UPDATE`, [fromId]);
    const to   = await client.query(`SELECT id FROM wallets WHERE id=$1 FOR UPDATE`, [toId]);
    if (!from.rows.length || !to.rows.length) throw new AppError('Wallet not found', 404);
    if (Number(from.rows[0].balance) < amount) throw new AppError('Insufficient funds', 409);
    await client.query(`UPDATE wallets SET balance = balance - $1 WHERE id=$2`, [amount, fromId]);
    await client.query(`UPDATE wallets SET balance = balance + $1 WHERE id=$2`, [amount, toId]);
    const newFrom = await client.query(`SELECT id, balance FROM wallets WHERE id=$1`, [fromId]);
    const newTo   = await client.query(`SELECT id, balance FROM wallets WHERE id=$1`, [toId]);
    return { from: newFrom.rows[0], to: newTo.rows[0] };
  });
}

module.exports = { deposit, withdraw, transfer };
