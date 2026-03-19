'use client';

import React, { useState, useEffect } from 'react';
import { useStacks } from '@/hooks/useStacks';
import { useCommittee } from '@/hooks/useCommittee';
import { useContractLinking } from '@/hooks/useContractLinking';
import { useDAOAdmin, ApprovedProposal } from '@/hooks/useDAOAdmin';
import { PauseControl } from '@/components/admin/PauseControl';
import { usePayments } from '@/hooks/usePayments';
import {
  Shield,
  Users,
  Link2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  Plus,
  Trash2,
  Loader2,
  UserPlus,
  DollarSign,
  Search,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { AppLayout } from '@/components/layout';

const DEPLOYER_ADDRESS = 'ST30M31FNAKNX5EJKV10V7SJSE07VVDFFZHZHGE0J';

export default function AdminPage() {
  const { isSignedIn, userAddress, connectWallet } = useStacks();
  const { isAdmin, addCommitteeMember, removeCommitteeMember, checkCommitteeMember } = useCommittee(userAddress || undefined);
  const {
    isLinking,
    linkingStatus,
    linkMembershipToDao,
    linkDisputeToDao,
    linkMembershipReferenceToDao,
    linkEscrowToDao,
    clearLinkingStatus,
    markAllAsLinked,
    verifyLinkingStatusFromBlockchain,
  } = useContractLinking(userAddress || undefined);
  const {
    addApprovedMemberToDAO,
    getApprovedProposals,
    isDAOMember,
  } = useDAOAdmin(userAddress || undefined);

  const [activeTab, setActiveTab] = useState<'committee' | 'contracts' | 'dao-members' | 'pause' | 'fees'>('committee');
  const { platformStats, statsLoading } = usePayments();

  // Committee Members State
  const [committeeMembers, setCommitteeMembers] = useState<Array<{ address: string; verified: boolean }>>([]);
  const [newMemberAddress, setNewMemberAddress] = useState('-');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isRemovingMember, setIsRemovingMember] = useState<string | null>(null);
  const [committeeCount, setCommitteeCount] = useState(0);

  // Contract Linking State
  const [contractAddresses] = useState({
    dao: process.env.NEXT_PUBLIC_DAO_CONTRACT || 'ST30M31FNAKNX5EJKV10V7SJSE07VVDFFZHZHGE0J.blocklancer-dao-v3',
    dispute: process.env.NEXT_PUBLIC_DISPUTE_CONTRACT || 'ST30M31FNAKNX5EJKV10V7SJSE07VVDFFZHZHGE0J.blocklancer-dispute-v5',
    membership: process.env.NEXT_PUBLIC_MEMBERSHIP_CONTRACT || 'ST30M31FNAKNX5EJKV10V7SJSE07VVDFFZHZHGE0J.blocklancer-membership',
    escrow: process.env.NEXT_PUBLIC_ESCROW_CONTRACT || 'ST30M31FNAKNX5EJKV10V7SJSE07VVDFFZHZHGE0J.blocklancer-escrow-v4',
  });

  // DAO Members State
  const [approvedProposals, setApprovedProposals] = useState<ApprovedProposal[]>([]);
  const [membershipStatus, setMembershipStatus] = useState<Record<string, boolean>>({});
  const [isLoadingProposals, setIsLoadingProposals] = useState(false);
  const [isAddingToDAO, setIsAddingToDAO] = useState<string | null>(null);

  // Alerts
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showAlert = (type: 'success' | 'error' | 'info', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 8000);
  };

  // Check if user is deployer
  const isDeployer = userAddress === DEPLOYER_ADDRESS;

  // Load committee members from localStorage on mount (verification happens on button click)
  useEffect(() => {
    const saved = localStorage.getItem('committeeMembers');
    if (saved) {
      try {
        const savedMembers = JSON.parse(saved);
        setCommitteeMembers(savedMembers);
        console.log('Loaded', savedMembers.length, 'committee members from localStorage');
      } catch (e) {
        console.error('Failed to parse saved committee members');
      }
    }
  }, []);

  // Save to localStorage whenever committeeMembers changes
  useEffect(() => {
    if (committeeMembers.length > 0) {
      localStorage.setItem('committeeMembers', JSON.stringify(committeeMembers));
    }
  }, [committeeMembers]);

  // Verify contract linking status from blockchain on mount (with error handling)
  useEffect(() => {
    if (userAddress && isDeployer && verifyLinkingStatusFromBlockchain) {
      console.log('Verifying contract linking status from blockchain...');
      verifyLinkingStatusFromBlockchain().catch(err => {
        console.warn('Could not verify contract linking status:', err.message);
        // Silently fail - keep using cached localStorage values
      });
    }
  }, [userAddress, isDeployer]);

  // Verify committee members on-chain
  const verifyMember = async (address: string) => {
    const status = await checkCommitteeMember(address);
    setCommitteeCount(status.committeeCount);
    return status.isMember;
  };

  // Add committee member
  const handleAddMember = async () => {
    if (!newMemberAddress.trim()) {
      showAlert('error', 'Please enter a valid Stacks address');
      return;
    }

    if (!isDeployer) {
      showAlert('error', 'Only the deployer address can add committee members');
      return;
    }

    if (committeeMembers.length >= 5) {
      showAlert('error', 'Committee is full (maximum 5 members)');
      return;
    }

    if (committeeMembers.some(m => m.address === newMemberAddress.trim())) {
      showAlert('error', 'This address is already in the committee list');
      return;
    }

    setIsAddingMember(true);

    try {
      // Call smart contract to add committee member
      const result = await addCommitteeMember(newMemberAddress.trim());

      if (result.success) {
        // Add to local state
        setCommitteeMembers([...committeeMembers, { address: newMemberAddress.trim(), verified: false }]);
        setNewMemberAddress('-');

        showAlert('success', `Committee member added! Transaction ID: ${result.txId?.substring(0, 10)}... Wait for confirmation, then refresh to verify.`);

        // Wait a bit then verify
        setTimeout(async () => {
          const isVerified = await verifyMember(newMemberAddress.trim());
          if (isVerified) {
            setCommitteeMembers(prev =>
              prev.map(m => m.address === newMemberAddress.trim() ? { ...m, verified: true } : m)
            );
          }
        }, 3000);
      } else {
        showAlert('error', result.error || 'Failed to add committee member');
      }
    } catch (error) {
      console.error('Error adding committee member:', error);
      showAlert('error', 'Failed to add committee member. Please try again.');
    } finally {
      setIsAddingMember(false);
    }
  };

  // Remove committee member
  const handleRemoveMember = async (address: string) => {
    if (!isDeployer) {
      showAlert('error', 'Only the deployer address can remove committee members');
      return;
    }

    setIsRemovingMember(address);

    try {
      // Call smart contract to remove committee member
      const result = await removeCommitteeMember(address);

      if (result.success) {
        // Remove from local state
        setCommitteeMembers(committeeMembers.filter(m => m.address !== address));

        showAlert('success', `Committee member removed! Transaction ID: ${result.txId?.substring(0, 10)}...`);
      } else {
        showAlert('error', result.error || 'Failed to remove committee member');
      }
    } catch (error) {
      console.error('Error removing committee member:', error);
      showAlert('error', 'Failed to remove committee member. Please try again.');
    } finally {
      setIsRemovingMember(null);
    }
  };

  // Verify all members
  const handleVerifyAll = async () => {
    showAlert('info', 'Verifying all committee members on-chain...');

    for (const member of committeeMembers) {
      const isVerified = await verifyMember(member.address);
      setCommitteeMembers(prev =>
        prev.map(m => m.address === member.address ? { ...m, verified: isVerified } : m)
      );
    }

    showAlert('success', 'Verification complete!');
  };

  // Load approved proposals when DAO Members tab is active
  useEffect(() => {
    if (activeTab === 'dao-members' && isDeployer) {
      loadApprovedProposals();
    }
  }, [activeTab]);

  // Load approved proposals and check their DAO membership status
  const loadApprovedProposals = async () => {
    setIsLoadingProposals(true);
    showAlert('info', 'Loading approved membership proposals...');

    try {
      const proposals = await getApprovedProposals();
      setApprovedProposals(proposals);

      // Check DAO membership status for each nominee
      const statusChecks: Record<string, boolean> = {};
      for (const proposal of proposals) {
        const isMember = await isDAOMember(proposal.nominee);
        statusChecks[proposal.nominee] = isMember;
      }
      setMembershipStatus(statusChecks);

      showAlert('success', `Found ${proposals.length} approved proposal(s)`);
    } catch (error) {
      console.error('Error loading proposals:', error);
      showAlert('error', 'Failed to load approved proposals');
    } finally {
      setIsLoadingProposals(false);
    }
  };

  // Add approved member to DAO
  const handleAddToDAO = async (nominee: string) => {
    setIsAddingToDAO(nominee);

    try {
      const result = await addApprovedMemberToDAO(nominee);

      if (result.success) {
        showAlert('success', `Member added to DAO! TX: ${result.txId?.substring(0, 10)}... Wait for confirmation, then refresh to verify.`);

        // Wait a bit then refresh status
        setTimeout(async () => {
          const isMember = await isDAOMember(nominee);
          setMembershipStatus(prev => ({ ...prev, [nominee]: isMember }));
        }, 3000);
      } else {
        showAlert('error', result.error || 'Failed to add member to DAO');
      }
    } catch (error) {
      console.error('Error adding member to DAO:', error);
      showAlert('error', 'Failed to add member to DAO. Please try again.');
    } finally {
      setIsAddingToDAO(null);
    }
  };

  if (!isSignedIn) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-900/50 p-8 rounded-xl border border-gray-200 dark:border-gray-800 text-center max-w-md">
            <Shield className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Admin Access Required</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Connect your wallet to access the admin panel</p>
            <Button onClick={connectWallet} className="w-full">
              Connect Wallet
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Check if user is deployer
  if (!isDeployer) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-900/50 p-8 rounded-xl border border-gray-200 dark:border-gray-800 text-center max-w-md">
            <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-2">Only the deployer can access this admin panel.</p>
            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">Connected Address:</p>
              <p className="font-mono text-sm text-gray-900 dark:text-white break-all">{userAddress}</p>
            </div>
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800/40">
              <p className="text-xs text-blue-700 dark:text-blue-400">Deployer Address:</p>
              <p className="font-mono text-sm text-blue-900 dark:text-blue-300 break-all">{DEPLOYER_ADDRESS}</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
            <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
              Deployer Access
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Manage committee members and configure system contracts</p>

          {/* Admin Address Display */}
          <div className="mt-4 p-4 bg-white dark:bg-gray-900/50 rounded-lg border border-blue-200 dark:border-blue-900/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Deployer Address (You)</p>
                <p className="font-mono text-sm text-gray-900 dark:text-white">{userAddress}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Alert Banner */}
        {alert && (
          <div className={`mb-6 p-4 rounded-xl border ${
            alert.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
            alert.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
            'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/40'
          }`}>
            <div className="flex items-start gap-3">
              {alert.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />}
              {alert.type === 'error' && <XCircle className="h-5 w-5 text-red-600 mt-0.5" />}
              {alert.type === 'info' && <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />}
              <p className={`text-sm font-medium ${
                alert.type === 'success' ? 'text-green-800 dark:text-green-300' :
                alert.type === 'error' ? 'text-red-800 dark:text-red-300' :
                'text-blue-800 dark:text-blue-300'
              }`}>{alert.message}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="inline-flex bg-gray-100 dark:bg-gray-800/80 rounded-lg p-1 gap-1 mb-6">
            <button
              onClick={() => setActiveTab('committee')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'committee'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Users className="h-4 w-4 inline mr-2" />
              Committee ({committeeMembers.length}/5)
            </button>
            <button
              onClick={() => setActiveTab('contracts')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'contracts'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Link2 className="h-4 w-4 inline mr-2" />
              Contract Linking
            </button>
            <button
              onClick={() => setActiveTab('dao-members')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'dao-members'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <UserPlus className="h-4 w-4 inline mr-2" />
              DAO Members ({approvedProposals.length})
            </button>
            <button
              onClick={() => setActiveTab('pause')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'pause'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Shield className="h-4 w-4 inline mr-2" />
              Pause Controls
            </button>
            <button
              onClick={() => setActiveTab('fees')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'fees'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <DollarSign className="h-4 w-4 inline mr-2" />
              Platform Stats
            </button>
        </div>

        {/* Pause Controls Tab */}
        {activeTab === 'pause' && (
          <div className="space-y-6">
            <PauseControl deployerAddress={DEPLOYER_ADDRESS} />
          </div>
        )}

        {/* Platform Stats Tab */}
        {activeTab === 'fees' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Platform Fee Statistics</h3>
              {statsLoading ? (
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading statistics...
                </div>
              ) : platformStats ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-950 rounded-lg p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Fees Collected</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {(parseInt(platformStats.totalFees || '0', 10) / 1_000_000).toFixed(2)} STX
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-950 rounded-lg p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Transactions</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {platformStats.totalTransactions || 0}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-950 rounded-lg p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Fee Rate</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">1.5%</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">For Pro tier users</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Platform statistics unavailable. The backend may not be running or the payments contract is not configured.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Committee Members Tab */}
        {activeTab === 'committee' && (
          <div className="space-y-6">
            {/* Info Card */}
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/40 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-1">About Committee Members</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    Add 5 trusted committee members who will vote on DAO membership applications.
                    A minimum of 3 out of 5 approvals are required to accept new DAO members.
                    <strong> Transactions are submitted directly to the blockchain!</strong>
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-500 mt-2">
                    Your committee list is saved locally and persists across page refreshes. Click &quot;Verify All&quot; to check on-chain status.
                  </p>
                </div>
              </div>
            </div>

            {/* On-chain Status */}
            {committeeCount > 0 && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <p className="text-sm font-medium text-green-800 dark:text-green-300">
                    On-chain committee has {committeeCount} member{committeeCount !== 1 ? 's' : '-'}
                  </p>
                </div>
              </div>
            )}

            {/* Add Member Form */}
            <div className="bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Add Committee Member</h2>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newMemberAddress}
                  onChange={(e) => setNewMemberAddress(e.target.value)}
                  placeholder="ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
                  className="flex-1 px-4 py-3 text-sm bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 font-mono dark:text-white"
                  disabled={committeeMembers.length >= 5 || isAddingMember}
                />
                <Button
                  onClick={handleAddMember}
                  disabled={isAddingMember || committeeMembers.length >= 5 || !newMemberAddress.trim()}
                  loading={isAddingMember}
                  className="min-w-[140px]"
                >
                  {isAddingMember ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Member
                    </>
                  )}
                </Button>
              </div>
              {committeeMembers.length >= 5 && (
                <p className="text-sm text-amber-600 mt-2">Committee is full (5/5 members)</p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                This will submit a transaction to the blockchain. Approve it in your wallet.
              </p>
            </div>

            {/* Committee Members List */}
            <div className="bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Current Committee Members ({committeeMembers.length}/5)
                </h2>
                {committeeMembers.length > 0 && (
                  <Button
                    onClick={handleVerifyAll}
                    variant="outline"
                    size="sm"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Verify All
                  </Button>
                )}
              </div>

              {committeeMembers.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No committee members added yet</p>
                  <p className="text-sm mt-1">Add your first member using the form above</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {committeeMembers.map((member, index) => (
                    <div
                      key={member.address}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-700/50"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 dark:text-blue-400 font-bold">{index + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Member {index + 1}</p>
                            {member.verified && (
                              <span title="Verified on-chain"><CheckCircle className="h-4 w-4 text-green-600" /></span>
                            )}
                          </div>
                          <p className="font-mono text-sm text-gray-900 dark:text-white truncate">{member.address}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveMember(member.address)}
                        disabled={isRemovingMember === member.address}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                      >
                        {isRemovingMember === member.address ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contract Linking Tab */}
        {activeTab === 'contracts' && (
          <div className="space-y-6">
            {/* Info Card */}
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/40 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-1">Contract Integration</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    Link the DAO, Dispute, Membership, and Escrow contracts together so they can interact with each other.
                    This is a one-time setup required for the system to function properly. Click the buttons below to link each contract.
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-500 mt-2">
                    Your linking status is automatically verified from the blockchain when you refresh the page.
                  </p>
                </div>
              </div>
            </div>

            {/* Contract Addresses */}
            <div className="bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Deployed Contracts</h2>
              <div className="space-y-3">
                {Object.entries(contractAddresses).map(([name, address]) => (
                  <div key={name} className="p-4 bg-gray-50 dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-700/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">{name} Contract</p>
                        <p className="font-mono text-sm text-gray-900 dark:text-white mt-1">{address}</p>
                      </div>
                      <span title="Contract deployed"><CheckCircle className="h-5 w-5 text-gray-400" /></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Linking Actions */}
            <div className="bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Link Contracts On-Chain</h2>
                {Object.values(linkingStatus).some(status => status) && (
                  <Button
                    onClick={() => {
                      if (confirm('Are you sure you want to reset the linking status? This will only clear the UI status, not the on-chain links.')) {
                        clearLinkingStatus();
                        showAlert('info', 'Linking status cleared from UI');
                      }
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Reset Status
                  </Button>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Click each button below to link the contracts. Each button will open your wallet to sign a transaction.
                You must complete all 4 linking operations for the system to work properly.
              </p>
              <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/40 rounded-lg">
                <p className="text-xs text-blue-700 dark:text-blue-400 mb-2">
                  <strong>Note:</strong> Green checkmarks are saved locally in your browser. After linking once on-chain, the status persists across refreshes.
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  If your contracts are already linked on-chain but UI shows unlinked:
                  <button
                    onClick={() => {
                      markAllAsLinked();
                      showAlert('success', 'All contracts marked as linked');
                    }}
                    className="ml-2 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                  >
                    Mark All as Linked
                  </button>
                </p>
              </div>

              <div className="space-y-3">
                {/* Link 1: Membership → DAO */}
                <div className={`p-4 rounded-lg border-2 transition-colors ${
                  linkingStatus.membershipToDao
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-700/50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900 dark:text-white">1. Link Membership - DAO</p>
                        {linkingStatus.membershipToDao && (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Calls: <code className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">blocklancer-member-ships.set-dao-contract</code>
                      </p>
                    </div>
                    <Button
                      onClick={async () => {
                        const result = await linkMembershipToDao();
                        if (result.success) {
                          showAlert('success', `Membership → DAO linked! TX: ${result.txId?.substring(0, 10)}...`);
                        } else {
                          showAlert('error', result.error || 'Failed to link');
                        }
                      }}
                      disabled={isLinking || linkingStatus.membershipToDao}
                      size="sm"
                    >
                      {linkingStatus.membershipToDao ? (
                        <>Linked</>
                      ) : (
                        <>
                          {isLinking && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Link Now
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Link 2: Dispute → DAO */}
                <div className={`p-4 rounded-lg border-2 transition-colors ${
                  linkingStatus.disputeToDao
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-700/50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900 dark:text-white">2. Link Dispute - DAO</p>
                        {linkingStatus.disputeToDao && (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Calls: <code className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">blocklancer-dao.set-dispute-contract</code>
                      </p>
                    </div>
                    <Button
                      onClick={async () => {
                        const result = await linkDisputeToDao();
                        if (result.success) {
                          showAlert('success', `Dispute → DAO linked! TX: ${result.txId?.substring(0, 10)}...`);
                        } else {
                          showAlert('error', result.error || 'Failed to link');
                        }
                      }}
                      disabled={isLinking || linkingStatus.disputeToDao}
                      size="sm"
                    >
                      {linkingStatus.disputeToDao ? (
                        <>Linked</>
                      ) : (
                        <>
                          {isLinking && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Link Now
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Link 3: DAO → Membership Reference */}
                <div className={`p-4 rounded-lg border-2 transition-colors ${
                  linkingStatus.membershipLinkToDao
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-700/50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900 dark:text-white">3. Link DAO - Membership</p>
                        {linkingStatus.membershipLinkToDao && (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Calls: <code className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">blocklancer-dao.set-membership-contract</code>
                      </p>
                    </div>
                    <Button
                      onClick={async () => {
                        const result = await linkMembershipReferenceToDao();
                        if (result.success) {
                          showAlert('success', `DAO → Membership linked! TX: ${result.txId?.substring(0, 10)}...`);
                        } else {
                          showAlert('error', result.error || 'Failed to link');
                        }
                      }}
                      disabled={isLinking || linkingStatus.membershipLinkToDao}
                      size="sm"
                    >
                      {linkingStatus.membershipLinkToDao ? (
                        <>Linked</>
                      ) : (
                        <>
                          {isLinking && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Link Now
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Link 4: Escrow → DAO */}
                <div className={`p-4 rounded-lg border-2 transition-colors ${
                  linkingStatus.escrowToDao
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-700/50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900 dark:text-white">4. Link Escrow - DAO</p>
                        {linkingStatus.escrowToDao && (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Calls: <code className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">blocklancer-dao.set-escrow-contract</code>
                      </p>
                    </div>
                    <Button
                      onClick={async () => {
                        const result = await linkEscrowToDao();
                        if (result.success) {
                          showAlert('success', `Escrow → DAO linked! TX: ${result.txId?.substring(0, 10)}...`);
                        } else {
                          showAlert('error', result.error || 'Failed to link');
                        }
                      }}
                      disabled={isLinking || linkingStatus.escrowToDao}
                      size="sm"
                    >
                      {linkingStatus.escrowToDao ? (
                        <>Linked</>
                      ) : (
                        <>
                          {isLinking && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Link Now
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Overall Status */}
              {Object.values(linkingStatus).every(status => status) && (
                <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-900 dark:text-green-300">All Contracts Linked!</p>
                      <p className="text-sm text-green-700 dark:text-green-400">Your BlockLancer platform is fully configured and ready to use.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* DAO Members Tab */}
        {activeTab === 'dao-members' && (
          <div className="space-y-6">
            {/* Info Card */}
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/40 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-1">Manage DAO Membership</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    This tab shows all approved membership proposals (3/5 committee approvals).
                    After a proposal is approved, you must manually add the member to the DAO by clicking the &quot;Add to DAO&quot; button.
                    Once added, they can create and vote on DAO proposals.
                  </p>
                </div>
              </div>
            </div>

            {/* Approved Proposals List */}
            <div className="bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Approved Membership Proposals ({approvedProposals.length})
                </h2>
                <Button
                  onClick={loadApprovedProposals}
                  disabled={isLoadingProposals}
                  variant="outline"
                  size="sm"
                >
                  {isLoadingProposals ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <><RefreshCw className="h-4 w-4 mr-2" /> Refresh</>
                  )}
                </Button>
              </div>

              {isLoadingProposals ? (
                <div className="text-center py-12">
                  <Loader2 className="h-12 w-12 mx-auto mb-3 text-blue-600 animate-spin" />
                  <p className="text-gray-600 dark:text-gray-400">Loading approved proposals...</p>
                </div>
              ) : approvedProposals.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <UserPlus className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No approved proposals yet</p>
                  <p className="text-sm mt-1">
                    Approved membership proposals will appear here for you to add to the DAO
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {approvedProposals.map((proposal) => {
                    const isAlreadyMember = membershipStatus[proposal.nominee];
                    const isCurrentlyAdding = isAddingToDAO === proposal.nominee;

                    return (
                      <div
                        key={proposal.id}
                        className={`p-4 rounded-lg border-2 transition-colors ${
                          isAlreadyMember
                            ? 'bg-green-50 border-green-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                                Proposal #{proposal.id}
                              </span>
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Approved ({proposal.approvals}/5)
                              </span>
                              {isAlreadyMember && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  In DAO
                                </span>
                              )}
                            </div>
                            <div className="space-y-1">
                              <div>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Nominee:</p>
                                <p className="font-mono text-sm text-gray-900 dark:text-white break-all">
                                  {proposal.nominee}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Proposed by:</p>
                                <p className="font-mono text-xs text-gray-700 dark:text-gray-300 break-all">
                                  {proposal.proposer}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            {isAlreadyMember ? (
                              <Button disabled size="sm" variant="outline">
                                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                Already in DAO
                              </Button>
                            ) : (
                              <Button
                                onClick={() => handleAddToDAO(proposal.nominee)}
                                disabled={isCurrentlyAdding}
                                size="sm"
                              >
                                {isCurrentlyAdding ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Adding...
                                  </>
                                ) : (
                                  <>
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Add to DAO
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">How to Add Members</h3>
                  <ol className="text-sm text-blue-800 dark:text-blue-400 space-y-1 list-decimal list-inside">
                    <li>Committee members vote on membership applications (3/5 approvals required)</li>
                    <li>Once approved, the proposal appears in this list</li>
                    <li>Click "Add to DAO" button to manually add the member to the DAO contract</li>
                    <li>Approve the transaction in your wallet</li>
                    <li>Wait for confirmation (~30 seconds), then the member can participate in DAO governance</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </AppLayout>
  );
}
