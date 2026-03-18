'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProposal, useUserVote } from '@/hooks/useProposals';
import { useDAOMembership } from '@/hooks/useDAOMembership';
import { useDispute } from '@/hooks/useDisputes';
import { useStacks } from '@/hooks/useStacks';
import { ProposalStatus } from '@/types/dispute';
import {
  ProposalCard,
  VotingInterface,
  VotingResults,
} from '@/components/proposal';
import { DAOMemberBadge, DAOMemberGate } from '@/components/dao';
import {
  DisputeCard,
  EvidenceComparison,
} from '@/components/dispute';
import { AppLayout } from '@/components/layout/AppLayout';
import { AlertCircle, Loader2, ExternalLink } from 'lucide-react';

/**
 * Proposal Detail Page
 *
 * Shows full details of a specific proposal including:
 * - Proposal information
 * - Voting results
 * - Voting interface (for DAO members)
 * - Related dispute information (if applicable)
 */
export default function ProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const proposalId = parseInt(params.id as string);
  const { userAddress } = useStacks();

  const {
    data: proposal,
    isLoading: proposalLoading,
    error: proposalError,
    refetch: refetchProposal,
  } = useProposal(proposalId, {
    refetchInterval: 15000, // Refetch every 15 seconds for voting updates
  });

  const { data: userVote } = useUserVote(proposalId, userAddress);
  const { data: membership } = useDAOMembership();

  // Get related dispute if this is a dispute resolution proposal
  const { data: dispute } = useDispute(
    proposal?.targetContractId || null,
    {
      enabled: proposal?.proposalType === 0, // Only fetch if dispute resolution
    }
  );

  // Loading state
  if (proposalLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading proposal...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (proposalError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800/50 rounded-lg border border-red-200 dark:border-red-700/50 p-6">
          <div className="flex items-center gap-3 text-red-800 mb-4">
            <AlertCircle className="h-6 w-6 flex-shrink-0" />
            <div>
              <h3 className="font-semibold">Failed to Load Proposal</h3>
              <p className="text-sm mt-1">{proposalError.message}</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/dao/proposals')}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Proposals
          </button>
        </div>
      </div>
    );
  }

  // Not found state
  if (!proposal) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700/50 p-6 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Proposal Not Found
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            The proposal you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => router.push('/dao/proposals')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Proposals
          </button>
        </div>
      </div>
    );
  }

  const hasVoted = !!userVote;
  const isMember = membership?.isMember || false;
  const isActive = proposal.status === ProposalStatus.ACTIVE;

  return (
    <AppLayout>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/dao/proposals')}
              className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              ← Back to Proposals
            </button>
            <DAOMemberBadge userAddress={userAddress} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Proposal Details */}
          <ProposalCard
            proposal={proposal}
            currentUserAddress={userAddress}
            variant="detailed"
            showActions={false}
          />

          {/* Voting Results */}
          <VotingResults
            proposal={proposal}
            showDetailed
            showThreshold
          />

          {/* Voting Interface (for DAO members) */}
          {isActive && (
            <DAOMemberGate
              fallback={
                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/40 rounded-lg p-6">
                  <div className="flex items-center gap-3 text-blue-800 dark:text-blue-300">
                    <AlertCircle className="h-6 w-6 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">DAO Membership Required</p>
                      <p className="text-sm mt-1">
                        You need to be a DAO member to vote on this proposal.
                      </p>
                    </div>
                  </div>
                </div>
              }
            >
              <VotingInterface
                proposal={proposal}
                isDAOMember={isMember}
                hasVoted={hasVoted}
                userVote={userVote?.vote}
                onSuccess={() => {
                  refetchProposal();
                }}
              />
            </DAOMemberGate>
          )}

          {/* Related Dispute (if dispute resolution proposal) */}
          {proposal.proposalType === 0 && dispute && (
            <div className="bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Related Dispute
                </h2>
                <button
                  onClick={() => router.push(`/disputes/${dispute.id}`)}
                  className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  View Full Dispute
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>

              <DisputeCard
                dispute={dispute}
                currentUserAddress={userAddress}
                showActions={false}
              />

              {/* Evidence (if both parties submitted) */}
              {dispute.clientEvidence && dispute.freelancerEvidence && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Evidence Submitted
                  </h3>
                  <EvidenceComparison
                    clientEvidence={dispute.clientEvidence}
                    freelancerEvidence={dispute.freelancerEvidence}
                    clientAddress={dispute.client}
                    freelancerAddress={dispute.freelancer}
                    currentUserAddress={userAddress}
                  />
                </div>
              )}
            </div>
          )}

          {/* Proposal Info */}
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/40 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-3">
              About This Proposal
            </h3>
            <div className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
              <p>
                <strong>Type:</strong>{' '}
                {proposal.proposalType === 0
                  ? 'Dispute Resolution'
                  : 'Escrow Release'}
              </p>
              <p>
                <strong>Target Contract:</strong> #{proposal.targetContractId}
              </p>
              <p>
                <strong>Voting Period:</strong> 1440 blocks (~10 days)
              </p>
              <p>
                <strong>Required Threshold:</strong> 70% Yes votes (supermajority)
              </p>
              {proposal.status === ProposalStatus.PASSED && (
                <p className="text-blue-800 dark:text-blue-300 font-semibold mt-2">
                  This proposal has passed and is ready for execution
                </p>
              )}
              {proposal.status === ProposalStatus.EXECUTED && (
                <p className="text-blue-800 dark:text-blue-300 font-semibold mt-2">
                  This proposal has been executed successfully
                </p>
              )}
              {proposal.status === ProposalStatus.FAILED && (
                <p className="text-gray-600 dark:text-gray-400 font-semibold mt-2">
                  This proposal did not reach the required threshold
                </p>
              )}
            </div>
          </div>

          {/* Connect Wallet Prompt */}
          {!userAddress && (
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/40 rounded-lg p-6">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900 dark:text-blue-200">
                  <p className="font-medium">Connect Your Wallet</p>
                  <p className="text-blue-800 dark:text-blue-300 mt-1">
                    Connect your wallet to vote on this proposal if you're a DAO
                    member.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </AppLayout>
  );
}
