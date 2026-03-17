'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useProposals } from '@/hooks/useProposals';
import { useDAOStatistics } from '@/hooks/useProposals';
import { useStacks } from '@/hooks/useStacks';
import { ProposalStatus } from '@/types/dispute';
import {
  ProposalStats,
  ProposalList,
} from '@/components/proposal';
import {
  DAOMemberBadge,
  DAOMemberCard,
} from '@/components/dao';
import { AppLayout } from '@/components/layout';
import { Shield, TrendingUp, Users, Activity } from 'lucide-react';

/**
 * DAO Dashboard Page
 *
 * Main dashboard for the DAO showing:
 * - DAO membership status
 * - Active proposals
 * - Proposal statistics
 * - User participation
 */
export default function DAODashboardPage() {
  const router = useRouter();
  const { userAddress } = useStacks();
  const { data: proposals, isLoading } = useProposals();
  const { data: daoStats } = useDAOStatistics();

  // Filter active proposals
  const activeProposals = proposals?.filter(
    (p) => p.status === ProposalStatus.ACTIVE
  );

  return (
    <AppLayout>
      <div className="bg-gray-50 dark:bg-gray-950">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">DAO Dashboard</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Decentralized governance for dispute resolution
                </p>
              </div>
            </div>
            <DAOMemberBadge userAddress={userAddress } size="large" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* DAO Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Total Members */}
              <div className="bg-white dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Members</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {daoStats?.memberCount || 0}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">out of 100 max</p>
              </div>

              {/* Active Proposals */}
              <div className="bg-white dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Activity className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Active</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {activeProposals?.length || 0}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">proposals voting</p>
              </div>

              {/* Total Proposals */}
              <div className="bg-white dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Total</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {proposals?.length || 0}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">all proposals</p>
              </div>
            </div>

            {/* Proposal Statistics */}
            <ProposalStats
              proposals={proposals}
              currentUserAddress={userAddress }
              showUserStats
              isLoading={isLoading}
            />

            {/* Active Proposals List */}
            <div className="bg-white dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Active Proposals
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Proposals currently open for voting
                  </p>
                </div>
                <button
                  onClick={() => router.push('/dao/proposals')}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  View All →
                </button>
              </div>

              <ProposalList
                proposals={activeProposals}
                currentUserAddress={userAddress }
                isLoading={isLoading}
                showFilters={false}
                showSearch={false}
                showSort={false}
                emptyMessage="No active proposals at the moment"
              />
            </div>
          </div>

          {/* Right Column - Membership & Info */}
          <div className="space-y-6">
            {/* Membership Card */}
            <DAOMemberCard userAddress={userAddress } />

            {/* How DAO Works */}
            <div className="bg-white dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                How the DAO Works
              </h3>
              <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                    1. Proposals
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    When disputes arise, DAO members can create proposals for
                    resolution.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">2. Voting</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    Members vote Yes, No, or Abstain. Voting period is 1440 blocks
                    (~10 days).
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                    3. Supermajority
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    Proposals need 70% Yes votes to pass and be executed.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                    4. Execution
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    Passed proposals are executed on-chain, enforcing the
                    resolution.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/40 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-4">
                Quick Links
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => router.push('/dao/membership')}
                  className="w-full text-left px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-colors text-sm font-semibold shadow-sm"
                >
                  Join the DAO
                </button>
                <button
                  onClick={() => router.push('/dao/proposals')}
                  className="w-full text-left px-4 py-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors text-sm font-medium text-blue-900 dark:text-blue-200"
                >
                  View All Proposals
                </button>
                <button
                  onClick={() => router.push('/disputes')}
                  className="w-full text-left px-4 py-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors text-sm font-medium text-blue-900 dark:text-blue-200"
                >
                  View Disputes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </AppLayout>
  );
}
