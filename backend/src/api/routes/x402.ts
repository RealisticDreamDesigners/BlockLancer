/**
 * x402 Premium Routes
 *
 * API endpoints gated with x402 payment protocol.
 * Each route requires a micropayment in STX/sBTC/USDCx before access.
 */
import { FastifyInstance } from 'fastify';
import { x402PaymentHook } from '../middleware/x402.js';
import { query } from '../../db/pool.js';
import pino from 'pino';

const logger = pino({ name: 'x402-routes' });

export async function x402Routes(app: FastifyInstance) {

  /**
   * GET /api/x402/info
   * Public endpoint — describes available x402-gated routes
   */
  app.get('/api/x402/info', async () => ({
    protocol: 'x402',
    version: 2,
    description: 'BlockLancer premium API endpoints using x402 payment protocol',
    enabled: process.env.X402_ENABLED !== 'false',
    endpoints: [
      {
        path: '/api/x402/analytics/premium',
        method: 'GET',
        fee: '0.001 STX',
        description: 'Premium analytics — platform-wide statistics and trends',
      },
      {
        path: '/api/x402/reports/dispute/:id',
        method: 'GET',
        fee: '0.001 STX',
        description: 'Detailed dispute report with full evidence and timeline',
      },
      {
        path: '/api/x402/marketplace/featured',
        method: 'GET',
        fee: '0.0005 STX',
        description: 'Featured job listings with priority placement',
      },
    ],
  }));

  /**
   * GET /api/x402/analytics/premium
   * Premium analytics endpoint — requires x402 payment
   * Returns platform-wide statistics, top users, and trends
   */
  app.get('/api/x402/analytics/premium', {
    preHandler: x402PaymentHook({
      amount: 0.001,
      asset: 'STX',
      description: 'Premium analytics — platform-wide statistics and trends',
    }),
  }, async (request) => {
    const payment = (request as any).x402Payment;

    // Aggregate platform statistics
    const [escrowStats, disputeStats, reputationStats, jobStats] = await Promise.all([
      query<{ total: string; active: string; completed: string; total_value: string }>(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'active') as active,
          COUNT(*) FILTER (WHERE status = 'completed') as completed,
          COALESCE(SUM(total_amount), 0) as total_value
        FROM escrows
      `),
      query<{ total: string; open: string; resolved: string }>(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'open') as open,
          COUNT(*) FILTER (WHERE status IN ('resolved', 'resolved-client', 'resolved-freelancer')) as resolved
        FROM disputes
      `),
      query<{ address: string; score: string }>(`
        SELECT address, total_score as score
        FROM reputation
        ORDER BY total_score DESC
        LIMIT 10
      `),
      query<{ total: string; open: string }>(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'open') as open
        FROM jobs
      `),
    ]);

    return {
      payment: {
        payer: payment?.payer,
        transaction: payment?.transaction,
      },
      analytics: {
        escrows: escrowStats.rows[0] || { total: '0', active: '0', completed: '0', total_value: '0' },
        disputes: disputeStats.rows[0] || { total: '0', open: '0', resolved: '0' },
        topUsers: reputationStats.rows,
        jobs: jobStats.rows[0] || { total: '0', open: '0' },
        generatedAt: new Date().toISOString(),
      },
    };
  });

  /**
   * GET /api/x402/reports/dispute/:id
   * Detailed dispute report — requires x402 payment
   */
  app.get<{ Params: { id: string } }>('/api/x402/reports/dispute/:id', {
    preHandler: x402PaymentHook({
      amount: 0.001,
      asset: 'STX',
      description: 'Detailed dispute report with full evidence and timeline',
    }),
  }, async (request, reply) => {
    const payment = (request as any).x402Payment;
    const disputeId = parseInt(request.params.id);

    if (isNaN(disputeId)) {
      reply.code(400).send({ error: 'Invalid dispute ID' });
      return;
    }

    const [disputeResult, proposalResult] = await Promise.all([
      query(`SELECT * FROM disputes WHERE dispute_id = $1`, [disputeId]),
      query(`SELECT * FROM proposals WHERE target_contract_id = $1`, [disputeId]),
    ]);

    if (disputeResult.rows.length === 0) {
      reply.code(404).send({ error: 'Dispute not found' });
      return;
    }

    const dispute = disputeResult.rows[0];

    return {
      payment: {
        payer: payment?.payer,
        transaction: payment?.transaction,
      },
      report: {
        dispute,
        proposals: proposalResult.rows,
        generatedAt: new Date().toISOString(),
      },
    };
  });

  /**
   * GET /api/x402/marketplace/featured
   * Featured job listings — requires x402 payment
   */
  app.get('/api/x402/marketplace/featured', {
    preHandler: x402PaymentHook({
      amount: 0.0005,
      asset: 'STX',
      description: 'Featured job listings with priority placement',
    }),
  }, async (request) => {
    const payment = (request as any).x402Payment;

    const jobsResult = await query(`
      SELECT j.*,
        (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.job_id) as application_count
      FROM jobs j
      WHERE j.status = 'open'
      ORDER BY j.budget DESC, j.created_at DESC
      LIMIT 20
    `);

    return {
      payment: {
        payer: payment?.payer,
        transaction: payment?.transaction,
      },
      featured: jobsResult.rows,
      generatedAt: new Date().toISOString(),
    };
  });
}
