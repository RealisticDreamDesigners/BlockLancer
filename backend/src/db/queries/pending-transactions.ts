import { query } from '../pool.js';

export async function createPendingTx(data: {
  tx_id: string;
  function_name: string;
  contract_name: string;
  args: Record<string, any>;
  sender_address: string;
}) {
  const result = await query(
    `INSERT INTO pending_transactions (tx_id, function_name, contract_name, args, sender_address, status, created_at, expires_at)
     VALUES ($1, $2, $3, $4, $5, 'pending', NOW(), NOW() + INTERVAL '30 minutes')
     ON CONFLICT (tx_id) DO UPDATE SET
       function_name = EXCLUDED.function_name,
       contract_name = EXCLUDED.contract_name,
       args = EXCLUDED.args,
       sender_address = EXCLUDED.sender_address
     RETURNING *`,
    [data.tx_id, data.function_name, data.contract_name, JSON.stringify(data.args), data.sender_address]
  );
  return result.rows[0];
}

export async function getPendingTxByTxId(txId: string) {
  const result = await query(
    'SELECT * FROM pending_transactions WHERE tx_id = $1',
    [txId]
  );
  return result.rows[0] || null;
}

export async function getPendingTxBySender(senderAddress: string) {
  const result = await query(
    "SELECT * FROM pending_transactions WHERE sender_address = $1 AND status = 'pending' AND expires_at > NOW() ORDER BY created_at DESC",
    [senderAddress]
  );
  return result.rows;
}

export async function confirmPendingTx(txId: string) {
  const result = await query(
    "UPDATE pending_transactions SET status = 'confirmed' WHERE tx_id = $1 RETURNING *",
    [txId]
  );
  return result.rows[0] || null;
}

export async function failPendingTx(txId: string) {
  const result = await query(
    "UPDATE pending_transactions SET status = 'failed' WHERE tx_id = $1 RETURNING *",
    [txId]
  );
  return result.rows[0] || null;
}

export async function cleanupExpiredPending() {
  const result = await query(
    "UPDATE pending_transactions SET status = 'expired' WHERE status = 'pending' AND expires_at < NOW()"
  );
  return result.rowCount || 0;
}

export async function getPendingByFunction(functionName: string, senderAddress?: string) {
  let sql = "SELECT * FROM pending_transactions WHERE function_name = $1 AND status = 'pending' AND expires_at > NOW()";
  const params: any[] = [functionName];

  if (senderAddress) {
    sql += ' AND sender_address = $2';
    params.push(senderAddress);
  }

  sql += ' ORDER BY created_at DESC';

  const result = await query(sql, params);
  return result.rows;
}
