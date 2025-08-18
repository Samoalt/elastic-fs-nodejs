const amqp = require('amqplib');
const { sendEmail } = require('../utils/mailer');
const { sendSms } = require('../utils/sms');
const { createNotification } = require('../models/notification');

let connection, channel;

async function startConsumer(){
  const url = process.env.RABBITMQ_URL;
  const queue = process.env.RABBITMQ_QUEUE || 'notifications.send';
  if(!url) { console.log('RABBITMQ_URL not set; notifications consumer disabled'); return; }
  connection = await amqp.connect(url);
  channel = await connection.createChannel();
  await channel.assertQueue(queue, { durable: true });
  await channel.consume(queue, async (msg) => {
    if(!msg) return;
    try{
      const payload = JSON.parse(msg.content.toString());
      if(payload.channel === 'email'){
        const info = await sendEmail(payload);
        await createNotification({ channel:'email', recipient: payload.to, subject: payload.subject, body: payload.html || payload.text || null, provider:'smtp', providerMessageId: info.messageId, status:'Sent' });
      } else if(payload.channel === 'sms'){
        const info = await sendSms({ to: payload.to, message: payload.message });
        await createNotification({ channel:'sms', recipient: payload.to, body: payload.message, provider:'twilio', providerMessageId: info.sid, status: info.status === 'queued' ? 'Pending' : 'Sent' });
      }
      channel.ack(msg);
    } catch(e){
      console.error('Notification consumer error:', e);
      channel.nack(msg, false, false); // dead-letter on failure
    }
  }, { noAck: false });
  console.log(`Notifications consumer listening on queue "${queue}"`);
}

async function stopConsumer(){
  try { await channel?.close(); } catch {}
  try { await connection?.close(); } catch {}
}

module.exports = { startConsumer, stopConsumer };
