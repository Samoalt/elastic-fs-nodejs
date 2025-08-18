const express = require('express');
const Joi = require('joi');
const { validate } = require('../middleware/validate');
const model = require('../models/product');
const router = express.Router();

router.get('/', async (_req, res, next) => {
  try { res.json(await model.listProducts()); } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const row = await model.getProduct(Number(req.params.id));
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (e) { next(e); }
});

router.post('/',
  validate(Joi.object({
    body: Joi.object({
      name: Joi.string().min(2).required(),
      interestRate: Joi.number().min(0).required(),
      termMonths: Joi.number().integer().min(1).required(),
      frequency: Joi.string().valid('monthly','weekly').default('monthly'),
      penaltyRate: Joi.number().min(0).default(0)
    })
  })),
  async (req, res, next) => {
    try { res.status(201).json(await model.createProduct(req.valid.body)); } catch (e) { next(e); }
  }
);

router.put('/:id',
  validate(Joi.object({
    params: Joi.object({ id: Joi.number().integer().required() }),
    body: Joi.object({
      name: Joi.string().min(2),
      interestRate: Joi.number().min(0),
      termMonths: Joi.number().integer().min(1),
      frequency: Joi.string().valid('monthly','weekly'),
      penaltyRate: Joi.number().min(0)
    })
  })),
  async (req, res, next) => {
    try {
      const row = await model.updateProduct(Number(req.valid.params.id), req.valid.body);
      if (!row) return res.status(404).json({ error: 'Not found' });
      res.json(row);
    } catch (e) { next(e); }
  }
);

module.exports = router;
