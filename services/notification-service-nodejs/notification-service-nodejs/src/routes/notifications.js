const express = require('express');
const Joi = require('joi');
const { sendEmail } = require('../utils/mailer');
const { sendSms } = require('../utils/sms');
const { createNotification, updateByProviderId, list, get } = require('../models/notification');

const router = express.Router();

// Email
router.post('/email', async (req, res) => {
  try{
    const schema = Joi.object({
      to: Joi.string().email().required(),
      subject: Joi.string().required(),
      html: Joi.string().allow('', null),
      text: Joi.string().allow('', null)
    });
    const { error, value } = schema.validate(req.body);
    if(error) return res.status(400).json({ error: error.details[0].message });
    const info = await sendEmail(value);
    const row = await createNotification({ channel:'email', recipient:value.to, subject:value.subject, body:value.html || value.text || null, provider:'smtp', providerMessageId: info.messageId, status:'Sent' });
    res.status(202).json({ message: 'Email accepted', id: row.id });
  }catch(e){ res.status(500).json({ error: e.message }); }
});

// SMS
router.post('/sms', async (req, res) => {
  try{
    const schema = Joi.object({
      to: Joi.string().required(),
      message: Joi.string().min(1).required()
    });
    const { error, value } = schema.validate(req.body);
    if(error) return res.status(400).json({ error: error.details[0].message });
    const info = await sendSms(value);
    const row = await createNotification({ channel:'sms', recipient:value.to, body:value.message, provider:'twilio', providerMessageId: info.sid, status: (info.status==='queued'?'Pending':'Sent') });
    res.status(202).json({ message: 'SMS accepted', id: row.id });
  }catch(e){ res.status(500).json({ error: e.message }); }
});

// List
router.get('/', async (req, res) => {
  try{
    const rows = await list({ status:req.query.status, channel:req.query.channel, to:req.query.to, limit:Number(req.query.limit||50), offset:Number(req.query.offset||0) });
    res.json({ items: rows });
  }catch(e){ res.status(500).json({ error: e.message }); }
});

// Get one
router.get('/:id', async (req, res) => {
  try{
    const row = await get(Number(req.params.id));
    if(!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  }catch(e){ res.status(500).json({ error: e.message }); }
});

// Webhook: Twilio status updates
router.post('/webhooks/twilio', async (req, res) => {
  try{
    // Twilio posts x-www-form-urlencoded by default; ensure body-parser can handle it (enabled in server)
    const sid = req.body.MessageSid || req.body.SmsSid;
    const status = (req.body.MessageStatus || '').toLowerCase();
    let mapped = null;
    if(['delivered'].includes(status)) mapped = 'Delivered';
    else if(['undelivered','failed'].includes(status)) mapped = 'Undelivered';
    else if(['queued','accepted','sending','sent'].includes(status)) mapped = 'Sent';

    if(sid && mapped){
      await updateByProviderId(sid, { status: mapped, error: null });
    }
    // Twilio requires 200 OK quickly
    res.status(200).send('OK');
  }catch(e){
    res.status(200).send('OK');
  }
});

module.exports = router;
