'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';
import { DisputeBadge } from './DisputeBadge';
import { Dispute } from '@/types/dispute';
import { useRealtimeDispute } from '@/hooks/useRealtime';
import { motion } from 'framer-motion';

interface LiveDisputeStatusProps {
  /**
   * Dispute ID for real-time updates
   */
  disputeId: number;
  /**
   * Current dispute data
   */
  dispute: Dispute;
  /**
   * Show live indicator
   */
  showLiveIndicator?: boolean;
  /**
   * Polling interval in milliseconds
   */
  interval?: number;
}

/**
 * LiveDisputeStatus Component
 *
 * Displays dispute status with real-time updates.
 * Shows a live indicator and automatically refreshes data.
 */
export function LiveDisputeStatus({
  disputeId,
  dispute,
  showLiveIndicator = true,
  interval = 30000,
}: LiveDisputeStatusProps) {
  // Enable real-time updates for this dispute
  useRealtimeDispute({ disputeId, interval, enableNotifications: true });

  return (
    <div className="flex items-center gap-3">
      <DisputeBadge status={dispute.status} />

      {showLiveIndicator && (
        <motion.div
          className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <RefreshCw className="h-3 w-3" />
          </motion.div>
          <span>Live</span>
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default LiveDisputeStatus;
