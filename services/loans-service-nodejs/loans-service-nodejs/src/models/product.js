const { q } = require('../config/database');

async function listProducts() {
  const { rows } = await q('SELECT * FROM loan_products ORDER BY id');
  return rows;
}
async function getProduct(id) {
  const { rows } = await q('SELECT * FROM loan_products WHERE id=$1', [id]);
  return rows[0] || null;
}
async function createProduct({ name, interestRate, termMonths, frequency = 'monthly', penaltyRate = 0 }) {
  const { rows } = await q(
    `INSERT INTO loan_products (name, interest_rate, term_months, frequency, penalty_rate)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [name, interestRate, termMonths, frequency, penaltyRate]
  );
  return rows[0];
}
async function updateProduct(id, { name, interestRate, termMonths, frequency, penaltyRate }) {
  const { rows } = await q(
    `UPDATE loan_products SET
       name=COALESCE($2,name),
       interest_rate=COALESCE($3,interest_rate),
       term_months=COALESCE($4,term_months),
       frequency=COALESCE($5,frequency),
       penalty_rate=COALESCE($6,penalty_rate)
     WHERE id=$1 RETURNING *`,
    [id, name, interestRate, termMonths, frequency, penaltyRate]
  );
  return rows[0] || null;
}

module.exports = { listProducts, getProduct, createProduct, updateProduct };
