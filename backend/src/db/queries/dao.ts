import { query } from '../pool.js';

// ====== DAO Proposals ======

export async function getProposalById(onChainId: number) {
  const result = await query(
    'SELECT * FROM dao_proposals WHERE on_chain_id = $1',
    [onChainId]
  );
  return result.rows[0] || null;
}

export async function getProposalCount() {
  const result = await query('SELECT COUNT(*) as count FROM dao_proposals');
  return parseInt(result.rows[0].count, 10);
}

export async function getAllProposals() {
  const result = await query(
    'SELECT * FROM dao_proposals ORDER BY on_chain_id DESC'
  );
  return result.rows;
}

export async function getMaxProposalId(): Promise<number> {
  const result = await query('SELECT COALESCE(MAX(on_chain_id), 0) as max_id FROM dao_proposals');
  return parseInt(result.rows[0].max_id, 10);
}

export async function upsertProposal(data: {
  on_chain_id: number;
  proposer: string;
  proposal_type: number;
  target_contract_id: number;
  target_member?: string;
  description: string;
  yes_votes: number;
  no_votes: number;
  abstain_votes: number;
  total_eligible_voters: number;
  status: number;
  created_at: number;
  voting_ends_at: number;
  executed_at?: number;
}) {
  const result = await query(
    `INSERT INTO dao_proposals (on_chain_id, proposer, proposal_type, target_contract_id, target_member, description, yes_votes, no_votes, abstain_votes, total_eligible_voters, status, created_at, voting_ends_at, executed_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
     ON CONFLICT (on_chain_id) DO UPDATE SET
       proposer = EXCLUDED.proposer,
       proposal_type = EXCLUDED.proposal_type,
       target_contract_id = EXCLUDED.target_contract_id,
       target_member = EXCLUDED.target_member,
       description = EXCLUDED.description,
       yes_votes = EXCLUDED.yes_votes,
       no_votes = EXCLUDED.no_votes,
       abstain_votes = EXCLUDED.abstain_votes,
       total_eligible_voters = EXCLUDED.total_eligible_voters,
       status = EXCLUDED.status,
       created_at = EXCLUDED.created_at,
       voting_ends_at = EXCLUDED.voting_ends_at,
       executed_at = COALESCE(EXCLUDED.executed_at, dao_proposals.executed_at),
       updated_at = NOW()
     RETURNING *`,
    [
      data.on_chain_id, data.proposer, data.proposal_type,
      data.target_contract_id, data.target_member || null,
      data.description, data.yes_votes, data.no_votes,
      data.abstain_votes, data.total_eligible_voters,
      data.status, data.created_at, data.voting_ends_at,
      data.executed_at || null,
    ]
  );
  return result.rows[0];
}

// ====== DAO Members ======

export async function getDAOMemberByAddress(address: string) {
  const result = await query(
    'SELECT * FROM dao_members WHERE address = $1',
    [address]
  );
  return result.rows[0] || null;
}

export async function getDAOMemberCount() {
  const result = await query(
    'SELECT COUNT(*) as count FROM dao_members WHERE is_active = TRUE'
  );
  return parseInt(result.rows[0].count, 10);
}

export async function getAllDAOMembers() {
  const result = await query(
    'SELECT * FROM dao_members WHERE is_active = TRUE ORDER BY id ASC'
  );
  return result.rows;
}

export async function upsertDAOMember(address: string, isActive: boolean, joinedAt?: number) {
  const joinedValue = joinedAt || Math.floor(Date.now() / 1000);
  const result = await query(
    `INSERT INTO dao_members (address, is_active, joined_at, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (address) DO UPDATE SET
       is_active = EXCLUDED.is_active,
       joined_at = COALESCE(dao_members.joined_at, EXCLUDED.joined_at),
       updated_at = NOW()
     RETURNING *`,
    [address, isActive, joinedValue]
  );
  return result.rows[0];
}

// ====== Votes ======

export async function getVote(proposalOnChainId: number, proposalType: string, voter: string) {
  const result = await query(
    'SELECT * FROM votes WHERE proposal_on_chain_id = $1 AND proposal_type = $2 AND voter = $3',
    [proposalOnChainId, proposalType, voter]
  );
  return result.rows[0] || null;
}

export async function upsertVote(data: {
  proposal_on_chain_id: number;
  proposal_type: string;
  voter: string;
  vote: number;
  timestamp: number;
}) {
  const result = await query(
    `INSERT INTO votes (proposal_on_chain_id, proposal_type, voter, vote, timestamp)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (proposal_on_chain_id, proposal_type, voter) DO UPDATE SET
       vote = EXCLUDED.vote,
       timestamp = EXCLUDED.timestamp
     RETURNING *`,
    [data.proposal_on_chain_id, data.proposal_type, data.voter, data.vote, data.timestamp]
  );
  return result.rows[0];
}
