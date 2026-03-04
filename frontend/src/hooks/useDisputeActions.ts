import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useStacks } from './useStacks';
import { DISPUTE_QUERY_KEYS } from './useDisputes';
import {
  openDispute,
  submitEvidence,
  withdrawDispute,
} from '@/lib/disputeContract';
import {
  validateDisputeReason,
  validateEvidence,
} from '@/lib/disputeUtils';
import {
  OpenDisputeFormData,
  SubmitEvidenceFormData,
  DisputeResponse,
} from '@/types/dispute';

// ===============================================
// OPEN DISPUTE MUTATION
// ===============================================

/**
 * Hook for opening a new dispute
 * Handles validation, transaction, and cache invalidation
 *
 * @example
 * const { mutate: createDispute, isPending } = useOpenDispute();
 *
 * createDispute({
 *   contractId: 1,
 *   clientAddress: '...',
 *   freelancerAddress: '...',
 *   reason: 'Work was not completed as agreed'
 * });
 */
export function useOpenDispute() {
  const queryClient = useQueryClient();
  const { userAddress, isSignedIn } = useStacks();

  return useMutation({
    mutationFn: async (data: {
      contractId: number;
      clientAddress: string;
      freelancerAddress: string;
      reason: string;
    }) => {
      // Pre-flight checks
      if (!isSignedIn || !userAddress) {
        throw new Error('Please connect your wallet first');
      }

      // Validate reason
      const validation = validateDisputeReason(data.reason);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Check user is a participant
      if (userAddress !== data.clientAddress && userAddress !== data.freelancerAddress) {
        throw new Error('You must be either the client or freelancer to open a dispute');
      }

      console.log('🔧 Opening dispute for contract #', data.contractId);

      // Call contract function
      const response = await openDispute(
        data.contractId,
        data.clientAddress,
        data.freelancerAddress,
        data.reason
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to open dispute');
      }

      return response;
    },
    onSuccess: (response, variables) => {
      console.log('✅ Dispute opened successfully:', response);

      // Show success toast
      toast.success('Dispute Opened', {
        description: 'Your dispute has been created successfully. The other party has been notified.',
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: DISPUTE_QUERY_KEYS.all,
      });

      // Invalidate contract-specific queries
      queryClient.invalidateQueries({
        queryKey: DISPUTE_QUERY_KEYS.contractDispute(variables.contractId),
      });

      // Also invalidate contract data in useStacks
      if (userAddress) {
        queryClient.invalidateQueries({
          queryKey: ['contracts', userAddress],
        });
      }
    },
    onError: (error: Error) => {
      console.error('❌ Error opening dispute:', error);

      // Show error toast
      toast.error('Failed to Open Dispute', {
        description: error.message || 'An unexpected error occurred. Please try again.',
      });
    },
  });
}

// ===============================================
// SUBMIT EVIDENCE MUTATION
// ===============================================

/**
 * Hook for submitting evidence to an existing dispute
 * Automatically validates evidence length and user permissions
 *
 * @example
 * const { mutate: submitEv, isPending } = useSubmitEvidence();
 *
 * submitEv({
 *   disputeId: 1,
 *   evidence: 'Here is proof that the work was completed...'
 * });
 */
export function useSubmitEvidence() {
  const queryClient = useQueryClient();
  const { userAddress, isSignedIn } = useStacks();

  return useMutation({
    mutationFn: async (data: SubmitEvidenceFormData) => {
      // Pre-flight checks
      if (!isSignedIn || !userAddress) {
        throw new Error('Please connect your wallet first');
      }

      // Validate evidence
      const validation = validateEvidence(data.evidence);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      console.log('🔧 Submitting evidence for dispute #', data.disputeId);

      // Call contract function
      const response = await submitEvidence(data.disputeId, data.evidence);

      if (!response.success) {
        throw new Error(response.error || 'Failed to submit evidence');
      }

      return response;
    },
    onSuccess: (response, variables) => {
      console.log('✅ Evidence submitted successfully:', response);

      // Show success toast
      toast.success('Evidence Submitted', {
        description: 'Your evidence has been recorded on the blockchain.',
      });

      // Invalidate dispute queries
      queryClient.invalidateQueries({
        queryKey: DISPUTE_QUERY_KEYS.detail(variables.disputeId),
      });

      queryClient.invalidateQueries({
        queryKey: DISPUTE_QUERY_KEYS.all,
      });
    },
    onError: (error: Error) => {
      console.error('❌ Error submitting evidence:', error);

      // Parse error for user-friendly messages
      let errorMessage = error.message;

      if (error.message.includes('not-authorized')) {
        errorMessage = 'You are not authorized to submit evidence for this dispute';
      } else if (error.message.includes('already-submitted') || error.message.includes('invalid-state')) {
        errorMessage = 'You have already submitted evidence for this dispute';
      }

      toast.error('Failed to Submit Evidence', {
        description: errorMessage,
      });
    },
  });
}

// ===============================================
// WITHDRAW DISPUTE MUTATION
// ===============================================

/**
 * Hook for withdrawing a dispute (only opener can do this)
 * Dispute must still be in OPEN status
 *
 * @example
 * const { mutate: withdraw, isPending } = useWithdrawDispute();
 *
 * withdraw({ disputeId: 1 });
 */
export function useWithdrawDispute() {
  const queryClient = useQueryClient();
  const { userAddress, isSignedIn } = useStacks();

  return useMutation({
    mutationFn: async (data: { disputeId: number }) => {
      // Pre-flight checks
      if (!isSignedIn || !userAddress) {
        throw new Error('Please connect your wallet first');
      }

      console.log('🔧 Withdrawing dispute #', data.disputeId);

      // Call contract function
      const response = await withdrawDispute(data.disputeId);

      if (!response.success) {
        throw new Error(response.error || 'Failed to withdraw dispute');
      }

      return response;
    },
    onSuccess: (response, variables) => {
      console.log('✅ Dispute withdrawn successfully:', response);

      // Show success toast
      toast.success('Dispute Withdrawn', {
        description: 'The dispute has been withdrawn. The contract can now proceed normally.',
      });

      // Invalidate dispute queries
      queryClient.invalidateQueries({
        queryKey: DISPUTE_QUERY_KEYS.detail(variables.disputeId),
      });

      queryClient.invalidateQueries({
        queryKey: DISPUTE_QUERY_KEYS.all,
      });

      // Also invalidate contract data
      if (userAddress) {
        queryClient.invalidateQueries({
          queryKey: ['contracts', userAddress],
        });
      }
    },
    onError: (error: Error) => {
      console.error('❌ Error withdrawing dispute:', error);

      // Parse error for user-friendly messages
      let errorMessage = error.message;

      if (error.message.includes('not-authorized')) {
        errorMessage = 'Only the person who opened the dispute can withdraw it';
      } else if (error.message.includes('invalid-state')) {
        errorMessage = 'This dispute cannot be withdrawn (it may already be resolved)';
      }

      toast.error('Failed to Withdraw Dispute', {
        description: errorMessage,
      });
    },
  });
}

// ===============================================
// COMBINED ACTIONS HOOK
// ===============================================

/**
 * Combined hook that provides all dispute actions
 * Convenient single import for components that need multiple actions
 *
 * @example
 * const disputeActions = useDisputeActions();
 *
 * disputeActions.openDispute({ ... });
 * disputeActions.submitEvidence({ ... });
 * disputeActions.withdrawDispute({ ... });
 */
export function useDisputeActions() {
  const openDisputeMutation = useOpenDispute();
  const submitEvidenceMutation = useSubmitEvidence();
  const withdrawDisputeMutation = useWithdrawDispute();

  return {
    // Open dispute
    openDispute: openDisputeMutation.mutate,
    openDisputeAsync: openDisputeMutation.mutateAsync,
    isOpeningDispute: openDisputeMutation.isPending,

    // Submit evidence
    submitEvidence: submitEvidenceMutation.mutate,
    submitEvidenceAsync: submitEvidenceMutation.mutateAsync,
    isSubmittingEvidence: submitEvidenceMutation.isPending,

    // Withdraw dispute
    withdrawDispute: withdrawDisputeMutation.mutate,
    withdrawDisputeAsync: withdrawDisputeMutation.mutateAsync,
    isWithdrawingDispute: withdrawDisputeMutation.isPending,

    // Overall loading state
    isProcessing:
      openDisputeMutation.isPending ||
      submitEvidenceMutation.isPending ||
      withdrawDisputeMutation.isPending,
  };
}

// ===============================================
// OPTIMISTIC UPDATE HELPERS
// ===============================================

/**
 * Hook for opening dispute with optimistic updates
 * Immediately updates UI before blockchain confirmation
 *
 * @example
 * const { mutate: createDisputeOptimistic } = useOpenDisputeOptimistic();
 */
export function useOpenDisputeOptimistic() {
  const queryClient = useQueryClient();
  const { userAddress, isSignedIn } = useStacks();

  return useMutation({
    mutationFn: async (data: {
      contractId: number;
      clientAddress: string;
      freelancerAddress: string;
      reason: string;
    }) => {
      if (!isSignedIn || !userAddress) {
        throw new Error('Please connect your wallet first');
      }

      const validation = validateDisputeReason(data.reason);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      if (userAddress !== data.clientAddress && userAddress !== data.freelancerAddress) {
        throw new Error('You must be either the client or freelancer to open a dispute');
      }

      const response = await openDispute(
        data.contractId,
        data.clientAddress,
        data.freelancerAddress,
        data.reason
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to open dispute');
      }

      return response;
    },
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: DISPUTE_QUERY_KEYS.contractDispute(variables.contractId),
      });

      // Snapshot the previous value
      const previousDispute = queryClient.getQueryData(
        DISPUTE_QUERY_KEYS.contractDispute(variables.contractId)
      );

      // Optimistically create a new dispute object
      const optimisticDispute = {
        id: Date.now(), // Temporary ID
        contractId: variables.contractId,
        openedBy: userAddress || '',
        client: variables.clientAddress,
        freelancer: variables.freelancerAddress,
        reason: variables.reason,
        status: 0, // OPEN
        resolution: 0, // PENDING
        createdAt: Date.now(),
        clientEvidence: undefined,
        freelancerEvidence: undefined,
      };

      // Optimistically update cache
      queryClient.setQueryData(
        DISPUTE_QUERY_KEYS.contractDispute(variables.contractId),
        optimisticDispute
      );

      // Return context with previous value
      return { previousDispute };
    },
    onSuccess: (response) => {
      toast.success('Dispute Opened', {
        description: 'Your dispute has been created successfully.',
      });

      queryClient.invalidateQueries({
        queryKey: DISPUTE_QUERY_KEYS.all,
      });
    },
    onError: (err, variables, context: any) => {
      // Rollback on error
      if (context?.previousDispute) {
        queryClient.setQueryData(
          DISPUTE_QUERY_KEYS.contractDispute(variables.contractId),
          context.previousDispute
        );
      }

      toast.error('Failed to Open Dispute', {
        description: err.message || 'An unexpected error occurred.',
      });
    },
    onSettled: (data, error, variables) => {
      // Always refetch after error or success
      if (variables) {
        queryClient.invalidateQueries({
          queryKey: DISPUTE_QUERY_KEYS.contractDispute(variables.contractId),
        });
      }
    },
  });
}

// ===============================================
// EXPORT ALL
// ===============================================

export default {
  useOpenDispute,
  useSubmitEvidence,
  useWithdrawDispute,
  useDisputeActions,
  useOpenDisputeOptimistic,
};
