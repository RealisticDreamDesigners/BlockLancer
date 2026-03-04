import pino from 'pino';
import { upsertDispute } from '../../db/queries/disputes.js';
import { confirmPendingTx } from '../../db/queries/pending-transactions.js';
import { readDisputeState, readTotalDisputes } from '../state-reader.js';

const logger = pino({ name: 'handler:dispute' });

export async function handleDisputeEvent(event: {
  txId: string;
  functionName: string;
  args: Record<string, any>;
  success: boolean;
  sender: string;
}) {
  if (!event.success) {
    logger.info({ txId: event.txId, fn: event.functionName }, 'Dispute tx failed, skipping');
    return;
  }

  logger.info({ txId: event.txId, fn: event.functionName }, 'Processing dispute event');

  switch (event.functionName) {
    case 'open-dispute': {
      // Read the latest dispute ID
      const totalDisputes = await readTotalDisputes();
      // next-dispute-id is the next available, so latest is totalDisputes - 1
      const latestId = totalDisputes - 1;
      if (latestId >= 1) {
        const state = await readDisputeState(latestId);
        if (state) {
          await upsertDispute(state);
          logger.info({ disputeId: latestId }, 'Indexed new dispute');
        }
      }
      break;
    }

    case 'submit-evidence':
    case 'dao-resolve-dispute':
    case 'withdraw-dispute': {
      const disputeId = extractDisputeId(event.args);
      if (disputeId) {
        const state = await readDisputeState(disputeId);
        if (state) {
          await upsertDispute(state);
          logger.info({ disputeId, fn: event.functionName }, 'Updated dispute state');
        }
      }
      break;
    }

    default:
      logger.warn({ fn: event.functionName }, 'Unknown dispute function');
  }

  await confirmPendingTx(event.txId);
}

function extractDisputeId(args: Record<string, any>): number | null {
  const raw = args['dispute-id'] || args.disputeId || args[0];
  if (raw) return parseInt(String(raw));
  return null;
}
