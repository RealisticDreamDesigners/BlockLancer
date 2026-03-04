import { query } from '../pool.js';

export async function getDisputeById(onChainId: number) {
  const result = await query(
    'SELECT * FROM disputes WHERE on_chain_id = $1',
    [onChainId]
  );
  return result.rows[0] || null;
}

export async function getDisputeCount() {
  const result = await query('SELECT COUNT(*) as count FROM disputes');
  return parseInt(result.rows[0].count, 10);
}

export async function getDisputeByContractId(contractId: number) {
  const result = await query(
    'SELECT * FROM disputes WHERE contract_id = $1 ORDER BY on_chain_id DESC LIMIT 1',
    [contractId]
  );
  return result.rows[0] || null;
}

export async function getDisputesByUser(address: string) {
  const result = await query(
    'SELECT * FROM disputes WHERE client = $1 OR freelancer = $1 ORDER BY on_chain_id DESC',
    [address]
  );
  return result.rows;
}

export async function getAllDisputes() {
  const result = await query(
    'SELECT * FROM disputes ORDER BY on_chain_id DESC'
  );
  return result.rows;
}

export async function getMaxDisputeId(): Promise<number> {
  const result = await query('SELECT COALESCE(MAX(on_chain_id), 0) as max_id FROM disputes');
  return parseInt(result.rows[0].max_id, 10);
}

export async function upsertDispute(data: {
  on_chain_id: number;
  contract_id: number;
  opened_by: string;
  client: string;
  freelancer: string;
  reason: string;
  client_evidence?: string;
  freelancer_evidence?: string;
  status: number;
  resolution: number;
  created_at: number;
  resolved_at?: number;
}) {
  const result = await query(
    `INSERT INTO disputes (on_chain_id, contract_id, opened_by, client, freelancer, reason, client_evidence, freelancer_evidence, status, resolution, created_at, resolved_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
     ON CONFLICT (on_chain_id) DO UPDATE SET
       contract_id = EXCLUDED.contract_id,
       opened_by = EXCLUDED.opened_by,
       client = EXCLUDED.client,
       freelancer = EXCLUDED.freelancer,
       reason = EXCLUDED.reason,
       client_evidence = COALESCE(EXCLUDED.client_evidence, disputes.client_evidence),
       freelancer_evidence = COALESCE(EXCLUDED.freelancer_evidence, disputes.freelancer_evidence),
       status = EXCLUDED.status,
       resolution = EXCLUDED.resolution,
       created_at = EXCLUDED.created_at,
       resolved_at = COALESCE(EXCLUDED.resolved_at, disputes.resolved_at),
       updated_at = NOW()
     RETURNING *`,
    [
      data.on_chain_id, data.contract_id, data.opened_by,
      data.client, data.freelancer, data.reason,
      data.client_evidence || null, data.freelancer_evidence || null,
      data.status, data.resolution, data.created_at,
      data.resolved_at || null,
    ]
  );
  return result.rows[0];
}
