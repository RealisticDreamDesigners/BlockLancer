import pino from 'pino';
import { upsertCommitteeMember, upsertMembershipProposal } from '../../db/queries/committee.js';
import { upsertVote } from '../../db/queries/dao.js';
import { confirmPendingTx } from '../../db/queries/pending-transactions.js';
import { readMembershipProposalState } from '../state-reader.js';

const logger = pino({ name: 'handler:membership' });

export async function handleMembershipEvent(event: {
  txId: string;
  functionName: string;
  args: Record<string, any>;
  success: boolean;
  sender: string;
}) {
  if (!event.success) {
    logger.info({ txId: event.txId, fn: event.functionName }, 'Membership tx failed, skipping');
    return;
  }

  logger.info({ txId: event.txId, fn: event.functionName }, 'Processing membership event');

  switch (event.functionName) {
    case 'set-committee-member': {
      const member = extractMemberAddress(event.args);
      const isActive = extractBoolArg(event.args);
      if (member) {
        await upsertCommitteeMember(member, isActive, Math.floor(Date.now() / 1000));
        logger.info({ member, isActive }, 'Updated committee member');
      }
      break;
    }

    case 'propose-member': {
      // New proposal created — we need to find its ID
      // The contract uses next-proposal-id which auto-increments
      // Try fetching proposals starting from 1 until we find the latest
      // A simpler approach: try proposal IDs in descending order
      for (let id = 50; id >= 1; id--) {
        const state = await readMembershipProposalState(id);
        if (state) {
          await upsertMembershipProposal(state);
          logger.info({ proposalId: id }, 'Indexed new membership proposal');
          break;
        }
      }
      break;
    }

    case 'vote-on-proposal': {
      const proposalId = extractProposalId(event.args);
      if (proposalId !== null) {
        // Refresh proposal state (vote counts updated)
        const state = await readMembershipProposalState(proposalId);
        if (state) {
          await upsertMembershipProposal(state);
        }

        // Record the vote
        const approve = extractBoolArg(event.args);
        await upsertVote({
          proposal_on_chain_id: proposalId,
          proposal_type: 'membership',
          voter: event.sender,
          vote: approve ? 1 : 2,
          timestamp: Math.floor(Date.now() / 1000),
        });

        logger.info({ proposalId, voter: event.sender }, 'Indexed membership vote');
      }
      break;
    }

    default:
      logger.warn({ fn: event.functionName }, 'Unknown membership function');
  }

  await confirmPendingTx(event.txId);
}

function extractMemberAddress(args: Record<string, any>): string | null {
  return args.member || args.nominee || args[0] || null;
}

function extractBoolArg(args: Record<string, any>): boolean {
  const raw = args['is-member'] || args.approve || args[1];
  if (typeof raw === 'boolean') return raw;
  if (raw === 'true' || raw === true) return true;
  return false;
}

function extractProposalId(args: Record<string, any>): number | null {
  const raw = args['proposal-id'] || args.proposalId || args[0];
  if (raw !== undefined) return parseInt(String(raw));
  return null;
}
