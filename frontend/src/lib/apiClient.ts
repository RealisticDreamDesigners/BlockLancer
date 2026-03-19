/**
 * API Client for BlockLancer Backend
 *
 * Tries the local backend first (fast, reliable, indexed data).
 * Falls back to Hiro API via existing code paths if backend is down.
 *
 * IMPORTANT: This file does NOT delete or replace existing Hiro API code.
 * The existing functions in useStacks.ts, disputeContract.ts, etc. are kept
 * intact and used as fallback.
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

let backendAvailable: boolean | null = null; // null = unknown
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 30_000; // 30 seconds

/**
 * Check if the backend is reachable. Cached for 30 seconds.
 */
export async function isBackendAvailable(): Promise<boolean> {
  const now = Date.now();
  if (backendAvailable !== null && now - lastHealthCheck < HEALTH_CHECK_INTERVAL) {
    return backendAvailable;
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/health`, {
      signal: AbortSignal.timeout(15000), // 15s to survive Render free tier cold starts
    });
    backendAvailable = response.ok;
    lastHealthCheck = now;
    return backendAvailable;
  } catch {
    backendAvailable = false;
    lastHealthCheck = now;
    return false;
  }
}

/**
 * Fetch from the backend API. Returns null if backend is unavailable or returns error.
 */
async function fetchBackend<T>(path: string): Promise<T | null> {
  try {
    const available = await isBackendAvailable();
    if (!available) return null;

    const response = await fetch(`${BACKEND_URL}${path}`, {
      signal: AbortSignal.timeout(15000), // 15s to survive Render free tier cold starts
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      console.warn(`Backend returned ${response.status} for ${path}`);
      return null;
    }

    return await response.json();
  } catch (err) {
    console.warn('Backend fetch failed:', path, err);
    return null;
  }
}

/**
 * POST to the backend API.
 */
async function postBackend<T>(path: string, body: any): Promise<T | null> {
  try {
    const available = await isBackendAvailable();
    if (!available) return null;

    const response = await fetch(`${BACKEND_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    console.warn('Backend POST failed:', path, err);
    return null;
  }
}

// ===============================================
// ESCROW FUNCTIONS
// ===============================================

export interface BackendEscrow {
  id: number;
  client: string;
  freelancer: string;
  totalAmount: number;
  remainingBalance: number;
  status: number;
  description: string;
  createdAt: number;
  endDate: number;
  milestones?: BackendMilestone[];
  pending?: boolean;
}

export interface BackendMilestone {
  id: number;
  escrowId: number;
  description: string;
  amount: number;
  deadline: number;
  status: number;
  submissionNote: string;
  rejectionReason: string;
  pending?: boolean;
}

/**
 * Get escrow by ID from backend.
 */
export async function getEscrowFromBackend(id: number): Promise<BackendEscrow | null> {
  return fetchBackend<BackendEscrow>(`/api/escrows/${id}`);
}

/**
 * Get total escrow count from backend.
 */
export async function getEscrowCountFromBackend(): Promise<number | null> {
  const result = await fetchBackend<{ count: number }>('/api/escrows/count');
  return result?.count ?? null;
}

/**
 * Get escrows for a user from backend.
 */
export async function getUserEscrowsFromBackend(address: string): Promise<BackendEscrow[] | null> {
  return fetchBackend<BackendEscrow[]>(`/api/escrows/user/${address}`);
}

/**
 * Get milestones for an escrow from backend.
 */
export async function getEscrowMilestonesFromBackend(escrowId: number): Promise<BackendMilestone[] | null> {
  return fetchBackend<BackendMilestone[]>(`/api/escrows/${escrowId}/milestones`);
}

// ===============================================
// DISPUTE FUNCTIONS
// ===============================================

export interface BackendDispute {
  id: number;
  contractId: number;
  openedBy: string;
  client: string;
  freelancer: string;
  reason: string;
  clientEvidence?: string;
  freelancerEvidence?: string;
  status: number;
  resolution: number;
  createdAt: number;
  resolvedAt?: number;
  pending?: boolean;
}

/**
 * Get dispute by ID from backend.
 */
export async function getDisputeFromBackend(id: number): Promise<BackendDispute | null> {
  return fetchBackend<BackendDispute>(`/api/disputes/${id}`);
}

/**
 * Get dispute count from backend.
 */
export async function getDisputeCountFromBackend(): Promise<number | null> {
  const result = await fetchBackend<{ count: number }>('/api/disputes/count');
  return result?.count ?? null;
}

/**
 * Get all disputes from backend.
 */
export async function getAllDisputesFromBackend(): Promise<BackendDispute[] | null> {
  return fetchBackend<BackendDispute[]>('/api/disputes/all');
}

/**
 * Get dispute by contract ID from backend.
 */
export async function getContractDisputeFromBackend(contractId: number): Promise<BackendDispute | null> {
  return fetchBackend<BackendDispute>(`/api/disputes/contract/${contractId}`);
}

/**
 * Get disputes for a user from backend.
 */
export async function getUserDisputesFromBackend(address: string): Promise<BackendDispute[] | null> {
  return fetchBackend<BackendDispute[]>(`/api/disputes/user/${address}`);
}

// ===============================================
// DAO / PROPOSAL FUNCTIONS
// ===============================================

export interface BackendProposal {
  id: number;
  proposer: string;
  proposalType: number;
  targetContractId: number;
  targetMember?: string;
  description: string;
  yesVotes: number;
  noVotes: number;
  abstainVotes: number;
  totalEligibleVoters: number;
  status: number;
  createdAt: number;
  votingEndsAt: number;
  executedAt?: number;
  votingProgress: number;
  hasReachedThreshold: boolean;
  pending?: boolean;
}

export interface BackendDAOStats {
  totalMembers: number;
  maxMembers: number;
  nextProposalId: number;
  supermajorityThreshold: number;
  memberCount: number;
}

export interface BackendMemberStatus {
  isMember: boolean;
  memberCount: number;
}

/**
 * Get DAO stats from backend.
 */
export async function getDAOStatsFromBackend(): Promise<BackendDAOStats | null> {
  return fetchBackend<BackendDAOStats>('/api/dao/stats');
}

/**
 * Get proposal by ID from backend.
 */
export async function getProposalFromBackend(id: number): Promise<BackendProposal | null> {
  return fetchBackend<BackendProposal>(`/api/proposals/${id}`);
}

/**
 * Get all proposals from backend.
 */
export async function getAllProposalsFromBackend(): Promise<BackendProposal[] | null> {
  return fetchBackend<BackendProposal[]>('/api/proposals/all');
}

/**
 * Get proposal count from backend.
 */
export async function getProposalCountFromBackend(): Promise<number | null> {
  const result = await fetchBackend<{ count: number }>('/api/proposals/count');
  return result?.count ?? null;
}

/**
 * Get DAO member status from backend.
 */
export async function getDAOMemberStatusFromBackend(address: string): Promise<BackendMemberStatus | null> {
  return fetchBackend<BackendMemberStatus>(`/api/dao/member/${address}`);
}

/**
 * Get DAO member count from backend.
 */
export async function getDAOMemberCountFromBackend(): Promise<number | null> {
  const result = await fetchBackend<{ count: number }>('/api/dao/members/count');
  return result?.count ?? null;
}

/**
 * Get a vote from backend.
 */
export async function getVoteFromBackend(proposalId: number, voter: string): Promise<any | null> {
  return fetchBackend(`/api/dao/vote/${proposalId}/${voter}`);
}

// ===============================================
// COMMITTEE / MEMBERSHIP FUNCTIONS
// ===============================================

export interface BackendCommitteeStatus {
  isMember: boolean;
  committeeCount: number;
}

export interface BackendMembershipProposal {
  id: number;
  nominee: string;
  proposer: string;
  stakeAmount: number;
  approvals: number;
  rejections: number;
  status: number;
  createdAt: number;
  decidedAt?: number;
  pending?: boolean;
}

/**
 * Get committee member status from backend.
 */
export async function getCommitteeStatusFromBackend(address: string): Promise<BackendCommitteeStatus | null> {
  return fetchBackend<BackendCommitteeStatus>(`/api/committee/status/${address}`);
}

/**
 * Get committee member count from backend.
 */
export async function getCommitteeCountFromBackend(): Promise<number | null> {
  const result = await fetchBackend<{ count: number }>('/api/committee/count');
  return result?.count ?? null;
}

/**
 * Get membership proposal from backend.
 */
export async function getMembershipProposalFromBackend(id: number): Promise<BackendMembershipProposal | null> {
  return fetchBackend<BackendMembershipProposal>(`/api/membership/proposals/${id}`);
}

/**
 * Get all pending membership proposals from backend.
 */
export async function getPendingMembershipProposalsFromBackend(): Promise<BackendMembershipProposal[] | null> {
  return fetchBackend<BackendMembershipProposal[]>('/api/membership/proposals/pending');
}

// ===============================================
// CONTRACT REFERENCES
// ===============================================

export interface BackendContractReferences {
  membershipContract: string | null;
  disputeContract: string | null;
  escrowContract: string | null;
}

/**
 * Get contract linking references from backend.
 */
export async function getContractReferencesFromBackend(): Promise<BackendContractReferences | null> {
  return fetchBackend<BackendContractReferences>('/api/contracts/references');
}

// ===============================================
// PENDING TRANSACTIONS (Optimistic UI)
// ===============================================

/**
 * Submit a pending transaction for optimistic UI.
 */
export async function submitPendingTx(data: {
  txId: string;
  functionName: string;
  contractName: string;
  args: Record<string, any>;
  senderAddress: string;
}): Promise<any> {
  return postBackend('/api/pending-tx', data);
}

/**
 * Check a pending transaction status.
 */
export async function getPendingTxStatus(txId: string): Promise<any> {
  return fetchBackend(`/api/pending-tx/${txId}`);
}

// ===============================================
// PAYMENTS / FEE FUNCTIONS
// ===============================================

export interface BackendUserTier {
  address: string;
  tier: number;
  total_fees_paid: string;
  upgraded_at?: string;
}

export interface BackendPlatformStats {
  totalFees: string;
  totalTransactions: number;
  tierBreakdown: Array<{ tier: number; count: string }>;
}

/**
 * Get user tier from backend.
 */
export async function getUserTierFromBackend(address: string): Promise<BackendUserTier | null> {
  return fetchBackend<BackendUserTier>(`/api/payments/user/${address}/tier`);
}

/**
 * Get platform fee stats from backend.
 */
export async function getPlatformStatsFromBackend(): Promise<BackendPlatformStats | null> {
  return fetchBackend<BackendPlatformStats>('/api/payments/stats');
}

/**
 * Get total platform fees collected.
 */
export async function getTotalFeesFromBackend(): Promise<string | null> {
  const result = await fetchBackend<{ total: string }>('/api/payments/fees/total');
  return result?.total ?? null;
}

// ===============================================
// ADMIN / PAUSE STATE FUNCTIONS
// ===============================================

export interface BackendPauseState {
  contract_name: string;
  is_paused: boolean;
  paused_by?: string;
  paused_at?: string;
}

/**
 * Get all contract pause states.
 */
export async function getAllPauseStatesFromBackend(): Promise<BackendPauseState[] | null> {
  return fetchBackend<BackendPauseState[]>('/api/admin/pause-state');
}

/**
 * Get pause state for a specific contract.
 */
export async function getPauseStateFromBackend(contractName: string): Promise<BackendPauseState | null> {
  return fetchBackend<BackendPauseState>(`/api/admin/pause-state/${contractName}`);
}

// ===============================================
// REPUTATION FUNCTIONS
// ===============================================

export interface BackendReputation {
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
}

/**
 * Get user reputation from backend.
 */
export async function getReputationFromBackend(address: string): Promise<BackendReputation | null> {
  return fetchBackend<BackendReputation>(`/api/reputation/${address}`);
}

/**
 * Get reputation leaderboard from backend.
 */
export async function getLeaderboardFromBackend(limit = 20, offset = 0): Promise<{
  leaderboard: BackendReputation[];
  total: number;
} | null> {
  return fetchBackend(`/api/reputation/leaderboard?limit=${limit}&offset=${offset}`);
}

export interface ReputationHistoryEntry {
  score: number;
  source: string;
  created_at: string;
}

/**
 * Get reputation score history for an address.
 */
export async function getReputationHistoryFromBackend(address: string, limit = 20): Promise<{
  history: ReputationHistoryEntry[];
} | null> {
  return fetchBackend(`/api/reputation/${address}/history?limit=${limit}`);
}

// ===============================================
// MARKETPLACE FUNCTIONS
// ===============================================

export interface BackendJob {
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
  escrow_id?: number;
  application_count: number;
}

export interface BackendJobApplication {
  job_on_chain_id: number;
  applicant: string;
  cover_letter: string;
  proposed_amount: string;
  proposed_timeline: number;
  status: number;
  applied_at: number;
  job_title?: string;
  job_poster?: string;
}

/**
 * Get jobs list from backend.
 */
export async function getJobsFromBackend(filters: {
  status?: number;
  poster?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<{ jobs: BackendJob[]; total: number } | null> {
  const params = new URLSearchParams();
  if (filters.status !== undefined) params.set('status', String(filters.status));
  if (filters.poster) params.set('poster', filters.poster);
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.offset) params.set('offset', String(filters.offset));
  const qs = params.toString();
  return fetchBackend(`/api/jobs${qs ? `?${qs}` : '-'}`);
}

/**
 * Get job by ID from backend.
 */
export async function getJobFromBackend(id: number): Promise<BackendJob | null> {
  return fetchBackend<BackendJob>(`/api/jobs/${id}`);
}

/**
 * Get applications for a job from backend.
 */
export async function getJobApplicationsFromBackend(jobId: number): Promise<BackendJobApplication[] | null> {
  return fetchBackend<BackendJobApplication[]>(`/api/jobs/${jobId}/applications`);
}

/**
 * Get user's job applications from backend.
 */
export async function getUserApplicationsFromBackend(address: string): Promise<BackendJobApplication[] | null> {
  return fetchBackend<BackendJobApplication[]>(`/api/applications/user/${address}`);
}

/**
 * Get milestone by ID from backend.
 */
export async function getMilestoneFromBackend(escrowId: number, milestoneId: number): Promise<BackendMilestone | null> {
  return fetchBackend<BackendMilestone>(`/api/escrows/${escrowId}/milestones/${milestoneId}`);
}

// ===============================================
// HEALTH CHECK
// ===============================================

/**
 * Get backend health status.
 */
export async function getBackendHealth(): Promise<any> {
  return fetchBackend('/api/health');
}

/**
 * Force a health check refresh.
 */
export function resetBackendHealthCache() {
  backendAvailable = null;
  lastHealthCheck = 0;
}
