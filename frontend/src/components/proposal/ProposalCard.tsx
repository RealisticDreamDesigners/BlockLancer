'use client';

import React from 'react';
import Link from 'next/link';
import { Proposal, ProposalStatus } from '@/types/dispute';
import { ProposalBadge } from './ProposalBadge';
import {
  formatBlockTime,
  truncateAddress,
  getVotingTimeRemaining,
} from '@/lib/disputeUtils';
import { cn } from '@/lib/utils';
import {
  FileText,
  User,
  Calendar,
  ChevronRight,
  Clock,
  CheckCircle2,
  TrendingUp,
  Users,
} from 'lucide-react';

// ===============================================
// TYPES
// ===============================================

export interface ProposalCardProps {
  /**
   * The proposal to display
   */
  proposal: Proposal;

  /**
   * Current user's address for highlighting
   */
  currentUserAddress?: string;

  /**
   * Whether to show action buttons
   * @default true
   */
  showActions?: boolean;

  /**
   * Whether to show voting progress
   * @default true
   */
  showProgress?: boolean;

  /**
   * Click handler for the card
   */
  onClick?: () => void;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Whether to highlight the card
   * @default false
   */
  highlighted?: boolean;

  /**
   * Layout variant
   * @default 'default'
   */
  variant?: 'default' | 'compact' | 'detailed';
}

// ===============================================
// COMPONENT
// ===============================================

/**
 * ProposalCard Component
 *
 * Displays a proposal in a card format with status, voting progress, and actions.
 * Used in proposal lists and dashboards.
 *
 * @example
 * ```tsx
 * <ProposalCard
 *   proposal={proposal}
 *   currentUserAddress={userAddress}
 *   showActions
 *   showProgress
 * />
 * ```
 */
export function ProposalCard({
  proposal,
  currentUserAddress,
  showActions = true,
  showProgress = true,
  onClick,
  className,
  highlighted = false,
  variant = 'default',
}: ProposalCardProps) {
  const isProposer = currentUserAddress === proposal.proposer;
  const isActive = proposal.status === ProposalStatus.ACTIVE;
  const hasVoted = !!proposal.userVote;

  const timeRemaining = getVotingTimeRemaining(proposal.votingEndsAt);
  const votingProgress = proposal.votingProgress || 0;

  const isCompact = variant === 'compact';
  const isDetailed = variant === 'detailed';

  // Calculate if threshold is reached
  const hasReachedThreshold = proposal.hasReachedThreshold || false;

  return (
    <div
      className={cn(
        // Base styles
        'group relative rounded-lg border bg-white dark:bg-gray-800/50 p-4 shadow-sm',
        'transition-all duration-200',
        // Hover state
        'hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600',
        // Highlighted state
        highlighted && 'ring-2 ring-blue-500 border-blue-500',
        // Click handler cursor
        onClick && 'cursor-pointer',
        // Custom classes
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Header: ID, Status, and Date */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2 flex-1">
          <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
          <Link
            href={`/dao/proposals/${proposal.id}`}
            className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            Proposal #{proposal.id}
          </Link>
          {isProposer && (
            <span className="text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded-full">
              You created this
            </span>
          )}
          {hasVoted && isActive && (
            <span className="text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
              You voted
            </span>
          )}
        </div>

        <ProposalBadge status={proposal.status} size="small" />
      </div>

      {/* Proposal Type Badge */}
      {!isCompact && (
        <div className="flex items-center gap-2 mb-3">
          <span
            className={cn(
              'text-xs px-2 py-1 rounded-full font-medium',
              proposal.proposalType === 0
                ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                : 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
            )}
          >
            {proposal.proposalType === 0 ? 'Dispute Resolution' : 'Escrow Release'}
          </span>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Contract #{proposal.targetContractId}
          </span>
        </div>
      )}

      {/* Proposer */}
      {!isCompact && (
        <div className="flex items-center gap-2 mb-3 text-sm">
          <User className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
          <span className="text-gray-600 dark:text-gray-400">Proposer:</span>
          <code
            className={cn(
              'font-mono text-sm px-1.5 py-0.5 rounded',
              isProposer
                ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 font-semibold'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            )}
          >
            {truncateAddress(proposal.proposer)}
          </code>
        </div>
      )}

      {/* Description */}
      {!isCompact && (
        <div className="mb-3">
          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
            {proposal.description}
          </p>
        </div>
      )}

      {/* Voting Progress */}
      {showProgress && isActive && !isCompact && (
        <div className="mb-3 space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>Voting Progress</span>
            <span className="font-medium">{votingProgress}%</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
            <div
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                hasReachedThreshold ? 'bg-green-600' : 'bg-blue-600'
              )}
              style={{ width: `${votingProgress}%` }}
            />
          </div>
          {hasReachedThreshold && (
            <div className="flex items-center gap-1 text-xs text-green-600">
              <CheckCircle2 className="h-3 w-3" />
              <span>Threshold reached (70%)</span>
            </div>
          )}
        </div>
      )}

      {/* Vote Counts */}
      {showProgress && !isCompact && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-blue-50 dark:bg-blue-900/10 rounded p-2">
            <div className="text-xs text-blue-700 dark:text-blue-400 font-medium mb-1">Yes</div>
            <div className="text-lg font-bold text-blue-900 dark:text-blue-200">
              {proposal.yesVotes}
            </div>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 rounded p-2">
            <div className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">No</div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {proposal.noVotes}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-950 rounded p-2">
            <div className="text-xs text-gray-700 dark:text-gray-300 font-medium mb-1">Abstain</div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {proposal.abstainVotes}
            </div>
          </div>
        </div>
      )}

      {/* Footer: Date and Time Remaining */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700/50">
        <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>Created {formatBlockTime(proposal.createdAt)}</span>
          </div>
          {isActive && (
            <div className="flex items-center gap-1.5">
              <Clock className={cn('h-3.5 w-3.5', timeRemaining.color)} />
              <span className={timeRemaining.color}>
                {timeRemaining.text}
              </span>
            </div>
          )}
        </div>

        {showActions && (
          <Link
            href={`/dao/proposals/${proposal.id}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {isActive ? 'Vote Now' : 'View Details'}
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {/* Participation Stats (for detailed variant) */}
      {isDetailed && !isCompact && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <Users className="h-3.5 w-3.5" />
              <span>
                {proposal.yesVotes + proposal.noVotes + proposal.abstainVotes} /{' '}
                {proposal.totalEligibleVoters} members voted
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>
                {Math.round(
                  ((proposal.yesVotes + proposal.noVotes + proposal.abstainVotes) /
                    proposal.totalEligibleVoters) *
                    100
                )}
                % turnout
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===============================================
// VARIANT COMPONENTS
// ===============================================

/**
 * Compact proposal card for dense displays
 */
export function ProposalCardCompact(props: Omit<ProposalCardProps, 'variant'>) {
  return <ProposalCard {...props} variant="compact" />;
}

/**
 * Detailed proposal card with participation stats
 */
export function ProposalCardDetailed(props: Omit<ProposalCardProps, 'variant'>) {
  return <ProposalCard {...props} variant="detailed" />;
}

// ===============================================
// SKELETON LOADER
// ===============================================

/**
 * Skeleton loader for ProposalCard
 */
export function ProposalCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-white dark:bg-gray-800/50 p-4 shadow-sm animate-pulse',
        className
      )}
    >
      {/* Header skeleton */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32" />
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20" />
      </div>

      {/* Type badge skeleton */}
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-36 mb-3" />

      {/* Proposer skeleton */}
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-3" />

      {/* Description skeleton */}
      <div className="space-y-2 mb-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
      </div>

      {/* Progress bar skeleton */}
      <div className="mb-3">
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
      </div>

      {/* Vote counts skeleton */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="h-16 bg-gray-100 dark:bg-gray-700 rounded" />
        <div className="h-16 bg-gray-100 dark:bg-gray-700 rounded" />
        <div className="h-16 bg-gray-100 dark:bg-gray-700 rounded" />
      </div>

      {/* Footer skeleton */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700/50">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
      </div>
    </div>
  );
}

// ===============================================
// EXPORT
// ===============================================

export default ProposalCard;
