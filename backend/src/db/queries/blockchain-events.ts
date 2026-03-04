import { query } from '../pool.js';

export async function insertEvent(data: {
  tx_id: string;
  block_height: number;
  contract_name: string;
  function_name: string;
  args: Record<string, any>;
  success: boolean;
  sender: string;
}) {
  const result = await query(
    `INSERT INTO blockchain_events (tx_id, block_height, contract_name, function_name, args, success, sender, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     RETURNING *`,
    [data.tx_id, data.block_height, data.contract_name, data.function_name, JSON.stringify(data.args), data.success, data.sender]
  );
  return result.rows[0];
}

export async function getEventByTxId(txId: string) {
  const result = await query(
    'SELECT * FROM blockchain_events WHERE tx_id = $1',
    [txId]
  );
  return result.rows;
}
