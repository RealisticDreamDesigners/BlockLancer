import {
  Dispute,
  DisputeStatus,
  ResolutionType,
  Proposal,
  ProposalStatus,
  VoteType,
  DisputeStatistics,
  ProposalStatistics,
} from '@/types/dispute';
import { formatDate } from '@/types/index';
import { DAO_CONSTANTS } from './daoContract';

// ===============================================
// TIME UTILITIES
// ===============================================

/**
 * Get time remaining until voting deadline
 */
export function getVotingTimeRemaining(votingEndsAt: number): {
  text: string;
  isExpired: boolean;
  color: string;
  blocksRemaining: number;
} {
  // votingEndsAt is a block height, not a timestamp.
  // Estimate current block from a known reference point.
  const REFERENCE_BLOCK = 3807000;
  const REFERENCE_TIMESTAMP = 1771603200; // Feb 20, 2026 ~12:00 UTC
  const AVG_BLOCK_TIME = 30; // ~30 seconds on testnet

  const now = Date.now() / 1000;
  const estimatedCurrentBlock = REFERENCE_BLOCK + Math.floor((now - REFERENCE_TIMESTAMP) / AVG_BLOCK_TIME);
  const blocksRemaining = votingEndsAt - estimatedCurrentBlock;

  if (blocksRemaining <= 0) {
    return {
      text: 'Expired',
      isExpired: true,
      color: 'text-red-600',
      blocksRemaining: 0
    };
  }

  // Convert blocks remaining to time (~30 seconds per block on testnet)
  const minutesRemaining = (blocksRemaining * AVG_BLOCK_TIME) / 60;
  const daysRemaining = Math.floor(minutesRemaining / (60 * 24));
  const hoursRemaining = Math.floor((minutesRemaining % (60 * 24)) / 60);
  const minsRemaining = Math.floor(minutesRemaining % 60);

  let text = '-';
  let color = 'text-green-600';

  if (daysRemaining > 3) {
    text = `${daysRemaining} days left`;
    color = 'text-green-600';
  } else if (daysRemaining >= 1) {
    text = `${daysRemaining} day${daysRemaining > 1 ? 's' : '-'} left`;
    color = 'text-yellow-600';
  } else if (hoursRemaining > 0) {
    text = `${hoursRemaining}h ${minsRemaining}m left`;
    color = 'text-blue-600';
  } else if (minsRemaining > 0) {
    text = `${minsRemaining} min left`;
    color = 'text-red-600';
  } else {
    text = 'Expiring soon';
    color = 'text-red-600';
  }

  return {
    text,
    isExpired: false,
    color,
    blocksRemaining: Math.floor(blocksRemaining)
  };
}

/**
 * Format block height or timestamp to human-readable date
 */
export function formatBlockTime(blockHeight: number): string {
  // If it's a large number, treat as Unix timestamp (seconds)
  if (blockHeight > 1000000000) {
    return formatDate(blockHeight * 1000);
  }

  // Approximate date from block height using a known reference point.
  // Testnet block ~3807000 ≈ Feb 20, 2026. Average testnet block time ~30s.
  const REFERENCE_BLOCK = 3807000;
  const REFERENCE_TIMESTAMP = 1771603200; // Feb 20, 2026 ~12:00 UTC
  const AVERAGE_BLOCK_TIME = 30; // ~30 seconds on testnet

  const blockDiff = blockHeight - REFERENCE_BLOCK;
  const approximateTimestamp = REFERENCE_TIMESTAMP + (blockDiff * AVERAGE_BLOCK_TIME);
  return formatDate(approximateTimestamp * 1000);
}

// ===============================================
// VOTING CALCULATIONS
// ===============================================

/**
 * Calculate voting progress percentage
 */
export function calculateVotingProgress(proposal: Proposal): number {
  if (proposal.totalEligibleVoters === 0) return 0;

  const totalVotes = proposal.yesVotes + proposal.noVotes + proposal.abstainVotes;
  return Math.round((totalVotes / proposal.totalEligibleVoters) * 100);
}

/**
 * Calculate if proposal has reached supermajority threshold
 */
export function hasReachedThreshold(proposal: Proposal): boolean {
  const requiredVotes = Math.ceil(
    (proposal.totalEligibleVoters * DAO_CONSTANTS.SUPERMAJORITY_THRESHOLD) / 100
  );
  return proposal.yesVotes >= requiredVotes;
}

/**
 * Get required votes for threshold
 */
export function getRequiredVotesForThreshold(totalEligibleVoters: number): number {
  return Math.ceil((totalEligibleVoters * DAO_CONSTANTS.SUPERMAJORITY_THRESHOLD) / 100);
}

/**
 * Calculate vote percentages
 */
export function calculateVotePercentages(proposal: Proposal): {
  yesPercent: number;
  noPercent: number;
  abstainPercent: number;
  totalVotes: number;
} {
  const totalVotes = proposal.yesVotes + proposal.noVotes + proposal.abstainVotes;

  if (totalVotes === 0) {
    return {
      yesPercent: 0,
      noPercent: 0,
      abstainPercent: 0,
      totalVotes: 0
    };
  }

  return {
    yesPercent: Math.round((proposal.yesVotes / totalVotes) * 100),
    noPercent: Math.round((proposal.noVotes / totalVotes) * 100),
    abstainPercent: Math.round((proposal.abstainVotes / totalVotes) * 100),
    totalVotes
  };
}

// ===============================================
// DISPUTE PERMISSIONS
// ===============================================

/**
 * Check if user can open a dispute
 */
export function canOpenDispute(
  userAddress: string,
  clientAddress: string,
  freelancerAddress: string,
  contractHasDispute: boolean
): boolean {
  // Must be either client or freelancer
  const isParticipant = userAddress === clientAddress || userAddress === freelancerAddress;

  // Contract must not already have an active dispute
  return isParticipant && !contractHasDispute;
}

/**
 * Check if user can submit evidence
 */
export function canSubmitEvidence(
  dispute: Dispute,
  userAddress: string
): boolean {
  // Dispute must be open
  if (dispute.status !== DisputeStatus.OPEN) {
    return false;
  }

  // Check if user is client and hasn't submitted yet
  if (dispute.client === userAddress && !dispute.clientEvidence) {
    return true;
  }

  // Check if user is freelancer and hasn't submitted yet
  if (dispute.freelancer === userAddress && !dispute.freelancerEvidence) {
    return true;
  }

  return false;
}

/**
 * Check if user can withdraw dispute
 */
export function canWithdrawDispute(
  dispute: Dispute,
  userAddress: string
): boolean {
  // Must be the one who opened it
  if (dispute.openedBy !== userAddress) {
    return false;
  }

  // Dispute must still be open
  return dispute.status === DisputeStatus.OPEN;
}

/**
 * Get user's role in dispute
 */
export function getUserRoleInDispute(
  dispute: Dispute,
  userAddress: string
): 'client' | 'freelancer' | null {
  if (dispute.client === userAddress) return 'client';
  if (dispute.freelancer === userAddress) return 'freelancer';
  return null;
}

/**
 * Check if user is a participant in dispute
 */
export function isDisputeParticipant(
  dispute: Dispute,
  userAddress: string
): boolean {
  return dispute.client === userAddress || dispute.freelancer === userAddress;
}

// ===============================================
// PROPOSAL PERMISSIONS
// ===============================================

/**
 * Check if user can create a proposal
 */
export function canCreateProposal(isDAOMember: boolean): boolean {
  return isDAOMember;
}

/**
 * Check if user can vote on proposal
 */
export function canVoteOnProposal(
  proposal: Proposal,
  isDAOMember: boolean,
  hasVoted: boolean
): boolean {
  // Must be DAO member
  if (!isDAOMember) return false;

  // Must not have voted already
  if (hasVoted) return false;

  // Proposal must be active
  if (proposal.status !== ProposalStatus.ACTIVE) return false;

  // Voting period must not have ended
  const timeRemaining = getVotingTimeRemaining(proposal.votingEndsAt);
  if (timeRemaining.isExpired) return false;

  return true;
}

/**
 * Check if proposal can be finalized
 */
export function canFinalizeProposal(proposal: Proposal): boolean {
  // Must be active
  if (proposal.status !== ProposalStatus.ACTIVE) return false;

  // Voting period must have ended
  const timeRemaining = getVotingTimeRemaining(proposal.votingEndsAt);
  return timeRemaining.isExpired;
}

// ===============================================
// STATISTICS CALCULATIONS
// ===============================================

/**
 * Calculate dispute statistics
 */
export function calculateDisputeStatistics(
  disputes: Dispute[],
  userAddress?: string
): DisputeStatistics {
  const stats: DisputeStatistics = {
    total: disputes.length,
    open: 0,
    resolved: 0,
    withdrawn: 0,
    asClient: 0,
    asFreelancer: 0,
    clientWins: 0,
    freelancerWins: 0,
    splits: 0,
  };

  disputes.forEach(dispute => {
    // Count by status
    switch (dispute.status) {
      case DisputeStatus.OPEN:
        stats.open++;
        break;
      case DisputeStatus.RESOLVED:
        stats.resolved++;
        break;
      case DisputeStatus.WITHDRAWN:
        stats.withdrawn++;
        break;
    }

    // Count by user role
    if (userAddress) {
      if (dispute.client === userAddress) {
        stats.asClient++;
      }
      if (dispute.freelancer === userAddress) {
        stats.asFreelancer++;
      }
    }

    // Count by resolution type
    if (dispute.status === DisputeStatus.RESOLVED) {
      switch (dispute.resolution) {
        case ResolutionType.CLIENT_WINS:
          stats.clientWins++;
          break;
        case ResolutionType.FREELANCER_WINS:
          stats.freelancerWins++;
          break;
        case ResolutionType.SPLIT:
          stats.splits++;
          break;
      }
    }
  });

  return stats;
}

/**
 * Calculate proposal statistics
 */
export function calculateProposalStatistics(
  proposals: Proposal[],
  userAddress?: string
): ProposalStatistics {
  const stats: ProposalStatistics = {
    total: proposals.length,
    active: 0,
    passed: 0,
    failed: 0,
    executed: 0,
    averageTurnout: 0,
    userProposals: 0,
    userVotes: 0,
    participationRate: 0,
  };

  proposals.forEach(proposal => {
    // Count by status
    switch (proposal.status) {
      case ProposalStatus.ACTIVE:
        stats.active++;
        break;
      case ProposalStatus.PASSED:
        stats.passed++;
        break;
      case ProposalStatus.FAILED:
        stats.failed++;
        break;
      case ProposalStatus.EXECUTED:
        stats.executed++;
        break;
    }

    // Count user-specific stats
    if (userAddress) {
      if (proposal.proposer === userAddress) {
        stats.userProposals++;
      }
      if (proposal.userVote) {
        stats.userVotes++;
      }
    }
  });

  // Calculate participation rate
  if (proposals.length > 0 && userAddress) {
    stats.participationRate = Math.round((stats.userVotes / proposals.length) * 100);
  }

  // Calculate average turnout
  if (proposals.length > 0) {
    const totalTurnout = proposals.reduce((sum, p) => {
      const totalVotes = p.yesVotes + p.noVotes + p.abstainVotes;
      const turnout = p.totalEligibleVoters > 0
        ? (totalVotes / p.totalEligibleVoters) * 100
        : 0;
      return sum + turnout;
    }, 0);
    stats.averageTurnout = Math.round(totalTurnout / proposals.length);
  }

  return stats;
}

// ===============================================
// FILTER & SORT HELPERS
// ===============================================

/**
 * Filter disputes by status
 */
export function filterDisputesByStatus(
  disputes: Dispute[],
  status: DisputeStatus | 'all'
): Dispute[] {
  if (status === 'all') return disputes;
  return disputes.filter(d => d.status === status);
}

/**
 * Filter disputes by user role
 */
export function filterDisputesByUserRole(
  disputes: Dispute[],
  userAddress: string,
  role: 'client' | 'freelancer' | 'all'
): Dispute[] {
  if (role === 'all') {
    return disputes.filter(d =>
      d.client === userAddress || d.freelancer === userAddress
    );
  }

  if (role === 'client') {
    return disputes.filter(d => d.client === userAddress);
  }

  return disputes.filter(d => d.freelancer === userAddress);
}

/**
 * Sort disputes
 */
export function sortDisputes(
  disputes: Dispute[],
  sortBy: 'date' | 'status' | 'id' = 'date',
  order: 'asc' | 'desc' = 'desc'
): Dispute[] {
  const sorted = [...disputes].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'date':
        comparison = a.createdAt - b.createdAt;
        break;
      case 'status':
        comparison = a.status - b.status;
        break;
      case 'id':
        comparison = a.id - b.id;
        break;
    }

    return order === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

/**
 * Filter proposals by status
 */
export function filterProposalsByStatus(
  proposals: Proposal[],
  status: ProposalStatus | 'all'
): Proposal[] {
  if (status === 'all') return proposals;
  return proposals.filter(p => p.status === status);
}

/**
 * Sort proposals
 */
export function sortProposals(
  proposals: Proposal[],
  sortBy: 'date' | 'votes' | 'deadline' | 'status' | 'id' = 'date',
  order: 'asc' | 'desc' = 'desc'
): Proposal[] {
  const sorted = [...proposals].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'date':
        comparison = a.createdAt - b.createdAt;
        break;
      case 'votes':
        comparison = a.yesVotes - b.yesVotes;
        break;
      case 'deadline':
        comparison = a.votingEndsAt - b.votingEndsAt;
        break;
      case 'status':
        comparison = a.status - b.status;
        break;
      case 'id':
        comparison = a.id - b.id;
        break;
    }

    return order === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

// ===============================================
// ADDRESS FORMATTING
// ===============================================

/**
 * Truncate Stacks address for display
 */
export function truncateAddress(address: string, startChars: number = 6, endChars: number = 4): string {
  if (!address) return '-';
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

// ===============================================
// VALIDATION HELPERS
// ===============================================

/**
 * Validate dispute reason
 */
export function validateDisputeReason(reason: string): {
  isValid: boolean;
  error?: string;
} {
  if (!reason || reason.trim().length === 0) {
    return { isValid: false, error: 'Dispute reason is required' };
  }

  if (reason.length > 500) {
    return { isValid: false, error: 'Dispute reason must be 500 characters or less' };
  }

  if (reason.length < 10) {
    return { isValid: false, error: 'Dispute reason must be at least 10 characters' };
  }

  return { isValid: true };
}

/**
 * Validate evidence
 */
export function validateEvidence(evidence: string): {
  isValid: boolean;
  error?: string;
} {
  if (!evidence || evidence.trim().length === 0) {
    return { isValid: false, error: 'Evidence is required' };
  }

  if (evidence.length > 1000) {
    return { isValid: false, error: 'Evidence must be 1000 characters or less' };
  }

  if (evidence.length < 10) {
    return { isValid: false, error: 'Evidence must be at least 10 characters' };
  }

  return { isValid: true };
}

/**
 * Validate proposal description
 */
export function validateProposalDescription(description: string): {
  isValid: boolean;
  error?: string;
} {
  if (!description || description.trim().length === 0) {
    return { isValid: false, error: 'Proposal description is required' };
  }

  if (description.length > 500) {
    return { isValid: false, error: 'Proposal description must be 500 characters or less' };
  }

  if (description.length < 20) {
    return { isValid: false, error: 'Proposal description must be at least 20 characters' };
  }

  return { isValid: true };
}

// ===============================================
// SEARCH HELPERS
// ===============================================

/**
 * Search disputes by keyword
 */
export function searchDisputes(
  disputes: Dispute[],
  searchTerm: string
): Dispute[] {
  if (!searchTerm || searchTerm.trim().length === 0) {
    return disputes;
  }

  const term = searchTerm.toLowerCase();

  return disputes.filter(dispute =>
    dispute.reason.toLowerCase().includes(term) ||
    dispute.id.toString().includes(term) ||
    dispute.contractId.toString().includes(term) ||
    dispute.client.toLowerCase().includes(term) ||
    dispute.freelancer.toLowerCase().includes(term) ||
    dispute.clientEvidence?.toLowerCase().includes(term) ||
    dispute.freelancerEvidence?.toLowerCase().includes(term)
  );
}

/**
 * Search proposals by keyword
 */
export function searchProposals(
  proposals: Proposal[],
  searchTerm: string
): Proposal[] {
  if (!searchTerm || searchTerm.trim().length === 0) {
    return proposals;
  }

  const term = searchTerm.toLowerCase();

  return proposals.filter(proposal =>
    proposal.description.toLowerCase().includes(term) ||
    proposal.id.toString().includes(term) ||
    proposal.proposer.toLowerCase().includes(term)
  );
}

/**
 * Get resolution info display data
 */
export function getResolutionInfo(resolutionType: ResolutionType): {
  text: string;
  color: string;
  bgColor: string;
} {
  switch (resolutionType) {
    case ResolutionType.CLIENT_WINS:
      return {
        text: 'Refund Client',
        color: 'text-blue-700',
        bgColor: 'bg-blue-100'
      };
    case ResolutionType.FREELANCER_WINS:
      return {
        text: 'Pay Worker',
        color: 'text-green-700',
        bgColor: 'bg-green-100'
      };
    case ResolutionType.SPLIT:
      return {
        text: 'Split Funds',
        color: 'text-purple-700',
        bgColor: 'bg-purple-100'
      };
    case ResolutionType.PENDING:
    default:
      return {
        text: 'Pending',
        color: 'text-gray-700',
        bgColor: 'bg-gray-100'
      };
  }
}
