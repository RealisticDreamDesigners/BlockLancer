import { query } from '../pool.js';

export async function upsertJob(data: {
  on_chain_id: number;
  poster: string;
  title: string;
  description: string;
  budget_min: string;
  budget_max: string;
  deadline: number;
  status: number;
  skills: string;
  created_at: number;
  escrow_id: number | null;
  application_count: number;
}) {
  const result = await query(
    `INSERT INTO jobs (on_chain_id, poster, title, description, budget_min, budget_max, deadline, status, skills, created_at, escrow_id, application_count, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
     ON CONFLICT (on_chain_id) DO UPDATE SET
       poster = EXCLUDED.poster,
       title = EXCLUDED.title,
       description = EXCLUDED.description,
       budget_min = EXCLUDED.budget_min,
       budget_max = EXCLUDED.budget_max,
       deadline = EXCLUDED.deadline,
       status = EXCLUDED.status,
       skills = EXCLUDED.skills,
       created_at = EXCLUDED.created_at,
       escrow_id = EXCLUDED.escrow_id,
       application_count = EXCLUDED.application_count,
       updated_at = NOW()
     RETURNING *`,
    [
      data.on_chain_id, data.poster, data.title, data.description,
      data.budget_min, data.budget_max, data.deadline, data.status,
      data.skills, data.created_at, data.escrow_id, data.application_count,
    ]
  );
  return result.rows[0];
}

export async function getJobById(onChainId: number) {
  const result = await query('SELECT * FROM jobs WHERE on_chain_id = $1', [onChainId]);
  return result.rows[0] || null;
}

export async function getJobs(filters: { status?: number; poster?: string; limit?: number; offset?: number } = {}) {
  let sql = 'SELECT * FROM jobs WHERE 1=1';
  const params: any[] = [];
  let paramIdx = 1;

  if (filters.status !== undefined) {
    sql += ` AND status = $${paramIdx++}`;
    params.push(filters.status);
  }
  if (filters.poster) {
    sql += ` AND poster = $${paramIdx++}`;
    params.push(filters.poster);
  }

  sql += ' ORDER BY on_chain_id DESC';
  sql += ` LIMIT $${paramIdx++}`;
  params.push(filters.limit || 50);
  sql += ` OFFSET $${paramIdx++}`;
  params.push(filters.offset || 0);

  const result = await query(sql, params);
  return result.rows;
}

export async function getJobCount() {
  const result = await query('SELECT COUNT(*) as count FROM jobs');
  return parseInt(result.rows[0].count, 10);
}

export async function upsertJobApplication(data: {
  job_on_chain_id: number;
  applicant: string;
  cover_letter: string;
  proposed_amount: string;
  proposed_timeline: number;
  status: number;
  applied_at: number;
}) {
  const result = await query(
    `INSERT INTO job_applications (job_on_chain_id, applicant, cover_letter, proposed_amount, proposed_timeline, status, applied_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     ON CONFLICT (job_on_chain_id, applicant) DO UPDATE SET
       cover_letter = EXCLUDED.cover_letter,
       proposed_amount = EXCLUDED.proposed_amount,
       proposed_timeline = EXCLUDED.proposed_timeline,
       status = EXCLUDED.status,
       applied_at = EXCLUDED.applied_at,
       updated_at = NOW()
     RETURNING *`,
    [
      data.job_on_chain_id, data.applicant, data.cover_letter,
      data.proposed_amount, data.proposed_timeline, data.status, data.applied_at,
    ]
  );
  return result.rows[0];
}

export async function getApplicationsByJob(jobOnChainId: number) {
  const result = await query(
    'SELECT * FROM job_applications WHERE job_on_chain_id = $1 ORDER BY applied_at DESC',
    [jobOnChainId]
  );
  return result.rows;
}

export async function getApplicationsByApplicant(applicant: string) {
  const result = await query(
    'SELECT ja.*, j.title as job_title, j.poster as job_poster FROM job_applications ja JOIN jobs j ON ja.job_on_chain_id = j.on_chain_id WHERE ja.applicant = $1 ORDER BY ja.applied_at DESC',
    [applicant]
  );
  return result.rows;
}
