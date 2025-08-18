const express = require('express');
const Joi = require('joi');
const { validate } = require('../middleware/validate');
const { AppError } = require('../utils/errors');
const { createWallet, getWallet } = require('../models/wallet');
const walletSvc = require('../services/walletService');

const router = express.Router();

/**
 * @openapi
 * /wallets:
 *   post:
 *     summary: Create a wallet
 */
router.post(
  '/',
  validate(Joi.object({ body: Joi.object({ ownerId: Joi.number().integer().required(), currency: Joi.string().required() }) })),
  async (req, res, next) => {
    try {
      const wallet = await createWallet(req.valid.body);
      res.status(201).json(wallet);
    } catch (e) { next(e); }
  }
);

/**
 * @openapi
 * /wallets/{id}:
 *   get:
 *     summary: Get a wallet
 */
router.get(
  '/:id',
  validate(Joi.object({ params: Joi.object({ id: Joi.number().integer().required() }) })),
  async (req, res, next) => {
    try {
      const wallet = await getWallet(req.valid.params.id);
      if (!wallet) throw new AppError('Wallet not found', 404);
      res.json(wallet);
    } catch (e) { next(e); }
  }
);

/**
 * @openapi
 * /wallets/{id}/deposit:
 *   post: { summary: Deposit into a wallet }
 */
router.post(
  '/:id/deposit',
  validate(Joi.object({ params: Joi.object({ id: Joi.number().integer().required() }), body: Joi.object({ amount: Joi.number().positive().required() }) })),
  async (req, res, next) => {
    try {
      const { id } = req.valid.params;
      const { amount } = req.valid.body;
      const result = await walletSvc.deposit({ walletId: id, amount });
      res.json(result);
    } catch (e) { next(e); }
  }
);

/**
 * @openapi
 * /wallets/{id}/withdraw:
 *   post: { summary: Withdraw from a wallet }
 */
router.post(
  '/:id/withdraw',
  validate(Joi.object({ params: Joi.object({ id: Joi.number().integer().required() }), body: Joi.object({ amount: Joi.number().positive().required() }) })),
  async (req, res, next) => {
    try {
      const { id } = req.valid.params;
      const { amount } = req.valid.body;
      const result = await walletSvc.withdraw({ walletId: id, amount });
      res.json(result);
    } catch (e) { next(e); }
  }
);

/**
 * @openapi
 * /wallets/transfer:
 *   post: { summary: Transfer between wallets }
 */
router.post(
  '/transfer',
  validate(Joi.object({ body: Joi.object({
    fromId: Joi.number().integer().required(),
    toId: Joi.number().integer().required(),
    amount: Joi.number().positive().required()
  }) })),
  async (req, res, next) => {
    try {
      const { fromId, toId, amount } = req.valid.body;
      const result = await walletSvc.transfer({ fromId, toId, amount });
      res.json(result);
    } catch (e) { next(e); }
  }
);

module.exports = router;
