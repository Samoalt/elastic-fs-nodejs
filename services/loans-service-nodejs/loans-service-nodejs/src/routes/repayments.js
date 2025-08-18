const express = require('express');
const Joi = require('joi');
const { validate } = require('../middleware/validate');
const r = require('../models/repayment');

const router = express.Router();

router.post('/',
  validate(Joi.object({
    body: Joi.object({
      applicationId: Joi.number().integer().required(),
      amount: Joi.number().positive().required(),
      paidAt: Joi.string().isoDate().allow(null)
    })
  })),
  async (req, res, next) => {
    try { res.status(201).json(await r.recordRepayment(req.valid.body)); } catch (e) { next(e); }
  }
);

router.get('/applications/:id', async (req, res, next) => {
  try { res.json(await r.listRepayments(Number(req.params.id))); } catch (e) { next(e); }
});

module.exports = router;
