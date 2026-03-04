import pino from 'pino';
import { upsertReputation, getReputationByAddress, insertReputationHistory } from '../../db/queries/reputation.js';
import { confirmPendingTx } from '../../db/queries/pending-transactions.js';
import { readReputationState } from '../state-reader.js';

const logger = pino({ name: 'handler:reputation' });

export async function handleReputationEvent(event: {
  txId: string;
  functionName: string;
  args: Record<string, any>;
  success: boolean;
  sender: string;
}) {
  if (!event.success) {
    logger.info({ txId: event.txId, fn: event.functionName }, 'Reputation tx failed, skipping');
    return;
  }

  logger.info({ txId: event.txId, fn: event.functionName }, 'Processing reputation event');

  switch (event.functionName) {
    case 'record-escrow-completion': {
      const client = extractPrincipal(event.args, 'client', 0);
      const freelancer = extractPrincipal(event.args, 'freelancer', 1);
      if (client) await syncReputation(client);
      if (freelancer) await syncReputation(freelancer);
      break;
    }

    case 'record-dispute-outcome': {
      const winner = extractPrincipal(event.args, 'winner', 0);
      const loser = extractPrincipal(event.args, 'loser', 1);
      if (winner) await syncReputation(winner);
      if (loser) await syncReputation(loser);
      break;
    }

    case 'record-dispute-opened':
    case 'record-on-time-completion':
    case 'record-late-completion':
    case 'record-escrow-cancellation': {
      const user = extractPrincipal(event.args, 'user', 0);
      if (user) await syncReputation(user);
      break;
    }

    default:
      logger.warn({ fn: event.functionName }, 'Unknown reputation function');
  }

  await confirmPendingTx(event.txId);
}

async function syncReputation(address: string) {
  try {
    const state = await readReputationState(address);
    if (state) {
      const prev = await getReputationByAddress(address);
      await upsertReputation(state);
      // Record history snapshot if score changed
      if (!prev || prev.score !== state.score) {
        await insertReputationHistory(address, state.score, 'chainhook');
      }
      logger.info({ address: address.slice(0, 10) + '...' }, 'Synced reputation');
    }
  } catch (err) {
    logger.error({ err, address }, 'Failed to sync reputation');
  }
}

function extractPrincipal(args: Record<string, any>, name: string, index: number): string | null {
  const raw = args[name] || args[index];
  if (raw) return String(raw).replace(/^'/, '');
  return null;
}
