import pino from 'pino';
import { upsertProposal, upsertDAOMember, upsertVote } from '../../db/queries/dao.js';
import { confirmPendingTx } from '../../db/queries/pending-transactions.js';
import { readProposalState, readTotalProposals } from '../state-reader.js';

const logger = pino({ name: 'handler:dao' });

export async function handleDAOEvent(event: {
  txId: string;
  functionName: string;
  args: Record<string, any>;
  success: boolean;
  sender: string;
}) {
  if (!event.success) {
    logger.info({ txId: event.txId, fn: event.functionName }, 'DAO tx failed, skipping');
    return;
  }

  logger.info({ txId: event.txId, fn: event.functionName }, 'Processing DAO event');

  switch (event.functionName) {
    case 'propose-dispute-resolution':
    case 'propose-escrow-release':
    case 'propose-escrow-refund': {
      // Read the latest proposal ID
      const totalProposals = await readTotalProposals();
      const latestId = totalProposals - 1;
      if (latestId >= 0) {
        const state = await readProposalState(latestId);
        if (state) {
          await upsertProposal(state);
          logger.info({ proposalId: latestId }, 'Indexed new proposal');
        }
      }
      break;
    }

    case 'vote-on-proposal': {
      const proposalId = extractProposalId(event.args);
      if (proposalId !== null) {
        // Refresh proposal state (vote counts updated)
        const state = await readProposalState(proposalId);
        if (state) {
          await upsertProposal(state);
        }

        // Record the vote
        const voteType = extractVoteType(event.args);
        if (voteType !== null) {
          await upsertVote({
            proposal_on_chain_id: proposalId,
            proposal_type: 'dao',
            voter: event.sender,
            vote: voteType,
            timestamp: Math.floor(Date.now() / 1000),
          });
        }

        logger.info({ proposalId, voter: event.sender }, 'Indexed vote');
      }
      break;
    }

    case 'finalize-proposal-manual': {
      const proposalId = extractProposalId(event.args);
      if (proposalId !== null) {
        const state = await readProposalState(proposalId);
        if (state) {
          await upsertProposal(state);
          logger.info({ proposalId }, 'Updated finalized proposal');
        }
      }
      break;
    }

    case 'admin-add-dao-member': {
      const memberAddress = extractMemberAddress(event.args);
      if (memberAddress) {
        await upsertDAOMember(memberAddress, true, Math.floor(Date.now() / 1000));
        logger.info({ member: memberAddress }, 'Added DAO member');
      }
      break;
    }

    default:
      logger.warn({ fn: event.functionName }, 'Unknown DAO function');
  }

  await confirmPendingTx(event.txId);
}

function extractProposalId(args: Record<string, any>): number | null {
  const raw = args['proposal-id'] || args.proposalId || args[0];
  if (raw !== undefined) return parseInt(String(raw));
  return null;
}

function extractVoteType(args: Record<string, any>): number | null {
  const raw = args.vote || args[1];
  if (raw !== undefined) return parseInt(String(raw));
  return null;
}

function extractMemberAddress(args: Record<string, any>): string | null {
  return args.member || args[0] || null;
}
