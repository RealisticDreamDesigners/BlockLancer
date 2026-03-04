'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useUserDisputes, useAllDisputes } from '@/hooks/useDisputes';
import { useStacks } from '@/hooks/useStacks';
import { useDAOMembership } from '@/hooks/useProposals';
import {
  DisputeList,
  DisputeStats,
  OpenDisputeModal,
} from '@/components/dispute';
import { AppLayout } from '@/components/layout';
import { AlertCircle, Plus, ArrowRight } from 'lucide-react';
import { useState } from 'react';

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
  const [showCreateModal, setShowCreateModal] = useState(false);

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
      <div className="bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Disputes</h1>
              <p className="text-gray-600 mt-1">
                Manage and track contract disputes
              </p>
            </div>
            {/* Open Dispute Button - directs to contracts */}
            {userAddress && (
              <button
                onClick={() => router.push('/contracts')}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Open New Dispute
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Statistics Dashboard - Shows ALL disputes in system */}
          <DisputeStats
            disputes={allDisputes}
            currentUserAddress={userAddress}
            showUserStats
            isLoading={isLoading}
          />

          {/* Info Banner for Non-Connected Users */}
          {!userAddress && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium">Connect Your Wallet</p>
                  <p className="text-blue-800 mt-1">
                    Connect your wallet to view your disputes and participate in
                    dispute resolution.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Disputes List */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {isDAOMember ? 'All Disputes' : userAddress ? 'Your Disputes' : 'All Disputes'}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {isDAOMember
                      ? 'All disputes in the system - DAO members can create proposals for any dispute'
                      : userAddress
                      ? 'Disputes where you are involved as client or freelancer'
                      : 'Connect your wallet to see your disputes'}
                  </p>
                </div>
                {isDAOMember && userDisputes.length > 0 && (
                  <span className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
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

          {/* Help Section - How to Open a Dispute */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              How to Open a Dispute
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-orange-900 mb-1">Go to Your Contracts</p>
                  <p className="text-sm text-orange-800">
                    Click "Open New Dispute" above or navigate to your contracts page to see all your active contracts.
                  </p>
                  {userAddress && (
                    <button
                      onClick={() => router.push('/contracts')}
                      className="mt-2 text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
                    >
                      View My Contracts <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-orange-900 mb-1">Select the Contract</p>
                  <p className="text-sm text-orange-800">
                    Click on the contract you want to dispute. You can only dispute contracts where you're the client or freelancer.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-orange-900 mb-1">Open Dispute & Fill Form</p>
                  <p className="text-sm text-orange-800">
                    On the contract page, scroll to "Dispute Resolution" section and click "Open Dispute". Fill out the dispute form with your reason (max 500 characters).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  4
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-orange-900 mb-1">Submit Evidence</p>
                  <p className="text-sm text-orange-800">
                    After opening, both parties can submit evidence (max 1000 characters). The DAO will review all evidence before voting.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  5
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-orange-900 mb-1">DAO Votes on Resolution</p>
                  <p className="text-sm text-orange-800">
                    A DAO member creates a proposal, and all DAO members vote. 70% supermajority needed to pass. Resolution is executed automatically.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </AppLayout>
  );
}
