'use client';

import { useState } from 'react';
import { useStacks } from '@/hooks/useStacks';
import { useReputation } from '@/hooks/useReputation';
import { ReputationCard } from '@/components/reputation/ReputationCard';
import { Leaderboard } from '@/components/reputation/Leaderboard';
import { AppLayout } from '@/components/layout';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { Award, Search, X } from 'lucide-react';

export default function ReputationPage() {
  const { isSignedIn, userAddress } = useStacks();
  const { reputation, reputationLoading, scoreChange, history } = useReputation(userAddress);

  const [lookupAddress, setLookupAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const {
    reputation: lookedUpReputation,
    reputationLoading: lookupLoading,
    scoreChange: lookupScoreChange,
    history: lookupHistory,
  } = useReputation(lookupAddress || undefined);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed && trimmed.startsWith('S')) {
      setLookupAddress(trimmed);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setLookupAddress('');
  };

  return (
    <AppLayout>
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Breadcrumbs className="mb-4" />
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
          <Award className="h-6 w-6 text-orange-600 dark:text-orange-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Reputation System
        </h1>
      </div>

      {/* User Lookup Search */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <span className="w-1 h-5 bg-orange-500 rounded-full" />
          Look Up a User
        </h2>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter a Stacks address (ST...)"
              className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={!searchQuery.trim().startsWith('S')}
            className="px-4 py-2.5 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Search
          </button>
        </form>

        {/* Lookup Result */}
        {lookupAddress && (
          <div className="mt-4">
            {lookupLoading ? (
              <div className="animate-pulse h-40 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            ) : lookedUpReputation ? (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Results for <span className="font-mono">{lookupAddress.slice(0, 10)}...{lookupAddress.slice(-6)}</span>
                </p>
                <ReputationCard
                  reputation={lookedUpReputation}
                  showAddress={true}
                  scoreChange={lookupScoreChange}
                  history={lookupHistory}
                />
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
                <p className="text-gray-500 dark:text-gray-400">No reputation data found for this address.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Your Reputation */}
      {isSignedIn && userAddress && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <span className="w-1 h-5 bg-orange-500 rounded-full" />
            Your Reputation
          </h2>
          {reputationLoading ? (
            <div className="animate-pulse h-40 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          ) : reputation ? (
            <ReputationCard
              reputation={reputation}
              showAddress={false}
              scoreChange={scoreChange}
              history={history}
            />
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
              <Award className="h-10 w-10 text-orange-300 dark:text-orange-700 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">No reputation data yet. Complete escrows to build your score.</p>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <span className="w-1 h-5 bg-orange-500 rounded-full" />
          Leaderboard
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <Leaderboard />
        </div>
      </div>
    </div>
    </AppLayout>
  );
}
