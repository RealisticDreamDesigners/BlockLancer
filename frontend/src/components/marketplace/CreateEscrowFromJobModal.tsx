'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useStacks } from '@/hooks/useStacks';
import { fetchCurrentBlockHeight, dateToBlockHeight } from '@/lib/blockTime';

interface CreateEscrowFromJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: number;
  freelancerAddress: string;
  proposedAmount: number; // microSTX
  deadline: number; // block height from job
  description: string;
  onEscrowCreated: () => void;
}

export function CreateEscrowFromJobModal({
  isOpen,
  onClose,
  jobId,
  freelancerAddress,
  proposedAmount,
  deadline,
  description,
  onEscrowCreated,
}: CreateEscrowFromJobModalProps) {
  const { createEscrow, userAddress, transactionInProgress } = useStacks();
  const [amount, setAmount] = useState(
    (proposedAmount / 1_000_000).toString()
  );
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');

  // Prime block height cache
  useEffect(() => { fetchCurrentBlockHeight(); }, []);

  // Default end date to 30 days from now
  useEffect(() => {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 30);
    setEndDate(defaultDate.toISOString().split('T')[0]);
  }, []);

  if (!isOpen) return null;

  const minDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  })();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!userAddress) return;

    const amountInMicroSTX = Math.floor(parseFloat(amount) * 1_000_000);
    if (isNaN(amountInMicroSTX) || amountInMicroSTX <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (!endDate) {
      setError('Please select an end date');
      return;
    }

    const selectedDate = new Date(endDate);
    selectedDate.setHours(23, 59, 59);
    const endBlockHeight = dateToBlockHeight(selectedDate);

    try {
      const result = await createEscrow(
        userAddress,
        freelancerAddress,
        description,
        endBlockHeight,
        amountInMicroSTX
      );

      if (result.success) {
        onEscrowCreated();
      } else {
        setError(result.error || 'Failed to create escrow');
      }
    } catch (err) {
      console.error('Error creating escrow:', err);
      setError('Unexpected error creating escrow');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Create Escrow for Job #{jobId}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Create an escrow contract to protect payment for this job.
          Funds will be held securely until milestones are approved.
        </p>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Freelancer
            </label>
            <p className="text-sm font-mono text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded px-3 py-2">
              {freelancerAddress}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Total Amount (STX)
            </label>
            <input
              type="number"
              step="0.000001"
              min="0.000001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Proposed: {(proposedAmount / 1_000_000).toFixed(2)} STX
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={minDate}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Skip for Now
            </button>
            <button
              type="submit"
              disabled={transactionInProgress}
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              {transactionInProgress ? 'Creating...' : 'Create Escrow'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
