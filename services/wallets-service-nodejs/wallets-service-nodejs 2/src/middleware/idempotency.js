const crypto = require('crypto');
const { q } = require('../config/database');

function scopeFor(req){
  const route = req.baseUrl + req.path;
  const body = JSON.stringify(req.body || {});
  const hash = crypto.createHash('sha256').update(body).digest('hex');
  return `${route}:${hash}`;
}

async function storeResult(key, scope, status, payload){
  await q(`INSERT INTO idempotency_keys (idempotency_key, scope, response, status_code)
           VALUES ($1,$2,$3,$4)
           ON CONFLICT (idempotency_key, scope) DO UPDATE SET response=EXCLUDED.response, status_code=EXCLUDED.status_code`, 
           [key, scope, payload, status]);
}

async function idempotency(req, res, next){
  const required = String(process.env.IDEMPOTENCY_REQUIRED || 'true').toLowerCase() === 'true';
  const key = req.header('Idempotency-Key');
  if(!key && required){
    return res.status(428).json({ error: 'Idempotency-Key header required' });
  }
  if(!key) return next();

  const scope = scopeFor(req);
  const existing = await q(`SELECT response, status_code FROM idempotency_keys WHERE idempotency_key=$1 AND scope=$2`, [key, scope]);
  if(existing.rows.length){
    return res.status(existing.rows[0].status_code || 200).json(existing.rows[0].response || {});
  }

  // Wrap res.json to capture
  const json = res.json.bind(res);
  res.json = async (body) => {
    try{ await storeResult(key, scope, res.statusCode || 200, body); } catch {}
    return json(body);
  };
  next();
}

module.exports = { idempotency };
