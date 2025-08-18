const { q } = require('../config/database');

async function createNotification({ channel, recipient, subject=null, body=null, provider=null, providerMessageId=null, status='Pending' }){
  const { rows } = await q(
    `INSERT INTO notifications (channel, recipient, subject, body, provider, provider_message_id, status, sent_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7, CASE WHEN $7='Sent' THEN NOW() ELSE NULL END)
     RETURNING *`,
    [channel, recipient, subject, body, provider, providerMessageId, status]
  );
  return rows[0];
}

async function updateByProviderId(providerMessageId, fields){
  const { status, error } = fields;
  const { rows } = await q(
    `UPDATE notifications
       SET status = COALESCE($2, status),
           error  = COALESCE($3, error),
           sent_at = CASE WHEN $2='Sent' OR $2='Delivered' THEN NOW() ELSE sent_at END
     WHERE provider_message_id=$1
     RETURNING *`,
    [providerMessageId, status || null, error || null]
  );
  return rows[0] || null;
}

async function list({ status, channel, to, limit=50, offset=0 }){
  const where = []; const vals = []; let i=1;
  if(status){ where.push(`status=$${i++}`); vals.push(status); }
  if(channel){ where.push(`channel=$${i++}`); vals.push(channel); }
  if(to){ where.push(`recipient=$${i++}`); vals.push(to); }
  vals.push(limit); vals.push(offset);
  const sql = `SELECT * FROM notifications ${where.length?'WHERE '+where.join(' AND '):''} ORDER BY id DESC LIMIT $${i++} OFFSET $${i++}`;
  const { rows } = await q(sql, vals); return rows;
}

async function get(id){
  const { rows } = await q('SELECT * FROM notifications WHERE id=$1', [id]);
  return rows[0] || null;
}

module.exports = { createNotification, updateByProviderId, list, get };
