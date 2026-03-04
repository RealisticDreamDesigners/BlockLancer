import { query } from '../pool.js';

// ====== Committee Members ======

export async function getCommitteeMemberByAddress(address: string) {
  const result = await query(
    'SELECT * FROM committee_members WHERE address = $1',
    [address]
  );
  return result.rows[0] || null;
}

export async function getCommitteeMemberCount() {
  const result = await query(
    'SELECT COUNT(*) as count FROM committee_members WHERE is_active = TRUE'
  );
  return parseInt(result.rows[0].count, 10);
}

export async function upsertCommitteeMember(address: string, isActive: boolean, addedAt?: number) {
  const result = await query(
    `INSERT INTO committee_members (address, is_active, added_at, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (address) DO UPDATE SET
       is_active = EXCLUDED.is_active,
       added_at = COALESCE(EXCLUDED.added_at, committee_members.added_at),
       updated_at = NOW()
     RETURNING *`,
    [address, isActive, addedAt || null]
  );
  return result.rows[0];
}

export async function getAllCommitteeMembers() {
  const result = await query(
    'SELECT * FROM committee_members WHERE is_active = TRUE ORDER BY added_at ASC'
  );
  return result.rows;
}

// ====== Membership Proposals ======

export async function getMaxMembershipProposalId(): Promise<number> {
  const result = await query('SELECT COALESCE(MAX(on_chain_id), 0) as max_id FROM membership_proposals');
  return parseInt(result.rows[0].max_id, 10);
}

export async function getAllMembershipProposals() {
  const result = await query(
    'SELECT * FROM membership_proposals ORDER BY on_chain_id ASC'
  );
  return result.rows;
}

export async function getPendingMembershipProposals() {
  const result = await query(
    'SELECT * FROM membership_proposals WHERE status = 0 ORDER BY on_chain_id DESC'
  );
  return result.rows;
}

export async function getMembershipProposalById(onChainId: number) {
  const result = await query(
    'SELECT * FROM membership_proposals WHERE on_chain_id = $1',
    [onChainId]
  );
  return result.rows[0] || null;
}

export async function upsertMembershipProposal(data: {
  on_chain_id: number;
  nominee: string;
  proposer: string;
  stake_amount: string;
  approvals: number;
  rejections: number;
  status: number;
  created_at: number;
  decided_at?: number;
}) {
  const result = await query(
    `INSERT INTO membership_proposals (on_chain_id, nominee, proposer, stake_amount, approvals, rejections, status, created_at, decided_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
     ON CONFLICT (on_chain_id) DO UPDATE SET
       nominee = EXCLUDED.nominee,
       proposer = EXCLUDED.proposer,
       stake_amount = EXCLUDED.stake_amount,
       approvals = EXCLUDED.approvals,
       rejections = EXCLUDED.rejections,
       status = EXCLUDED.status,
       created_at = EXCLUDED.created_at,
       decided_at = COALESCE(EXCLUDED.decided_at, membership_proposals.decided_at),
       updated_at = NOW()
     RETURNING *`,
    [
      data.on_chain_id, data.nominee, data.proposer,
      data.stake_amount, data.approvals, data.rejections,
      data.status, data.created_at, data.decided_at || null,
    ]
  );
  return result.rows[0];
}
