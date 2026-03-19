import {
  fetchCallReadOnlyFunction,
  cvToJSON,
  cvToValue,
  uintCV,
  stringUtf8CV,
  principalCV,
  standardPrincipalCV,
  PostConditionMode,
} from '@stacks/transactions';
import { getNetwork } from '@/lib/networkConfig';
import {
  getDisputeFromBackend,
  getDisputeCountFromBackend,
  getContractDisputeFromBackend,
  getUserDisputesFromBackend,
  getAllDisputesFromBackend,
} from '@/lib/apiClient';
import { wrappedContractCall } from '@/lib/contractCallWrapper';
import {
  Dispute,
  DisputeResponse,
  DisputeStatus,
  ResolutionType,
} from '@/types/dispute';

// ===============================================
// CONFIGURATION
// ===============================================

const network = getNetwork();

// Contract addresses (Deployed on Testnet)
const CONTRACTS = {
  DISPUTE: process.env.NEXT_PUBLIC_DISPUTE_CONTRACT || 'ST30M31FNAKNX5EJKV10V7SJSE07VVDFFZHZHGE0J.blocklancer-dispute-v5',
  ESCROW: process.env.NEXT_PUBLIC_ESCROW_CONTRACT || 'ST30M31FNAKNX5EJKV10V7SJSE07VVDFFZHZHGE0J.blocklancer-escrow-v4',
};

const parseContractId = (contractId: string) => {
  const [address, name] = contractId.split('.');
  return { address, name };
};

const disputeContract = parseContractId(CONTRACTS.DISPUTE);
const escrowContract = parseContractId(CONTRACTS.ESCROW);

// ===============================================
// API FALLBACK HELPERS
// ===============================================

const makeProxyApiCall = async (endpoint: string, body?: any) => {
  const proxyUrl = `/api/stacks${endpoint}`;

  try {
    const serializedBody = body ? JSON.stringify(body, (_key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ) : undefined;

    const response = await fetch(proxyUrl, {
      method: body ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      ...(body && { body: serializedBody })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Proxy API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Proxy API call failed:', error);
    throw error;
  }
};

const makeSmartApiCall = async (apiCall: () => Promise<any>, fallbackEndpoint?: string, fallbackBody?: any) => {
  try {
    console.log('Attempting direct Stacks.js API call...');
    return await apiCall();
  } catch (error: any) {
    console.warn('Direct call failed:', error.message || error);

    if (fallbackEndpoint) {
      try {
        console.log('Trying proxy fallback for:', fallbackEndpoint);
        return await makeProxyApiCall(fallbackEndpoint, fallbackBody);
      } catch (proxyError: any) {
        console.warn('Both direct and proxy calls failed - this may be expected if contracts are not yet linked or data does not exist');
        throw proxyError;
      }
    } else {
      throw error;
    }
  }
};

// ===============================================
// DATA TRANSFORMATION HELPERS
// ===============================================

/**
 * Transform Clarity CV data to TypeScript Dispute object
 */
function transformDisputeData(clarityData: any, disputeId?: number): Dispute {
  try {
    // Handle both CV format and plain JSON format
    const data = clarityData.value?.value || clarityData.value || clarityData;

    // Helper to extract optional string values (handles {type, value} structure)
    const extractOptionalString = (field: any): string | undefined => {
      if (!field) return undefined;

      // If it's already a string, return it
      if (typeof field === 'string') return field;

      // If it's an object with value property
      if (typeof field === 'object' && 'value' in field) {
        // If value is null, return undefined
        if (field.value === null) return undefined;

        // If value is a string, return it
        if (typeof field.value === 'string') return field.value;

        // If value is another object with value property (nested structure)
        if (typeof field.value === 'object' && 'value' in field.value) {
          const nestedValue = field.value.value;
          return typeof nestedValue === 'string' ? nestedValue : undefined;
        }

        return undefined;
      }

      return undefined;
    };

    const dispute: Dispute = {
      id: disputeId || 0,
      contractId: parseInt(data['contract-id']?.value || data['contract-id'] || '0'),
      openedBy: data['opened-by']?.value || data['opened-by'] || '-',
      client: data.client?.value || data.client || '-',
      freelancer: data.freelancer?.value || data.freelancer || '-',
      reason: data.reason?.value || data.reason || '-',
      clientEvidence: extractOptionalString(data['client-evidence']),
      freelancerEvidence: extractOptionalString(data['freelancer-evidence']),
      status: parseInt(data.status?.value || data.status || '0') as DisputeStatus,
      resolution: parseInt(data.resolution?.value || data.resolution || '0') as ResolutionType,
      createdAt: parseInt(data['created-at']?.value || data['created-at'] || '0'),
      resolvedAt: data['resolved-at']?.value ? parseInt(data['resolved-at'].value) : undefined,
    };

    return dispute;
  } catch (error) {
    console.error('Error transforming dispute data:', error);
    throw new Error('Failed to parse dispute data');
  }
}

// ===============================================
// READ-ONLY FUNCTIONS
// ===============================================

/**
 * Get dispute details by ID
 */
export async function getDispute(disputeId: number, userAddress?: string): Promise<Dispute | null> {
  // Try backend first
  try {
    const backendDispute = await getDisputeFromBackend(disputeId);
    if (backendDispute) {
      console.log(`Got dispute #${disputeId} from backend`);
      return {
        id: backendDispute.id,
        contractId: backendDispute.contractId,
        openedBy: backendDispute.openedBy,
        client: backendDispute.client,
        freelancer: backendDispute.freelancer,
        reason: backendDispute.reason,
        clientEvidence: backendDispute.clientEvidence,
        freelancerEvidence: backendDispute.freelancerEvidence,
        status: backendDispute.status as DisputeStatus,
        resolution: backendDispute.resolution as ResolutionType,
        createdAt: backendDispute.createdAt,
        resolvedAt: backendDispute.resolvedAt,
      };
    }
  } catch (e) {
    console.warn(`Backend unavailable for dispute #${disputeId}, falling back to Hiro`);
  }

  // Fallback: existing Hiro API code
  try {
    console.log(`Fetching dispute #${disputeId} (Hiro fallback)...`);

    const result = await fetchCallReadOnlyFunction({
      network,
      contractAddress: disputeContract.address,
      contractName: disputeContract.name,
      functionName: 'get-dispute',
      functionArgs: [uintCV(disputeId)],
      senderAddress: userAddress || disputeContract.address,
    });

    const disputeData = cvToJSON(result);
    console.log('Dispute data:', disputeData);

    // Check if dispute exists (for optional types, value will be null if not found)
    if (disputeData.value === null || !disputeData.value) {
      console.log(`Dispute #${disputeId} not found`);
      return null;
    }

    const dispute = transformDisputeData(disputeData, disputeId);
    console.log(`Fetched dispute #${disputeId}:`, dispute);
    return dispute;
  } catch (error) {
    console.error(`Error fetching dispute #${disputeId}:`, error);
    return null;
  }
}

/**
 * Get dispute by contract ID
 */
export async function getContractDispute(contractId: number, userAddress?: string): Promise<Dispute | null> {
  // Try backend first
  try {
    const backendDispute = await getContractDisputeFromBackend(contractId);
    if (backendDispute) {
      console.log(`Got dispute for contract #${contractId} from backend`);
      return {
        id: backendDispute.id,
        contractId: backendDispute.contractId,
        openedBy: backendDispute.openedBy,
        client: backendDispute.client,
        freelancer: backendDispute.freelancer,
        reason: backendDispute.reason,
        clientEvidence: backendDispute.clientEvidence,
        freelancerEvidence: backendDispute.freelancerEvidence,
        status: backendDispute.status as DisputeStatus,
        resolution: backendDispute.resolution as ResolutionType,
        createdAt: backendDispute.createdAt,
        resolvedAt: backendDispute.resolvedAt,
      };
    }
  } catch (e) {
    console.warn(`Backend unavailable for contract dispute #${contractId}, falling back to Hiro`);
  }

  // Fallback: existing Hiro API code
  try {
    console.log(`Fetching dispute for contract #${contractId} (Hiro fallback)...`);
    console.log(`Using contract: ${disputeContract.address}.${disputeContract.name}`);

    // First, get the dispute ID for this contract
    const disputeIdResult = await fetchCallReadOnlyFunction({
      network,
      contractAddress: disputeContract.address,
      contractName: disputeContract.name,
      functionName: 'get-contract-dispute-id',
      functionArgs: [uintCV(contractId)],
      senderAddress: userAddress || disputeContract.address,
    });

    const disputeIdData = cvToJSON(disputeIdResult);
    console.log(`Raw dispute ID data:`, disputeIdData);

    // Check if a dispute ID exists
    if (disputeIdData.value === null || !disputeIdData.value) {
      console.log(`No dispute found for contract #${contractId}`);
      return null;
    }

    // Extract the actual dispute ID value - handle both direct value and nested value
    const rawDisputeId = disputeIdData.value?.value || disputeIdData.value;
    const disputeId = parseInt(rawDisputeId);
    console.log(`Found dispute ID ${disputeId} for contract #${contractId}`);

    // Now fetch the full dispute data
    const result = await fetchCallReadOnlyFunction({
      network,
      contractAddress: disputeContract.address,
      contractName: disputeContract.name,
      functionName: 'get-contract-dispute',
      functionArgs: [uintCV(contractId)],
      senderAddress: userAddress || disputeContract.address,
    });

    const disputeData = cvToJSON(result);

    if (disputeData.value === null || !disputeData.value) {
      console.log(`No dispute found for contract #${contractId}`);
      return null;
    }

    // Transform with the correct dispute ID
    const dispute = transformDisputeData(disputeData, disputeId);
    console.log(`Fetched dispute for contract #${contractId}:`, dispute);
    return dispute;
  } catch (error) {
    console.error(`Error fetching contract dispute #${contractId}:`, error);
    return null;
  }
}

/**
 * Check if contract has an active dispute
 */
export async function hasActiveDispute(contractId: number, userAddress?: string): Promise<boolean> {
  try {
    console.log(`Checking if contract #${contractId} has active dispute...`);

    const result = await fetchCallReadOnlyFunction({
      network,
      contractAddress: disputeContract.address,
      contractName: disputeContract.name,
      functionName: 'has-active-dispute',
      functionArgs: [uintCV(contractId)],
      senderAddress: userAddress || disputeContract.address,
    });

    const hasDispute = cvToValue(result) as boolean;
    console.log(`Contract #${contractId} has active dispute:`, hasDispute);
    return hasDispute;
  } catch (error) {
    console.warn(`Could not check active dispute for contract #${contractId} - assuming no active dispute`);
    // Return false by default if contract call fails (likely means no dispute exists or contracts not linked)
    return false;
  }
}

/**
 * Get user disputes (returns first 3 due to contract limitation)
 * Backend API returns the full list from indexed data.
 */
export async function getUserDisputes(userAddress: string): Promise<Dispute[]> {
  // Try backend first — returns ALL disputes, not just 3
  try {
    const backendDisputes = await getUserDisputesFromBackend(userAddress);
    if (backendDisputes) {
      console.log(`Got ${backendDisputes.length} disputes from backend for user`);
      return backendDisputes.map(d => ({
        id: d.id,
        contractId: d.contractId,
        openedBy: d.openedBy,
        client: d.client,
        freelancer: d.freelancer,
        reason: d.reason,
        clientEvidence: d.clientEvidence,
        freelancerEvidence: d.freelancerEvidence,
        status: d.status as DisputeStatus,
        resolution: d.resolution as ResolutionType,
        createdAt: d.createdAt,
        resolvedAt: d.resolvedAt,
      }));
    }
  } catch (e) {
    console.warn('Backend unavailable for user disputes, falling back to Hiro');
  }

  // Fallback: existing Hiro API code (limited to 3 disputes)
  try {
    console.log(`Fetching disputes for user ${userAddress} (Hiro fallback)...`);

    const result = await fetchCallReadOnlyFunction({
      network,
      contractAddress: disputeContract.address,
      contractName: disputeContract.name,
      functionName: 'get-user-disputes',
      functionArgs: [principalCV(userAddress)],
      senderAddress: userAddress,
    });

    const disputesData = cvToJSON(result);
    const disputes: Dispute[] = [];

    // Parse dispute-1, dispute-2, dispute-3
    for (let i = 1; i <= 3; i++) {
      const disputeKey = `dispute-${i}`;
      if (disputesData[disputeKey] && disputesData[disputeKey].value) {
        try {
          const dispute = transformDisputeData(disputesData[disputeKey], i);

          // Only include disputes where user is client or freelancer
          if (dispute.client === userAddress || dispute.freelancer === userAddress) {
            disputes.push(dispute);
          }
        } catch (error) {
          console.warn(`Failed to parse ${disputeKey}`);
        }
      }
    }

    console.log(`Found ${disputes.length} disputes for user ${userAddress}`);
    return disputes;
  } catch (error) {
    console.error(`Error fetching user disputes for ${userAddress}:`, error);
    return [];
  }
}

/**
 * Get total dispute count from the contract
 */
export async function getDisputeCount(): Promise<number> {
  // Try backend first
  try {
    const backendCount = await getDisputeCountFromBackend();
    if (backendCount !== null) {
      console.log(`Got dispute count from backend: ${backendCount}`);
      return backendCount;
    }
  } catch (e) {
    console.warn('Backend unavailable for dispute count, falling back to Hiro');
  }

  // Fallback: existing Hiro API code
  try {
    console.log('Fetching total dispute count (Hiro fallback)...');

    const result = await fetchCallReadOnlyFunction({
      network,
      contractAddress: disputeContract.address,
      contractName: disputeContract.name,
      functionName: 'get-dispute-count',
      functionArgs: [],
      senderAddress: disputeContract.address,
    });

    const countData = cvToJSON(result);
    const count = typeof countData === 'number' ? countData : parseInt(countData.value || '1');

    console.log(`Total dispute count: ${count}`);
    return count;
  } catch (error) {
    console.error('Error fetching dispute count:', error);
    return 1; // Return 1 as default (next-dispute-id starts at 1)
  }
}

/**
 * Get all disputes in the system
 * Fetches disputes from ID 1 to current count
 */
export async function getAllDisputes(userAddress?: string): Promise<Dispute[]> {
  // Try backend first
  try {
    const backendDisputes = await getAllDisputesFromBackend();
    if (backendDisputes) {
      console.log(`Got ${backendDisputes.length} total disputes from backend`);
      return backendDisputes.map(d => ({
        id: d.id,
        contractId: d.contractId,
        openedBy: d.openedBy,
        client: d.client,
        freelancer: d.freelancer,
        reason: d.reason,
        clientEvidence: d.clientEvidence,
        freelancerEvidence: d.freelancerEvidence,
        status: d.status as DisputeStatus,
        resolution: d.resolution as ResolutionType,
        createdAt: d.createdAt,
        resolvedAt: d.resolvedAt,
      }));
    }
  } catch (e) {
    console.warn('Backend unavailable for all disputes, falling back to Hiro');
  }

  // Fallback: existing Hiro API code
  try {
    console.log('Fetching all disputes (Hiro fallback)...');

    // First get the total count
    const count = await getDisputeCount();

    // If count is 1, it means no disputes have been created yet (next-dispute-id starts at 1)
    if (count <= 1) {
      console.log('No disputes found in system');
      return [];
    }

    // Fetch all disputes in parallel
    const disputePromises: Promise<Dispute | null>[] = [];

    // Fetch from 1 to count-1 (since next-dispute-id is the next ID to use)
    for (let i = 1; i < count; i++) {
      disputePromises.push(getDispute(i, userAddress));
    }

    const disputes = await Promise.all(disputePromises);

    // Filter out null disputes
    const validDisputes = disputes.filter((d): d is Dispute => d !== null);

    console.log(`Fetched ${validDisputes.length} total disputes from system`);
    return validDisputes;
  } catch (error) {
    console.error('Error fetching all disputes:', error);
    return [];
  }
}

// ===============================================
// WRITE FUNCTIONS (TRANSACTIONS)
// ===============================================

/**
 * Open a new dispute for a contract
 */
export async function openDispute(
  contractId: number,
  clientAddress: string,
  freelancerAddress: string,
  reason: string
): Promise<DisputeResponse> {
  try {
    console.log('Opening dispute with parameters:', {
      contractId,
      client: clientAddress,
      freelancer: freelancerAddress,
      reason: reason.substring(0, 50) + '...'
    });

    // Validate inputs
    if (!reason || reason.length === 0) {
      return { success: false, error: 'Dispute reason is required' };
    }

    if (reason.length > 500) {
      return { success: false, error: 'Dispute reason must be 500 characters or less' };
    }

    return wrappedContractCall({
      network,
      contractAddress: disputeContract.address,
      contractName: disputeContract.name,
      functionName: 'open-dispute',
      functionArgs: [
        uintCV(contractId),
        standardPrincipalCV(clientAddress),
        standardPrincipalCV(freelancerAddress),
        stringUtf8CV(reason)
      ],
      postConditions: [],
      postConditionMode: PostConditionMode.Allow,
    }, 'Open Dispute');
  } catch (error) {
    console.error('Error opening dispute:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Failed to open dispute: ${errorMessage}`
    };
  }
}

/**
 * Submit evidence for an existing dispute
 */
export async function submitEvidence(
  disputeId: number,
  evidence: string
): Promise<DisputeResponse> {
  try {
    console.log('Submitting evidence for dispute #', disputeId);

    // Validate inputs
    if (!evidence || evidence.length === 0) {
      return { success: false, error: 'Evidence is required' };
    }

    if (evidence.length > 1000) {
      return { success: false, error: 'Evidence must be 1000 characters or less' };
    }

    return wrappedContractCall({
      network,
      contractAddress: disputeContract.address,
      contractName: disputeContract.name,
      functionName: 'submit-evidence',
      functionArgs: [
        uintCV(disputeId),
        stringUtf8CV(evidence)
      ],
      postConditions: [],
      postConditionMode: PostConditionMode.Allow,
    }, 'Submit Evidence');
  } catch (error) {
    console.error('Error submitting evidence:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Failed to submit evidence: ${errorMessage}`
    };
  }
}

/**
 * Withdraw a dispute (only the opener can do this)
 */
export async function withdrawDispute(disputeId: number): Promise<DisputeResponse> {
  try {
    console.log('Withdrawing dispute #', disputeId);

    return wrappedContractCall({
      network,
      contractAddress: disputeContract.address,
      contractName: disputeContract.name,
      functionName: 'withdraw-dispute',
      functionArgs: [uintCV(disputeId)],
      postConditions: [],
      postConditionMode: PostConditionMode.Allow,
    }, 'Withdraw Dispute');
  } catch (error) {
    console.error('Error withdrawing dispute:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Failed to withdraw dispute: ${errorMessage}`
    };
  }
}

/**
 * DAO resolves a dispute (only DAO members can call this through DAO contract)
 * Note: This must be called through a DAO proposal
 */
export async function daoResolveDispute(
  disputeId: number,
  daoProposalId: number
): Promise<DisputeResponse> {
  try {
    console.log('DAO resolving dispute #', disputeId, 'via proposal #', daoProposalId);

    return wrappedContractCall({
      network,
      contractAddress: disputeContract.address,
      contractName: disputeContract.name,
      functionName: 'dao-resolve-dispute',
      functionArgs: [
        uintCV(disputeId),
        uintCV(daoProposalId)
      ],
      postConditions: [],
      postConditionMode: PostConditionMode.Allow,
    }, 'DAO Resolve Dispute');
  } catch (error) {
    console.error('Error resolving dispute via DAO:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Failed to resolve dispute: ${errorMessage}`
    };
  }
}

// ===============================================
// HELPER FUNCTIONS
// ===============================================

/**
 * Check if user is a participant in the dispute
 */
export function isDisputeParticipant(dispute: Dispute, userAddress: string): boolean {
  return dispute.client === userAddress || dispute.freelancer === userAddress;
}

/**
 * Check if user can submit evidence
 */
export function canSubmitEvidence(dispute: Dispute, userAddress: string): boolean {
  if (dispute.status !== DisputeStatus.OPEN) {
    return false;
  }

  if (!isDisputeParticipant(dispute, userAddress)) {
    return false;
  }

  // Check if user is client and hasn't submitted evidence yet
  if (dispute.client === userAddress && !dispute.clientEvidence) {
    return true;
  }

  // Check if user is freelancer and hasn't submitted evidence yet
  if (dispute.freelancer === userAddress && !dispute.freelancerEvidence) {
    return true;
  }

  return false;
}

/**
 * Check if user can withdraw dispute
 */
export function canWithdrawDispute(dispute: Dispute, userAddress: string): boolean {
  return dispute.openedBy === userAddress && dispute.status === DisputeStatus.OPEN;
}

/**
 * Get user role in dispute
 */
export function getUserRoleInDispute(dispute: Dispute, userAddress: string): 'client' | 'freelancer' | null {
  if (dispute.client === userAddress) {
    return 'client';
  }
  if (dispute.freelancer === userAddress) {
    return 'freelancer';
  }
  return null;
}

// Export network and contract info for debugging
export const disputeContractInfo = {
  network,
  contract: CONTRACTS.DISPUTE,
  parsed: disputeContract,
};
