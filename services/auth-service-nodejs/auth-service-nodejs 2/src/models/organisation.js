const { q }=require('../config/database');
async function createOrg({name,ownerUserId}){ const { rows }=await q(`INSERT INTO organisations (name,created_by) VALUES ($1,$2) RETURNING *`, [name, ownerUserId]);
  const org=rows[0]; await q(`INSERT INTO user_organisations (user_id,org_id,role) VALUES ($1,$2,'owner')`, [ownerUserId, org.id]);
  await q(`UPDATE users SET active_org_id=$2 WHERE id=$1`, [ownerUserId, org.id]); return org; }
async function listUserOrgs(userId){ const { rows }=await q(`SELECT o.*, uo.role FROM organisations o JOIN user_organisations uo ON uo.org_id=o.id WHERE uo.user_id=$1 ORDER BY o.id DESC`, [userId]); return rows; }
async function addMemberByEmail(orgId,email,role='member'){ const { rows }=await q(`SELECT id FROM users WHERE email=$1`, [email.toLowerCase()]); if(!rows.length) return null;
  const userId=rows[0].id; await q(`INSERT INTO user_organisations (user_id,org_id,role) VALUES ($1,$2,$3) ON CONFLICT (user_id,org_id) DO UPDATE SET role=EXCLUDED.role`, [userId, orgId, role]); return userId; }
async function userHasOrg(userId, orgId){ const { rows }=await q(`SELECT 1 FROM user_organisations WHERE user_id=$1 AND org_id=$2`, [userId, orgId]); return !!rows.length; }
module.exports={ createOrg, listUserOrgs, addMemberByEmail, userHasOrg };
