'use client';

import React, { useState } from 'react';
import { formatBlockTime, truncateAddress } from '@/lib/disputeUtils';
import { cn } from '@/lib/utils';
import {
  FileText,
  User,
  Calendar,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from 'lucide-react';

// ===============================================
// TYPES
// ===============================================

export interface EvidenceCardProps {
  /**
   * The evidence text
   */
  evidence: string;

  /**
   * Address of the person who submitted the evidence
   */
  submittedBy: string;

  /**
   * Role of the submitter
   */
  role: 'client' | 'freelancer';

  /**
   * Timestamp when evidence was submitted
   */
  submittedAt?: number;

  /**
   * Current user's address for highlighting
   */
  currentUserAddress?: string;

  /**
   * Whether to allow expansion for long text
   * @default true
   */
  collapsible?: boolean;

  /**
   * Maximum characters before collapsing
   * @default 300
   */
  collapseThreshold?: number;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Variant style
   * @default 'default'
   */
  variant?: 'default' | 'compact' | 'timeline';
}

// ===============================================
// ROLE COLORS
// ===============================================

const roleColors = {
  client: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-700',
    icon: 'text-blue-600',
  },
  freelancer: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    badge: 'bg-purple-100 text-purple-700',
    icon: 'text-purple-600',
  },
};

// ===============================================
// COMPONENT
// ===============================================

/**
 * EvidenceCard Component
 *
 * Displays submitted evidence with submitter information.
 * Supports collapsible text for long evidence.
 *
 * @example
 * ```tsx
 * <EvidenceCard
 *   evidence="Here is the proof that work was completed..."
 *   submittedBy="ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
 *   role="freelancer"
 *   submittedAt={1704067200}
 *   currentUserAddress={userAddress}
 * />
 * ```
 */
export function EvidenceCard({
  evidence,
  submittedBy,
  role,
  submittedAt,
  currentUserAddress,
  collapsible = true,
  collapseThreshold = 300,
  className,
  variant = 'default',
}: EvidenceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isCurrentUser = currentUserAddress === submittedBy;
  const colors = roleColors[role];
  const shouldCollapse = collapsible && evidence.length > collapseThreshold;
  const displayText = shouldCollapse && !isExpanded
    ? evidence.slice(0, collapseThreshold) + '...'
    : evidence;

  const isCompact = variant === 'compact';
  const isTimeline = variant === 'timeline';

  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-all duration-200',
        colors.bg,
        colors.border,
        !isCompact && 'hover:shadow-md',
        className
      )}
    >
      {/* Header */}
      <div className={cn('flex items-start justify-between gap-4', !isCompact && 'mb-3')}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <User className={cn('flex-shrink-0', colors.icon, isCompact ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn('font-medium capitalize', colors.text, isCompact ? 'text-sm' : 'text-base')}>
                {role}
              </span>
              {isCurrentUser && (
                <span className="text-xs bg-white/70 px-2 py-0.5 rounded-full font-medium">
                  You
                </span>
              )}
            </div>
            <code className={cn('block font-mono text-gray-600 truncate', isCompact ? 'text-xs' : 'text-sm')}>
              {truncateAddress(submittedBy)}
            </code>
          </div>
        </div>

        {/* Badge */}
        {!isCompact && (
          <div className={cn('flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium', colors.badge)}>
            <CheckCircle2 className="h-3 w-3" />
            <span>Submitted</span>
          </div>
        )}
      </div>

      {/* Timestamp */}
      {submittedAt && !isCompact && !isTimeline && (
        <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-3">
          <Calendar className="h-3.5 w-3.5" />
          <span>{formatBlockTime(submittedAt)}</span>
        </div>
      )}

      {/* Evidence Text */}
      <div className={cn('mt-3', isCompact && 'mt-2')}>
        <div className={cn(
          'text-gray-800 whitespace-pre-wrap break-words',
          isCompact ? 'text-sm' : 'text-base',
          'leading-relaxed'
        )}>
          {displayText}
        </div>

        {/* Expand/Collapse Button */}
        {shouldCollapse && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              'mt-2 inline-flex items-center gap-1 text-sm font-medium',
              colors.text,
              'hover:underline transition-all'
            )}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Show More ({evidence.length - collapseThreshold} more characters)
              </>
            )}
          </button>
        )}
      </div>

      {/* Footer Info */}
      {!isCompact && (
        <div className="mt-3 pt-3 border-t border-gray-200/50">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <FileText className="h-3.5 w-3.5" />
            <span>{evidence.length} characters</span>
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
 * Compact evidence card for dense displays
 */
export function EvidenceCardCompact(props: Omit<EvidenceCardProps, 'variant'>) {
  return <EvidenceCard {...props} variant="compact" />;
}

/**
 * Timeline evidence card for timeline displays
 */
export function EvidenceCardTimeline(props: Omit<EvidenceCardProps, 'variant'>) {
  return <EvidenceCard {...props} variant="timeline" />;
}

// ===============================================
// EMPTY STATE
// ===============================================

export interface EvidenceEmptyStateProps {
  /**
   * Role that hasn't submitted evidence yet
   */
  role: 'client' | 'freelancer';

  /**
   * Custom message
   */
  message?: string;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Empty state for when evidence hasn't been submitted
 */
export function EvidenceEmptyState({
  role,
  message,
  className,
}: EvidenceEmptyStateProps) {
  const colors = roleColors[role];

  return (
    <div
      className={cn(
        'rounded-lg border-2 border-dashed p-6 text-center',
        colors.border,
        colors.bg,
        className
      )}
    >
      <FileText className={cn('h-10 w-10 mx-auto mb-3', colors.icon, 'opacity-50')} />
      <p className={cn('text-sm font-medium', colors.text)}>
        {message || `${role === 'client' ? 'Client' : 'Freelancer'} hasn't submitted evidence yet`}
      </p>
    </div>
  );
}

// ===============================================
// SKELETON LOADER
// ===============================================

export function EvidenceCardSkeleton({
  role,
  className,
}: {
  role: 'client' | 'freelancer';
  className?: string;
}) {
  const colors = roleColors[role];

  return (
    <div
      className={cn(
        'rounded-lg border p-4 animate-pulse',
        colors.bg,
        colors.border,
        className
      )}
    >
      {/* Header skeleton */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2 flex-1">
          <div className={cn('h-4 w-4 rounded', colors.badge)} />
          <div className="flex-1">
            <div className={cn('h-4 rounded w-24 mb-2', colors.badge)} />
            <div className="h-3 bg-gray-200 rounded w-32" />
          </div>
        </div>
        <div className={cn('h-6 w-20 rounded-full', colors.badge)} />
      </div>

      {/* Timestamp skeleton */}
      <div className="h-3 bg-gray-200 rounded w-28 mb-3" />

      {/* Content skeleton */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-4 bg-gray-200 rounded w-4/6" />
      </div>

      {/* Footer skeleton */}
      <div className="mt-3 pt-3 border-t border-gray-200/50">
        <div className="h-3 bg-gray-200 rounded w-24" />
      </div>
    </div>
  );
}

// ===============================================
// COMPARISON VIEW
// ===============================================

export interface EvidenceComparisonProps {
  /**
   * Client's evidence
   */
  clientEvidence?: string;

  /**
   * Freelancer's evidence
   */
  freelancerEvidence?: string;

  /**
   * Client address
   */
  clientAddress: string;

  /**
   * Freelancer address
   */
  freelancerAddress: string;

  /**
   * Current user address
   */
  currentUserAddress?: string;

  /**
   * Timestamps
   */
  timestamps?: {
    client?: number;
    freelancer?: number;
  };

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Side-by-side comparison of client and freelancer evidence
 */
export function EvidenceComparison({
  clientEvidence,
  freelancerEvidence,
  clientAddress,
  freelancerAddress,
  currentUserAddress,
  timestamps,
  className,
}: EvidenceComparisonProps) {
  return (
    <div className={cn('grid grid-cols-1 lg:grid-cols-2 gap-4', className)}>
      {/* Client Evidence */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Client Evidence</h3>
        {clientEvidence ? (
          <EvidenceCard
            evidence={clientEvidence}
            submittedBy={clientAddress}
            role="client"
            submittedAt={timestamps?.client}
            currentUserAddress={currentUserAddress}
          />
        ) : (
          <EvidenceEmptyState role="client" />
        )}
      </div>

      {/* Freelancer Evidence */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Freelancer Evidence</h3>
        {freelancerEvidence ? (
          <EvidenceCard
            evidence={freelancerEvidence}
            submittedBy={freelancerAddress}
            role="freelancer"
            submittedAt={timestamps?.freelancer}
            currentUserAddress={currentUserAddress}
          />
        ) : (
          <EvidenceEmptyState role="freelancer" />
        )}
      </div>
    </div>
  );
}

// ===============================================
// EXPORT
// ===============================================

export default EvidenceCard;
