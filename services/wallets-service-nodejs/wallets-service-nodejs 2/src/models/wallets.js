const { q, withTx } = require('../config/database');
const { userWalletAccount } = require('../utils/naming');

async function createWallet({ userId, currency }){
  const account = userWalletAccount(userId, currency);
  const { rows } = await q(
    `INSERT INTO wallets (user_id, currency, account) VALUES ($1,$2,$3)
     ON CONFLICT (user_id, currency) DO UPDATE SET account=EXCLUDED.account
     RETURNING *`,
    [userId, currency, account]
  );
  return rows[0];
}

async function findWallet(id){
  const { rows } = await q('SELECT * FROM wallets WHERE id=$1', [id]);
  return rows[0] || null;
}

async function holdsForWallet(walletId){
  const { rows } = await q(`SELECT * FROM holds WHERE wallet_id=$1 AND status='active'`, [walletId]);
  return rows;
}

async function createHold({ walletId, amount, currency, account }){
  const { rows } = await q(
    `INSERT INTO holds (wallet_id, amount, currency, account) VALUES ($1,$2,$3,$4) RETURNING *`,
    [walletId, amount, currency, account]
  );
  return rows[0];
}

async function setHoldStatus(id, status){
  const col = status === 'captured' ? 'captured_at' : status === 'released' ? 'released_at' : null;
  const { rows } = await q(
    `UPDATE holds SET status=$2, ${col? col + '=NOW(),' : ''} updated_at=NOW()
     WHERE id=$1 RETURNING *`,
    [id, status]
  );
  return rows[0] || null;
}

async function getHold(id){
  const { rows } = await q('SELECT * FROM holds WHERE id=$1', [id]);
  return rows[0] || null;
}

module.exports = { createWallet, findWallet, holdsForWallet, createHold, setHoldStatus, getHold };
