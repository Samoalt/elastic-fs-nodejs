const axios = require('axios');

async function startMpesaStk({ baseUrl, phone, amount, reference, description }){
  const url = `${baseUrl.replace(/\/$/,'')}/api/v1/mpesa/stkpush`;
  const res = await axios.post(url, {
    phone, amount, accountReference: reference || 'ELASTICFS', description: description || 'Payment'
  }, { timeout: 15000 });
  return res.data; // expects MerchantRequestID & CheckoutRequestID
}

module.exports = { startMpesaStk };
