'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAllDisputes } from '@/hooks/useDisputes';
import { useStacks } from '@/hooks/useStacks';
import { useDAOMembership } from '@/hooks/useProposals';
import {
  DisputeList,
  DisputeStats,
} from '@/components/dispute';
import { AppLayout } from '@/components/layout';
import { AlertCircle, Plus, ArrowRight, ChevronDown } from 'lucide-react';

/**
 * Disputes List Page
 *
 * Main page for viewing all disputes.
 * Shows user's disputes with filtering, search, and statistics.
 */
export default function DisputesPage() {
  const router = useRouter();
  const { userAddress } = useStacks();
  const { data: allDisputes, isLoading, error } = useAllDisputes();
  const { data: isDAOMember } = useDAOMembership();
  const [howToOpen, setHowToOpen] = useState(false);

  // Filter disputes based on user role
  const displayedDisputes = React.useMemo(() => {
    if (!allDisputes) return [];

    // DAO members see ALL disputes so they can create proposals for any
    if (isDAOMember) {
      return allDisputes;
    }

    // Regular users only see disputes they're involved in
    if (!userAddress) return [];
    return allDisputes.filter(
      dispute => dispute.client === userAddress || dispute.freelancer === userAddress
    );
  }, [allDisputes, userAddress, isDAOMember]);

  // Also track user's personal disputes for stats
  const userDisputes = React.useMemo(() => {
    if (!allDisputes || !userAddress) return [];
    return allDisputes.filter(
      dispute => dispute.client === userAddress || dispute.freelancer === userAddress
    );
  }, [allDisputes, userAddress]);

  return (
    <AppLayout>
      <div className="bg-gray-50 dark:bg-gray-950 min-h-screen">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-2">
        <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Disputes</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Manage and track contract disputes
              </p>
            </div>
            {/* Open Dispute Button - directs to contracts */}
            {userAddress && (
              <button
                onClick={() => router.push('/contracts')}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Open New Dispute
              </button>
            )}
          </div>
        </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Statistics Dashboard - Shows ALL disputes in system */}
          <DisputeStats
            disputes={allDisputes}
            currentUserAddress={userAddress}
            showUserStats
            isLoading={isLoading}
          />

          {/* Info Banner for Non-Connected Users */}
          {!userAddress && (
            <div className="bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-sm pt-1.5">
                  <p className="font-medium text-gray-900 dark:text-white">Connect Your Wallet</p>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Connect your wallet to view your disputes and participate in
                    dispute resolution.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Disputes List */}
          <div className="bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {isDAOMember ? 'All Disputes' : userAddress ? 'Your Disputes' : 'All Disputes'}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {isDAOMember
                      ? 'All disputes in the system. DAO members can create proposals for any dispute.'
                      : userAddress
                      ? 'Disputes where you are involved as client or freelancer'
                      : 'Connect your wallet to see your disputes'}
                  </p>
                </div>
                {isDAOMember && userDisputes.length > 0 && (
                  <span className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full font-medium">
                    {userDisputes.length} of yours
                  </span>
                )}
              </div>
            </div>

            <DisputeList
              disputes={displayedDisputes}
              currentUserAddress={userAddress}
              isLoading={isLoading}
              error={error}
              showFilters
              showSearch
              showSort
              isDAOMember={isDAOMember || false}
              emptyMessage={
                isDAOMember
                  ? "No disputes in the system yet"
                  : userAddress
                  ? "You don't have any disputes yet"
                  : 'Connect your wallet to view disputes'
              }
            />
          </div>

          {/* Help Section - How to Open a Dispute (Collapsible) */}
          <div className="bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setHowToOpen(!howToOpen)}
              className="w-full px-6 py-4 flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-base font-semibold text-gray-900 dark:text-white">How to Open a Dispute</span>
              </div>
              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${howToOpen ? 'rotate-180' : ''}`} />
            </button>
            {howToOpen && (
              <div className="px-6 pb-6 border-t border-gray-100 dark:border-gray-800 pt-5">
                <div className="space-y-5">
                  {[
                    { step: '1', title: 'Go to Your Contracts', desc: 'Click "Open New Dispute" above or navigate to your contracts page to see all your active contracts.', showLink: true },
                    { step: '2', title: 'Select the Contract', desc: 'Click on the contract you want to dispute. You can only dispute contracts where you are the client or freelancer.' },
                    { step: '3', title: 'Open Dispute and Fill Form', desc: 'On the contract page, scroll to the "Dispute Resolution" section and click "Open Dispute". Fill out the dispute form with your reason (max 500 characters).' },
                    { step: '4', title: 'Submit Evidence', desc: 'After opening, both parties can submit evidence (max 1000 characters). The DAO will review all evidence before voting.' },
                    { step: '5', title: 'DAO Votes on Resolution', desc: 'A DAO member creates a proposal, and all DAO members vote. A 70% supermajority is needed to pass. Resolution is executed automatically.' },
                  ].map(item => (
                    <div key={item.step} className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                        {item.step}
                      </div>
                      <div className="flex-1 pt-0.5">
                        <p className="font-medium text-gray-900 dark:text-white mb-1">{item.title}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
                        {item.showLink && userAddress && (
                          <button
                            onClick={() => router.push('/contracts')}
                            className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                          >
                            View My Contracts <ArrowRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </AppLayout>
  );
}
