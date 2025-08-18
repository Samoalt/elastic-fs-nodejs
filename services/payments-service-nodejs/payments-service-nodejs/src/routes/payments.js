const express = require('express');
const Joi = require('joi');
const { createIntent, getIntent, listIntents, updateIntent, addEvent } = require('../models/payments');
const { startMpesaStk } = require('../services/gateway');

const router = express.Router();

// Create intent
router.post('/intents', async (req, res) => {
  const schema = Joi.object({
    method: Joi.string().valid('mpesa','wallet','card').required(),
    amount: Joi.number().positive().required(),
    currency: Joi.string().default('KES'),
    reference: Joi.string().allow(null,''),
    description: Joi.string().allow(null,''),
    customerId: Joi.string().allow(null,''),
    metadata: Joi.object().unknown(true)
  });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  const row = await createIntent(value);
  res.status(201).json(row);
});

// List intents
router.get('/intents', async (req, res) => {
  const rows = await listIntents({
    status: req.query.status,
    method: req.query.method,
    reference: req.query.reference,
    customerId: req.query.customerId
  }, { limit: Number(req.query.limit || 50), offset: Number(req.query.offset || 0) });
  res.json({ items: rows });
});

// Get one
router.get('/intents/:id', async (req, res) => {
  const row = await getIntent(Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

// Confirm intent (trigger provider)
router.post('/intents/:id/confirm', async (req, res) => {
  const intent = await getIntent(Number(req.params.id));
  if (!intent) return res.status(404).json({ error: 'Not found' });
  if (intent.status !== 'requires_confirmation') return res.status(400).json({ error: `Cannot confirm from status ${intent.status}` });

  try {
    let resp = {};
    if (intent.method === 'mpesa') {
      const schema = Joi.object({ phone: Joi.string().pattern(/^254\d{9}$/).required() });
      const { error, value } = schema.validate(req.body || {});
      if (error) return res.status(400).json({ error: error.details[0].message });

      const baseUrl = process.env.MPESA_SERVICE_URL || 'http://localhost:5004';
      resp = await startMpesaStk({
        baseUrl,
        phone: value.phone,
        amount: Number(intent.amount),
        reference: intent.reference || 'ELASTICFS',
        description: intent.description || 'Payment'
      });
      await updateIntent(intent.id, { status: 'processing', provider: 'mpesa', providerRef: resp.CheckoutRequestID });
      await addEvent(intent.id, 'confirmed', resp);
    } else {
      // Wallet / card stubs here
      await updateIntent(intent.id, { status: 'processing' });
      await addEvent(intent.id, 'confirmed', {});
    }
    res.json({ message: 'Confirmation started', provider: intent.method, details: resp });
  } catch (e) {
    await updateIntent(intent.id, { status: 'failed' });
    await addEvent(intent.id, 'failed', { error: e.message });
    res.status(502).json({ error: e.message });
  }
});

// Cancel intent
router.post('/intents/:id/cancel', async (req, res) => {
  const intent = await getIntent(Number(req.params.id));
  if (!intent) return res.status(404).json({ error: 'Not found' });
  if (!['requires_confirmation','processing'].includes(intent.status)) {
    return res.status(400).json({ error: `Cannot cancel from status ${intent.status}` });
  }
  const upd = await updateIntent(intent.id, { status: 'canceled' });
  await addEvent(intent.id, 'canceled', {});
  res.json(upd);
});

module.exports = router;
