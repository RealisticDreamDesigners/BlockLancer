'use client';

import { useState } from 'react';
import { usePauseState } from '@/hooks/usePauseState';

const CONTRACT_LABELS: Record<string, string> = {
  'blocklancer-escrow-v4': 'Escrow v4',
  'blocklancer-payments-v2': 'Payments v2',
  'blocklancer-dispute-v5': 'Dispute v5',
  'blocklancer-dao-v3': 'DAO v3',
  'blocklancer-reputation': 'Reputation',
  'blocklancer-marketplace': 'Marketplace',
};

interface PauseControlProps {
  deployerAddress: string;
}

export function PauseControl({ deployerAddress }: PauseControlProps) {
  const { pauseStates, isLoading, setPaused } = usePauseState();
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
        ))}
      </div>
    );
  }

  const handleToggle = async (contractName: string, currentlyPaused: boolean) => {
    if (!currentlyPaused) {
      // Pausing requires confirmation
      setConfirmTarget(contractName);
      return;
    }
    // Unpausing can proceed directly
    await executePause(contractName, false);
  };

  const executePause = async (contractName: string, paused: boolean) => {
    setProcessing(true);
    setConfirmTarget(null);
    try {
      const contractId = `${deployerAddress}.${contractName}`;
      await setPaused(contractId, paused);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Contract Pause Controls
        </h3>
        {pauseStates?.some(s => s.is_paused) && (
          <span className="px-2.5 py-1 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-full">
            Some contracts paused
          </span>
        )}
      </div>

      <div className="space-y-2">
        {pauseStates?.map((state) => (
          <div
            key={state.contract_name}
            className={`flex items-center justify-between p-3 rounded-lg border ${
              state.is_paused
                ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10'
                : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
            }`}
          >
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {CONTRACT_LABELS[state.contract_name] || state.contract_name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {state.is_paused
                  ? `Paused by ${state.paused_by ? state.paused_by.slice(0, 8) + '...' : 'unknown'}`
                  : 'Active'}
              </p>
            </div>
            <button
              onClick={() => handleToggle(state.contract_name, state.is_paused)}
              disabled={processing}
              className={`px-3 py-1.5 text-sm font-medium rounded-md disabled:opacity-50 ${
                state.is_paused
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {state.is_paused ? 'Unpause' : 'Pause'}
            </button>
          </div>
        ))}
      </div>

      {/* Confirmation modal */}
      {confirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm p-6 mx-4">
            <h4 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
              Confirm Pause
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Pausing <strong>{CONTRACT_LABELS[confirmTarget] || confirmTarget}</strong> will prevent all state-changing operations. Are you sure?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmTarget(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => executePause(confirmTarget, true)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Pause Contract
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
