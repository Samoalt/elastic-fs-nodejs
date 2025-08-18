const { q }=require('../config/database'); const bcrypt=require('bcrypt');
async function createUser({email,password,name}){ const hash=await bcrypt.hash(password,12);
  const { rows }=await q(`INSERT INTO users (email,password_hash,name) VALUES ($1,$2,$3) RETURNING *`, [email.toLowerCase(), hash, name||null]); return rows[0]; }
async function findByEmail(email){ const { rows }=await q(`SELECT * FROM users WHERE email=$1`, [email.toLowerCase()]); return rows[0]||null; }
async function findById(id){ const { rows }=await q(`SELECT * FROM users WHERE id=$1`, [id]); return rows[0]||null; }
async function updateProfile(id,{name,phone}){ const { rows }=await q(`UPDATE users SET name=COALESCE($2,name), phone=COALESCE($3,phone), updated_at=NOW() WHERE id=$1 RETURNING *`, [id, name||null, phone||null]); return rows[0]||null; }
async function markEmailVerified(id){ const { rows }=await q(`UPDATE users SET is_email_verified=TRUE, updated_at=NOW() WHERE id=$1 RETURNING *`, [id]); return rows[0]||null; }
async function setActiveOrg(id,orgId){ const { rows }=await q(`UPDATE users SET active_org_id=$2 WHERE id=$1 RETURNING *`, [id, orgId]); return rows[0]||null; }
module.exports={ createUser, findByEmail, findById, updateProfile, markEmailVerified, setActiveOrg };
