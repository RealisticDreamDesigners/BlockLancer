'use client';

import React from 'react';
import { Dispute, DisputeStatus } from '@/types/dispute';
import { EvidenceCardTimeline, EvidenceEmptyState } from './EvidenceCard';
import { formatBlockTime } from '@/lib/disputeUtils';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Calendar,
  XCircle,
} from 'lucide-react';

// ===============================================
// TYPES
// ===============================================

export interface EvidenceTimelineProps {
  /**
   * The dispute containing the evidence
   */
  dispute: Dispute;

  /**
   * Current user's address for highlighting
   */
  currentUserAddress?: string;

  /**
   * Whether to show the dispute creation event
   * @default true
   */
  showDisputeCreation?: boolean;

  /**
   * Whether to show resolution event
   * @default true
   */
  showResolution?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Compact mode (smaller timeline)
   * @default false
   */
  compact?: boolean;
}

// ===============================================
// TIMELINE EVENT COMPONENT
// ===============================================

interface TimelineEventProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  timestamp?: number;
  color: string;
  isLast?: boolean;
  side?: 'left' | 'right' | 'center';
  children?: React.ReactNode;
}

function TimelineEvent({
  icon,
  title,
  description,
  timestamp,
  color,
  isLast = false,
  side = 'center',
  children,
}: TimelineEventProps) {
  return (
    <div className="relative">
      {/* Timeline Line */}
      {!isLast && (
        <div
          className={cn(
            'absolute left-6 top-12 bottom-0 w-0.5',
            side === 'center' ? 'bg-gray-300 dark:bg-gray-600' : color
          )}
        />
      )}

      {/* Event Container */}
      <div className={cn('flex gap-4', side !== 'center' && 'items-start')}>
        {/* Icon */}
        <div
          className={cn(
            'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center relative z-10',
            color,
            'shadow-md'
          )}
        >
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 pb-8">
          <div className="space-y-1 mb-2">
            <h4 className="font-semibold text-gray-900 dark:text-white">{title}</h4>
            {description && (
              <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
            )}
            {timestamp && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <Calendar className="h-3 w-3" />
                <span>{formatBlockTime(timestamp)}</span>
              </div>
            )}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

// ===============================================
// MAIN COMPONENT
// ===============================================

/**
 * EvidenceTimeline Component
 *
 * Displays a chronological timeline of dispute events and evidence submissions.
 * Shows dispute creation, evidence from both parties, and resolution.
 *
 * @example
 * ```tsx
 * <EvidenceTimeline
 *   dispute={dispute}
 *   currentUserAddress={userAddress}
 *   showDisputeCreation
 *   showResolution
 * />
 * ```
 */
export function EvidenceTimeline({
  dispute,
  currentUserAddress,
  showDisputeCreation = true,
  showResolution = true,
  className,
  compact = false,
}: EvidenceTimelineProps) {
  const hasClientEvidence = !!dispute.clientEvidence;
  const hasFreelancerEvidence = !!dispute.freelancerEvidence;
  const isResolved =
    dispute.status === DisputeStatus.RESOLVED ||
    dispute.status === DisputeStatus.WITHDRAWN;

  // Calculate total events to determine last one
  let eventCount = 0;
  if (showDisputeCreation) eventCount++;
  if (hasClientEvidence) eventCount++;
  if (hasFreelancerEvidence) eventCount++;
  if (showResolution && isResolved) eventCount++;

  let currentEvent = 0;

  return (
    <div className={cn('space-y-0', className)}>
      {/* Dispute Created */}
      {showDisputeCreation && (
        <TimelineEvent
          icon={<AlertCircle className="h-6 w-6 text-white" />}
          title="Dispute Opened"
          description={`Opened by ${
            dispute.openedBy === dispute.client ? 'Employer' : 'Worker'
          }`}
          timestamp={dispute.createdAt}
          color="bg-blue-500"
          isLast={++currentEvent === eventCount}
          side="center"
        >
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">Reason:</p>
            <p className="text-sm text-blue-800 dark:text-blue-300 whitespace-pre-wrap">
              {dispute.reason}
            </p>
          </div>
        </TimelineEvent>
      )}

      {/* Employer Evidence */}
      {hasClientEvidence && (
        <TimelineEvent
          icon={<FileText className="h-6 w-6 text-white" />}
          title="Employer Submitted Evidence"
          description="Evidence supporting employer's position"
          timestamp={dispute.createdAt} // In real app, you'd have separate timestamp
          color="bg-blue-500"
          isLast={++currentEvent === eventCount}
          side="left"
        >
          <EvidenceCardTimeline
            evidence={dispute.clientEvidence!}
            submittedBy={dispute.client}
            role="client"
            currentUserAddress={currentUserAddress}
            collapsible
          />
        </TimelineEvent>
      )}

      {/* Worker Evidence */}
      {hasFreelancerEvidence && (
        <TimelineEvent
          icon={<FileText className="h-6 w-6 text-white" />}
          title="Worker Submitted Evidence"
          description="Evidence supporting worker's position"
          timestamp={dispute.createdAt} // In real app, you'd have separate timestamp
          color="bg-purple-500"
          isLast={++currentEvent === eventCount}
          side="right"
        >
          <EvidenceCardTimeline
            evidence={dispute.freelancerEvidence!}
            submittedBy={dispute.freelancer}
            role="freelancer"
            currentUserAddress={currentUserAddress}
            collapsible
          />
        </TimelineEvent>
      )}

      {/* No Evidence Yet */}
      {!hasClientEvidence && !hasFreelancerEvidence && (
        <TimelineEvent
          icon={<FileText className="h-6 w-6 text-gray-400" />}
          title="Awaiting Evidence"
          description="Both parties can submit evidence to support their case"
          color="bg-gray-300"
          isLast={++currentEvent === eventCount}
          side="center"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <EvidenceEmptyState role="client" />
            <EvidenceEmptyState role="freelancer" />
          </div>
        </TimelineEvent>
      )}

      {/* Employer Evidence Missing */}
      {!hasClientEvidence && hasFreelancerEvidence && (
        <TimelineEvent
          icon={<FileText className="h-6 w-6 text-gray-400" />}
          title="Employer Evidence Pending"
          description="Waiting for employer to submit evidence"
          color="bg-gray-300"
          isLast={++currentEvent === eventCount}
          side="left"
        >
          <EvidenceEmptyState role="client" />
        </TimelineEvent>
      )}

      {/* Worker Evidence Missing */}
      {hasClientEvidence && !hasFreelancerEvidence && (
        <TimelineEvent
          icon={<FileText className="h-6 w-6 text-gray-400" />}
          title="Worker Evidence Pending"
          description="Waiting for worker to submit evidence"
          color="bg-gray-300"
          isLast={++currentEvent === eventCount}
          side="right"
        >
          <EvidenceEmptyState role="freelancer" />
        </TimelineEvent>
      )}

      {/* Resolution */}
      {showResolution && dispute.status === DisputeStatus.RESOLVED && (
        <TimelineEvent
          icon={<CheckCircle2 className="h-6 w-6 text-white" />}
          title="Dispute Resolved"
          description="DAO voted and executed resolution"
          timestamp={dispute.resolvedAt}
          color="bg-green-500"
          isLast={++currentEvent === eventCount}
          side="center"
        >
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <p className="text-sm font-medium text-green-900 dark:text-green-200">
              Resolution: {dispute.resolution === 1
                ? 'Employer Wins'
                : dispute.resolution === 2
                ? 'Worker Wins'
                : dispute.resolution === 3
                ? 'Split Decision'
                : 'Pending'}
            </p>
            {dispute.proposal && (
              <p className="text-xs text-green-800 dark:text-green-300 mt-1">
                DAO Proposal #{dispute.proposal.id} was executed
              </p>
            )}
          </div>
        </TimelineEvent>
      )}

      {/* Withdrawn */}
      {showResolution && dispute.status === DisputeStatus.WITHDRAWN && (
        <TimelineEvent
          icon={<XCircle className="h-6 w-6 text-white" />}
          title="Dispute Withdrawn"
          description={`Withdrawn by ${
            dispute.openedBy === dispute.client ? 'Employer' : 'Worker'
          }`}
          timestamp={dispute.resolvedAt}
          color="bg-gray-500"
          isLast={++currentEvent === eventCount}
          side="center"
        >
          <div className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700/50 rounded-lg p-3">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              The dispute was withdrawn and the contract can proceed normally.
            </p>
          </div>
        </TimelineEvent>
      )}
    </div>
  );
}

// ===============================================
// COMPACT VARIANT
// ===============================================

/**
 * Compact timeline without full evidence display
 */
export function EvidenceTimelineCompact(
  props: Omit<EvidenceTimelineProps, 'compact'>
) {
  return <EvidenceTimeline {...props} compact />;
}

// ===============================================
// SKELETON LOADER
// ===============================================

export function EvidenceTimelineSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-0', className)}>
      {/* Event 1 */}
      <div className="relative">
        <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-600" />
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse" />
          <div className="flex-1 pb-8">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2 animate-pulse" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2 animate-pulse" />
            <div className="h-24 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Event 2 */}
      <div className="relative">
        <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-600" />
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse" />
          <div className="flex-1 pb-8">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-2 animate-pulse" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-56 mb-2 animate-pulse" />
            <div className="h-32 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Event 3 */}
      <div className="relative">
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse" />
          <div className="flex-1 pb-8">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-36 mb-2 animate-pulse" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-52 mb-2 animate-pulse" />
            <div className="h-32 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ===============================================
// EXPORT
// ===============================================

export default EvidenceTimeline;
