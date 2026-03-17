#!/usr/bin/env node
/**
 * BlockLancer Full Deploy & Wire Script
 * ======================================
 * Deploys ALL 7 contracts in dependency order:
 *   Batch 1 (no deps): payments-v2, reputation, marketplace, membership
 *   Batch 2 (depends on batch 1): escrow-v4
 *   Batch 3 (depends on batch 2): dispute-v5
 *   Batch 4 (depends on batches 2+3): dao-v3
 * Then wires all cross-contract references.
 *
 * Usage: node deploy-v4.mjs
 * Requires: DEPLOYER_KEY in .env or environment
 */

import {
  makeContractDeploy,
  makeContractCall,
  broadcastTransaction,
  contractPrincipalCV,
  principalCV,
  PostConditionMode,
  AnchorMode,
} from '@stacks/transactions';
import pkg from '@stacks/network';
const { StacksTestnet } = pkg;
const STACKS_TESTNET = new StacksTestnet();
import { readFileSync, existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { config as dotenvConfig } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenvConfig();
dotenvConfig({ path: resolve(__dirname, '../blocklancer-e2e/.env') });

const STACKS_ROOT = existsSync(resolve(__dirname, 'contracts/blocklancer-escrow-v3.clar'))
  ? __dirname
  : resolve(__dirname, '../blocklancer-stacks');

const DEPLOYER = 'ST30M31FNAKNX5EJKV10V7SJSE07VVDFFZHZHGE0J';
const PRIVATE_KEY = process.env.DEPLOYER_KEY || '5d2da8e1c57965180681243d2853aa9c955ea34a7156577f9663014ac4ac927c01';
const HIRO_API_KEY = process.env.HIRO_API_KEY || '49c6e72fb90e5b04c2f53721cd1f9a59';

const API_BASE = 'https://api.testnet.hiro.so';

// ─── Contract deployment batches (ordered by dependency) ───

const DEPLOY_BATCHES = [
  {
    label: 'Batch 1: Base contracts (no dependencies)',
    contracts: [
      { file: resolve(STACKS_ROOT, 'contracts/blocklancer-payments-v2.clar'), name: 'blocklancer-payments-v2' },
      { file: resolve(STACKS_ROOT, 'contracts/blocklancer-reputation.clar'),  name: 'blocklancer-reputation' },
      { file: resolve(STACKS_ROOT, 'contracts/blocklancer-marketplace.clar'), name: 'blocklancer-marketplace' },
      { file: resolve(STACKS_ROOT, 'contracts/blocklancer-membership.clar'),  name: 'blocklancer-membership' },
    ],
  },
  {
    label: 'Batch 2: Escrow (depends on payments-v2, reputation)',
    contracts: [
      { file: resolve(STACKS_ROOT, 'contracts/blocklancer-escrow-v3.clar'), name: 'blocklancer-escrow-v4' },
    ],
  },
  {
    label: 'Batch 3: Dispute (depends on escrow-v4, reputation)',
    contracts: [
      { file: resolve(STACKS_ROOT, 'contracts/blocklancer-dispute-v4.clar'), name: 'blocklancer-dispute-v5' },
    ],
  },
  {
    label: 'Batch 4: DAO (depends on escrow-v4, dispute-v5)',
    contracts: [
      { file: resolve(STACKS_ROOT, 'contracts/blocklancer-dao-v2.clar'), name: 'blocklancer-dao-v3' },
    ],
  },
];

// ─── Cross-contract wiring calls (after all deploys) ───

const WIRING_CALLS = [
  // Escrow-v4 wiring
  { label: 'escrow-v4.set-dao-contract',        contract: 'blocklancer-escrow-v4',   fn: 'set-dao-contract',        args: () => [contractPrincipalCV(DEPLOYER, 'blocklancer-dao-v3')] },
  { label: 'escrow-v4.set-payments-contract',    contract: 'blocklancer-escrow-v4',   fn: 'set-payments-contract',   args: () => [contractPrincipalCV(DEPLOYER, 'blocklancer-payments-v2')] },
  { label: 'escrow-v4.set-reputation-contract',  contract: 'blocklancer-escrow-v4',   fn: 'set-reputation-contract', args: () => [contractPrincipalCV(DEPLOYER, 'blocklancer-reputation')] },

  // Dispute-v5 wiring
  { label: 'dispute-v5.set-dao-contract',        contract: 'blocklancer-dispute-v5',  fn: 'set-dao-contract',        args: () => [contractPrincipalCV(DEPLOYER, 'blocklancer-dao-v3')] },
  { label: 'dispute-v5.set-escrow-contract',     contract: 'blocklancer-dispute-v5',  fn: 'set-escrow-contract',     args: () => [contractPrincipalCV(DEPLOYER, 'blocklancer-escrow-v4')] },
  { label: 'dispute-v5.set-reputation-contract', contract: 'blocklancer-dispute-v5',  fn: 'set-reputation-contract', args: () => [contractPrincipalCV(DEPLOYER, 'blocklancer-reputation')] },

  // DAO-v3 wiring
  { label: 'dao-v3.set-escrow-contract',         contract: 'blocklancer-dao-v3',      fn: 'set-escrow-contract',     args: () => [contractPrincipalCV(DEPLOYER, 'blocklancer-escrow-v4')] },
  { label: 'dao-v3.set-dispute-contract',        contract: 'blocklancer-dao-v3',      fn: 'set-dispute-contract',    args: () => [contractPrincipalCV(DEPLOYER, 'blocklancer-dispute-v5')] },
  { label: 'dao-v3.set-membership-contract',     contract: 'blocklancer-dao-v3',      fn: 'set-membership-contract', args: () => [contractPrincipalCV(DEPLOYER, 'blocklancer-membership')] },

  // Reputation wiring
  { label: 'reputation.set-escrow-contract',     contract: 'blocklancer-reputation',  fn: 'set-escrow-contract',     args: () => [contractPrincipalCV(DEPLOYER, 'blocklancer-escrow-v4')] },
  { label: 'reputation.set-dispute-contract',    contract: 'blocklancer-reputation',  fn: 'set-dispute-contract',    args: () => [contractPrincipalCV(DEPLOYER, 'blocklancer-dispute-v5')] },

  // Membership wiring
  { label: 'membership.set-dao-contract',        contract: 'blocklancer-membership',  fn: 'set-dao-contract',        args: () => [contractPrincipalCV(DEPLOYER, 'blocklancer-dao-v3')] },
];

// DAO members to migrate
const DAO_MEMBERS = [
  process.env.COMMITTEE_1_ADDR,
  process.env.COMMITTEE_2_ADDR,
  process.env.COMMITTEE_3_ADDR,
].filter(Boolean);

// ─── Helpers ───

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function getNonce() {
  const headers = HIRO_API_KEY ? { 'X-API-Key': HIRO_API_KEY } : {};
  const resp = await fetch(`${API_BASE}/v2/accounts/${DEPLOYER}`, { headers });
  const data = await resp.json();
  return data.nonce;
}

async function getBalance() {
  const headers = HIRO_API_KEY ? { 'X-API-Key': HIRO_API_KEY } : {};
  const resp = await fetch(`${API_BASE}/v2/accounts/${DEPLOYER}`, { headers });
  const data = await resp.json();
  const balanceHex = data.balance;
  return Number(BigInt(balanceHex)) / 1_000_000;
}

async function waitForTx(txId, label, maxWaitMs = 300_000) {
  const cleanId = `0x${txId.replace(/^0x/, '')}`;
  const start = Date.now();
  const headers = HIRO_API_KEY ? { 'X-API-Key': HIRO_API_KEY } : {};

  while (Date.now() - start < maxWaitMs) {
    const resp = await fetch(`${API_BASE}/extended/v1/tx/${cleanId}`, { headers });
    const data = await resp.json();

    if (data.tx_status === 'success') {
      console.log(`   [OK] ${label} confirmed (block ${data.block_height})`);
      return true;
    }
    if (data.tx_status === 'abort_by_response' || data.tx_status === 'abort_by_post_condition') {
      const reason = data.tx_result?.repr || data.tx_status;
      console.error(`   [FAIL] ${label} aborted: ${reason}`);
      return false;
    }

    const elapsed = Math.round((Date.now() - start) / 1000);
    process.stdout.write(`\r   [WAIT] ${label}: ${data.tx_status || 'pending'} (${elapsed}s)   `);
    await sleep(10_000);
  }

  console.warn(`\n   [TIMEOUT] ${label} timed out after ${maxWaitMs / 1000}s`);
  return false;
}

async function checkContractExists(contractName) {
  const headers = HIRO_API_KEY ? { 'X-API-Key': HIRO_API_KEY } : {};
  try {
    const resp = await fetch(`${API_BASE}/v2/contracts/interface/${DEPLOYER}/${contractName}`, { headers });
    const data = await resp.json();
    return !!data.functions;
  } catch {
    return false;
  }
}

// ─── Deploy ───

async function deployContract(contractFile, contractName, nonce) {
  console.log(`\n  Deploying ${contractName} ...`);

  const codeBody = readFileSync(contractFile, 'utf8');

  const tx = await makeContractDeploy({
    contractName,
    codeBody,
    senderKey: PRIVATE_KEY,
    network: STACKS_TESTNET,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    fee: 100000n,
    nonce: BigInt(nonce),
    clarityVersion: 4,
  });

  const result = await broadcastTransaction(tx, STACKS_TESTNET);

  if (result.error) {
    console.error(`   [FAIL] Deploy broadcast failed: ${result.error} - ${result.reason}`);
    return null;
  }

  const txId = typeof result === 'string' ? result : result.txid;
  console.log(`   TX: ${txId}`);
  return txId;
}

// ─── Wire ───

async function wireContract(call, nonce) {
  console.log(`\n  Wiring ${call.label} ...`);

  const tx = await makeContractCall({
    contractAddress: DEPLOYER,
    contractName: call.contract,
    functionName: call.fn,
    functionArgs: call.args(),
    senderKey: PRIVATE_KEY,
    network: STACKS_TESTNET,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    fee: 10000n,
    nonce: BigInt(nonce),
  });

  const result = await broadcastTransaction(tx, STACKS_TESTNET);

  if (result.error) {
    console.error(`   [FAIL] Wire failed: ${result.error} - ${result.reason}`);
    return null;
  }

  const txId = typeof result === 'string' ? result : result.txid;
  console.log(`   TX: ${txId}`);
  return txId;
}

// ─── Migrate DAO Members ───

async function addDAOMember(memberAddr, nonce) {
  console.log(`\n  Adding DAO member: ${memberAddr}`);

  const tx = await makeContractCall({
    contractAddress: DEPLOYER,
    contractName: 'blocklancer-dao-v3',
    functionName: 'admin-add-dao-member',
    functionArgs: [principalCV(memberAddr)],
    senderKey: PRIVATE_KEY,
    network: STACKS_TESTNET,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    fee: 10000n,
    nonce: BigInt(nonce),
  });

  const result = await broadcastTransaction(tx, STACKS_TESTNET);

  if (result.error) {
    console.error(`   [FAIL] Add member failed: ${result.error} - ${result.reason}`);
    return null;
  }

  const txId = typeof result === 'string' ? result : result.txid;
  console.log(`   TX: ${txId}`);
  return txId;
}

// ─── Main ───

async function main() {
  console.log('====================================================');
  console.log('  BlockLancer — Full Deploy & Wire (All 7 Contracts)');
  console.log('====================================================');
  console.log(`Deployer:  ${DEPLOYER}`);

  const balance = await getBalance();
  console.log(`Balance:   ${balance.toFixed(2)} STX`);

  if (balance < 2) {
    console.error('\n[FAIL] Insufficient balance. Need at least 2 STX for deployment.');
    process.exit(1);
  }

  let nonce = await getNonce();
  console.log(`Nonce:     ${nonce}`);

  // Pre-flight: check if contracts already exist
  console.log('\n--- Pre-flight: Checking existing contracts ---');
  const allContracts = DEPLOY_BATCHES.flatMap(b => b.contracts);
  for (const c of allContracts) {
    const exists = await checkContractExists(c.name);
    console.log(`  ${c.name}: ${exists ? 'ALREADY DEPLOYED (will skip)' : 'not found (will deploy)'}`);
  }

  // Phase 1: Deploy contracts in batches
  console.log('\n====================================================');
  console.log('  Phase 1: Deploy Contracts');
  console.log('====================================================');

  for (const batch of DEPLOY_BATCHES) {
    console.log(`\n--- ${batch.label} ---`);

    const batchTxIds = [];
    for (const contract of batch.contracts) {
      // Skip if already deployed
      const exists = await checkContractExists(contract.name);
      if (exists) {
        console.log(`\n  ${contract.name} already deployed, skipping.`);
        continue;
      }

      const txId = await deployContract(contract.file, contract.name, nonce);
      if (!txId) {
        console.error(`\n[FAIL] ${contract.name} deploy failed. Aborting.`);
        process.exit(1);
      }
      batchTxIds.push({ txId, label: contract.name });
      nonce++;
      await sleep(2000);
    }

    // Wait for this batch to confirm before moving to next
    if (batchTxIds.length > 0) {
      console.log(`\n  Waiting for ${batch.label} to confirm...`);
      for (const { txId, label } of batchTxIds) {
        const ok = await waitForTx(txId, label);
        if (!ok) {
          console.error(`\n[FAIL] ${label} deploy failed. Aborting.`);
          process.exit(1);
        }
      }
    }
  }

  // Refresh nonce after all deploys
  nonce = await getNonce();
  console.log(`\nNonce after deploys: ${nonce}`);

  // Phase 2: Wire contracts
  console.log('\n====================================================');
  console.log('  Phase 2: Wire Cross-Contract References');
  console.log('====================================================');

  const wireTxIds = [];
  for (const call of WIRING_CALLS) {
    const txId = await wireContract(call, nonce);
    if (txId) {
      wireTxIds.push({ txId, label: call.label });
    }
    nonce++;
    await sleep(1000);
  }

  console.log('\n  Waiting for wiring to confirm...');
  for (const { txId, label } of wireTxIds) {
    await waitForTx(txId, label);
  }

  // Phase 3: Migrate DAO members
  if (DAO_MEMBERS.length > 0) {
    nonce = await getNonce();
    console.log('\n====================================================');
    console.log(`  Phase 3: Migrate DAO Members (${DAO_MEMBERS.length})`);
    console.log('====================================================');

    const memberTxIds = [];
    for (const member of DAO_MEMBERS) {
      const txId = await addDAOMember(member, nonce);
      if (txId) {
        memberTxIds.push({ txId, label: member });
      }
      nonce++;
      await sleep(1000);
    }

    console.log('\n  Waiting for member additions to confirm...');
    for (const { txId, label } of memberTxIds) {
      await waitForTx(txId, label);
    }
  }

  // Summary
  const finalBalance = await getBalance();
  console.log('\n====================================================');
  console.log('  Deployment Complete!');
  console.log('====================================================');
  console.log(`\nDeployer:        ${DEPLOYER}`);
  console.log(`Balance before:  ${balance.toFixed(2)} STX`);
  console.log(`Balance after:   ${finalBalance.toFixed(2)} STX`);
  console.log(`Cost:            ${(balance - finalBalance).toFixed(2)} STX`);
  console.log('\nAll contract addresses:');
  console.log(`  Payments:    ${DEPLOYER}.blocklancer-payments-v2`);
  console.log(`  Reputation:  ${DEPLOYER}.blocklancer-reputation`);
  console.log(`  Marketplace: ${DEPLOYER}.blocklancer-marketplace`);
  console.log(`  Membership:  ${DEPLOYER}.blocklancer-membership`);
  console.log(`  Escrow:      ${DEPLOYER}.blocklancer-escrow-v4`);
  console.log(`  Dispute:     ${DEPLOYER}.blocklancer-dispute-v5`);
  console.log(`  DAO:         ${DEPLOYER}.blocklancer-dao-v3`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
