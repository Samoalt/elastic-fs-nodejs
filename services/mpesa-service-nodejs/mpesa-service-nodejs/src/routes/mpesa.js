const express = require('express');
const Joi = require('joi');
const { mpesaFetch, timestamp, lnmpPassword } = require('../utils/mpesa');
const { saveInitiated, updateFromCallback, list, get } = require('../models/payments');
const router = express.Router();

const stkSchema = Joi.object({
  phone: Joi.string().pattern(/^254\d{9}$/).required(),
  amount: Joi.number().positive().required(),
  accountReference: Joi.string().default('ELASTICFS'),
  description: Joi.string().default('Payment')
});

router.post('/stkpush', async (req, res)=>{
  try{
    const { error, value } = stkSchema.validate(req.body);
    if(error) return res.status(400).json({ error: error.details[0].message });
    const { phone, amount, accountReference, description } = value;
    const ts = timestamp();
    const shortcode = process.env.MPESA_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;
    if(!shortcode || !passkey) return res.status(500).json({ error: 'Missing MPESA_SHORTCODE/PASSKEY' });

    const payload = {
      BusinessShortCode: shortcode,
      Password: lnmpPassword(shortcode, passkey, ts),
      Timestamp: ts,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phone,
      PartyB: shortcode,
      PhoneNumber: phone,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: accountReference,
      TransactionDesc: description
    };
    const data = await mpesaFetch('/mpesa/stkpush/v1/processrequest', { method:'POST', body: JSON.stringify(payload) });
    await saveInitiated({ merchantRequestId: data.MerchantRequestID, checkoutRequestId: data.CheckoutRequestID, phone, amount });
    res.status(202).json({ message:'STK Push initiated', ...data });
  }catch(e){ res.status(502).json({ error:e.message, details: e.response || null }); }
});

router.post('/callback', async (req, res)=>{
  try{
    const cb = req.body?.Body?.stkCallback;
    if(!cb) return res.status(400).json({ error:'Invalid callback payload' });
    let receiptNo=null, transactionDate=null;
    if(Array.isArray(cb.CallbackMetadata?.Item)){
      for(const it of cb.CallbackMetadata.Item){
        if(it.Name==='MpesaReceiptNumber') receiptNo = it.Value;
        if(it.Name==='TransactionDate') transactionDate = String(it.Value);
      }
    }
    await updateFromCallback({
      checkoutRequestId: cb.CheckoutRequestID,
      resultCode: cb.ResultCode,
      resultDesc: cb.ResultDesc,
      receiptNo, transactionDate, raw: req.body
    });
    res.json({ ResultCode:0, ResultDesc:'Accepted' });
  }catch(e){
    res.json({ ResultCode:0, ResultDesc:'Accepted' });
  }
});

router.get('/payments', async (req,res)=>{
  try{ const rows = await list({ status:req.query.status, limit:Number(req.query.limit||50), offset:Number(req.query.offset||0) }); res.json({ items: rows }); }
  catch(e){ res.status(500).json({ error:e.message }); }
});
router.get('/payments/:id', async (req,res)=>{
  try{ const row = await get(Number(req.params.id)); if(!row) return res.status(404).json({ error:'Not found' }); res.json(row); }
  catch(e){ res.status(500).json({ error:e.message }); }
});

router.post('/c2b/register-url', async (req,res)=>{
  try{
    const data = await mpesaFetch('/mpesa/c2b/v1/registerurl', { method:'POST', body: JSON.stringify({
      ShortCode: process.env.MPESA_SHORTCODE,
      ResponseType: 'Completed',
      ConfirmationURL: process.env.MPESA_C2B_CONFIRMATION_URL,
      ValidationURL: process.env.MPESA_C2B_VALIDATION_URL
    })});
    res.json(data);
  }catch(e){ res.status(502).json({ error:e.message, details:e.response||null }); }
});
router.post('/c2b/validation', async (req,res)=>{ res.json({ ResultCode:0, ResultDesc:'Accepted' }); });
router.post('/c2b/confirmation', async (req,res)=>{ res.json({ ResultCode:0, ResultDesc:'Accepted' }); });

module.exports = router;
