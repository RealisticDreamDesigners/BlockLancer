'use client';

import React, { createContext, useContext, useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import { openContractCall } from '@stacks/connect';
import { submitPendingTx } from '@/lib/apiClient';
import { pollTxStatus, TxStatus } from '@/lib/txPoller';

// ===============================================
// TYPES
// ===============================================

export interface TrackedTx {
  txId: string;
  functionName: string;
  status: TxStatus;
  submittedAt: number;
}

export interface ContractCallOptions {
  /** Options passed directly to openContractCall */
  callOptions: Parameters<typeof openContractCall>[0];
  /** Human-readable label for toasts (e.g. "Create Escrow") */
  actionLabel: string;
  /** Optional callback after successful broadcast (receives txId) */
  onBroadcast?: (txId: string) => void;
  /** Optional callback after user cancels */
  onCancel?: () => void;
}

interface TransactionContextValue {
  /** Queued contract call execution — serializes TXs to prevent nonce conflicts */
  executeContractCall: (opts: ContractCallOptions) => Promise<{ success: boolean; txId?: string; error?: string }>;
  /** All tracked in-flight transactions */
  pendingTxs: TrackedTx[];
  /** Number of queued (not yet submitted) TXs */
  queueSize: number;
}

// ===============================================
// CONTEXT
// ===============================================

const TransactionContext = createContext<TransactionContextValue | null>(null);

export function useTransactionContext() {
  const ctx = useContext(TransactionContext);
  if (!ctx) {
    throw new Error('useTransactionContext must be used within a TransactionProvider');
  }
  return ctx;
}

// ===============================================
// PROVIDER
// ===============================================

const POLL_INTERVAL = 10_000; // 10 seconds

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const [pendingTxs, setPendingTxs] = useState<TrackedTx[]>([]);
  const [queueSize, setQueueSize] = useState(0);

  // Sequential queue implementation
  const queueRef = useRef<Array<{
    opts: ContractCallOptions;
    resolve: (result: { success: boolean; txId?: string; error?: string }) => void;
  }>>([]);
  const processingRef = useRef(false);

  // Track active polling intervals so we can clean them up
  const pollIntervalsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  const addTrackedTx = useCallback((txId: string, functionName: string) => {
    const tx: TrackedTx = { txId, functionName, status: 'pending', submittedAt: Date.now() };
    setPendingTxs(prev => [...prev, tx]);

    // Start polling
    const interval = setInterval(async () => {
      const result = await pollTxStatus(txId);
      if (result.status !== 'pending') {
        clearInterval(interval);
        pollIntervalsRef.current.delete(txId);

        setPendingTxs(prev => prev.map(t =>
          t.txId === txId ? { ...t, status: result.status } : t
        ));

        // Show final toast
        if (result.status === 'success') {
          toast.success(`Transaction confirmed`, { description: functionName });
        } else if (result.status === 'failed') {
          toast.error(`Transaction failed`, { description: functionName });
        } else if (result.status === 'dropped') {
          toast.error(`Transaction dropped`, { description: functionName });
        }

        // Remove from list after a short display period
        setTimeout(() => {
          setPendingTxs(prev => prev.filter(t => t.txId !== txId));
        }, 5000);
      }
    }, POLL_INTERVAL);

    pollIntervalsRef.current.set(txId, interval);
  }, []);

  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;

    while (queueRef.current.length > 0) {
      setQueueSize(queueRef.current.length);
      const item = queueRef.current[0];

      try {
        const result = await new Promise<{ success: boolean; txId?: string; error?: string }>((resolve) => {
          const { callOptions, actionLabel, onBroadcast, onCancel } = item.opts;

          const toastId = toast.loading(`${actionLabel}...`, { description: 'Waiting for wallet approval' });

          openContractCall({
            ...callOptions,
            onFinish: (data: any) => {
              const txId = data.txId;
              toast.success(`${actionLabel} submitted`, {
                id: toastId,
                description: `TX: ${txId.slice(0, 10)}...`,
              });

              // Register for tracking + polling
              addTrackedTx(txId, actionLabel);

              // Submit to backend for optimistic UI (non-blocking)
              submitPendingTx({
                txId,
                functionName: callOptions.functionName,
                contractName: callOptions.contractName,
                args: {},
                senderAddress: '',
              }).catch(() => {});

              onBroadcast?.(txId);

              // Call the original onFinish if provided
              callOptions.onFinish?.(data);

              resolve({ success: true, txId });
            },
            onCancel: () => {
              toast.warning(`${actionLabel} cancelled`, {
                id: toastId,
                description: 'Transaction was cancelled in wallet',
              });

              onCancel?.();
              callOptions.onCancel?.();

              resolve({ success: false, error: 'Transaction cancelled by user' });
            },
          });
        });

        item.resolve(result);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        toast.error(`${item.opts.actionLabel} failed`, { description: errorMessage });
        item.resolve({ success: false, error: errorMessage });
      }

      // Remove processed item
      queueRef.current.shift();
      setQueueSize(queueRef.current.length);
    }

    processingRef.current = false;
  }, [addTrackedTx]);

  const executeContractCall = useCallback((opts: ContractCallOptions): Promise<{ success: boolean; txId?: string; error?: string }> => {
    return new Promise((resolve) => {
      queueRef.current.push({ opts, resolve });
      setQueueSize(queueRef.current.length);
      processQueue();
    });
  }, [processQueue]);

  return (
    <TransactionContext.Provider value={{ executeContractCall, pendingTxs, queueSize }}>
      {children}
    </TransactionContext.Provider>
  );
}
