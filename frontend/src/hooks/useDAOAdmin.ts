import { useState } from 'react';
import {
  fetchCallReadOnlyFunction,
  cvToJSON,
  principalCV,
  uintCV,
  PostConditionMode,
} from '@stacks/transactions';
import { getNetwork, getDeployerAddress } from '@/lib/networkConfig';
import {
  getDAOMemberStatusFromBackend,
  getMembershipProposalFromBackend,
} from '@/lib/apiClient';
import { useContractCall } from './useContractCall';

// ===============================================
// CONFIGURATION
// ===============================================

const network = getNetwork();

const CONTRACTS = {
  DAO: process.env.NEXT_PUBLIC_DAO_CONTRACT ||
    `${getDeployerAddress()}.blocklancer-dao`,
  MEMBERSHIP: process.env.NEXT_PUBLIC_MEMBERSHIP_CONTRACT ||
    `${getDeployerAddress()}.blocklancer-membership`,
  DEPLOYER: getDeployerAddress(),
};

const parseContractId = (contractId: string) => {
  const [address, name] = contractId.split('.');
  return { address, name };
};

const daoContract = parseContractId(CONTRACTS.DAO);
const membershipContract = parseContractId(CONTRACTS.MEMBERSHIP);

// ===============================================
// TYPES
// ===============================================

export interface DAOAdminResponse {
  success: boolean;
  txId?: string;
  error?: string;
}

export interface ApprovedProposal {
  id: number;
  nominee: string;
  proposer: string;
  approvals: number;
  status: number;
  createdAt: number;
  decidedAt?: number;
}

// ===============================================
// HOOK
// ===============================================

export function useDAOAdmin(userAddress?: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { execute } = useContractCall();

  // Check if user is the deployer/admin
  const isAdmin = userAddress === CONTRACTS.DEPLOYER;

  /**
   * Add an approved member to the DAO contract
   * Calls the admin-add-dao-member function on the DAO contract
   * Only the deployer can call this function
   */
  const addApprovedMemberToDAO = async (memberAddress: string): Promise<DAOAdminResponse> => {
    if (!userAddress) {
      return { success: false, error: 'Please connect your wallet' };
    }

    if (!isAdmin) {
      return { success: false, error: 'Only the deployer can add DAO members' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await execute({
        callOptions: {
          network,
          contractAddress: daoContract.address,
          contractName: daoContract.name,
          functionName: 'admin-add-dao-member',
          functionArgs: [principalCV(memberAddress)],
          postConditions: [],
          postConditionMode: PostConditionMode.Allow,
        },
        actionLabel: 'Add DAO Member',
      });

      setIsLoading(false);
      if (!result.success && result.error) setError(result.error);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setIsLoading(false);
      setError(errorMessage);
      return { success: false, error: `Failed to add member to DAO: ${errorMessage}` };
    }
  };

  /**
   * Get all approved membership proposals
   */
  const getApprovedProposals = async (): Promise<ApprovedProposal[]> => {
    try {
      console.log('🔍 Fetching approved membership proposals...');

      const proposals: ApprovedProposal[] = [];

      // Check proposals 1-20 (adjust range as needed)
      for (let i = 1; i <= 20; i++) {
        try {
          const result = await fetchCallReadOnlyFunction({
            network,
            contractAddress: membershipContract.address,
            contractName: membershipContract.name,
            functionName: 'get-proposal',
            functionArgs: [uintCV(i)],
            senderAddress: userAddress || membershipContract.address,
          });

          const data = cvToJSON(result);

          if (data.value) {
            const proposalData = data.value.value || data.value;

            // Only include approved proposals (status = 1)
            const status = parseInt(proposalData.status?.value || '0');
            if (status === 1) {
              proposals.push({
                id: i,
                nominee: proposalData.nominee?.value || '',
                proposer: proposalData.proposer?.value || '',
                approvals: parseInt(proposalData.approvals?.value || '0'),
                status,
                createdAt: parseInt(proposalData['created-at']?.value || '0'),
                decidedAt: proposalData['decided-at']?.value?.value
                  ? parseInt(proposalData['decided-at'].value.value)
                  : undefined,
              });
            }
          }
        } catch (err) {
          // Skip proposals that don't exist
          continue;
        }
      }

      console.log(`✅ Found ${proposals.length} approved proposals`);
      return proposals;
    } catch (err) {
      console.error('❌ Error fetching approved proposals:', err);
      return [];
    }
  };

  /**
   * Check if an address is already a DAO member
   */
  const isDAOMember = async (memberAddress: string): Promise<boolean> => {
    // Try backend first
    try {
      const backendStatus = await getDAOMemberStatusFromBackend(memberAddress);
      if (backendStatus) {
        console.log(`✅ Got DAO member status from backend for ${memberAddress}`);
        return backendStatus.isMember;
      }
    } catch (e) {
      console.warn('Backend unavailable for DAO member check, falling back to Hiro');
    }

    // Fallback: existing Hiro API code
    try {
      const result = await fetchCallReadOnlyFunction({
        network,
        contractAddress: daoContract.address,
        contractName: daoContract.name,
        functionName: 'get-dao-member-status',
        functionArgs: [principalCV(memberAddress)],
        senderAddress: userAddress || daoContract.address,
      });

      const data = cvToJSON(result);
      const statusData = data.value.value || data.value;

      return statusData['is-member']?.value === true;
    } catch (err) {
      console.error('❌ Error checking DAO member status:', err);
      return false;
    }
  };

  return {
    isAdmin,
    isLoading,
    error,
    addApprovedMemberToDAO,
    getApprovedProposals,
    isDAOMember,
  };
}
