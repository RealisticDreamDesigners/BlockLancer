'use client';

import React, { useState } from 'react';
import { uintCV, PostConditionMode } from '@stacks/transactions';
import { Proposal, VoteType, ProposalStatus } from '@/types/dispute';
import { useContractCall } from '@/hooks/useContractCall';
import { getNetwork } from '@/lib/networkConfig';
import { cn } from '@/lib/utils';
import {
  ThumbsUp,
  ThumbsDown,
  MinusCircle,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';

const network = getNetwork();
const DAO_CONTRACT = process.env.NEXT_PUBLIC_DAO_CONTRACT || 'ST30M31FNAKNX5EJKV10V7SJSE07VVDFFZHZHGE0J.blocklancer-dao-v3';
const [daoAddress, daoName] = DAO_CONTRACT.split('.');

// ===============================================
// TYPES
// ===============================================

export interface ProposalCardProps {
  /**
   * The proposal to display
   */
  proposal: Proposal;

  /**
   * Whether the current user has voted on this proposal
   */
  hasVoted: boolean;

  /**
   * The current user's vote (if they voted)
   */
  userVote?: VoteType;

  /**
   * Whether the current user is a DAO member
   */
  isDAOMember: boolean;

  /**
   * Callback when vote is successfully cast
   */
  onVoteSuccess?: () => void;
}

// ===============================================
// COMPONENT
// ===============================================

/**
 * ProposalCard Component
 *
 * Displays a proposal with voting options for DAO members.
 */
export function ProposalCard({
  proposal,
  hasVoted,
  userVote,
  isDAOMember,
  onVoteSuccess,
}: ProposalCardProps) {
  const [isVoting, setIsVoting] = useState(false);
  const [votingFor, setVotingFor] = useState<VoteType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { execute } = useContractCall();

  // Calculate voting percentages
  const totalVotes = proposal.yesVotes + proposal.noVotes + proposal.abstainVotes;
  const yesPercent = totalVotes > 0 ? (proposal.yesVotes / totalVotes) * 100 : 0;
  const noPercent = totalVotes > 0 ? (proposal.noVotes / totalVotes) * 100 : 0;
  const abstainPercent = totalVotes > 0 ? (proposal.abstainVotes / totalVotes) * 100 : 0;

  // Check if voting is still active
  const isActive = proposal.status === ProposalStatus.ACTIVE;
  const canVote = isDAOMember && isActive && !hasVoted;

  const handleVote = async (vote: VoteType) => {
    setError(null);
    setSuccess(false);
    setIsVoting(true);
    setVotingFor(vote);

    try {
      const result = await execute({
        callOptions: {
          network,
          contractAddress: daoAddress,
          contractName: daoName,
          functionName: 'vote-on-proposal',
          functionArgs: [
            uintCV(proposal.id),
            uintCV(vote),
          ],
          postConditions: [],
          postConditionMode: PostConditionMode.Allow,
        },
        actionLabel: 'Vote on Proposal',
      });

      if (result.success) {
        setSuccess(true);
        if (onVoteSuccess) {
          onVoteSuccess();
        }
      } else {
        setError(result.error || 'Failed to cast vote');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsVoting(false);
      setVotingFor(null);
    }
  };

  // Get status badge
  const getStatusBadge = () => {
    switch (proposal.status) {
      case ProposalStatus.ACTIVE:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            <Clock className="h-3 w-3" />
            Active
          </span>
        );
      case ProposalStatus.PASSED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            <CheckCircle2 className="h-3 w-3" />
            Passed
          </span>
        );
      case ProposalStatus.FAILED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
            <XCircle className="h-3 w-3" />
            Failed
          </span>
        );
      case ProposalStatus.EXECUTED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
            <CheckCircle2 className="h-3 w-3" />
            Executed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-bold text-gray-900">
              Proposal #{proposal.id}
            </h3>
            {getStatusBadge()}
          </div>
          <p className="text-sm text-gray-600">
            For Dispute #{proposal.targetContractId}
          </p>
        </div>
      </div>

      {/* Description */}
      <div className="mb-6">
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{proposal.description}</p>
      </div>

      {/* Voting Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Voting Progress</span>
          <span className="text-sm text-gray-600">
            {totalVotes} / {proposal.totalEligibleVoters} votes
          </span>
        </div>

        {/* Progress Bars */}
        <div className="space-y-2">
          {/* Yes Votes */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600 flex items-center gap-1">
                <ThumbsUp className="h-3 w-3" />
                Yes
              </span>
              <span className="text-xs font-medium text-gray-900">
                {proposal.yesVotes} ({yesPercent.toFixed(0)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${yesPercent}%` }}
              />
            </div>
          </div>

          {/* No Votes */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600 flex items-center gap-1">
                <ThumbsDown className="h-3 w-3" />
                No
              </span>
              <span className="text-xs font-medium text-gray-900">
                {proposal.noVotes} ({noPercent.toFixed(0)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-red-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${noPercent}%` }}
              />
            </div>
          </div>

          {/* Abstain Votes */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600 flex items-center gap-1">
                <MinusCircle className="h-3 w-3" />
                Abstain
              </span>
              <span className="text-xs font-medium text-gray-900">
                {proposal.abstainVotes} ({abstainPercent.toFixed(0)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gray-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${abstainPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Threshold Indicator */}
        {proposal.hasReachedThreshold && (
          <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-green-800">
              This proposal has reached the 70% supermajority threshold
            </p>
          </div>
        )}
      </div>

      {/* Voting Actions */}
      {canVote && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Cast Your Vote</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleVote(VoteType.YES)}
              disabled={isVoting}
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2',
                isVoting && votingFor === VoteType.YES
                  ? 'bg-green-600 text-white'
                  : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
              )}
            >
              {isVoting && votingFor === VoteType.YES ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ThumbsUp className="h-4 w-4" />
              )}
              Yes
            </button>

            <button
              onClick={() => handleVote(VoteType.NO)}
              disabled={isVoting}
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2',
                isVoting && votingFor === VoteType.NO
                  ? 'bg-red-600 text-white'
                  : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
              )}
            >
              {isVoting && votingFor === VoteType.NO ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ThumbsDown className="h-4 w-4" />
              )}
              No
            </button>

            <button
              onClick={() => handleVote(VoteType.ABSTAIN)}
              disabled={isVoting}
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2',
                isVoting && votingFor === VoteType.ABSTAIN
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
              )}
            >
              {isVoting && votingFor === VoteType.ABSTAIN ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MinusCircle className="h-4 w-4" />
              )}
              Abstain
            </button>
          </div>
        </div>
      )}

      {/* Already Voted */}
      {hasVoted && userVote && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <p className="text-sm text-blue-800">
            You voted:{' '}
            <span className="font-semibold">
              {userVote === VoteType.YES ? 'Yes' : userVote === VoteType.NO ? 'No' : 'Abstain'}
            </span>
          </p>
        </div>
      )}

      {/* Not a DAO Member */}
      {!isDAOMember && isActive && (
        <div className="mb-4 bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-600 flex-shrink-0" />
          <p className="text-sm text-gray-700">
            Only DAO members can vote on proposals
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-800">Vote cast successfully!</p>
        </div>
      )}

      {/* Footer */}
      <div className="pt-4 border-t border-gray-200 text-xs text-gray-600">
        <p>Proposed by: {proposal.proposer}</p>
      </div>
    </div>
  );
}

export default ProposalCard;
