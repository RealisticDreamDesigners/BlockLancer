import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { uintCV, stringUtf8CV, PostConditionMode } from '@stacks/transactions';
import { useStacks } from './useStacks';
import { useContractCall } from './useContractCall';
import { PROPOSAL_QUERY_KEYS } from './useProposals';
import { DISPUTE_QUERY_KEYS } from './useDisputes';
import {
  validateProposalDescription,
  canVoteOnProposal,
} from '@/lib/disputeUtils';
import { getNetwork } from '@/lib/networkConfig';
import {
  CreateProposalFormData,
  VoteType,
  ProposalResponse,
  VoteResponse,
  Proposal,
} from '@/types/dispute';

// DAO contract config
const network = getNetwork();
const DAO_CONTRACT = process.env.NEXT_PUBLIC_DAO_CONTRACT || 'ST30M31FNAKNX5EJKV10V7SJSE07VVDFFZHZHGE0J.blocklancer-dao-v3';
const [daoAddress, daoName] = DAO_CONTRACT.split('.');

// ===============================================
// CREATE PROPOSAL MUTATIONS
// ===============================================

/**
 * Hook for creating a dispute resolution proposal
 * Only DAO members can create proposals
 *
 * @example
 * const { mutate: createProposal, isPending } = useCreateDisputeProposal();
 *
 * createProposal({
 *   disputeId: 1,
 *   description: 'Based on the evidence, I propose we resolve in favor of the freelancer'
 * });
 */
export function useCreateDisputeProposal() {
  const queryClient = useQueryClient();
  const { userAddress, isSignedIn } = useStacks();
  const { execute } = useContractCall();

  return useMutation({
    mutationFn: async (data: CreateProposalFormData) => {
      if (!isSignedIn || !userAddress) {
        throw new Error('Please connect your wallet first');
      }

      const validation = validateProposalDescription(data.description);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      console.log('🔧 Creating dispute resolution proposal for dispute #', data.disputeId);

      const response = await execute({
        callOptions: {
          network,
          contractAddress: daoAddress,
          contractName: daoName,
          functionName: 'propose-dispute-resolution',
          functionArgs: [
            uintCV(data.disputeId),
            stringUtf8CV(data.description),
          ],
          postConditions: [],
          postConditionMode: PostConditionMode.Allow,
        },
        actionLabel: 'Create Dispute Proposal',
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to create proposal');
      }

      return response;
    },
    onSuccess: (response, variables) => {
      console.log('✅ Proposal created successfully:', response);

      // Show success toast
      toast.success('Proposal Created', {
        description: 'Your proposal has been submitted. DAO members can now vote on it.',
      });

      // Invalidate all proposal queries
      queryClient.invalidateQueries({
        queryKey: PROPOSAL_QUERY_KEYS.all,
      });

      // Also invalidate the associated dispute
      queryClient.invalidateQueries({
        queryKey: DISPUTE_QUERY_KEYS.detail(variables.disputeId),
      });
    },
    onError: (error: Error) => {
      console.error('❌ Error creating proposal:', error);

      // Parse error for user-friendly messages
      let errorMessage = error.message;

      if (error.message.includes('not-member')) {
        errorMessage = 'Only DAO members can create proposals';
      } else if (error.message.includes('insufficient-votes')) {
        errorMessage = 'Not enough DAO members to create a proposal';
      }

      toast.error('Failed to Create Proposal', {
        description: errorMessage,
      });
    },
  });
}

/**
 * Hook for creating an escrow release proposal
 * Used for direct escrow actions without disputes
 *
 * @example
 * const { mutate: createRelease, isPending } = useCreateEscrowReleaseProposal();
 *
 * createRelease({
 *   contractId: 1,
 *   description: 'Release funds to freelancer based on completed work'
 * });
 */
export function useCreateEscrowReleaseProposal() {
  const queryClient = useQueryClient();
  const { userAddress, isSignedIn } = useStacks();
  const { execute } = useContractCall();

  return useMutation({
    mutationFn: async (data: { contractId: number; description: string }) => {
      if (!isSignedIn || !userAddress) {
        throw new Error('Please connect your wallet first');
      }

      const validation = validateProposalDescription(data.description);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      console.log('🔧 Creating escrow release proposal for contract #', data.contractId);

      const response = await execute({
        callOptions: {
          network,
          contractAddress: daoAddress,
          contractName: daoName,
          functionName: 'propose-escrow-release',
          functionArgs: [
            uintCV(data.contractId),
            stringUtf8CV(data.description),
          ],
          postConditions: [],
          postConditionMode: PostConditionMode.Allow,
        },
        actionLabel: 'Create Escrow Release Proposal',
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to create proposal');
      }

      return response;
    },
    onSuccess: (response) => {
      console.log('✅ Escrow release proposal created:', response);

      toast.success('Proposal Created', {
        description: 'Your escrow release proposal has been submitted for DAO vote.',
      });

      queryClient.invalidateQueries({
        queryKey: PROPOSAL_QUERY_KEYS.all,
      });
    },
    onError: (error: Error) => {
      console.error('❌ Error creating escrow release proposal:', error);

      let errorMessage = error.message;

      if (error.message.includes('not-member')) {
        errorMessage = 'Only DAO members can create proposals';
      }

      toast.error('Failed to Create Proposal', {
        description: errorMessage,
      });
    },
  });
}

// ===============================================
// VOTING MUTATIONS
// ===============================================

/**
 * Hook for voting on a proposal
 * Handles validation, vote submission, and optimistic updates
 *
 * @example
 * const { mutate: vote, isPending } = useVoteOnProposal();
 *
 * vote({ proposalId: 1, vote: VoteType.YES });
 */
export function useVoteOnProposal() {
  const queryClient = useQueryClient();
  const { userAddress, isSignedIn } = useStacks();
  const { execute } = useContractCall();

  return useMutation({
    mutationFn: async (data: { proposalId: number; vote: VoteType }) => {
      if (!isSignedIn || !userAddress) {
        throw new Error('Please connect your wallet first');
      }

      if (![VoteType.YES, VoteType.NO, VoteType.ABSTAIN].includes(data.vote)) {
        throw new Error('Invalid vote type');
      }

      console.log('🔧 Casting vote on proposal #', data.proposalId, ':', data.vote);

      const response = await execute({
        callOptions: {
          network,
          contractAddress: daoAddress,
          contractName: daoName,
          functionName: 'vote-on-proposal',
          functionArgs: [
            uintCV(data.proposalId),
            uintCV(data.vote),
          ],
          postConditions: [],
          postConditionMode: PostConditionMode.Allow,
        },
        actionLabel: 'Vote on Proposal',
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to cast vote');
      }

      return response;
    },
    onSuccess: (response, variables) => {
      console.log('✅ Vote cast successfully:', response);

      // Show success toast with vote type
      const voteText = variables.vote === VoteType.YES ? 'Yes'
                     : variables.vote === VoteType.NO ? 'No'
                     : 'Abstain';

      toast.success('Vote Recorded', {
        description: `Your "${voteText}" vote has been recorded on the blockchain.`,
      });

      // Invalidate proposal queries to show updated vote counts
      queryClient.invalidateQueries({
        queryKey: PROPOSAL_QUERY_KEYS.detail(variables.proposalId),
      });

      queryClient.invalidateQueries({
        queryKey: PROPOSAL_QUERY_KEYS.summary(variables.proposalId),
      });

      // Invalidate user's vote
      if (userAddress) {
        queryClient.invalidateQueries({
          queryKey: PROPOSAL_QUERY_KEYS.vote(variables.proposalId, userAddress),
        });
      }

      // Invalidate all proposals list
      queryClient.invalidateQueries({
        queryKey: PROPOSAL_QUERY_KEYS.all,
      });
    },
    onError: (error: Error) => {
      console.error('❌ Error casting vote:', error);

      // Parse error for user-friendly messages
      let errorMessage = error.message;

      if (error.message.includes('not-member')) {
        errorMessage = 'Only DAO members can vote';
      } else if (error.message.includes('already-voted')) {
        errorMessage = 'You have already voted on this proposal';
      } else if (error.message.includes('voting-ended')) {
        errorMessage = 'The voting period for this proposal has ended';
      }

      toast.error('Failed to Cast Vote', {
        description: errorMessage,
      });
    },
  });
}

/**
 * Hook for voting with optimistic updates
 * Immediately shows the vote in UI before blockchain confirmation
 *
 * @example
 * const { mutate: voteOptimistic } = useVoteOnProposalOptimistic();
 */
export function useVoteOnProposalOptimistic() {
  const queryClient = useQueryClient();
  const { userAddress, isSignedIn } = useStacks();
  const { execute } = useContractCall();

  return useMutation({
    mutationFn: async (data: { proposalId: number; vote: VoteType }) => {
      if (!isSignedIn || !userAddress) {
        throw new Error('Please connect your wallet first');
      }

      if (![VoteType.YES, VoteType.NO, VoteType.ABSTAIN].includes(data.vote)) {
        throw new Error('Invalid vote type');
      }

      const response = await execute({
        callOptions: {
          network,
          contractAddress: daoAddress,
          contractName: daoName,
          functionName: 'vote-on-proposal',
          functionArgs: [
            uintCV(data.proposalId),
            uintCV(data.vote),
          ],
          postConditions: [],
          postConditionMode: PostConditionMode.Allow,
        },
        actionLabel: 'Vote on Proposal',
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to cast vote');
      }

      return response;
    },
    onMutate: async (variables) => {
      const { proposalId, vote } = variables;

      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: PROPOSAL_QUERY_KEYS.detail(proposalId),
      });

      // Snapshot the previous value
      const previousProposal = queryClient.getQueryData<Proposal>(
        PROPOSAL_QUERY_KEYS.detail(proposalId)
      );

      // Optimistically update proposal
      if (previousProposal) {
        const updatedProposal = { ...previousProposal };

        // Increment vote count
        if (vote === VoteType.YES) {
          updatedProposal.yesVotes += 1;
        } else if (vote === VoteType.NO) {
          updatedProposal.noVotes += 1;
        } else {
          updatedProposal.abstainVotes += 1;
        }

        queryClient.setQueryData(
          PROPOSAL_QUERY_KEYS.detail(proposalId),
          updatedProposal
        );
      }

      // Optimistically add user's vote
      if (userAddress) {
        queryClient.setQueryData(
          PROPOSAL_QUERY_KEYS.vote(proposalId, userAddress),
          {
            proposalId,
            voter: userAddress,
            vote,
            timestamp: Date.now(),
          }
        );
      }

      return { previousProposal };
    },
    onSuccess: (response, variables) => {
      const voteText = variables.vote === VoteType.YES ? 'Yes'
                     : variables.vote === VoteType.NO ? 'No'
                     : 'Abstain';

      toast.success('Vote Recorded', {
        description: `Your "${voteText}" vote has been recorded on the blockchain.`,
      });

      queryClient.invalidateQueries({
        queryKey: PROPOSAL_QUERY_KEYS.all,
      });
    },
    onError: (err, variables, context: any) => {
      // Rollback on error
      if (context?.previousProposal) {
        queryClient.setQueryData(
          PROPOSAL_QUERY_KEYS.detail(variables.proposalId),
          context.previousProposal
        );
      }

      if (userAddress) {
        queryClient.removeQueries({
          queryKey: PROPOSAL_QUERY_KEYS.vote(variables.proposalId, userAddress),
        });
      }

      toast.error('Failed to Cast Vote', {
        description: err.message || 'An unexpected error occurred.',
      });
    },
    onSettled: (data, error, variables) => {
      if (variables) {
        // Always refetch after error or success
        queryClient.invalidateQueries({
          queryKey: PROPOSAL_QUERY_KEYS.detail(variables.proposalId),
        });

        if (userAddress) {
          queryClient.invalidateQueries({
            queryKey: PROPOSAL_QUERY_KEYS.vote(variables.proposalId, userAddress),
          });
        }
      }
    },
  });
}

// ===============================================
// FINALIZE PROPOSAL MUTATION
// ===============================================

/**
 * Hook for manually finalizing a proposal after voting period ends
 * Anyone can call this after the voting period expires
 *
 * @example
 * const { mutate: finalize, isPending } = useFinalizeProposal();
 *
 * finalize({ proposalId: 1 });
 */
export function useFinalizeProposal() {
  const queryClient = useQueryClient();
  const { userAddress, isSignedIn } = useStacks();
  const { execute } = useContractCall();

  return useMutation({
    mutationFn: async (data: { proposalId: number }) => {
      if (!isSignedIn || !userAddress) {
        throw new Error('Please connect your wallet first');
      }

      console.log('🔧 Finalizing proposal #', data.proposalId);

      const response = await execute({
        callOptions: {
          network,
          contractAddress: daoAddress,
          contractName: daoName,
          functionName: 'finalize-proposal-manual',
          functionArgs: [uintCV(data.proposalId)],
          postConditions: [],
          postConditionMode: PostConditionMode.Allow,
        },
        actionLabel: 'Finalize Proposal',
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to finalize proposal');
      }

      return response;
    },
    onSuccess: (response, variables) => {
      console.log('✅ Proposal finalized successfully:', response);

      toast.success('Proposal Finalized', {
        description: 'The proposal has been finalized based on the voting results.',
      });

      // Invalidate proposal to show updated status
      queryClient.invalidateQueries({
        queryKey: PROPOSAL_QUERY_KEYS.detail(variables.proposalId),
      });

      queryClient.invalidateQueries({
        queryKey: PROPOSAL_QUERY_KEYS.all,
      });
    },
    onError: (error: Error) => {
      console.error('❌ Error finalizing proposal:', error);

      let errorMessage = error.message;

      if (error.message.includes('voting-ended')) {
        errorMessage = 'Voting period has not ended yet';
      } else if (error.message.includes('already-executed')) {
        errorMessage = 'This proposal has already been finalized';
      }

      toast.error('Failed to Finalize Proposal', {
        description: errorMessage,
      });
    },
  });
}

// ===============================================
// COMBINED ACTIONS HOOK
// ===============================================

/**
 * Combined hook that provides all voting actions
 * Convenient single import for components that need multiple actions
 *
 * @example
 * const votingActions = useVotingActions();
 *
 * votingActions.createDisputeProposal({ ... });
 * votingActions.vote({ ... });
 * votingActions.finalize({ ... });
 */
export function useVotingActions() {
  const createDisputeProposal = useCreateDisputeProposal();
  const createEscrowRelease = useCreateEscrowReleaseProposal();
  const vote = useVoteOnProposal();
  const finalize = useFinalizeProposal();

  return {
    // Create proposals
    createDisputeProposal: createDisputeProposal.mutate,
    createDisputeProposalAsync: createDisputeProposal.mutateAsync,
    isCreatingDisputeProposal: createDisputeProposal.isPending,

    createEscrowReleaseProposal: createEscrowRelease.mutate,
    createEscrowReleaseProposalAsync: createEscrowRelease.mutateAsync,
    isCreatingEscrowRelease: createEscrowRelease.isPending,

    // Voting
    vote: vote.mutate,
    voteAsync: vote.mutateAsync,
    isVoting: vote.isPending,

    // Finalize
    finalizeProposal: finalize.mutate,
    finalizeProposalAsync: finalize.mutateAsync,
    isFinalizing: finalize.isPending,

    // Overall loading state
    isProcessing:
      createDisputeProposal.isPending ||
      createEscrowRelease.isPending ||
      vote.isPending ||
      finalize.isPending,
  };
}

// ===============================================
// HELPER HOOKS
// ===============================================

/**
 * Hook to check if user can vote on a specific proposal
 * Combines proposal data, DAO membership, and voting status
 *
 * @param proposal - The proposal to check
 * @param isDAOMember - Whether user is a DAO member
 * @param hasVoted - Whether user has already voted
 *
 * @example
 * const canVote = useCanVote(proposal, isDAOMember, hasVoted);
 */
export function useCanVote(
  proposal: Proposal | null | undefined,
  isDAOMember: boolean,
  hasVoted: boolean
): boolean {
  if (!proposal) return false;

  return canVoteOnProposal(proposal, isDAOMember, hasVoted);
}

// ===============================================
// EXPORT ALL
// ===============================================

export default {
  useCreateDisputeProposal,
  useCreateEscrowReleaseProposal,
  useVoteOnProposal,
  useVoteOnProposalOptimistic,
  useFinalizeProposal,
  useVotingActions,
  useCanVote,
};
