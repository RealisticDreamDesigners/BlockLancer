'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  AppConfig,
  UserSession,
  showConnect,
} from '@stacks/connect';
import { 
  fetchCallReadOnlyFunction,
  cvToJSON,
  uintCV,
  stringUtf8CV,
  standardPrincipalCV,
  PostConditionMode,
  validateStacksAddress
} from '@stacks/transactions';
import { getNetwork, getNetworkType } from '@/lib/networkConfig';
import {
  getEscrowCountFromBackend,
  getEscrowFromBackend,
  getUserEscrowsFromBackend,
  getEscrowMilestonesFromBackend,
} from '@/lib/apiClient';

import { Contract, Milestone, TransactionResponse, isValidStacksAddress } from '@/types';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useContractCall } from './useContractCall';

// Initialize App Config and Session
const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });

function convertSmartContractTimeToTimestamp(value: number): number {
  if (!value || value === 0) {
    return Date.now();
  }

  if (value > 1000000000) {
    console.log(`🕐 Detected Unix timestamp: ${value} (${new Date(value * 1000).toISOString()})`);
    return value * 1000;

  } else if (value >= 100000 && value <= 300000) {
    console.log(`🧱 Detected block height: ${value}`);
    return convertBlockHeightToTimestamp(value);

  } else {
    console.warn(`⚠️ Unexpected time value: ${value}, using current time`);
    return Date.now();
  }
}

function convertBlockHeightToTimestamp(blockHeight: number): number {
  // Stacks testnet approximation
  const TESTNET_GENESIS_TIMESTAMP = 1610000000; // Jan 2021 approximate
  const AVERAGE_BLOCK_TIME = 600; // 10 minutes in seconds

  const approximateTimestamp = TESTNET_GENESIS_TIMESTAMP + (blockHeight * AVERAGE_BLOCK_TIME);
  return approximateTimestamp * 1000; // Convert to milliseconds
}

// ✅ FALLBACK: Proxy-based API calls for CORS issues
const makeProxyApiCall = async (endpoint: string, body?: any) => {
  const proxyUrl = `/api/stacks${endpoint}`;

  try {

    // ✅ FIX: Handle BigInt serialization
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
    console.error('❌ Proxy API call failed:', error);
    throw error;
  }
};

// ✅ SMART API CALL with fallback strategy
const makeSmartApiCall = async (apiCall: () => Promise<any>, fallbackEndpoint?: string, fallbackBody?: any) => {
  try {
    // First try direct Stacks.js call with API key
    console.log('🎯 Attempting direct Stacks.js API call...');
    return await apiCall();
  } catch (error: any) {
    console.warn('⚠️ Direct call failed:', {
      message: error.message,
      status: error.status,
      code: error.code,
      details: error
    });

    if (fallbackEndpoint) {
      try {
        console.log('🔄 Trying proxy fallback for:', fallbackEndpoint);
        return await makeProxyApiCall(fallbackEndpoint, fallbackBody);
      } catch (proxyError: any) {
        console.error('❌ Both direct and proxy calls failed:', {
          directError: error.message,
          proxyError: proxyError.message,
          fallbackEndpoint
        });
        throw proxyError;
      }
    } else {
      throw error;
    }
  }
};

const network = getNetwork();

// Contract Configuration
const CONTRACTS = {
  ESCROW: process.env.NEXT_PUBLIC_ESCROW_CONTRACT || 'ST30M31FNAKNX5EJKV10V7SJSE07VVDFFZHZHGE0J.blocklancer-escrow-v4',
  PAYMENTS: process.env.NEXT_PUBLIC_PAYMENTS_CONTRACT || 'ST30M31FNAKNX5EJKV10V7SJSE07VVDFFZHZHGE0J.blocklancer-payments-v2',
  DISPUTE: process.env.NEXT_PUBLIC_DISPUTE_CONTRACT || 'ST30M31FNAKNX5EJKV10V7SJSE07VVDFFZHZHGE0J.blocklancer-dispute-v5',
  DAO: process.env.NEXT_PUBLIC_DAO_CONTRACT || 'ST30M31FNAKNX5EJKV10V7SJSE07VVDFFZHZHGE0J.blocklancer-dao-v3',
  REPUTATION: process.env.NEXT_PUBLIC_REPUTATION_CONTRACT || 'ST30M31FNAKNX5EJKV10V7SJSE07VVDFFZHZHGE0J.blocklancer-reputation',
  MARKETPLACE: process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT || 'ST30M31FNAKNX5EJKV10V7SJSE07VVDFFZHZHGE0J.blocklancer-marketplace',
};

const parseContractId = (contractId: string) => {
  const [address, name] = contractId.split('.');
  return { address, name };
};

const escrowContract = parseContractId(CONTRACTS.ESCROW);

// ✅ FIXED: CACHING CONFIGURATION - Use Map consistently
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const contractCache = new Map<string, { data: any; timestamp: number }>();

const isDataFresh = (timestamp: number) => {
  return Date.now() - timestamp < CACHE_DURATION;
};

const getCachedData = <T>(key: string): T | null => {
  const cached = contractCache.get(key);
  if (cached && isDataFresh(cached.timestamp)) {
    console.log(`📋 Using cached data for ${key}`);
    return cached.data;
  }
  return null;
};

const setCachedData = <T>(key: string, data: T) => {
  contractCache.set(key, { data, timestamp: Date.now() });
  console.log(`💾 Cached data for ${key}`);
};

// React Query Configuration
const QUERY_KEYS = {
  contracts: (userAddress: string) => ['contracts', userAddress],
  contractDetails: (contractId: number) => ['contract', contractId],
  milestones: (contractId: number) => ['milestones', contractId],
  totalContracts: () => ['totalContracts']
};

const QUERY_CONFIG = {
  staleTime: 2 * 60 * 1000, // 2 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes
  retry: 2,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
};

export const useStacks = () => {
  const [mounted, setMounted] = useState(false);
  const [transactionInProgress, setTransactionInProgress] = useState(false);
  const [isPollingEnabled, setIsPollingEnabled] = useState(false);
  const queryClient = useQueryClient();
  const { execute } = useContractCall();

  // ✅ USER SESSION MANAGEMENT
  const [userData, setUserData] = useState<any>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userAddress, setUserAddress] = useState<string | undefined>(undefined);

  useEffect(() => {
    setMounted(true);
    
    if (userSession.isUserSignedIn()) {
      const userData = userSession.loadUserData();
      setUserData(userData);
      setIsSignedIn(true);
      
      const address = userData?.profile?.stxAddress?.testnet || userData?.profile?.stxAddress?.mainnet;
      setUserAddress(address);
      
      console.log('✅ User already signed in:', address);
    }
  }, []);

  // ✅ CORE FETCH FUNCTIONS with Smart API Calls

  const fetchTotalContractsCount = useCallback(async (): Promise<number> => {
    const cacheKey = 'totalContracts';
    const cached = getCachedData<number>(cacheKey);
    if (cached !== null) return cached;

    // Try backend first
    try {
      const backendCount = await getEscrowCountFromBackend();
      if (backendCount !== null) {
        console.log(`✅ Got total contracts from backend: ${backendCount}`);
        setCachedData(cacheKey, backendCount);
        return backendCount;
      }
    } catch (e) {
      console.warn('Backend unavailable for total contracts, falling back to Hiro');
    }

    // Fallback: existing Hiro API code
    try {

      const result = await makeSmartApiCall(
        () => fetchCallReadOnlyFunction({
          network,
          contractAddress: escrowContract.address,
          contractName: escrowContract.name,
          functionName: 'get-total-contracts',
          functionArgs: [],
          senderAddress: escrowContract.address,
        }),
        '/get-total-contracts',
        {
          contractAddress: escrowContract.address,
          contractName: escrowContract.name,
          functionName: 'get-total-contracts',
          functionArgs: [],
          senderAddress: escrowContract.address,
        }
      );

      const totalContracts = result.value ? parseInt(result.value) : 0;

      setCachedData(cacheKey, totalContracts);
      return totalContracts;
    } catch (error) {
      console.error('❌ Error fetching total contracts:', error);
      return 0;
    }
  }, []);

  const fetchMilestoneById = useCallback(async (contractId: number, milestoneId: number): Promise<Milestone | null> => {
    const cacheKey = `milestone-${contractId}-${milestoneId}`;
    const cached = getCachedData<Milestone>(cacheKey);
    if (cached !== null) return cached;

    try {

      const result = await makeSmartApiCall(
        () => fetchCallReadOnlyFunction({
          network,
          contractAddress: escrowContract.address,
          contractName: escrowContract.name,
          functionName: 'get-milestone',
          functionArgs: [uintCV(contractId), uintCV(milestoneId)],
          senderAddress: userAddress || escrowContract.address,
        }),
        '/get-milestone',
        {
          contractAddress: escrowContract.address,
          contractName: escrowContract.name,
          functionName: 'get-milestone',
          functionArgs: [contractId, milestoneId], // ✅ FIX: Use plain numbers instead of uintCV for proxy
          senderAddress: userAddress || escrowContract.address,
        }
      );

      const milestoneData = cvToJSON(result);
      
      if (milestoneData.value === null) {
        return null;
      }

      const data = milestoneData.value.value || milestoneData.value;
      
      const milestone: Milestone = {
        id: milestoneId,
        description: data.description?.value || data.description || '',
        amount: parseInt(data.amount?.value || data.amount || '0'),
        deadline: convertSmartContractTimeToTimestamp(parseInt(data.deadline?.value || data.deadline || '0')),
        status: parseInt(data.status?.value || data.status || '0'),
        submissionNotes: data['submission-note']?.value || data['submission-note'] || '',
        rejectionReason: data['rejection-reason']?.value || data['rejection-reason'] || '',
      };

      console.log(`✅ Fetched milestone ${contractId}-${milestoneId}:`, milestone);
      setCachedData(cacheKey, milestone);
      return milestone;
    } catch (error) {
      console.error(`❌ Error fetching milestone ${contractId}-${milestoneId}:`, error);
      return null;
    }
  }, [userAddress]);

  const fetchMilestonesByContract = useCallback(async (contractId: number): Promise<Milestone[]> => {
    const cacheKey = `milestones-${contractId}`;
    const cached = getCachedData<Milestone[]>(cacheKey);
    if (cached !== null) return cached;

    try {
      console.log(`📋 Fetching milestones for contract ${contractId}`);
      const milestones: Milestone[] = [];
      
      // Try to fetch up to 50 milestones (reasonable limit)
      for (let i = 1; i <= 50; i++) {
        const milestone = await fetchMilestoneById(contractId, i);
        if (milestone === null) break; // No more milestones
        milestones.push(milestone);
      }
      
      console.log(`✅ Found ${milestones.length} milestones for contract ${contractId}`);
      setCachedData(cacheKey, milestones);
      return milestones;
    } catch (error) {
      console.error(`❌ Error fetching milestones for contract ${contractId}:`, error);
      return [];
    }
  }, [fetchMilestoneById]);

  const fetchContractByIdInternal = useCallback(async (contractId: number): Promise<Contract | null> => {
    const cacheKey = `contract-${contractId}`;
    const cached = getCachedData<Contract>(cacheKey);
    if (cached !== null) return cached;

    // Try backend first
    try {
      const backendEscrow = await getEscrowFromBackend(contractId);
      if (backendEscrow) {
        const contract: Contract = {
          id: backendEscrow.id,
          client: backendEscrow.client,
          freelancer: backendEscrow.freelancer,
          totalAmount: backendEscrow.totalAmount,
          remainingBalance: backendEscrow.remainingBalance,
          status: backendEscrow.status,
          createdAt: backendEscrow.createdAt > 1000000000 ? backendEscrow.createdAt * 1000 : backendEscrow.createdAt,
          endDate: backendEscrow.endDate > 1000000000 ? backendEscrow.endDate * 1000 : backendEscrow.endDate,
          description: backendEscrow.description,
          milestones: (backendEscrow.milestones || []).map(m => ({
            id: m.id,
            description: m.description,
            amount: m.amount,
            deadline: m.deadline > 1000000000 ? m.deadline * 1000 : m.deadline,
            status: m.status,
            submissionNotes: m.submissionNote,
            rejectionReason: m.rejectionReason,
          })),
        };
        console.log(`✅ Got contract ${contractId} from backend`);
        setCachedData(cacheKey, contract);
        return contract;
      }
    } catch (e) {
      console.warn(`Backend unavailable for contract ${contractId}, falling back to Hiro`);
    }

    // Fallback: existing Hiro API code
    try {
      console.log(`🔍 Fetching contract ID: ${contractId} (Hiro fallback)`);

      const result = await makeSmartApiCall(
        () => fetchCallReadOnlyFunction({
          network,
          contractAddress: escrowContract.address,
          contractName: escrowContract.name,
          functionName: 'get-contract',
          functionArgs: [uintCV(contractId)],
          senderAddress: escrowContract.address,
        }),
        '/get-contract',
        {
          contractAddress: escrowContract.address,
          contractName: escrowContract.name,
          functionName: 'get-contract',
          functionArgs: [contractId], // ✅ FIX: Use plain number instead of uintCV for proxy
          senderAddress: escrowContract.address,
        }
      );

      const contractData = cvToJSON(result);
      
      if (contractData && contractData.value && contractData.value.value) {
        // Fetch milestones for this contract
        const milestones = await fetchMilestonesByContract(contractId);
        
        const data = contractData.value.value;
        
        const contract: Contract = {
          id: contractId,
          client: data.client?.value || data.client,
          freelancer: data.freelancer?.value || data.freelancer,
          totalAmount: parseInt(data['total-amount']?.value || data['total-amount']),
          remainingBalance: parseInt(data['remaining-balance']?.value || data['remaining-balance']),
          status: parseInt(data.status?.value || data.status),
          createdAt: convertSmartContractTimeToTimestamp(parseInt(data['created-at']?.value || data['created-at'])),
          endDate: convertSmartContractTimeToTimestamp(parseInt(data['end-date']?.value || data['end-date'])),
          description: data.description?.value || data.description,
          milestones: milestones
        };
        
        console.log(`✅ Fetched contract ${contractId}:`, contract);
        setCachedData(cacheKey, contract);
        return contract;
      } else {
        console.log(`❌ No data found for contract ${contractId}`);
        return null;
      }
    } catch (error) {
      console.error(`❌ Error fetching contract ${contractId}:`, error);
      return null;
    }
  }, [fetchMilestonesByContract]);

  const fetchUserContractsInternal = useCallback(async (userAddress: string): Promise<Contract[]> => {
    if (!userAddress) return [];

    // Try backend first — much faster since it has indexed data
    try {
      const backendEscrows = await getUserEscrowsFromBackend(userAddress);
      if (backendEscrows && backendEscrows.length >= 0) {
        console.log(`✅ Got ${backendEscrows.length} contracts from backend for user`);
        const contracts: Contract[] = backendEscrows.map(e => ({
          id: e.id,
          client: e.client,
          freelancer: e.freelancer,
          totalAmount: e.totalAmount,
          remainingBalance: e.remainingBalance,
          status: e.status,
          createdAt: e.createdAt > 1000000000 ? e.createdAt * 1000 : e.createdAt,
          endDate: e.endDate > 1000000000 ? e.endDate * 1000 : e.endDate,
          description: e.description,
          milestones: (e.milestones || []).map(m => ({
            id: m.id,
            description: m.description,
            amount: m.amount,
            deadline: m.deadline > 1000000000 ? m.deadline * 1000 : m.deadline,
            status: m.status,
            submissionNotes: m.submissionNote,
            rejectionReason: m.rejectionReason,
          })),
        }));
        return contracts;
      }
    } catch (e) {
      console.warn('Backend unavailable for user contracts, falling back to Hiro');
    }

    // Fallback: existing Hiro API code
    try {
      console.log(`🚀 Fetching contracts for user ${userAddress}`);
      const totalContracts = await fetchTotalContractsCount();
      console.log(`📊 Checking ${totalContracts} contracts for user involvement...`);
      
      const contracts: Contract[] = [];
      
      // Process contracts in smaller batches with delays to avoid rate limits
      const batchSize = 3;
      for (let i = 1; i <= totalContracts; i += batchSize) {
        const batch = [];
        for (let j = i; j < Math.min(i + batchSize, totalContracts + 1); j++) {
          batch.push(fetchContractByIdInternal(j));
        }
        
        const batchResults = await Promise.all(batch);
        
        for (const contract of batchResults) {
          if (contract && (contract.client === userAddress || contract.freelancer === userAddress)) {
            contracts.push(contract);
            console.log(`✅ Added contract ${contract.id} (user is ${contract.client === userAddress ? 'client' : 'freelancer'})`);
          }
        }
        
        // Add delay between batches to be gentle on the API
        if (i + batchSize <= totalContracts) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      console.log(`🎯 RESULT: Found ${contracts.length} contracts for user`);
      return contracts;
    } catch (error) {
      console.error('❌ Error fetching user contracts:', error);
      return [];
    }
  }, [fetchTotalContractsCount, fetchContractByIdInternal]);

  // ✅ REACT QUERY HOOKS
  const {
    data: allContracts = [],
    isLoading: contractsLoading,
    refetch: refetchContracts,
  } = useQuery({
    queryKey: QUERY_KEYS.contracts(userAddress || ''),
    queryFn: () => fetchUserContractsInternal(userAddress!),
    enabled: !!userAddress && isSignedIn,
    ...QUERY_CONFIG,
    // refetchInterval: isPollingEnabled ? 30000 : false, // Poll every 30 seconds if enabled
  });

  // ✅ DERIVED STATE
  const clientContracts = allContracts.filter(contract => contract.client === userAddress);
  const freelancerContracts = allContracts.filter(contract => contract.freelancer === userAddress);

  // ✅ REFRESH FUNCTIONS - Declare BEFORE createEscrow
  const refreshContracts = useCallback(async () => {
    if (!userAddress) return;
    
    console.log('🔄 Refreshing contracts...');
    // ✅ FIXED: Use Map methods consistently
    contractCache.clear();
    // Invalidate React Query cache
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contracts(userAddress) });
    await refetchContracts();
  }, [userAddress, queryClient, refetchContracts]);

  const debugContractSystem = useCallback(async () => {
    try {
      console.log('🔍 DEBUG: Contract System Status');
      console.log('📡 Network:', network);
      console.log('👤 User Address:', userAddress);
      console.log('🔐 Is Signed In:', isSignedIn);
      console.log('📊 Client Contracts:', clientContracts.length);
      console.log('💼 Freelancer Contracts:', freelancerContracts.length);
      console.log('⚙️ Contracts Config:', CONTRACTS);
      console.log('🏗️ Escrow Contract:', escrowContract);

      // Test if contract exists
      try {
        console.log('🧪 Testing contract existence...');
        const contractInfo = await fetch(`https://api.testnet.hiro.so/v1/contracts/${escrowContract.address}/${escrowContract.name}`);
        console.log('📋 Contract Info Response:', contractInfo.status, contractInfo.statusText);

        if (contractInfo.ok) {
          const contractData = await contractInfo.json();
          console.log('✅ Contract exists:', contractData);
        } else {
          console.log('❌ Contract does not exist or is not deployed');

          // Try to check if any version of the contract exists
          console.log('🔍 Checking for other contract versions...');
          const versions = ['blocklancer-escrow', 'blocklancer-escrow-v2', 'blocklancer-escrow-v3', 'blocklancer-escrow-v4'];
          for (const version of versions) {
            try {
              const versionCheck = await fetch(`https://api.testnet.hiro.so/v1/contracts/${escrowContract.address}/${version}`);
              console.log(`📋 ${version}: ${versionCheck.status} ${versionCheck.statusText}`);
            } catch (e) {
              console.log(`❌ Error checking ${version}:`, e);
            }
          }
        }
      } catch (contractError) {
        console.error('❌ Error checking contract existence:', contractError);
      }

      if (userAddress) {
        console.log('🔄 Fetching fresh contract data...');
        const totalContracts = await fetchTotalContractsCount();
        console.log('📈 Total Contracts on Blockchain:', totalContracts);
      }
    } catch (error) {
      console.error('❌ Debug Error:', error);
    }
  }, [userAddress, isSignedIn, clientContracts, freelancerContracts, fetchTotalContractsCount]);

  // ✅ WALLET CONNECTION
  const connectWallet = useCallback(() => {
    console.log('🔌 Connecting wallet...');

    showConnect({
      appDetails: {
        name: 'BlockLancer',
        icon: typeof window !== 'undefined' ? `${window.location.origin}/logo.png` : '',
      },
      redirectTo: '/',
      onFinish: () => {
        console.log('✅ Wallet connected successfully');

        // Force reload user data
        window.location.reload();
      },
      onCancel: () => {
        console.log('❌ Wallet connection cancelled');
      },
    });
  }, []);

  const disconnectWallet = useCallback(() => {
    userSession.signUserOut('/');
    setUserData(null);
    setIsSignedIn(false);
    setUserAddress(undefined);
    queryClient.clear();
    console.log('🔌 Wallet disconnected');
  }, [queryClient]);

  // ✅ CONTRACT CREATION with proper validation (KEEP THIS!)
  const createEscrow = useCallback(async (
    client: string,          
    freelancer: string,     
    description: string,  
    endDate: number,    
    totalAmount: number  
  ): Promise<TransactionResponse> => {
    
    if (!isSignedIn || !userData) {
      return { success: false, error: 'Wallet not connected' };
    }

    // ✅ FIXED: Use correct function name
    if (!isValidStacksAddress(freelancer)) {
      return { success: false, error: 'Invalid freelancer address format' };
    }

    if (freelancer === userAddress) {
      return { success: false, error: 'You cannot create a contract with yourself' };
    }

    setTransactionInProgress(true);

    try {
      const result = await execute({
        callOptions: {
          network,
          contractAddress: escrowContract.address,
          contractName: escrowContract.name,
          functionName: 'create-escrow',
          functionArgs: [
            standardPrincipalCV(client),
            standardPrincipalCV(freelancer),
            stringUtf8CV(description),
            uintCV(endDate),
            uintCV(totalAmount)
          ],
          postConditions: [],
          postConditionMode: PostConditionMode.Allow,
        },
        actionLabel: 'Create Escrow',
        onBroadcast: () => {
          setTimeout(() => {
            contractCache.clear();
            if (userAddress) {
              queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contracts(userAddress) });
            }
          }, 2000);
        },
      });

      setTransactionInProgress(false);
      return result;
    } catch (error) {
      console.error('Error in createEscrow:', error);
      setTransactionInProgress(false);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: `Contract creation failed: ${errorMessage}`
      };
    }
  }, [isSignedIn, userData, userAddress, network, queryClient, execute]);

  // ✅ REAL-TIME CONTROLS
  const enableRealTimeUpdates = useCallback(() => {
    setIsPollingEnabled(true);
    console.log('🔄 Real-time updates enabled');
  }, []);

  const disableRealTimeUpdates = useCallback(() => {
    setIsPollingEnabled(false);
    console.log('⏸️ Real-time updates disabled');
  }, []);

  const enableActivePolling = enableRealTimeUpdates;
  const disableActivePolling = disableRealTimeUpdates;

  // ✅ ADDRESS VALIDATION HELPER (KEEP THIS!)
  const validateAddress = useCallback((address: string) => {
    return validateStacksAddress(address);
  }, []);



  // ✅ FIXED addMilestone function - expects Unix timestamp (not block height)
  const addMilestone = useCallback(async (
    contractId: number,
    description: string,
    amount: number,
    deadline: number  // ✅ Now expects Unix timestamp in SECONDS
  ): Promise<TransactionResponse> => {
    
    if (!isSignedIn || !userData) {
      return { success: false, error: 'Wallet not connected' };
    }

    console.log('🔧 DEBUG: addMilestone called with:', {
      contractId,
      description: description.substring(0, 30) + '...',
      amount: `${amount} microSTX (${amount / 1000000} STX)`,
      deadline: `Unix timestamp ${deadline} (${new Date(deadline * 1000).toISOString()})`,
      userAddress,
      network: process.env.NEXT_PUBLIC_NETWORK
    });

    setTransactionInProgress(true);

    try {
      const result = await execute({
        callOptions: {
          network,
          contractAddress: escrowContract.address,
          contractName: escrowContract.name,
          functionName: 'add-milestone',
          functionArgs: [
            uintCV(contractId),
            stringUtf8CV(description),
            uintCV(amount),
            uintCV(deadline)
          ],
          postConditions: [],
          postConditionMode: PostConditionMode.Allow,
        },
        actionLabel: 'Add Milestone',
        onBroadcast: () => {
          setTimeout(() => {
            contractCache.delete(`contract-${contractId}`);
            contractCache.delete(`milestones-${contractId}`);
            if (userAddress) {
              queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contracts(userAddress) });
            }
          }, 2000);
        },
      });

      setTransactionInProgress(false);
      return result;
    } catch (error) {
      console.error('Error in addMilestone:', error);
      setTransactionInProgress(false);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: `Milestone creation failed: ${errorMessage}`
      };
    }
  }, [isSignedIn, userData, userAddress, network, queryClient, execute]);

  const submitMilestone = useCallback(async (
    contractId: number,
    milestoneIndex: number,
    submissionNote: string
  ): Promise<TransactionResponse> => {
    if (!isSignedIn || !userData) {
      return { success: false, error: 'Please connect your wallet first' };
    }

    setTransactionInProgress(true);

    try {
      const result = await execute({
        callOptions: {
          network,
          contractAddress: escrowContract.address,
          contractName: escrowContract.name,
          functionName: 'submit-milestone',
          functionArgs: [
            uintCV(contractId),
            uintCV(milestoneIndex),
            stringUtf8CV(submissionNote)
          ],
          postConditions: [],
          postConditionMode: PostConditionMode.Allow,
        },
        actionLabel: 'Submit Milestone',
        onBroadcast: () => {
          setTimeout(() => {
            contractCache.delete(`contract-${contractId}`);
            contractCache.delete(`milestones-${contractId}`);
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contracts(userAddress!) });
          }, 2000);
        },
      });

      setTransactionInProgress(false);
      return result;
    } catch (error) {
      setTransactionInProgress(false);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }, [isSignedIn, userData, userAddress, network, queryClient, execute]);

  const approveMilestone = useCallback(async (
    contractId: number,
    milestoneIndex: number
  ): Promise<TransactionResponse> => {
    if (!isSignedIn || !userData) {
      return { success: false, error: 'Please connect your wallet first' };
    }

    try {
      setTransactionInProgress(true);

      const result = await execute({
        callOptions: {
          network,
          contractAddress: escrowContract.address,
          contractName: escrowContract.name,
          functionName: 'approve-milestone',
          functionArgs: [
            uintCV(contractId),
            uintCV(milestoneIndex)
          ],
          postConditionMode: PostConditionMode.Allow,
        },
        actionLabel: 'Approve Milestone',
        onBroadcast: () => {
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contracts(userAddress!) });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contractDetails(contractId) });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.milestones(contractId) });
            contractCache.delete(`contract-${contractId}`);
            contractCache.delete(`milestones-${contractId}`);
          }, 2000);
        },
      });

      setTransactionInProgress(false);
      return result;
    } catch (error: any) {
      console.error('Error approving milestone:', error);
      setTransactionInProgress(false);
      const errorMessage = error?.message || 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }, [isSignedIn, userData, userAddress, queryClient, execute]);

  const rejectMilestone = useCallback(async (
    contractId: number,
    milestoneIndex: number,
    rejectionReason: string
  ): Promise<TransactionResponse> => {
    if (!isSignedIn || !userData) {
      return { success: false, error: 'Please connect your wallet first' };
    }

    setTransactionInProgress(true);

    try {
      const result = await execute({
        callOptions: {
          network,
          contractAddress: escrowContract.address,
          contractName: escrowContract.name,
          functionName: 'reject-milestone',
          functionArgs: [
            uintCV(contractId),
            uintCV(milestoneIndex),
            stringUtf8CV(rejectionReason)
          ],
          postConditions: [],
          postConditionMode: PostConditionMode.Allow,
        },
        actionLabel: 'Reject Milestone',
        onBroadcast: () => {
          setTimeout(() => {
            contractCache.delete(`contract-${contractId}`);
            contractCache.delete(`milestones-${contractId}`);
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contracts(userAddress!) });
          }, 2000);
        },
      });

      setTransactionInProgress(false);
      return result;
    } catch (error) {
      setTransactionInProgress(false);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }, [isSignedIn, userData, userAddress, network, queryClient, execute]);

  const claimDeadlineRefund = useCallback(async (
    contractId: number,
    milestoneIndex: number
  ): Promise<TransactionResponse> => {
    if (!isSignedIn || !userData) {
      return { success: false, error: 'Please connect your wallet first' };
    }

    setTransactionInProgress(true);

    try {
      const result = await execute({
        callOptions: {
          network,
          contractAddress: escrowContract.address,
          contractName: escrowContract.name,
          functionName: 'claim-deadline-refund',
          functionArgs: [
            uintCV(contractId),
            uintCV(milestoneIndex)
          ],
          postConditions: [],
          postConditionMode: PostConditionMode.Allow,
        },
        actionLabel: 'Claim Deadline Refund',
        onBroadcast: () => {
          setTimeout(() => {
            contractCache.delete(`contract-${contractId}`);
            contractCache.delete(`milestones-${contractId}`);
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contracts(userAddress!) });
          }, 2000);
        },
      });

      setTransactionInProgress(false);
      return result;
    } catch (error) {
      setTransactionInProgress(false);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }, [isSignedIn, userData, userAddress, network, queryClient, execute]);

  if (!mounted) {
    return {
      userData: null,
      isSignedIn: false,
      loading: true,
      transactionInProgress: false,
      userAddress: undefined,
      clientContracts: [],
      freelancerContracts: [],
      allContracts: [],
      network,
      contracts: CONTRACTS,
      connectWallet: () => {},
      disconnectWallet: () => {},
      refreshContracts: () => {},
      fetchUserContracts: () => Promise.resolve([]),
      fetchContractById: () => Promise.resolve(null),
      fetchMilestonesByContract: () => Promise.resolve([]),
      createEscrow: () => Promise.resolve({ success: false, error: 'Not mounted' }),
      addMilestone: () => Promise.resolve({ success: false, error: 'Not mounted' }),
      submitMilestone: () => Promise.resolve({ success: false, error: 'Not mounted' }),
      approveMilestone: () => Promise.resolve({ success: false, error: 'Not mounted' }),
      rejectMilestone: () => Promise.resolve({ success: false, error: 'Not mounted' }),
      claimDeadlineRefund: () => Promise.resolve({ success: false, error: 'Not mounted' }),
      enableRealTimeUpdates: () => {},
      // disableRealTimeUpdates: () => {},
      isPollingEnabled: false,
      validateAddress: () => false,
    };
  }

  return {
    userData,
    isSignedIn,
    loading: contractsLoading,
    transactionInProgress,
    userAddress,
    
    // Contract arrays
    clientContracts,
    freelancerContracts,
    allContracts,
    
    // Network and contracts
    network,
    contracts: CONTRACTS,
    
    // Actions
    connectWallet,
    disconnectWallet,
    refreshContracts,
    
    // Contract operations
    fetchUserContracts: fetchUserContractsInternal,
    fetchContractById: fetchContractByIdInternal,
    fetchMilestonesByContract,
    
    // Enhanced contract creation (with validation kept)
    createEscrow,
    
    // Milestone operations
    addMilestone,
    submitMilestone,
    approveMilestone,
    rejectMilestone,
    claimDeadlineRefund,

    // Real-time control
    enableRealTimeUpdates,
    disableRealTimeUpdates,
    isPollingEnabled,
    
    // Address validation (kept as requested)
    validateAddress,
    enableActivePolling,
    disableActivePolling,
    debugContractSystem,
  };
};
