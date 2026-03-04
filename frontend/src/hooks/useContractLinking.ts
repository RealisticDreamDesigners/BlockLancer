import { useState, useCallback, useEffect } from 'react';
import {
  principalCV,
  PostConditionMode,
  fetchCallReadOnlyFunction,
  cvToJSON,
} from '@stacks/transactions';
import { getNetwork, getDeployerAddress } from '@/lib/networkConfig';
import { getContractReferencesFromBackend } from '@/lib/apiClient';
import { useContractCall } from './useContractCall';

// ===============================================
// CONFIGURATION
// ===============================================

const network = getNetwork();

const DEPLOYER_ADDRESS = getDeployerAddress();

const CONTRACTS = {
  DAO: process.env.NEXT_PUBLIC_DAO_CONTRACT ||
    `${getDeployerAddress()}.blocklancer-dao`,
  DISPUTE: process.env.NEXT_PUBLIC_DISPUTE_CONTRACT ||
    `${getDeployerAddress()}.blocklancer-dispute-v3`,
  MEMBERSHIP: process.env.NEXT_PUBLIC_MEMBERSHIP_CONTRACT ||
    `${getDeployerAddress()}.blocklancer-membership`,
  ESCROW: process.env.NEXT_PUBLIC_ESCROW_CONTRACT ||
    `${getDeployerAddress()}.blocklancer-escrow-v2`,
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

export interface LinkingResponse {
  success: boolean;
  txId?: string;
  error?: string;
}

export interface LinkingStatus {
  membershipToDao: boolean;
  disputeToDao: boolean;
  membershipLinkToDao: boolean;
  escrowToDao: boolean;
}

// ===============================================
// HOOK
// ===============================================

export function useContractLinking(userAddress?: string) {
  const [isLinking, setIsLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { execute } = useContractCall();
  const [linkingStatus, setLinkingStatus] = useState<LinkingStatus>(() => {
    // Load from localStorage on mount
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('contractLinkingStatus');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse linking status');
        }
      }
    }
    return {
      membershipToDao: false,
      disputeToDao: false,
      membershipLinkToDao: false,
      escrowToDao: false,
    };
  });

  const isDeployer = userAddress === DEPLOYER_ADDRESS;

  // Save to localStorage whenever linkingStatus changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('contractLinkingStatus', JSON.stringify(linkingStatus));
    }
  }, [linkingStatus]);

  /**
   * Verify contract linking status from blockchain
   * Fetches actual on-chain contract references and updates linking status
   */
  const verifyLinkingStatusFromBlockchain = useCallback(async () => {
    // Try backend first
    try {
      const backendRefs = await getContractReferencesFromBackend();
      if (backendRefs) {
        console.log('✅ Got contract references from backend');
        const verifiedStatus: LinkingStatus = {
          membershipToDao: false, // Will check below
          disputeToDao: backendRefs.disputeContract !== null,
          membershipLinkToDao: backendRefs.membershipContract !== null,
          escrowToDao: backendRefs.escrowContract !== null,
        };
        // We can't tell membershipToDao from the DAO side; assume it matches
        verifiedStatus.membershipToDao = verifiedStatus.membershipLinkToDao;
        setLinkingStatus(verifiedStatus);
        return verifiedStatus;
      }
    } catch (e) {
      console.warn('Backend unavailable for contract references, falling back to Hiro');
    }

    // Fallback: existing Hiro API code
    try {
      console.log('🔍 Verifying contract linking status from blockchain (Hiro fallback)...');

      // Fetch contract references from DAO contract
      const result = await fetchCallReadOnlyFunction({
        network,
        contractAddress: daoContract.address,
        contractName: daoContract.name,
        functionName: 'get-contract-references',
        functionArgs: [],
        senderAddress: userAddress || daoContract.address,
      });

      const data = cvToJSON(result);
      const refs = data.value.value || data.value;

      console.log('📊 On-chain contract references:', refs);

      // Check if contracts are linked
      const membershipLinked = refs['membership-contract']?.value !== null &&
                              refs['membership-contract']?.value !== undefined;
      const disputeLinked = refs['dispute-contract']?.value !== null &&
                           refs['dispute-contract']?.value !== undefined;
      const escrowLinked = refs['escrow-contract']?.value !== null &&
                          refs['escrow-contract']?.value !== undefined;

      // Also check if membership contract has DAO reference
      try {
        const membershipResult = await fetchCallReadOnlyFunction({
          network,
          contractAddress: membershipContract.address,
          contractName: membershipContract.name,
          functionName: 'get-dao-contract',
          functionArgs: [],
          senderAddress: userAddress || membershipContract.address,
        });

        const membershipData = cvToJSON(membershipResult);
        const membershipToDao = membershipData.value?.value !== null &&
                               membershipData.value?.value !== undefined;

        // Update linking status based on blockchain state
        const verifiedStatus: LinkingStatus = {
          membershipToDao,
          disputeToDao: disputeLinked,
          membershipLinkToDao: membershipLinked,
          escrowToDao: escrowLinked,
        };

        console.log('✅ Verified linking status:', verifiedStatus);
        setLinkingStatus(verifiedStatus);

        return verifiedStatus;
      } catch (membershipError) {
        console.error('Error checking membership contract:', membershipError);

        // Update with partial status
        const partialStatus: LinkingStatus = {
          membershipToDao: false,
          disputeToDao: disputeLinked,
          membershipLinkToDao: membershipLinked,
          escrowToDao: escrowLinked,
        };

        setLinkingStatus(partialStatus);
        return partialStatus;
      }
    } catch (error) {
      console.error('❌ Error verifying contract linking status:', error);
      return null;
    }
  }, [userAddress]);

  /**
   * Link Membership Contract to DAO
   * Calls: blocklancer-member-ships.set-dao-contract
   */
  const linkMembershipToDao = useCallback(async (): Promise<LinkingResponse> => {
    if (!userAddress) {
      return { success: false, error: 'Please connect your wallet' };
    }

    if (!isDeployer) {
      return { success: false, error: 'Only the deployer can link contracts' };
    }

    setIsLinking(true);
    setError(null);

    try {
      const mc = parseContractId(CONTRACTS.MEMBERSHIP);
      const result = await execute({
        callOptions: {
          network,
          contractAddress: mc.address,
          contractName: mc.name,
          functionName: 'set-dao-contract',
          functionArgs: [principalCV(CONTRACTS.DAO)],
          postConditions: [],
          postConditionMode: PostConditionMode.Allow,
        },
        actionLabel: 'Link Membership to DAO',
        onBroadcast: () => setLinkingStatus(prev => ({ ...prev, membershipToDao: true })),
      });

      setIsLinking(false);
      if (!result.success && result.error) setError(result.error);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setIsLinking(false);
      setError(errorMessage);
      return { success: false, error: `Failed to link: ${errorMessage}` };
    }
  }, [userAddress, isDeployer, execute]);

  /**
   * Link Dispute Contract to DAO
   * Calls: blocklancer-dao.set-dispute-contract
   */
  const linkDisputeToDao = useCallback(async (): Promise<LinkingResponse> => {
    if (!userAddress) {
      return { success: false, error: 'Please connect your wallet' };
    }

    if (!isDeployer) {
      return { success: false, error: 'Only the deployer can link contracts' };
    }

    setIsLinking(true);
    setError(null);

    try {
      const dc = parseContractId(CONTRACTS.DAO);
      const result = await execute({
        callOptions: {
          network,
          contractAddress: dc.address,
          contractName: dc.name,
          functionName: 'set-dispute-contract',
          functionArgs: [principalCV(CONTRACTS.DISPUTE)],
          postConditions: [],
          postConditionMode: PostConditionMode.Allow,
        },
        actionLabel: 'Link Dispute to DAO',
        onBroadcast: () => setLinkingStatus(prev => ({ ...prev, disputeToDao: true })),
      });

      setIsLinking(false);
      if (!result.success && result.error) setError(result.error);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setIsLinking(false);
      setError(errorMessage);
      return { success: false, error: `Failed to link: ${errorMessage}` };
    }
  }, [userAddress, isDeployer, execute]);

  /**
   * Link Membership Contract reference to DAO
   * Calls: blocklancer-dao.set-membership-contract
   */
  const linkMembershipReferenceToDao = useCallback(async (): Promise<LinkingResponse> => {
    if (!userAddress) {
      return { success: false, error: 'Please connect your wallet' };
    }

    if (!isDeployer) {
      return { success: false, error: 'Only the deployer can link contracts' };
    }

    setIsLinking(true);
    setError(null);

    try {
      const dc = parseContractId(CONTRACTS.DAO);
      const result = await execute({
        callOptions: {
          network,
          contractAddress: dc.address,
          contractName: dc.name,
          functionName: 'set-membership-contract',
          functionArgs: [principalCV(CONTRACTS.MEMBERSHIP)],
          postConditions: [],
          postConditionMode: PostConditionMode.Allow,
        },
        actionLabel: 'Link Membership Ref to DAO',
        onBroadcast: () => setLinkingStatus(prev => ({ ...prev, membershipLinkToDao: true })),
      });

      setIsLinking(false);
      if (!result.success && result.error) setError(result.error);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setIsLinking(false);
      setError(errorMessage);
      return { success: false, error: `Failed to link: ${errorMessage}` };
    }
  }, [userAddress, isDeployer, execute]);

  /**
   * Link Escrow Contract to DAO
   * Calls: blocklancer-dao.set-escrow-contract
   */
  const linkEscrowToDao = useCallback(async (): Promise<LinkingResponse> => {
    if (!userAddress) {
      return { success: false, error: 'Please connect your wallet' };
    }

    if (!isDeployer) {
      return { success: false, error: 'Only the deployer can link contracts' };
    }

    setIsLinking(true);
    setError(null);

    try {
      const dc = parseContractId(CONTRACTS.DAO);
      const result = await execute({
        callOptions: {
          network,
          contractAddress: dc.address,
          contractName: dc.name,
          functionName: 'set-escrow-contract',
          functionArgs: [principalCV(CONTRACTS.ESCROW)],
          postConditions: [],
          postConditionMode: PostConditionMode.Allow,
        },
        actionLabel: 'Link Escrow to DAO',
        onBroadcast: () => setLinkingStatus(prev => ({ ...prev, escrowToDao: true })),
      });

      setIsLinking(false);
      if (!result.success && result.error) setError(result.error);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setIsLinking(false);
      setError(errorMessage);
      return { success: false, error: `Failed to link: ${errorMessage}` };
    }
  }, [userAddress, isDeployer, execute]);

  /**
   * Link all contracts at once
   */
  const linkAllContracts = useCallback(async (): Promise<LinkingResponse> => {
    if (!userAddress) {
      return { success: false, error: 'Please connect your wallet' };
    }

    if (!isDeployer) {
      return { success: false, error: 'Only the deployer can link contracts' };
    }

    // Link them one by one with delays
    const results = [];

    results.push(await linkMembershipToDao());
    await new Promise(resolve => setTimeout(resolve, 1000));

    results.push(await linkDisputeToDao());
    await new Promise(resolve => setTimeout(resolve, 1000));

    results.push(await linkMembershipReferenceToDao());
    await new Promise(resolve => setTimeout(resolve, 1000));

    results.push(await linkEscrowToDao());

    const allSuccess = results.every(r => r.success);

    if (allSuccess) {
      return {
        success: true,
        error: undefined,
      };
    } else {
      const failed = results.filter(r => !r.success);
      return {
        success: false,
        error: `${failed.length} linking operation(s) failed`,
      };
    }
  }, [userAddress, isDeployer, linkMembershipToDao, linkDisputeToDao, linkMembershipReferenceToDao, linkEscrowToDao]);

  /**
   * Clear linking status (for testing/reset)
   */
  const clearLinkingStatus = useCallback(() => {
    const resetStatus = {
      membershipToDao: false,
      disputeToDao: false,
      membershipLinkToDao: false,
      escrowToDao: false,
    };
    setLinkingStatus(resetStatus);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('contractLinkingStatus');
    }
  }, []);

  /**
   * Mark all as linked (for when contracts are already linked on-chain)
   */
  const markAllAsLinked = useCallback(() => {
    const allLinked = {
      membershipToDao: true,
      disputeToDao: true,
      membershipLinkToDao: true,
      escrowToDao: true,
    };
    setLinkingStatus(allLinked);
  }, []);

  return {
    isDeployer,
    isLinking,
    error,
    linkingStatus,
    linkMembershipToDao,
    linkDisputeToDao,
    linkMembershipReferenceToDao,
    linkEscrowToDao,
    linkAllContracts,
    clearLinkingStatus,
    markAllAsLinked,
    verifyLinkingStatusFromBlockchain,
  };
}
