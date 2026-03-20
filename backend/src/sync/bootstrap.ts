import pino from 'pino';
import { config } from '../config.js';
import { getSyncState, updateSyncState } from '../db/queries/sync-state.js';
import { upsertEscrow, upsertMilestone } from '../db/queries/escrows.js';
import { upsertDispute } from '../db/queries/disputes.js';
import { upsertProposal, upsertDAOMember } from '../db/queries/dao.js';
import { upsertCommitteeMember, upsertMembershipProposal } from '../db/queries/committee.js';
import {
  readTotalEscrows,
  readTotalDisputes,
  readTotalProposals,
  readEscrowState,
  readMilestoneState,
  readDisputeState,
  readProposalState,
  readTotalMembershipProposals,
  readMembershipProposalState,
  readCommitteeMemberStatus,
  fetchCommitteeAddressesFromHiro,
  fetchDAOMemberAddressesFromHiro,
  fetchJobApplicationsFromHiro,
  readJobApplicationState,
  readDAOMemberStatus,
  readUserTierInfo,
  readTotalJobs,
  readJobState,
} from '../chainhook/state-reader.js';
import { upsertUserTier } from '../db/queries/platform-fees.js';
import { upsertJob, upsertJobApplication } from '../db/queries/marketplace.js';
import { upsertReputation, insertReputationHistory } from '../db/queries/reputation.js';
import { readReputationState } from '../chainhook/state-reader.js';

const logger = pino({ name: 'bootstrap' });

const { batchSize, batchDelayMs } = config.bootstrap;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Process items in batches with rate limiting.
 */
async function processBatched<T>(
  items: number[],
  processor: (id: number) => Promise<T | null>,
  label: string
): Promise<T[]> {
  const results: T[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));

    for (const result of batchResults) {
      if (result !== null) results.push(result);
    }

    logger.info({ label, processed: Math.min(i + batchSize, items.length), total: items.length }, 'Bootstrap progress');

    if (i + batchSize < items.length) {
      await sleep(batchDelayMs);
    }
  }

  return results;
}

/**
 * Bootstrap escrows from blockchain.
 */
async function bootstrapEscrows() {
  const syncState = await getSyncState('escrows');
  if (syncState?.is_complete) {
    logger.info('Escrows already synced, skipping');
    return;
  }

  const startId = (syncState?.last_synced_id || 0) + 1;
  const totalEscrows = await readTotalEscrows();

  if (totalEscrows === 0) {
    logger.info('No escrows found on chain');
    await updateSyncState('escrows', 0, true);
    return;
  }

  logger.info({ totalEscrows, startId }, 'Starting escrow bootstrap');

  const ids = Array.from({ length: totalEscrows - startId + 1 }, (_, i) => startId + i);

  await processBatched(ids, async (escrowId) => {
    const state = await readEscrowState(escrowId);
    if (!state) return null;

    const escrow = await upsertEscrow(state);

    // Fetch milestones for this escrow
    for (let m = 1; m <= 50; m++) {
      const milestone = await readMilestoneState(escrowId, m);
      if (!milestone) break;
      await upsertMilestone(milestone);
    }

    await updateSyncState('escrows', escrowId, false);
    return escrow;
  }, 'escrows');

  await updateSyncState('escrows', totalEscrows, true);
  logger.info({ totalEscrows }, 'Escrow bootstrap complete');
}

/**
 * Bootstrap disputes from blockchain.
 */
async function bootstrapDisputes() {
  const syncState = await getSyncState('disputes');
  if (syncState?.is_complete) {
    logger.info('Disputes already synced, skipping');
    return;
  }

  const startId = (syncState?.last_synced_id || 0) + 1;
  const totalDisputes = await readTotalDisputes();

  // next-dispute-id starts at 1, so count includes the next ID
  if (totalDisputes <= 1) {
    logger.info('No disputes found on chain');
    await updateSyncState('disputes', 0, true);
    return;
  }

  const disputeCount = totalDisputes - 1; // Actual dispute count
  logger.info({ disputeCount, startId }, 'Starting dispute bootstrap');

  const ids = Array.from({ length: disputeCount - startId + 1 }, (_, i) => startId + i);

  await processBatched(ids, async (disputeId) => {
    const state = await readDisputeState(disputeId);
    if (!state) return null;

    const dispute = await upsertDispute(state);
    await updateSyncState('disputes', disputeId, false);
    return dispute;
  }, 'disputes');

  await updateSyncState('disputes', disputeCount, true);
  logger.info({ disputeCount }, 'Dispute bootstrap complete');
}

/**
 * Bootstrap DAO proposals from blockchain.
 */
async function bootstrapProposals() {
  const syncState = await getSyncState('proposals');
  if (syncState?.is_complete) {
    logger.info('Proposals already synced, skipping');
    return;
  }

  const startId = syncState?.last_synced_id || 0;
  const totalProposals = await readTotalProposals();

  if (totalProposals === 0) {
    logger.info('No proposals found on chain');
    await updateSyncState('proposals', 0, true);
    return;
  }

  // Proposals use 0-based indexing, next-proposal-id is the next ID
  logger.info({ totalProposals, startId }, 'Starting proposal bootstrap');

  const ids = Array.from({ length: totalProposals - startId }, (_, i) => startId + i);

  await processBatched(ids, async (proposalId) => {
    const state = await readProposalState(proposalId);
    if (!state) return null;

    const proposal = await upsertProposal(state);
    await updateSyncState('proposals', proposalId, false);
    return proposal;
  }, 'proposals');

  await updateSyncState('proposals', totalProposals - 1, true);
  logger.info({ totalProposals }, 'Proposal bootstrap complete');
}

/**
 * Bootstrap committee members from blockchain.
 * Queries Hiro API for set-committee-member transactions,
 * then verifies each address on-chain and upserts.
 */
async function bootstrapCommitteeMembers() {
  const syncState = await getSyncState('committee_members');
  if (syncState?.is_complete) {
    logger.info('Committee members already synced, skipping');
    return;
  }

  logger.info('Starting committee member bootstrap');

  // Always include deployer as a committee member candidate
  const deployerAddress = config.deployerAddress;
  const addressesFromHiro = await fetchCommitteeAddressesFromHiro();
  const allAddresses = new Set([deployerAddress, ...addressesFromHiro]);

  logger.info({ count: allAddresses.size }, 'Found committee member candidates');

  let synced = 0;
  for (const address of allAddresses) {
    try {
      const status = await readCommitteeMemberStatus(address);
      if (status && status.isMember) {
        await upsertCommitteeMember(address, true);
        synced++;
        logger.info({ address: address.slice(0, 10) + '...' }, 'Synced committee member');
      }
      await sleep(batchDelayMs);
    } catch (err) {
      logger.error({ err, address }, 'Failed to sync committee member');
    }
  }

  await updateSyncState('committee_members', synced, true);
  logger.info({ synced }, 'Committee member bootstrap complete');
}

/**
 * Bootstrap membership proposals from blockchain.
 * Iterates proposal IDs 1..N until get-proposal returns null.
 */
async function bootstrapMembershipProposals() {
  const syncState = await getSyncState('membership_proposals');
  if (syncState?.is_complete) {
    logger.info('Membership proposals already synced, skipping');
    return;
  }

  const startId = (syncState?.last_synced_id || 0) + 1;
  const totalProposals = await readTotalMembershipProposals();

  if (totalProposals === 0) {
    logger.info('No membership proposals found on chain');
    await updateSyncState('membership_proposals', 0, true);
    return;
  }

  logger.info({ totalProposals, startId }, 'Starting membership proposal bootstrap');

  const ids = Array.from({ length: totalProposals - startId + 1 }, (_, i) => startId + i);

  await processBatched(ids, async (proposalId) => {
    const state = await readMembershipProposalState(proposalId);
    if (!state) return null;

    const proposal = await upsertMembershipProposal(state);
    await updateSyncState('membership_proposals', proposalId, false);
    return proposal;
  }, 'membership_proposals');

  await updateSyncState('membership_proposals', totalProposals, true);
  logger.info({ totalProposals }, 'Membership proposal bootstrap complete');
}

/**
 * Bootstrap user tiers from known addresses.
 * Checks tier info for addresses found in escrows.
 */
async function bootstrapUserTiers() {
  const syncState = await getSyncState('user_tiers');
  if (syncState?.is_complete) {
    logger.info('User tiers already synced, skipping');
    return;
  }

  logger.info('Starting user tier bootstrap');

  // Get unique addresses from escrows to check their tiers
  const { query: dbQuery } = await import('../db/pool.js');
  const addressResult = await dbQuery(
    'SELECT DISTINCT client as address FROM escrows UNION SELECT DISTINCT freelancer as address FROM escrows'
  );
  const addresses = addressResult.rows.map((r: any) => r.address).filter(Boolean);

  let synced = 0;
  for (const address of addresses) {
    try {
      const tierInfo = await readUserTierInfo(address);
      if (tierInfo) {
        await upsertUserTier({
          address: tierInfo.address,
          tier: tierInfo.tier,
          total_fees_paid: tierInfo.total_fees_paid,
        });
        synced++;
      }
      await sleep(batchDelayMs);
    } catch (err) {
      logger.error({ err, address }, 'Failed to sync user tier');
    }
  }

  await updateSyncState('user_tiers', synced, true);
  logger.info({ synced }, 'User tier bootstrap complete');
}

/**
 * Bootstrap jobs from marketplace contract.
 */
async function bootstrapJobs() {
  const syncState = await getSyncState('jobs');
  if (syncState?.is_complete) {
    logger.info('Jobs already synced, skipping');
    return;
  }

  const startId = (syncState?.last_synced_id || 0) + 1;
  const totalJobs = await readTotalJobs();

  if (totalJobs === 0) {
    logger.info('No jobs found on chain');
    await updateSyncState('jobs', 0, true);
    return;
  }

  logger.info({ totalJobs, startId }, 'Starting job bootstrap');

  const ids = Array.from({ length: totalJobs - startId + 1 }, (_, i) => startId + i);

  await processBatched(ids, async (jobId) => {
    const state = await readJobState(jobId);
    if (!state) return null;

    const job = await upsertJob(state);
    await updateSyncState('jobs', jobId, false);
    return job;
  }, 'jobs');

  await updateSyncState('jobs', totalJobs, true);
  logger.info({ totalJobs }, 'Job bootstrap complete');
}

/**
 * Bootstrap reputation scores from blockchain.
 * Reads all unique addresses from escrows and disputes tables,
 * then fetches their on-chain reputation state.
 */
async function bootstrapReputation() {
  const syncState = await getSyncState('reputation');
  if (syncState?.is_complete) {
    logger.info('Reputation already synced, skipping');
    return;
  }

  logger.info('Starting reputation bootstrap');

  const { query: dbQuery } = await import('../db/pool.js');
  const addressResult = await dbQuery(
    `SELECT DISTINCT address FROM (
      SELECT client as address FROM escrows
      UNION SELECT freelancer as address FROM escrows
      UNION SELECT client as address FROM disputes WHERE client IS NOT NULL
      UNION SELECT freelancer as address FROM disputes WHERE freelancer IS NOT NULL
    ) combined WHERE address IS NOT NULL`
  );
  const addresses: string[] = addressResult.rows.map((r: any) => r.address).filter(Boolean);

  if (addresses.length === 0) {
    logger.info('No addresses found for reputation sync');
    await updateSyncState('reputation', 0, true);
    return;
  }

  logger.info({ count: addresses.length }, 'Found addresses for reputation bootstrap');

  let synced = 0;
  for (const address of addresses) {
    try {
      const state = await readReputationState(address);
      if (state) {
        const prev = await import('../db/queries/reputation.js').then(m => m.getReputationByAddress(address));
        await upsertReputation(state);
        // Record history snapshot if score differs from default or previous
        if (!prev || prev.score !== state.score) {
          await insertReputationHistory(address, state.score, 'bootstrap');
        }
        synced++;
      }
      await sleep(batchDelayMs);
    } catch (err) {
      logger.error({ err, address }, 'Failed to sync reputation');
    }
  }

  await updateSyncState('reputation', synced, true);
  logger.info({ synced }, 'Reputation bootstrap complete');
}

/**
 * Bootstrap DAO members from blockchain.
 * Scans Hiro API for admin-add-dao-member calls, verifies on-chain, upserts.
 */
async function bootstrapDAOMembers() {
  const syncState = await getSyncState('dao_members');
  if (syncState?.is_complete) {
    logger.info('DAO members already synced, skipping');
    return;
  }

  logger.info('Starting DAO member bootstrap');

  const deployerAddress = config.deployerAddress;
  const addressesFromHiro = await fetchDAOMemberAddressesFromHiro();
  const allAddresses = new Set([deployerAddress, ...addressesFromHiro]);

  logger.info({ count: allAddresses.size }, 'Found DAO member candidates');

  let synced = 0;
  for (const address of allAddresses) {
    try {
      const status = await readDAOMemberStatus(address);
      if (status && status.isMember) {
        await upsertDAOMember(address, true);
        synced++;
        logger.info({ address: address.slice(0, 10) + '...' }, 'Synced DAO member');
      }
      await sleep(batchDelayMs);
    } catch (err) {
      logger.error({ err, address }, 'Failed to sync DAO member');
    }
  }

  await updateSyncState('dao_members', synced, true);
  logger.info({ synced }, 'DAO member bootstrap complete');
}

/**
 * Bootstrap job applications from blockchain.
 * Scans Hiro API for apply-to-job calls, reads on-chain state, upserts.
 */
async function bootstrapJobApplications() {
  const syncState = await getSyncState('job_applications');
  if (syncState?.is_complete) {
    logger.info('Job applications already synced, skipping');
    return;
  }

  logger.info('Starting job application bootstrap');

  const applicationsFromHiro = await fetchJobApplicationsFromHiro();
  logger.info({ count: applicationsFromHiro.length }, 'Found job applications from Hiro');

  let synced = 0;
  for (const { jobId, applicant } of applicationsFromHiro) {
    try {
      const state = await readJobApplicationState(jobId, applicant);
      if (state) {
        await upsertJobApplication(state);
        synced++;
      }
      await sleep(batchDelayMs);
    } catch (err) {
      logger.error({ err, jobId, applicant }, 'Failed to sync job application');
    }
  }

  await updateSyncState('job_applications', synced, true);
  logger.info({ synced }, 'Job application bootstrap complete');
}

/**
 * Bootstrap platform fees sync state.
 * Platform fees are event-driven (captured during approve-milestone).
 * No bulk state to read from chain — just mark as synced.
 */
async function bootstrapPlatformFees() {
  const syncState = await getSyncState('platform_fees');
  if (syncState?.is_complete) {
    logger.info('Platform fees already synced, skipping');
    return;
  }

  // Platform fees come from transaction events (approve-milestone with fee deduction).
  // There's no on-chain state to bulk-read. The chainhook handler captures them going forward.
  await updateSyncState('platform_fees', 0, true);
  logger.info('Platform fees marked as synced (event-driven, no bulk state)');
}

/**
 * Run full bootstrap sync.
 * Call this on startup. Idempotent — skips already-synced entities.
 */
export async function runBootstrap() {
  logger.info('Starting bootstrap sync...');

  try {
    await bootstrapEscrows();
  } catch (err) {
    logger.error({ err }, 'Escrow bootstrap failed');
  }

  try {
    await bootstrapDisputes();
  } catch (err) {
    logger.error({ err }, 'Dispute bootstrap failed');
  }

  try {
    await bootstrapProposals();
  } catch (err) {
    logger.error({ err }, 'Proposal bootstrap failed');
  }

  try {
    await bootstrapCommitteeMembers();
  } catch (err) {
    logger.error({ err }, 'Committee member bootstrap failed');
  }

  try {
    await bootstrapMembershipProposals();
  } catch (err) {
    logger.error({ err }, 'Membership proposal bootstrap failed');
  }

  try {
    await bootstrapUserTiers();
  } catch (err) {
    logger.error({ err }, 'User tier bootstrap failed');
  }

  try {
    await bootstrapJobs();
  } catch (err) {
    logger.error({ err }, 'Job bootstrap failed');
  }

  try {
    await bootstrapReputation();
  } catch (err) {
    logger.error({ err }, 'Reputation bootstrap failed');
  }

  try {
    await bootstrapDAOMembers();
  } catch (err) {
    logger.error({ err }, 'DAO member bootstrap failed');
  }

  try {
    await bootstrapJobApplications();
  } catch (err) {
    logger.error({ err }, 'Job application bootstrap failed');
  }

  try {
    await bootstrapPlatformFees();
  } catch (err) {
    logger.error({ err }, 'Platform fees bootstrap failed');
  }

  logger.info('Bootstrap sync complete');
}

// ============================================================
// POLLING: Split into fast (new items) and slow (refresh existing)
// ============================================================

let isFastPolling = false;
let isSlowPolling = false;

/**
 * FAST POLL — Discover new items only (lightweight).
 * Only checks on-chain counts vs DB and fetches genuinely new items.
 * Runs every 30 seconds.
 */
export async function pollForNewItems(): Promise<void> {
  if (isFastPolling) {
    logger.info('Fast poll still running, skipping');
    return;
  }
  isFastPolling = true;
  try {
    let total = 0;

    // New jobs
    total += await discoverNewJobs();
    // New escrows + their milestones
    total += await discoverNewEscrows();
    // New disputes
    total += await discoverNewDisputes();
    // New DAO proposals
    total += await discoverNewProposals();
    // New membership proposals
    total += await discoverNewMembershipProposals();
    // New committee/DAO members (via Hiro tx scan)
    total += await syncCommitteeMembers();
    total += await syncDAOMembers();

    if (total > 0) {
      logger.info({ total }, 'Fast poll: discovered new items');
    }
  } catch (err) {
    logger.error({ err }, 'Fast poll error');
  } finally {
    isFastPolling = false;
  }
}

/**
 * SLOW POLL — Refresh status of existing items (heavier).
 * Re-reads existing records to catch status changes (votes, approvals, etc.).
 * Runs every 5 minutes.
 */
export async function pollRefreshExisting(): Promise<void> {
  if (isSlowPolling) {
    logger.info('Slow poll still running, skipping');
    return;
  }
  isSlowPolling = true;
  try {
    const { query: dbQuery } = await import('../db/pool.js');

    // Refresh existing escrow statuses (active→completed, etc.)
    const escrows = await dbQuery('SELECT on_chain_id FROM escrows ORDER BY on_chain_id ASC');
    for (const row of escrows.rows) {
      try {
        const state = await readEscrowState(row.on_chain_id);
        if (state) await upsertEscrow(state);
      } catch { /* skip */ }
      await sleep(batchDelayMs);
    }

    // Refresh milestones for all escrows
    for (const row of escrows.rows) {
      for (let m = 1; m <= 50; m++) {
        const milestone = await readMilestoneState(row.on_chain_id, m);
        if (!milestone) break;
        await upsertMilestone(milestone);
      }
      await sleep(batchDelayMs);
    }

    // Refresh existing disputes
    const disputes = await dbQuery('SELECT on_chain_id FROM disputes ORDER BY on_chain_id ASC');
    for (const row of disputes.rows) {
      try {
        const state = await readDisputeState(row.on_chain_id);
        if (state) await upsertDispute(state);
      } catch { /* skip */ }
      await sleep(batchDelayMs);
    }

    // Refresh existing DAO proposals (vote counts, status)
    const proposals = await dbQuery('SELECT on_chain_id FROM dao_proposals ORDER BY on_chain_id ASC');
    for (const row of proposals.rows) {
      try {
        const state = await readProposalState(row.on_chain_id);
        if (state) await upsertProposal(state);
      } catch { /* skip */ }
      await sleep(batchDelayMs);
    }

    // Refresh existing membership proposals
    const membershipProposals = await dbQuery('SELECT on_chain_id FROM membership_proposals ORDER BY on_chain_id ASC');
    for (const row of membershipProposals.rows) {
      try {
        const state = await readMembershipProposalState(row.on_chain_id);
        if (state) await upsertMembershipProposal(state);
      } catch { /* skip */ }
      await sleep(batchDelayMs);
    }

    // Refresh user tiers
    const addresses = await dbQuery(
      'SELECT DISTINCT client as address FROM escrows UNION SELECT DISTINCT freelancer as address FROM escrows'
    );
    for (const row of addresses.rows) {
      if (!row.address) continue;
      try {
        const tierInfo = await readUserTierInfo(row.address);
        if (tierInfo) {
          await upsertUserTier({ address: tierInfo.address, tier: tierInfo.tier, total_fees_paid: tierInfo.total_fees_paid });
        }
      } catch { /* skip */ }
      await sleep(batchDelayMs);
    }

    // Refresh job applications
    const appsFromHiro = await fetchJobApplicationsFromHiro();
    for (const { jobId, applicant } of appsFromHiro) {
      try {
        const state = await readJobApplicationState(jobId, applicant);
        if (state) await upsertJobApplication(state);
      } catch { /* skip */ }
      await sleep(batchDelayMs);
    }

    // Refresh reputation
    for (const row of addresses.rows) {
      if (!row.address) continue;
      try {
        const state = await readReputationState(row.address);
        if (state) {
          const { getReputationByAddress } = await import('../db/queries/reputation.js');
          const existing = await getReputationByAddress(row.address);
          if (!existing || existing.score !== state.score || existing.completed_escrows !== state.completed_escrows) {
            await upsertReputation(state);
            if (!existing || existing.score !== state.score) {
              await insertReputationHistory(row.address, state.score, 'poll_sync');
            }
          }
        }
      } catch { /* skip */ }
      await sleep(batchDelayMs);
    }

    logger.info('Slow poll: refreshed existing items');
  } catch (err) {
    logger.error({ err }, 'Slow poll error');
  } finally {
    isSlowPolling = false;
  }
}

// ============================================================
// DISCOVER functions — only fetch NEW items (used by fast poll)
// ============================================================

async function discoverNewJobs(): Promise<number> {
  try {
    const totalOnChain = await readTotalJobs();
    if (totalOnChain === 0) return 0;

    const syncState = await getSyncState('jobs');
    const lastSynced = syncState?.last_synced_id || 0;
    if (totalOnChain <= lastSynced) return 0;

    logger.info({ lastSynced, totalOnChain }, 'Discovering new jobs');
    let synced = 0;
    for (let id = lastSynced + 1; id <= totalOnChain; id++) {
      const state = await readJobState(id);
      if (state) { await upsertJob(state); synced++; }
      await updateSyncState('jobs', id, id === totalOnChain);
    }
    return synced;
  } catch (err) {
    logger.error({ err }, 'discoverNewJobs failed');
    return 0;
  }
}

async function discoverNewEscrows(): Promise<number> {
  try {
    const totalOnChain = await readTotalEscrows();
    if (totalOnChain === 0) return 0;

    const syncState = await getSyncState('escrows');
    const lastSynced = syncState?.last_synced_id || 0;
    if (totalOnChain <= lastSynced) return 0;

    logger.info({ lastSynced, totalOnChain }, 'Discovering new escrows');
    let synced = 0;
    for (let id = lastSynced + 1; id <= totalOnChain; id++) {
      const state = await readEscrowState(id);
      if (state) {
        await upsertEscrow(state);
        synced++;
        // Also fetch milestones for the new escrow
        for (let m = 1; m <= 50; m++) {
          const milestone = await readMilestoneState(id, m);
          if (!milestone) break;
          await upsertMilestone(milestone);
        }
      }
      await updateSyncState('escrows', id, id === totalOnChain);
    }
    return synced;
  } catch (err) {
    logger.error({ err }, 'discoverNewEscrows failed');
    return 0;
  }
}

async function discoverNewDisputes(): Promise<number> {
  try {
    const totalOnChain = await readTotalDisputes();
    if (totalOnChain <= 1) return 0;

    const disputeCount = totalOnChain - 1;
    const syncState = await getSyncState('disputes');
    const lastSynced = syncState?.last_synced_id || 0;
    if (disputeCount <= lastSynced) return 0;

    logger.info({ lastSynced, disputeCount }, 'Discovering new disputes');
    let synced = 0;
    for (let id = lastSynced + 1; id <= disputeCount; id++) {
      const state = await readDisputeState(id);
      if (state) { await upsertDispute(state); synced++; }
      await updateSyncState('disputes', id, id === disputeCount);
    }
    return synced;
  } catch (err) {
    logger.error({ err }, 'discoverNewDisputes failed');
    return 0;
  }
}

async function discoverNewProposals(): Promise<number> {
  try {
    const totalOnChain = await readTotalProposals();
    if (totalOnChain === 0) return 0;

    const syncState = await getSyncState('proposals');
    const lastSynced = syncState?.last_synced_id ?? -1;
    if (totalOnChain - 1 <= lastSynced) return 0;

    logger.info({ lastSynced, totalOnChain }, 'Discovering new DAO proposals');
    let synced = 0;
    for (let id = lastSynced + 1; id < totalOnChain; id++) {
      const state = await readProposalState(id);
      if (state) { await upsertProposal(state); synced++; }
    }
    await updateSyncState('proposals', totalOnChain - 1, true);
    return synced;
  } catch (err) {
    logger.error({ err }, 'discoverNewProposals failed');
    return 0;
  }
}

async function discoverNewMembershipProposals(): Promise<number> {
  try {
    // Use DB max ID to avoid the expensive readTotalMembershipProposals (iterates 200 IDs)
    const { getMaxMembershipProposalId } = await import('../db/queries/committee.js');
    const maxDbId = await getMaxMembershipProposalId();

    // Probe a few IDs beyond what we have to find new proposals
    let synced = 0;
    for (let id = maxDbId + 1; id <= maxDbId + 10; id++) {
      const state = await readMembershipProposalState(id);
      if (!state) break; // No more proposals
      await upsertMembershipProposal(state);
      synced++;
    }
    if (synced > 0) {
      await updateSyncState('membership_proposals', maxDbId + synced, true);
      logger.info({ synced }, 'Discovered new membership proposals');
    }
    return synced;
  } catch (err) {
    logger.error({ err }, 'discoverNewMembershipProposals failed');
    return 0;
  }
}

/**
 * Sync committee members from chain.
 * Re-scans Hiro for set-committee-member txs and verifies on-chain.
 */
export async function syncCommitteeMembers(): Promise<number> {
  try {
    const deployerAddress = config.deployerAddress;
    const addressesFromHiro = await fetchCommitteeAddressesFromHiro();
    const allAddresses = new Set([deployerAddress, ...addressesFromHiro]);

    let synced = 0;
    for (const address of allAddresses) {
      try {
        const status = await readCommitteeMemberStatus(address);
        if (status && status.isMember) {
          await upsertCommitteeMember(address, true);
          synced++;
        }
      } catch { /* skip individual failures */ }
    }
    return synced;
  } catch (err) {
    logger.error({ err }, 'syncCommitteeMembers failed');
    return 0;
  }
}

/**
 * Sync DAO members from chain.
 * Re-scans Hiro for admin-add-dao-member txs and verifies on-chain.
 */
export async function syncDAOMembers(): Promise<number> {
  try {
    const deployerAddress = config.deployerAddress;
    const addressesFromHiro = await fetchDAOMemberAddressesFromHiro();
    const allAddresses = new Set([deployerAddress, ...addressesFromHiro]);

    let synced = 0;
    for (const address of allAddresses) {
      try {
        const status = await readDAOMemberStatus(address);
        if (status && status.isMember) {
          await upsertDAOMember(address, true);
          synced++;
        }
      } catch { /* skip individual failures */ }
    }
    return synced;
  } catch (err) {
    logger.error({ err }, 'syncDAOMembers failed');
    return 0;
  }
}

// Keep legacy export for backward compatibility (index.ts import)
export const pollForNewData = pollForNewItems;

// Also export individual sync functions used by bootstrap
export { discoverNewEscrows as syncLatestEscrows };
export { discoverNewJobs as syncLatestJobs };
export { discoverNewDisputes as syncLatestDisputes };
export { discoverNewProposals as syncLatestProposals };
export { discoverNewMembershipProposals as syncLatestMembershipProposals };
