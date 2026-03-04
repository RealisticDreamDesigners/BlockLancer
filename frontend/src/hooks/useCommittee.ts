import { useState, useCallback } from 'react';
import {
  fetchCallReadOnlyFunction,
  cvToJSON,
  principalCV,
  trueCV,
  falseCV,
  uintCV,
  PostConditionMode,
} from '@stacks/transactions';
import { getNetwork, getDeployerAddress } from '@/lib/networkConfig';
import {
  getCommitteeStatusFromBackend,
  getMembershipProposalFromBackend,
  getPendingMembershipProposalsFromBackend,
} from '@/lib/apiClient';
import { useContractCall } from './useContractCall';

// ===============================================
// CONFIGURATION
// ===============================================

const network = getNetwork();

const CONTRACTS = {
  MEMBERSHIP: process.env.NEXT_PUBLIC_MEMBERSHIP_CONTRACT ||
    `${getDeployerAddress()}.blocklancer-membership`,
  DEPLOYER: getDeployerAddress(),
};

const parseContractId = (contractId: string) => {
  const [address, name] = contractId.split('.');
  return { address, name };
};

const membershipContract = parseContractId(CONTRACTS.MEMBERSHIP);

// ===============================================
// TYPES
// ===============================================

export interface CommitteeMemberStatus {
  isMember: boolean;
  committeeCount: number;
}

export interface CommitteeResponse {
  success: boolean;
  txId?: string;
  error?: string;
}

export interface MembershipProposal {
  id: number;
  nominee: string;
  proposer: string;
  stakeAmount: number;
  approvals: number;
  rejections: number;
  status: number; // 0 = pending, 1 = approved, 2 = rejected
  createdAt: number;
  decidedAt?: number;
}

// ===============================================
// HOOK
// ===============================================

export function useCommittee(userAddress?: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { execute } = useContractCall();

  // Check if user is the deployer/admin
  const isAdmin = userAddress === CONTRACTS.DEPLOYER;

  /**
   * Check if an address is a committee member
   */
  const checkCommitteeMember = useCallback(async (memberAddress: string): Promise<CommitteeMemberStatus> => {
    // Try backend first
    try {
      const backendStatus = await getCommitteeStatusFromBackend(memberAddress);
      if (backendStatus) {
        console.log(`✅ Got committee status from backend for ${memberAddress}`);
        return {
          isMember: backendStatus.isMember,
          committeeCount: backendStatus.committeeCount,
        };
      }
    } catch (e) {
      console.warn('Backend unavailable for committee status, falling back to Hiro');
    }

    // Fallback: existing Hiro API code
    try {
      console.log(`🔍 Checking committee status for ${memberAddress} (Hiro fallback)...`);

      const result = await fetchCallReadOnlyFunction({
        network,
        contractAddress: membershipContract.address,
        contractName: membershipContract.name,
        functionName: 'get-committee-member-status',
        functionArgs: [principalCV(memberAddress)],
        senderAddress: userAddress || membershipContract.address,
      });

      const data = cvToJSON(result);
      console.log('📊 Committee status:', data);

      return {
        isMember: data.value['is-member']?.value || false,
        committeeCount: parseInt(data.value['committee-count']?.value || '0'),
      };
    } catch (err) {
      console.error('❌ Error checking committee member:', err);
      return {
        isMember: false,
        committeeCount: 0,
      };
    }
  }, [userAddress]);

  /**
   * Add a committee member (admin only)
   */
  const addCommitteeMember = useCallback(async (memberAddress: string): Promise<CommitteeResponse> => {
    if (!userAddress) {
      return { success: false, error: 'Please connect your wallet' };
    }

    if (!isAdmin) {
      return { success: false, error: 'Only the deployer can add committee members' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await execute({
        callOptions: {
          network,
          contractAddress: membershipContract.address,
          contractName: membershipContract.name,
          functionName: 'set-committee-member',
          functionArgs: [
            principalCV(memberAddress),
            trueCV(),
          ],
          postConditions: [],
          postConditionMode: PostConditionMode.Allow,
        },
        actionLabel: 'Add Committee Member',
      });

      setIsLoading(false);
      if (!result.success && result.error) setError(result.error);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setIsLoading(false);
      setError(errorMessage);
      return { success: false, error: `Failed to add committee member: ${errorMessage}` };
    }
  }, [userAddress, isAdmin, execute]);

  /**
   * Remove a committee member (admin only)
   */
  const removeCommitteeMember = useCallback(async (memberAddress: string): Promise<CommitteeResponse> => {
    if (!userAddress) {
      return { success: false, error: 'Please connect your wallet' };
    }

    if (!isAdmin) {
      return { success: false, error: 'Only the deployer can remove committee members' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await execute({
        callOptions: {
          network,
          contractAddress: membershipContract.address,
          contractName: membershipContract.name,
          functionName: 'set-committee-member',
          functionArgs: [
            principalCV(memberAddress),
            falseCV(),
          ],
          postConditions: [],
          postConditionMode: PostConditionMode.Allow,
        },
        actionLabel: 'Remove Committee Member',
      });

      setIsLoading(false);
      if (!result.success && result.error) setError(result.error);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setIsLoading(false);
      setError(errorMessage);
      return { success: false, error: `Failed to remove committee member: ${errorMessage}` };
    }
  }, [userAddress, isAdmin, execute]);

  /**
   * Get a membership proposal by ID
   */
  const getProposal = useCallback(async (proposalId: number): Promise<MembershipProposal | null> => {
    // Try backend first
    try {
      const bp = await getMembershipProposalFromBackend(proposalId);
      if (bp) {
        console.log(`✅ Got membership proposal #${proposalId} from backend`);
        return {
          id: bp.id,
          nominee: bp.nominee,
          proposer: bp.proposer,
          stakeAmount: bp.stakeAmount,
          approvals: bp.approvals,
          rejections: bp.rejections,
          status: bp.status,
          createdAt: bp.createdAt,
          decidedAt: bp.decidedAt,
        };
      }
    } catch (e) {
      console.warn(`Backend unavailable for membership proposal #${proposalId}, falling back to Hiro`);
    }

    // Fallback: existing Hiro API code
    try {
      console.log(`🔍 Fetching proposal #${proposalId} (Hiro fallback)...`);

      const result = await fetchCallReadOnlyFunction({
        network,
        contractAddress: membershipContract.address,
        contractName: membershipContract.name,
        functionName: 'get-proposal',
        functionArgs: [uintCV(proposalId)],
        senderAddress: userAddress || membershipContract.address,
      });

      const data = cvToJSON(result);

      // The data.value might be null if proposal doesn't exist
      if (!data.value) {
        return null;
      }

      // IMPORTANT: cvToJSON returns a nested structure
      // Outer level: {type: "...", value: {...}}
      // We need to access data.value to get the actual proposal data
      const proposalData = data.value.value || data.value;

      console.log('📊 Proposal #' + proposalId + ' data:', {
        nominee: proposalData.nominee?.value,
        stakeAmount: proposalData['stake-amount']?.value,
        approvals: proposalData.approvals?.value,
        rejections: proposalData.rejections?.value,
        status: proposalData.status?.value
      });

      return {
        id: proposalId,
        nominee: proposalData.nominee?.value || '',
        proposer: proposalData.proposer?.value || '',
        stakeAmount: parseInt(proposalData['stake-amount']?.value || '0'),
        approvals: parseInt(proposalData.approvals?.value || '0'),
        rejections: parseInt(proposalData.rejections?.value || '0'),
        status: parseInt(proposalData.status?.value || '0'),
        createdAt: parseInt(proposalData['created-at']?.value || '0'),
        decidedAt: proposalData['decided-at']?.value?.value
          ? parseInt(proposalData['decided-at'].value.value)
          : undefined,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      // Silently fail for network errors - don't spam console
      if (!errorMsg.includes('Failed to fetch') && !errorMsg.includes('NetworkError')) {
        console.error(`❌ Error fetching proposal #${proposalId}:`, err);
      }
      return null;
    }
  }, [userAddress]);

  /**
   * Check if committee member has voted on a proposal
   */
  const hasVoted = useCallback(async (proposalId: number, voterAddress: string): Promise<boolean> => {
    try {
      const result = await fetchCallReadOnlyFunction({
        network,
        contractAddress: membershipContract.address,
        contractName: membershipContract.name,
        functionName: 'get-vote',
        functionArgs: [uintCV(proposalId), principalCV(voterAddress)],
        senderAddress: userAddress || membershipContract.address,
      });

      const data = cvToJSON(result);
      return data.value !== null;
    } catch (err) {
      console.error('❌ Error checking vote status:', err);
      return false;
    }
  }, [userAddress]);

  /**
   * Vote on a membership proposal (committee members only)
   */
  const voteOnProposal = useCallback(async (proposalId: number, approve: boolean): Promise<CommitteeResponse> => {
    if (!userAddress) {
      return { success: false, error: 'Please connect your wallet' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await execute({
        callOptions: {
          network,
          contractAddress: membershipContract.address,
          contractName: membershipContract.name,
          functionName: 'vote-on-proposal',
          functionArgs: [
            uintCV(proposalId),
            approve ? trueCV() : falseCV(),
          ],
          postConditions: [],
          postConditionMode: PostConditionMode.Allow,
        },
        actionLabel: approve ? 'Approve Proposal' : 'Reject Proposal',
      });

      setIsLoading(false);
      if (!result.success && result.error) setError(result.error);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setIsLoading(false);
      setError(errorMessage);
      return { success: false, error: `Failed to submit vote: ${errorMessage}` };
    }
  }, [userAddress, execute]);

  /**
   * Propose a new DAO member (committee members only)
   * Note: The nominee must be the one calling this function to stake their STX
   * The committee member's address is passed as the proposer parameter
   */
  const proposeMember = useCallback(async (nomineeAddress: string, proposerAddress: string): Promise<CommitteeResponse> => {
    if (!userAddress) {
      return { success: false, error: 'Please connect your wallet' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await execute({
        callOptions: {
          network,
          contractAddress: membershipContract.address,
          contractName: membershipContract.name,
          functionName: 'propose-member',
          functionArgs: [
            principalCV(nomineeAddress),
            principalCV(proposerAddress),
          ],
          postConditions: [],
          postConditionMode: PostConditionMode.Allow,
        },
        actionLabel: 'Propose Member',
      });

      setIsLoading(false);
      if (!result.success && result.error) setError(result.error);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setIsLoading(false);
      setError(errorMessage);
      return { success: false, error: `Failed to propose member: ${errorMessage}` };
    }
  }, [userAddress, execute]);

  /**
   * Get all pending membership proposals from backend
   */
  const getPendingProposals = useCallback(async (): Promise<MembershipProposal[]> => {
    // Try backend first
    try {
      const proposals = await getPendingMembershipProposalsFromBackend();
      if (proposals && proposals.length > 0) {
        console.log(`✅ Got ${proposals.length} pending proposals from backend`);
        return proposals.map(p => ({
          id: p.id,
          nominee: p.nominee,
          proposer: p.proposer,
          stakeAmount: p.stakeAmount,
          approvals: p.approvals,
          rejections: p.rejections,
          status: p.status,
          createdAt: p.createdAt,
          decidedAt: p.decidedAt,
        }));
      }
    } catch (e) {
      console.warn('Backend unavailable for pending proposals, falling back to iteration');
    }

    // Fallback: iterate proposal IDs 1-20
    const proposals: MembershipProposal[] = [];
    for (let i = 1; i <= 20; i++) {
      try {
        const proposal = await getProposal(i);
        if (proposal && proposal.status === 0) {
          proposals.push(proposal);
        }
      } catch {
        continue;
      }
    }
    return proposals;
  }, [getProposal]);

  return {
    isAdmin,
    isLoading,
    error,
    checkCommitteeMember,
    addCommitteeMember,
    removeCommitteeMember,
    getProposal,
    getPendingProposals,
    hasVoted,
    voteOnProposal,
    proposeMember,
  };
}
