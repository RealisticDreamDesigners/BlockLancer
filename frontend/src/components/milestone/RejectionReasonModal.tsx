'use client';

import { useState } from 'react';

interface RejectionReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  milestoneDescription?: string;
}

export function RejectionReasonModal({ isOpen, onClose, onSubmit, milestoneDescription }: RejectionReasonModalProps) {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (reason.trim().length === 0) return;
    onSubmit(reason.trim());
    setReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 mx-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Reject Milestone
        </h3>
        {milestoneDescription && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Milestone: {milestoneDescription}
          </p>
        )}
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Rejection Reason
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explain why this milestone is being rejected..."
          className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          maxLength={500}
        />
        <p className="text-xs text-gray-400 mt-1">{reason.length}/500 characters</p>
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={reason.trim().length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reject Milestone
          </button>
        </div>
      </div>
    </div>
  );
}
