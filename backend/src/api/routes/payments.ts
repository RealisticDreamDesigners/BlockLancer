import { FastifyInstance } from 'fastify';
import { getTotalFees, getFeesByPayer, getUserTier, getPlatformStats } from '../../db/queries/platform-fees.js';

export async function paymentRoutes(app: FastifyInstance) {
  // GET /api/payments/stats - Platform fee stats
  app.get('/api/payments/stats', async (request, reply) => {
    try {
      const stats = await getPlatformStats();
      return stats;
    } catch (err) {
      reply.code(500).send({ error: 'Failed to fetch payment stats' });
    }
  });

  // GET /api/payments/fees/total - Total platform fees collected
  app.get('/api/payments/fees/total', async (request, reply) => {
    try {
      const total = await getTotalFees();
      return { total };
    } catch (err) {
      reply.code(500).send({ error: 'Failed to fetch total fees' });
    }
  });

  // GET /api/payments/user/:address/tier - User tier info
  app.get('/api/payments/user/:address/tier', async (request, reply) => {
    const { address } = request.params as { address: string };
    try {
      const tier = await getUserTier(address);
      return tier || { address, tier: 0, total_fees_paid: '0' };
    } catch (err) {
      reply.code(500).send({ error: 'Failed to fetch user tier' });
    }
  });

  // GET /api/payments/user/:address/fees - User fee history
  app.get('/api/payments/user/:address/fees', async (request, reply) => {
    const { address } = request.params as { address: string };
    try {
      const fees = await getFeesByPayer(address);
      return fees;
    } catch (err) {
      reply.code(500).send({ error: 'Failed to fetch user fees' });
    }
  });
}
