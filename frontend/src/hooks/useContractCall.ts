'use client';

import { useCallback } from 'react';
import { useTransactionContext, ContractCallOptions } from '@/contexts/TransactionContext';

/**
 * Hook wrapper for contract calls with built-in toast notifications,
 * pending TX tracking, and sequential queue (nonce conflict prevention).
 *
 * Usage:
 *   const { execute } = useContractCall();
 *   const result = await execute({
 *     callOptions: { network, contractAddress, contractName, functionName, functionArgs, ... },
 *     actionLabel: 'Create Escrow',
 *   });
 */
export function useContractCall() {
  const { executeContractCall, pendingTxs, queueSize } = useTransactionContext();

  const execute = useCallback(
    (opts: ContractCallOptions) => executeContractCall(opts),
    [executeContractCall]
  );

  return { execute, pendingTxs, queueSize };
}
