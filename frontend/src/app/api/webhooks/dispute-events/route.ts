// api/webhooks/dispute-events/route.ts
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
 * Webhook handler for dispute contract events
 * Receives chainhook events from the blocklancer-dispute-v3 contract
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

    console.log('Received dispute chainhook event:', {
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

          // Process different dispute events
          switch (contractCall.function_name) {
            case 'open-dispute':
              await handleOpenDispute(transaction, block);
              break;
            case 'submit-evidence':
              await handleSubmitEvidence(transaction, block);
              break;
            case 'withdraw-dispute':
              await handleWithdrawDispute(transaction, block);
              break;
            case 'dao-resolve-dispute':
              await handleResolveDispute(transaction, block);
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
    console.error('Error processing dispute chainhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Event handlers
async function handleOpenDispute(transaction: any, block: any) {
  console.log('New dispute opened:', {
    txHash: transaction.transaction_identifier.hash,
    blockHeight: block.block_identifier.index,
  });

  // Extract dispute data from transaction
  const contractCall = transaction.metadata.contract_call;
  const events = transaction.metadata.receipt.events;

  // Look for print events that contain dispute-id
  const printEvent = events.find((e: any) => e.type === 'print_event');

  if (printEvent) {
    console.log('Dispute data:', printEvent.data);
  }

  // TODO: Store dispute in database/cache
  // TODO: Trigger notifications to parties
  // TODO: Broadcast to WebSocket clients
  // const disputeData = parseDisputeArgs(contractCall.function_args);
  // await storeDispute(disputeData);
  // await notifyParties(disputeData);
  // await broadcastUpdate('dispute-opened', disputeData);
}

async function handleSubmitEvidence(transaction: any, block: any) {
  console.log('Evidence submitted:', {
    txHash: transaction.transaction_identifier.hash,
    blockHeight: block.block_identifier.index,
  });

  // Extract evidence data
  const contractCall = transaction.metadata.contract_call;
  const events = transaction.metadata.receipt.events;

  // TODO: Update dispute in database
  // TODO: Notify other party
  // TODO: Broadcast to WebSocket clients
  // const evidenceData = parseEvidenceArgs(contractCall.function_args);
  // await updateDisputeEvidence(evidenceData);
  // await notifyOtherParty(evidenceData);
  // await broadcastUpdate('evidence-submitted', evidenceData);
}

async function handleWithdrawDispute(transaction: any, block: any) {
  console.log('Dispute withdrawn:', {
    txHash: transaction.transaction_identifier.hash,
    blockHeight: block.block_identifier.index,
  });

  // TODO: Update dispute status in database
  // TODO: Notify parties
  // TODO: Broadcast to WebSocket clients
  // const disputeId = parseDisputeId(transaction);
  // await updateDisputeStatus(disputeId, 'withdrawn');
  // await notifyParties(disputeId);
  // await broadcastUpdate('dispute-withdrawn', { disputeId });
}

async function handleResolveDispute(transaction: any, block: any) {
  console.log('Dispute resolved by DAO:', {
    txHash: transaction.transaction_identifier.hash,
    blockHeight: block.block_identifier.index,
  });

  // Extract resolution data
  const contractCall = transaction.metadata.contract_call;

  // TODO: Update dispute with resolution
  // TODO: Notify all parties
  // TODO: Broadcast to WebSocket clients
  // const resolutionData = parseResolutionArgs(contractCall.function_args);
  // await resolveDispute(resolutionData);
  // await notifyAllParties(resolutionData);
  // await broadcastUpdate('dispute-resolved', resolutionData);
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
