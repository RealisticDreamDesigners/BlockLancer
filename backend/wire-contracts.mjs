import txPkg from '@stacks/transactions';
const {
  makeContractCall,
  broadcastTransaction,
  contractPrincipalCV,
  AnchorMode,
  PostConditionMode,
} = txPkg;
import netPkg from '@stacks/network';
const { STACKS_TESTNET } = netPkg;

const DEPLOYER = 'ST30M31FNAKNX5EJKV10V7SJSE07VVDFFZHZHGE0J';
const PRIVATE_KEY = '5d2da8e1c57965180681243d2853aa9c955ea34a7156577f9663014ac4ac927c01';

const calls = [
  {
    label: '1/9 escrow-v3.set-dao-contract',
    contract: 'blocklancer-escrow-v3',
    fn: 'set-dao-contract',
    args: [contractPrincipalCV(DEPLOYER, 'blocklancer-dao-v2')],
  },
  {
    label: '2/9 escrow-v3.set-payments-contract',
    contract: 'blocklancer-escrow-v3',
    fn: 'set-payments-contract',
    args: [contractPrincipalCV(DEPLOYER, 'blocklancer-payments-v2')],
  },
  {
    label: '3/9 dispute-v4.set-dao-contract',
    contract: 'blocklancer-dispute-v4',
    fn: 'set-dao-contract',
    args: [contractPrincipalCV(DEPLOYER, 'blocklancer-dao-v2')],
  },
  {
    label: '4/9 dispute-v4.set-escrow-contract',
    contract: 'blocklancer-dispute-v4',
    fn: 'set-escrow-contract',
    args: [contractPrincipalCV(DEPLOYER, 'blocklancer-escrow-v3')],
  },
  {
    label: '5/9 dao-v2.set-escrow-contract',
    contract: 'blocklancer-dao-v2',
    fn: 'set-escrow-contract',
    args: [contractPrincipalCV(DEPLOYER, 'blocklancer-escrow-v3')],
  },
  {
    label: '6/9 dao-v2.set-dispute-contract',
    contract: 'blocklancer-dao-v2',
    fn: 'set-dispute-contract',
    args: [contractPrincipalCV(DEPLOYER, 'blocklancer-dispute-v4')],
  },
  {
    label: '7/9 dao-v2.set-membership-contract',
    contract: 'blocklancer-dao-v2',
    fn: 'set-membership-contract',
    args: [contractPrincipalCV(DEPLOYER, 'blocklancer-membership')],
  },
  {
    label: '8/9 reputation.set-escrow-contract',
    contract: 'blocklancer-reputation',
    fn: 'set-escrow-contract',
    args: [contractPrincipalCV(DEPLOYER, 'blocklancer-escrow-v3')],
  },
  {
    label: '9/9 reputation.set-dispute-contract',
    contract: 'blocklancer-reputation',
    fn: 'set-dispute-contract',
    args: [contractPrincipalCV(DEPLOYER, 'blocklancer-dispute-v4')],
  },
];

// Get current nonce
const accountUrl = `https://api.testnet.hiro.so/v2/accounts/${DEPLOYER}`;
const accountRes = await fetch(accountUrl);
const accountData = await accountRes.json();
let nonce = accountData.nonce;
console.log(`Starting nonce: ${nonce}\n`);

for (const call of calls) {
  console.log(`=== ${call.label} ===`);
  try {
    const txOptions = {
      contractAddress: DEPLOYER,
      contractName: call.contract,
      functionName: call.fn,
      functionArgs: call.args,
      senderKey: PRIVATE_KEY,
      network: STACKS_TESTNET,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      fee: 10000n,
      nonce: BigInt(nonce),
    };

    const tx = await makeContractCall(txOptions);
    const result = await broadcastTransaction({ transaction: tx, network: STACKS_TESTNET });

    if (result.error) {
      console.log(`  ERROR: ${result.error} - ${result.reason}`);
    } else {
      console.log(`  TX: ${result.txid}`);
    }
    nonce++;
  } catch (err) {
    console.log(`  FAILED: ${err.message}`);
  }
  console.log('');
}

console.log('Done! All 9 calls broadcasted.');
