const express=require('express'); const Joi=require('joi'); const { auth, requireVerified }=require('../middleware/auth'); const { updateProfile, findById }=require('../models/user');
const router=express.Router();
router.get('/', auth(true), async (req,res)=>{ const u=await findById(req.user.id); res.json({ id:u.id, email:u.email, name:u.name, phone:u.phone, emailVerified:!!u.is_email_verified, activeOrgId:u.active_org_id }); });
router.put('/', auth(true), requireVerified, async (req,res)=>{ const s=Joi.object({ name:Joi.string().allow('',null), phone:Joi.string().allow('',null) });
  const { error, value }=s.validate(req.body||{}); if(error) return res.status(400).json({error:error.details[0].message}); const u=await updateProfile(req.user.id, value);
  res.json({ id:u.id, email:u.email, name:u.name, phone:u.phone, emailVerified:!!u.is_email_verified, activeOrgId:u.active_org_id }); });
module.exports=router;
