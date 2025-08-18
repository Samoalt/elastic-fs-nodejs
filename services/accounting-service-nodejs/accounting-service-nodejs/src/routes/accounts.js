const express = require('express');
const Joi = require('joi');
const { validate } = require('../middleware/validate');
const { createAccount, listAccounts, getAccountByCode } = require('../models/account');
const { AppError } = require('../utils/errors');

const router = express.Router();

// List accounts
router.get('/', async (_req, res, next) => {
  try { res.json(await listAccounts()); } catch (e) { next(e); }
});

// Create an account
router.post(
  '/',
  validate(Joi.object({
    body: Joi.object({
      code: Joi.string().required(),
      name: Joi.string().required(),
      type: Joi.string().valid('asset','liability','equity','revenue','expense').required(),
      currency: Joi.string().default('KES')
    })
  })),
  async (req, res, next) => {
    try { res.status(201).json(await createAccount(req.valid.body)); }
    catch (e) {
      if (e?.code === '23505') return next(new AppError('Account code already exists', 409));
      next(e);
    }
  }
);

// Get by code
router.get('/:code', async (req, res, next) => {
  try {
    const acc = await getAccountByCode(req.params.code);
    if (!acc) throw new AppError('Not found', 404);
    res.json(acc);
  } catch (e) { next(e); }
});

module.exports = router;
