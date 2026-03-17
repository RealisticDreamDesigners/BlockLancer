import { CheckCircle, AlertTriangle, Clock, X } from 'lucide-react';
import React from 'react';
import { Contract } from './index';

// ===============================================
// ENUMS
// ===============================================

// Dispute Status Enum (matches smart contract)
export enum DisputeStatus {
  OPEN = 0,
  RESOLVED = 1,
  WITHDRAWN = 2
}

// Resolution Type Enum (matches smart contract)
export enum ResolutionType {
  PENDING = 0,
  CLIENT_WINS = 1,
  FREELANCER_WINS = 2,
  SPLIT = 3  // Future implementation
}

// Proposal Status Enum (DAO)
export enum ProposalStatus {
  ACTIVE = 0,
  PASSED = 1,
  FAILED = 2,
  EXECUTED = 3
}

// Proposal Type Enum (DAO)
export enum ProposalType {
  DISPUTE = 0,
  ESCROW_RELEASE = 1,
  ESCROW_REFUND = 2,
  REMOVE_MEMBER = 3
}

// Vote Type Enum
export enum VoteType {
  YES = 1,
  NO = 2,
  ABSTAIN = 3
}

// ===============================================
// CORE INTERFACES
// ===============================================

// Dispute Data Interface
export interface Dispute {
  id: number;
  contractId: number;
  openedBy: string;  // principal
  client: string;    // principal
  freelancer: string; // principal
  reason: string;
  clientEvidence?: string;
  freelancerEvidence?: string;
  status: DisputeStatus;
  resolution: ResolutionType;
  createdAt: number;  // block height or timestamp
  resolvedAt?: number;

  // UI enhancements (fetched separately or computed)
  contract?: Contract;  // Associated contract data
  proposal?: Proposal;  // Associated DAO proposal
}

// DAO Proposal Interface
export interface Proposal {
  id: number;
  proposer: string;  // principal
  proposalType: ProposalType;
  targetContractId: number;  // Actually dispute-id for dispute proposals
  targetMember?: string;
  description: string;
  yesVotes: number;
  noVotes: number;
  abstainVotes: number;
  totalEligibleVoters: number;
  status: ProposalStatus;
  createdAt: number;
  votingEndsAt: number;
  executedAt?: number;

  // UI enhancements (computed)
  dispute?: Dispute;  // Associated dispute
  userVote?: Vote;    // Current user's vote
  votingProgress: number;  // Percentage of votes cast
  timeRemaining?: string;   // Human-readable
  hasReachedThreshold?: boolean; // If yes votes >= 70%
}

// Vote Interface
export interface Vote {
  proposalId: number;
  voter: string;  // principal
  vote: VoteType;
  timestamp: number;
}

// DAO Member Status Interface
export interface DAOMemberStatus {
  isMember: boolean;
  memberCount: number;
  activity?: {
    lastVote: number;
    totalVotes: number;
    proposalsCreated: number;
  };
}

// ===============================================
// STATISTICS INTERFACES
// ===============================================

// Dispute Statistics Interface
export interface DisputeStatistics {
  total: number;
  open: number;
  resolved: number;
  withdrawn: number;

  // By user role
  asClient: number;
  asFreelancer: number;

  // Resolution breakdown
  clientWins: number;
  freelancerWins: number;
  splits: number;
}

// Proposal Statistics Interface
export interface ProposalStatistics {
  total: number;
  active: number;
  passed: number;
  failed: number;
  executed: number;

  // Aggregate
  averageTurnout: number;

  // User-specific
  userProposals: number;
  userVotes: number;
  participationRate: number;
}

// ===============================================
// FORM DATA INTERFACES
// ===============================================

// Open Dispute Form Data
export interface OpenDisputeFormData {
  contractId: number;
  reason: string;
}

// Submit Evidence Form Data
export interface SubmitEvidenceFormData {
  disputeId: number;
  evidence: string;
}

// Create Proposal Form Data
export interface CreateProposalFormData {
  disputeId: number;
  description: string;
  recommendedResolution?: ResolutionType; // UI only, not stored on-chain
}

// Vote Form Data
export interface VoteFormData {
  proposalId: number;
  vote: VoteType;
}

// ===============================================
// API RESPONSE TYPES
// ===============================================

export interface DisputeResponse {
  success: boolean;
  disputeId?: number;
  txId?: string;
  error?: string;
}

export interface ProposalResponse {
  success: boolean;
  proposalId?: number;
  txId?: string;
  error?: string;
}

export interface VoteResponse {
  success: boolean;
  txId?: string;
  error?: string;
}

export interface TransactionError {
  code: string;
  message: string;
  details?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: TransactionError;
}

// ===============================================
// COMPONENT PROP TYPES
// ===============================================

export interface DisputeCardProps {
  dispute: Dispute;
  showContract?: boolean;
  onClick?: (disputeId: number) => void;
}

export interface DisputeListProps {
  disputes: Dispute[];
  emptyMessage?: string;
}

export interface DisputeBadgeProps {
  status: DisputeStatus;
  resolution?: ResolutionType;
  size?: 'sm' | 'md' | 'lg';
}

export interface EvidenceCardProps {
  role: 'client' | 'freelancer';
  evidence?: string;
  author: string;
  submittedAt?: number;
}

export interface ProposalCardProps {
  proposal: Proposal;
  onClick?: (proposalId: number) => void;
}

export interface VotingInterfaceProps {
  proposal: Proposal;
  userVote?: Vote;
  isDAOMember: boolean;
  onVote: (vote: VoteType) => void;
  disabled?: boolean;
}

export interface VoteBreakdownProps {
  proposal: Proposal;
  showThreshold?: boolean;
}

// ===============================================
// TIMELINE & EVENT TYPES
// ===============================================

export enum DisputeEventType {
  OPENED = 'opened',
  EVIDENCE_SUBMITTED = 'evidence-submitted',
  PROPOSAL_CREATED = 'proposal-created',
  VOTE_CAST = 'vote-cast',
  RESOLVED = 'resolved',
  WITHDRAWN = 'withdrawn'
}

export interface DisputeEvent {
  type: DisputeEventType;
  timestamp: number;
  actor: string;  // principal
  metadata?: {
    proposalId?: number;
    vote?: VoteType;
    resolution?: ResolutionType;
    [key: string]: any;
  };
}

export interface DisputeTimelineProps {
  events: DisputeEvent[];
  dispute: Dispute;
}

// ===============================================
// UTILITY TYPE GUARDS
// ===============================================

export function isDisputeOpen(status: DisputeStatus): boolean {
  return status === DisputeStatus.OPEN;
}

export function isDisputeResolved(status: DisputeStatus): boolean {
  return status === DisputeStatus.RESOLVED;
}

export function isDisputeWithdrawn(status: DisputeStatus): boolean {
  return status === DisputeStatus.WITHDRAWN;
}

export function isProposalActive(status: ProposalStatus): boolean {
  return status === ProposalStatus.ACTIVE;
}

export function isProposalFinalized(status: ProposalStatus): boolean {
  return status !== ProposalStatus.ACTIVE;
}

// ===============================================
// STATUS INFO HELPERS
// ===============================================

export interface StatusInfo {
  text: string;
  color: string;
  description: string;
  icon: React.ElementType;
}

export function getDisputeStatusInfo(status: DisputeStatus): StatusInfo {
  switch (status) {
    case DisputeStatus.OPEN:
      return {
        text: 'Open',
        color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
        description: 'Dispute is currently open and awaiting resolution',
        icon: AlertTriangle
      };
    case DisputeStatus.RESOLVED:
      return {
        text: 'Resolved',
        color: 'text-blue-600 bg-blue-50 border-blue-200',
        description: 'Dispute has been resolved by DAO vote',
        icon: CheckCircle
      };
    case DisputeStatus.WITHDRAWN:
      return {
        text: 'Withdrawn',
        color: 'text-gray-600 bg-gray-50 border-gray-200',
        description: 'Dispute was withdrawn by the opener',
        icon: X
      };
    default:
      return {
        text: 'Unknown',
        color: 'text-gray-600 bg-gray-50 border-gray-200',
        description: 'Unknown dispute status',
        icon: AlertTriangle
      };
  }
}

export function getResolutionTypeInfo(resolution: ResolutionType): StatusInfo {
  switch (resolution) {
    case ResolutionType.PENDING:
      return {
        text: 'Pending',
        color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
        description: 'Awaiting DAO resolution',
        icon: Clock
      };
    case ResolutionType.CLIENT_WINS:
      return {
        text: 'Employer Wins',
        color: 'text-blue-600 bg-blue-50 border-blue-200',
        description: 'DAO ruled in favor of client',
        icon: CheckCircle
      };
    case ResolutionType.FREELANCER_WINS:
      return {
        text: 'Worker Wins',
        color: 'text-green-600 bg-green-50 border-green-200',
        description: 'DAO ruled in favor of freelancer',
        icon: CheckCircle
      };
    case ResolutionType.SPLIT:
      return {
        text: 'Split Decision',
        color: 'text-purple-600 bg-purple-50 border-purple-200',
        description: 'DAO ruled for split resolution',
        icon: CheckCircle
      };
    default:
      return {
        text: 'Unknown',
        color: 'text-gray-600 bg-gray-50 border-gray-200',
        description: 'Unknown resolution type',
        icon: AlertTriangle
      };
  }
}

export function getProposalStatusInfo(status: ProposalStatus): StatusInfo {
  switch (status) {
    case ProposalStatus.ACTIVE:
      return {
        text: 'Active',
        color: 'text-blue-600 bg-blue-50 border-blue-200',
        description: 'Proposal is currently active and accepting votes',
        icon: Clock
      };
    case ProposalStatus.PASSED:
      return {
        text: 'Passed',
        color: 'text-green-600 bg-green-50 border-green-200',
        description: 'Proposal passed with supermajority',
        icon: CheckCircle
      };
    case ProposalStatus.FAILED:
      return {
        text: 'Failed',
        color: 'text-red-600 bg-red-50 border-red-200',
        description: 'Proposal did not reach required threshold',
        icon: X
      };
    case ProposalStatus.EXECUTED:
      return {
        text: 'Executed',
        color: 'text-purple-600 bg-purple-50 border-purple-200',
        description: 'Proposal was executed successfully',
        icon: CheckCircle
      };
    default:
      return {
        text: 'Unknown',
        color: 'text-gray-600 bg-gray-50 border-gray-200',
        description: 'Unknown proposal status',
        icon: AlertTriangle
      };
  }
}

export function getVoteTypeInfo(vote: VoteType): {
  text: string;
  color: string;
  icon: React.ElementType;
} {
  switch (vote) {
    case VoteType.YES:
      return {
        text: 'Yes',
        color: 'text-green-600',
        icon: CheckCircle
      };
    case VoteType.NO:
      return {
        text: 'No',
        color: 'text-red-600',
        icon: X
      };
    case VoteType.ABSTAIN:
      return {
        text: 'Abstain',
        color: 'text-gray-600',
        icon: Clock
      };
    default:
      return {
        text: 'Unknown',
        color: 'text-gray-600',
        icon: AlertTriangle
      };
  }
}
