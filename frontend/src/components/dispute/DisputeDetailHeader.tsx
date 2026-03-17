'use client';

import React from 'react';
import Link from 'next/link';
import { Dispute, DisputeStatus } from '@/types/dispute';
import { DisputeBadge } from './DisputeBadge';
import { WithdrawDisputeButton } from './WithdrawDisputeButton';
import {
  formatBlockTime,
  truncateAddress,
  getResolutionInfo,
} from '@/lib/disputeUtils';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  FileText,
  User,
  Calendar,
  ExternalLink,
  CheckCircle2,
  Clock,
} from 'lucide-react';

// ===============================================
// TYPES
// ===============================================

export interface DisputeDetailHeaderProps {
  /**
   * The dispute to display
   */
  dispute: Dispute;

  /**
   * Current user's address for permission checks
   */
  currentUserAddress?: string;

  /**
   * Callback after successful withdrawal
   */
  onWithdrawSuccess?: () => void;

  /**
   * Whether to show back button
   * @default true
   */
  showBackButton?: boolean;

  /**
   * Custom back URL
   * @default '/disputes'
   */
  backUrl?: string;

  /**
   * Additional CSS classes
   */
  className?: string;
}

// ===============================================
// COMPONENT
// ===============================================

/**
 * DisputeDetailHeader Component
 *
 * Header section for dispute detail pages.
 * Shows dispute info, status, parties, and actions.
 *
 * @example
 * ```tsx
 * <DisputeDetailHeader
 *   dispute={dispute}
 *   currentUserAddress={userAddress}
 *   onWithdrawSuccess={() => router.push('/disputes')}
 * />
 * ```
 */
export function DisputeDetailHeader({
  dispute,
  currentUserAddress,
  onWithdrawSuccess,
  showBackButton = true,
  backUrl = '/disputes',
  className,
}: DisputeDetailHeaderProps) {
  const isClient = currentUserAddress === dispute.client;
  const isFreelancer = currentUserAddress === dispute.freelancer;
  const isParticipant = isClient || isFreelancer;
  const isOpener = currentUserAddress === dispute.openedBy;

  const hasClientEvidence = !!dispute.clientEvidence;
  const hasFreelancerEvidence = !!dispute.freelancerEvidence;

  return (
    <div className={cn('bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700/50 shadow-sm', className)}>
      {/* Back Button */}
      {showBackButton && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700/50">
          <Link
            href={backUrl}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Disputes
          </Link>
        </div>
      )}

      {/* Main Header */}
      <div className="p-6 space-y-6">
        {/* Title Row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Dispute #{dispute.id}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                <DisputeBadge status={dispute.status} size="medium" />
                {isParticipant && (
                  <span className="text-sm bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 px-3 py-1 rounded-full font-medium">
                    You're involved
                  </span>
                )}
                {isOpener && (
                  <span className="text-sm bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 px-3 py-1 rounded-full font-medium">
                    You opened this
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          {dispute.status === DisputeStatus.OPEN && isOpener && (
            <WithdrawDisputeButton
              dispute={dispute}
              currentUserAddress={currentUserAddress}
              onSuccess={onWithdrawSuccess}
            />
          )}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Contract */}
          <div className="bg-gray-50 dark:bg-gray-950 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
              <FileText className="h-4 w-4" />
              <span className="font-medium">Contract</span>
            </div>
            <Link
              href={`/contracts/${dispute.contractId}`}
              className="text-lg font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              #{dispute.contractId}
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>

          {/* Created */}
          <div className="bg-gray-50 dark:bg-gray-950 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">Opened</span>
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatBlockTime(dispute.createdAt)}
            </p>
          </div>

          {/* Resolution Status */}
          {dispute.status === DisputeStatus.RESOLVED ? (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-medium">Resolution</span>
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {getResolutionInfo(dispute.resolution).text}
              </p>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Status</span>
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {dispute.status === DisputeStatus.OPEN ? 'In Progress' : 'Withdrawn'}
              </p>
            </div>
          )}
        </div>

        {/* Parties */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Parties Involved
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Employer */}
            <div
              className={cn(
                'rounded-lg border-2 p-4',
                isClient
                  ? 'bg-blue-50 border-blue-300 dark:bg-blue-900/10 dark:border-blue-700'
                  : 'bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-700/50'
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <User className={cn('h-4 w-4', isClient ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400')} />
                  <span className={cn('font-semibold', isClient ? 'text-blue-900 dark:text-blue-300' : 'text-gray-900 dark:text-white')}>
                    Client
                  </span>
                </div>
                {isClient && (
                  <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-medium">
                    You
                  </span>
                )}
              </div>
              <code className="block text-sm font-mono text-gray-700 dark:text-gray-300 break-all">
                {truncateAddress(dispute.client, 12)}
              </code>
              <div className="mt-2 flex items-center gap-2">
                {hasClientEvidence ? (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Evidence submitted
                  </span>
                ) : (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    No evidence yet
                  </span>
                )}
              </div>
            </div>

            {/* Worker */}
            <div
              className={cn(
                'rounded-lg border-2 p-4',
                isFreelancer
                  ? 'bg-purple-50 border-purple-300 dark:bg-purple-900/10 dark:border-purple-700'
                  : 'bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-700/50'
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <User className={cn('h-4 w-4', isFreelancer ? 'text-purple-600' : 'text-gray-600 dark:text-gray-400')} />
                  <span className={cn('font-semibold', isFreelancer ? 'text-purple-900 dark:text-purple-300' : 'text-gray-900 dark:text-white')}>
                    Worker
                  </span>
                </div>
                {isFreelancer && (
                  <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full font-medium">
                    You
                  </span>
                )}
              </div>
              <code className="block text-sm font-mono text-gray-700 dark:text-gray-300 break-all">
                {truncateAddress(dispute.freelancer, 12)}
              </code>
              <div className="mt-2 flex items-center gap-2">
                {hasFreelancerEvidence ? (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Evidence submitted
                  </span>
                ) : (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    No evidence yet
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dispute Reason */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Dispute Reason
          </h3>
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/40 rounded-lg p-4">
            <p className="text-gray-800 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
              {dispute.reason}
            </p>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Opened by {dispute.openedBy === dispute.client ? 'Employer' : 'Worker'}
          </p>
        </div>

        {/* DAO Proposal Link */}
        {dispute.proposal && (
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/40 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
                  DAO Proposal Created
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  This dispute is being reviewed by the DAO
                </p>
              </div>
              <Link
                href={`/dao/proposals/${dispute.proposal.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                View Proposal
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ===============================================
// COMPACT VARIANT
// ===============================================

/**
 * Compact header without full detail
 */
export function DisputeDetailHeaderCompact(
  props: DisputeDetailHeaderProps
) {
  const { dispute, currentUserAddress, className } = props;

  const isClient = currentUserAddress === dispute.client;
  const isFreelancer = currentUserAddress === dispute.freelancer;

  return (
    <div className={cn('bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700/50 p-4', className)}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Dispute #{dispute.id}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Contract #{dispute.contractId}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DisputeBadge status={dispute.status} size="small" />
          {(isClient || isFreelancer) && (
            <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-0.5 rounded-full">
              You
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ===============================================
// EXPORT
// ===============================================

export default DisputeDetailHeader;
