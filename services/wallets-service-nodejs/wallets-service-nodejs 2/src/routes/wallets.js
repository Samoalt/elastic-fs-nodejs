const express = require('express');
const Joi = require('joi');
const { createWallet, findWallet, holdsForWallet, createHold, setHoldStatus, getHold } = require('../models/wallets');
const { getBalances, postTransaction } = require('../services/formance');
const { userWalletAccount, holdAccount } = require('../utils/naming');
const { idempotency } = require('../middleware/idempotency');

const router = express.Router();

// Create wallet
router.post('/wallets', async (req, res) => {
  const schema = Joi.object({ userId: Joi.string().required(), currency: Joi.string().default('KES') });
  const { error, value } = schema.validate(req.body || {});
  if(error) return res.status(400).json({ error: error.details[0].message });
  const row = await createWallet(value);
  res.status(201).json({ id: row.id, userId: row.user_id, currency: row.currency, account: row.account });
});

// Get balances (ledger - holds)
router.get('/wallets/:id/balances', async (req, res) => {
  const w = await findWallet(Number(req.params.id));
  if(!w) return res.status(404).json({ error: 'Wallet not found' });
  const ledgerBal = await getBalances(w.account);
  const activeHolds = await holdsForWallet(w.id);
  const held = activeHolds.reduce((acc,h)=> acc + Number(h.amount||0), 0);
  const currency = w.currency;
  const ledger = Number( (ledgerBal?.[currency] ?? ledgerBal?.balances?.[currency] ?? 0) );
  const available = ledger - held;
  res.json({ currency, ledger, holds: held, available });
});

// Create hold (ledger move to holds:{id})
router.post('/wallets/:id/holds', idempotency, async (req, res) => {
  const schema = Joi.object({ amount: Joi.number().positive().required(), currency: Joi.string().default('KES') });
  const { error, value } = schema.validate(req.body || {});
  if(error) return res.status(400).json({ error: error.details[0].message });

  const w = await findWallet(Number(req.params.id));
  if(!w) return res.status(404).json({ error: 'Wallet not found' });

  // Create the hold record first to get ID
  const hold = await createHold({ walletId: w.id, amount: value.amount, currency: value.currency, account: null });
  const holdAcc = holdAccount(hold.id);

  // Ledger: move funds from wallet -> holds:{id}
  const tx = await postTransaction({
    reference: `hold-${hold.id}`,
    postings: [{
      source: w.account, destination: holdAcc, amount: Number(value.amount), asset: value.currency
    }],
    metadata: { type: 'hold.create', walletId: w.id, holdId: hold.id }
  });

  // Update hold account name
  await require('../config/database').q('UPDATE holds SET account=$2 WHERE id=$1', [hold.id, holdAcc]);

  res.status(201).json({ id: hold.id, status: 'active', account: holdAcc, tx });
});

// Capture hold
router.post('/holds/:id/capture', idempotency, async (req, res) => {
  const schema = Joi.object({
    toWalletId: Joi.number().integer(),
    toAccount: Joi.string(),
    amount: Joi.number().positive()
  }).xor('toWalletId','toAccount');
  const { error, value } = schema.validate(req.body || {});
  if(error) return res.status(400).json({ error: error.details[0].message });

  const h = await getHold(Number(req.params.id));
  if(!h || h.status !== 'active') return res.status(404).json({ error: 'Active hold not found' });
  const w = await findWallet(h.wallet_id);
  if(!w) return res.status(404).json({ error: 'Wallet not found for hold' });

  const amount = Number(value.amount || h.amount);
  const destAcc = value.toWalletId ? (await findWallet(value.toWalletId))?.account : value.toAccount;
  if(value.toWalletId && !destAcc) return res.status(404).json({ error: 'Destination wallet not found' });

  const tx = await postTransaction({
    reference: `hold-capture-${h.id}`,
    postings: [{ source: h.account, destination: destAcc, amount, asset: h.currency }],
    metadata: { type: 'hold.capture', holdId: h.id, fromWalletId: w.id, toAccount: destAcc }
  });

  await setHoldStatus(h.id, 'captured');
  res.json({ ok: true, tx });
});

// Release hold
router.post('/holds/:id/release', idempotency, async (req, res) => {
  const h = await getHold(Number(req.params.id));
  if(!h || h.status !== 'active') return res.status(404).json({ error: 'Active hold not found' });
  const w = await findWallet(h.wallet_id);
  if(!w) return res.status(404).json({ error: 'Wallet not found for hold' });

  const tx = await postTransaction({
    reference: `hold-release-${h.id}`,
    postings: [{ source: h.account, destination: w.account, amount: Number(h.amount), asset: h.currency }],
    metadata: { type: 'hold.release', holdId: h.id, walletId: w.id }
  });

  await setHoldStatus(h.id, 'released');
  res.json({ ok: true, tx });
});

// Transfers (wallet → wallet)
router.post('/transfers', idempotency, async (req, res) => {
  const schema = Joi.object({
    fromWalletId: Joi.number().integer().required(),
    toWalletId: Joi.number().integer().required(),
    amount: Joi.number().positive().required(),
    currency: Joi.string().default('KES'),
    metadata: Joi.object().unknown(true)
  });
  const { error, value } = schema.validate(req.body || {});
  if(error) return res.status(400).json({ error: error.details[0].message });

  const src = await findWallet(value.fromWalletId);
  const dst = await findWallet(value.toWalletId);
  if(!src || !dst) return res.status(404).json({ error: 'Wallet not found' });

  const tx = await postTransaction({
    reference: `transfer-${src.id}-${dst.id}-${Date.now()}`,
    postings: [{ source: src.account, destination: dst.account, amount: Number(value.amount), asset: value.currency }],
    metadata: { type: 'wallet.transfer', ...value.metadata || {} }
  });
  res.status(201).json({ ok: true, tx });
});

// Topup via M-Pesa
router.post('/topups/mpesa', idempotency, async (req, res) => {
  const schema = Joi.object({ walletId: Joi.number().integer().required(), amount: Joi.number().positive().required(), currency: Joi.string().default('KES'), providerRef: Joi.string().required() });
  const { error, value } = schema.validate(req.body || {});
  if(error) return res.status(400).json({ error: error.details[0].message });
  const w = await findWallet(value.walletId);
  if(!w) return res.status(404).json({ error: 'Wallet not found' });

  const clearing = process.env.CLEARING_MPESA || 'providers:mpesa:clearing';
  const tx = await postTransaction({
    reference: `topup-mpesa-${value.providerRef}`,
    postings: [{ source: clearing, destination: w.account, amount: Number(value.amount), asset: value.currency }],
    metadata: { type: 'topup.mpesa', providerRef: value.providerRef, walletId: w.id }
  });
  res.status(201).json({ ok: true, tx });
});

// Payout to bank
router.post('/payouts/bank', idempotency, async (req, res) => {
  const schema = Joi.object({ walletId: Joi.number().integer().required(), amount: Joi.number().positive().required(), currency: Joi.string().default('KES'), reference: Joi.string().allow('', null) });
  const { error, value } = schema.validate(req.body || {});
  if(error) return res.status(400).json({ error: error.details[0].message });
  const w = await findWallet(value.walletId);
  if(!w) return res.status(404).json({ error: 'Wallet not found' });

  const settlement = process.env.SETTLEMENT_BANK || 'banks:choice:settlement';
  const tx = await postTransaction({
    reference: `payout-bank-${value.reference || Date.now()}`,
    postings: [{ source: w.account, destination: settlement, amount: Number(value.amount), asset: value.currency }],
    metadata: { type: 'payout.bank', walletId: w.id, reference: value.reference || null }
  });
  res.status(201).json({ ok: true, tx });
});

module.exports = router;
