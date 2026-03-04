/**
 * useRealtime Hook
 *
 * Provides real-time updates for disputes and proposals using polling.
 * Automatically refetches data at configurable intervals.
 */

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNotifications, createDisputeNotification, createProposalNotification } from './useNotifications';
import { NotificationType } from '@/components/notifications/NotificationBell';
import { Dispute, Proposal, DisputeStatus, ProposalStatus } from '@/types/dispute';

interface UseRealtimeDisputeOptions {
  disputeId: number;
  /**
   * Polling interval in milliseconds
   * @default 30000 (30 seconds)
   */
  interval?: number;
  /**
   * Enable notifications for status changes
   * @default true
   */
  enableNotifications?: boolean;
}

/**
 * Real-time updates for a single dispute
 */
export function useRealtimeDispute({
  disputeId,
  interval = 30000,
  enableNotifications = true,
}: UseRealtimeDisputeOptions) {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();
  const previousDataRef = useRef<Dispute | null>(null);

  useEffect(() => {
    const intervalId = setInterval(() => {
      // Refetch dispute data
      queryClient.invalidateQueries({ queryKey: ['dispute', disputeId] });

      // Check for changes and notify
      if (enableNotifications) {
        const currentData = queryClient.getQueryData<Dispute>(['dispute', disputeId]);

        if (currentData && previousDataRef.current) {
          const prev = previousDataRef.current;

          // Check for status change
          if (currentData.status !== prev.status) {
            if (currentData.status === DisputeStatus.RESOLVED) {
              addNotification(
                createDisputeNotification(
                  NotificationType.DISPUTE_RESOLVED,
                  disputeId,
                  `Dispute #${disputeId} has been resolved.`
                )
              );
            } else if (currentData.status === DisputeStatus.WITHDRAWN) {
              addNotification(
                createDisputeNotification(
                  NotificationType.INFO,
                  disputeId,
                  `Dispute #${disputeId} has been withdrawn.`
                )
              );
            }
          }

          // Check for new evidence
          if (currentData.clientEvidence && !prev.clientEvidence) {
            addNotification(
              createDisputeNotification(
                NotificationType.EVIDENCE_SUBMITTED,
                disputeId,
                'Client has submitted evidence.'
              )
            );
          }
          if (currentData.freelancerEvidence && !prev.freelancerEvidence) {
            addNotification(
              createDisputeNotification(
                NotificationType.EVIDENCE_SUBMITTED,
                disputeId,
                'Freelancer has submitted evidence.'
              )
            );
          }
        }

        previousDataRef.current = currentData || null;
      }
    }, interval);

    return () => clearInterval(intervalId);
  }, [disputeId, interval, enableNotifications, queryClient, addNotification]);
}

interface UseRealtimeProposalOptions {
  proposalId: number;
  /**
   * Polling interval in milliseconds
   * @default 30000 (30 seconds)
   */
  interval?: number;
  /**
   * Enable notifications for vote updates
   * @default true
   */
  enableNotifications?: boolean;
}

/**
 * Real-time updates for a single proposal with vote counting
 */
export function useRealtimeProposal({
  proposalId,
  interval = 30000,
  enableNotifications = true,
}: UseRealtimeProposalOptions) {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();
  const previousDataRef = useRef<Proposal | null>(null);

  useEffect(() => {
    const intervalId = setInterval(() => {
      // Refetch proposal data
      queryClient.invalidateQueries({ queryKey: ['proposal', proposalId] });

      // Check for changes and notify
      if (enableNotifications) {
        const currentData = queryClient.getQueryData<Proposal>(['proposal', proposalId]);

        if (currentData && previousDataRef.current) {
          const prev = previousDataRef.current;

          // Check for new votes
          const totalVotes = currentData.yesVotes + currentData.noVotes + currentData.abstainVotes;
          const prevTotalVotes = prev.yesVotes + prev.noVotes + prev.abstainVotes;

          if (totalVotes > prevTotalVotes) {
            addNotification(
              createProposalNotification(
                NotificationType.VOTE_CAST,
                proposalId,
                `New vote cast on Proposal #${proposalId}. Total votes: ${totalVotes}/${currentData.totalEligibleVoters}`
              )
            );
          }

          // Check for status change to finalized
          if (currentData.status !== prev.status) {
            if (
              currentData.status === ProposalStatus.PASSED ||
              currentData.status === ProposalStatus.FAILED ||
              currentData.status === ProposalStatus.EXECUTED
            ) {
              const statusText =
                currentData.status === ProposalStatus.PASSED
                  ? 'passed'
                  : currentData.status === ProposalStatus.FAILED
                  ? 'failed'
                  : 'executed';

              addNotification(
                createProposalNotification(
                  NotificationType.PROPOSAL_FINALIZED,
                  proposalId,
                  `Proposal #${proposalId} has ${statusText}.`
                )
              );
            }
          }
        }

        previousDataRef.current = currentData || null;
      }
    }, interval);

    return () => clearInterval(intervalId);
  }, [proposalId, interval, enableNotifications, queryClient, addNotification]);
}

/**
 * Real-time updates for all user's disputes
 */
export function useRealtimeDisputes(interval: number = 60000) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const intervalId = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['user-disputes'] });
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
    }, interval);

    return () => clearInterval(intervalId);
  }, [interval, queryClient]);
}

/**
 * Real-time updates for all proposals
 */
export function useRealtimeProposals(interval: number = 60000) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const intervalId = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
    }, interval);

    return () => clearInterval(intervalId);
  }, [interval, queryClient]);
}

/**
 * Master real-time hook that enables all real-time features
 */
export function useRealtimeUpdates() {
  useRealtimeDisputes();
  useRealtimeProposals();
}

export default {
  useRealtimeDispute,
  useRealtimeProposal,
  useRealtimeDisputes,
  useRealtimeProposals,
  useRealtimeUpdates,
};
