'use client';

import { useState } from 'react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => Promise<{ success: boolean; txId?: string; error?: string }>;
}

export function UpgradeModal({ isOpen, onClose, onUpgrade }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const result = await onUpgrade();
      if (result.success) {
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 mx-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Upgrade to Pro
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Unlock unlimited contracts and higher transaction limits.
        </p>
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Pro Tier</span>
            <span className="text-lg font-bold text-purple-600 dark:text-purple-400">~9.99 STX/mo</span>
          </div>
          <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <li>- Unlimited contracts per month</li>
            <li>- Higher transaction limits</li>
            <li>- 1.5% platform fee on transactions</li>
            <li>- Priority support</li>
          </ul>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-md hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Upgrade Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
