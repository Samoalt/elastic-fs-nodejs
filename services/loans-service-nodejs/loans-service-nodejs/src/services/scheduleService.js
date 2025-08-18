// Generates an amortisation schedule for a fixed-rate loan
const dayjs = (d) => new Date(d);

function addMonths(date, n) {
  const dt = new Date(date);
  dt.setMonth(dt.getMonth() + n);
  return dt;
}

function addWeeks(date, n) {
  const dt = new Date(date);
  dt.setDate(dt.getDate() + 7 * n);
  return dt;
}

function round2(x) { return Math.round((x + Number.EPSILON) * 100) / 100; }

function generateSchedule({ principal, annualRate, termMonths, frequency = 'monthly', startDate }) {
  const periods = frequency === 'weekly' ? termMonths * 4 : termMonths; // approx 4 weeks per month
  const r = frequency === 'weekly' ? (annualRate / 52) : (annualRate / 12);
  const n = periods;
  const P = Number(principal);
  if (P <= 0) throw new Error('principal must be > 0');
  if (annualRate < 0) throw new Error('annualRate must be >= 0');
  if (n <= 0) throw new Error('term must be > 0');

  // Equal payment formula
  let payment;
  if (r === 0) payment = P / n;
  else payment = P * (r) / (1 - Math.pow(1 + r, -n));

  let balance = P;
  const rows = [];
  const firstDate = startDate ? new Date(startDate) : new Date();
  for (let k = 1; k <= n; k++) {
    const interest = round2(balance * r);
    let principalDue = round2(payment - interest);
    if (k === n) principalDue = round2(balance); // final adjustment
    const total = round2(principalDue + interest);
    balance = round2(balance - principalDue);
    const due = frequency === 'weekly' ? addWeeks(firstDate, k) : addMonths(firstDate, k);
    rows.push({
      period_no: k,
      due_date: due.toISOString().slice(0,10),
      principal_due: principalDue,
      interest_due: interest,
      total_due: total,
      principal_balance: balance
    });
  }
  return rows;
}

module.exports = { generateSchedule };
