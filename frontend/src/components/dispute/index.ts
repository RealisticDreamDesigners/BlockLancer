/**
 * Dispute Components
 *
 * Collection of components for the dispute resolution interface.
 * Includes display components, forms, and modals.
 */

// ===============================================
// BADGE COMPONENTS
// ===============================================

export {
  DisputeBadge,
  DisputeBadgeSmall,
  DisputeBadgeDot,
  DisputeBadgeLarge,
  DisputeStatusLegend,
  type DisputeBadgeProps,
} from './DisputeBadge';

// ===============================================
// CARD COMPONENTS
// ===============================================

export {
  DisputeCard,
  DisputeCardCompact,
  DisputeCardDetailed,
  DisputeCardSkeleton,
  type DisputeCardProps,
} from './DisputeCard';

// ===============================================
// LIST COMPONENTS
// ===============================================

export {
  DisputeList,
  DisputeListCompact,
  DisputeListSimple,
  type DisputeListProps,
  type SortOption,
  type SortOrder,
} from './DisputeList';

// ===============================================
// STATS COMPONENTS
// ===============================================

export {
  DisputeStats,
  DisputeStatsCompact,
  type DisputeStatsProps,
} from './DisputeStats';

// ===============================================
// ACTION COMPONENTS
// ===============================================

export {
  OpenDisputeButton,
  OpenDisputeButtonSmall,
  OpenDisputeButtonLarge,
  OpenDisputeButtonFullWidth,
  OpenDisputeButtonIcon,
  type OpenDisputeButtonProps,
} from './OpenDisputeButton';

// ===============================================
// MODAL COMPONENTS
// ===============================================

export {
  OpenDisputeModal,
  type OpenDisputeModalProps,
} from './OpenDisputeModal';

// ===============================================
// EVIDENCE COMPONENTS
// ===============================================

export {
  EvidenceCard,
  EvidenceCardCompact,
  EvidenceCardTimeline,
  EvidenceEmptyState,
  EvidenceCardSkeleton,
  EvidenceComparison,
  type EvidenceCardProps,
  type EvidenceEmptyStateProps,
  type EvidenceComparisonProps,
} from './EvidenceCard';

export {
  EvidenceSubmission,
  EvidenceSubmissionInline,
  type EvidenceSubmissionProps,
} from './EvidenceSubmission';

export {
  EvidenceTimeline,
  EvidenceTimelineCompact,
  EvidenceTimelineSkeleton,
  type EvidenceTimelineProps,
} from './EvidenceTimeline';

// ===============================================
// WITHDRAW COMPONENTS
// ===============================================

export {
  WithdrawDisputeButton,
  WithdrawDisputeButtonSmall,
  WithdrawDisputeButtonFullWidth,
  WithdrawDisputeButtonDirect,
  WithdrawDisputeButtonIcon,
  type WithdrawDisputeButtonProps,
} from './WithdrawDisputeButton';

// ===============================================
// HEADER COMPONENTS
// ===============================================

export {
  DisputeDetailHeader,
  DisputeDetailHeaderCompact,
  type DisputeDetailHeaderProps,
} from './DisputeDetailHeader';

// ===============================================
// DAO/PROPOSAL COMPONENTS
// ===============================================

export {
  CreateProposalModal,
  type CreateProposalModalProps,
} from './CreateProposalModal';

export {
  ProposalCard,
  type ProposalCardProps,
} from './ProposalCard';

// ===============================================
// DEFAULT EXPORTS
// ===============================================

export { default as DisputeBadgeDefault } from './DisputeBadge';
export { default as DisputeCardDefault } from './DisputeCard';
export { default as DisputeListDefault } from './DisputeList';
export { default as DisputeStatsDefault } from './DisputeStats';
export { default as OpenDisputeButtonDefault } from './OpenDisputeButton';
export { default as OpenDisputeModalDefault } from './OpenDisputeModal';
export { default as EvidenceCardDefault } from './EvidenceCard';
export { default as EvidenceSubmissionDefault } from './EvidenceSubmission';
export { default as EvidenceTimelineDefault } from './EvidenceTimeline';
export { default as WithdrawDisputeButtonDefault } from './WithdrawDisputeButton';
export { default as DisputeDetailHeaderDefault } from './DisputeDetailHeader';
