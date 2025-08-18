const express = require('express');
const Joi = require('joi');
const { validate } = require('../middleware/validate');
const { AppError } = require('../utils/errors');
const model = require('../models/audit');

const router = express.Router();

// Schema
const postSchema = Joi.object({
  body: Joi.object({
    type: Joi.string().required(),
    source: Joi.string().allow(null, ''),
    entityType: Joi.string().allow(null, ''),
    entityId: Joi.string().allow(null, ''),
    actorId: Joi.string().allow(null, ''),
    actorType: Joi.string().allow(null, ''),
    requestId: Joi.string().allow(null, ''),
    ip: Joi.string().allow(null, ''),
    userAgent: Joi.string().allow(null, ''),
    country: Joi.string().allow(null, ''),
    city: Joi.string().allow(null, ''),
    data: Joi.object().unknown(true)
  })
});

const listSchema = Joi.object({
  query: Joi.object({
    type: Joi.string(),
    actorId: Joi.string(),
    entityType: Joi.string(),
    entityId: Joi.string(),
    source: Joi.string(),
    from: Joi.string().isoDate(),
    to: Joi.string().isoDate(),
    q: Joi.string(),
    limit: Joi.number().integer().min(1).max(200).default(50),
    offset: Joi.number().integer().min(0).default(0)
  })
});

// POST /events
router.post('/events', validate(postSchema), async (req, res, next) => {
  try {
    const saved = await model.insertEvent(req.valid.body);
    res.status(201).json(saved);
  } catch (e) { next(e); }
});

// GET /events
router.get('/events', validate(listSchema), async (req, res, next) => {
  try {
    const { limit, offset, ...filters } = req.valid.query;
    const rows = await model.listEvents(filters, { limit, offset });
    res.json({ items: rows, limit, offset });
  } catch (e) { next(e); }
});

// GET /events/:id
router.get('/events/:id', async (req, res, next) => {
  try {
    const row = await model.getEvent(Number(req.params.id));
    if (!row) throw new AppError('Not found', 404);
    res.json(row);
  } catch (e) { next(e); }
});

module.exports = router;
