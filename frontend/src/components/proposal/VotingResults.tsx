'use client';

import React from 'react';
import { Proposal, ProposalStatus } from '@/types/dispute';
import { calculateVotePercentages, hasReachedThreshold } from '@/lib/disputeUtils';
import { cn } from '@/lib/utils';
import {
  ThumbsUp,
  ThumbsDown,
  Minus,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Users,
  Target,
} from 'lucide-react';

// ===============================================
// TYPES
// ===============================================

export interface VotingResultsProps {
  /**
   * The proposal with voting results
   */
  proposal: Proposal;

  /**
   * Whether to show detailed breakdown
   * @default true
   */
  showDetailed?: boolean;

  /**
   * Whether to show threshold indicator
   * @default true
   */
  showThreshold?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Variant style
   * @default 'default'
   */
  variant?: 'default' | 'compact' | 'detailed';
}

// ===============================================
// VOTE BAR COMPONENT
// ===============================================

interface VoteBarProps {
  label: string;
  count: number;
  percentage: number;
  color: string;
  icon: React.ReactNode;
}

function VoteBar({ label, count, percentage, color, icon }: VoteBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-gray-700">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-900">{count}</span>
          <span className="text-gray-600">({percentage}%)</span>
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className={cn('h-3 rounded-full transition-all duration-500', color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// ===============================================
// MAIN COMPONENT
// ===============================================

/**
 * VotingResults Component
 *
 * Displays voting results for a proposal with percentages and visual bars.
 * Shows breakdown by vote type and threshold status.
 *
 * @example
 * ```tsx
 * <VotingResults
 *   proposal={proposal}
 *   showDetailed
 *   showThreshold
 * />
 * ```
 */
export function VotingResults({
  proposal,
  showDetailed = true,
  showThreshold = true,
  className,
  variant = 'default',
}: VotingResultsProps) {
  const { yesPercent, noPercent, abstainPercent, totalVotes } =
    calculateVotePercentages(proposal);
  const thresholdReached = hasReachedThreshold(proposal);
  const isActive = proposal.status === ProposalStatus.ACTIVE;

  const turnoutPercentage = proposal.totalEligibleVoters > 0
    ? Math.round((totalVotes / proposal.totalEligibleVoters) * 100)
    : 0;

  const isCompact = variant === 'compact';
  const isDetailed = variant === 'detailed';

  return (
    <div className={cn('bg-white rounded-lg border p-6 space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">
          {isActive ? 'Current Results' : 'Final Results'}
        </h3>
        {thresholdReached && (
          <div className="flex items-center gap-1.5 text-sm font-medium text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>Threshold Reached</span>
          </div>
        )}
      </div>

      {/* Vote Bars */}
      <div className="space-y-4">
        <VoteBar
          label="Yes Votes"
          count={proposal.yesVotes}
          percentage={yesPercent}
          color="bg-green-600"
          icon={<ThumbsUp className="h-4 w-4 text-green-600" />}
        />

        <VoteBar
          label="No Votes"
          count={proposal.noVotes}
          percentage={noPercent}
          color="bg-red-600"
          icon={<ThumbsDown className="h-4 w-4 text-red-600" />}
        />

        <VoteBar
          label="Abstain"
          count={proposal.abstainVotes}
          percentage={abstainPercent}
          color="bg-gray-600"
          icon={<Minus className="h-4 w-4 text-gray-600" />}
        />
      </div>

      {/* Threshold Indicator */}
      {showThreshold && !isCompact && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Target className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-700">
                  Supermajority Threshold (70%)
                </p>
                <p className="text-sm font-bold text-gray-900">{yesPercent}%</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 relative">
                <div
                  className={cn(
                    'h-2 rounded-full transition-all duration-500',
                    thresholdReached ? 'bg-green-600' : 'bg-blue-600'
                  )}
                  style={{ width: `${yesPercent}%` }}
                />
                {/* 70% marker */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-gray-900"
                  style={{ left: '70%' }}
                >
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-xs font-medium text-gray-900 whitespace-nowrap">
                    70%
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                {thresholdReached
                  ? '✓ Proposal has reached the required 70% Yes votes'
                  : `${(70 - yesPercent).toFixed(1)}% more Yes votes needed to pass`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      {showDetailed && !isCompact && (
        <div className="grid grid-cols-2 gap-4">
          {/* Total Votes */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-700 mb-2">
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">Total Votes</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">{totalVotes}</p>
            <p className="text-xs text-blue-700 mt-1">
              of {proposal.totalEligibleVoters} members
            </p>
          </div>

          {/* Turnout */}
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-purple-700 mb-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Turnout</span>
            </div>
            <p className="text-2xl font-bold text-purple-900">{turnoutPercentage}%</p>
            <p className="text-xs text-purple-700 mt-1">
              {proposal.totalEligibleVoters - totalVotes} members haven't voted
            </p>
          </div>
        </div>
      )}

      {/* Outcome Prediction (for active proposals) */}
      {isActive && showDetailed && !isCompact && (
        <div
          className={cn(
            'rounded-lg p-4 border-2',
            thresholdReached
              ? 'bg-green-50 border-green-200'
              : yesPercent > noPercent
              ? 'bg-blue-50 border-blue-200'
              : 'bg-red-50 border-red-200'
          )}
        >
          <div className="flex items-start gap-3">
            {thresholdReached ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-1">
                {thresholdReached
                  ? 'Proposal is on track to pass'
                  : yesPercent > noPercent
                  ? 'More Yes votes than No, but threshold not reached'
                  : 'Proposal is currently failing'}
              </p>
              <p className="text-xs text-gray-700">
                {thresholdReached
                  ? 'If voting ended now, this proposal would pass with a supermajority.'
                  : yesPercent > noPercent
                  ? `Need ${(70 - yesPercent).toFixed(1)}% more Yes votes to reach the 70% threshold.`
                  : 'More No votes than Yes votes. Proposal would fail if voting ended now.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Final Outcome (for closed proposals) */}
      {!isActive && showDetailed && (
        <div
          className={cn(
            'rounded-lg p-4 border-2',
            proposal.status === ProposalStatus.PASSED
              ? 'bg-green-50 border-green-200'
              : proposal.status === ProposalStatus.EXECUTED
              ? 'bg-blue-50 border-blue-200'
              : 'bg-red-50 border-red-200'
          )}
        >
          <div className="flex items-center gap-3">
            {proposal.status === ProposalStatus.PASSED ||
            proposal.status === ProposalStatus.EXECUTED ? (
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600" />
            )}
            <div>
              <p className="text-base font-bold text-gray-900">
                {proposal.status === ProposalStatus.PASSED && 'Proposal Passed'}
                {proposal.status === ProposalStatus.EXECUTED && 'Proposal Executed'}
                {proposal.status === ProposalStatus.FAILED && 'Proposal Failed'}
              </p>
              <p className="text-sm text-gray-700 mt-1">
                {proposal.status === ProposalStatus.PASSED &&
                  'The proposal reached the 70% supermajority and is ready to be executed.'}
                {proposal.status === ProposalStatus.EXECUTED &&
                  'The proposal has been executed and the resolution is now in effect.'}
                {proposal.status === ProposalStatus.FAILED &&
                  'The proposal did not reach the 70% supermajority threshold.'}
              </p>
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
 * Compact voting results without detailed stats
 */
export function VotingResultsCompact(props: Omit<VotingResultsProps, 'variant'>) {
  return <VotingResults {...props} variant="compact" showDetailed={false} />;
}

/**
 * Detailed voting results with all statistics
 */
export function VotingResultsDetailed(props: Omit<VotingResultsProps, 'variant'>) {
  return <VotingResults {...props} variant="detailed" />;
}

// ===============================================
// SIMPLE PERCENTAGE DISPLAY
// ===============================================

export interface VotingResultsSimpleProps {
  proposal: Proposal;
  className?: string;
}

/**
 * Simple inline voting results display
 */
export function VotingResultsSimple({ proposal, className }: VotingResultsSimpleProps) {
  const { yesPercent, noPercent, abstainPercent } = calculateVotePercentages(proposal);

  return (
    <div className={cn('inline-flex items-center gap-4 text-sm', className)}>
      <div className="flex items-center gap-1.5">
        <ThumbsUp className="h-3.5 w-3.5 text-green-600" />
        <span className="font-medium text-green-900">{yesPercent}%</span>
      </div>
      <div className="flex items-center gap-1.5">
        <ThumbsDown className="h-3.5 w-3.5 text-red-600" />
        <span className="font-medium text-red-900">{noPercent}%</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Minus className="h-3.5 w-3.5 text-gray-600" />
        <span className="font-medium text-gray-900">{abstainPercent}%</span>
      </div>
    </div>
  );
}

// ===============================================
// EXPORT
// ===============================================

export default VotingResults;
