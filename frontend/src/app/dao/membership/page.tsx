'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStacks } from '@/hooks/useStacks';
import { useCommittee, MembershipProposal } from '@/hooks/useCommittee';
import { checkDAOMembership } from '@/lib/daoContract';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  Shield,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

const REQUIRED_STAKE = 100; // 100 STX
const REQUIRED_APPROVALS = 3; // 3 out of 5 committee members

export default function MembershipPage() {
  const router = useRouter();
  const { isSignedIn, userAddress, connectWallet } = useStacks();
  const {
    checkCommitteeMember,
    getProposal,
    getPendingProposals,
    hasVoted: checkHasVoted,
    voteOnProposal,
    proposeMember
  } = useCommittee(userAddress || undefined);

  const [userProposal, setUserProposal] = useState<any | null>(null);
  const [isCommitteeMember, setIsCommitteeMember] = useState(false);
  const [checkingCommitteeStatus, setCheckingCommitteeStatus] = useState(true);
  const [committeeCheckError, setCommitteeCheckError] = useState<string | null>(null);
  const [pendingProposals, setPendingProposals] = useState<MembershipProposal[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [votingProposal, setVotingProposal] = useState<number | null>(null);

  // State for apply for membership form (nominee-driven)
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [proposerAddress, setProposerAddress] = useState('-');
  const [isApplying2, setIsApplying2] = useState(false);
  const [showVotingSection, setShowVotingSection] = useState(false); // Toggle for committee members

  // State to check if user is already a DAO member
  const [isAlreadyDAOMember, setIsAlreadyDAOMember] = useState(false);
  const [checkingDAOMembership, setCheckingDAOMembership] = useState(false);

  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showAlert = (type: 'success' | 'error' | 'info', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 8000);
  };

  // Check if user is committee member with retry logic
  useEffect(() => {
    if (!userAddress) {
      setCheckingCommitteeStatus(false);
      return;
    }

    let attempts = 0;
    const maxAttempts = 3;

    const checkStatus = async () => {
      try {
        attempts++;
        console.log(`Checking committee status (attempt ${attempts}/${maxAttempts})...`);

        const status = await checkCommitteeMember(userAddress);
        console.log('Committee member check result:', status);

        setIsCommitteeMember(status.isMember);
        setCheckingCommitteeStatus(false);
        setCommitteeCheckError(null);

        if (status.isMember) {
          console.log('User IS a committee member - showing voting UI');
        } else {
          console.log('User is NOT a committee member - showing application form');
        }
      } catch (err) {
        console.error(`Failed to check committee member status (attempt ${attempts}/${maxAttempts}):`, err);

        if (attempts < maxAttempts) {
          // Retry after 2 seconds
          setTimeout(checkStatus, 2000);
        } else {
          // Failed after all retries
          setCheckingCommitteeStatus(false);
          setCommitteeCheckError('Failed to verify committee status. Please refresh the page.');
          setIsCommitteeMember(false); // Default to false for security
        }
      }
    };

    checkStatus();
  }, [userAddress, checkCommitteeMember]);

  // Check if user is already a DAO member
  useEffect(() => {
    if (!userAddress) {
      setIsAlreadyDAOMember(false);
      return;
    }

    const checkMembership = async () => {
      try {
        setCheckingDAOMembership(true);
        console.log('Checking if user is already a DAO member...');

        const isMember = await checkDAOMembership(userAddress);
        console.log('DAO membership status:', isMember);

        setIsAlreadyDAOMember(isMember);
      } catch (error) {
        console.error('Error checking DAO membership:', error);
        setIsAlreadyDAOMember(false);
      } finally {
        setCheckingDAOMembership(false);
      }
    };

    checkMembership();
  }, [userAddress]);

  // Load pending proposals for committee members
  useEffect(() => {
    if (isCommitteeMember) {
      loadPendingProposals();
    }
  }, [isCommitteeMember]);

  const loadPendingProposals = async () => {
    setLoadingProposals(true);

    try {
      console.log('Loading pending membership proposals...');

      // Use the backend endpoint to get all pending proposals
      const allPending = await getPendingProposals();

      console.log(`Found ${allPending.length} pending proposals`);

      // Set proposals immediately so the UI renders (button appears)
      setPendingProposals(allPending);
      setLoadingProposals(false);

      // Then check vote status for each proposal in the background
      if (userAddress && allPending.length > 0) {
        const proposalsWithVoteStatus: MembershipProposal[] = [];
        for (const proposal of allPending) {
          try {
            const voted = await checkHasVoted(proposal.id, userAddress);
            proposalsWithVoteStatus.push({ ...proposal, userHasVoted: voted } as any);
          } catch {
            proposalsWithVoteStatus.push(proposal);
          }
        }
        setPendingProposals(proposalsWithVoteStatus);
      }
    } catch (err) {
      console.error('Error loading proposals:', err);
      setPendingProposals([]);
      setLoadingProposals(false);
    }
  };

  // Handle vote
  const handleVote = async (proposalId: number, approve: boolean) => {
    setVotingProposal(proposalId);

    try {
      const result = await voteOnProposal(proposalId, approve);

      if (result.success) {
        showAlert('success', `Vote ${approve ? 'approved' : 'rejected'}! TX: ${result.txId?.substring(0, 10)}... Refreshing data...`);

        // Poll for updates - try multiple times as blockchain confirmation takes time
        let attempts = 0;
        const maxAttempts = 5;
        const pollInterval = setInterval(async () => {
          attempts++;
          console.log(`Polling attempt ${attempts}/${maxAttempts}...`);
          await loadPendingProposals();

          if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            console.log('Finished polling for updates');
          }
        }, 5000); // Poll every 5 seconds, 5 times = 25 seconds total

        // Clear voting state after first refresh
        setTimeout(() => {
          setVotingProposal(null);
        }, 2000);
      } else {
        showAlert('error', result.error || 'Failed to submit vote');
        setVotingProposal(null);
      }
    } catch (error) {
      showAlert('error', 'Failed to submit vote');
      setVotingProposal(null);
    }
  };

  // Handle apply for membership (nominee-driven)
  const handleApplyForMembership = async () => {
    if (!proposerAddress) {
      showAlert('error', 'Please enter the committee member\'s address who is sponsoring you');
      return;
    }

    // Validate address format (basic check)
    if (!proposerAddress.startsWith('ST') && !proposerAddress.startsWith('SP')) {
      showAlert('error', 'Invalid Stacks address format. Must start with ST or SP.');
      return;
    }

    if (!userAddress) {
      showAlert('error', 'Please connect your wallet');
      return;
    }

    setIsApplying2(true);

    try {
      // Current user (nominee) is tx-sender, will stake their own 100 STX
      // proposerAddress is the committee member sponsoring them
      const result = await proposeMember(userAddress, proposerAddress);

      if (result.success) {
        showAlert('success', `Membership application submitted! You staked 100 STX. Sponsored by: ${proposerAddress.substring(0, 8)}... TX: ${result.txId?.substring(0, 10)}...`);

        // Reset form
        setProposerAddress('-');
        setShowApplyForm(false);

        // Reload proposals after a short delay
        setTimeout(() => {
          if (isCommitteeMember) {
            loadPendingProposals();
          }
        }, 3000);
      } else {
        showAlert('error', result.error || 'Failed to apply for membership');
      }
    } catch (error) {
      showAlert('error', 'Failed to apply for membership');
    } finally {
      setIsApplying2(false);
    }
  };


  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800/50 p-8 rounded-2xl shadow-xl text-center max-w-md">
          <Shield className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Join the DAO</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Connect your wallet to apply for DAO membership</p>
          <Button onClick={connectWallet} className="w-full">
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dao')}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to DAO
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">DAO Membership</h1>

            {checkingCommitteeStatus && (
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm font-semibold rounded-full flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Verifying...
              </span>
            )}

            {!checkingCommitteeStatus && isCommitteeMember && (
              <span className="px-3 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 text-sm font-semibold rounded-full">
                Committee Member
              </span>
            )}

            {!checkingCommitteeStatus && !isCommitteeMember && committeeCheckError && userAddress && (
              <button
                onClick={() => {
                  setCheckingCommitteeStatus(false);
                  setIsCommitteeMember(true);
                  showAlert('info', 'Manual override enabled. The blockchain will still reject votes from non-committee members.');
                }}
                className="px-3 py-1 bg-yellow-500 text-white text-xs font-semibold rounded-full hover:bg-yellow-600 transition-colors shadow-sm"
                title="Manual override if network check failed. Smart contract will still validate on-chain."
              >
                Override (Network Failed)
              </button>
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-400">Apply to become a DAO voting member</p>
        </div>

        {/* Alert */}
        {alert && (
          <div className={`mb-6 p-4 rounded-xl border ${
            alert.type === 'success' ? 'bg-green-50 border-green-200' :
            alert.type === 'error' ? 'bg-red-50 border-red-200' :
            'bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800/40'
          }`}>
            <div className="flex items-start gap-3">
              {alert.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />}
              {alert.type === 'error' && <XCircle className="h-5 w-5 text-red-600 mt-0.5" />}
              {alert.type === 'info' && <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />}
              <p className={`text-sm font-medium ${
                alert.type === 'success' ? 'text-green-800' :
                alert.type === 'error' ? 'text-red-800' :
                'text-blue-800 dark:text-blue-300'
              }`}>{alert.message}</p>
            </div>
          </div>
        )}

        {/* Network Error Warning */}
        {committeeCheckError && (
          <div className="mb-6 p-4 rounded-xl border bg-red-50 border-red-200">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 mb-1">Committee Status Check Failed</p>
                <p className="text-sm text-red-700">{committeeCheckError}</p>
                <p className="text-xs text-red-600 mt-2">
                  If you ARE a committee member, you can click "Override" above. However, the smart contract will still verify your status on-chain when you vote.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Committee Member - Pending Proposals Alert */}
        {isCommitteeMember && !showVotingSection && pendingProposals.length > 0 && (
          <div className="mb-6 p-4 rounded-xl border bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800/40">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <Users className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
                    {pendingProposals.length} Pending Application{pendingProposals.length !== 1 ? 's' : ''} Awaiting Your Vote
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    There {pendingProposals.length === 1 ? 'is' : 'are'} {pendingProposals.length} membership application{pendingProposals.length !== 1 ? 's' : ''} waiting for committee review.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setShowVotingSection(true)}
                size="sm"
                className="flex-shrink-0"
              >
                Review Applications →
              </Button>
            </div>
          </div>
        )}

        {/* Committee Voting Section - ONLY for committee members when toggled ON */}
        {isCommitteeMember && showVotingSection && (
          <>
            {/* Security Notice for Manual Override */}
            {committeeCheckError && (
              <div className="mb-6 p-4 rounded-xl border bg-yellow-50 border-yellow-200">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-800 mb-1">Manual Override Active</p>
                    <p className="text-sm text-yellow-700">
                      The network check failed, but you manually enabled committee view.
                      <strong> If you are NOT actually a committee member, your votes will be rejected by the blockchain.</strong>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Back Button */}
            <button
              onClick={() => setShowVotingSection(false)}
              className="flex items-center text-blue-600 hover:text-blue-700 mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Main Page
            </button>

            {/* Pending Applications Section */}
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Pending Applications (Committee)</h2>
                <Button onClick={loadPendingProposals} variant="outline" size="sm" disabled={loadingProposals}>
                  {loadingProposals ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
                </Button>
              </div>

            {loadingProposals ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 mx-auto mb-3 text-blue-600 animate-spin" />
                <p className="text-gray-500 dark:text-gray-400">Loading pending applications...</p>
              </div>
            ) : pendingProposals.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No pending applications</p>
                <p className="text-sm mt-1">Applications will appear here when users apply for DAO membership</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingProposals.map((proposal) => (
                  <div key={proposal.id} className="p-4 border-2 border-gray-200 dark:border-gray-700/50 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Proposal #{proposal.id}</p>
                          {(proposal as any).userHasVoted && (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 text-xs font-medium rounded">
                              You Voted
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Applicant</p>
                        <p className="font-mono text-sm text-gray-900 dark:text-white break-all">{proposal.nominee}</p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Stake</p>
                        <p className="font-bold text-gray-900 dark:text-white">{(proposal.stakeAmount / 1000000).toLocaleString()} STX</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Approvals</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${(proposal.approvals / REQUIRED_APPROVALS) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {proposal.approvals}/{REQUIRED_APPROVALS}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Rejections</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-gray-500 h-2 rounded-full transition-all"
                              style={{ width: `${(proposal.rejections / 5) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{proposal.rejections}</span>
                        </div>
                      </div>
                    </div>

                    {!(proposal as any).userHasVoted ? (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleVote(proposal.id, true)}
                          variant="default"
                          size="sm"
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                          disabled={votingProposal === proposal.id}
                        >
                          {votingProposal === proposal.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <ThumbsUp className="h-4 w-4 mr-2" />
                          )}
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleVote(proposal.id, false)}
                          variant="danger"
                          size="sm"
                          className="flex-1"
                          disabled={votingProposal === proposal.id}
                        >
                          {votingProposal === proposal.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <ThumbsDown className="h-4 w-4 mr-2" />
                          )}
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-2 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800/40">
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-300">You have already voted on this proposal</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          </>
        )}

        {/* Info Card - Always show when not in voting section */}
        {(!isCommitteeMember || !showVotingSection) && (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Membership Requirements</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Stake Requirement</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  You must stake {REQUIRED_STAKE.toLocaleString()} STX to apply. This stake will be returned if approved,
                  but may be slashed if you act maliciously as a DAO member.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Committee Approval</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your application must be approved by at least {REQUIRED_APPROVALS} out of 5 committee members.
                  The committee reviews applications to ensure quality DAO membership.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">DAO Responsibilities</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  As a DAO member, you'll vote on dispute resolutions with a 70% supermajority threshold.
                  Active participation is expected.
                </p>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Committee Member Info - Show on main page when not voting */}
        {isCommitteeMember && !showVotingSection && (
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Committee Member Actions</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Review Membership Applications</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    As a committee member, you can review and vote on pending membership applications.
                    {pendingProposals.length > 0 ? (
                      <span className="font-semibold text-blue-700 dark:text-blue-400">
                        {' '}Currently, there {pendingProposals.length === 1 ? 'is' : 'are'} {pendingProposals.length} pending application{pendingProposals.length !== 1 ? 's' : ''} waiting for your review.
                      </span>
                    ) : (
                      ' There are no pending applications at this time.'
                    )}
                  </p>
                  {pendingProposals.length > 0 && (
                    <Button onClick={() => setShowVotingSection(true)} size="sm">
                      Review {pendingProposals.length} Application{pendingProposals.length !== 1 ? 's' : '-'} →
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Your Responsibilities</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Vote carefully on membership applications. Approved members will participate in DAO governance
                    and vote on disputes. At least 3 out of 5 committee approvals are required.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Become a DAO Member</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Committee members can also apply for DAO membership! Scroll down to the application form,
                    ask another committee member to sponsor you, and stake 100 STX. You'll then go through
                    the same voting process as other applicants.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Already a DAO Member Message */}
        {isAlreadyDAOMember && !showVotingSection && (
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/40 rounded-2xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-8 w-8 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h2 className="text-xl font-bold text-blue-900 dark:text-blue-200 mb-2">You're Already a DAO Member!</h2>
                <p className="text-sm text-blue-800 dark:text-blue-300 mb-3">
                  Congratulations! You've been approved and added to the DAO. You can now participate in governance
                  by voting on proposals and disputes.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => router.push('/dao')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                  >
                    Go to DAO Dashboard
                  </button>
                  <button
                    onClick={() => router.push('/dao/proposals')}
                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-sm font-semibold"
                  >
                    View Proposals
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Apply for Membership Form - For users who are NOT already DAO members */}
        {!isAlreadyDAOMember && (!isCommitteeMember || !showVotingSection) && (
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Apply for DAO Membership</h2>

            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/40 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-semibold mb-1">How to Apply</p>
                  <p>
                    You need a committee member to sponsor your application. Enter their address below,
                    and you will stake 100 STX from your wallet. The committee will then vote on your application.
                  </p>
                  {isCommitteeMember && (
                    <p className="mt-2 font-semibold text-blue-800 dark:text-blue-200">
                      Note: As a committee member, you CAN apply to be a DAO member too! Just ask another
                      committee member to sponsor you (you cannot sponsor yourself).
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your Address (Nominee)
                </label>
                <input
                  type="text"
                  value={userAddress || '-'}
                  disabled
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 rounded-xl text-gray-500 dark:text-gray-400 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">You must be connected with this wallet to stake your 100 STX</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Committee Member Address (Sponsor) *
                </label>
                <input
                  type="text"
                  value={proposerAddress}
                  onChange={(e) => setProposerAddress(e.target.value)}
                  placeholder="Enter committee member's address (e.g., ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)"
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">The committee member who is sponsoring your application</p>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/40 rounded-lg">
                <div className="flex items-start gap-2">
                  <DollarSign className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <p className="font-semibold mb-1">Stake Requirement: 100 STX</p>
                    <p>
                      You need <span className="font-bold">100 STX available</span> in your connected wallet.
                      This will be staked when you submit your application.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleApplyForMembership}
                disabled={isApplying2 || !proposerAddress}
                className="w-full"
              >
                {isApplying2 ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting Application...
                  </>
                ) : (
                  'Apply for Membership (Stake 100 STX)'
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
    </AppLayout>
  );
}
