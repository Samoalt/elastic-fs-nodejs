const express = require('express');
const Joi = require('joi');
const { validate } = require('../middleware/validate');
const { postEntry, ledgerForAccount } = require('../models/journal');

const router = express.Router();

// Post balanced journal entry
router.post(
  '/',
  validate(Joi.object({
    body: Joi.object({
      reference: Joi.string().allow('', null),
      description: Joi.string().allow('', null),
      entryDate: Joi.string().isoDate().allow(null),
      lines: Joi.array().items(Joi.object({
        accountId: Joi.number().integer().required(),
        debit: Joi.number().precision(2),
        credit: Joi.number().precision(2),
        memo: Joi.string().allow('', null)
      })).min(2).required()
    })
  })),
  async (req, res, next) => {
    try { res.status(201).json(await postEntry(req.valid.body)); }
    catch (e) { next(e); }
  }
);

// Ledger for account
router.get('/ledger/:accountId', async (req, res, next) => {
  try {
    const rows = await ledgerForAccount({ accountId: Number(req.params.accountId) });
    res.json(rows);
  } catch (e) { next(e); }
});

module.exports = router;
