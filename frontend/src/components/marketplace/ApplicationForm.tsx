'use client';

import { useState } from 'react';
import { daysToBlocks } from '@/lib/blockTime';

interface ApplicationFormProps {
  jobId: number;
  budgetMin: number;
  budgetMax: number;
  onSubmit: (coverLetter: string, proposedAmount: number, proposedTimeline: number) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
}

export function ApplicationForm({ jobId, budgetMin, budgetMax, onSubmit, onCancel }: ApplicationFormProps) {
  const [coverLetter, setCoverLetter] = useState('-');
  const [proposedAmount, setProposedAmount] = useState('-');
  const [proposedTimeline, setProposedTimeline] = useState('-');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('-');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('-');

    const amount = parseFloat(proposedAmount);
    const timelineDays = parseInt(proposedTimeline);

    if (!coverLetter.trim()) {
      setError('Cover letter is required');
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      setError('Valid proposed amount is required');
      return;
    }
    if (isNaN(timelineDays) || timelineDays <= 0) {
      setError('Valid timeline is required');
      return;
    }

    setLoading(true);
    try {
      const amountInMicroSTX = Math.floor(amount * 1_000_000);
      const timelineBlocks = daysToBlocks(timelineDays);
      const result = await onSubmit(coverLetter.trim(), amountInMicroSTX, timelineBlocks);
      if (!result.success) {
        setError(result.error || 'Failed to submit application');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Apply for Job #{jobId}</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Cover Letter
        </label>
        <textarea
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          placeholder="Explain why you're a good fit for this job..."
          className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          maxLength={500}
        />
        <p className="text-xs text-gray-400 mt-1">{coverLetter.length}/500</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Proposed Amount (STX)
          </label>
          <input
            type="number"
            value={proposedAmount}
            onChange={(e) => setProposedAmount(e.target.value)}
            placeholder={`${(budgetMin / 1_000_000).toFixed(2)} - ${(budgetMax / 1_000_000).toFixed(2)}`}
            step="0.01"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Timeline (days)
          </label>
          <input
            type="number"
            value={proposedTimeline}
            onChange={(e) => setProposedTimeline(e.target.value)}
            placeholder="e.g. 7"
            min="1"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">How many days to complete the work</p>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit Application'}
        </button>
      </div>
    </form>
  );
}
