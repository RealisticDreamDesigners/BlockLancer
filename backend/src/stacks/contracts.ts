import { config, parseContractId } from '../config.js';

export const ESCROW = parseContractId(config.contracts.escrow);
export const DISPUTE = parseContractId(config.contracts.dispute);
export const DAO = parseContractId(config.contracts.dao);
export const MEMBERSHIP = parseContractId(config.contracts.membership);
export const PAYMENTS = parseContractId(config.contracts.payments);
export const REPUTATION = parseContractId(config.contracts.reputation);
export const MARKETPLACE = parseContractId(config.contracts.marketplace);

// Function names per contract for chainhook matching
export const ESCROW_FUNCTIONS = [
  'create-escrow',
  'add-milestone',
  'submit-milestone',
  'approve-milestone',
  'reject-milestone',
  'claim-deadline-refund',
  'set-paused',
  'set-reputation-contract',
] as const;

export const DISPUTE_FUNCTIONS = [
  'open-dispute',
  'submit-evidence',
  'dao-resolve-dispute',
  'withdraw-dispute',
  'set-paused',
  'set-reputation-contract',
] as const;

export const DAO_FUNCTIONS = [
  'propose-dispute-resolution',
  'propose-escrow-release',
  'propose-escrow-refund',
  'vote-on-proposal',
  'finalize-proposal-manual',
  'admin-add-dao-member',
  'set-paused',
] as const;

export const MEMBERSHIP_FUNCTIONS = [
  'set-committee-member',
  'propose-member',
  'vote-on-proposal',
] as const;

export const PAYMENTS_FUNCTIONS = [
  'set-user-tier',
  'upgrade-to-pro',
  'process-platform-fee',
  'calculate-platform-fee',
  'set-paused',
] as const;

export const REPUTATION_FUNCTIONS = [
  'record-escrow-completion',
  'record-dispute-outcome',
  'record-dispute-opened',
  'record-on-time-completion',
  'record-late-completion',
  'record-escrow-cancellation',
  'set-paused',
] as const;

export const MARKETPLACE_FUNCTIONS = [
  'post-job',
  'apply-to-job',
  'accept-application',
  'reject-application',
  'link-escrow-to-job',
  'cancel-job',
  'set-paused',
] as const;
