'use client';

import React, { useState } from 'react';
import { useProposals } from '@/hooks/useProposals';
import { useStacks } from '@/hooks/useStacks';
import {
  ProposalList,
  ProposalStats,
} from '@/components/proposal';
import { DAOMemberBadge } from '@/components/dao';
import { AppLayout } from '@/components/layout';
import { FileText, AlertCircle, ChevronDown } from 'lucide-react';

/**
 * Proposals List Page
 *
 * Main page for viewing all DAO proposals.
 * Shows proposals with filtering, search, sorting, and statistics.
 */
export default function ProposalsPage() {
  const { userAddress } = useStacks();
  const { data: proposals, isLoading, error } = useProposals();
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <AppLayout>
      <div className="bg-gray-50 dark:bg-gray-950">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  DAO Proposals
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Vote on dispute resolutions and escrow releases
                </p>
              </div>
            </div>
            <DAOMemberBadge userAddress={userAddress} size="large" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Statistics Dashboard */}
          <ProposalStats
            proposals={proposals}
            currentUserAddress={userAddress}
            showUserStats
            isLoading={isLoading}
          />

          {/* Info Banner for Non-Members */}
          {userAddress && (
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/40 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900 dark:text-blue-200">
                  <p className="font-medium">DAO Voting</p>
                  <p className="text-blue-800 dark:text-blue-300 mt-1">
                    Only DAO members can vote on proposals. Each proposal requires
                    a 70% supermajority (Yes votes) to pass.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Connect Wallet Prompt */}
          {!userAddress && (
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/40 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900 dark:text-blue-200">
                  <p className="font-medium">Connect Your Wallet</p>
                  <p className="text-blue-800 dark:text-blue-300 mt-1">
                    Connect your wallet to view proposal details and participate in
                    voting if you're a DAO member.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Proposals List */}
          <div className="bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700/50 p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">All Proposals</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Browse and vote on active proposals, or view results of past
                proposals
              </p>
            </div>

            <ProposalList
              proposals={proposals}
              currentUserAddress={userAddress}
              isLoading={isLoading}
              error={error}
              showFilters
              showSearch
              showSort
              cardVariant="detailed"
              emptyMessage="No proposals have been created yet"
            />
          </div>

          {/* Help Section - Collapsible */}
          <div className="bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setHelpOpen(!helpOpen)}
              className="w-full px-6 py-4 flex items-center justify-between text-left"
            >
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Understanding Proposals</span>
              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${helpOpen ? 'rotate-180' : ''}`} />
            </button>
            {helpOpen && (
              <div className="px-6 pb-5 border-t border-gray-100 dark:border-gray-800 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1.5">
                      Proposal Types
                    </h4>
                    <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                      <li>
                        <strong className="text-gray-700 dark:text-gray-300">Dispute Resolution:</strong> Votes on how to resolve a
                        contract dispute
                      </li>
                      <li>
                        <strong className="text-gray-700 dark:text-gray-300">Escrow Release:</strong> Votes on releasing funds from
                        escrow
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1.5">
                      Voting Rules
                    </h4>
                    <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                      <li>Voting period: 1440 blocks (~10 days)</li>
                      <li>Threshold: 70% Yes votes required to pass</li>
                      <li>One vote per member per proposal</li>
                      <li>Votes are final and cannot be changed</li>
                    </ul>
                  </div>
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
