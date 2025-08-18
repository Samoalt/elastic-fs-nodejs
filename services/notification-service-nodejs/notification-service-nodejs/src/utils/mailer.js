const nodemailer = require('nodemailer');

function buildTransport(){
  const secure = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure,
    auth: (process.env.SMTP_USER && process.env.SMTP_PASS) ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
  });
}

async function sendEmail({ to, subject, html, text }){
  const transporter = buildTransport();
  const from = process.env.EMAIL_FROM || 'no-reply@example.com';
  const info = await transporter.sendMail({ from, to, subject, html, text });
  return { messageId: info.messageId, info };
}

module.exports = { sendEmail };
