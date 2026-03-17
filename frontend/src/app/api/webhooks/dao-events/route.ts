// api/webhooks/dao-events/route.ts
import { NextRequest, NextResponse } from 'next/server';

interface ChainhookPayload {
  apply: Array<{
    block_identifier: {
      index: number;
      hash: string;
    };
    transactions: Array<{
      transaction_identifier: { hash: string };
      operations: Array<{
        type: string;
        status: string;
        result: any;
      }>;
      metadata: {
        contract_call?: {
          contract_id: string;
          function_name: string;
          function_args: any[];
        };
        receipt: {
          contract_calls_stack: any[];
          events: any[];
        };
      };
    }>;
  }>;
  rollback: Array<any>;
  chainhook: {
    uuid: string;
    predicate: any;
  };
}

/**
 * Webhook handler for DAO contract events
 * Receives chainhook events from the blocklancer-dao contract
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CHAINHOOK_SECRET_TOKEN || 'local_dev_secret';

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      console.warn('Unauthorized chainhook request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload: ChainhookPayload = await request.json();

    console.log('Received DAO chainhook event:', {
      uuid: payload.chainhook.uuid,
      blocks: payload.apply.length,
      rollbacks: payload.rollback.length,
    });

    // Process apply events (new blocks)
    for (const block of payload.apply) {
      console.log(`Processing block ${block.block_identifier.index}`);

      for (const transaction of block.transactions) {
        const contractCall = transaction.metadata.contract_call;

        if (contractCall) {
          console.log(`Contract call: ${contractCall.function_name}`);

          // Process different DAO events
          switch (contractCall.function_name) {
            case 'propose-dispute-resolution':
              await handleProposalCreated(transaction, block);
              break;
            case 'vote-on-proposal':
              await handleVoteCast(transaction, block);
              break;
            case 'finalize-proposal-manual':
              await handleProposalFinalized(transaction, block);
              break;
            case 'add-member':
              await handleMemberAdded(transaction, block);
              break;
            case 'remove-member':
              await handleMemberRemoved(transaction, block);
              break;
            default:
              console.log(`Unknown function: ${contractCall.function_name}`);
          }
        }
      }
    }

    // Process rollback events (chain reorgs)
    for (const rollbackBlock of payload.rollback) {
      console.log(`Rolling back block ${rollbackBlock.block_identifier.index}`);
      await handleRollback(rollbackBlock);
    }

    return NextResponse.json({
      status: 'success',
      processed: {
        applied_blocks: payload.apply.length,
        rolled_back_blocks: payload.rollback.length,
      }
    });

  } catch (error) {
    console.error('Error processing DAO chainhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Event handlers
async function handleProposalCreated(transaction: any, block: any) {
  console.log('New proposal created:', {
    txHash: transaction.transaction_identifier.hash,
    blockHeight: block.block_identifier.index,
  });

  // Extract proposal data
  const contractCall = transaction.metadata.contract_call;
  const events = transaction.metadata.receipt.events;

  // Look for print events that contain proposal-id
  const printEvent = events.find((e: any) => e.type === 'print_event');

  if (printEvent) {
    console.log('Proposal data:', printEvent.data);
  }

  // TODO: Store proposal in database
  // TODO: Notify DAO members
  // TODO: Broadcast to WebSocket clients
  // const proposalData = parseProposalArgs(contractCall.function_args);
  // await storeProposal(proposalData);
  // await notifyDAOMembers(proposalData);
  // await broadcastUpdate('proposal-created', proposalData);
}

async function handleVoteCast(transaction: any, block: any) {
  console.log('Vote cast:', {
    txHash: transaction.transaction_identifier.hash,
    blockHeight: block.block_identifier.index,
  });

  // Extract vote data
  const contractCall = transaction.metadata.contract_call;
  const events = transaction.metadata.receipt.events;

  // Check if proposal was auto-finalized in this transaction
  const proposalFinalized = events.some((e: any) =>
    e.type === 'print_event' && e.data?.includes('finalized')
  );

  if (proposalFinalized) {
    console.log('Proposal auto-finalized after vote!');
  }

  // TODO: Update vote counts in database
  // TODO: Check if threshold reached
  // TODO: Broadcast real-time update to WebSocket clients
  // const voteData = parseVoteArgs(contractCall.function_args);
  // await recordVote(voteData);
  // await updateVoteCounts(voteData.proposalId);
  // await broadcastUpdate('vote-cast', voteData);

  // if (proposalFinalized) {
  //   await handleProposalFinalized(transaction, block);
  // }
}

async function handleProposalFinalized(transaction: any, block: any) {
  console.log('Proposal finalized:', {
    txHash: transaction.transaction_identifier.hash,
    blockHeight: block.block_identifier.index,
  });

  // Extract finalization result
  const contractCall = transaction.metadata.contract_call;
  const events = transaction.metadata.receipt.events;

  // TODO: Update proposal status in database
  // TODO: Execute proposal action if passed
  // TODO: Notify all relevant parties
  // TODO: Broadcast to WebSocket clients
  // const proposalId = parseProposalId(transaction);
  // await finalizeProposal(proposalId);
  // await notifyAllParties(proposalId);
  // await broadcastUpdate('proposal-finalized', { proposalId });
}

async function handleMemberAdded(transaction: any, block: any) {
  console.log('DAO member added:', {
    txHash: transaction.transaction_identifier.hash,
    blockHeight: block.block_identifier.index,
  });

  // TODO: Update DAO membership in database
  // TODO: Notify new member
  // const memberData = parseMemberArgs(transaction);
  // await addDAOMember(memberData);
  // await notifyNewMember(memberData);
}

async function handleMemberRemoved(transaction: any, block: any) {
  console.log('DAO member removed:', {
    txHash: transaction.transaction_identifier.hash,
    blockHeight: block.block_identifier.index,
  });

  // TODO: Update DAO membership in database
  // TODO: Notify removed member
  // const memberData = parseMemberArgs(transaction);
  // await removeDAOMember(memberData);
  // await notifyRemovedMember(memberData);
}

async function handleRollback(rollbackBlock: any) {
  console.log('Handling rollback for block:', rollbackBlock.block_identifier.index);

  // TODO: Reverse database changes for this block
  // This is critical for maintaining data consistency during chain reorgs
  // await rollbackBlockChanges(rollbackBlock.block_identifier.index);
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
