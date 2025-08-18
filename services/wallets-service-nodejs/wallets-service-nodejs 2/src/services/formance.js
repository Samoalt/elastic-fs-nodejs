const axios = require('axios');
require('dotenv').config();

function client(){
  const base = process.env.FORMANCE_BASE_URL;
  if(!base) throw new Error('FORMANCE_BASE_URL not set');
  const token = process.env.FORMANCE_TOKEN;
  const headers = { 'Content-Type':'application/json' };
  if(token) headers['Authorization'] = `Bearer ${token}`;
  const inst = axios.create({ baseURL: base.replace(/\/$/, ''), headers, timeout: 15000 });
  return inst;
}

function ledgerPath(){
  const l = process.env.FORMANCE_LEDGER || 'default';
  return `/api/ledger/${encodeURIComponent(l)}`;
}

// Ensure account exists (Formance will upsert on transaction; but we try to read first)
async function getAccount(name){
  const c = client();
  const res = await c.get(`${ledgerPath()}/accounts/${encodeURIComponent(name)}`).catch(e => {
    if(e.response && e.response.status === 404) return { data: null };
    throw e;
  });
  return res.data;
}

async function getBalances(name){
  const c = client();
  // Try balances endpoint; fallback to account read
  try{
    const r = await c.get(`${ledgerPath()}/accounts/${encodeURIComponent(name)}/balances`);
    return r.data;
  }catch(e){
    const acc = await getAccount(name);
    return acc && acc.data ? (acc.data.balances || {}) : {};
  }
}

async function postTransaction({ postings, metadata, reference }){
  const c = client();
  const payload = { postings, metadata: metadata || {}, reference: reference || undefined };
  const res = await c.post(`${ledgerPath()}/transactions`, payload);
  return res.data;
}

module.exports = { getAccount, getBalances, postTransaction };
