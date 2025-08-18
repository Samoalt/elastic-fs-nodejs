const express = require('express');
const { updateIntent, addEvent } = require('../models/payments');
const router = express.Router();

// Accept M-Pesa STK callback payload directly (or forward from mpesa-service)
router.post('/mpesa', async (req, res) => {
  try {
    const body = req.body || {};
    const cb = body?.Body?.stkCallback;
    if (!cb) return res.status(400).json({ error: 'Invalid callback payload' });

    // Find intent by provider_ref (CheckoutRequestID)
    const ck = cb.CheckoutRequestID;

    // Update status based on result
    const code = cb.ResultCode;
    const desc = cb.ResultDesc;
    let receiptNo = null, transactionDate = null;
    if (Array.isArray(cb.CallbackMetadata?.Item)) {
      for (const it of cb.CallbackMetadata.Item) {
        if (it.Name === 'MpesaReceiptNumber') receiptNo = it.Value;
        if (it.Name === 'TransactionDate') transactionDate = String(it.Value);
      }
    }

    // Update by joining on provider_ref
    // (We don't have a direct method here; use a small inline query)
    const { q } = require('../config/database');
    const { rows } = await q('SELECT id FROM payment_intents WHERE provider_ref=$1', [ck]);
    if (!rows.length) {
      return res.json({ ResultCode: 0, ResultDesc: 'Accepted (no matching intent)' });
    }
    const intentId = rows[0].id;

    const status = code === 0 ? 'succeeded' : 'failed';
    const upd = await updateIntent(intentId, { status });
    await addEvent(intentId, `webhook.received`, body);
    await addEvent(intentId, status, { resultCode: code, resultDesc: desc, receiptNo, transactionDate });

    // Ack to Daraja
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (e) {
    // Ack anyway to stop retries; log via event
    try {
      await addEvent(0, 'webhook.error', { error: e.message });
    } catch {}
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
});

module.exports = router;
