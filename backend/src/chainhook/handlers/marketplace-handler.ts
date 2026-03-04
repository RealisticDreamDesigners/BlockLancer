import pino from 'pino';
import { upsertJob, upsertJobApplication } from '../../db/queries/marketplace.js';
import { confirmPendingTx } from '../../db/queries/pending-transactions.js';
import { readJobState, readJobApplicationState, readTotalJobs } from '../state-reader.js';

const logger = pino({ name: 'handler:marketplace' });

export async function handleMarketplaceEvent(event: {
  txId: string;
  functionName: string;
  args: Record<string, any>;
  success: boolean;
  sender: string;
}) {
  if (!event.success) {
    logger.info({ txId: event.txId, fn: event.functionName }, 'Marketplace tx failed, skipping');
    return;
  }

  logger.info({ txId: event.txId, fn: event.functionName }, 'Processing marketplace event');

  switch (event.functionName) {
    case 'post-job': {
      const totalJobs = await readTotalJobs();
      if (totalJobs > 0) {
        const state = await readJobState(totalJobs);
        if (state) {
          await upsertJob(state);
          logger.info({ jobId: totalJobs }, 'Indexed new job');
        }
      }
      break;
    }

    case 'apply-to-job': {
      const jobId = extractNumber(event.args, 'job-id', 0);
      if (jobId) {
        // Refresh job state (application count changed)
        const jobState = await readJobState(jobId);
        if (jobState) await upsertJob(jobState);

        // Sync the application
        const appState = await readJobApplicationState(jobId, event.sender);
        if (appState) await upsertJobApplication(appState);

        logger.info({ jobId, applicant: event.sender.slice(0, 10) }, 'Indexed job application');
      }
      break;
    }

    case 'accept-application':
    case 'reject-application': {
      const jobId = extractNumber(event.args, 'job-id', 0);
      const applicant = extractPrincipal(event.args, 'applicant', 1);
      if (jobId) {
        const jobState = await readJobState(jobId);
        if (jobState) await upsertJob(jobState);

        if (applicant) {
          const appState = await readJobApplicationState(jobId, applicant);
          if (appState) await upsertJobApplication(appState);
        }

        logger.info({ jobId, fn: event.functionName }, 'Updated job/application state');
      }
      break;
    }

    case 'link-escrow-to-job':
    case 'cancel-job': {
      const jobId = extractNumber(event.args, 'job-id', 0);
      if (jobId) {
        const jobState = await readJobState(jobId);
        if (jobState) await upsertJob(jobState);
        logger.info({ jobId, fn: event.functionName }, 'Updated job state');
      }
      break;
    }

    default:
      logger.warn({ fn: event.functionName }, 'Unknown marketplace function');
  }

  await confirmPendingTx(event.txId);
}

function extractNumber(args: Record<string, any>, name: string, index: number): number | null {
  const raw = args[name] || args[index];
  if (raw) return parseInt(String(raw));
  return null;
}

function extractPrincipal(args: Record<string, any>, name: string, index: number): string | null {
  const raw = args[name] || args[index];
  if (raw) return String(raw).replace(/^'/, '');
  return null;
}
