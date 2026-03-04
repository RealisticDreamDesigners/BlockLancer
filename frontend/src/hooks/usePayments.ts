'use client';

import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PostConditionMode } from '@stacks/transactions';
import { getNetwork } from '@/lib/networkConfig';
import {
  getUserTierFromBackend,
  getPlatformStatsFromBackend,
} from '@/lib/apiClient';
import { useStacks } from './useStacks';
import { useContractCall } from './useContractCall';

const CONTRACTS = {
  PAYMENTS: process.env.NEXT_PUBLIC_PAYMENTS_CONTRACT || 'ST30M31FNAKNX5EJKV10V7SJSE07VVDFFZHZHGE0J.blocklancer-payments-v2',
};

const parseContractId = (contractId: string) => {
  const [address, name] = contractId.split('.');
  return { address, name };
};

export function usePayments() {
  const { isSignedIn, userAddress } = useStacks();
  const network = getNetwork();
  const { execute } = useContractCall();
  const paymentsContract = parseContractId(CONTRACTS.PAYMENTS);

  const { data: userTier, isLoading: tierLoading } = useQuery({
    queryKey: ['userTier', userAddress],
    queryFn: () => getUserTierFromBackend(userAddress!),
    enabled: !!userAddress,
    staleTime: 60_000,
  });

  const { data: platformStats, isLoading: statsLoading } = useQuery({
    queryKey: ['platformStats'],
    queryFn: () => getPlatformStatsFromBackend(),
    staleTime: 60_000,
  });

  const upgradeToPro = useCallback(async () => {
    if (!isSignedIn) return { success: false, error: 'Not signed in' };

    return execute({
      callOptions: {
        network,
        contractAddress: paymentsContract.address,
        contractName: paymentsContract.name,
        functionName: 'upgrade-to-pro',
        functionArgs: [],
        postConditions: [],
        postConditionMode: PostConditionMode.Allow,
      },
      actionLabel: 'Upgrade to Pro',
    });
  }, [isSignedIn, network, paymentsContract, execute]);

  return {
    userTier,
    platformStats,
    tierLoading,
    statsLoading,
    isPro: (userTier?.tier ?? 0) >= 1,
    upgradeToPro,
  };
}
