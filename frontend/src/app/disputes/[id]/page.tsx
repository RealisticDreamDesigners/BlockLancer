'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispute } from '@/hooks/useDisputes';
import { useStacks } from '@/hooks/useStacks';
import { DisputeStatus } from '@/types/dispute';
import {
  DisputeDetailHeader,
  EvidenceTimeline,
  EvidenceSubmission,
  EvidenceComparison,
  CreateProposalModal,
  ProposalCard,
} from '@/components/dispute';
import { useDAOMembership, useProposals, useUserVote } from '@/hooks/useProposals';
import { AppLayout } from '@/components/layout/AppLayout';
import { AlertCircle, Loader2, Scale } from 'lucide-react';

/**
 * Wrapper component for ProposalCard with vote status
 */
function ProposalCardWithVote({
  proposal,
  isDAOMember,
  onVoteSuccess,
}: {
  proposal: any;
  isDAOMember: boolean;
  onVoteSuccess: () => void;
}) {
  const { data: userVote } = useUserVote(proposal.id);

  return (
    <ProposalCard
      proposal={proposal}
      hasVoted={!!userVote}
      userVote={userVote?.vote}
      isDAOMember={isDAOMember}
      onVoteSuccess={onVoteSuccess}
    />
  );
}

/**
 * Dispute Detail Page
 *
 * Shows full details of a specific dispute including:
 * - Dispute header with status and parties
 * - Evidence timeline
 * - Evidence submission form (if eligible)
 * - Link to DAO proposal (if exists)
 */
export default function DisputeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const disputeId = parseInt(params.id as string);
  const { userAddress } = useStacks();
  const [showProposalModal, setShowProposalModal] = useState(false);

  const {
    data: dispute,
    isLoading,
    error,
    refetch,
  } = useDispute(disputeId, {
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Check if user is a DAO member
  const { data: isDAOMember } = useDAOMembership();

  // Fetch all proposals and filter for this dispute
  const { data: allProposals } = useProposals();
  const disputeProposals = React.useMemo(() => {
    if (!allProposals) return [];
    return allProposals.filter(p => p.targetContractId === disputeId);
  }, [allProposals, disputeId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading dispute...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800/50 rounded-lg border border-red-200 dark:border-red-800/50 p-6">
          <div className="flex items-center gap-3 text-red-800 dark:text-red-300 mb-4">
            <AlertCircle className="h-6 w-6 flex-shrink-0" />
            <div>
              <h3 className="font-semibold">Failed to Load Dispute</h3>
              <p className="text-sm mt-1">{error.message}</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/disputes')}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Disputes
          </button>
        </div>
      </div>
    );
  }

  // Not found state
  if (!dispute) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700/50 p-6 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Dispute Not Found
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            The dispute you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => router.push('/disputes')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Disputes
          </button>
        </div>
      </div>
    );
  }

  // Check user permissions
  const isClient = userAddress === dispute.client;
  const isFreelancer = userAddress === dispute.freelancer;
  const isParticipant = isClient || isFreelancer;

  const canSubmitEvidence =
    dispute.status === DisputeStatus.OPEN &&
    isParticipant &&
    ((isClient && !dispute.clientEvidence) ||
      (isFreelancer && !dispute.freelancerEvidence));

  return (
    <AppLayout>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Dispute Header */}
          <DisputeDetailHeader
            dispute={dispute}
            currentUserAddress={userAddress}
            onWithdrawSuccess={() => {
              router.push('/disputes');
            }}
            showBackButton
            backUrl="/disputes"
          />

          {/* Evidence Timeline */}
          <div className="bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700/50 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Dispute Timeline
            </h2>
            <EvidenceTimeline
              dispute={dispute}
              currentUserAddress={userAddress}
              showDisputeCreation
              showResolution
            />
          </div>

          {/* Evidence Submission Form */}
          {canSubmitEvidence && (
            <EvidenceSubmission
              dispute={dispute}
              currentUserAddress={userAddress}
              onSuccess={() => {
                refetch();
              }}
            />
          )}

          {/* Evidence Comparison (if both parties submitted) */}
          {dispute.clientEvidence && dispute.freelancerEvidence && (
            <div className="bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700/50 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Evidence Comparison
              </h2>
              <EvidenceComparison
                clientEvidence={dispute.clientEvidence}
                freelancerEvidence={dispute.freelancerEvidence}
                clientAddress={dispute.client}
                freelancerAddress={dispute.freelancer}
                currentUserAddress={userAddress}
              />
            </div>
          )}

          {/* DAO Voting Section */}
          {dispute.status === DisputeStatus.OPEN && (
            <div className="bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Scale className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      DAO Resolution
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      DAO members can create and vote on resolution proposals
                    </p>
                  </div>
                </div>
                {isDAOMember && disputeProposals.length === 0 && (
                  <button
                    onClick={() => setShowProposalModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Scale className="h-4 w-4" />
                    Create Proposal
                  </button>
                )}
              </div>

              {/* Active Proposals */}
              {disputeProposals.length > 0 ? (
                <div className="space-y-4">
                  {disputeProposals.map((proposal) => (
                    <ProposalCardWithVote
                      key={proposal.id}
                      proposal={proposal}
                      isDAOMember={isDAOMember || false}
                      onVoteSuccess={() => {
                        // Refresh proposals after voting
                        window.location.reload();
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 px-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700/50">
                  {isDAOMember ? (
                    <>
                      <p className="text-gray-700 dark:text-gray-300 mb-2">No proposals yet for this dispute</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Be the first to create a resolution proposal
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-700 dark:text-gray-300 mb-2">Waiting for DAO proposals</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Only DAO members can create resolution proposals
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Create Proposal Modal */}
          {dispute && (
            <CreateProposalModal
              dispute={dispute}
              isOpen={showProposalModal}
              onClose={() => setShowProposalModal(false)}
              onSuccess={(txId) => {
                console.log('Proposal created:', txId);
                setShowProposalModal(false);
                // Refresh page after a delay to allow transaction to confirm
                setTimeout(() => {
                  window.location.reload();
                }, 3000);
              }}
            />
          )}

          {/* DAO Proposal Link */}
          {dispute.proposal && (
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/40 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-2">
                DAO Proposal Created
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-300 mb-4">
                This dispute is being reviewed by the DAO. DAO members can vote on
                the resolution.
              </p>
              <button
                onClick={() =>
                  router.push(`/dao/proposals/${dispute.proposal!.id}`)
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View DAO Proposal →
              </button>
            </div>
          )}

          {/* Non-Participant Info */}
          {!isParticipant && userAddress && (
            <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/50 rounded-lg p-6">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  <p className="font-medium">You're viewing this dispute</p>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    You're not directly involved in this dispute. Only the client
                    and freelancer can submit evidence.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Connect Wallet Prompt */}
          {!userAddress && (
            <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800/50 rounded-lg p-6">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-900 dark:text-yellow-200">
                  <p className="font-medium">Connect Your Wallet</p>
                  <p className="text-yellow-800 dark:text-yellow-300 mt-1">
                    Connect your wallet to submit evidence or take actions on this
                    dispute.
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
