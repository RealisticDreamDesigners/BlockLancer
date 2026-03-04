import { query } from '../pool.js';

export async function getEscrowById(onChainId: number) {
  const result = await query(
    'SELECT * FROM escrows WHERE on_chain_id = $1',
    [onChainId]
  );
  return result.rows[0] || null;
}

export async function getEscrowCount() {
  const result = await query('SELECT COUNT(*) as count FROM escrows');
  return parseInt(result.rows[0].count, 10);
}

export async function getEscrowsByUser(address: string) {
  const result = await query(
    'SELECT * FROM escrows WHERE client = $1 OR freelancer = $1 ORDER BY on_chain_id DESC',
    [address]
  );
  return result.rows;
}

export async function getMilestonesByEscrow(escrowOnChainId: number) {
  const result = await query(
    'SELECT * FROM milestones WHERE escrow_on_chain_id = $1 ORDER BY milestone_index ASC',
    [escrowOnChainId]
  );
  return result.rows;
}

export async function getMilestoneById(escrowOnChainId: number, milestoneIndex: number) {
  const result = await query(
    'SELECT * FROM milestones WHERE escrow_on_chain_id = $1 AND milestone_index = $2',
    [escrowOnChainId, milestoneIndex]
  );
  return result.rows[0] || null;
}

export async function upsertEscrow(data: {
  on_chain_id: number;
  client: string;
  freelancer: string;
  total_amount: string;
  remaining_balance: string;
  status: number;
  description: string;
  created_at: number;
  end_date: number;
}) {
  const result = await query(
    `INSERT INTO escrows (on_chain_id, client, freelancer, total_amount, remaining_balance, status, description, created_at, end_date, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
     ON CONFLICT (on_chain_id) DO UPDATE SET
       client = EXCLUDED.client,
       freelancer = EXCLUDED.freelancer,
       total_amount = EXCLUDED.total_amount,
       remaining_balance = EXCLUDED.remaining_balance,
       status = EXCLUDED.status,
       description = EXCLUDED.description,
       created_at = EXCLUDED.created_at,
       end_date = EXCLUDED.end_date,
       updated_at = NOW()
     RETURNING *`,
    [
      data.on_chain_id, data.client, data.freelancer,
      data.total_amount, data.remaining_balance, data.status,
      data.description, data.created_at, data.end_date,
    ]
  );
  return result.rows[0];
}

export async function upsertMilestone(data: {
  escrow_on_chain_id: number;
  milestone_index: number;
  description: string;
  amount: string;
  deadline: number;
  status: number;
  submission_note: string;
  rejection_reason: string;
}) {
  const result = await query(
    `INSERT INTO milestones (escrow_on_chain_id, milestone_index, description, amount, deadline, status, submission_note, rejection_reason, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
     ON CONFLICT (escrow_on_chain_id, milestone_index) DO UPDATE SET
       description = EXCLUDED.description,
       amount = EXCLUDED.amount,
       deadline = EXCLUDED.deadline,
       status = EXCLUDED.status,
       submission_note = EXCLUDED.submission_note,
       rejection_reason = EXCLUDED.rejection_reason,
       updated_at = NOW()
     RETURNING *`,
    [
      data.escrow_on_chain_id, data.milestone_index, data.description,
      data.amount, data.deadline, data.status,
      data.submission_note, data.rejection_reason,
    ]
  );
  return result.rows[0];
}
