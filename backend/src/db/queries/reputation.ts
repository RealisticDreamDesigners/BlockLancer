import { query } from '../pool.js';

export async function upsertReputation(data: {
  address: string;
  score: number;
  completed_escrows: number;
  cancelled_escrows: number;
  disputes_opened: number;
  disputes_won: number;
  disputes_lost: number;
  on_time_completions: number;
  late_completions: number;
  total_volume: string;
  last_updated: number;
}) {
  const result = await query(
    `INSERT INTO user_reputation (address, score, completed_escrows, cancelled_escrows, disputes_opened, disputes_won, disputes_lost, on_time_completions, late_completions, total_volume, last_updated, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
     ON CONFLICT (address) DO UPDATE SET
       score = EXCLUDED.score,
       completed_escrows = EXCLUDED.completed_escrows,
       cancelled_escrows = EXCLUDED.cancelled_escrows,
       disputes_opened = EXCLUDED.disputes_opened,
       disputes_won = EXCLUDED.disputes_won,
       disputes_lost = EXCLUDED.disputes_lost,
       on_time_completions = EXCLUDED.on_time_completions,
       late_completions = EXCLUDED.late_completions,
       total_volume = EXCLUDED.total_volume,
       last_updated = EXCLUDED.last_updated,
       updated_at = NOW()
     RETURNING *`,
    [
      data.address, data.score, data.completed_escrows, data.cancelled_escrows,
      data.disputes_opened, data.disputes_won, data.disputes_lost,
      data.on_time_completions, data.late_completions, data.total_volume, data.last_updated,
    ]
  );
  return result.rows[0];
}

export async function getReputationByAddress(address: string) {
  const result = await query('SELECT * FROM user_reputation WHERE address = $1', [address]);
  return result.rows[0] || null;
}

export async function getLeaderboard(limit: number = 20, offset: number = 0) {
  const result = await query(
    'SELECT * FROM user_reputation ORDER BY score DESC, completed_escrows DESC LIMIT $1 OFFSET $2',
    [limit, offset]
  );
  return result.rows;
}

export async function getReputationCount() {
  const result = await query('SELECT COUNT(*) as count FROM user_reputation');
  return parseInt(result.rows[0].count, 10);
}

export async function insertReputationHistory(address: string, score: number, source: string = 'chainhook') {
  const result = await query(
    'INSERT INTO reputation_history (address, score, source) VALUES ($1, $2, $3) RETURNING *',
    [address, score, source]
  );
  return result.rows[0];
}

export async function getReputationHistory(address: string, limit: number = 20) {
  const result = await query(
    'SELECT score, source, created_at FROM reputation_history WHERE address = $1 ORDER BY created_at DESC LIMIT $2',
    [address, limit]
  );
  return result.rows;
}
