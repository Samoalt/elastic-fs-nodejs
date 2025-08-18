const express = require('express');
const { trialBalance } = require('../models/journal');

const router = express.Router();

// Trial balance
router.get('/trial-balance', async (_req, res, next) => {
  try { res.json(await trialBalance()); } catch (e) { next(e); }
});

module.exports = router;
