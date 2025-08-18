const express = require('express');
const Joi = require('joi');
const { validate } = require('../middleware/validate');
const apps = require('../models/application');

const router = express.Router();

router.post('/',
  validate(Joi.object({
    body: Joi.object({
      productId: Joi.number().integer().required(),
      borrowerId: Joi.string().required(),
      principal: Joi.number().positive().required(),
      startDate: Joi.string().isoDate().allow(null)
    })
  })),
  async (req, res, next) => {
    try {
      const app = await apps.createApplication(req.valid.body);
      res.status(201).json(app);
    } catch (e) { next(e); }
  }
);

router.get('/:id', async (req, res, next) => {
  try {
    const app = await apps.getApplication(Number(req.params.id));
    if (!app) return res.status(404).json({ error: 'Not found' });
    res.json(app);
  } catch (e) { next(e); }
});

router.post('/:id/submit', async (req, res, next) => {
  try { res.json(await apps.setStatus(Number(req.params.id), 'submitted')); }
  catch (e) { next(e); }
});
router.post('/:id/approve', async (req, res, next) => {
  try { res.json(await apps.setStatus(Number(req.params.id), 'approved')); }
  catch (e) { next(e); }
});
router.post('/:id/reject', async (req, res, next) => {
  try { res.json(await apps.setStatus(Number(req.params.id), 'rejected')); }
  catch (e) { next(e); }
});
router.post('/:id/disburse', async (req, res, next) => {
  try { res.json(await apps.setStatus(Number(req.params.id), 'disbursed')); }
  catch (e) { next(e); }
});

router.get('/:id/schedule', async (req, res, next) => {
  try { res.json(await apps.listSchedule(Number(req.params.id))); }
  catch (e) { next(e); }
});

module.exports = router;
