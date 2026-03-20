import { FastifyInstance } from 'fastify';
import {
  getProposalById,
  getProposalCount,
  getAllProposals,
  getDAOMemberByAddress,
  getDAOMemberCount,
  getVote,
  getMaxProposalId,
  upsertProposal,
} from '../../db/queries/dao.js';
import { readDAOStats, readDAOMemberStatus, readProposalState, readTotalProposals } from '../../chainhook/state-reader.js';
import type { ApiProposal, ApiDAOStats } from '../../types/index.js';
import pino from 'pino';

const logger = pino({ name: 'dao-routes' });
const SUPERMAJORITY_THRESHOLD = 70;

function toApiProposal(row: any): ApiProposal {
  const totalVotes = row.yes_votes + row.no_votes + row.abstain_votes;
  const votingProgress = row.total_eligible_voters > 0
    ? (totalVotes / row.total_eligible_voters) * 100
    : 0;
  const requiredVotes = Math.ceil((row.total_eligible_voters * SUPERMAJORITY_THRESHOLD) / 100);
  const hasReachedThreshold = row.yes_votes >= requiredVotes;

  return {
    id: row.on_chain_id,
    proposer: row.proposer,
    proposalType: row.proposal_type,
    targetContractId: row.target_contract_id,
    targetMember: row.target_member || undefined,
    description: row.description,
    yesVotes: row.yes_votes,
    noVotes: row.no_votes,
    abstainVotes: row.abstain_votes,
    totalEligibleVoters: row.total_eligible_voters,
    status: row.status,
    createdAt: row.created_at,
    votingEndsAt: row.voting_ends_at,
    executedAt: row.executed_at || undefined,
    votingProgress,
    hasReachedThreshold,
  };
}

/**
 * Catch up on DAO proposals that exist on-chain but not in our DB.
 */
async function catchUpProposals(): Promise<number> {
  let newFound = 0;
  try {
    // next-proposal-id is 0-indexed counter. If it's 3, proposals 0,1,2 may exist.
    const nextId = await readTotalProposals();
    if (nextId <= 0) return 0;

    const dbCount = await getProposalCount();
    const maxDbId = await getMaxProposalId();

    // If DB is empty but proposals exist on-chain, start from 0
    const startId = dbCount === 0 ? 0 : maxDbId + 1;

    if (startId >= nextId) return 0;

    logger.info({ startId, nextId, dbCount }, 'Catching up DAO proposals');

    for (let id = startId; id < nextId; id++) {
      try {
        // Skip if already in DB
        const existing = await getProposalById(id);
        if (existing) continue;

        const state = await readProposalState(id);
        if (!state) continue; // skip missing, try next
        await upsertProposal(state);
        newFound++;
        logger.info({ proposalId: id }, 'Caught up DAO proposal');
      } catch (err) {
        logger.warn({ err, proposalId: id }, 'Failed to catch up DAO proposal');
      }
    }
  } catch (err) {
    logger.warn({ err }, 'Failed to check on-chain proposal count');
  }
  return newFound;
}

export async function daoRoutes(app: FastifyInstance) {
  // GET /api/dao/stats
  app.get('/api/dao/stats', async () => {
    // DB member count is authoritative (on-chain member-count var has init quirk)
    const dbMemberCount = await getDAOMemberCount();

    // Get other stats from blockchain
    const chainStats = await readDAOStats();
    const proposalCount = await getProposalCount();

    return {
      totalMembers: dbMemberCount,
      maxMembers: chainStats?.maxMembers || 100,
      nextProposalId: chainStats?.nextProposalId || proposalCount,
      supermajorityThreshold: chainStats?.supermajorityThreshold || SUPERMAJORITY_THRESHOLD,
      memberCount: dbMemberCount,
    };
  });

  // GET /api/proposals/:id — DB first, chain catch-up if missing
  app.get<{ Params: { id: string } }>('/api/proposals/:id', async (request, reply) => {
    const id = parseInt(request.params.id, 10);
    if (isNaN(id)) return reply.code(400).send({ error: 'Invalid proposal ID' });

    let proposal = await getProposalById(id);

    // If not in DB, try chain catch-up
    if (!proposal) {
      try {
        const onChainState = await readProposalState(id);
        if (onChainState) {
          await upsertProposal(onChainState);
          proposal = await getProposalById(id);
        }
      } catch (err) {
        logger.warn({ err, proposalId: id }, 'Failed to catch up proposal from chain');
      }
    }

    if (!proposal) return reply.code(404).send({ error: 'Proposal not found' });

    return toApiProposal(proposal);
  });

  // GET /api/proposals/count — DB first, background catch-up
  app.get('/api/proposals/count', async () => {
    const count = await getProposalCount();
    // Fire-and-forget catch-up for next request
    catchUpProposals().catch(() => {});
    return { count };
  });

  // GET /api/proposals/all — DB first, background catch-up
  app.get('/api/proposals/all', async () => {
    const proposals = await getAllProposals();

    // Fire-and-forget catch-up for next request
    catchUpProposals().catch(() => {});

    return proposals.map(toApiProposal);
  });

  // GET /api/dao/member/:address
  app.get<{ Params: { address: string } }>('/api/dao/member/:address', async (request, reply) => {
    const { address } = request.params;
    if (!address) return reply.code(400).send({ error: 'Address required' });

    const count = await getDAOMemberCount();

    // Check DB first
    const dbMember = await getDAOMemberByAddress(address);
    if (dbMember) {
      return {
        isMember: dbMember.is_active,
        memberCount: count,
      };
    }

    // Not in DB — return false with DB count (poller will pick up new members)
    return { isMember: false, memberCount: count };
  });

  // GET /api/dao/members/count
  app.get('/api/dao/members/count', async () => {
    const count = await getDAOMemberCount();
    return { count };
  });

  // GET /api/dao/vote/:proposalId/:voter
  app.get<{ Params: { proposalId: string; voter: string } }>(
    '/api/dao/vote/:proposalId/:voter',
    async (request, reply) => {
      const proposalId = parseInt(request.params.proposalId, 10);
      const { voter } = request.params;
      if (isNaN(proposalId)) return reply.code(400).send({ error: 'Invalid proposal ID' });

      const vote = await getVote(proposalId, 'dao', voter);
      if (!vote) return reply.code(404).send({ error: 'Vote not found' });

      return {
        proposalId: vote.proposal_on_chain_id,
        voter: vote.voter,
        vote: vote.vote,
        timestamp: vote.timestamp,
      };
    }
  );
}
