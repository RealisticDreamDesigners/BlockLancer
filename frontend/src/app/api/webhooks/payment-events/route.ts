// api/webhooks/payment-events/route.ts
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
        stx_transfer_event?: {
          sender: string;
          recipient: string;
          amount: string;
          memo?: string;
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
      console.warn('Unauthorized payment chainhook request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload: ChainhookPayload = await request.json();
    
    console.log('Received payment chainhook event:', {
      uuid: payload.chainhook.uuid,
      blocks: payload.apply.length,
      rollbacks: payload.rollback.length,
    });

    // Process apply events (new blocks)
    for (const block of payload.apply) {
      console.log(`Processing payment block ${block.block_identifier.index}`);
      
      for (const transaction of block.transactions) {
        // Look for STX transfer events
        const stxTransfer = transaction.metadata.stx_transfer_event;
        
        if (stxTransfer) {
          console.log(`STX Transfer detected:`, {
            from: stxTransfer.sender,
            to: stxTransfer.recipient,
            amount: stxTransfer.amount,
            memo: stxTransfer.memo,
          });
          
          await handleSTXTransfer(stxTransfer, transaction, block);
        }

        // Also check events in the receipt for contract-generated transfers
        const events = transaction.metadata.receipt.events;
        for (const event of events) {
          if (event.type === 'stx_transfer_event') {
            await handleContractSTXTransfer(event, transaction, block);
          }
        }
      }
    }

    // Process rollback events (chain reorgs)
    for (const rollbackBlock of payload.rollback) {
      console.log(`Rolling back payment block ${rollbackBlock.block_identifier.index}`);
      await handlePaymentRollback(rollbackBlock);
    }

    return NextResponse.json({ 
      status: 'success', 
      processed: {
        applied_blocks: payload.apply.length,
        rolled_back_blocks: payload.rollback.length,
      }
    });

  } catch (error) {
    console.error('Error processing payment chainhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// Payment event handlers
async function handleSTXTransfer(stxTransfer: any, transaction: any, block: any) {
  console.log('Processing STX transfer:', {
    txHash: transaction.transaction_identifier.hash,
    blockHeight: block.block_identifier.index,
    from: stxTransfer.sender,
    to: stxTransfer.recipient,
    amount: stxTransfer.amount,
  });
  
  try {
    // Check if this transfer is related to BlockLancer escrow
    if (await isBlockLancerRelatedTransfer(stxTransfer)) {
      console.log('BlockLancer-related payment detected');
      
      // TODO: Store payment in database
      // await storePaymentInDatabase({
      //   txHash: transaction.transaction_identifier.hash,
      //   blockHeight: block.block_identifier.index,
      //   from: stxTransfer.sender,
      //   to: stxTransfer.recipient,
      //   amount: parseInt(stxTransfer.amount),
      //   memo: stxTransfer.memo,
      //   timestamp: new Date(),
      //   type: 'escrow_payment'
      // });
      
      // TODO: Update related escrow/milestone status
      // await updateEscrowPaymentStatus(stxTransfer, transaction);
    }
    
  } catch (error) {
    console.error('Error handling STX transfer:', error);
  }
}

async function handleContractSTXTransfer(event: any, transaction: any, block: any) {
  console.log('Contract-generated STX transfer:', {
    txHash: transaction.transaction_identifier.hash,
    blockHeight: block.block_identifier.index,
    event: event,
  });
  
  try {
    // TODO: Process contract-generated transfers
    // These are typically milestone payments from the escrow contract
    
    // TODO: Extract transfer details from event
    // const transferData = event.data;
    
    // TODO: Store in database and update related records
    // await handleEscrowPayment(transferData, transaction, block);
    
  } catch (error) {
    console.error('Error handling contract STX transfer:', error);
  }
}

async function handlePaymentRollback(rollbackBlock: any) {
  console.log('Handling payment rollback for block:', rollbackBlock.block_identifier.index);
  
  // TODO: Reverse payment-related database changes for this block
  // This is crucial for maintaining accurate payment records during chain reorgs
  // 
  // await rollbackPaymentChanges({
  //   blockHeight: rollbackBlock.block_identifier.index,
  //   blockHash: rollbackBlock.block_identifier.hash
  // });
}

// Helper function to determine if a transfer is BlockLancer-related
async function isBlockLancerRelatedTransfer(stxTransfer: any): Promise<boolean> {
  // TODO: Implement logic to identify BlockLancer-related transfers
  // This could check:
  // 1. If sender/recipient is a known BlockLancer escrow contract
  // 2. If memo contains BlockLancer-specific identifiers
  // 3. If addresses are in our database as BlockLancer users
  
  const blockLancerContractAddress = 'ST3A5HQKQM3T3BV1MCZ45S6Q729V8355BQ0W0NP2V';
  
  // Check if transfer involves the BlockLancer contract
  if (stxTransfer.sender?.includes(blockLancerContractAddress) || 
      stxTransfer.recipient?.includes(blockLancerContractAddress)) {
    return true;
  }
  
  // Check memo for BlockLancer identifiers
  if (stxTransfer.memo?.includes('blocklancer') || 
      stxTransfer.memo?.includes('escrow') || 
      stxTransfer.memo?.includes('milestone')) {
    return true;
  }
  
  return false;
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