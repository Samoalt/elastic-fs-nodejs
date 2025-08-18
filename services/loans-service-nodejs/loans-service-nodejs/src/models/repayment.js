const { withTx } = require('../config/database');

function round2(x) { return Math.round((x + Number.EPSILON) * 100) / 100; }

async function recordRepayment({ applicationId, amount, paidAt }) {
  return withTx(async (client) => {
    // Insert repayment record
    const rep = await client.query(
      `INSERT INTO loan_repayments (application_id, amount, paid_at)
       VALUES ($1,$2,COALESCE($3,NOW())) RETURNING *`,
      [applicationId, amount, paidAt || null]
    );

    // Allocate to schedule rows in order
    let remaining = Number(amount);
    const sched = await client.query(
      `SELECT * FROM loan_schedules WHERE application_id=$1 ORDER BY period_no`, [applicationId]);
    for (const row of sched.rows) {
      if (remaining <= 0) break;
      const interestDueRem = round2(row.interest_due - row.interest_paid);
      const principalDueRem = round2(row.principal_due - row.principal_paid);

      let payInterest = 0, payPrincipal = 0;
      if (interestDueRem > 0) {
        payInterest = Math.min(interestDueRem, remaining);
        remaining = round2(remaining - payInterest);
      }
      if (remaining > 0 && principalDueRem > 0) {
        payPrincipal = Math.min(principalDueRem, remaining);
        remaining = round2(remaining - payPrincipal);
      }
      if (payInterest > 0 || payPrincipal > 0) {
        await client.query(
          `UPDATE loan_schedules
           SET interest_paid = interest_paid + $1,
               principal_paid = principal_paid + $2
           WHERE id=$3`,
          [payInterest, payPrincipal, row.id]
        );
      }
    }

    // Close the loan if fully paid
    const agg = await client.query(
      `SELECT SUM(principal_due - principal_paid) AS principal_remaining,
              SUM(interest_due - interest_paid) AS interest_remaining
       FROM loan_schedules WHERE application_id=$1`, [applicationId]);
    const pr = Number(agg.rows[0].principal_remaining || 0);
    const ir = Number(agg.rows[0].interest_remaining || 0);
    if (round2(pr + ir) <= 0) {
      await client.query(`UPDATE loan_applications SET status='closed', closed_at=NOW() WHERE id=$1`, [applicationId]);
    }

    return rep.rows[0];
  });
}

async function listRepayments(applicationId) {
  const { rows } = await (await import('node:process')).then(() => null)
  return withTx(async (client) => {
    const res = await client.query(
      `SELECT id, amount, paid_at, created_at
       FROM loan_repayments WHERE application_id=$1 ORDER BY paid_at DESC, id DESC`,
      [applicationId]
    );
    return res.rows;
  });
}

module.exports = { recordRepayment, listRepayments };
