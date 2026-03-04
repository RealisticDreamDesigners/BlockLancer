import { query } from '../pool.js';

export async function upsertPlatformFee(data: {
  tx_id: string;
  escrow_id: number;
  milestone_index: number;
  payer: string;
  fee_amount: string;
  gross_amount: string;
  net_amount: string;
}) {
  const result = await query(
    `INSERT INTO platform_fees (tx_id, escrow_id, milestone_index, payer, fee_amount, gross_amount, net_amount, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     ON CONFLICT DO NOTHING
     RETURNING *`,
    [data.tx_id, data.escrow_id, data.milestone_index, data.payer, data.fee_amount, data.gross_amount, data.net_amount]
  );
  return result.rows[0] || null;
}

export async function getTotalFees() {
  const result = await query('SELECT COALESCE(SUM(fee_amount::bigint), 0) as total FROM platform_fees');
  return result.rows[0].total;
}

export async function getFeesByEscrow(escrowId: number) {
  const result = await query('SELECT * FROM platform_fees WHERE escrow_id = $1 ORDER BY created_at DESC', [escrowId]);
  return result.rows;
}

export async function getFeesByPayer(payer: string) {
  const result = await query('SELECT * FROM platform_fees WHERE payer = $1 ORDER BY created_at DESC', [payer]);
  return result.rows;
}

export async function upsertUserTier(data: {
  address: string;
  tier: number;
  total_fees_paid: string;
}) {
  const result = await query(
    `INSERT INTO user_tiers (address, tier, total_fees_paid, upgraded_at, updated_at)
     VALUES ($1, $2, $3, NOW(), NOW())
     ON CONFLICT (address) DO UPDATE SET
       tier = EXCLUDED.tier,
       total_fees_paid = EXCLUDED.total_fees_paid,
       upgraded_at = CASE WHEN EXCLUDED.tier > user_tiers.tier THEN NOW() ELSE user_tiers.upgraded_at END,
       updated_at = NOW()
     RETURNING *`,
    [data.address, data.tier, data.total_fees_paid]
  );
  return result.rows[0];
}

export async function getUserTier(address: string) {
  const result = await query('SELECT * FROM user_tiers WHERE address = $1', [address]);
  return result.rows[0] || null;
}

export async function getPlatformStats() {
  const feesResult = await query('SELECT COALESCE(SUM(fee_amount::bigint), 0) as total_fees, COUNT(*) as total_transactions FROM platform_fees');
  const tiersResult = await query('SELECT tier, COUNT(*) as count FROM user_tiers GROUP BY tier');
  return {
    totalFees: feesResult.rows[0].total_fees,
    totalTransactions: parseInt(feesResult.rows[0].total_transactions, 10),
    tierBreakdown: tiersResult.rows,
  };
}
