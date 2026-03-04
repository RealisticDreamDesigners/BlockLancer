'use client';

import React, { useState } from 'react';
import { useTransactionContext, TrackedTx } from '@/contexts/TransactionContext';

function statusIcon(status: TrackedTx['status']) {
  switch (status) {
    case 'pending':
      return (
        <span className="inline-block h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />
      );
    case 'success':
      return <span className="inline-block h-2 w-2 rounded-full bg-green-500" />;
    case 'failed':
    case 'dropped':
      return <span className="inline-block h-2 w-2 rounded-full bg-red-500" />;
  }
}

function statusLabel(status: TrackedTx['status']) {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'success':
      return 'Confirmed';
    case 'failed':
      return 'Failed';
    case 'dropped':
      return 'Dropped';
  }
}

export function PendingTransactions() {
  const { pendingTxs, queueSize } = useTransactionContext();
  const [expanded, setExpanded] = useState(false);

  const totalCount = pendingTxs.length + queueSize;

  if (totalCount === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      {/* Collapsed badge */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2 text-sm text-white shadow-lg hover:bg-gray-800 transition-colors"
      >
        <span className="inline-block h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />
        <span>
          {pendingTxs.length} pending TX{pendingTxs.length !== 1 ? 's' : ''}
          {queueSize > 0 && ` (${queueSize} queued)`}
        </span>
      </button>

      {/* Expanded list */}
      {expanded && (
        <div className="mt-2 rounded-lg bg-gray-900 p-3 shadow-xl text-white text-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Transactions</span>
            <button
              onClick={() => setExpanded(false)}
              className="text-gray-400 hover:text-white text-xs"
            >
              Close
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {pendingTxs.map((tx) => (
              <div
                key={tx.txId}
                className="flex items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {statusIcon(tx.status)}
                  <span className="truncate">{tx.functionName}</span>
                </div>
                <span className="text-gray-400 shrink-0">{statusLabel(tx.status)}</span>
              </div>
            ))}
            {queueSize > 0 && (
              <div className="text-xs text-gray-400">
                {queueSize} transaction{queueSize !== 1 ? 's' : ''} queued...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
