import { FastifyInstance } from 'fastify';
import { getReputationByAddress, getLeaderboard, getReputationCount, getReputationHistory } from '../../db/queries/reputation.js';

export async function reputationRoutes(app: FastifyInstance) {
  // GET /api/reputation/leaderboard - Top users by reputation
  app.get('/api/reputation/leaderboard', async (request, reply) => {
    const { limit, offset } = request.query as { limit?: string; offset?: string };
    try {
      const leaderboard = await getLeaderboard(
        parseInt(limit || '20', 10),
        parseInt(offset || '0', 10)
      );
      const total = await getReputationCount();
      return { leaderboard, total };
    } catch (err) {
      reply.code(500).send({ error: 'Failed to fetch leaderboard' });
    }
  });

  // GET /api/reputation/:address - User reputation
  app.get('/api/reputation/:address', async (request, reply) => {
    const { address } = request.params as { address: string };
    try {
      const reputation = await getReputationByAddress(address);
      return reputation || {
        address,
        score: 500,
        completed_escrows: 0,
        cancelled_escrows: 0,
        disputes_opened: 0,
        disputes_won: 0,
        disputes_lost: 0,
        on_time_completions: 0,
        late_completions: 0,
        total_volume: '0',
        last_updated: 0,
      };
    } catch (err) {
      reply.code(500).send({ error: 'Failed to fetch reputation' });
    }
  });

  // GET /api/reputation/:address/history - Reputation score history
  app.get('/api/reputation/:address/history', async (request, reply) => {
    const { address } = request.params as { address: string };
    const { limit } = request.query as { limit?: string };
    try {
      const history = await getReputationHistory(address, parseInt(limit || '20', 10));
      return { history };
    } catch (err) {
      reply.code(500).send({ error: 'Failed to fetch reputation history' });
    }
  });
}
