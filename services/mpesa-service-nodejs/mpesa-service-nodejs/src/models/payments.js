const { q } = require('../config/database');
async function saveInitiated({ merchantRequestId, checkoutRequestId, phone, amount }){
  const { rows } = await q(`INSERT INTO mpesa_payments (merchant_request_id, checkout_request_id, phone, amount, status) VALUES ($1,$2,$3,$4,'Pending') RETURNING *`, [merchantRequestId, checkoutRequestId, phone, amount]);
  return rows[0];
}
async function updateFromCallback({ checkoutRequestId, resultCode, resultDesc, receiptNo, transactionDate, raw }){
  const { rows } = await q(`UPDATE mpesa_payments SET status = CASE WHEN $2=0 THEN 'Success' ELSE 'Failed' END, result_code=$2, result_desc=$3, receipt_no=$4, transaction_date=$5, raw_callback=$6, updated_at=NOW() WHERE checkout_request_id=$1 RETURNING *`, [checkoutRequestId, resultCode, resultDesc, receiptNo, transactionDate, raw]);
  return rows[0] || null;
}
async function list({ status, limit=50, offset=0 }){
  const where=[], vals=[]; let i=1;
  if(status){ where.push(`status=$${i++}`); vals.push(status); }
  vals.push(limit); vals.push(offset);
  const sql = `SELECT * FROM mpesa_payments ${where.length?'WHERE '+where.join(' AND '):''} ORDER BY id DESC LIMIT $${i++} OFFSET $${i++}`;
  const { rows } = await q(sql, vals); return rows;
}
async function get(id){ const { rows } = await q('SELECT * FROM mpesa_payments WHERE id=$1',[id]); return rows[0]||null; }
module.exports = { saveInitiated, updateFromCallback, list, get };
