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
      <div className="bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">DAO Dashboard</h1>
                <p className="text-gray-600 mt-1">
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
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Members</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {daoStats?.memberCount || 0}
                </p>
                <p className="text-sm text-gray-600 mt-1">out of 100 max</p>
              </div>

              {/* Active Proposals */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Activity className="h-5 w-5 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Active</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {activeProposals?.length || 0}
                </p>
                <p className="text-sm text-gray-600 mt-1">proposals voting</p>
              </div>

              {/* Total Proposals */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Total</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {proposals?.length || 0}
                </p>
                <p className="text-sm text-gray-600 mt-1">all proposals</p>
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
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Active Proposals
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
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
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                How the DAO Works
              </h3>
              <div className="space-y-4 text-sm text-gray-700">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    1. Proposals
                  </h4>
                  <p className="text-gray-600">
                    When disputes arise, DAO members can create proposals for
                    resolution.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">2. Voting</h4>
                  <p className="text-gray-600">
                    Members vote Yes, No, or Abstain. Voting period is 1440 blocks
                    (~10 days).
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    3. Supermajority
                  </h4>
                  <p className="text-gray-600">
                    Proposals need 70% Yes votes to pass and be executed.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    4. Execution
                  </h4>
                  <p className="text-gray-600">
                    Passed proposals are executed on-chain, enforcing the
                    resolution.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-purple-900 mb-4">
                Quick Links
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => router.push('/dao/membership')}
                  className="w-full text-left px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-colors text-sm font-semibold shadow-sm"
                >
                  ✨ Join the DAO
                </button>
                <button
                  onClick={() => router.push('/dao/proposals')}
                  className="w-full text-left px-4 py-2 bg-white rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium text-purple-900"
                >
                  View All Proposals →
                </button>
                <button
                  onClick={() => router.push('/disputes')}
                  className="w-full text-left px-4 py-2 bg-white rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium text-purple-900"
                >
                  View Disputes →
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
