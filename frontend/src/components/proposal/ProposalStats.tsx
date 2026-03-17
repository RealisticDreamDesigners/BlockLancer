'use client';

import React from 'react';
import { Proposal, ProposalStatus } from '@/types/dispute';
import { calculateProposalStatistics } from '@/lib/disputeUtils';
import { cn } from '@/lib/utils';
import {
  FileText,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Users,
  Activity,
  Clock,
  Target,
} from 'lucide-react';

// ===============================================
// TYPES
// ===============================================

export interface ProposalStatsProps {
  /**
   * Array of proposals to calculate statistics from
   */
  proposals: Proposal[] | undefined;

  /**
   * Current user's address for personalized stats
   */
  currentUserAddress?: string;

  /**
   * Layout variant
   * @default 'grid'
   */
  variant?: 'grid' | 'horizontal' | 'vertical';

  /**
   * Whether to show user-specific stats
   * @default true
   */
  showUserStats?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Loading state
   */
  isLoading?: boolean;
}

// ===============================================
// STAT CARD COMPONENT
// ===============================================

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  description?: string;
}

function StatCard({ label, value, icon, color, description }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700/50 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className={cn('p-2 rounded-lg', color)}>{icon}</div>
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
        {description && <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>}
      </div>
    </div>
  );
}

// ===============================================
// PROGRESS BAR COMPONENT
// ===============================================

interface ProgressBarProps {
  label: string;
  value: number;
  total: number;
  color: string;
  showPercentage?: boolean;
}

function ProgressBar({
  label,
  value,
  total,
  color,
  showPercentage = true,
}: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-gray-600 dark:text-gray-400">
          {value} {showPercentage && `(${percentage}%)`}
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className={cn('h-2 rounded-full transition-all duration-300', color)}
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
 * ProposalStats Component
 *
 * Displays comprehensive statistics and metrics about DAO proposals.
 * Includes breakdowns by status, participation rates, and outcomes.
 *
 * @example
 * ```tsx
 * <ProposalStats
 *   proposals={proposals}
 *   currentUserAddress={userAddress}
 *   showUserStats
 * />
 * ```
 */
export function ProposalStats({
  proposals,
  currentUserAddress,
  variant = 'grid',
  showUserStats = true,
  className,
  isLoading = false,
}: ProposalStatsProps) {
  // Calculate statistics
  const stats = React.useMemo(() => {
    if (!proposals) return null;
    return calculateProposalStatistics(proposals, currentUserAddress);
  }, [proposals, currentUserAddress]);

  // Loading state
  if (isLoading || !stats) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700/50 p-4 animate-pulse"
            >
              <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-lg mb-2" />
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const gridClass =
    variant === 'grid'
      ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'
      : variant === 'horizontal'
      ? 'flex gap-4 overflow-x-auto'
      : 'space-y-4';

  return (
    <div className={cn('space-y-6', className)}>
      {/* Main Stats Grid */}
      <div className={gridClass}>
        {/* Total Proposals */}
        <StatCard
          label="Total Proposals"
          value={stats.total}
          icon={<FileText className="h-5 w-5 text-blue-600" />}
          color="bg-blue-100"
          description="All time proposals"
        />

        {/* Active Proposals */}
        <StatCard
          label="Active Proposals"
          value={stats.active || 0}
          icon={<Clock className="h-5 w-5 text-blue-600" />}
          color="bg-blue-100"
          description="Currently voting"
        />

        {/* Passed Proposals */}
        <StatCard
          label="Passed"
          value={stats.passed || 0}
          icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
          color="bg-green-100"
          description="Reached supermajority"
        />

        {/* Failed Proposals */}
        <StatCard
          label="Failed"
          value={stats.failed || 0}
          icon={<XCircle className="h-5 w-5 text-red-600" />}
          color="bg-red-100"
          description="Did not pass"
        />
      </div>

      {/* User-Specific Stats */}
      {showUserStats && currentUserAddress && (stats.userProposals > 0 || stats.userVotes > 0) && (
        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/40 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900 dark:text-blue-300">Your Participation</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                {stats.userVotes}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-400">Votes Cast</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                {stats.userProposals}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-400">Proposals Created</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                {stats.participationRate}%
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-400">Voting Rate</p>
            </div>
          </div>
        </div>
      )}

      {/* Status Breakdown */}
      {stats.total > 0 && (
        <div className="bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700/50 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Status Breakdown</h3>
          </div>

          <div className="space-y-3">
            {/* Active */}
            <ProgressBar
              label="Active"
              value={stats.active || 0}
              total={stats.total}
              color="bg-blue-500"
            />

            {/* Passed */}
            <ProgressBar
              label="Passed"
              value={stats.passed || 0}
              total={stats.total}
              color="bg-green-500"
            />

            {/* Failed */}
            <ProgressBar
              label="Failed"
              value={stats.failed || 0}
              total={stats.total}
              color="bg-red-500"
            />

            {/* Executed */}
            <ProgressBar
              label="Executed"
              value={stats.executed || 0}
              total={stats.total}
              color="bg-blue-500"
            />
          </div>

          {/* Success Rate */}
          {stats.total > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700/50">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-300">Success Rate</span>
                <span className="text-gray-900 dark:text-white font-semibold">
                  {Math.round(
                    (((stats.passed || 0) +
                      (stats.executed || 0)) /
                      stats.total) *
                      100
                  )}
                  %
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {(stats.passed || 0) +
                  (stats.executed || 0)}{' '}
                out of {stats.total} proposals passed
              </p>
            </div>
          )}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Average Turnout */}
        <div className="bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-purple-600" />
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Avg. Turnout</h4>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {stats.averageTurnout || 0}%
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Average participation across all proposals
          </p>
        </div>

        {/* Most Common Outcome */}
        <div className="bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-indigo-600" />
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Most Common
            </h4>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {(stats.active || 0) >= (stats.passed || 0)
              ? 'Active'
              : (stats.passed || 0) >= (stats.failed || 0)
              ? 'Passed'
              : 'Failed'}
          </p>
        </div>

        {/* Execution Rate */}
        <div className="bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-teal-600" />
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Execution Rate
            </h4>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {stats.total > 0
              ? Math.round(
                  ((stats.executed || 0) /
                    stats.total) *
                    100
                )
              : 0}
            %
          </p>
        </div>
      </div>
    </div>
  );
}

// ===============================================
// COMPACT VARIANT
// ===============================================

/**
 * Compact stats display without breakdowns
 */
export function ProposalStatsCompact(
  props: Omit<ProposalStatsProps, 'variant'>
) {
  return (
    <ProposalStats {...props} variant="horizontal" showUserStats={false} />
  );
}

// ===============================================
// EXPORT
// ===============================================

export default ProposalStats;
