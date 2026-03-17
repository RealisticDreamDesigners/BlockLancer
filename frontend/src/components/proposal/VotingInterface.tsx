'use client';

import React, { useState } from 'react';
import { useVoteOnProposal } from '@/hooks/useVoting';
import { Proposal, ProposalStatus, VoteType } from '@/types/dispute';
import { cn } from '@/lib/utils';
import {
  ThumbsUp,
  ThumbsDown,
  Minus,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Info,
} from 'lucide-react';

// ===============================================
// TYPES
// ===============================================

export interface VotingInterfaceProps {
  /**
   * The proposal to vote on
   */
  proposal: Proposal;

  /**
   * Whether user is a DAO member
   */
  isDAOMember: boolean;

  /**
   * Whether user has already voted
   */
  hasVoted: boolean;

  /**
   * User's existing vote (if any)
   */
  userVote?: VoteType;

  /**
   * Callback after successful vote
   */
  onSuccess?: () => void;

  /**
   * Additional CSS classes
   */
  className?: string;
}

// ===============================================
// VOTE BUTTON COMPONENT
// ===============================================

interface VoteButtonProps {
  voteType: VoteType;
  icon: React.ReactNode;
  label: string;
  description: string;
  color: string;
  isSelected: boolean;
  isDisabled: boolean;
  onClick: () => void;
}

function VoteButton({
  voteType,
  icon,
  label,
  description,
  color,
  isSelected,
  isDisabled,
  onClick,
}: VoteButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        'flex-1 p-4 rounded-lg border-2 transition-all',
        'hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed',
        isSelected
          ? `${color} border-current`
          : 'bg-white dark:bg-gray-800/50 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
      )}
    >
      <div className="flex flex-col items-center gap-2">
        <div className={cn('text-2xl', isSelected ? 'text-white' : 'text-gray-600 dark:text-gray-400')}>
          {icon}
        </div>
        <div className={cn('font-semibold', isSelected ? 'text-white' : 'text-gray-900 dark:text-white')}>
          {label}
        </div>
        <div className={cn('text-xs', isSelected ? 'text-white/90' : 'text-gray-600 dark:text-gray-400')}>
          {description}
        </div>
      </div>
    </button>
  );
}

// ===============================================
// MAIN COMPONENT
// ===============================================

/**
 * VotingInterface Component
 *
 * Interface for DAO members to cast votes on proposals.
 * Shows Yes/No/Abstain options with confirmation.
 *
 * @example
 * ```tsx
 * <VotingInterface
 *   proposal={proposal}
 *   isDAOMember={isMember}
 *   hasVoted={hasVoted}
 *   userVote={userVote}
 *   onSuccess={() => refetchProposal()}
 * />
 * ```
 */
export function VotingInterface({
  proposal,
  isDAOMember,
  hasVoted,
  userVote,
  onSuccess,
  className,
}: VotingInterfaceProps) {
  const [selectedVote, setSelectedVote] = useState<VoteType | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const { mutate: vote, isPending, isSuccess } = useVoteOnProposal();

  const isActive = proposal.status === ProposalStatus.ACTIVE;
  const canVote = isDAOMember && !hasVoted && isActive;

  // Handle vote selection
  const handleVoteSelect = (voteType: VoteType) => {
    if (!canVote || isPending) return;
    setSelectedVote(voteType);
    setShowConfirmation(true);
  };

  // Handle vote confirmation
  const handleConfirmVote = () => {
    if (!selectedVote || isPending) return;

    vote(
      {
        proposalId: proposal.id,
        vote: selectedVote,
      },
      {
        onSuccess: () => {
          onSuccess?.();
          setTimeout(() => {
            setShowConfirmation(false);
            setSelectedVote(null);
          }, 2000);
        },
      }
    );
  };

  // Handle cancel
  const handleCancel = () => {
    if (!isPending) {
      setShowConfirmation(false);
      setSelectedVote(null);
    }
  };

  // If user already voted
  if (hasVoted && userVote) {
    return (
      <div className={cn('bg-white dark:bg-gray-800/50 rounded-lg border dark:border-gray-700/50 p-6', className)}>
        <div className="flex items-center gap-3 text-blue-800 dark:text-blue-300">
          <CheckCircle className="h-6 w-6 flex-shrink-0" />
          <div>
            <p className="font-semibold">You've already voted</p>
            <p className="text-sm mt-1">
              Your vote: <span className="font-medium">
                {userVote === VoteType.YES ? 'Yes' : userVote === VoteType.NO ? 'No' : 'Abstain'}
              </span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If not a DAO member
  if (!isDAOMember) {
    return (
      <div className={cn('bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 p-6', className)}>
        <div className="flex items-center gap-3 text-yellow-800 dark:text-yellow-300">
          <AlertTriangle className="h-6 w-6 flex-shrink-0" />
          <div>
            <p className="font-semibold">DAO Membership Required</p>
            <p className="text-sm mt-1">
              Only DAO members can vote on proposals.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If proposal is not active
  if (!isActive) {
    return (
      <div className={cn('bg-gray-50 dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-700/50 p-6', className)}>
        <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
          <Info className="h-6 w-6 flex-shrink-0" />
          <div>
            <p className="font-semibold">Voting Closed</p>
            <p className="text-sm mt-1">
              This proposal is no longer accepting votes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Voting interface
  return (
    <div className={cn('bg-white dark:bg-gray-800/50 rounded-lg border dark:border-gray-700/50 p-6 space-y-6', className)}>
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Cast Your Vote</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          As a DAO member, your vote helps determine the outcome of this proposal.
          Choose your position carefully.
        </p>
      </div>

      {/* Vote Options */}
      {!showConfirmation ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <VoteButton
            voteType={VoteType.YES}
            icon={<ThumbsUp className="h-8 w-8" />}
            label="Vote Yes"
            description="I support this proposal"
            color="bg-green-600"
            isSelected={selectedVote === VoteType.YES}
            isDisabled={isPending}
            onClick={() => handleVoteSelect(VoteType.YES)}
          />

          <VoteButton
            voteType={VoteType.NO}
            icon={<ThumbsDown className="h-8 w-8" />}
            label="Vote No"
            description="I oppose this proposal"
            color="bg-red-600"
            isSelected={selectedVote === VoteType.NO}
            isDisabled={isPending}
            onClick={() => handleVoteSelect(VoteType.NO)}
          />

          <VoteButton
            voteType={VoteType.ABSTAIN}
            icon={<Minus className="h-8 w-8" />}
            label="Abstain"
            description="I have no strong opinion"
            color="bg-gray-600"
            isSelected={selectedVote === VoteType.ABSTAIN}
            isDisabled={isPending}
            onClick={() => handleVoteSelect(VoteType.ABSTAIN)}
          />
        </div>
      ) : (
        /* Confirmation */
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/40 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
              Confirm your vote:
            </p>
            <p className="text-lg font-bold text-blue-900 dark:text-blue-200">
              {selectedVote === VoteType.YES && 'Yes - I support this proposal'}
              {selectedVote === VoteType.NO && 'No - I oppose this proposal'}
              {selectedVote === VoteType.ABSTAIN && '− Abstain - No strong opinion'}
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/40 rounded-lg p-4">
            <div className="flex gap-2">
              <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-200">
                <p className="font-medium">Important:</p>
                <p className="text-blue-800 dark:text-blue-300 mt-1">
                  Once cast, your vote cannot be changed. Make sure you've reviewed
                  all evidence before voting.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              disabled={isPending || isSuccess}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmVote}
              disabled={isPending || isSuccess}
              className={cn(
                'flex-1 px-4 py-2 rounded-lg font-medium transition-all',
                'flex items-center justify-center gap-2',
                isSuccess
                  ? 'bg-green-600 text-white'
                  : 'bg-blue-600 text-white hover:bg-blue-700',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Casting Vote...
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Vote Cast!
                </>
              ) : (
                'Confirm Vote'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-gray-50 dark:bg-gray-950 rounded-lg p-4">
        <div className="flex gap-2">
          <Info className="h-4 w-4 text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-gray-700 dark:text-gray-300">
            <p className="font-medium mb-1">Voting Rules:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Each DAO member gets one vote per proposal</li>
              <li>Proposals need 70% Yes votes (supermajority) to pass</li>
              <li>Votes are final and cannot be changed</li>
              <li>Voting period: 1440 blocks (~10 days)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===============================================
// EXPORT
// ===============================================

export default VotingInterface;
