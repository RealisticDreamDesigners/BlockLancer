import pino from 'pino';
import { upsertEscrow, upsertMilestone } from '../../db/queries/escrows.js';
import { confirmPendingTx } from '../../db/queries/pending-transactions.js';
import { updatePauseState } from '../../db/queries/pause-state.js';
import { readEscrowState, readMilestoneState, readTotalEscrows } from '../state-reader.js';

const logger = pino({ name: 'handler:escrow' });

/**
 * Handle escrow contract events from chainhook.
 * After receiving the event, reads current state from blockchain.
 */
export async function handleEscrowEvent(event: {
  txId: string;
  functionName: string;
  args: Record<string, any>;
  success: boolean;
  sender: string;
}) {
  if (!event.success) {
    logger.info({ txId: event.txId, fn: event.functionName }, 'Escrow tx failed, skipping');
    return;
  }

  logger.info({ txId: event.txId, fn: event.functionName }, 'Processing escrow event');

  switch (event.functionName) {
    case 'create-escrow': {
      // Read the latest escrow ID (total count = last ID)
      const totalEscrows = await readTotalEscrows();
      if (totalEscrows > 0) {
        const state = await readEscrowState(totalEscrows);
        if (state) {
          await upsertEscrow(state);
          logger.info({ escrowId: totalEscrows }, 'Indexed new escrow');
        }
      }
      break;
    }

    case 'add-milestone': {
      // args should contain contract-id
      const contractId = extractContractId(event.args);
      if (contractId) {
        // Read all milestones for this escrow (find latest)
        for (let m = 1; m <= 50; m++) {
          const milestone = await readMilestoneState(contractId, m);
          if (!milestone) break;
          await upsertMilestone(milestone);
        }
        logger.info({ contractId }, 'Indexed milestones');
      }
      break;
    }

    case 'submit-milestone':
    case 'approve-milestone':
    case 'reject-milestone':
    case 'claim-deadline-refund': {
      const contractId = extractContractId(event.args);
      const milestoneIdx = extractMilestoneIndex(event.args);
      if (contractId) {
        // Refresh escrow state
        const escrowState = await readEscrowState(contractId);
        if (escrowState) await upsertEscrow(escrowState);

        // Refresh specific milestone if we know the index
        if (milestoneIdx) {
          const milestoneState = await readMilestoneState(contractId, milestoneIdx);
          if (milestoneState) await upsertMilestone(milestoneState);
        } else {
          // Refresh all milestones
          for (let m = 1; m <= 50; m++) {
            const milestone = await readMilestoneState(contractId, m);
            if (!milestone) break;
            await upsertMilestone(milestone);
          }
        }

        logger.info({ contractId, fn: event.functionName }, 'Updated escrow/milestone state');
      }
      break;
    }

    case 'set-paused': {
      const isPaused = event.args['paused'] || event.args[0];
      await updatePauseState({
        contract_name: 'blocklancer-escrow-v4',
        is_paused: isPaused === 'true' || isPaused === true,
        paused_by: event.sender,
      });
      logger.info({ paused: isPaused }, 'Updated escrow pause state');
      break;
    }

    default:
      logger.warn({ fn: event.functionName }, 'Unknown escrow function');
  }

  // Mark pending transaction as confirmed
  await confirmPendingTx(event.txId);
}

function extractContractId(args: Record<string, any>): number | null {
  // Chainhook args may use various key formats
  const raw = args['contract-id'] || args.contractId || args[0];
  if (raw) return parseInt(String(raw));
  return null;
}

function extractMilestoneIndex(args: Record<string, any>): number | null {
  const raw = args['milestone-index'] || args.milestoneIndex || args[1];
  if (raw) return parseInt(String(raw));
  return null;
}
