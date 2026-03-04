'use client';

import { useState } from 'react';
import { useLeaderboard } from '@/hooks/useReputation';
import { ReputationBadge } from './ReputationBadge';
import { ReputationCard } from './ReputationCard';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { BackendReputation } from '@/lib/apiClient';

function formatAddress(address: string): string {
  if (address.length <= 16) return address;
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

export function Leaderboard() {
  const [page, setPage] = useState(0);
  const [expandedAddress, setExpandedAddress] = useState<string | null>(null);
  const pageSize = 20;
  const { leaderboard, total, isLoading } = useLeaderboard(pageSize, page * pageSize);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
        ))}
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No reputation data yet. Complete escrows to appear on the leaderboard.
      </div>
    );
  }

  const toggleExpand = (address: string) => {
    setExpandedAddress(prev => prev === address ? null : address);
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-2 text-gray-500 dark:text-gray-400 font-medium">Rank</th>
              <th className="text-left py-3 px-2 text-gray-500 dark:text-gray-400 font-medium">Address</th>
              <th className="text-left py-3 px-2 text-gray-500 dark:text-gray-400 font-medium">Score</th>
              <th className="text-right py-3 px-2 text-gray-500 dark:text-gray-400 font-medium">Completed</th>
              <th className="text-right py-3 px-2 text-gray-500 dark:text-gray-400 font-medium">Volume</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((user: BackendReputation, index: number) => {
              const rank = page * pageSize + index + 1;
              const isExpanded = expandedAddress === user.address;
              const rankClass = rank === 1
                ? 'text-orange-600 dark:text-orange-400 font-bold'
                : rank <= 3
                  ? 'text-orange-500 dark:text-orange-400 font-semibold'
                  : 'text-gray-900 dark:text-white font-medium';
              return (
                <tr key={user.address} className="group">
                  <td colSpan={6} className="p-0">
                    <button
                      onClick={() => toggleExpand(user.address)}
                      className="w-full text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex items-center border-b border-gray-100 dark:border-gray-800">
                        <div className={`py-3 px-2 w-16 ${rankClass}`}>
                          #{rank}
                        </div>
                        <div className="py-3 px-2 flex-1 font-mono text-gray-600 dark:text-gray-400">
                          {formatAddress(user.address)}
                        </div>
                        <div className="py-3 px-2">
                          <ReputationBadge score={user.score} size="sm" />
                        </div>
                        <div className="py-3 px-2 w-24 text-right text-gray-900 dark:text-white">
                          {user.completed_escrows}
                        </div>
                        <div className="py-3 px-2 w-28 text-right text-gray-900 dark:text-white">
                          {(parseInt(user.total_volume) / 1_000_000).toFixed(2)} STX
                        </div>
                        <div className="py-3 px-2 w-8 text-gray-400">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/30 border-b border-gray-200 dark:border-gray-700">
                        <ReputationCard reputation={user} showAddress={false} />
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {total > pageSize && (
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {page + 1} of {Math.ceil(total / pageSize)}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={(page + 1) * pageSize >= total}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
