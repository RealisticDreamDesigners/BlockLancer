import { query } from '../pool.js';

export async function getPauseState(contractName: string) {
  const result = await query(
    'SELECT * FROM contract_pause_state WHERE contract_name = $1',
    [contractName]
  );
  return result.rows[0] || null;
}

export async function getAllPauseStates() {
  const result = await query('SELECT * FROM contract_pause_state ORDER BY contract_name');
  return result.rows;
}

export async function updatePauseState(data: {
  contract_name: string;
  is_paused: boolean;
  paused_by: string;
}) {
  const result = await query(
    `UPDATE contract_pause_state SET
       is_paused = $2,
       paused_by = $3,
       paused_at = CASE WHEN $2 THEN NOW() ELSE paused_at END,
       updated_at = NOW()
     WHERE contract_name = $1
     RETURNING *`,
    [data.contract_name, data.is_paused, data.paused_by]
  );
  return result.rows[0] || null;
}
