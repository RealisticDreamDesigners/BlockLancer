'use client';

import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { boolCV, PostConditionMode } from '@stacks/transactions';
import { getNetwork } from '@/lib/networkConfig';
import { getAllPauseStatesFromBackend, BackendPauseState } from '@/lib/apiClient';
import { useStacks } from './useStacks';
import { useContractCall } from './useContractCall';

export function usePauseState() {
  const { isSignedIn, contracts } = useStacks();
  const network = getNetwork();
  const queryClient = useQueryClient();
  const { execute } = useContractCall();

  const { data: pauseStates, isLoading } = useQuery({
    queryKey: ['pauseStates'],
    queryFn: () => getAllPauseStatesFromBackend(),
    staleTime: 30_000,
  });

  const setPaused = useCallback(async (contractId: string, paused: boolean) => {
    if (!isSignedIn) return { success: false, error: 'Not signed in' };

    const [address, name] = contractId.split('.');

    return execute({
      callOptions: {
        network,
        contractAddress: address,
        contractName: name,
        functionName: 'set-paused',
        functionArgs: [boolCV(paused)],
        postConditions: [],
        postConditionMode: PostConditionMode.Allow,
      },
      actionLabel: paused ? 'Pause Contract' : 'Unpause Contract',
      onBroadcast: () => {
        setTimeout(() => queryClient.invalidateQueries({ queryKey: ['pauseStates'] }), 2000);
      },
    });
  }, [isSignedIn, network, queryClient, execute]);

  const isContractPaused = useCallback((contractName: string): boolean => {
    if (!pauseStates) return false;
    const state = pauseStates.find((s: BackendPauseState) => s.contract_name === contractName);
    return state?.is_paused ?? false;
  }, [pauseStates]);

  const anyContractPaused = pauseStates?.some((s: BackendPauseState) => s.is_paused) ?? false;

  return {
    pauseStates,
    isLoading,
    setPaused,
    isContractPaused,
    anyContractPaused,
  };
}
