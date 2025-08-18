const jwt=require('jsonwebtoken'); const { v4:uuidv4 }=require('uuid'); const crypto=require('crypto'); const { q }=require('../config/database');
function signAccessToken(user){ const s=process.env.JWT_SECRET; const exp=process.env.JWT_EXPIRES_IN||'15m';
  return jwt.sign({ sub:String(user.id), email:user.email, emailVerified:!!user.is_email_verified, activeOrgId:user.active_org_id||null }, s, { expiresIn: exp }); }
async function signRefreshToken(user){ const s=process.env.JWT_REFRESH_SECRET; const jti=uuidv4();
  const token=jwt.sign({ sub:String(user.id), jti }, s, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN||'30d' });
  const hash=crypto.createHash('sha256').update(token).digest('hex');
  await q(`INSERT INTO refresh_tokens (user_id, jti, token_hash, expires_at) VALUES ($1,$2,$3, NOW() + INTERVAL '30 days')`, [user.id, jti, hash]);
  return { token, jti }; }
async function revokeRefreshToken(jti){ await q(`UPDATE refresh_tokens SET is_revoked=TRUE WHERE jti=$1`, [jti]); }
async function rotateRefreshToken(old){ const s=process.env.JWT_REFRESH_SECRET; const p=jwt.verify(old, s);
  const hash=crypto.createHash('sha256').update(old).digest('hex');
  const { rows }=await q(`SELECT * FROM refresh_tokens WHERE jti=$1 AND token_hash=$2 AND is_revoked=FALSE`, [p.jti, hash]);
  if(!rows.length) throw new Error('Invalid refresh token'); await q(`UPDATE refresh_tokens SET is_revoked=TRUE WHERE id=$1`, [rows[0].id]);
  const u=(await q(`SELECT * FROM users WHERE id=$1`, [Number(p.sub)])).rows[0]; if(!u) throw new Error('User not found'); const { token:newToken }=await signRefreshToken(u);
  await q(`UPDATE refresh_tokens SET replaced_by=$2 WHERE id=$1`, [rows[0].id, p.jti]); return { newToken, user:u }; }
function signEmailVerifyToken(user){ const s=process.env.EMAIL_VERIFY_SECRET||process.env.JWT_SECRET; const exp=process.env.EMAIL_VERIFY_EXPIRES_IN||'1d';
  return jwt.sign({ sub:String(user.id), email:user.email, purpose:'email-verify' }, s, { expiresIn: exp }); }
function verifyEmailVerifyToken(t){ const s=process.env.EMAIL_VERIFY_SECRET||process.env.JWT_SECRET; return jwt.verify(t, s); }
module.exports = { signAccessToken, signRefreshToken, rotateRefreshToken, revokeRefreshToken, signEmailVerifyToken, verifyEmailVerifyToken };
