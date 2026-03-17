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
  getProposalFromBackend,
  getAllProposalsFromBackend,
  getDAOStatsFromBackend,
  getDAOMemberStatusFromBackend,
  getVoteFromBackend,
} from '@/lib/apiClient';
import { wrappedContractCall } from '@/lib/contractCallWrapper';
import {
  Proposal,
  ProposalResponse,
  VoteResponse,
  VoteType,
  ProposalStatus,
  ProposalType,
  DAOMemberStatus,
  Vote,
} from '@/types/dispute';

// ===============================================
// CONFIGURATION
// ===============================================

const network = getNetwork();

// Contract addresses (Deployed on Testnet)
const CONTRACTS = {
  DAO: process.env.NEXT_PUBLIC_DAO_CONTRACT || 'ST30M31FNAKNX5EJKV10V7SJSE07VVDFFZHZHGE0J.blocklancer-dao',
};

const parseContractId = (contractId: string) => {
  const [address, name] = contractId.split('.');
  return { address, name };
};

const daoContract = parseContractId(CONTRACTS.DAO);

// ===============================================
// CONSTANTS (from smart contract)
// ===============================================

export const DAO_CONSTANTS = {
  SUPERMAJORITY_THRESHOLD: 70, // 70%
  VOTING_PERIOD_BLOCKS: 720, // ~5 days
  MAX_DAO_MEMBERS: 100,
};

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
    console.warn('Direct call failed:', error.message);

    if (fallbackEndpoint) {
      try {
        console.log('Trying proxy fallback for:', fallbackEndpoint);
        return await makeProxyApiCall(fallbackEndpoint, fallbackBody);
      } catch (proxyError: any) {
        console.error('Both direct and proxy calls failed');
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

function transformProposalData(clarityData: any, proposalId?: number): Proposal {
  try {
    // Handle nested cvToJSON structure: {type: "...", value: {type: "...", value: {...}}}
    let data = clarityData;

    // If we have a nested structure, unwrap it
    if (data.value && typeof data.value === 'object' && 'value' in data.value) {
      data = data.value.value;
    } else if (data.value) {
      data = data.value;
    }

    console.log(`Transforming proposal #${proposalId} data:`, {
      proposer: data.proposer?.value,
      yesVotes: data['yes-votes']?.value,
      noVotes: data['no-votes']?.value,
      status: data.status?.value
    });

    const proposal: Proposal = {
      id: proposalId || 0,
      proposer: data.proposer?.value || '-',
      proposalType: parseInt(data['proposal-type']?.value || '0') as ProposalType,
      targetContractId: parseInt(data['target-contract-id']?.value || '0'),
      targetMember: data['target-member']?.value?.value || undefined,
      description: data.description?.value || '-',
      yesVotes: parseInt(data['yes-votes']?.value || '0'),
      noVotes: parseInt(data['no-votes']?.value || '0'),
      abstainVotes: parseInt(data['abstain-votes']?.value || '0'),
      totalEligibleVoters: parseInt(data['total-eligible-voters']?.value || '0'),
      status: parseInt(data.status?.value || '0') as ProposalStatus,
      createdAt: parseInt(data['created-at']?.value || '0'),
      votingEndsAt: parseInt(data['voting-ends-at']?.value || '0'),
      executedAt: data['executed-at']?.value?.value
        ? parseInt(data['executed-at'].value.value)
        : undefined,

      // Calculate voting progress
      votingProgress: 0, // Will be calculated
      hasReachedThreshold: false, // Will be calculated
    };

    // Calculate voting progress
    const totalVotes = proposal.yesVotes + proposal.noVotes + proposal.abstainVotes;
    proposal.votingProgress = proposal.totalEligibleVoters > 0
      ? (totalVotes / proposal.totalEligibleVoters) * 100
      : 0;

    // Calculate if threshold reached
    const requiredVotes = Math.ceil((proposal.totalEligibleVoters * DAO_CONSTANTS.SUPERMAJORITY_THRESHOLD) / 100);
    proposal.hasReachedThreshold = proposal.yesVotes >= requiredVotes;

    console.log(`Transformed proposal #${proposalId}:`, {
      id: proposal.id,
      yesVotes: proposal.yesVotes,
      noVotes: proposal.noVotes,
      status: proposal.status,
      progress: proposal.votingProgress
    });

    return proposal;
  } catch (error) {
    console.error('Error transforming proposal data:', error);
    throw new Error('Failed to parse proposal data');
  }
}

function transformVoteData(clarityData: any, proposalId: number, voter: string): Vote {
  try {
    // Handle nested cvToJSON structure
    let data = clarityData;

    if (data.value && typeof data.value === 'object' && 'value' in data.value) {
      data = data.value.value;
    } else if (data.value) {
      data = data.value;
    }

    return {
      proposalId,
      voter,
      vote: parseInt(data.vote?.value || '0') as VoteType,
      timestamp: parseInt(data.timestamp?.value || '0'),
    };
  } catch (error) {
    console.error('Error transforming vote data:', error);
    throw new Error('Failed to parse vote data');
  }
}

function transformDAOMemberStatus(clarityData: any): DAOMemberStatus {
  try {
    // Handle nested cvToJSON structure
    let data = clarityData;

    if (data.value && typeof data.value === 'object' && 'value' in data.value) {
      data = data.value.value;
    } else if (data.value) {
      data = data.value;
    }

    const status: DAOMemberStatus = {
      isMember: data['is-member']?.value === true || false,
      memberCount: parseInt(data['member-count']?.value || '0'),
    };

    // Parse activity if available
    if (data.activity) {
      const activityData = data.activity.value || data.activity;
      if (activityData && typeof activityData === 'object') {
        status.activity = {
          lastVote: parseInt(activityData['last-vote']?.value || '0'),
          totalVotes: parseInt(activityData['total-votes']?.value || '0'),
          proposalsCreated: parseInt(activityData['proposals-created']?.value || '0'),
        };
      }
    }

    console.log('Transformed DAO member status:', status);
    return status;
  } catch (error) {
    console.error('Error transforming DAO member status:', error);
    return {
      isMember: false,
      memberCount: 0,
    };
  }
}

// ===============================================
// READ-ONLY FUNCTIONS
// ===============================================

/**
 * Get proposal details by ID
 */
export async function getProposal(proposalId: number, userAddress?: string): Promise<Proposal | null> {
  // Try backend first
  try {
    const bp = await getProposalFromBackend(proposalId);
    if (bp) {
      console.log(`Got proposal #${proposalId} from backend`);
      return {
        id: bp.id,
        proposer: bp.proposer,
        proposalType: bp.proposalType as ProposalType,
        targetContractId: bp.targetContractId,
        targetMember: bp.targetMember,
        description: bp.description,
        yesVotes: bp.yesVotes,
        noVotes: bp.noVotes,
        abstainVotes: bp.abstainVotes,
        totalEligibleVoters: bp.totalEligibleVoters,
        status: bp.status as ProposalStatus,
        createdAt: bp.createdAt,
        votingEndsAt: bp.votingEndsAt,
        executedAt: bp.executedAt,
        votingProgress: bp.votingProgress,
        hasReachedThreshold: bp.hasReachedThreshold,
      };
    }
  } catch (e) {
    console.warn(`Backend unavailable for proposal #${proposalId}, falling back to Hiro`);
  }

  // Fallback: existing Hiro API code
  try {
    console.log(`Fetching proposal #${proposalId} (Hiro fallback)...`);

    const result = await makeSmartApiCall(
      () => fetchCallReadOnlyFunction({
        network,
        contractAddress: daoContract.address,
        contractName: daoContract.name,
        functionName: 'get-proposal',
        functionArgs: [uintCV(proposalId)],
        senderAddress: userAddress || daoContract.address,
      }),
      '/get-proposal',
      {
        contractAddress: daoContract.address,
        contractName: daoContract.name,
        functionName: 'get-proposal',
        functionArgs: [proposalId],
        senderAddress: userAddress || daoContract.address,
      }
    );

    const proposalData = cvToJSON(result);

    if (proposalData.value === null || !proposalData.value) {
      console.log(`Proposal #${proposalId} not found`);
      return null;
    }

    const proposal = transformProposalData(proposalData, proposalId);
    console.log(`Fetched proposal #${proposalId}:`, proposal);
    return proposal;
  } catch (error) {
    console.error(`Error fetching proposal #${proposalId}:`, error);
    return null;
  }
}

/**
 * Get all proposals from the backend (preferred) or fallback to individual fetches.
 */
export async function getAllProposals(userAddress?: string): Promise<Proposal[]> {
  // Try backend bulk endpoint first — avoids fetching non-existent IDs one by one
  try {
    const backendProposals = await getAllProposalsFromBackend();
    if (backendProposals && backendProposals.length > 0) {
      console.log(`Got ${backendProposals.length} proposals from backend /api/proposals/all`);
      return backendProposals.map(bp => ({
        id: bp.id,
        proposer: bp.proposer,
        proposalType: bp.proposalType as ProposalType,
        targetContractId: bp.targetContractId,
        targetMember: bp.targetMember,
        description: bp.description,
        yesVotes: bp.yesVotes,
        noVotes: bp.noVotes,
        abstainVotes: bp.abstainVotes,
        totalEligibleVoters: bp.totalEligibleVoters,
        status: bp.status as ProposalStatus,
        createdAt: bp.createdAt,
        votingEndsAt: bp.votingEndsAt,
        executedAt: bp.executedAt,
        votingProgress: bp.votingProgress,
        hasReachedThreshold: bp.hasReachedThreshold,
      }));
    }
  } catch (e) {
    console.warn('Backend /api/proposals/all unavailable, falling back to individual fetches');
  }

  // Fallback: fetch IDs starting from 1 (DAO proposals are 1-indexed on this deployment)
  const proposals: Proposal[] = [];
  for (let id = 1; id < 100; id++) {
    const p = await getProposal(id, userAddress);
    if (!p) break; // Stop at first missing ID
    proposals.push(p);
  }
  return proposals;
}

/**
 * Get proposal summary with voting stats
 */
export async function getProposalSummary(proposalId: number, userAddress?: string): Promise<Proposal | null> {
  try {
    console.log(`Fetching proposal summary #${proposalId}...`);

    const result = await makeSmartApiCall(
      () => fetchCallReadOnlyFunction({
        network,
        contractAddress: daoContract.address,
        contractName: daoContract.name,
        functionName: 'get-proposal-summary',
        functionArgs: [uintCV(proposalId)],
        senderAddress: userAddress || daoContract.address,
      }),
      '/get-proposal-summary',
      {
        contractAddress: daoContract.address,
        contractName: daoContract.name,
        functionName: 'get-proposal-summary',
        functionArgs: [proposalId],
        senderAddress: userAddress || daoContract.address,
      }
    );

    const summaryData = cvToJSON(result);

    if (summaryData.value === null || !summaryData.value) {
      return null;
    }

    // Transform the summary data (similar to proposal but with additional calculated fields)
    const proposal = transformProposalData(summaryData, proposalId);
    return proposal;
  } catch (error) {
    console.error(`Error fetching proposal summary #${proposalId}:`, error);
    return null;
  }
}

/**
 * Get DAO member status for a user
 */
export async function getDAOMemberStatus(userAddress: string): Promise<DAOMemberStatus> {
  // Try backend first
  try {
    const backendStatus = await getDAOMemberStatusFromBackend(userAddress);
    if (backendStatus) {
      console.log(`Got DAO member status from backend for ${userAddress}`);
      return {
        isMember: backendStatus.isMember,
        memberCount: backendStatus.memberCount,
      };
    }
  } catch (e) {
    console.warn('Backend unavailable for DAO member status, falling back to Hiro');
  }

  // Fallback: existing Hiro API code
  try {
    console.log(`Fetching DAO member status for ${userAddress} (Hiro fallback)...`);

    const result = await makeSmartApiCall(
      () => fetchCallReadOnlyFunction({
        network,
        contractAddress: daoContract.address,
        contractName: daoContract.name,
        functionName: 'get-dao-member-status',
        functionArgs: [principalCV(userAddress)],
        senderAddress: userAddress,
      }),
      '/get-dao-member-status',
      {
        contractAddress: daoContract.address,
        contractName: daoContract.name,
        functionName: 'get-dao-member-status',
        functionArgs: [userAddress],
        senderAddress: userAddress,
      }
    );

    const statusData = cvToJSON(result);
    const status = transformDAOMemberStatus(statusData);

    console.log(`DAO member status for ${userAddress}:`, status);
    return status;
  } catch (error) {
    console.error(`Error fetching DAO member status for ${userAddress}:`, error);
    return {
      isMember: false,
      memberCount: 0,
    };
  }
}

/**
 * Check if an address is a DAO member (simple boolean check)
 */
export async function checkDAOMembership(userAddress: string): Promise<boolean> {
  try {
    const status = await getDAOMemberStatus(userAddress);
    return status.isMember;
  } catch (error) {
    console.error(`Error checking DAO membership for ${userAddress}:`, error);
    return false;
  }
}

/**
 * Get vote details for a specific proposal and voter
 */
export async function getVote(proposalId: number, voterAddress: string): Promise<Vote | null> {
  // Try backend first
  try {
    const backendVote = await getVoteFromBackend(proposalId, voterAddress);
    if (backendVote) {
      console.log(`Got vote from backend for proposal #${proposalId}`);
      return {
        proposalId: backendVote.proposalId,
        voter: backendVote.voter,
        vote: backendVote.vote as VoteType,
        timestamp: backendVote.timestamp,
      };
    }
  } catch (e) {
    console.warn('Backend unavailable for vote, falling back to Hiro');
  }

  // Fallback: existing Hiro API code
  try {
    console.log(`Fetching vote for proposal #${proposalId} by ${voterAddress} (Hiro fallback)...`);

    const result = await makeSmartApiCall(
      () => fetchCallReadOnlyFunction({
        network,
        contractAddress: daoContract.address,
        contractName: daoContract.name,
        functionName: 'get-vote',
        functionArgs: [uintCV(proposalId), principalCV(voterAddress)],
        senderAddress: voterAddress,
      }),
      '/get-vote',
      {
        contractAddress: daoContract.address,
        contractName: daoContract.name,
        functionName: 'get-vote',
        functionArgs: [proposalId, voterAddress],
        senderAddress: voterAddress,
      }
    );

    const voteData = cvToJSON(result);

    if (voteData.value === null || !voteData.value) {
      return null;
    }

    const vote = transformVoteData(voteData, proposalId, voterAddress);
    console.log(`Fetched vote:`, vote);
    return vote;
  } catch (error) {
    console.error(`Error fetching vote:`, error);
    return null;
  }
}

/**
 * Get DAO statistics
 */
export async function getDAOStats(userAddress?: string): Promise<{
  totalMembers: number;
  maxMembers: number;
  nextProposalId: number;
  supermajorityThreshold: number;
  memberCount: number; // Alias for totalMembers (used by useDAOStatistics hook)
} | null> {
  // Try backend first
  try {
    const backendStats = await getDAOStatsFromBackend();
    if (backendStats) {
      console.log('Got DAO stats from backend');
      return backendStats;
    }
  } catch (e) {
    console.warn('Backend unavailable for DAO stats, falling back to Hiro');
  }

  // Fallback: existing Hiro API code
  try {
    console.log('Fetching DAO statistics (Hiro fallback)...');

    const result = await makeSmartApiCall(
      () => fetchCallReadOnlyFunction({
        network,
        contractAddress: daoContract.address,
        contractName: daoContract.name,
        functionName: 'get-dao-stats',
        functionArgs: [],
        senderAddress: userAddress || daoContract.address,
      }),
      '/get-dao-stats',
      {
        contractAddress: daoContract.address,
        contractName: daoContract.name,
        functionName: 'get-dao-stats',
        functionArgs: [],
        senderAddress: userAddress || daoContract.address,
      }
    );

    const statsData = cvToJSON(result);

    if (!statsData.value) {
      console.log('DAO stats returned null');
      return null;
    }

    // IMPORTANT: cvToJSON returns nested structure: {type: "...", value: {...}}
    // We need to access statsData.value.value to get the actual data
    const data = statsData.value.value || statsData.value;

    console.log('Raw DAO stats data:', data);

    const stats = {
      totalMembers: parseInt(data['total-members']?.value || '0'),
      maxMembers: parseInt(data['max-members']?.value || '100'),
      nextProposalId: parseInt(data['next-proposal-id']?.value || '1'),
      supermajorityThreshold: parseInt(data['supermajority-threshold']?.value || '70'),
      memberCount: parseInt(data['total-members']?.value || '0'), // Alias
    };

    console.log('Parsed DAO stats:', stats);
    return stats;
  } catch (error) {
    console.error('Error fetching DAO stats:', error);
    return null;
  }
}

// ===============================================
// WRITE FUNCTIONS (TRANSACTIONS)
// ===============================================

/**
 * Create a dispute resolution proposal (DAO members only)
 */
export async function proposeDisputeResolution(
  disputeId: number,
  description: string
): Promise<ProposalResponse> {
  try {
    console.log('Creating dispute resolution proposal:', {
      disputeId,
      description: description.substring(0, 50) + '...'
    });

    // Validate inputs
    if (!description || description.length === 0) {
      return { success: false, error: 'Proposal description is required' };
    }

    if (description.length > 500) {
      return { success: false, error: 'Proposal description must be 500 characters or less' };
    }

    return wrappedContractCall({
      network,
      contractAddress: daoContract.address,
      contractName: daoContract.name,
      functionName: 'propose-dispute-resolution',
      functionArgs: [
        uintCV(disputeId),
        stringUtf8CV(description)
      ],
      postConditions: [],
      postConditionMode: PostConditionMode.Allow,
    }, 'Propose Dispute Resolution');
  } catch (error) {
    console.error('Error creating proposal:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Failed to create proposal: ${errorMessage}`
    };
  }
}

/**
 * Create an escrow release proposal (DAO members only)
 */
export async function proposeEscrowRelease(
  contractId: number,
  description: string
): Promise<ProposalResponse> {
  try {
    console.log('Creating escrow release proposal:', { contractId, description });

    if (!description || description.length === 0) {
      return { success: false, error: 'Proposal description is required' };
    }

    if (description.length > 500) {
      return { success: false, error: 'Proposal description must be 500 characters or less' };
    }

    return wrappedContractCall({
      network,
      contractAddress: daoContract.address,
      contractName: daoContract.name,
      functionName: 'propose-escrow-release',
      functionArgs: [
        uintCV(contractId),
        stringUtf8CV(description)
      ],
      postConditions: [],
      postConditionMode: PostConditionMode.Allow,
    }, 'Propose Escrow Release');
  } catch (error) {
    console.error('Error creating escrow release proposal:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Failed to create proposal: ${errorMessage}`
    };
  }
}

/**
 * Vote on a proposal
 */
export async function voteOnProposal(
  proposalId: number,
  vote: VoteType
): Promise<VoteResponse> {
  try {
    console.log('Casting vote on proposal #', proposalId, ':', vote);

    // Validate vote type
    if (![VoteType.YES, VoteType.NO, VoteType.ABSTAIN].includes(vote)) {
      return { success: false, error: 'Invalid vote type' };
    }

    return wrappedContractCall({
      network,
      contractAddress: daoContract.address,
      contractName: daoContract.name,
      functionName: 'vote-on-proposal',
      functionArgs: [
        uintCV(proposalId),
        uintCV(vote)
      ],
      postConditions: [],
      postConditionMode: PostConditionMode.Allow,
    }, 'Vote on Proposal');
  } catch (error) {
    console.error('Error casting vote:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Failed to cast vote: ${errorMessage}`
    };
  }
}

/**
 * Manually finalize a proposal after voting period ends
 */
export async function finalizeProposal(proposalId: number): Promise<ProposalResponse> {
  try {
    console.log('Finalizing proposal #', proposalId);

    return wrappedContractCall({
      network,
      contractAddress: daoContract.address,
      contractName: daoContract.name,
      functionName: 'finalize-proposal-manual',
      functionArgs: [uintCV(proposalId)],
      postConditions: [],
      postConditionMode: PostConditionMode.Allow,
    }, 'Finalize Proposal');
  } catch (error) {
    console.error('Error finalizing proposal:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Failed to finalize proposal: ${errorMessage}`
    };
  }
}

// ===============================================
// HELPER FUNCTIONS
// ===============================================

/**
 * Check if user can vote on proposal
 */
export function canVoteOnProposal(proposal: Proposal, userAddress: string, hasVoted: boolean): boolean {
  // Must be active
  if (proposal.status !== ProposalStatus.ACTIVE) {
    return false;
  }

  // Must not have voted already
  if (hasVoted) {
    return false;
  }

  // Voting period must not have ended
  const currentBlockHeight = Date.now() / 1000; // Approximate
  if (currentBlockHeight >= proposal.votingEndsAt) {
    return false;
  }

  return true;
}

/**
 * Calculate time remaining for voting
 */
export function getVotingTimeRemaining(proposal: Proposal): {
  blocksRemaining: number;
  daysRemaining: number;
  hoursRemaining: number;
  isExpired: boolean;
} {
  const currentBlockHeight = Date.now() / 1000; // Approximate
  const blocksRemaining = Math.max(0, proposal.votingEndsAt - currentBlockHeight);

  // Assuming ~10 minutes per block
  const minutesRemaining = blocksRemaining * 10;
  const daysRemaining = Math.floor(minutesRemaining / (60 * 24));
  const hoursRemaining = Math.floor((minutesRemaining % (60 * 24)) / 60);

  return {
    blocksRemaining: Math.floor(blocksRemaining),
    daysRemaining,
    hoursRemaining,
    isExpired: blocksRemaining === 0
  };
}

/**
 * Calculate if proposal has reached threshold
 */
export function hasReachedThreshold(proposal: Proposal): boolean {
  const requiredVotes = Math.ceil((proposal.totalEligibleVoters * DAO_CONSTANTS.SUPERMAJORITY_THRESHOLD) / 100);
  return proposal.yesVotes >= requiredVotes;
}

// Export network and contract info for debugging
export const daoContractInfo = {
  network,
  contract: CONTRACTS.DAO,
  parsed: daoContract,
  constants: DAO_CONSTANTS,
};
