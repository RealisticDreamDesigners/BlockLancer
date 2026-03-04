/**
 * Proposal Components
 *
 * Collection of components for the DAO proposal interface.
 * Includes display components, voting interfaces, and statistics.
 */

// ===============================================
// BADGE COMPONENTS
// ===============================================

export {
  ProposalBadge,
  ProposalBadgeSmall,
  ProposalBadgeDot,
  ProposalBadgeLarge,
  ProposalStatusLegend,
  type ProposalBadgeProps,
} from './ProposalBadge';

// ===============================================
// CARD COMPONENTS
// ===============================================

export {
  ProposalCard,
  ProposalCardCompact,
  ProposalCardDetailed,
  ProposalCardSkeleton,
  type ProposalCardProps,
} from './ProposalCard';

// ===============================================
// LIST COMPONENTS
// ===============================================

export {
  ProposalList,
  ProposalListCompact,
  ProposalListSimple,
  type ProposalListProps,
  type ProposalSortOption,
  type SortOrder,
} from './ProposalList';

// ===============================================
// STATS COMPONENTS
// ===============================================

export {
  ProposalStats,
  ProposalStatsCompact,
  type ProposalStatsProps,
} from './ProposalStats';

// ===============================================
// VOTING COMPONENTS
// ===============================================

export {
  VotingInterface,
  type VotingInterfaceProps,
} from './VotingInterface';

export {
  VotingResults,
  VotingResultsCompact,
  VotingResultsDetailed,
  VotingResultsSimple,
  type VotingResultsProps,
  type VotingResultsSimpleProps,
} from './VotingResults';

// ===============================================
// DEFAULT EXPORTS
// ===============================================

export { default as ProposalBadgeDefault } from './ProposalBadge';
export { default as ProposalCardDefault } from './ProposalCard';
export { default as ProposalListDefault } from './ProposalList';
export { default as ProposalStatsDefault } from './ProposalStats';
export { default as VotingInterfaceDefault } from './VotingInterface';
export { default as VotingResultsDefault } from './VotingResults';
