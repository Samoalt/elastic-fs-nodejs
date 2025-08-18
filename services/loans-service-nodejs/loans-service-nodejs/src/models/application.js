const { q, withTx } = require('../config/database');
const { generateSchedule } = require('../services/scheduleService');

async function createApplication({ productId, borrowerId, principal, startDate }) {
  return withTx(async (client) => {
    const prod = await client.query('SELECT * FROM loan_products WHERE id=$1', [productId]);
    if (!prod.rows.length) throw new Error('Product not found');
    const p = prod.rows[0];
    const appIns = await client.query(
      `INSERT INTO loan_applications (product_id, borrower_id, principal, start_date, status)
       VALUES ($1,$2,$3,$4,'draft') RETURNING *`,
      [productId, borrowerId, principal, startDate || null]
    );
    const app = appIns.rows[0];
    // pre-generate schedule (replace on approve if needed)
    const schedule = generateSchedule({
      principal: Number(principal),
      annualRate: Number(p.interest_rate),
      termMonths: Number(p.term_months),
      frequency: p.frequency,
      startDate: startDate
    });
    for (const row of schedule) {
      await client.query(
        `INSERT INTO loan_schedules (application_id, period_no, due_date, principal_due, interest_due, total_due, principal_balance)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [app.id, row.period_no, row.due_date, row.principal_due, row.interest_due, row.total_due, row.principal_balance]
      );
    }
    return app;
  });
}

async function getApplication(id) {
  const { rows } = await q('SELECT * FROM loan_applications WHERE id=$1', [id]);
  return rows[0] || null;
}

async function setStatus(id, status) {
  const col = status === 'approved' ? 'approved_at'
            : status === 'rejected' ? 'rejected_at'
            : status === 'disbursed' ? 'disbursed_at'
            : status === 'closed' ? 'closed_at'
            : null;
  const { rows } = await q(
    `UPDATE loan_applications
       SET status=$2, ${col ? col + "=NOW()," : ""} updated_at=NOW()
     WHERE id=$1 RETURNING *`,
    [id, status]
  );
  return rows[0] || null;
}

async function listSchedule(applicationId) {
  const { rows } = await q(
    `SELECT id, period_no, due_date, principal_due, interest_due, total_due,
            principal_paid, interest_paid, principal_balance
     FROM loan_schedules
     WHERE application_id=$1
     ORDER BY period_no`, [applicationId]);
  return rows;
}

module.exports = { createApplication, getApplication, setStatus, listSchedule };
