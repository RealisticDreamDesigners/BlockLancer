import { query } from '../pool.js';

export async function getSyncState(entityType: string) {
  const result = await query(
    'SELECT * FROM sync_state WHERE entity_type = $1',
    [entityType]
  );
  return result.rows[0] || null;
}

export async function updateSyncState(entityType: string, lastSyncedId: number, isComplete: boolean) {
  const result = await query(
    `INSERT INTO sync_state (entity_type, last_synced_id, last_synced_at, is_complete)
     VALUES ($1, $2, NOW(), $3)
     ON CONFLICT (entity_type) DO UPDATE SET
       last_synced_id = EXCLUDED.last_synced_id,
       last_synced_at = NOW(),
       is_complete = EXCLUDED.is_complete
     RETURNING *`,
    [entityType, lastSyncedId, isComplete]
  );
  return result.rows[0];
}

export async function getAllSyncStates() {
  const result = await query('SELECT * FROM sync_state');
  return result.rows;
}
