const amqp = require('amqplib');
const model = require('../models/audit');

let connection, channel;

async function startConsumer() {
  const url = process.env.RABBITMQ_URL;
  const queue = process.env.RABBITMQ_QUEUE || 'audit.events';
  if (!url) {
    console.log('RABBITMQ_URL not set; consumer disabled');
    return;
  }
  connection = await amqp.connect(url);
  channel = await connection.createChannel();
  await channel.assertQueue(queue, { durable: true });
  await channel.consume(queue, async (msg) => {
    if (!msg) return;
    try {
      const payload = JSON.parse(msg.content.toString());
      await model.insertEvent(payload);
      channel.ack(msg);
    } catch (e) {
      console.error('Consumer error, nacking message:', e);
      channel.nack(msg, false, false); // dead-letter on failure
    }
  }, { noAck: false });
  console.log(`Audit consumer listening on queue "${queue}"`);
}

async function stopConsumer() {
  try { await channel?.close(); } catch {}
  try { await connection?.close(); } catch {}
}

module.exports = { startConsumer, stopConsumer };
