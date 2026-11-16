const pool = require('../config/db');

async function generateTransactionNumber(type, client = pool) {
  const prefix = type === 'stock_in' ? 'SI' : 'SO';
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  const pattern = `${prefix}-${dateStr}-%`;

  const { rows } = await client.query(
    `SELECT transaction_number FROM stock_transactions
     WHERE transaction_number LIKE $1
     ORDER BY transaction_number DESC
     LIMIT 1
     FOR UPDATE`,
    [pattern]
  );

  let seq = 1;
  if (rows.length > 0) {
    const parts = rows[0].transaction_number.split('-');
    if (parts.length === 3) {
      seq = parseInt(parts[2], 10) + 1;
    }
  }

  return `${prefix}-${dateStr}-${String(seq).padStart(4, '0')}`;
}

module.exports = { generateTransactionNumber };
