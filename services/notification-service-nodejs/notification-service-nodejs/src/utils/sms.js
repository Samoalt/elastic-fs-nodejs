const twilio = require('twilio');

function buildClient(){
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if(!sid || !token) throw new Error('Missing TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN');
  return twilio(sid, token);
}

async function sendSms({ to, message }){
  const from = process.env.TWILIO_FROM;
  if(!from) throw new Error('Missing TWILIO_FROM');
  const client = buildClient();
  const res = await client.messages.create({
    to,
    from,
    body: message,
    statusCallback: process.env.TWILIO_STATUS_WEBHOOK
  });
  return { sid: res.sid, status: res.status };
}

module.exports = { sendSms };
