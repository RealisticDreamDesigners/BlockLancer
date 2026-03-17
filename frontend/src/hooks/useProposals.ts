import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useStacks } from './useStacks';
import {
  getProposal,
  getAllProposals,
  getProposalSummary,
  getVote,
  getDAOStats,
  checkDAOMembership,
} from '@/lib/daoContract';
import {
  getVotingTimeRemaining,
  calculateVotingProgress,
  hasReachedThreshold,
} from '@/lib/disputeUtils';
import { Proposal, Vote, ProposalStatus } from '@/types/dispute';

// ===============================================
// QUERY KEYS
// ===============================================

export const PROPOSAL_QUERY_KEYS = {
  all: ['proposals'] as const,
  lists: () => [...PROPOSAL_QUERY_KEYS.all, 'list'] as const,
  list: (filters: string) => [...PROPOSAL_QUERY_KEYS.lists(), filters] as const,
  details: () => [...PROPOSAL_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...PROPOSAL_QUERY_KEYS.details(), id] as const,
  summaries: () => [...PROPOSAL_QUERY_KEYS.all, 'summary'] as const,
  summary: (id: number) => [...PROPOSAL_QUERY_KEYS.summaries(), id] as const,
  votes: () => [...PROPOSAL_QUERY_KEYS.all, 'vote'] as const,
  vote: (proposalId: number, voterAddress: string) =>
    [...PROPOSAL_QUERY_KEYS.votes(), proposalId, voterAddress] as const,
  stats: () => [...PROPOSAL_QUERY_KEYS.all, 'stats'] as const,
};

// ===============================================
// QUERY CONFIGURATION
// ===============================================

const PROPOSAL_QUERY_CONFIG = {
  staleTime: 30000, // 30 seconds
  gcTime: 5 * 60 * 1000, // 5 minutes
  retry: 2,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000),
};

// ===============================================
// DATA FETCHING HOOKS
// ===============================================

/**
 * Hook to fetch a single proposal by ID
 *
 * @param proposalId - The proposal ID to fetch (null to disable)
 * @param options - Optional query configuration overrides
 *
 * @example
 * const { data: proposal, isLoading } = useProposal(1);
 */
export function useProposal(
  proposalId: number | null,
  options?: {
    enabled?: boolean;
    refetchInterval?: number | false;
  }
) {
  const { userAddress } = useStacks();

  return useQuery({
    queryKey: PROPOSAL_QUERY_KEYS.detail(proposalId || 0),
    queryFn: () => proposalId ? getProposal(proposalId, userAddress || undefined) : null,
    enabled: proposalId !== null && (options?.enabled !== false),
    ...PROPOSAL_QUERY_CONFIG,
    refetchInterval: options?.refetchInterval ?? 60000, // Refresh every minute for vote counts
  });
}

/**
 * Hook to fetch proposal with summary/voting stats
 * Use this when you need detailed voting information
 *
 * @param proposalId - The proposal ID
 *
 * @example
 * const { data: summary, isLoading } = useProposalSummary(proposalId);
 */
export function useProposalSummary(
  proposalId: number | null,
  options?: {
    enabled?: boolean;
    refetchInterval?: number | false;
  }
) {
  const { userAddress } = useStacks();

  return useQuery({
    queryKey: PROPOSAL_QUERY_KEYS.summary(proposalId || 0),
    queryFn: () =>
      proposalId ? getProposalSummary(proposalId, userAddress || undefined) : null,
    enabled: proposalId !== null && (options?.enabled !== false),
    ...PROPOSAL_QUERY_CONFIG,
    refetchInterval: options?.refetchInterval ?? 30000, // More frequent for active votes
  });
}

/**
 * Hook to get user's vote on a specific proposal
 *
 * @param proposalId - The proposal ID
 * @param voterAddress - The voter address (defaults to current user)
 *
 * @example
 * const { data: userVote, isLoading } = useUserVote(proposalId);
 */
export function useUserVote(
  proposalId: number | null,
  voterAddress?: string
) {
  const { userAddress: currentUserAddress } = useStacks();
  const addressToCheck = voterAddress || currentUserAddress;

  return useQuery({
    queryKey: PROPOSAL_QUERY_KEYS.vote(proposalId || 0, addressToCheck || '-'),
    queryFn: () =>
      proposalId && addressToCheck
        ? getVote(proposalId, addressToCheck)
        : null,
    enabled: proposalId !== null && !!addressToCheck,
    ...PROPOSAL_QUERY_CONFIG,
  });
}

/**
 * Hook to get DAO statistics
 * Provides overall DAO info like member count, next proposal ID, etc.
 *
 * @example
 * const { data: stats, isLoading } = useDAOStatistics();
 */
export function useDAOStatistics() {
  const { userAddress } = useStacks();

  return useQuery({
    queryKey: PROPOSAL_QUERY_KEYS.stats(),
    queryFn: () => getDAOStats(userAddress || undefined),
    ...PROPOSAL_QUERY_CONFIG,
    staleTime: 60000, // Stats don't change often
  });
}

/**
 * Hook to check if current user is a DAO member
 * Simple boolean check for DAO membership
 *
 * @example
 * const { data: isDAOMember, isLoading } = useDAOMembership();
 */
export function useDAOMembership() {
  const { userAddress, isSignedIn } = useStacks();

  return useQuery({
    queryKey: [...PROPOSAL_QUERY_KEYS.all, 'membership', userAddress || '-'],
    queryFn: async () => {
      if (!userAddress) return false;
      return await checkDAOMembership(userAddress);
    },
    enabled: isSignedIn && !!userAddress,
    ...PROPOSAL_QUERY_CONFIG,
    staleTime: 60000, // Cache for 1 minute
  });
}

/**
 * Hook to fetch all proposals
 * Fetches proposals from 0 to the latest proposal ID
 *
 * @example
 * const { data: proposals, isLoading } = useProposals();
 */
export function useProposals(
  options?: {
    enabled?: boolean;
  }
) {
  const { userAddress } = useStacks();
  const { data: stats } = useDAOStatistics();

  return useQuery({
    queryKey: PROPOSAL_QUERY_KEYS.list('all'),
    queryFn: async () => {
      if (!stats?.nextProposalId || stats.nextProposalId === 0) return [];

      // Use backend bulk endpoint — avoids fetching non-existent proposal IDs
      return getAllProposals(userAddress || undefined);
    },
    enabled: !!stats?.nextProposalId && (options?.enabled !== false),
    ...PROPOSAL_QUERY_CONFIG,
    staleTime: 60000, // Proposals list doesn't change too often
  });
}

/**
 * Hook to fetch multiple proposals by IDs
 *
 * @param proposalIds - Array of proposal IDs
 *
 * @example
 * const { data: proposals } = useMultipleProposals([1, 2, 3]);
 */
export function useMultipleProposals(
  proposalIds: number[],
  options?: {
    enabled?: boolean;
  }
) {
  const { userAddress } = useStacks();

  return useQuery({
    queryKey: [...PROPOSAL_QUERY_KEYS.lists(), 'multiple', proposalIds.join(',')],
    queryFn: async () => {
      if (proposalIds.length === 0) return [];

      // Fetch all proposals in parallel
      const proposalPromises = proposalIds.map(id =>
        getProposal(id, userAddress || undefined)
      );

      const proposals = await Promise.all(proposalPromises);

      // Filter out null results
      return proposals.filter((p): p is Proposal => p !== null);
    },
    enabled: proposalIds.length > 0 && (options?.enabled !== false),
    ...PROPOSAL_QUERY_CONFIG,
  });
}

// ===============================================
// COMPUTED/ENRICHED DATA HOOKS
// ===============================================

/**
 * Hook to get proposal with enriched voting data
 * Adds computed fields like time remaining, voting progress, etc.
 *
 * @param proposalId - The proposal ID
 *
 * @example
 * const { data: enrichedProposal } = useEnrichedProposal(proposalId);
 */
export function useEnrichedProposal(proposalId: number | null) {
  const { data: proposal, ...rest } = useProposal(proposalId);
  const { data: userVote } = useUserVote(proposalId);

  const enrichedProposal = proposal ? {
    ...proposal,
    userVote: userVote || undefined,
    votingProgress: calculateVotingProgress(proposal),
    hasReachedThreshold: hasReachedThreshold(proposal),
    timeRemaining: getVotingTimeRemaining(proposal.votingEndsAt),
    hasUserVoted: !!userVote,
    isActive: proposal.status === ProposalStatus.ACTIVE,
    canStillVote: proposal.status === ProposalStatus.ACTIVE &&
                   !getVotingTimeRemaining(proposal.votingEndsAt).isExpired,
  } : null;

  return {
    data: enrichedProposal,
    ...rest,
  };
}

/**
 * Hook to get proposal with linked dispute data
 * Fetches both proposal and its associated dispute
 *
 * @param proposalId - The proposal ID
 *
 * @example
 * const { data: proposalWithDispute } = useProposalWithDispute(proposalId);
 */
export function useProposalWithDispute(proposalId: number | null) {
  const { data: proposal, ...proposalQuery } = useEnrichedProposal(proposalId);

  // Import useDispute dynamically to avoid circular dependency
  const disputeId = proposal?.targetContractId;

  return {
    data: proposal,
    disputeId,
    ...proposalQuery,
  };
}

// ===============================================
// FILTER & SORT HOOKS
// ===============================================

/**
 * Hook to get filtered proposals
 * Client-side filtering for cached proposal data
 *
 * @param proposals - Array of proposals to filter
 * @param status - Status filter ('all' or specific status)
 *
 * @example
 * const filtered = useFilteredProposals(proposals, ProposalStatus.ACTIVE);
 */
export function useFilteredProposals(
  proposals: Proposal[] | undefined,
  status: ProposalStatus | 'all' = 'all'
): Proposal[] {
  if (!proposals) return [];

  if (status === 'all') return proposals;

  return proposals.filter(p => p.status === status);
}

/**
 * Hook to get active proposals only
 * Convenience wrapper for filtering active proposals
 *
 * @param proposals - Array of proposals
 *
 * @example
 * const activeProposals = useActiveProposals(allProposals);
 */
export function useActiveProposals(proposals: Proposal[] | undefined): Proposal[] {
  return useFilteredProposals(proposals, ProposalStatus.ACTIVE);
}

// ===============================================
// UTILITY HOOKS
// ===============================================

/**
 * Hook to manually refresh proposal data
 *
 * @example
 * const refreshProposals = useRefreshProposals();
 * await refreshProposals();
 */
export function useRefreshProposals() {
  const queryClient = useQueryClient();

  return async () => {
    console.log('Refreshing all proposal data...');
    await queryClient.invalidateQueries({
      queryKey: PROPOSAL_QUERY_KEYS.all,
    });
  };
}

/**
 * Hook to manually refresh a specific proposal
 *
 * @param proposalId - The proposal ID to refresh
 *
 * @example
 * const refreshProposal = useRefreshProposal(proposalId);
 * await refreshProposal();
 */
export function useRefreshProposal(proposalId: number | null) {
  const queryClient = useQueryClient();

  return async () => {
    if (!proposalId) return;

    console.log(`Refreshing proposal #${proposalId}...`);
    await queryClient.invalidateQueries({
      queryKey: PROPOSAL_QUERY_KEYS.detail(proposalId),
    });
    await queryClient.invalidateQueries({
      queryKey: PROPOSAL_QUERY_KEYS.summary(proposalId),
    });
  };
}

/**
 * Hook to get cached proposal data
 *
 * @param proposalId - The proposal ID
 *
 * @example
 * const cachedProposal = useCachedProposal(proposalId);
 */
export function useCachedProposal(proposalId: number | null): Proposal | undefined {
  const queryClient = useQueryClient();

  if (!proposalId) return undefined;

  return queryClient.getQueryData<Proposal>(
    PROPOSAL_QUERY_KEYS.detail(proposalId)
  );
}

/**
 * Hook to prefetch a proposal
 * Useful for hover states or predicted navigation
 *
 * @example
 * const prefetchProposal = usePrefetchProposal();
 * prefetchProposal(proposalId);
 */
export function usePrefetchProposal() {
  const queryClient = useQueryClient();
  const { userAddress } = useStacks();

  return (proposalId: number) => {
    queryClient.prefetchQuery({
      queryKey: PROPOSAL_QUERY_KEYS.detail(proposalId),
      queryFn: () => getProposal(proposalId, userAddress || undefined),
      ...PROPOSAL_QUERY_CONFIG,
    });
  };
}

// ===============================================
// POLLING HOOKS
// ===============================================

/**
 * Hook for aggressive polling of active proposals
 * Use when user is on voting page and needs real-time updates
 *
 * @param proposalId - The proposal ID to poll
 * @param interval - Polling interval (default: 15s for active votes)
 *
 * @example
 * useProposalPolling(proposalId, 15000); // Poll every 15 seconds
 */
export function useProposalPolling(
  proposalId: number | null,
  interval: number = 15000
) {
  const { data: proposal } = useProposal(proposalId, {
    refetchInterval: interval,
  });

  return proposal;
}

// ===============================================
// EXPORT ALL
// ===============================================

export default {
  useProposal,
  useProposals,
  useProposalSummary,
  useUserVote,
  useDAOStatistics,
  useDAOMembership,
  useMultipleProposals,
  useEnrichedProposal,
  useProposalWithDispute,
  useFilteredProposals,
  useActiveProposals,
  useRefreshProposals,
  useRefreshProposal,
  useCachedProposal,
  usePrefetchProposal,
  useProposalPolling,
};
