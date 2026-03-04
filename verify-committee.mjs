// Script to verify all committee members on-chain
// Run with: node verify-committee.mjs

import { fetchCallReadOnlyFunction, principalCV, cvToJSON } from '@stacks/transactions';
import { STACKS_TESTNET } from '@stacks/network';

const network = STACKS_TESTNET;

// List of addresses to check (add the addresses you think you added)
const addressesToCheck = [
  'ST3A5HQKQM3T3BV1MCZ45S6Q729V8355BQ0W0NP2V',
  'STD5ETF2HZ921C8RJG2MHPAN7SSP9AYEYD8VE055',
  'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
  'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC',
  // Add more addresses here if needed
];

async function checkCommitteeMember(memberAddress) {
  try {
    const result = await fetchCallReadOnlyFunction({
      network,
      contractAddress: 'STDCC1840NWS58QP44QMKC2BRX06VTRCZ7TGK95P',
      contractName: 'blocklancer-member-ships',
      functionName: 'get-committee-member-status',
      functionArgs: [principalCV(memberAddress)],
      senderAddress: 'STDCC1840NWS58QP44QMKC2BRX06VTRCZ7TGK95P',
    });

    const data = cvToJSON(result);

    return {
      address: memberAddress,
      isMember: data.value['is-member']?.value || false,
      committeeCount: parseInt(data.value['committee-count']?.value || '0'),
    };
  } catch (error) {
    return {
      address: memberAddress,
      isMember: false,
      committeeCount: 0,
      error: error.message,
    };
  }
}

async function verifyAllCommitteeMembers() {
  console.log('\n🔍 Verifying Committee Members on-chain...\n');
  console.log('Contract: STDCC1840NWS58QP44QMKC2BRX06VTRCZ7TGK95P.blocklancer-member-ships\n');

  const results = [];

  for (const address of addressesToCheck) {
    const result = await checkCommitteeMember(address);
    results.push(result);

    if (result.error) {
      console.log(`❌ ${address}`);
      console.log(`   Error: ${result.error}\n`);
    } else if (result.isMember) {
      console.log(`✅ ${address}`);
      console.log(`   IS a committee member`);
      console.log(`   Total committee count: ${result.committeeCount}\n`);
    } else {
      console.log(`❌ ${address}`);
      console.log(`   NOT a committee member`);
      console.log(`   Total committee count: ${result.committeeCount}\n`);
    }
  }

  const membersFound = results.filter(r => r.isMember).length;
  const totalCount = results.length > 0 ? results[0].committeeCount : 0;

  console.log('═'.repeat(60));
  console.log(`\n📊 Summary:`);
  console.log(`   Addresses checked: ${addressesToCheck.length}`);
  console.log(`   Committee members found: ${membersFound}`);
  console.log(`   Total committee count on-chain: ${totalCount}`);

  if (totalCount === 5) {
    console.log('\n✅ SUCCESS! All 5 committee members are on-chain!\n');
  } else if (totalCount > 0) {
    console.log(`\n⚠️  WARNING: Only ${totalCount} committee members on-chain (need 5)\n`);
  } else {
    console.log('\n❌ ERROR: No committee members found on-chain!\n');
  }
}

verifyAllCommitteeMembers().catch(console.error);
