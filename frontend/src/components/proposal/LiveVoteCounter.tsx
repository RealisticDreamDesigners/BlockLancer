'use client';

import React from 'react';
import { RefreshCw, TrendingUp } from 'lucide-react';
import { Proposal } from '@/types/dispute';
import { useRealtimeProposal } from '@/hooks/useRealtime';
import { motion, AnimatePresence } from 'framer-motion';

interface LiveVoteCounterProps {
  /**
   * Proposal ID for real-time updates
   */
  proposalId: number;
  /**
   * Current proposal data
   */
  proposal: Proposal;
  /**
   * Show live indicator
   */
  showLiveIndicator?: boolean;
  /**
   * Polling interval in milliseconds
   */
  interval?: number;
  /**
   * Compact mode
   */
  compact?: boolean;
}

/**
 * LiveVoteCounter Component
 *
 * Displays real-time vote counts with automatic updates.
 * Shows live indicator and vote progress.
 */
export function LiveVoteCounter({
  proposalId,
  proposal,
  showLiveIndicator = true,
  interval = 30000,
  compact = false,
}: LiveVoteCounterProps) {
  // Enable real-time updates for this proposal
  useRealtimeProposal({ proposalId, interval, enableNotifications: true });

  const totalVotes = proposal.yesVotes + proposal.noVotes + proposal.abstainVotes;
  const yesPercentage = totalVotes > 0 ? (proposal.yesVotes / proposal.totalEligibleVoters) * 100 : 0;
  const noPercentage = totalVotes > 0 ? (proposal.noVotes / proposal.totalEligibleVoters) * 100 : 0;
  const abstainPercentage = totalVotes > 0 ? (proposal.abstainVotes / proposal.totalEligibleVoters) * 100 : 0;
  const participationRate = (totalVotes / proposal.totalEligibleVoters) * 100;

  // Check if threshold is reached
  const thresholdReached = yesPercentage >= 70;

  if (compact) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Votes:</span>
          <div className="flex items-center gap-1">
            <span className="text-sm text-green-600 font-semibold">{proposal.yesVotes} Yes</span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-sm text-gray-600 dark:text-gray-400 font-semibold">{proposal.noVotes} No</span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">{proposal.abstainVotes} Abstain</span>
          </div>
        </div>

        {showLiveIndicator && (
          <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <RefreshCw className="h-3 w-3" />
            </motion.div>
            <span>Live</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Live Indicator */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Vote Progress</h3>
        {showLiveIndicator && (
          <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <RefreshCw className="h-3 w-3" />
            </motion.div>
            <span>Live Updates</span>
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </div>
          </div>
        )}
      </div>

      {/* Vote Counts */}
      <div className="grid grid-cols-3 gap-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={`yes-${proposal.yesVotes}`}
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <div className="text-2xl font-bold text-green-600">{proposal.yesVotes}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Yes</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{yesPercentage.toFixed(1)}%</div>
          </motion.div>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={`no-${proposal.noVotes}`}
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">{proposal.noVotes}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">No</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{noPercentage.toFixed(1)}%</div>
          </motion.div>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={`abstain-${proposal.abstainVotes}`}
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <div className="text-2xl font-bold text-gray-600">{proposal.abstainVotes}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Abstain</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{abstainPercentage.toFixed(1)}%</div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600 dark:text-gray-400">
            {totalVotes} / {proposal.totalEligibleVoters} votes cast
          </span>
          <span className="font-medium text-gray-900 dark:text-white">
            {participationRate.toFixed(1)}% participation
          </span>
        </div>

        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full flex"
            initial={{ width: 0 }}
            animate={{ width: `${participationRate}%` }}
            transition={{ duration: 0.5 }}
          >
            <div
              className="bg-green-500"
              style={{ width: `${(proposal.yesVotes / proposal.totalEligibleVoters) * 100}%` }}
            />
            <div
              className="bg-gray-500"
              style={{ width: `${(proposal.noVotes / proposal.totalEligibleVoters) * 100}%` }}
            />
            <div
              className="bg-gray-400"
              style={{ width: `${(proposal.abstainVotes / proposal.totalEligibleVoters) * 100}%` }}
            />
          </motion.div>
        </div>

        {/* Threshold Indicator */}
        <div className="relative">
          <div className="absolute left-[70%] top-0 transform -translate-x-1/2">
            <div className="flex flex-col items-center">
              <div className="w-px h-2 bg-purple-600" />
              <div className="text-xs font-medium text-purple-600 whitespace-nowrap">
                70% threshold
              </div>
            </div>
          </div>
        </div>

        {thresholdReached && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2"
          >
            <TrendingUp className="h-4 w-4" />
            <span>Supermajority threshold reached!</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default LiveVoteCounter;
