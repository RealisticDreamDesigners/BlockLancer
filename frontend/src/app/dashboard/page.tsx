'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useStacks } from '@/hooks/useStacks';
import { usePayments } from '@/hooks/usePayments';
import { useReputation } from '@/hooks/useReputation';
import { TierBadge } from '@/components/payments/TierBadge';
import { UpgradeModal } from '@/components/payments/UpgradeModal';
import { ReputationBadge } from '@/components/reputation/ReputationBadge';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  Calendar,
  DollarSign,
  User,
  Briefcase,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  Eye,
  TrendingUp,
  FileText,
  Activity,
  Users,
  ArrowLeft,
  Scale
} from 'lucide-react';
import { 
  Contract, 
  Milestone, 
  MilestoneStatus, 
  ContractStatus, 
  formatSTX, 
  formatDate, 
  UserRole,
  // formatAmount,
  // getContractStatusText,
  // getContractStatusColor,
  // getMilestoneStatusText,
  // getMilestoneStatusColor
} from '@/types';

interface DashboardStats {
  totalContracts: number;
  activeContracts: number;
  completedContracts: number;
  totalValue: number;
  pendingPayments: number;
  completedMilestones: number;
  totalMilestones: number;
}

export default function EnhancedDashboardPage() {
  const router = useRouter();
  const { 
    userData, 
    isSignedIn, 
    loading, 
    connectWallet, 
    clientContracts, 
    freelancerContracts,
    transactionInProgress,
    refreshContracts,
  } = useStacks();

  const { isPro, userTier, upgradeToPro } = usePayments();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<UserRole>(UserRole.CLIENT);
  const [contractsLoading, setContractsLoading] = useState(true);
  
  const userAddress = userData?.profile?.stxAddress?.testnet || userData?.profile?.stxAddress?.mainnet;
  
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && !isSignedIn) {
      router.push('/');
    }
  }, [isSignedIn, loading, router, mounted]);

  // Auto-determine primary role and set tab
  useEffect(() => {
    if (clientContracts.length > 0 && freelancerContracts.length === 0) {
      setActiveTab(UserRole.CLIENT);
    } else if (freelancerContracts.length > 0 && clientContracts.length === 0) {
      setActiveTab(UserRole.FREELANCER);
    }
    setContractsLoading(false);
  }, [clientContracts, freelancerContracts]);

  // Calculate dashboard statistics
  const calculateStats = (contracts: Contract[], role: UserRole): DashboardStats => {
    const totalContracts = contracts.length;
    const activeContracts = contracts.filter(c => c.status === ContractStatus.ACTIVE).length;
    const completedContracts = contracts.filter(c => c.status === ContractStatus.COMPLETED).length;
    const totalValue = contracts.reduce((sum, c) => sum + c.totalAmount, 0);
    
    // Calculate milestone stats
    const allMilestones = contracts.flatMap(c => c.milestones || []);
    const totalMilestones = allMilestones.length;
    const completedMilestones = allMilestones.filter(m => m.status === MilestoneStatus.APPROVED).length;
    
    // Calculate pending payments (different for client vs freelancer)
    let pendingPayments = 0;
    if (role === UserRole.CLIENT) {
      // For clients: milestones submitted and awaiting approval
      pendingPayments = allMilestones
        .filter(m => m.status === MilestoneStatus.SUBMITTED)
        .reduce((sum, m) => sum + m.amount, 0);
    } else {
      // For freelancers: approved milestones not yet paid (shouldn't happen with auto-pay)
      pendingPayments = contracts.reduce((sum, c) => sum + c.remainingBalance, 0);
    }

    return {
      totalContracts,
      activeContracts,
      completedContracts,
      totalValue,
      pendingPayments,
      completedMilestones,
      totalMilestones
    };
  };

  const clientStats = calculateStats(clientContracts, UserRole.CLIENT);
  const freelancerStats = calculateStats(freelancerContracts, UserRole.FREELANCER);
  const currentStats = activeTab === UserRole.CLIENT ? clientStats : freelancerStats;
  const currentContracts = activeTab === UserRole.CLIENT ? clientContracts : freelancerContracts;

  if (loading || !mounted) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading dashboard...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!isSignedIn) {
    return null; // Will redirect
  }

  const StatCard = ({ title, value, icon: Icon, color, subtext }: {
    title: string;
    value: string | number;
    icon: any;
    color: string;
    subtext?: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 p-5"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
          <Icon className="w-[18px] h-[18px] text-blue-600" />
        </div>
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      {subtext && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtext}</p>}
    </motion.div>
  );

  const ContractCard = ({ contract, role }: { contract: Contract; role: UserRole }) => {
    const counterpartyAddress = role === UserRole.CLIENT ? contract.freelancer : contract.client;
    const { score: counterpartyScore } = useReputation(counterpartyAddress);
    const progress = contract.milestones?.length > 0
      ? (contract.milestones.filter(m => m.status === MilestoneStatus.APPROVED).length / contract.milestones.length) * 100
      : 0;

    const getStatusColor = (status: number) => {
      switch (status) {
        case ContractStatus.ACTIVE:
          return 'bg-green-100 text-green-800 border-green-200';
        case ContractStatus.COMPLETED:
          return 'bg-blue-100 text-blue-800 border-blue-200';
        case ContractStatus.DISPUTED:
          return 'bg-red-100 text-red-800 border-red-200';
        default:
          return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    };

    const getStatusText = (status: number) => {
      switch (status) {
        case ContractStatus.ACTIVE:
          return 'Active';
        case ContractStatus.COMPLETED:
          return 'Completed';
        case ContractStatus.DISPUTED:
          return 'Disputed';
        default:
          return 'Unknown';
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 p-5 hover:border-blue-300 dark:hover:border-blue-600/40 transition-all cursor-pointer group"
        onClick={() => router.push(`/contracts/${contract.id}`)}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                {contract.description}
              </h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(contract.status)}`}>
                  {getStatusText(contract.status)}
                </span>
            </div>
            
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1.5">
                {role === UserRole.CLIENT ? <User className="w-3.5 h-3.5" /> : <Briefcase className="w-3.5 h-3.5" />}
                <span>
                  {role === UserRole.CLIENT
                    ? `Worker: ${contract.freelancer.slice(0, 8)}...`
                    : `Client: ${contract.client.slice(0, 8)}...`
                  }
                </span>
                <ReputationBadge score={counterpartyScore} size="sm" />
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatDate(contract.endDate)}</span>
              </div>
            </div>
          </div>
          
          <div className="text-right flex-shrink-0 ml-4">
            <p className="text-lg font-bold text-gray-900 dark:text-white">{formatSTX(contract.totalAmount)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{formatSTX(contract.remainingBalance)} left</p>
          </div>
        </div>

        {/* Progress Bar */}
        {contract.milestones && contract.milestones.length > 0 && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
              <span>{contract.milestones.filter(m => m.status === MilestoneStatus.APPROVED).length}/{contract.milestones.length} milestones</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-800">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            ID: {contract.id} / Created {formatDate(contract.createdAt || Date.now())}
          </span>
          <div className="flex items-center gap-3">
            {contract.status === ContractStatus.ACTIVE && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/contracts/${contract.id}?action=dispute`);
                }}
                className="flex items-center gap-1 text-xs text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
              >
                <Scale className="w-3 h-3" />
                Dispute
              </button>
            )}
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              View <Eye className="w-3 h-3" />
            </span>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <AppLayout>
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
              <TierBadge tier={userTier?.tier ?? 0} />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage your escrow contracts and milestones
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isPro && (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
              >
                Upgrade to Pro
              </button>
            )}

            <button
              onClick={async () => {
                setContractsLoading(true);
                await refreshContracts();
                setContractsLoading(false);
              }}
              disabled={contractsLoading}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              title="Refresh contracts"
            >
              {contractsLoading ? 'Refreshing...' : 'Refresh Contracts'}
            </button>

            <button
              onClick={() => router.push('/dashboard/create')}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Contract
            </button>
          </div>
        </div>

        {/* Role Tabs - Pill Style */}
        <div className="mb-6">
          <div className="inline-flex bg-gray-100 dark:bg-gray-800/80 rounded-lg p-1 gap-1">
            <button
              onClick={() => setActiveTab(UserRole.CLIENT)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
                activeTab === UserRole.CLIENT
                  ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              Employer ({clientContracts.length})
            </button>
            <button
              onClick={() => setActiveTab(UserRole.FREELANCER)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
                activeTab === UserRole.FREELANCER
                  ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <User className="w-4 h-4" />
              Worker ({freelancerContracts.length})
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Contracts"
            value={currentStats.totalContracts}
            icon={FileText}
            color="text-blue-600"
          />
          <StatCard
            title="Active Projects"
            value={currentStats.activeContracts}
            icon={Activity}
            color="text-green-600"
          />
          <StatCard
            title="Total Value"
            value={formatSTX(currentStats.totalValue)}
            icon={DollarSign}
            color="text-blue-600"
          />
          <StatCard
            title="Milestone Progress"
            value={`${currentStats.completedMilestones}/${currentStats.totalMilestones}`}
            icon={CheckCircle}
            color="text-green-600"
            subtext={currentStats.totalMilestones > 0 ? `${Math.round((currentStats.completedMilestones / currentStats.totalMilestones) * 100)}% complete` : 'No milestones'}
          />
        </div>

        {/* Contract List */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {activeTab === UserRole.CLIENT ? 'Your Employer Contracts' : 'Your Worker Contracts'}
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {currentContracts.length} contract{currentContracts.length !== 1 ? 's' : ''}
            </span>
          </div>

          {contractsLoading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-3"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading contracts...</p>
            </div>
          ) : currentContracts.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="mx-auto w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                {activeTab === UserRole.CLIENT ? <Briefcase className="w-6 h-6 text-gray-400" /> : <User className="w-6 h-6 text-gray-400" />}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No {activeTab === UserRole.CLIENT ? 'client' : 'freelancer'} contracts yet
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                {activeTab === UserRole.CLIENT
                  ? "Create your first escrow contract to start working with freelancers securely on-chain."
                  : "Contracts assigned to you as a freelancer will appear here."
                }
              </p>
              {activeTab === UserRole.CLIENT && (
                <button
                  onClick={() => router.push('/dashboard/create')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create Contract
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AnimatePresence>
                {currentContracts.map((contract) => (
                  <ContractCard 
                    key={contract.id} 
                    contract={contract} 
                    role={activeTab} 
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        {currentContracts.length > 0 && (
          <div className="bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {currentContracts.slice(0, 3).map((contract) => (
                <div key={contract.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Contract "{contract.description.slice(0, 30)}..."
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Created {formatDate(contract.createdAt || Date.now())} • {formatSTX(contract.totalAmount)}
                    </p>
                  </div>
                  <button
                    onClick={() => router.push(`/contracts/${contract.id}`)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          onUpgrade={upgradeToPro}
        />
      </div>
    </div>
    </AppLayout>
  );
}
