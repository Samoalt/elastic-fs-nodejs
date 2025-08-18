const express = require('express');
const Joi = require('joi');
const { validate } = require('../middleware/validate');
const rates = require('../models/rates');

const router = express.Router();

router.get('/', validate(Joi.object({ query: Joi.object({
  code: Joi.string(), country: Joi.string(), activeOn: Joi.string().isoDate().allow(null),
  limit: Joi.number().integer().min(1).max(200).default(100),
  offset: Joi.number().integer().min(0).default(0)
}) })), async (req, res, next) => {
  try { res.json({ items: await rates.list(req.valid.query, { limit: req.valid.query.limit, offset: req.valid.query.offset }) }); }
  catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try { const row = await rates.get(Number(req.params.id)); if(!row) return res.status(404).json({ error: 'Not found' }); res.json(row); }
  catch (e) { next(e); }
});

router.post('/', validate(Joi.object({ body: Joi.object({
  code: Joi.string().required(),
  name: Joi.string().required(),
  rate: Joi.number().min(0).required(),
  inclusive: Joi.boolean().default(false),
  country: Joi.string().allow(null,''),
  region: Joi.string().allow(null,''),
  effective_from: Joi.string().isoDate().required(),
  effective_to: Joi.string().isoDate().allow(null)
}) })), async (req, res, next) => {
  try { const row = await rates.create(req.valid.body); res.status(201).json(row); }
  catch (e) { next(e); }
});

router.put('/:id', validate(Joi.object({ params: Joi.object({ id: Joi.number().integer().required() }), body: Joi.object({
  code: Joi.string(), name: Joi.string(), rate: Joi.number().min(0),
  inclusive: Joi.boolean(), country: Joi.string().allow(null,''),
  region: Joi.string().allow(null,''), effective_from: Joi.string().isoDate(), effective_to: Joi.string().isoDate().allow(null)
}) })), async (req, res, next) => {
  try { const row = await rates.update(Number(req.valid.params.id), req.valid.body); if(!row) return res.status(404).json({ error: 'Not found' }); res.json(row); }
  catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try { const row = await rates.softDelete(Number(req.params.id)); if(!row) return res.status(404).json({ error: 'Not found' }); res.json({ ok: true }); }
  catch (e) { next(e); }
});

module.exports = router;
