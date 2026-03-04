import { FastifyInstance } from 'fastify';
import {
  getDisputeById,
  getDisputeCount,
  getDisputeByContractId,
  getDisputesByUser,
  getAllDisputes,
  getMaxDisputeId,
  upsertDispute,
} from '../../db/queries/disputes.js';
import { readDisputeState, readTotalDisputes } from '../../chainhook/state-reader.js';
import type { ApiDispute } from '../../types/index.js';
import pino from 'pino';

const logger = pino({ name: 'dispute-routes' });

function toApiDispute(row: any): ApiDispute {
  return {
    id: row.on_chain_id,
    contractId: row.contract_id,
    openedBy: row.opened_by,
    client: row.client,
    freelancer: row.freelancer,
    reason: row.reason,
    clientEvidence: row.client_evidence || undefined,
    freelancerEvidence: row.freelancer_evidence || undefined,
    status: row.status,
    resolution: row.resolution,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at || undefined,
  };
}

/**
 * Catch up on disputes that exist on-chain but not in our DB.
 * Checks from maxDbId+1 up to the on-chain total.
 */
async function catchUpDisputes(): Promise<number> {
  let newFound = 0;
  try {
    // get-dispute-count returns the next-dispute-id counter.
    // If counter is 2, disputes 1..(counter-1) may exist. IDs are 1-based.
    const nextId = await readTotalDisputes();
    const maxDbId = await getMaxDisputeId();

    if (nextId <= 1 || nextId - 1 <= maxDbId) return 0;

    logger.info({ maxDbId, nextId }, 'Catching up disputes');

    for (let id = maxDbId + 1; id < nextId; id++) {
      try {
        const state = await readDisputeState(id);
        if (!state) continue; // skip missing, try next
        await upsertDispute(state);
        newFound++;
        logger.info({ disputeId: id }, 'Caught up dispute');
      } catch (err) {
        logger.warn({ err, disputeId: id }, 'Failed to catch up dispute');
      }
    }
  } catch (err) {
    logger.warn({ err }, 'Failed to check on-chain dispute count');
  }
  return newFound;
}

export async function disputeRoutes(app: FastifyInstance) {
  // GET /api/disputes/:id — always refresh from chain for fresh status
  app.get<{ Params: { id: string } }>('/api/disputes/:id', async (request, reply) => {
    const id = parseInt(request.params.id, 10);
    if (isNaN(id)) return reply.code(400).send({ error: 'Invalid dispute ID' });

    // Always refresh from blockchain for fresh status
    try {
      const onChainState = await readDisputeState(id);
      if (onChainState) {
        await upsertDispute(onChainState);
      }
    } catch (err) {
      logger.warn({ err, disputeId: id }, 'Failed to refresh dispute from chain');
    }

    const dispute = await getDisputeById(id);
    if (!dispute) return reply.code(404).send({ error: 'Dispute not found' });

    return toApiDispute(dispute);
  });

  // GET /api/disputes/count — with blockchain catch-up
  app.get('/api/disputes/count', async () => {
    await catchUpDisputes();
    const count = await getDisputeCount();
    return { count };
  });

  // GET /api/disputes/all — with blockchain catch-up + refresh open disputes
  app.get('/api/disputes/all', async () => {
    await catchUpDisputes();

    // Refresh all open (status=0) disputes from chain
    const existing = await getAllDisputes();
    for (const d of existing) {
      if (d.status === 0) {
        try {
          const fresh = await readDisputeState(d.on_chain_id);
          if (fresh) await upsertDispute(fresh);
        } catch { /* skip refresh errors */ }
      }
    }

    const disputes = await getAllDisputes();
    return disputes.map(toApiDispute);
  });

  // GET /api/disputes/contract/:contractId — with blockchain catch-up
  app.get<{ Params: { contractId: string } }>('/api/disputes/contract/:contractId', async (request, reply) => {
    const contractId = parseInt(request.params.contractId, 10);
    if (isNaN(contractId)) return reply.code(400).send({ error: 'Invalid contract ID' });

    let dispute = await getDisputeByContractId(contractId);
    if (!dispute) {
      // Catch up all disputes and retry
      const caught = await catchUpDisputes();
      if (caught > 0) {
        dispute = await getDisputeByContractId(contractId);
      }
    }

    if (!dispute) return reply.code(404).send({ error: 'No dispute for this contract' });

    return toApiDispute(dispute);
  });

  // GET /api/disputes/user/:address — with blockchain catch-up
  app.get<{ Params: { address: string } }>('/api/disputes/user/:address', async (request, reply) => {
    const { address } = request.params;
    if (!address) return reply.code(400).send({ error: 'Address required' });

    await catchUpDisputes();
    const disputes = await getDisputesByUser(address);
    return disputes.map(toApiDispute);
  });
}
