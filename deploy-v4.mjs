#!/usr/bin/env node
/**
 * Deploy & Wire V4 Contracts
 * ===========================
 * Deploys: escrow-v4, dispute-v5, dao-v3
 * Wires all cross-contract references
 * Migrates DAO members
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
import { STACKS_TESTNET } from '@stacks/network';
import { readFileSync, existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { config as dotenvConfig } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from the e2e project if running from there, otherwise local
dotenvConfig();
dotenvConfig({ path: resolve(__dirname, '../blocklancer-e2e/.env') });

// Resolve contract root: try script dir first, then sibling blocklancer-stacks
const STACKS_ROOT = existsSync(resolve(__dirname, 'contracts/blocklancer-escrow-v3.clar'))
  ? __dirname
  : resolve(__dirname, '../blocklancer-stacks');

const DEPLOYER = 'ST30M31FNAKNX5EJKV10V7SJSE07VVDFFZHZHGE0J';
const PRIVATE_KEY = process.env.DEPLOYER_KEY || '5d2da8e1c57965180681243d2853aa9c955ea34a7156577f9663014ac4ac927c01';
const HIRO_API_KEY = process.env.HIRO_API_KEY || '49c6e72fb90e5b04c2f53721cd1f9a59';

const API_BASE = 'https://api.testnet.hiro.so';

// Contract name mapping: file path -> deploy name
const CONTRACTS_TO_DEPLOY = [
  { file: resolve(STACKS_ROOT, 'contracts/blocklancer-escrow-v3.clar'), name: 'blocklancer-escrow-v4' },
  { file: resolve(STACKS_ROOT, 'contracts/blocklancer-dispute-v4.clar'), name: 'blocklancer-dispute-v5' },
  { file: resolve(STACKS_ROOT, 'contracts/blocklancer-dao-v2.clar'), name: 'blocklancer-dao-v3' },
];

// Cross-contract wiring calls (after all deploys)
const WIRING_CALLS = [
  // Escrow-v4 wiring
  { label: 'escrow-v4.set-dao-contract', contract: 'blocklancer-escrow-v4', fn: 'set-dao-contract', args: () => [contractPrincipalCV(DEPLOYER, 'blocklancer-dao-v3')] },
  { label: 'escrow-v4.set-payments-contract', contract: 'blocklancer-escrow-v4', fn: 'set-payments-contract', args: () => [contractPrincipalCV(DEPLOYER, 'blocklancer-payments-v2')] },
  { label: 'escrow-v4.set-reputation-contract', contract: 'blocklancer-escrow-v4', fn: 'set-reputation-contract', args: () => [contractPrincipalCV(DEPLOYER, 'blocklancer-reputation')] },

  // Dispute-v5 wiring
  { label: 'dispute-v5.set-dao-contract', contract: 'blocklancer-dispute-v5', fn: 'set-dao-contract', args: () => [contractPrincipalCV(DEPLOYER, 'blocklancer-dao-v3')] },
  { label: 'dispute-v5.set-escrow-contract', contract: 'blocklancer-dispute-v5', fn: 'set-escrow-contract', args: () => [contractPrincipalCV(DEPLOYER, 'blocklancer-escrow-v4')] },
  { label: 'dispute-v5.set-reputation-contract', contract: 'blocklancer-dispute-v5', fn: 'set-reputation-contract', args: () => [contractPrincipalCV(DEPLOYER, 'blocklancer-reputation')] },

  // DAO-v3 wiring
  { label: 'dao-v3.set-escrow-contract', contract: 'blocklancer-dao-v3', fn: 'set-escrow-contract', args: () => [contractPrincipalCV(DEPLOYER, 'blocklancer-escrow-v4')] },
  { label: 'dao-v3.set-dispute-contract', contract: 'blocklancer-dao-v3', fn: 'set-dispute-contract', args: () => [contractPrincipalCV(DEPLOYER, 'blocklancer-dispute-v5')] },
  { label: 'dao-v3.set-membership-contract', contract: 'blocklancer-dao-v3', fn: 'set-membership-contract', args: () => [contractPrincipalCV(DEPLOYER, 'blocklancer-membership')] },

  // Reputation wiring (point to new escrow/dispute)
  { label: 'reputation.set-escrow-contract', contract: 'blocklancer-reputation', fn: 'set-escrow-contract', args: () => [contractPrincipalCV(DEPLOYER, 'blocklancer-escrow-v4')] },
  { label: 'reputation.set-dispute-contract', contract: 'blocklancer-reputation', fn: 'set-dispute-contract', args: () => [contractPrincipalCV(DEPLOYER, 'blocklancer-dispute-v5')] },

  // Membership wiring (point to new DAO)
  { label: 'membership.set-dao-contract', contract: 'blocklancer-membership', fn: 'set-dao-contract', args: () => [contractPrincipalCV(DEPLOYER, 'blocklancer-dao-v3')] },
];

// DAO members to migrate (add to dao-v3)
const DAO_MEMBERS = [
  process.env.COMMITTEE_1_ADDR,
  process.env.COMMITTEE_2_ADDR,
  process.env.COMMITTEE_3_ADDR,
  // Add more if needed
].filter(Boolean);

// --------------- Helpers ---------------

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function getNonce() {
  const headers = HIRO_API_KEY ? { 'X-API-Key': HIRO_API_KEY } : {};
  const resp = await fetch(`${API_BASE}/v2/accounts/${DEPLOYER}`, { headers });
  const data = await resp.json();
  return data.nonce;
}

async function waitForTx(txId, label, maxWaitMs = 180_000) {
  const cleanId = `0x${txId.replace(/^0x/, '')}`;
  const start = Date.now();
  const headers = HIRO_API_KEY ? { 'X-API-Key': HIRO_API_KEY } : {};

  while (Date.now() - start < maxWaitMs) {
    const resp = await fetch(`${API_BASE}/extended/v1/tx/${cleanId}`, { headers });
    const data = await resp.json();

    if (data.tx_status === 'success') {
      console.log(`   ✅ ${label} confirmed (block ${data.block_height})`);
      return true;
    }
    if (data.tx_status === 'abort_by_response' || data.tx_status === 'abort_by_post_condition') {
      const reason = data.tx_result?.repr || data.tx_status;
      console.error(`   ❌ ${label} aborted: ${reason}`);
      return false;
    }

    const elapsed = Math.round((Date.now() - start) / 1000);
    process.stdout.write(`\r   ⏳ ${label}: ${data.tx_status || 'pending'} (${elapsed}s)`);
    await sleep(10_000);
  }

  console.warn(`\n   ⚠️  ${label} timed out`);
  return false;
}

// --------------- Deploy ---------------

async function deployContract(contractFile, contractName, nonce) {
  console.log(`\n📦 Deploying ${contractName} from ${contractFile}...`);

  const codeBody = readFileSync(contractFile, 'utf8');

  const tx = await makeContractDeploy({
    contractName,
    codeBody,
    senderKey: PRIVATE_KEY,
    network: STACKS_TESTNET,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    fee: 100000n, // Higher fee for deploy
    nonce: BigInt(nonce),
    clarityVersion: 4,
  });

  const result = await broadcastTransaction({ transaction: tx, network: STACKS_TESTNET });

  if (result.error) {
    console.error(`   ❌ Deploy broadcast failed: ${result.error} - ${result.reason}`);
    return null;
  }

  const txId = typeof result === 'string' ? result : result.txid;
  console.log(`   📡 TX: ${txId}`);
  return txId;
}

// --------------- Wire ---------------

async function wireContract(call, nonce) {
  console.log(`\n🔗 ${call.label}`);

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

  const result = await broadcastTransaction({ transaction: tx, network: STACKS_TESTNET });

  if (result.error) {
    console.error(`   ❌ Wire failed: ${result.error} - ${result.reason}`);
    return null;
  }

  const txId = typeof result === 'string' ? result : result.txid;
  console.log(`   📡 TX: ${txId}`);
  return txId;
}

// --------------- Migrate DAO Members ---------------

async function addDAOMember(memberAddr, nonce) {
  console.log(`\n👤 Adding DAO member: ${memberAddr}`);

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

  const result = await broadcastTransaction({ transaction: tx, network: STACKS_TESTNET });

  if (result.error) {
    console.error(`   ❌ Add member failed: ${result.error} - ${result.reason}`);
    return null;
  }

  const txId = typeof result === 'string' ? result : result.txid;
  console.log(`   📡 TX: ${txId}`);
  return txId;
}

// --------------- Main ---------------

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('  BlockLancer V4 Deploy & Wire Script');
  console.log('═══════════════════════════════════════════════');
  console.log(`Deployer: ${DEPLOYER}`);

  let nonce = await getNonce();
  console.log(`Starting nonce: ${nonce}\n`);

  // Phase 1: Deploy contracts
  console.log('━━━ Phase 1: Deploy Contracts ━━━');
  const deployTxIds = [];
  for (const contract of CONTRACTS_TO_DEPLOY) {
    const txId = await deployContract(contract.file, contract.name, nonce);
    if (!txId) {
      console.error('Deploy failed, aborting.');
      process.exit(1);
    }
    deployTxIds.push({ txId, label: contract.name });
    nonce++;
    await sleep(2000);
  }

  // Wait for all deploys to confirm
  console.log('\n━━━ Waiting for deploys to confirm ━━━');
  for (const { txId, label } of deployTxIds) {
    const ok = await waitForTx(txId, label);
    if (!ok) {
      console.error(`\n❌ ${label} deploy failed. Aborting.`);
      process.exit(1);
    }
  }

  // Refresh nonce after deploys
  nonce = await getNonce();
  console.log(`\nNonce after deploys: ${nonce}`);

  // Phase 2: Wire contracts
  console.log('\n━━━ Phase 2: Wire Cross-Contract References ━━━');
  const wireTxIds = [];
  for (const call of WIRING_CALLS) {
    const txId = await wireContract(call, nonce);
    if (txId) {
      wireTxIds.push({ txId, label: call.label });
    }
    nonce++;
    await sleep(1000);
  }

  // Wait for wiring to confirm
  console.log('\n━━━ Waiting for wiring to confirm ━━━');
  for (const { txId, label } of wireTxIds) {
    await waitForTx(txId, label);
  }

  // Phase 3: Migrate DAO members
  if (DAO_MEMBERS.length > 0) {
    nonce = await getNonce();
    console.log(`\n━━━ Phase 3: Migrate DAO Members ━━━`);
    console.log(`Members to add: ${DAO_MEMBERS.length}`);

    const memberTxIds = [];
    for (const member of DAO_MEMBERS) {
      const txId = await addDAOMember(member, nonce);
      if (txId) {
        memberTxIds.push({ txId, label: member });
      }
      nonce++;
      await sleep(1000);
    }

    console.log('\n━━━ Waiting for member additions to confirm ━━━');
    for (const { txId, label } of memberTxIds) {
      await waitForTx(txId, label);
    }
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════');
  console.log('  Deployment Complete!');
  console.log('═══════════════════════════════════════════════');
  console.log('\nNew contract addresses:');
  console.log(`  Escrow:  ${DEPLOYER}.blocklancer-escrow-v4`);
  console.log(`  Dispute: ${DEPLOYER}.blocklancer-dispute-v5`);
  console.log(`  DAO:     ${DEPLOYER}.blocklancer-dao-v3`);
  console.log('\nUpdate your .env files:');
  console.log(`  NEXT_PUBLIC_ESCROW_CONTRACT=${DEPLOYER}.blocklancer-escrow-v4`);
  console.log(`  NEXT_PUBLIC_DISPUTE_CONTRACT=${DEPLOYER}.blocklancer-dispute-v5`);
  console.log(`  NEXT_PUBLIC_DAO_CONTRACT=${DEPLOYER}.blocklancer-dao-v3`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
