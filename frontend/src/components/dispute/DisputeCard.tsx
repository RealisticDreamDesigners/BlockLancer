'use client';

import React from 'react';
import Link from 'next/link';
import { Dispute, DisputeStatus } from '@/types/dispute';
import { DisputeBadge } from './DisputeBadge';
import { formatBlockTime, truncateAddress } from '@/lib/disputeUtils';
import { cn } from '@/lib/utils';
import {
  FileText,
  User,
  Calendar,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Scale,
} from 'lucide-react';

// ===============================================
// TYPES
// ===============================================

export interface DisputeCardProps {
  /**
   * The dispute to display
   */
  dispute: Dispute;

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
   * Whether to show evidence status
   * @default true
   */
  showEvidence?: boolean;

  /**
   * Click handler for the card
   */
  onClick?: () => void;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Whether to highlight the card (e.g., for new disputes)
   * @default false
   */
  highlighted?: boolean;

  /**
   * Layout variant
   * @default 'default'
   */
  variant?: 'default' | 'compact' | 'detailed';

  /**
   * Whether the current user is a DAO member
   * @default false
   */
  isDAOMember?: boolean;
}

// ===============================================
// COMPONENT
// ===============================================

/**
 * DisputeCard Component
 *
 * Displays a dispute in a card format with status, parties, reason, and actions.
 * Used in dispute lists and dashboards.
 *
 * @example
 * ```tsx
 * <DisputeCard
 *   dispute={dispute}
 *   currentUserAddress={userAddress}
 *   showActions
 * />
 * ```
 */
export function DisputeCard({
  dispute,
  currentUserAddress,
  showActions = true,
  showEvidence = true,
  onClick,
  className,
  highlighted = false,
  variant = 'default',
  isDAOMember = false,
}: DisputeCardProps) {
  const isClient = currentUserAddress === dispute.client;
  const isFreelancer = currentUserAddress === dispute.freelancer;
  const isParticipant = isClient || isFreelancer;

  const hasClientEvidence = !!dispute.clientEvidence;
  const hasFreelancerEvidence = !!dispute.freelancerEvidence;

  // Determine if compact variant
  const isCompact = variant === 'compact';
  const isDetailed = variant === 'detailed';

  // Show create proposal button for DAO members on open disputes
  const canCreateProposal = isDAOMember && dispute.status === DisputeStatus.OPEN;

  return (
    <div
      className={cn(
        // Base styles
        'group relative rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-4 shadow-sm',
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
            href={`/disputes/${dispute.id}`}
            className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            Dispute #{dispute.id}
          </Link>
          {isParticipant && (
            <span className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-0.5 rounded-full">
              You're involved
            </span>
          )}
        </div>

        <DisputeBadge status={dispute.status} size="small" />
      </div>

      {/* Contract Info */}
      {!isCompact && (
        <div className="flex items-center gap-2 mb-3 text-sm text-gray-600 dark:text-gray-400">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>Contract #{dispute.contractId}</span>
        </div>
      )}

      {/* Parties */}
      <div className={cn('space-y-2 mb-3', isCompact && 'text-sm')}>
        {/* Employer */}
        <div className="flex items-center gap-2">
          <User className={cn('flex-shrink-0 text-gray-400', isCompact ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
          <span className="text-gray-600 dark:text-gray-400 text-sm">Employer:</span>
          <code
            className={cn(
              'font-mono text-sm px-1.5 py-0.5 rounded',
              isClient
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 font-semibold'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            )}
          >
            {truncateAddress(dispute.client)}
          </code>
          {showEvidence && hasClientEvidence && (
            <span title="Evidence submitted"><CheckCircle2 className="h-4 w-4 text-green-600" /></span>
          )}
          {showEvidence && !hasClientEvidence && dispute.status === DisputeStatus.OPEN && (
            <span title="No evidence yet"><XCircle className="h-4 w-4 text-gray-400" /></span>
          )}
        </div>

        {/* Worker */}
        <div className="flex items-center gap-2">
          <User className={cn('flex-shrink-0 text-gray-400', isCompact ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
          <span className="text-gray-600 dark:text-gray-400 text-sm">Worker:</span>
          <code
            className={cn(
              'font-mono text-sm px-1.5 py-0.5 rounded',
              isFreelancer
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 font-semibold'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            )}
          >
            {truncateAddress(dispute.freelancer)}
          </code>
          {showEvidence && hasFreelancerEvidence && (
            <span title="Evidence submitted"><CheckCircle2 className="h-4 w-4 text-green-600" /></span>
          )}
          {showEvidence && !hasFreelancerEvidence && dispute.status === DisputeStatus.OPEN && (
            <span title="No evidence yet"><XCircle className="h-4 w-4 text-gray-400" /></span>
          )}
        </div>
      </div>

      {/* Reason */}
      {!isCompact && (
        <div className="mb-3">
          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
            {dispute.reason}
          </p>
        </div>
      )}

      {/* Footer: Date and Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700/50">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <Calendar className="h-3.5 w-3.5" />
          <span>Opened {formatBlockTime(dispute.createdAt)}</span>
        </div>

        {showActions && (
          <div className="flex items-center gap-2">
            {canCreateProposal && (
              <Link
                href={`/disputes/${dispute.id}#dao-resolution`}
                className="inline-flex items-center gap-1 text-sm font-medium text-green-600 hover:text-green-700 transition-colors px-3 py-1.5 bg-green-50 rounded-lg hover:bg-green-100"
                onClick={(e) => e.stopPropagation()}
              >
                <Scale className="h-3.5 w-3.5" />
                Create Proposal
              </Link>
            )}
            <Link
              href={`/disputes/${dispute.id}`}
              className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              View Details
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>

      {/* Evidence Progress Indicator (for detailed variant) */}
      {isDetailed && showEvidence && dispute.status === DisputeStatus.OPEN && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50">
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
            <span>Evidence Submission</span>
            <span>
              {(hasClientEvidence ? 1 : 0) + (hasFreelancerEvidence ? 1 : 0)} / 2
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{
                width: `${
                  ((hasClientEvidence ? 1 : 0) + (hasFreelancerEvidence ? 1 : 0)) * 50
                }%`,
              }}
            />
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
 * Compact dispute card for dense displays
 */
export function DisputeCardCompact(props: Omit<DisputeCardProps, 'variant'>) {
  return <DisputeCard {...props} variant="compact" />;
}

/**
 * Detailed dispute card with evidence progress
 */
export function DisputeCardDetailed(props: Omit<DisputeCardProps, 'variant'>) {
  return <DisputeCard {...props} variant="detailed" />;
}

// ===============================================
// SKELETON LOADER
// ===============================================

/**
 * Skeleton loader for DisputeCard
 */
export function DisputeCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-4 shadow-sm animate-pulse',
        className
      )}
    >
      {/* Header skeleton */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32" />
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20" />
      </div>

      {/* Contract info skeleton */}
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-3" />

      {/* Parties skeleton */}
      <div className="space-y-2 mb-3">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-full" />
      </div>

      {/* Reason skeleton */}
      <div className="space-y-2 mb-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
      </div>

      {/* Footer skeleton */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700/50">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
      </div>
    </div>
  );
}

// ===============================================
// EXPORT
// ===============================================

export default DisputeCard;
