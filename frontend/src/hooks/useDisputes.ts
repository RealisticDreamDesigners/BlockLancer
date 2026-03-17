import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useStacks } from './useStacks';
import {
  getDispute,
  getContractDispute,
  hasActiveDispute,
  getUserDisputes,
  getAllDisputes,
  getDisputeCount,
} from '@/lib/disputeContract';
import { Dispute } from '@/types/dispute';

// ===============================================
// QUERY KEYS
// ===============================================

export const DISPUTE_QUERY_KEYS = {
  all: ['disputes'] as const,
  lists: () => [...DISPUTE_QUERY_KEYS.all, 'list'] as const,
  list: (filters: string) => [...DISPUTE_QUERY_KEYS.lists(), filters] as const,
  details: () => [...DISPUTE_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...DISPUTE_QUERY_KEYS.details(), id] as const,
  contractDisputes: () => [...DISPUTE_QUERY_KEYS.all, 'contract'] as const,
  contractDispute: (contractId: number) => [...DISPUTE_QUERY_KEYS.contractDisputes(), contractId] as const,
  userDisputes: (userAddress: string) => [...DISPUTE_QUERY_KEYS.all, 'user', userAddress] as const,
  allDisputes: () => [...DISPUTE_QUERY_KEYS.all, 'system'] as const,
  disputeCount: () => [...DISPUTE_QUERY_KEYS.all, 'count'] as const,
  hasActiveDispute: (contractId: number) => [...DISPUTE_QUERY_KEYS.all, 'active', contractId] as const,
};

// ===============================================
// QUERY CONFIGURATION
// ===============================================

const DISPUTE_QUERY_CONFIG = {
  staleTime: 30000, // 30 seconds - disputes don't change often
  gcTime: 5 * 60 * 1000, // 5 minutes
  retry: 2,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000),
};

// ===============================================
// DATA FETCHING HOOKS
// ===============================================

/**
 * Hook to fetch a single dispute by ID
 *
 * @param disputeId - The dispute ID to fetch (null to disable)
 * @param options - Optional query configuration overrides
 *
 * @example
 * const { data: dispute, isLoading, error } = useDispute(1);
 */
export function useDispute(
  disputeId: number | null,
  options?: {
    enabled?: boolean;
    refetchInterval?: number | false;
  }
) {
  const { userAddress } = useStacks();

  return useQuery({
    queryKey: DISPUTE_QUERY_KEYS.detail(disputeId || 0),
    queryFn: () => disputeId ? getDispute(disputeId, userAddress || undefined) : null,
    enabled: disputeId !== null && (options?.enabled !== false),
    ...DISPUTE_QUERY_CONFIG,
    refetchInterval: options?.refetchInterval ?? 60000, // Refresh every minute by default
  });
}

/**
 * Hook to fetch dispute for a specific contract
 *
 * @param contractId - The contract ID to check (null to disable)
 * @param options - Optional query configuration overrides
 *
 * @example
 * const { data: dispute, isLoading } = useContractDispute(contractId);
 */
export function useContractDispute(
  contractId: number | null,
  options?: {
    enabled?: boolean;
    refetchInterval?: number | false;
  }
) {
  const { userAddress } = useStacks();

  return useQuery({
    queryKey: DISPUTE_QUERY_KEYS.contractDispute(contractId || 0),
    queryFn: async () => {
      if (!contractId) return null;

      // First check if contract has active dispute
      const hasDispute = await hasActiveDispute(contractId, userAddress || undefined);
      if (!hasDispute) return null;

      // If it does, fetch the full dispute details
      const dispute = await getContractDispute(contractId, userAddress || undefined);
      return dispute;
    },
    enabled: contractId !== null && (options?.enabled !== false),
    ...DISPUTE_QUERY_CONFIG,
    refetchInterval: options?.refetchInterval ?? 60000,
  });
}

/**
 * Hook to check if a contract has an active dispute (lightweight)
 *
 * @param contractId - The contract ID to check (null to disable)
 *
 * @example
 * const { data: hasDispute, isLoading } = useHasActiveDispute(contractId);
 */
export function useHasActiveDispute(
  contractId: number | null,
  options?: {
    enabled?: boolean;
  }
) {
  const { userAddress } = useStacks();

  return useQuery({
    queryKey: DISPUTE_QUERY_KEYS.hasActiveDispute(contractId || 0),
    queryFn: () => contractId
      ? hasActiveDispute(contractId, userAddress || undefined)
      : false,
    enabled: contractId !== null && (options?.enabled !== false),
    ...DISPUTE_QUERY_CONFIG,
  });
}

/**
 * Hook to fetch all disputes for the current user
 * Note: Contract only returns first 3 disputes due to Clarity limitations
 * Consider using backend API for full list in production
 *
 * @example
 * const { data: disputes, isLoading } = useUserDisputes();
 */
export function useUserDisputes(
  options?: {
    enabled?: boolean;
    refetchInterval?: number | false;
  }
) {
  const { userAddress, isSignedIn } = useStacks();

  return useQuery({
    queryKey: DISPUTE_QUERY_KEYS.userDisputes(userAddress || '-'),
    queryFn: async () => {
      if (!userAddress) return [];

      const disputes = await getUserDisputes(userAddress);
      return disputes;
    },
    enabled: isSignedIn && !!userAddress && (options?.enabled !== false),
    ...DISPUTE_QUERY_CONFIG,
    refetchInterval: options?.refetchInterval ?? 60000,
  });
}

/**
 * Hook to fetch all disputes in the system
 * Shows system-wide dispute statistics
 *
 * @example
 * const { data: allDisputes, isLoading } = useAllDisputes();
 */
export function useAllDisputes(
  options?: {
    enabled?: boolean;
    refetchInterval?: number | false;
  }
) {
  const { userAddress } = useStacks();

  return useQuery({
    queryKey: DISPUTE_QUERY_KEYS.allDisputes(),
    queryFn: async () => {
      const disputes = await getAllDisputes(userAddress || undefined);
      return disputes;
    },
    enabled: options?.enabled !== false,
    ...DISPUTE_QUERY_CONFIG,
    refetchInterval: options?.refetchInterval ?? 60000,
  });
}

/**
 * Hook to get total dispute count
 *
 * @example
 * const { data: count, isLoading } = useDisputeCount();
 */
export function useDisputeCount(
  options?: {
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: DISPUTE_QUERY_KEYS.disputeCount(),
    queryFn: () => getDisputeCount(),
    enabled: options?.enabled !== false,
    ...DISPUTE_QUERY_CONFIG,
  });
}

/**
 * Hook to get multiple disputes by IDs
 * Useful for displaying a list of specific disputes
 *
 * @param disputeIds - Array of dispute IDs to fetch
 *
 * @example
 * const { data: disputes, isLoading } = useMultipleDisputes([1, 2, 3]);
 */
export function useMultipleDisputes(
  disputeIds: number[],
  options?: {
    enabled?: boolean;
  }
) {
  const { userAddress } = useStacks();

  return useQuery({
    queryKey: [...DISPUTE_QUERY_KEYS.lists(), 'multiple', disputeIds.join(',')],
    queryFn: async () => {
      if (disputeIds.length === 0) return [];

      // Fetch all disputes in parallel
      const disputePromises = disputeIds.map(id =>
        getDispute(id, userAddress || undefined)
      );

      const disputes = await Promise.all(disputePromises);

      // Filter out null results (disputes that don't exist)
      return disputes.filter((d): d is Dispute => d !== null);
    },
    enabled: disputeIds.length > 0 && (options?.enabled !== false),
    ...DISPUTE_QUERY_CONFIG,
  });
}

// ===============================================
// UTILITY HOOKS
// ===============================================

/**
 * Hook to manually refresh dispute data
 * Returns a function that invalidates and refetches dispute queries
 *
 * @example
 * const refreshDisputes = useRefreshDisputes();
 * await refreshDisputes();
 */
export function useRefreshDisputes() {
  const queryClient = useQueryClient();

  return async () => {
    console.log('Refreshing all dispute data...');
    await queryClient.invalidateQueries({
      queryKey: DISPUTE_QUERY_KEYS.all,
    });
  };
}

/**
 * Hook to manually refresh a specific dispute
 *
 * @param disputeId - The dispute ID to refresh
 *
 * @example
 * const refreshDispute = useRefreshDispute(disputeId);
 * await refreshDispute();
 */
export function useRefreshDispute(disputeId: number | null) {
  const queryClient = useQueryClient();

  return async () => {
    if (!disputeId) return;

    console.log(`Refreshing dispute #${disputeId}...`);
    await queryClient.invalidateQueries({
      queryKey: DISPUTE_QUERY_KEYS.detail(disputeId),
    });
  };
}

/**
 * Hook to get cached dispute data without triggering a fetch
 * Useful for optimistic updates or reading data that should already be cached
 *
 * @param disputeId - The dispute ID
 *
 * @example
 * const cachedDispute = useCachedDispute(disputeId);
 */
export function useCachedDispute(disputeId: number | null): Dispute | undefined {
  const queryClient = useQueryClient();

  if (!disputeId) return undefined;

  return queryClient.getQueryData<Dispute>(
    DISPUTE_QUERY_KEYS.detail(disputeId)
  );
}

/**
 * Hook to prefetch a dispute
 * Useful for hover states or predicted navigation
 *
 * @example
 * const prefetchDispute = usePrefetchDispute();
 * prefetchDispute(disputeId); // On hover or route prediction
 */
export function usePrefetchDispute() {
  const queryClient = useQueryClient();
  const { userAddress } = useStacks();

  return (disputeId: number) => {
    queryClient.prefetchQuery({
      queryKey: DISPUTE_QUERY_KEYS.detail(disputeId),
      queryFn: () => getDispute(disputeId, userAddress || undefined),
      ...DISPUTE_QUERY_CONFIG,
    });
  };
}

// ===============================================
// POLLING HOOKS
// ===============================================

/**
 * Hook to enable/disable automatic polling for dispute updates
 *
 * @param disputeId - The dispute ID to poll
 * @param interval - Polling interval in milliseconds (default: 30s)
 *
 * @example
 * const { enablePolling, disablePolling, isPolling } = useDisputePolling(disputeId);
 */
export function useDisputePolling(
  disputeId: number | null,
  interval: number = 30000
) {
  const queryClient = useQueryClient();

  const enablePolling = () => {
    if (!disputeId) return;

    queryClient.refetchQueries({
      queryKey: DISPUTE_QUERY_KEYS.detail(disputeId),
    });
  };

  const disablePolling = () => {
    if (!disputeId) return;

    queryClient.cancelQueries({
      queryKey: DISPUTE_QUERY_KEYS.detail(disputeId),
    });
  };

  return {
    enablePolling,
    disablePolling,
  };
}

// ===============================================
// COMPUTED DATA HOOKS
// ===============================================

/**
 * Hook to get dispute with computed fields
 * Adds UI-specific computed properties to dispute data
 *
 * @param disputeId - The dispute ID
 *
 * @example
 * const { data: enrichedDispute } = useEnrichedDispute(disputeId);
 */
export function useEnrichedDispute(disputeId: number | null) {
  const { data: dispute, ...rest } = useDispute(disputeId);
  const { userAddress } = useStacks();

  const enrichedDispute = dispute && userAddress ? {
    ...dispute,
    userRole: dispute.client === userAddress ? 'client' as const
           : dispute.freelancer === userAddress ? 'freelancer' as const
           : null,
    isUserParticipant: dispute.client === userAddress || dispute.freelancer === userAddress,
    hasClientEvidence: !!dispute.clientEvidence,
    hasFreelancerEvidence: !!dispute.freelancerEvidence,
    hasBothEvidence: !!dispute.clientEvidence && !!dispute.freelancerEvidence,
  } : null;

  return {
    data: enrichedDispute,
    ...rest,
  };
}

// ===============================================
// EXPORT ALL
// ===============================================

export default {
  useDispute,
  useContractDispute,
  useHasActiveDispute,
  useUserDisputes,
  useAllDisputes,
  useDisputeCount,
  useMultipleDisputes,
  useRefreshDisputes,
  useRefreshDispute,
  useCachedDispute,
  usePrefetchDispute,
  useDisputePolling,
  useEnrichedDispute,
};
