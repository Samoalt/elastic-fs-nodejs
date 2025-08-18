const express = require('express');
const Joi = require('joi');
const { validate } = require('../middleware/validate');
const { computeDocument } = require('../services/taxEngine');
const { findActiveByCode } = require('../models/rates');

const router = express.Router();

const calcSchema = Joi.object({
  body: Joi.object({
    currency: Joi.string().default('KES'),
    date: Joi.string().isoDate().default(() => new Date().toISOString().slice(0,10)),
    rounding: Joi.string().valid('line','document').default(process.env.ROUNDING_MODE || 'line'),
    lines: Joi.array().items(Joi.object({
      id: Joi.string().allow('', null),
      amount: Joi.number().required(),
      taxCode: Joi.string().required(),
      taxInclusive: Joi.boolean().default(false)
    })).min(1).required()
  })
});

router.post('/calculate', validate(calcSchema), async (req, res, next) => {
  try {
    const at = req.valid.body.date;
    // Resolve rates for each line
    const lines = [];
    for (const ln of req.valid.body.lines) {
      const rateRow = await findActiveByCode(ln.taxCode, at);
      if (!rateRow) return res.status(400).json({ error: `No active rate for code ${ln.taxCode} at ${at}` });
      lines.push({ amount: ln.amount, rate: Number(rateRow.rate), taxInclusive: !!ln.taxInclusive, code: ln.taxCode, id: ln.id || null });
    }
    const result = computeDocument(lines, req.valid.body.rounding);
    res.json({ currency: req.valid.body.currency, date: at, rounding: req.valid.body.rounding, ...result });
  } catch (e) { next(e); }
});

module.exports = router;
