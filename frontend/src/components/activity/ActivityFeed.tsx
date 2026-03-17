'use client';

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertCircle,
  FileText,
  CheckCircle,
  Vote,
  Users,
  Clock,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { DisputeStatus, ProposalStatus } from '@/types/dispute';

/**
 * Activity types
 */
export enum ActivityType {
  DISPUTE_OPENED = 'dispute-opened',
  EVIDENCE_SUBMITTED = 'evidence-submitted',
  DISPUTE_RESOLVED = 'dispute-resolved',
  DISPUTE_WITHDRAWN = 'dispute-withdrawn',
  PROPOSAL_CREATED = 'proposal-created',
  VOTE_CAST = 'vote-cast',
  PROPOSAL_FINALIZED = 'proposal-finalized',
}

/**
 * Activity item interface
 */
export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  actor?: string; // Principal address
  link?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface ActivityFeedProps {
  /**
   * Array of activity items
   */
  activities: ActivityItem[];
  /**
   * Show loading skeleton
   */
  isLoading?: boolean;
  /**
   * Maximum number of items to show
   */
  maxItems?: number;
  /**
   * Show relative timestamps
   */
  showRelativeTime?: boolean;
  /**
   * Callback when activity item is clicked
   */
  onItemClick?: (activity: ActivityItem) => void;
}

/**
 * ActivityFeed Component
 *
 * Displays a live feed of recent dispute and DAO activities.
 * Shows real-time updates as events occur.
 */
export function ActivityFeed({
  activities,
  isLoading = false,
  maxItems = 10,
  showRelativeTime = true,
  onItemClick,
}: ActivityFeedProps) {
  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case ActivityType.DISPUTE_OPENED:
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case ActivityType.EVIDENCE_SUBMITTED:
        return <FileText className="h-5 w-5 text-blue-600" />;
      case ActivityType.DISPUTE_RESOLVED:
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case ActivityType.DISPUTE_WITHDRAWN:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
      case ActivityType.PROPOSAL_CREATED:
        return <FileText className="h-5 w-5 text-purple-600" />;
      case ActivityType.VOTE_CAST:
        return <Vote className="h-5 w-5 text-blue-600" />;
      case ActivityType.PROPOSAL_FINALIZED:
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatAddress = (address?: string) => {
    if (!address) return null;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4 animate-pulse">
            <div className="w-10 h-10 bg-gray-200 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const displayedActivities = activities.slice(0, maxItems);

  if (displayedActivities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <Clock className="h-12 w-12 mb-3 opacity-50" />
        <p className="text-sm font-medium">No recent activity</p>
        <p className="text-xs text-gray-400 mt-1">
          Activity will appear here as events occur
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {displayedActivities.map((activity, index) => (
        <motion.div
          key={activity.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => onItemClick?.(activity)}
          className={`flex gap-4 ${
            onItemClick ? 'cursor-pointer hover:bg-gray-50 -mx-4 px-4 py-2 rounded-lg transition-colors' : '-'
          }`}
        >
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              {getActivityIcon(activity.type)}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {activity.title}
                </p>
                <p className="text-sm text-gray-600 mt-0.5">
                  {activity.description}
                </p>
                {activity.actor && (
                  <p className="text-xs text-gray-500 mt-1">
                    by <span className="font-mono">{formatAddress(activity.actor)}</span>
                  </p>
                )}
              </div>
              {showRelativeTime && (
                <span className="text-xs text-gray-500 flex-shrink-0">
                  {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                </span>
              )}
            </div>
          </div>
        </motion.div>
      ))}

      {activities.length > maxItems && (
        <p className="text-xs text-center text-gray-500 mt-4">
          Showing {maxItems} of {activities.length} activities
        </p>
      )}
    </div>
  );
}

/**
 * Helper to create activity items from dispute events
 */
export function createDisputeActivity(
  type: ActivityType,
  disputeId: number,
  description: string,
  actor?: string
): ActivityItem {
  const titles: Record<ActivityType, string> = {
    [ActivityType.DISPUTE_OPENED]: `Dispute #${disputeId} Opened`,
    [ActivityType.EVIDENCE_SUBMITTED]: `Evidence Submitted on Dispute #${disputeId}`,
    [ActivityType.DISPUTE_RESOLVED]: `Dispute #${disputeId} Resolved`,
    [ActivityType.DISPUTE_WITHDRAWN]: `Dispute #${disputeId} Withdrawn`,
    [ActivityType.PROPOSAL_CREATED]: `Proposal Created for Dispute #${disputeId}`,
    [ActivityType.VOTE_CAST]: `Vote Cast`,
    [ActivityType.PROPOSAL_FINALIZED]: `Proposal Finalized`,
  };

  return {
    id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    title: titles[type],
    description,
    actor,
    link: `/disputes/${disputeId}`,
    timestamp: new Date(),
    metadata: { disputeId },
  };
}

/**
 * Helper to create activity items from proposal events
 */
export function createProposalActivity(
  type: ActivityType,
  proposalId: number,
  description: string,
  actor?: string
): ActivityItem {
  const titles: Record<ActivityType, string> = {
    [ActivityType.DISPUTE_OPENED]: 'Dispute Opened',
    [ActivityType.EVIDENCE_SUBMITTED]: 'Evidence Submitted',
    [ActivityType.DISPUTE_RESOLVED]: 'Dispute Resolved',
    [ActivityType.DISPUTE_WITHDRAWN]: 'Dispute Withdrawn',
    [ActivityType.PROPOSAL_CREATED]: `Proposal #${proposalId} Created`,
    [ActivityType.VOTE_CAST]: `Vote Cast on Proposal #${proposalId}`,
    [ActivityType.PROPOSAL_FINALIZED]: `Proposal #${proposalId} Finalized`,
  };

  return {
    id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    title: titles[type],
    description,
    actor,
    link: `/dao/proposals/${proposalId}`,
    timestamp: new Date(),
    metadata: { proposalId },
  };
}

export default ActivityFeed;
