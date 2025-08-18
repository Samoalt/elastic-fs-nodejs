const { q } = require('../config/database');

async function insertEvent(ev) {
  const { rows } = await q(
    `INSERT INTO audit_events
       (type, source, entity_type, entity_id, actor_id, actor_type, request_id, ip, user_agent, country, city, data)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING *`,
    [ev.type, ev.source || null, ev.entityType || null, ev.entityId || null, ev.actorId || null, ev.actorType || null,
     ev.requestId || null, ev.ip || null, ev.userAgent || null, ev.country || null, ev.city || null, ev.data || null]
  );
  return rows[0];
}

async function getEvent(id) {
  const { rows } = await q('SELECT * FROM audit_events WHERE id=$1', [id]);
  return rows[0] || null;
}

// Filters: type, actorId, entityType, entityId, source, from, to, q (ILIKE on JSON/text)
async function listEvents(filters = {}, { limit = 50, offset = 0 } = {}) {
  const where = [];
  const vals = [];
  let i = 1;

  if (filters.type)       { where.push(`type = $${i++}`);       vals.push(filters.type); }
  if (filters.actorId)    { where.push(`actor_id = $${i++}`);   vals.push(filters.actorId); }
  if (filters.entityType) { where.push(`entity_type = $${i++}`);vals.push(filters.entityType); }
  if (filters.entityId)   { where.push(`entity_id = $${i++}`);  vals.push(filters.entityId); }
  if (filters.source)     { where.push(`source = $${i++}`);     vals.push(filters.source); }
  if (filters.from)       { where.push(`created_at >= $${i++}`);vals.push(filters.from); }
  if (filters.to)         { where.push(`created_at <= $${i++}`);vals.push(filters.to); }
  if (filters.q)          { where.push(`(type ILIKE $${i} OR actor_id ILIKE $${i} OR entity_id ILIKE $${i} OR source ILIKE $${i})`); vals.push(`%${filters.q}%`); i++; }

  const sql = `SELECT * FROM audit_events
               ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
               ORDER BY created_at DESC, id DESC
               LIMIT $${i++} OFFSET $${i++}`;
  vals.push(limit);
  vals.push(offset);
  const { rows } = await q(sql, vals);
  return rows;
}

module.exports = { insertEvent, getEvent, listEvents };
