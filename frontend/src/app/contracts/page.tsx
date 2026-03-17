'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useStacks } from '@/hooks/useStacks';
import { 
  Calendar, 
  DollarSign, 
  User, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Plus,
  Eye
} from 'lucide-react';
import { AppLayout } from '@/components/layout';
import {
  Contract,
  MilestoneStatus,
  formatSTX,
  formatDate,
  getContractStatusInfo,
  UserRole
} from '@/types';

export default function ContractListPage() {
  const router = useRouter();
  const { userData, isSignedIn, loading, connectWallet, fetchUserContracts } = useStacks();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  const calculateProgress = (milestones: any[]) => {
    if (!milestones || milestones.length === 0) {
      return { total: 0, completed: 0, percentage: 0 };
    }
    
    const total = milestones.length;
    const completed = milestones.filter(m => m.status === MilestoneStatus.APPROVED).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { total, completed, percentage };
  };

  useEffect(() => {
    if (isSignedIn && userData) {
      const loadContracts = async () => {
        const userAddress = userData.profile.stxAddress?.testnet || userData.profile.stxAddress?.mainnet;
      
        if (userAddress) {
          setLoadingContracts(true);
          try {
            const fetchedContracts = await fetchUserContracts(userAddress);
            setContracts(fetchedContracts);
            
            // Determine primary role
            const isClientInAnyContract = fetchedContracts.some(contract => contract.client === userAddress);
            const isFreelancerInAnyContract = fetchedContracts.some(contract => contract.freelancer === userAddress);
            
            if (isClientInAnyContract && !isFreelancerInAnyContract) {
              setUserRole(UserRole.CLIENT);
            } else if (isFreelancerInAnyContract && !isClientInAnyContract) {
              setUserRole(UserRole.FREELANCER);
            } else if (isClientInAnyContract && isFreelancerInAnyContract) {
              setUserRole(UserRole.CLIENT); // Default to client if both
            }
            
          } catch (error) {
          } finally {
            setLoadingContracts(false);
          }
        }
      };

      loadContracts();
    }
  }, [isSignedIn, userData, fetchUserContracts]);

  if (loading) {
    return (
      <AppLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
      </AppLayout>
    );
  }

  if (!isSignedIn) {
    return (
      <AppLayout>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="bg-white dark:bg-gray-900/50 p-8 rounded-xl border border-gray-200 dark:border-gray-800 text-center max-w-sm">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Connect Your Wallet</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Please connect your Stacks wallet to view your contracts</p>
          <button
            onClick={connectWallet}
            className="w-full px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Connect Wallet
          </button>
        </div>
      </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="bg-white dark:bg-gray-900/50 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {userRole === UserRole.CLIENT ? 'My Contracts' : 'Assigned Contracts'}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {userRole === UserRole.CLIENT
                    ? 'Manage your projects and track milestone progress'
                    : 'View your assignments and submit work'
                  }
                </p>
              </div>

              {userRole === UserRole.CLIENT && (
                <button
                  onClick={() => router.push('/dashboard/create')}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  New Contract
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Contracts Grid */}
        {loadingContracts ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-3"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading contracts...</p>
          </div>
        ) : contracts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center py-16 bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800"
          >
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No contracts found</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
              {userRole === UserRole.CLIENT
                ? "You haven't created any contracts yet. Start by creating your first project."
                : "You don't have any assigned contracts yet."
              }
            </p>
            {userRole === UserRole.CLIENT && (
              <button
                onClick={() => router.push('/dashboard/create')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Your First Contract
              </button>
            )}
          </motion.div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {contracts.map((contract, index) => {
              const statusInfo = getContractStatusInfo(contract.status);
              const progress = calculateProgress(contract.milestones);
              
              return (
                <motion.div
                  key={contract.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-900/50 rounded-xl hover:border-blue-300 dark:hover:border-blue-600/40 transition-all p-5 border border-gray-200 dark:border-gray-800 cursor-pointer group"
                  onClick={() => router.push(`/contracts/${contract.id}`)}
                >
                  {/* Status Badge */}
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color} flex items-center gap-1`}>
                      <CheckCircle className="h-3.5 w-3.5" />
                      {statusInfo.text}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">#{contract.id}</span>
                  </div>

                  {/* Contract Description */}
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {contract.description}
                  </h3>

                  {/* Contract Details */}
                  <div className="space-y-2.5 mb-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <DollarSign className="h-3.5 w-3.5 text-gray-400" />
                      <span>Total: {formatSTX(contract.totalAmount)}</span>
                      <span className="text-gray-300 dark:text-gray-600">|</span>
                      <span>Remaining: {formatSTX(contract.remainingBalance)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      <span>Due: {formatDate(contract.endDate)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <User className="h-3.5 w-3.5 text-gray-400" />
                      <span>
                        {userRole === UserRole.CLIENT
                          ? `Worker: ${contract.freelancer.slice(0, 8)}...`
                          : `Client: ${contract.client.slice(0, 8)}...`
                        }
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                      <span>{progress.completed}/{progress.total} milestones</span>
                      <span>{progress.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); router.push(`/contracts/${contract.id}`); }}
                    className="w-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
    </AppLayout>
  );
}
