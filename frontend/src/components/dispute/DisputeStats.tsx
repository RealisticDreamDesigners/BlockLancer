'use client';

import React from 'react';
import { Dispute, DisputeStatus, ResolutionType } from '@/types/dispute';
import { calculateDisputeStatistics } from '@/lib/disputeUtils';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Users,
  Scale,
  Activity,
} from 'lucide-react';

// ===============================================
// TYPES
// ===============================================

export interface DisputeStatsProps {
  /**
   * Array of disputes to calculate statistics from
   */
  disputes: Dispute[] | undefined;

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
   * Whether to show resolution breakdown
   * @default true
   */
  showResolutionBreakdown?: boolean;

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
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

function StatCard({ label, value, icon, color, description, trend }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className={cn('p-2 rounded-lg', color)}>
          {icon}
        </div>
        {trend && (
          <div
            className={cn(
              'flex items-center gap-1 text-xs font-medium',
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            )}
          >
            <TrendingUp
              className={cn(
                'h-3 w-3',
                !trend.isPositive && 'rotate-180'
              )}
            />
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {description && (
          <p className="text-xs text-gray-500">{description}</p>
        )}
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
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-600">
          {value} {showPercentage && `(${percentage}%)`}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
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
 * DisputeStats Component
 *
 * Displays comprehensive statistics and metrics about disputes.
 * Includes breakdowns by status, resolution type, and user participation.
 *
 * @example
 * ```tsx
 * <DisputeStats
 *   disputes={disputes}
 *   currentUserAddress={userAddress}
 *   showUserStats
 *   showResolutionBreakdown
 * />
 * ```
 */
export function DisputeStats({
  disputes,
  currentUserAddress,
  variant = 'grid',
  showUserStats = true,
  showResolutionBreakdown = true,
  className,
  isLoading = false,
}: DisputeStatsProps) {
  // Calculate statistics
  const stats = React.useMemo(() => {
    if (!disputes || disputes.length === 0) {
      return {
        total: 0,
        open: 0,
        resolved: 0,
        withdrawn: 0,
        asClient: 0,
        asFreelancer: 0,
        clientWins: 0,
        freelancerWins: 0,
        splits: 0,
      };
    }
    return calculateDisputeStatistics(disputes, currentUserAddress);
  }, [disputes, currentUserAddress]);

  // Loading state
  if (isLoading || !stats) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse"
            >
              <div className="h-10 w-10 bg-gray-200 rounded-lg mb-2" />
              <div className="h-8 bg-gray-200 rounded mb-2" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
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
        {/* Total Disputes */}
        <StatCard
          label="Total Disputes"
          value={stats.total}
          icon={<Scale className="h-5 w-5 text-blue-600" />}
          color="bg-blue-100"
          description="All time disputes"
        />

        {/* Open Disputes */}
        <StatCard
          label="Open Disputes"
          value={stats.open || 0}
          icon={<AlertCircle className="h-5 w-5 text-orange-600" />}
          color="bg-orange-100"
          description="Awaiting resolution"
        />

        {/* Resolved Disputes */}
        <StatCard
          label="Resolved"
          value={stats.resolved || 0}
          icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
          color="bg-green-100"
          description="Successfully resolved"
        />

        {/* Withdrawn Disputes */}
        <StatCard
          label="Withdrawn"
          value={stats.withdrawn || 0}
          icon={<XCircle className="h-5 w-5 text-gray-600" />}
          color="bg-gray-100"
          description="Cancelled by opener"
        />
      </div>

      {/* User-Specific Stats */}
      {showUserStats && currentUserAddress && (stats.asClient > 0 || stats.asFreelancer > 0) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">Your Participation</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold text-blue-900">
                {stats.asClient}
              </p>
              <p className="text-sm text-blue-700">As Client</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-900">
                {stats.asFreelancer}
              </p>
              <p className="text-sm text-blue-700">As Freelancer</p>
            </div>
          </div>
        </div>
      )}

      {/* Resolution Breakdown */}
      {showResolutionBreakdown && stats.total > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Resolution Breakdown</h3>
          </div>

          <div className="space-y-3">
            {/* Pending (Open + Withdrawn) */}
            <ProgressBar
              label="Open/Pending"
              value={stats.open || 0}
              total={stats.total}
              color="bg-orange-500"
            />

            {/* Client Wins */}
            <ProgressBar
              label="Client Wins"
              value={stats.clientWins || 0}
              total={stats.total}
              color="bg-blue-500"
            />

            {/* Freelancer Wins */}
            <ProgressBar
              label="Freelancer Wins"
              value={stats.freelancerWins || 0}
              total={stats.total}
              color="bg-purple-500"
            />

            {/* Split */}
            <ProgressBar
              label="Split Resolution"
              value={stats.splits || 0}
              total={stats.total}
              color="bg-teal-500"
            />
          </div>

          {/* Resolution Rate */}
          {stats.total > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">Resolution Rate</span>
                <span className="text-gray-900 font-semibold">
                  {Math.round(
                    ((stats.resolved || 0) / stats.total) * 100
                  )}
                  %
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.resolved || 0} out of {stats.total}{' '}
                disputes have been resolved
              </p>
            </div>
          )}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Average Resolution */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Most Common Resolution
          </h4>
          <p className="text-xl font-bold text-gray-900">
            {stats.open >= (stats.clientWins || 0) &&
            stats.open >= (stats.freelancerWins || 0)
              ? 'Pending'
              : (stats.clientWins || 0) >= (stats.freelancerWins || 0)
              ? 'Client Wins'
              : 'Freelancer Wins'}
          </p>
        </div>

        {/* Open Rate */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Currently Open
          </h4>
          <p className="text-xl font-bold text-gray-900">
            {stats.total > 0
              ? Math.round(
                  ((stats.open || 0) / stats.total) * 100
                )
              : 0}
            %
          </p>
        </div>

        {/* Withdrawal Rate */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Withdrawal Rate
          </h4>
          <p className="text-xl font-bold text-gray-900">
            {stats.total > 0
              ? Math.round(
                  ((stats.withdrawn || 0) / stats.total) * 100
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
export function DisputeStatsCompact(
  props: Omit<DisputeStatsProps, 'showResolutionBreakdown' | 'variant'>
) {
  return (
    <DisputeStats
      {...props}
      variant="horizontal"
      showResolutionBreakdown={false}
    />
  );
}

// ===============================================
// EXPORT
// ===============================================

export default DisputeStats;
