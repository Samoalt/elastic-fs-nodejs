const { q, withTx } = require('../config/database');
const { AppError } = require('../utils/errors');

async function postEntry({ reference, description, entryDate, lines }) {
  const totalDebit = lines.reduce((s, l) => s + Number(l.debit || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + Number(l.credit || 0), 0);
  if (totalDebit <= 0 || totalCredit <= 0 || totalDebit !== totalCredit) {
    throw new AppError('Entry not balanced (debits must equal credits and be > 0)', 422);
  }

  return withTx(async (client) => {
    const entryIns = await client.query(
      `INSERT INTO journal_entries (reference, description, entry_date)
       VALUES ($1,$2,COALESCE($3, CURRENT_DATE))
       RETURNING id, reference, description, entry_date AS "entryDate", created_at`,
      [reference || null, description || null, entryDate || null]
    );
    const entry = entryIns.rows[0];

    const insertText = `
      INSERT INTO journal_lines (entry_id, account_id, debit, credit, memo)
      VALUES ($1,$2,$3,$4,$5)`;
    for (const l of lines) {
      if ((l.debit && l.credit) || (!l.debit && !l.credit)) {
        throw new AppError('Each line must have either debit or credit (not both)', 422);
      }
      await client.query(insertText, [entry.id, l.accountId, Number(l.debit || 0), Number(l.credit || 0), l.memo || null]);
    }
    const { rows: savedLines } = await client.query(
      `SELECT id, entry_id AS "entryId", account_id AS "accountId", debit, credit, memo
       FROM journal_lines WHERE entry_id=$1 ORDER BY id`, [entry.id]);
    return { entry, lines: savedLines };
  });
}

async function ledgerForAccount({ accountId }) {
  const { rows } = await q(
    `SELECT je.entry_date AS date, jl.debit, jl.credit, jl.memo, je.reference, je.description
     FROM journal_lines jl
     JOIN journal_entries je ON je.id = jl.entry_id
     WHERE jl.account_id = $1
     ORDER BY je.entry_date, jl.id`, [accountId]);
  return rows;
}

async function trialBalance() {
  const { rows } = await q(
    `SELECT a.id, a.code, a.name, a.type, 
            SUM(jl.debit) AS debit, SUM(jl.credit) AS credit,
            SUM(jl.debit - jl.credit) AS balance
     FROM accounts a
     LEFT JOIN journal_lines jl ON jl.account_id = a.id
     GROUP BY a.id, a.code, a.name, a.type
     ORDER BY a.code`);
  return rows;
}

module.exports = { postEntry, ledgerForAccount, trialBalance };
