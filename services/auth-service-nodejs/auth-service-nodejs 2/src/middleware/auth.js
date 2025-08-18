const jwt=require('jsonwebtoken');
function auth(required=true){ return (req,res,next)=>{
  const h=req.headers.authorization||req.headers.Authorization; if(!h||!h.startsWith('Bearer ')){ if(required) return res.status(401).json({error:'Unauthorised'}); req.user=null; return next(); }
  try{ const p=jwt.verify(h.slice(7), process.env.JWT_SECRET); req.user={ id:Number(p.sub), email:p.email, emailVerified:!!p.emailVerified, activeOrgId:p.activeOrgId||null }; next(); }
  catch(e){ if(required) return res.status(401).json({error:'Invalid token'}); req.user=null; next(); } }; }
function requireVerified(req,res,next){ if(!req.user?.emailVerified) return res.status(403).json({error:'Email not verified'}); next(); }
module.exports={ auth, requireVerified };
