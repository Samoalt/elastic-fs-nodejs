const baseUrl = () => {
  if (process.env.MPESA_BASE_URL) return process.env.MPESA_BASE_URL;
  const env = (process.env.MPESA_ENV || 'sandbox').toLowerCase();
  return env === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';
};
function timestamp(){
  const d=new Date(); const pad=n=>String(n).padStart(2,'0');
  return d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate())+pad(d.getHours())+pad(d.getMinutes())+pad(d.getSeconds());
}
function lnmpPassword(shortcode, passkey, ts){ return Buffer.from(`${shortcode}${passkey}${ts}`).toString('base64'); }
let cachedToken=null, cachedAt=0;
async function getAccessToken(){
  const now=Date.now(); if(cachedToken && (now-cachedAt)<300000) return cachedToken;
  const key=process.env.MPESA_CONSUMER_KEY, secret=process.env.MPESA_CONSUMER_SECRET;
  if(!key||!secret) throw new Error('Missing MPESA_CONSUMER_KEY/SECRET');
  const auth = Buffer.from(`${key}:${secret}`).toString('base64');
  const res = await fetch(`${baseUrl()}/oauth/v1/generate?grant_type=client_credentials`, { headers: { Authorization: `Basic ${auth}` } });
  const json = await res.json();
  if(!res.ok || !json.access_token) throw new Error(`OAuth failed: ${res.status} ${JSON.stringify(json)}`);
  cachedToken=json.access_token; cachedAt=now; return cachedToken;
}
async function mpesaFetch(path, options={}){
  const token=await getAccessToken();
  const res=await fetch(`${baseUrl()}${path}`, { ...options, headers: { 'Authorization': `Bearer ${token}`, 'Content-Type':'application/json', ...(options.headers||{}) } });
  const data = await res.json().catch(()=>({}));
  if(!res.ok){ const err=new Error(`M-Pesa API error ${res.status}`); err.response=data; throw err; }
  return data;
}
module.exports = { baseUrl, timestamp, lnmpPassword, getAccessToken, mpesaFetch };
