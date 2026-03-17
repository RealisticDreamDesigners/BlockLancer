#!/usr/bin/env node
/**
 * BlockLancer — Wire Cross-Contract References
 * Sends all set-*-contract calls to link deployed contracts together.
 */

import {
  makeContractCall,
  broadcastTransaction,
  contractPrincipalCV,
  PostConditionMode,
  AnchorMode,
} from '@stacks/transactions';
import pkg from '@stacks/network';
const { StacksTestnet } = pkg;
const STACKS_TESTNET = new StacksTestnet();

const DEPLOYER = 'ST30M31FNAKNX5EJKV10V7SJSE07VVDFFZHZHGE0J';
const PRIVATE_KEY = process.env.DEPLOYER_KEY || '5d2da8e1c57965180681243d2853aa9c955ea34a7156577f9663014ac4ac927c01';
const HIRO_API_KEY = process.env.HIRO_API_KEY || '49c6e72fb90e5b04c2f53721cd1f9a59';
const API_BASE = 'https://api.testnet.hiro.so';

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

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function getNonce() {
  const headers = HIRO_API_KEY ? { 'X-API-Key': HIRO_API_KEY } : {};
  const resp = await fetch(`${API_BASE}/v2/accounts/${DEPLOYER}`, { headers });
  const data = await resp.json();
  return data.nonce;
}

async function waitForTx(txId, label, maxWaitMs = 300_000) {
  const cleanId = `0x${txId.replace(/^0x/, '')}`;
  const start = Date.now();
  const headers = HIRO_API_KEY ? { 'X-API-Key': HIRO_API_KEY } : {};

  while (Date.now() - start < maxWaitMs) {
    try {
      const resp = await fetch(`${API_BASE}/extended/v1/tx/${cleanId}`, { headers });
      const data = await resp.json();

      if (data.tx_status === 'success') {
        console.log(`  [OK] ${label} confirmed`);
        return true;
      }
      if (data.tx_status === 'abort_by_response' || data.tx_status === 'abort_by_post_condition') {
        console.error(`  [FAIL] ${label}: ${data.tx_result?.repr || data.tx_status}`);
        return false;
      }

      const elapsed = Math.round((Date.now() - start) / 1000);
      process.stdout.write(`\r  [WAIT] ${label}: ${data.tx_status || 'pending'} (${elapsed}s)   `);
    } catch (err) {
      const elapsed = Math.round((Date.now() - start) / 1000);
      process.stdout.write(`\r  [RETRY] ${label}: network error, retrying (${elapsed}s)   `);
    }
    await sleep(10_000);
  }

  console.warn(`\n  [TIMEOUT] ${label}`);
  return false;
}

async function main() {
  console.log('=== BlockLancer — Wire Cross-Contract References ===\n');

  let nonce = await getNonce();
  console.log(`Deployer: ${DEPLOYER}`);
  console.log(`Nonce:    ${nonce}\n`);

  // Broadcast all wiring TXs
  const txIds = [];
  for (const call of WIRING_CALLS) {
    console.log(`  Broadcasting ${call.label}...`);
    try {
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
        console.error(`  [FAIL] ${call.label}: ${result.error} - ${result.reason}`);
      } else {
        const txId = typeof result === 'string' ? result : result.txid;
        console.log(`  TX: ${txId}`);
        txIds.push({ txId, label: call.label });
      }
    } catch (err) {
      console.error(`  [ERROR] ${call.label}: ${err.message}`);
    }
    nonce++;
    await sleep(500);
  }

  // Wait for confirmations
  console.log(`\n--- Waiting for ${txIds.length} wiring TXs to confirm ---\n`);
  let success = 0;
  let failed = 0;
  for (const { txId, label } of txIds) {
    const ok = await waitForTx(txId, label);
    if (ok) success++;
    else failed++;
  }

  console.log(`\n=== Wiring Complete: ${success} success, ${failed} failed ===`);
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
