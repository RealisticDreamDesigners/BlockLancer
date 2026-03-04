import { FastifyInstance } from 'fastify';
import { getJobs, getJobById, getJobCount, getApplicationsByJob, getApplicationsByApplicant } from '../../db/queries/marketplace.js';
import { syncLatestJobs } from '../../sync/bootstrap.js';

export async function marketplaceRoutes(app: FastifyInstance) {
  // POST /api/jobs/sync - Force sync new jobs from chain
  app.post('/api/jobs/sync', async (request, reply) => {
    try {
      const synced = await syncLatestJobs();
      return { synced, message: synced > 0 ? `Synced ${synced} new job(s)` : 'No new jobs found' };
    } catch (err) {
      reply.code(500).send({ error: 'Sync failed' });
    }
  });

  // GET /api/jobs - List jobs with filters
  app.get('/api/jobs', async (request, reply) => {
    const { status, poster, limit, offset } = request.query as {
      status?: string;
      poster?: string;
      limit?: string;
      offset?: string;
    };
    try {
      const jobs = await getJobs({
        status: status !== undefined ? parseInt(status, 10) : undefined,
        poster,
        limit: parseInt(limit || '50', 10),
        offset: parseInt(offset || '0', 10),
      });
      const total = await getJobCount();
      return { jobs, total };
    } catch (err) {
      reply.code(500).send({ error: 'Failed to fetch jobs' });
    }
  });

  // GET /api/jobs/:id - Job detail
  app.get('/api/jobs/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const job = await getJobById(parseInt(id, 10));
      if (!job) return reply.code(404).send({ error: 'Job not found' });
      return job;
    } catch (err) {
      reply.code(500).send({ error: 'Failed to fetch job' });
    }
  });

  // GET /api/jobs/:id/applications - Applications for a job
  app.get('/api/jobs/:id/applications', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const applications = await getApplicationsByJob(parseInt(id, 10));
      return applications;
    } catch (err) {
      reply.code(500).send({ error: 'Failed to fetch applications' });
    }
  });

  // GET /api/applications/user/:address - User's applications
  app.get('/api/applications/user/:address', async (request, reply) => {
    const { address } = request.params as { address: string };
    try {
      const applications = await getApplicationsByApplicant(address);
      return applications;
    } catch (err) {
      reply.code(500).send({ error: 'Failed to fetch applications' });
    }
  });
}
