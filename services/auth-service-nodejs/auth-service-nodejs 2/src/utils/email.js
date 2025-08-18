const nodemailer = require('nodemailer');
function buildTransport(){ const secure = String(process.env.SMTP_SECURE||'false').toLowerCase()==='true';
  return nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT||587), secure,
    auth: (process.env.SMTP_USER && process.env.SMTP_PASS) ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined }); }
async function sendMail({ to, subject, html, text }){ const t=buildTransport(); const from=process.env.EMAIL_FROM||'no-reply@example.com'; return t.sendMail({ from,to,subject,html,text }); }
module.exports = { sendMail };
