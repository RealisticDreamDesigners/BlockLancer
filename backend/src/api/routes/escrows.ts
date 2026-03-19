import { FastifyInstance } from 'fastify';
import { getEscrowById, getEscrowCount, getEscrowsByUser, getMilestonesByEscrow, getMilestoneById, upsertEscrow, upsertMilestone } from '../../db/queries/escrows.js';
import { getPendingByFunction } from '../../db/queries/pending-transactions.js';
import { readEscrowState, readMilestoneState, readTotalEscrows } from '../../chainhook/state-reader.js';
import type { ApiEscrow, ApiMilestone } from '../../types/index.js';

const logger = { info: console.log, error: console.error };

function toApiEscrow(row: any): ApiEscrow {
  return {
    id: row.on_chain_id,
    client: row.client,
    freelancer: row.freelancer,
    totalAmount: parseInt(row.total_amount),
    remainingBalance: parseInt(row.remaining_balance),
    status: row.status,
    description: row.description,
    createdAt: row.created_at,
    endDate: row.end_date,
  };
}

function toApiMilestone(row: any): ApiMilestone {
  return {
    id: row.milestone_index,
    escrowId: row.escrow_on_chain_id,
    description: row.description,
    amount: parseInt(row.amount),
    deadline: row.deadline,
    status: row.status,
    submissionNote: row.submission_note,
    rejectionReason: row.rejection_reason,
  };
}

/**
 * Fetch milestones from DB, with on-chain catch-up if DB is empty.
 * Reads milestones 1..50 from chain and upserts into DB.
 */
async function getMilestonesWithCatchUp(escrowId: number): Promise<any[]> {
  let rows = await getMilestonesByEscrow(escrowId);
  if (rows.length > 0) return rows;

  // DB has no milestones — try reading from chain
  try {
    for (let i = 1; i <= 50; i++) {
      const onChain = await readMilestoneState(escrowId, i);
      if (!onChain) break;
      await upsertMilestone(onChain);
    }
    rows = await getMilestonesByEscrow(escrowId);
    if (rows.length > 0) {
      logger.info(`[catch-up] Indexed ${rows.length} milestones for escrow #${escrowId} from blockchain`);
    }
  } catch {
    // Fall through with empty milestones
  }

  return rows;
}

export async function escrowRoutes(app: FastifyInstance) {
  // GET /api/escrows/:id
  // Includes live catch-up: if not in DB, try reading from blockchain
  app.get<{ Params: { id: string } }>('/api/escrows/:id', async (request, reply) => {
    const id = parseInt(request.params.id, 10);
    if (isNaN(id)) return reply.code(400).send({ error: 'Invalid escrow ID' });

    let escrow = await getEscrowById(id);

    // If not in DB, try fetching from blockchain (catch-up for when chainhook is down)
    if (!escrow) {
      try {
        const onChainState = await readEscrowState(id);
        if (onChainState) {
          await upsertEscrow(onChainState);
          escrow = await getEscrowById(id);
          logger.info(`[catch-up] Indexed escrow #${id} from blockchain`);
        }
      } catch {
        // Fall through to 404
      }
    }

    if (!escrow) return reply.code(404).send({ error: 'Escrow not found' });

    const milestones = await getMilestonesWithCatchUp(id);
    const result = toApiEscrow(escrow);
    result.milestones = milestones.map(toApiMilestone);

    return result;
  });

  // GET /api/escrows/count
  // Includes live catch-up: checks on-chain count and indexes any new escrows
  app.get('/api/escrows/count', async () => {
    const dbCount = await getEscrowCount();

    // Check if there are newer escrows on-chain
    try {
      const onChainTotal = await readTotalEscrows();
      if (onChainTotal > dbCount) {
        // Index missing escrows
        for (let id = dbCount + 1; id <= onChainTotal; id++) {
          try {
            const state = await readEscrowState(id);
            if (state) await upsertEscrow(state);
          } catch { break; }
        }
        logger.info(`[catch-up] Indexed ${onChainTotal - dbCount} new escrows (${dbCount + 1}..${onChainTotal})`);
        return { count: onChainTotal };
      }
    } catch {
      // Fall through to DB count
    }

    return { count: dbCount };
  });

  // GET /api/escrows/user/:address
  app.get<{ Params: { address: string } }>('/api/escrows/user/:address', async (request, reply) => {
    const { address } = request.params;
    if (!address) return reply.code(400).send({ error: 'Address required' });

    const escrows = await getEscrowsByUser(address);

    // Include pending escrow creations for this user
    const pendingCreates = await getPendingByFunction('create-escrow', address);

    // Build results with milestones included (with chain catch-up)
    const results: ApiEscrow[] = [];
    for (const row of escrows) {
      const escrow = toApiEscrow(row);
      const milestones = await getMilestonesWithCatchUp(row.on_chain_id);
      escrow.milestones = milestones.map(toApiMilestone);
      results.push(escrow);
    }

    // Add pending escrows
    for (const pending of pendingCreates) {
      const args = typeof pending.args === 'string' ? JSON.parse(pending.args) : pending.args;
      results.unshift({
        id: -1, // Temp ID
        client: args.client || address,
        freelancer: args.freelancer || '',
        totalAmount: parseInt(args.totalAmount || '0'),
        remainingBalance: parseInt(args.totalAmount || '0'),
        status: 0,
        description: args.description || 'Pending...',
        createdAt: Math.floor(Date.now() / 1000),
        endDate: parseInt(args.endDate || '0'),
        pending: true,
      });
    }

    return results;
  });

  // GET /api/escrows/:id/milestones/:milestoneId - Single milestone detail
  app.get<{ Params: { id: string; milestoneId: string } }>('/api/escrows/:id/milestones/:milestoneId', async (request, reply) => {
    const escrowId = parseInt(request.params.id, 10);
    const milestoneId = parseInt(request.params.milestoneId, 10);
    if (isNaN(escrowId) || isNaN(milestoneId)) return reply.code(400).send({ error: 'Invalid IDs' });

    let milestone = await getMilestoneById(escrowId, milestoneId);

    // Catch-up: if not in DB, try reading from chain
    if (!milestone) {
      try {
        const onChain = await readMilestoneState(escrowId, milestoneId);
        if (onChain) {
          await upsertMilestone(onChain);
          milestone = await getMilestoneById(escrowId, milestoneId);
          logger.info(`[catch-up] Indexed milestone ${escrowId}-${milestoneId} from blockchain`);
        }
      } catch {
        // Fall through to 404
      }
    }

    if (!milestone) return reply.code(404).send({ error: 'Milestone not found' });

    return toApiMilestone(milestone);
  });

  // GET /api/escrows/:id/milestones
  app.get<{ Params: { id: string } }>('/api/escrows/:id/milestones', async (request, reply) => {
    const id = parseInt(request.params.id, 10);
    if (isNaN(id)) return reply.code(400).send({ error: 'Invalid escrow ID' });

    const milestones = await getMilestonesWithCatchUp(id);
    return milestones.map(toApiMilestone);
  });
}
