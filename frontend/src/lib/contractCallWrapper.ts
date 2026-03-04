import { toast } from 'sonner';
import { openContractCall } from '@stacks/connect';
import { submitPendingTx } from '@/lib/apiClient';

/**
 * Standalone wrapper for openContractCall with toast notifications.
 * Use this in non-hook files (disputeContract.ts, daoContract.ts)
 * where React hooks can't be used.
 */
export function wrappedContractCall(
  callOptions: Parameters<typeof openContractCall>[0],
  actionLabel: string
): Promise<{ success: boolean; txId?: string; error?: string }> {
  return new Promise((resolve) => {
    const toastId = toast.loading(`${actionLabel}...`, { description: 'Waiting for wallet approval' });

    openContractCall({
      ...callOptions,
      onFinish: (data: any) => {
        const txId = data.txId;
        toast.success(`${actionLabel} submitted`, {
          id: toastId,
          description: `TX: ${txId.slice(0, 10)}...`,
        });

        // Submit to backend for optimistic UI (non-blocking)
        submitPendingTx({
          txId,
          functionName: callOptions.functionName,
          contractName: callOptions.contractName,
          args: {},
          senderAddress: '',
        }).catch(() => {});

        callOptions.onFinish?.(data);
        resolve({ success: true, txId });
      },
      onCancel: () => {
        toast.warning(`${actionLabel} cancelled`, {
          id: toastId,
          description: 'Transaction was cancelled in wallet',
        });

        callOptions.onCancel?.();
        resolve({ success: false, error: 'Transaction cancelled by user' });
      },
    });
  });
}
