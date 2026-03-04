// api/webhooks/escrow-events/route.ts
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

export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CHAINHOOK_SECRET_TOKEN || 'local_dev_secret';
    
    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      console.warn('🚫 Unauthorized chainhook request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload: ChainhookPayload = await request.json();
    
    console.log('📥 Received escrow chainhook event:', {
      uuid: payload.chainhook.uuid,
      blocks: payload.apply.length,
      rollbacks: payload.rollback.length,
    });

    // Process apply events (new blocks)
    for (const block of payload.apply) {
      console.log(`📦 Processing block ${block.block_identifier.index}`);
      
      for (const transaction of block.transactions) {
        const contractCall = transaction.metadata.contract_call;
        
        if (contractCall) {
          console.log(`🔧 Contract call: ${contractCall.function_name}`);
          
          // Process different escrow events
          switch (contractCall.function_name) {
            case 'create-escrow':
              await handleCreateEscrow(transaction, block);
              break;
            case 'add-milestone':
              await handleAddMilestone(transaction, block);
              break;
            case 'submit-milestone':
              await handleSubmitMilestone(transaction, block);
              break;
            case 'approve-milestone':
              await handleApproveMilestone(transaction, block);
              break;
            case 'reject-milestone':
              await handleRejectMilestone(transaction, block);
              break;
            default:
              console.log(`⚠️ Unknown function: ${contractCall.function_name}`);
          }
        }
      }
    }

    // Process rollback events (chain reorgs)
    for (const rollbackBlock of payload.rollback) {
      console.log(`↩️ Rolling back block ${rollbackBlock.block_identifier.index}`);
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
    console.error('❌ Error processing escrow chainhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// Event handlers
async function handleCreateEscrow(transaction: any, block: any) {
  console.log('🆕 New escrow created:', {
    txHash: transaction.transaction_identifier.hash,
    blockHeight: block.block_identifier.index,
  });
  
  // TODO: Extract contract arguments and store in database
  // const contractArgs = transaction.metadata.contract_call.function_args;
  // await storeEscrowInDatabase(contractArgs, transaction, block);
}

async function handleAddMilestone(transaction: any, block: any) {
  console.log('📋 Milestone added:', {
    txHash: transaction.transaction_identifier.hash,
    blockHeight: block.block_identifier.index,
  });
  
  // TODO: Extract milestone data and update database
}

async function handleSubmitMilestone(transaction: any, block: any) {
  console.log('📤 Milestone submitted:', {
    txHash: transaction.transaction_identifier.hash,
    blockHeight: block.block_identifier.index,
  });
  
  // TODO: Update milestone status in database
}

async function handleApproveMilestone(transaction: any, block: any) {
  console.log('✅ Milestone approved:', {
    txHash: transaction.transaction_identifier.hash,
    blockHeight: block.block_identifier.index,
  });
  
  // TODO: Update milestone status and trigger payment
}

async function handleRejectMilestone(transaction: any, block: any) {
  console.log('❌ Milestone rejected:', {
    txHash: transaction.transaction_identifier.hash,
    blockHeight: block.block_identifier.index,
  });
  
  // TODO: Update milestone status in database
}

async function handleRollback(rollbackBlock: any) {
  console.log('🔄 Handling rollback for block:', rollbackBlock.block_identifier.index);
  
  // TODO: Reverse database changes for this block
  // This is critical for maintaining data consistency during chain reorgs
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