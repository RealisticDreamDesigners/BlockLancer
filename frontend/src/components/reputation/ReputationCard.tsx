'use client';

import { ReputationBadge } from './ReputationBadge';
import type { BackendReputation, ReputationHistoryEntry } from '@/lib/apiClient';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ReputationCardProps {
  reputation: BackendReputation;
  showAddress?: boolean;
  scoreChange?: number;
  history?: ReputationHistoryEntry[];
}

function formatAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function ScoreChangeBadge({ change }: { change: number }) {
  if (change > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-green-600 dark:text-green-400">
        <TrendingUp className="w-3 h-3" />
        +{change}
      </span>
    );
  }
  if (change < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-red-600 dark:text-red-400">
        <TrendingDown className="w-3 h-3" />
        {change}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-gray-400 dark:text-gray-500">
      <Minus className="w-3 h-3" />
      No change
    </span>
  );
}

export function ReputationCard({ reputation, showAddress = true, scoreChange = 0, history = [] }: ReputationCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-orange-300 dark:hover:border-orange-600 transition-colors">
      <div className="flex items-center justify-between mb-4">
        {showAddress && (
          <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
            {formatAddress(reputation.address)}
          </span>
        )}
        <div className="flex items-center gap-2">
          <ReputationBadge score={reputation.score} size="md" />
          <ScoreChangeBadge change={scoreChange} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-gray-500 dark:text-gray-400">Completed</p>
          <p className="font-medium text-gray-900 dark:text-white">{reputation.completed_escrows}</p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400">Cancelled</p>
          <p className="font-medium text-gray-900 dark:text-white">{reputation.cancelled_escrows}</p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400">Disputes Won</p>
          <p className="font-medium text-green-600 dark:text-green-400">{reputation.disputes_won}</p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400">Disputes Lost</p>
          <p className="font-medium text-red-600 dark:text-red-400">{reputation.disputes_lost}</p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400">On-time</p>
          <p className="font-medium text-gray-900 dark:text-white">{reputation.on_time_completions}</p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400">Late</p>
          <p className="font-medium text-gray-900 dark:text-white">{reputation.late_completions}</p>
        </div>
      </div>

      {parseInt(reputation.total_volume) > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Volume</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {(parseInt(reputation.total_volume) / 1_000_000).toFixed(2)} STX
          </p>
        </div>
      )}

      {/* Score History Timeline */}
      {history.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Score History</p>
          <div className="flex items-end gap-1 h-10">
            {history.slice(0, 15).reverse().map((entry, i) => {
              const minScore = Math.min(...history.map(h => h.score));
              const maxScore = Math.max(...history.map(h => h.score));
              const range = maxScore - minScore || 1;
              const heightPct = ((entry.score - minScore) / range) * 100;
              const barHeight = Math.max(heightPct, 10); // min 10% height
              return (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-orange-400 dark:bg-orange-500 hover:bg-orange-500 dark:hover:bg-orange-400 transition-colors"
                  style={{ height: `${barHeight}%` }}
                  title={`Score: ${entry.score} (${new Date(entry.created_at).toLocaleDateString()})`}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
