const { q } = require('../config/database');

async function list({ code, country, activeOn, limit=100, offset=0 }){
  const where = ['is_deleted = FALSE'];
  const vals = []; let i=1;
  if(code){ where.push(`code = $${i++}`); vals.push(code); }
  if(country){ where.push(`country = $${i++}`); vals.push(country); }
  if(activeOn){
    where.push(`effective_from <= $${i} AND (effective_to IS NULL OR $${i} < effective_to)`); vals.push(activeOn); i++;
  }
  vals.push(limit, offset);
  const sql = `SELECT * FROM tax_rates WHERE ${where.join(' AND ')} ORDER BY code, effective_from DESC LIMIT $${i++} OFFSET $${i++}`;
  const { rows } = await q(sql, vals);
  return rows;
}

async function get(id){
  const { rows } = await q('SELECT * FROM tax_rates WHERE id=$1 AND is_deleted=FALSE', [id]);
  return rows[0] || null;
}

async function create(rate){
  const { rows } = await q(
    `INSERT INTO tax_rates (code, name, rate, inclusive, country, region, effective_from, effective_to)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [rate.code, rate.name, rate.rate, !!rate.inclusive, rate.country || null, rate.region || null, rate.effective_from, rate.effective_to || null]
  );
  return rows[0];
}

async function update(id, patch){
  const { rows } = await q(
    `UPDATE tax_rates SET
       code=COALESCE($2,code),
       name=COALESCE($3,name),
       rate=COALESCE($4,rate),
       inclusive=COALESCE($5,inclusive),
       country=COALESCE($6,country),
       region=COALESCE($7,region),
       effective_from=COALESCE($8,effective_from),
       effective_to=COALESCE($9,effective_to),
       updated_at=NOW()
     WHERE id=$1 AND is_deleted=FALSE RETURNING *`,
    [id, patch.code || null, patch.name || null, patch.rate ?? null, patch.inclusive ?? null, patch.country || null, patch.region || null, patch.effective_from || null, patch.effective_to || null]
  );
  return rows[0] || null;
}

async function softDelete(id){
  const { rows } = await q('UPDATE tax_rates SET is_deleted=TRUE, updated_at=NOW() WHERE id=$1 AND is_deleted=FALSE RETURNING *', [id]);
  return rows[0] || null;
}

async function findActiveByCode(code, atDate){
  const { rows } = await q(
    `SELECT * FROM tax_rates
     WHERE code=$1 AND is_deleted=FALSE
       AND effective_from <= $2 AND (effective_to IS NULL OR $2 < effective_to)
     ORDER BY effective_from DESC
     LIMIT 1`,
    [code, atDate]
  );
  return rows[0] || null;
}

module.exports = { list, get, create, update, softDelete, findActiveByCode };
