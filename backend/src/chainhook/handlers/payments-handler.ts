import pino from 'pino';
import { query } from '../../db/pool.js';
import { confirmPendingTx } from '../../db/queries/pending-transactions.js';
import { upsertUserTier } from '../../db/queries/platform-fees.js';
import { updatePauseState } from '../../db/queries/pause-state.js';

const logger = pino({ name: 'handler:payments' });

export async function handlePaymentsEvent(event: {
  txId: string;
  functionName: string;
  args: Record<string, any>;
  success: boolean;
  sender: string;
}) {
  if (!event.success) {
    logger.info({ txId: event.txId, fn: event.functionName }, 'Payments tx failed, skipping');
    return;
  }

  logger.info({ txId: event.txId, fn: event.functionName }, 'Processing payments event');

  switch (event.functionName) {
    case 'set-user-tier':
    case 'process-platform-fee': {
      // Store the payment event
      await query(
        `INSERT INTO payments (tx_id, payer, recipient, amount, payment_type, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT DO NOTHING`,
        [
          event.txId,
          event.sender,
          event.args.recipient || '',
          event.args.amount || '0',
          event.functionName,
        ]
      );
      logger.info({ fn: event.functionName }, 'Indexed payment event');
      break;
    }

    case 'upgrade-to-pro': {
      await upsertUserTier({
        address: event.sender,
        tier: 1,
        total_fees_paid: event.args.amount || '0',
      });
      logger.info({ sender: event.sender }, 'User upgraded to pro tier');
      break;
    }

    case 'set-paused': {
      const isPaused = event.args['paused'] || event.args[0];
      await updatePauseState({
        contract_name: 'blocklancer-payments-v2',
        is_paused: isPaused === 'true' || isPaused === true,
        paused_by: event.sender,
      });
      logger.info({ paused: isPaused }, 'Updated payments pause state');
      break;
    }

    default:
      logger.warn({ fn: event.functionName }, 'Unknown payments function');
  }

  await confirmPendingTx(event.txId);
}
