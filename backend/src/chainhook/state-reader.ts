import { callReadOnlyTyped } from '../stacks/client.js';
import { ESCROW, DISPUTE, DAO, MEMBERSHIP, PAYMENTS, REPUTATION, MARKETPLACE } from '../stacks/contracts.js';
import pino from 'pino';

const logger = pino({ name: 'state-reader' });

/** Safely extract a string from a Clarity optional field. Returns '' for (none). */
function extractOptionalString(field: any): string {
  if (!field) return '';
  if (typeof field === 'string') return field;
  if (field.value === null || field.value === undefined) return '';
  if (typeof field.value === 'string') return field.value;
  if (typeof field.value === 'object' && field.value?.value) {
    return typeof field.value.value === 'string' ? field.value.value : '';
  }
  return '';
}

/**
 * Read escrow state from blockchain.
 * Returns parsed escrow data or null.
 */
export async function readEscrowState(escrowId: number) {
  try {
    const result = await callReadOnlyTyped(
      ESCROW.address, ESCROW.name, 'get-contract', [escrowId]
    );
    if (!result || result.value === null) return null;

    const data = result.value?.value || result.value || result;

    return {
      on_chain_id: escrowId,
      client: data.client?.value || data.client || '',
      freelancer: data.freelancer?.value || data.freelancer || '',
      total_amount: String(parseInt(data['total-amount']?.value || data['total-amount'] || '0')),
      remaining_balance: String(parseInt(data['remaining-balance']?.value || data['remaining-balance'] || '0')),
      status: parseInt(data.status?.value || data.status || '0'),
      description: data.description?.value || data.description || '',
      created_at: parseInt(data['created-at']?.value || data['created-at'] || '0'),
      end_date: parseInt(data['end-date']?.value || data['end-date'] || '0'),
      token_contract: null as string | null,
    };
  } catch (err) {
    logger.error({ err, escrowId }, 'Failed to read escrow state');
    return null;
  }
}

/**
 * Read milestone state from blockchain.
 */
export async function readMilestoneState(escrowId: number, milestoneIndex: number) {
  try {
    const result = await callReadOnlyTyped(
      ESCROW.address, ESCROW.name, 'get-milestone', [escrowId, milestoneIndex]
    );
    if (!result || result.value === null) return null;

    const data = result.value?.value || result.value || result;

    return {
      escrow_on_chain_id: escrowId,
      milestone_index: milestoneIndex,
      description: data.description?.value || data.description || '',
      amount: String(parseInt(data.amount?.value || data.amount || '0')),
      deadline: parseInt(data.deadline?.value || data.deadline || '0'),
      status: parseInt(data.status?.value || data.status || '0'),
      submission_note: extractOptionalString(data['submission-note']),
      rejection_reason: extractOptionalString(data['rejection-reason']),
    };
  } catch (err) {
    logger.error({ err, escrowId, milestoneIndex }, 'Failed to read milestone state');
    return null;
  }
}

/**
 * Read dispute state from blockchain.
 */
export async function readDisputeState(disputeId: number) {
  try {
    const result = await callReadOnlyTyped(
      DISPUTE.address, DISPUTE.name, 'get-dispute', [disputeId]
    );
    if (!result || result.value === null) return null;

    const data = result.value?.value || result.value || result;

    return {
      on_chain_id: disputeId,
      contract_id: parseInt(data['contract-id']?.value || data['contract-id'] || '0'),
      opened_by: data['opened-by']?.value || data['opened-by'] || '',
      client: data.client?.value || data.client || '',
      freelancer: data.freelancer?.value || data.freelancer || '',
      reason: data.reason?.value || data.reason || '',
      client_evidence: extractOptionalString(data['client-evidence']),
      freelancer_evidence: extractOptionalString(data['freelancer-evidence']),
      status: parseInt(data.status?.value || data.status || '0'),
      resolution: parseInt(data.resolution?.value || data.resolution || '0'),
      created_at: parseInt(data['created-at']?.value || data['created-at'] || '0'),
      resolved_at: data['resolved-at']?.value
        ? parseInt(data['resolved-at'].value)
        : undefined,
    };
  } catch (err) {
    logger.error({ err, disputeId }, 'Failed to read dispute state');
    return null;
  }
}

/**
 * Read DAO proposal state from blockchain.
 */
export async function readProposalState(proposalId: number) {
  try {
    const result = await callReadOnlyTyped(
      DAO.address, DAO.name, 'get-proposal', [proposalId]
    );
    if (!result || result.value === null) return null;

    let data = result;
    if (data.value && typeof data.value === 'object' && 'value' in data.value) {
      data = data.value.value;
    } else if (data.value) {
      data = data.value;
    }

    return {
      on_chain_id: proposalId,
      proposer: data.proposer?.value || '',
      proposal_type: parseInt(data['proposal-type']?.value || '0'),
      target_contract_id: parseInt(data['target-contract-id']?.value || '0'),
      target_member: data['target-member']?.value?.value || undefined,
      description: data.description?.value || '',
      yes_votes: parseInt(data['yes-votes']?.value || '0'),
      no_votes: parseInt(data['no-votes']?.value || '0'),
      abstain_votes: parseInt(data['abstain-votes']?.value || '0'),
      total_eligible_voters: parseInt(data['total-eligible-voters']?.value || '0'),
      status: parseInt(data.status?.value || '0'),
      created_at: parseInt(data['created-at']?.value || '0'),
      voting_ends_at: parseInt(data['voting-ends-at']?.value || '0'),
      executed_at: data['executed-at']?.value?.value
        ? parseInt(data['executed-at'].value.value)
        : undefined,
    };
  } catch (err) {
    logger.error({ err, proposalId }, 'Failed to read proposal state');
    return null;
  }
}

/**
 * Read membership proposal state from blockchain.
 */
export async function readMembershipProposalState(proposalId: number) {
  try {
    const result = await callReadOnlyTyped(
      MEMBERSHIP.address, MEMBERSHIP.name, 'get-proposal', [proposalId]
    );
    if (!result || result.value === null) return null;

    const data = result.value?.value || result.value || result;

    return {
      on_chain_id: proposalId,
      nominee: data.nominee?.value || '',
      proposer: data.proposer?.value || '',
      stake_amount: String(parseInt(data['stake-amount']?.value || '0')),
      approvals: parseInt(data.approvals?.value || '0'),
      rejections: parseInt(data.rejections?.value || '0'),
      status: parseInt(data.status?.value || '0'),
      created_at: parseInt(data['created-at']?.value || '0'),
      decided_at: data['decided-at']?.value?.value
        ? parseInt(data['decided-at'].value.value)
        : undefined,
    };
  } catch (err) {
    logger.error({ err, proposalId }, 'Failed to read membership proposal state');
    return null;
  }
}

/**
 * Get total escrow count from blockchain.
 */
export async function readTotalEscrows(): Promise<number> {
  try {
    const result = await callReadOnlyTyped(
      ESCROW.address, ESCROW.name, 'get-total-contracts', []
    );
    if (result === null) return 0;
    const val = result.value !== undefined ? result.value : result;
    return parseInt(String(val)) || 0;
  } catch (err) {
    logger.error({ err }, 'Failed to read total escrows');
    return 0;
  }
}

/**
 * Get total dispute count from blockchain.
 */
export async function readTotalDisputes(): Promise<number> {
  try {
    const result = await callReadOnlyTyped(
      DISPUTE.address, DISPUTE.name, 'get-dispute-count', []
    );
    if (result === null) return 0;
    const val = result.value !== undefined ? result.value : result;
    return parseInt(String(val)) || 0;
  } catch (err) {
    logger.error({ err }, 'Failed to read total disputes');
    return 0;
  }
}

/**
 * Get total DAO proposal count from blockchain.
 * Note: DAO uses next-proposal-id which starts at 0.
 */
export async function readTotalProposals(): Promise<number> {
  try {
    const result = await callReadOnlyTyped(
      DAO.address, DAO.name, 'get-dao-stats', []
    );
    if (!result || result.value === null) return 0;

    const data = result.value?.value || result.value || result;
    return parseInt(data['next-proposal-id']?.value || '0');
  } catch (err) {
    logger.error({ err }, 'Failed to read total proposals');
    return 0;
  }
}

/**
 * Read DAO stats from blockchain.
 */
export async function readDAOStats() {
  try {
    const result = await callReadOnlyTyped(
      DAO.address, DAO.name, 'get-dao-stats', []
    );
    if (!result || result.value === null) return null;

    const data = result.value?.value || result.value || result;

    return {
      totalMembers: parseInt(data['total-members']?.value || '0'),
      maxMembers: parseInt(data['max-members']?.value || '100'),
      nextProposalId: parseInt(data['next-proposal-id']?.value || '1'),
      supermajorityThreshold: parseInt(data['supermajority-threshold']?.value || '70'),
      memberCount: parseInt(data['total-members']?.value || '0'),
    };
  } catch (err) {
    logger.error({ err }, 'Failed to read DAO stats');
    return null;
  }
}

/**
 * Read DAO member status from blockchain.
 */
export async function readDAOMemberStatus(address: string) {
  try {
    const result = await callReadOnlyTyped(
      DAO.address, DAO.name, 'get-dao-member-status', [address]
    );
    if (!result || result.value === null) return null;

    let data = result;
    if (data.value && typeof data.value === 'object' && 'value' in data.value) {
      data = data.value.value;
    } else if (data.value) {
      data = data.value;
    }

    return {
      isMember: data['is-member']?.value === true,
      memberCount: parseInt(data['member-count']?.value || '0'),
    };
  } catch (err) {
    logger.error({ err, address }, 'Failed to read DAO member status');
    return null;
  }
}

/**
 * Read committee member status from blockchain.
 */
export async function readCommitteeMemberStatus(address: string) {
  try {
    const result = await callReadOnlyTyped(
      MEMBERSHIP.address, MEMBERSHIP.name, 'get-committee-member-status', [address]
    );
    if (!result || result.value === null) return null;

    const data = result.value || result;

    return {
      isMember: data['is-member']?.value === true,
      committeeCount: parseInt(data['committee-count']?.value || '0'),
    };
  } catch (err) {
    logger.error({ err, address }, 'Failed to read committee member status');
    return null;
  }
}

/**
 * Get total membership proposals by iterating until get-proposal returns null.
 * The membership contract uses next-proposal-id starting at u1.
 */
export async function readTotalMembershipProposals(): Promise<number> {
  try {
    let count = 0;
    for (let id = 1; id <= 200; id++) {
      const result = await callReadOnlyTyped(
        MEMBERSHIP.address, MEMBERSHIP.name, 'get-proposal', [id]
      );
      if (!result || result.value === null) break;
      count = id;
    }
    return count;
  } catch (err) {
    logger.error({ err }, 'Failed to read total membership proposals');
    return 0;
  }
}

/**
 * Fetch committee member addresses from Hiro API transaction history.
 * Looks for set-committee-member calls on the membership contract.
 */
export async function fetchCommitteeAddressesFromHiro(): Promise<string[]> {
  const { config: appConfig } = await import('../config.js');
  const contractId = `${MEMBERSHIP.address}.${MEMBERSHIP.name}`;
  const url = `${appConfig.hiroApiUrl}/extended/v1/address/${contractId}/transactions?limit=50`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      logger.warn({ status: response.status }, 'Failed to fetch tx history from Hiro');
      return [];
    }

    const data = await response.json();
    const results = data.results || [];
    const addresses = new Set<string>();

    for (const tx of results) {
      if (
        tx.tx_type === 'contract_call' &&
        tx.contract_call?.function_name === 'set-committee-member'
      ) {
        // Extract the member principal from function args
        const args = tx.contract_call.function_args || [];
        const memberArg = args.find((a: any) => a.name === 'member');
        if (memberArg?.repr) {
          // repr looks like 'ST...' or "'ST..." - strip leading quote
          const addr = memberArg.repr.replace(/^'/, '');
          if (addr.startsWith('ST') || addr.startsWith('SP')) {
            addresses.add(addr);
          }
        }
      }
    }

    return Array.from(addresses);
  } catch (err) {
    logger.error({ err }, 'Failed to fetch committee addresses from Hiro');
    return [];
  }
}

/**
 * Fetch DAO member addresses from Hiro API transaction history.
 * Looks for admin-add-dao-member calls on the DAO contract.
 */
export async function fetchDAOMemberAddressesFromHiro(): Promise<string[]> {
  const { config: appConfig } = await import('../config.js');
  const contractId = `${DAO.address}.${DAO.name}`;
  const url = `${appConfig.hiroApiUrl}/extended/v1/address/${contractId}/transactions?limit=50`;

  try {
    const response = await fetch(url);
    if (!response.ok) return [];

    const data = await response.json();
    const results = data.results || [];
    const addresses = new Set<string>();

    for (const tx of results) {
      if (
        tx.tx_type === 'contract_call' &&
        tx.contract_call?.function_name === 'admin-add-dao-member' &&
        tx.tx_status === 'success'
      ) {
        const args = tx.contract_call.function_args || [];
        const memberArg = args.find((a: any) => a.name === 'new-member');
        if (memberArg?.repr) {
          const addr = memberArg.repr.replace(/^'/, '');
          if (addr.startsWith('ST') || addr.startsWith('SP')) {
            addresses.add(addr);
          }
        }
      }
    }

    return Array.from(addresses);
  } catch (err) {
    logger.error({ err }, 'Failed to fetch DAO member addresses from Hiro');
    return [];
  }
}

/**
 * Fetch job application data from Hiro API transaction history.
 * Returns array of {jobId, applicant} pairs from apply-to-job calls.
 */
export async function fetchJobApplicationsFromHiro(): Promise<Array<{ jobId: number; applicant: string }>> {
  const { config: appConfig } = await import('../config.js');
  const contractId = `${MARKETPLACE.address}.${MARKETPLACE.name}`;
  const url = `${appConfig.hiroApiUrl}/extended/v1/address/${contractId}/transactions?limit=50`;

  try {
    const response = await fetch(url);
    if (!response.ok) return [];

    const data = await response.json();
    const results = data.results || [];
    const applications: Array<{ jobId: number; applicant: string }> = [];

    for (const tx of results) {
      if (
        tx.tx_type === 'contract_call' &&
        tx.contract_call?.function_name === 'apply-to-job' &&
        tx.tx_status === 'success'
      ) {
        const args = tx.contract_call.function_args || [];
        const jobIdArg = args.find((a: any) => a.name === 'job-id');
        const applicant = tx.sender_address;
        if (jobIdArg?.repr && applicant) {
          const jobId = parseInt(jobIdArg.repr.replace(/^u/, ''));
          if (!isNaN(jobId)) {
            applications.push({ jobId, applicant });
          }
        }
      }
    }

    return applications;
  } catch (err) {
    logger.error({ err }, 'Failed to fetch job applications from Hiro');
    return [];
  }
}

/**
 * Read user tier info from payments contract.
 */
export async function readUserTierInfo(address: string) {
  try {
    const result = await callReadOnlyTyped(
      PAYMENTS.address, PAYMENTS.name, 'get-user-tier-info', [address]
    );
    if (!result || result.value === null) return null;

    const data = result.value?.value || result.value || result;

    return {
      address,
      tier: parseInt(data.tier?.value || data.tier || '0'),
      total_fees_paid: '0', // Computed from stats
    };
  } catch (err) {
    logger.error({ err, address }, 'Failed to read user tier info');
    return null;
  }
}

/**
 * Read platform stats from payments contract.
 */
export async function readPlatformStats() {
  try {
    const result = await callReadOnlyTyped(
      PAYMENTS.address, PAYMENTS.name, 'get-platform-stats', []
    );
    if (!result || result.value === null) return null;

    const data = result.value?.value || result.value || result;

    return {
      totalFees: String(parseInt(data['total-fees']?.value || data['total-fees'] || '0')),
      treasury: data.treasury?.value || data.treasury || '',
    };
  } catch (err) {
    logger.error({ err }, 'Failed to read platform stats');
    return null;
  }
}

/**
 * Read pause state from a contract.
 */
export async function readPauseState(contractAddress: string, contractName: string) {
  try {
    const result = await callReadOnlyTyped(
      contractAddress, contractName, 'is-paused', []
    );
    if (result === null) return null;

    const val = result.value !== undefined ? result.value : result;
    return val === true || val === 'true';
  } catch (err) {
    logger.error({ err, contractName }, 'Failed to read pause state');
    return null;
  }
}

/**
 * Read reputation state from blockchain.
 */
export async function readReputationState(address: string) {
  try {
    if (!REPUTATION.name) return null;
    const result = await callReadOnlyTyped(
      REPUTATION.address, REPUTATION.name, 'get-reputation', [address]
    );
    if (!result || result.value === null) return null;

    const data = result.value?.value || result.value || result;

    return {
      address,
      score: parseInt(data.score?.value || data.score || '500'),
      completed_escrows: parseInt(data['completed-escrows']?.value || data['completed-escrows'] || '0'),
      cancelled_escrows: parseInt(data['cancelled-escrows']?.value || data['cancelled-escrows'] || '0'),
      disputes_opened: parseInt(data['disputes-opened']?.value || data['disputes-opened'] || '0'),
      disputes_won: parseInt(data['disputes-won']?.value || data['disputes-won'] || '0'),
      disputes_lost: parseInt(data['disputes-lost']?.value || data['disputes-lost'] || '0'),
      on_time_completions: parseInt(data['on-time-completions']?.value || data['on-time-completions'] || '0'),
      late_completions: parseInt(data['late-completions']?.value || data['late-completions'] || '0'),
      total_volume: String(parseInt(data['total-volume']?.value || data['total-volume'] || '0')),
      last_updated: parseInt(data['last-updated']?.value || data['last-updated'] || '0'),
    };
  } catch (err) {
    logger.error({ err, address }, 'Failed to read reputation state');
    return null;
  }
}

/**
 * Read job state from marketplace contract.
 */
export async function readJobState(jobId: number) {
  try {
    if (!MARKETPLACE.name) return null;
    const result = await callReadOnlyTyped(
      MARKETPLACE.address, MARKETPLACE.name, 'get-job', [jobId]
    );
    if (!result || result.value === null) return null;

    const data = result.value?.value || result.value || result;

    return {
      on_chain_id: jobId,
      poster: data.poster?.value || data.poster || '',
      title: data.title?.value || data.title || '',
      description: data.description?.value || data.description || '',
      budget_min: String(parseInt(data['budget-min']?.value || data['budget-min'] || '0')),
      budget_max: String(parseInt(data['budget-max']?.value || data['budget-max'] || '0')),
      deadline: parseInt(data.deadline?.value || data.deadline || '0'),
      status: parseInt(data.status?.value || data.status || '0'),
      skills: data.skills?.value || data.skills || '',
      created_at: parseInt(data['created-at']?.value || data['created-at'] || '0'),
      escrow_id: data['escrow-id']?.value?.value
        ? parseInt(data['escrow-id'].value.value)
        : null,
      application_count: parseInt(data['application-count']?.value || data['application-count'] || '0'),
    };
  } catch (err) {
    logger.error({ err, jobId }, 'Failed to read job state');
    return null;
  }
}

/**
 * Read job application state from marketplace contract.
 */
export async function readJobApplicationState(jobId: number, applicant: string) {
  try {
    if (!MARKETPLACE.name) return null;
    const result = await callReadOnlyTyped(
      MARKETPLACE.address, MARKETPLACE.name, 'get-application', [jobId, applicant]
    );
    if (!result || result.value === null) return null;

    const data = result.value?.value || result.value || result;

    return {
      job_on_chain_id: jobId,
      applicant,
      cover_letter: data['cover-letter']?.value || data['cover-letter'] || '',
      proposed_amount: String(parseInt(data['proposed-amount']?.value || data['proposed-amount'] || '0')),
      proposed_timeline: parseInt(data['proposed-timeline']?.value || data['proposed-timeline'] || '0'),
      status: parseInt(data.status?.value || data.status || '0'),
      applied_at: parseInt(data['applied-at']?.value || data['applied-at'] || '0'),
    };
  } catch (err) {
    logger.error({ err, jobId, applicant }, 'Failed to read job application state');
    return null;
  }
}

/**
 * Read total jobs from marketplace contract.
 */
export async function readTotalJobs(): Promise<number> {
  try {
    if (!MARKETPLACE.name) return 0;
    const result = await callReadOnlyTyped(
      MARKETPLACE.address, MARKETPLACE.name, 'get-job-count', []
    );
    if (result === null) return 0;
    const val = result.value !== undefined ? result.value : result;
    return parseInt(String(val)) || 0;
  } catch (err) {
    logger.error({ err }, 'Failed to read total jobs');
    return 0;
  }
}

/**
 * Read contract references from DAO.
 */
export async function readContractReferences() {
  try {
    const result = await callReadOnlyTyped(
      DAO.address, DAO.name, 'get-contract-references', []
    );
    if (!result || result.value === null) return null;

    const data = result.value?.value || result.value || result;

    return {
      membershipContract: data['membership-contract']?.value?.value || data['membership-contract']?.value || null,
      disputeContract: data['dispute-contract']?.value?.value || data['dispute-contract']?.value || null,
      escrowContract: data['escrow-contract']?.value?.value || data['escrow-contract']?.value || null,
    };
  } catch (err) {
    logger.error({ err }, 'Failed to read contract references');
    return null;
  }
}
