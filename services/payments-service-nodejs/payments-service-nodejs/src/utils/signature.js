const crypto = require('crypto');
function sign(payload, secret){ return crypto.createHmac('sha256', secret).update(payload).digest('hex'); }
function verify(payload, signature, secret){ try { const expected = sign(payload, secret); return crypto.timingSafeEqual(Buffer.from(signature||'', 'hex'), Buffer.from(expected, 'hex')); } catch { return false; } }
module.exports = { sign, verify };
