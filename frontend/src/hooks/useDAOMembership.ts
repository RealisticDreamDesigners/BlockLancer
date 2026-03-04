import { useQuery } from '@tanstack/react-query';
import { useStacks } from './useStacks';
import { getDAOMemberStatus } from '@/lib/daoContract';
import { DAOMemberStatus } from '@/types/dispute';

// ===============================================
// QUERY KEYS
// ===============================================

export const DAO_MEMBERSHIP_QUERY_KEYS = {
  all: ['dao-membership'] as const,
  memberStatus: (userAddress: string) =>
    [...DAO_MEMBERSHIP_QUERY_KEYS.all, userAddress] as const,
};

// ===============================================
// QUERY CONFIGURATION
// ===============================================

const DAO_MEMBERSHIP_QUERY_CONFIG = {
  staleTime: 5 * 60 * 1000, // 5 minutes - membership doesn't change often
  gcTime: 15 * 60 * 1000, // 15 minutes
  retry: 2,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000),
};

// ===============================================
// DAO MEMBERSHIP HOOK
// ===============================================

/**
 * Hook to check if current user is a DAO member
 * Returns membership status and activity metrics
 *
 * @example
 * const { data: status, isLoading } = useDAOMembership();
 *
 * if (status?.isMember) {
 *   // Show DAO features
 * }
 */
export function useDAOMembership() {
  const { userAddress, isSignedIn } = useStacks();

  return useQuery({
    queryKey: DAO_MEMBERSHIP_QUERY_KEYS.memberStatus(userAddress || ''),
    queryFn: async () => {
      if (!userAddress) {
        return {
          isMember: false,
          memberCount: 0,
        } as DAOMemberStatus;
      }

      const status = await getDAOMemberStatus(userAddress);
      return status;
    },
    enabled: isSignedIn && !!userAddress,
    ...DAO_MEMBERSHIP_QUERY_CONFIG,
  });
}

/**
 * Hook to check a specific address's DAO membership
 * Useful for checking other users' membership status
 *
 * @param address - The address to check
 *
 * @example
 * const { data: isUserDAOMember } = useCheckDAOMembership('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
 */
export function useCheckDAOMembership(address: string | null | undefined) {
  return useQuery({
    queryKey: DAO_MEMBERSHIP_QUERY_KEYS.memberStatus(address || ''),
    queryFn: async () => {
      if (!address) {
        return {
          isMember: false,
          memberCount: 0,
        } as DAOMemberStatus;
      }

      const status = await getDAOMemberStatus(address);
      return status;
    },
    enabled: !!address,
    ...DAO_MEMBERSHIP_QUERY_CONFIG,
  });
}

// ===============================================
// COMPUTED HOOKS
// ===============================================

/**
 * Hook that returns just the boolean membership status
 * Convenience wrapper for simple membership checks
 *
 * @example
 * const isDAOMember = useIsDAOMember();
 *
 * if (isDAOMember) {
 *   // Render DAO features
 * }
 */
export function useIsDAOMember(): boolean {
  const { data: status } = useDAOMembership();
  return status?.isMember || false;
}

/**
 * Hook to get DAO member count
 *
 * @example
 * const memberCount = useDAOMemberCount();
 */
export function useDAOMemberCount(): number {
  const { data: status } = useDAOMembership();
  return status?.memberCount || 0;
}

/**
 * Hook to get member activity metrics
 * Returns activity data if user is a member
 *
 * @example
 * const activity = useDAOMemberActivity();
 *
 * if (activity) {
 *   console.log('Total votes:', activity.totalVotes);
 * }
 */
export function useDAOMemberActivity() {
  const { data: status } = useDAOMembership();

  if (!status?.isMember || !status.activity) {
    return null;
  }

  return status.activity;
}

/**
 * Hook to get enriched DAO membership data
 * Adds computed fields and formatted strings
 *
 * @example
 * const { data: enrichedStatus } = useEnrichedDAOMembership();
 */
export function useEnrichedDAOMembership() {
  const { data: status, ...rest } = useDAOMembership();

  const enrichedStatus = status ? {
    ...status,
    participationRate: status.activity && status.activity.totalVotes > 0
      ? Math.round((status.activity.totalVotes / (status.activity.proposalsCreated || 1)) * 100)
      : 0,
    hasActivity: !!status.activity && (
      status.activity.totalVotes > 0 ||
      status.activity.proposalsCreated > 0
    ),
    membershipPercentage: status.isMember && status.memberCount > 0
      ? Math.round((1 / status.memberCount) * 100)
      : 0,
  } : null;

  return {
    data: enrichedStatus,
    ...rest,
  };
}

// ===============================================
// CONDITIONAL RENDERING HOOKS
// ===============================================

/**
 * Hook that returns component props for conditional DAO features
 * Useful for wrapping components that should only show for DAO members
 *
 * @example
 * const daoGate = useDAOGate();
 *
 * if (!daoGate.isMember) {
 *   return <NotAMemberMessage />;
 * }
 *
 * return <DAOFeatures />;
 */
export function useDAOGate() {
  const { data: status, isLoading } = useDAOMembership();

  return {
    isMember: status?.isMember || false,
    isLoading,
    isReady: !isLoading && !!status,
    canAccessDAOFeatures: !!status?.isMember,
  };
}

/**
 * Hook for DAO feature access with loading state
 * Returns boolean and loading state for UI rendering
 *
 * @example
 * const { hasAccess, isChecking } = useDAOAccess();
 *
 * if (isChecking) return <LoadingSpinner />;
 * if (!hasAccess) return <JoinDAOPrompt />;
 * return <DAODashboard />;
 */
export function useDAOAccess() {
  const { data: status, isLoading } = useDAOMembership();

  return {
    hasAccess: status?.isMember || false,
    isChecking: isLoading,
    status,
  };
}

// ===============================================
// PERMISSION HOOKS
// ===============================================

/**
 * Hook to check if user can create proposals
 *
 * @example
 * const canCreate = useCanCreateProposal();
 */
export function useCanCreateProposal(): boolean {
  const { data: status } = useDAOMembership();
  return status?.isMember || false;
}

/**
 * Hook to check if user can vote on proposals
 *
 * @example
 * const canVote = useCanVote();
 */
export function useCanVote(): boolean {
  const { data: status } = useDAOMembership();
  return status?.isMember || false;
}

// ===============================================
// STATISTICS HOOKS
// ===============================================

/**
 * Hook to calculate user's DAO participation metrics
 *
 * @example
 * const metrics = useDAOParticipationMetrics();
 *
 * console.log('Participation rate:', metrics.participationRate);
 */
export function useDAOParticipationMetrics() {
  const { data: status } = useDAOMembership();

  if (!status?.isMember || !status.activity) {
    return {
      totalVotes: 0,
      proposalsCreated: 0,
      participationRate: 0,
      isActive: false,
    };
  }

  const { totalVotes, proposalsCreated, lastVote } = status.activity;

  // Calculate days since last vote (assuming block height represents timestamp)
  const daysSinceLastVote = lastVote > 0
    ? Math.floor((Date.now() / 1000 - lastVote) / (60 * 60 * 24))
    : null;

  return {
    totalVotes,
    proposalsCreated,
    participationRate: proposalsCreated > 0
      ? Math.round((totalVotes / proposalsCreated) * 100)
      : 0,
    isActive: daysSinceLastVote !== null && daysSinceLastVote < 30, // Active if voted in last 30 days
    daysSinceLastVote,
  };
}

// ===============================================
// BADGE & STATUS HOOKS
// ===============================================

/**
 * Hook to get DAO member badge information
 * Returns badge text, color, and description for UI display
 *
 * @example
 * const badge = useDAOMemberBadge();
 *
 * return (
 *   <span className={badge.color}>
 *     {badge.text}
 *   </span>
 * );
 */
export function useDAOMemberBadge() {
  const { data: status } = useDAOMembership();
  const metrics = useDAOParticipationMetrics();

  if (!status?.isMember) {
    return {
      text: 'Not a Member',
      color: 'text-gray-600 bg-gray-100',
      description: 'Not a DAO member',
      icon: '👤',
    };
  }

  if (metrics.isActive && metrics.totalVotes > 10) {
    return {
      text: 'Active Member',
      color: 'text-green-600 bg-green-100',
      description: `${metrics.totalVotes} votes cast`,
      icon: '⭐',
    };
  }

  if (metrics.proposalsCreated > 5) {
    return {
      text: 'Proposer',
      color: 'text-purple-600 bg-purple-100',
      description: `${metrics.proposalsCreated} proposals created`,
      icon: '📝',
    };
  }

  return {
    text: 'DAO Member',
    color: 'text-blue-600 bg-blue-100',
    description: 'Member of the DAO',
    icon: '🏛️',
  };
}

// ===============================================
// COMPARISON HOOKS
// ===============================================

/**
 * Hook to compare user's activity with DAO average
 *
 * @example
 * const comparison = useDAOActivityComparison();
 *
 * if (comparison.isAboveAverage) {
 *   return <HighActivityBadge />;
 * }
 */
export function useDAOActivityComparison() {
  const { data: status } = useDAOMembership();
  const metrics = useDAOParticipationMetrics();

  if (!status?.isMember) {
    return {
      isAboveAverage: false,
      averageVotes: 0,
      userVotes: 0,
      percentile: 0,
    };
  }

  // These would ideally come from backend analytics
  // For now, using estimated averages
  const estimatedAverageVotes = 10;

  return {
    isAboveAverage: metrics.totalVotes > estimatedAverageVotes,
    averageVotes: estimatedAverageVotes,
    userVotes: metrics.totalVotes,
    percentile: Math.min(100, Math.round((metrics.totalVotes / estimatedAverageVotes) * 50)),
  };
}

// ===============================================
// EXPORT ALL
// ===============================================

export default {
  useDAOMembership,
  useCheckDAOMembership,
  useIsDAOMember,
  useDAOMemberCount,
  useDAOMemberActivity,
  useEnrichedDAOMembership,
  useDAOGate,
  useDAOAccess,
  useCanCreateProposal,
  useCanVote,
  useDAOParticipationMetrics,
  useDAOMemberBadge,
  useDAOActivityComparison,
};
