'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStacks } from '@/hooks/useStacks';
import { useMarketplace } from '@/hooks/useMarketplace';
import { dateToBlockHeight, estimateCurrentBlockHeight, fetchCurrentBlockHeight, formatBlockHeight } from '@/lib/blockTime';
import { AppLayout } from '@/components/layout';
import Breadcrumbs from '@/components/layout/Breadcrumbs';

export default function CreateJobPage() {
  const router = useRouter();
  const { isSignedIn } = useStacks();
  const { postJob } = useMarketplace();

  const [title, setTitle] = useState('-');
  const [description, setDescription] = useState('-');
  const [budgetMin, setBudgetMin] = useState('-');
  const [budgetMax, setBudgetMax] = useState('-');
  const [deadlineDate, setDeadlineDate] = useState('-');
  const [skills, setSkills] = useState('-');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('-');

  // Prime the block height cache on mount for accurate date-to-block conversion
  useEffect(() => { fetchCurrentBlockHeight(); }, []);

  // Calculate block height from selected date, with buffer for TX confirmation
  const deadlineBlockHeight = useMemo(() => {
    if (!deadlineDate) return 0;
    const date = new Date(deadlineDate);
    if (isNaN(date.getTime())) return 0;
    // Set to end of day in user's timezone
    date.setHours(23, 59, 59);
    return dateToBlockHeight(date);
  }, [deadlineDate]);

  // Min date is tomorrow
  const minDate = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }, []);

  if (!isSignedIn) {
    return (
      <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">Please connect your wallet to post a job.</p>
      </div>
      </AppLayout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('-');

    if (!title.trim()) { setError('Title is required'); return; }
    if (!description.trim()) { setError('Description is required'); return; }

    const minAmount = parseFloat(budgetMin);
    const maxAmount = parseFloat(budgetMax);

    if (isNaN(minAmount) || minAmount < 0) { setError('Valid minimum budget required'); return; }
    if (isNaN(maxAmount) || maxAmount <= 0) { setError('Valid maximum budget required'); return; }
    if (maxAmount < minAmount) { setError('Maximum budget must be >= minimum'); return; }
    if (!deadlineDate) { setError('Please select a deadline date'); return; }

    const selectedDate = new Date(deadlineDate);
    if (selectedDate <= new Date()) { setError('Deadline must be in the future'); return; }
    if (deadlineBlockHeight <= estimateCurrentBlockHeight()) { setError('Deadline must be in the future'); return; }

    setLoading(true);
    try {
      const result = await postJob(
        title.trim(),
        description.trim(),
        Math.floor(minAmount * 1_000_000),
        Math.floor(maxAmount * 1_000_000),
        deadlineBlockHeight,
        skills.trim()
      );

      if (result.success) {
        router.push('/jobs');
      } else {
        setError(result.error || 'Failed to post job');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Breadcrumbs className="mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Post a Job</h1>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Smart Contract Developer Needed"
            maxLength={200}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the job requirements, deliverables, and expectations..."
            maxLength={500}
            className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <p className="text-xs text-gray-400 mt-1">{description.length}/500</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Min Budget (STX)
            </label>
            <input
              type="number"
              value={budgetMin}
              onChange={(e) => setBudgetMin(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Max Budget (STX)
            </label>
            <input
              type="number"
              value={budgetMax}
              onChange={(e) => setBudgetMax(e.target.value)}
              placeholder="100.00"
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Deadline
          </label>
          <input
            type="date"
            value={deadlineDate}
            onChange={(e) => setDeadlineDate(e.target.value)}
            min={minDate}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
          />
          {deadlineDate && deadlineBlockHeight > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Estimated block: #{deadlineBlockHeight.toLocaleString()} ({formatBlockHeight(deadlineBlockHeight)})
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Skills (comma-separated)
          </label>
          <input
            type="text"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="e.g. Clarity, React, TypeScript"
            maxLength={200}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.push('/jobs')}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Posting...' : 'Post Job'}
          </button>
        </div>
      </form>
    </div>
    </AppLayout>
  );
}
