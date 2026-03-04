// ===============================================
// Database entity types
// ===============================================

export interface Escrow {
  id: number;
  on_chain_id: number;
  client: string;
  freelancer: string;
  total_amount: string; // bigint as string
  remaining_balance: string;
  status: number;
  description: string;
  created_at: number;
  end_date: number;
  updated_at?: Date;
}

export interface Milestone {
  id: number;
  escrow_on_chain_id: number;
  milestone_index: number;
  description: string;
  amount: string;
  deadline: number;
  status: number;
  submission_note: string;
  rejection_reason: string;
  updated_at?: Date;
}

export interface Dispute {
  id: number;
  on_chain_id: number;
  contract_id: number;
  opened_by: string;
  client: string;
  freelancer: string;
  reason: string;
  client_evidence?: string;
  freelancer_evidence?: string;
  status: number;
  resolution: number;
  created_at: number;
  resolved_at?: number;
  updated_at?: Date;
}

export interface DAOProposal {
  id: number;
  on_chain_id: number;
  proposer: string;
  proposal_type: number;
  target_contract_id: number;
  target_member?: string;
  description: string;
  yes_votes: number;
  no_votes: number;
  abstain_votes: number;
  total_eligible_voters: number;
  status: number;
  created_at: number;
  voting_ends_at: number;
  executed_at?: number;
  updated_at?: Date;
}

export interface DAOMember {
  id: number;
  address: string;
  is_active: boolean;
  joined_at?: number;
  updated_at?: Date;
}

export interface CommitteeMember {
  id: number;
  address: string;
  is_active: boolean;
  added_at?: number;
  updated_at?: Date;
}

export interface MembershipProposal {
  id: number;
  on_chain_id: number;
  nominee: string;
  proposer: string;
  stake_amount: string;
  approvals: number;
  rejections: number;
  status: number;
  created_at: number;
  decided_at?: number;
  updated_at?: Date;
}

export interface Vote {
  id: number;
  proposal_on_chain_id: number;
  proposal_type: 'dao' | 'membership';
  voter: string;
  vote: number;
  timestamp: number;
}

export interface Payment {
  id: number;
  tx_id: string;
  payer: string;
  recipient: string;
  amount: string;
  payment_type: string;
  escrow_id?: number;
  created_at?: Date;
}

export interface PendingTransaction {
  id: number;
  tx_id: string;
  function_name: string;
  contract_name: string;
  args: Record<string, any>;
  sender_address: string;
  status: 'pending' | 'confirmed' | 'failed' | 'expired';
  created_at: Date;
  expires_at: Date;
}

export interface SyncState {
  entity_type: string;
  last_synced_id: number;
  last_synced_at: Date;
  is_complete: boolean;
}

export interface BlockchainEvent {
  id: number;
  tx_id: string;
  block_height: number;
  contract_name: string;
  function_name: string;
  args: Record<string, any>;
  success: boolean;
  sender: string;
  created_at: Date;
}

// ===============================================
// API response types
// ===============================================

export interface ApiEscrow {
  id: number;
  client: string;
  freelancer: string;
  totalAmount: number;
  remainingBalance: number;
  status: number;
  description: string;
  createdAt: number;
  endDate: number;
  milestones?: ApiMilestone[];
  pending?: boolean;
}

export interface ApiMilestone {
  id: number;
  escrowId: number;
  description: string;
  amount: number;
  deadline: number;
  status: number;
  submissionNote: string;
  rejectionReason: string;
  feeAmount?: number;
  netAmount?: number;
  pending?: boolean;
}

export interface ApiDispute {
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

export interface ApiProposal {
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

export interface ApiDAOStats {
  totalMembers: number;
  maxMembers: number;
  nextProposalId: number;
  supermajorityThreshold: number;
  memberCount: number;
}

export interface ApiMemberStatus {
  isMember: boolean;
  memberCount: number;
}

export interface ApiCommitteeStatus {
  isMember: boolean;
  committeeCount: number;
}

export interface ApiMembershipProposal {
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

export interface ApiContractReferences {
  membershipContract: string | null;
  disputeContract: string | null;
  escrowContract: string | null;
}

export interface ApiHealth {
  status: 'ok' | 'degraded';
  database: boolean;
  bootstrap: {
    escrows: boolean;
    disputes: boolean;
    proposals: boolean;
  };
  uptime: number;
}

export interface ApiPendingTx {
  txId: string;
  functionName: string;
  contractName: string;
  args: Record<string, any>;
  senderAddress: string;
  status: string;
  createdAt: string;
}

// ===============================================
// Platform Fee types
// ===============================================

export interface PlatformFee {
  id: number;
  tx_id: string;
  escrow_id: number;
  milestone_index: number;
  payer: string;
  fee_amount: string;
  gross_amount: string;
  net_amount: string;
  created_at: Date;
}

export interface UserTier {
  id: number;
  address: string;
  tier: number;
  upgraded_at?: Date;
  total_fees_paid: string;
  updated_at?: Date;
}

// ===============================================
// Pause State types
// ===============================================

export interface ContractPauseState {
  id: number;
  contract_name: string;
  is_paused: boolean;
  paused_by?: string;
  paused_at?: Date;
  updated_at?: Date;
}

// ===============================================
// Reputation types
// ===============================================

export interface UserReputation {
  id: number;
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
  updated_at?: Date;
}

export interface ApiReputation {
  address: string;
  score: number;
  completedEscrows: number;
  cancelledEscrows: number;
  disputesOpened: number;
  disputesWon: number;
  disputesLost: number;
  onTimeCompletions: number;
  lateCompletions: number;
  totalVolume: string;
  lastUpdated: number;
}

// ===============================================
// Marketplace types
// ===============================================

export interface Job {
  id: number;
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
  updated_at?: Date;
}

export interface JobApplication {
  id: number;
  job_on_chain_id: number;
  applicant: string;
  cover_letter: string;
  proposed_amount: string;
  proposed_timeline: number;
  status: number;
  applied_at: number;
  updated_at?: Date;
}

export interface ApiJob {
  id: number;
  poster: string;
  title: string;
  description: string;
  budgetMin: number;
  budgetMax: number;
  deadline: number;
  status: number;
  skills: string;
  createdAt: number;
  escrowId?: number;
  applicationCount: number;
}

export interface ApiJobApplication {
  jobId: number;
  applicant: string;
  coverLetter: string;
  proposedAmount: number;
  proposedTimeline: number;
  status: number;
  appliedAt: number;
  jobTitle?: string;
  jobPoster?: string;
}
