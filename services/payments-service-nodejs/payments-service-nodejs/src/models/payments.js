const { q, withTx } = require('../config/database');

async function createIntent({ method, amount, currency='KES', reference=null, description=null, customerId=null, metadata=null }){
  const { rows } = await q(
    `INSERT INTO payment_intents (method, amount, currency, reference, description, customer_id, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [method, amount, currency, reference, description, customerId, metadata]
  );
  await q(`INSERT INTO payment_events (intent_id, type, payload) VALUES ($1,'created',$2)`, [rows[0].id, metadata || {}]);
  return rows[0];
}

async function getIntent(id){
  const { rows } = await q('SELECT * FROM payment_intents WHERE id=$1', [id]);
  return rows[0] || null;
}

async function listIntents(filters={}, { limit=50, offset=0 } = {}){
  const where = []; const vals = []; let i=1;
  if(filters.status){ where.push(`status=$${i++}`); vals.push(filters.status); }
  if(filters.method){ where.push(`method=$${i++}`); vals.push(filters.method); }
  if(filters.reference){ where.push(`reference=$${i++}`); vals.push(filters.reference); }
  if(filters.customerId){ where.push(`customer_id=$${i++}`); vals.push(filters.customerId); }
  vals.push(limit); vals.push(offset);
  const sql = `SELECT * FROM payment_intents ${where.length?'WHERE '+where.join(' AND '):''} ORDER BY id DESC LIMIT $${i++} OFFSET $${i++}`;
  const { rows } = await q(sql, vals);
  return rows;
}

async function updateIntent(id, fields){
  const { status, provider, providerRef } = fields;
  const { rows } = await q(
    `UPDATE payment_intents
       SET status=COALESCE($2,status),
           provider=COALESCE($3,provider),
           provider_ref=COALESCE($4,provider_ref),
           updated_at=NOW()
     WHERE id=$1 RETURNING *`,
    [id, status || null, provider || null, providerRef || null]
  );
  return rows[0] || null;
}

async function addEvent(id, type, payload){
  await q(`INSERT INTO payment_events (intent_id, type, payload) VALUES ($1,$2,$3)`, [id, type, payload || {}]);
}

module.exports = { createIntent, getIntent, listIntents, updateIntent, addEvent };
