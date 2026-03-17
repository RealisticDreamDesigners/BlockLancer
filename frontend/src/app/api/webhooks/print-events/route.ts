// api/webhooks/print-events/route.ts
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
        print_event?: {
          contract_identifier: string;
          topic: string;
          value: any;
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
      console.warn('Unauthorized print event chainhook request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload: ChainhookPayload = await request.json();
    
    console.log('Received print event chainhook:', {
      uuid: payload.chainhook.uuid,
      blocks: payload.apply.length,
      rollbacks: payload.rollback.length,
    });

    // Process apply events (new blocks)
    for (const block of payload.apply) {
      console.log(`Processing print events in block ${block.block_identifier.index}`);
      
      for (const transaction of block.transactions) {
        // Check for print events in metadata
        const printEvent = transaction.metadata.print_event;
        
        if (printEvent) {
          console.log(`Print event detected:`, {
            contract: printEvent.contract_identifier,
            topic: printEvent.topic,
            value: printEvent.value,
          });
          
          await handlePrintEvent(printEvent, transaction, block);
        }

        // Also check events in the receipt
        const events = transaction.metadata.receipt.events;
        for (const event of events) {
          if (event.type === 'print_event') {
            await handleReceiptPrintEvent(event, transaction, block);
          }
        }
      }
    }

    // Process rollback events (chain reorgs)
    for (const rollbackBlock of payload.rollback) {
      console.log(`Rolling back print events for block ${rollbackBlock.block_identifier.index}`);
      await handlePrintEventRollback(rollbackBlock);
    }

    return NextResponse.json({ 
      status: 'success', 
      processed: {
        applied_blocks: payload.apply.length,
        rolled_back_blocks: payload.rollback.length,
      }
    });

  } catch (error) {
    console.error('Error processing print event chainhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// Print event handlers
async function handlePrintEvent(printEvent: any, transaction: any, block: any) {
  console.log('Processing print event:', {
    txHash: transaction.transaction_identifier.hash,
    blockHeight: block.block_identifier.index,
    topic: printEvent.topic,
    contract: printEvent.contract_identifier,
  });
  
  try {
    // Parse the print event topic to determine event type
    const topic = printEvent.topic?.toLowerCase() || '-';
    
    if (topic.includes('blocklancer')) {
      console.log('BlockLancer print event detected:', printEvent.value);
      
      // Handle different BlockLancer print events
      if (topic.includes('escrow-created')) {
        await handleEscrowCreatedPrint(printEvent, transaction, block);
      } else if (topic.includes('milestone-submitted')) {
        await handleMilestoneSubmittedPrint(printEvent, transaction, block);
      } else if (topic.includes('milestone-approved')) {
        await handleMilestoneApprovedPrint(printEvent, transaction, block);
      } else if (topic.includes('payment-released')) {
        await handlePaymentReleasedPrint(printEvent, transaction, block);
      } else if (topic.includes('dispute-opened')) {
        await handleDisputeOpenedPrint(printEvent, transaction, block);
      } else {
        // Generic BlockLancer event
        await handleGenericBlockLancerPrint(printEvent, transaction, block);
      }
    }
    
  } catch (error) {
    console.error('Error handling print event:', error);
  }
}

async function handleReceiptPrintEvent(event: any, transaction: any, block: any) {
  console.log('Receipt print event:', {
    txHash: transaction.transaction_identifier.hash,
    blockHeight: block.block_identifier.index,
    event: event,
  });
  
  // TODO: Process print events from transaction receipt
  // These are events printed during contract execution
}

// Specific BlockLancer print event handlers
async function handleEscrowCreatedPrint(printEvent: any, transaction: any, block: any) {
  console.log('[NEW] Escrow created print event:', printEvent.value);
  
  try {
    // TODO: Extract escrow details from print event
    // const escrowData = printEvent.value;
    
    // TODO: Store detailed escrow information in database
    // This supplements the basic contract call data with printed details
    // await updateEscrowWithPrintData(escrowData, transaction, block);
    
  } catch (error) {
    console.error('Error handling escrow created print:', error);
  }
}

async function handleMilestoneSubmittedPrint(printEvent: any, transaction: any, block: any) {
  console.log('Milestone submitted print event:', printEvent.value);
  
  try {
    // TODO: Extract milestone submission details
    // const milestoneData = printEvent.value;
    
    // TODO: Update milestone status and notify relevant parties
    // await updateMilestoneSubmissionStatus(milestoneData, transaction, block);
    
  } catch (error) {
    console.error('Error handling milestone submitted print:', error);
  }
}

async function handleMilestoneApprovedPrint(printEvent: any, transaction: any, block: any) {
  console.log('Milestone approved print event:', printEvent.value);
  
  try {
    // TODO: Extract milestone approval details
    // const approvalData = printEvent.value;
    
    // TODO: Update milestone status and trigger payment
    // await processMilestoneApproval(approvalData, transaction, block);
    
  } catch (error) {
    console.error('Error handling milestone approved print:', error);
  }
}

async function handlePaymentReleasedPrint(printEvent: any, transaction: any, block: any) {
  console.log('Payment released print event:', printEvent.value);
  
  try {
    // TODO: Extract payment release details
    // const paymentData = printEvent.value;
    
    // TODO: Update payment status and notify parties
    // await recordPaymentRelease(paymentData, transaction, block);
    
  } catch (error) {
    console.error('Error handling payment released print:', error);
  }
}

async function handleDisputeOpenedPrint(printEvent: any, transaction: any, block: any) {
  console.log('Dispute opened print event:', printEvent.value);
  
  try {
    // TODO: Extract dispute details
    // const disputeData = printEvent.value;
    
    // TODO: Create dispute record and notify relevant parties
    // await createDisputeRecord(disputeData, transaction, block);
    
  } catch (error) {
    console.error('Error handling dispute opened print:', error);
  }
}

async function handleGenericBlockLancerPrint(printEvent: any, transaction: any, block: any) {
  console.log('Generic BlockLancer print event:', printEvent.value);
  
  try {
    // TODO: Store generic BlockLancer event for analytics/debugging
    // await storeGenericBlockLancerEvent({
    //   topic: printEvent.topic,
    //   value: printEvent.value,
    //   contract: printEvent.contract_identifier,
    //   txHash: transaction.transaction_identifier.hash,
    //   blockHeight: block.block_identifier.index,
    //   timestamp: new Date()
    // });
    
  } catch (error) {
    console.error('Error handling generic BlockLancer print:', error);
  }
}

async function handlePrintEventRollback(rollbackBlock: any) {
  console.log('Handling print event rollback for block:', rollbackBlock.block_identifier.index);
  
  // TODO: Remove print event data for rolled back blocks
  // This ensures consistency in event logs during chain reorgs
  // 
  // await rollbackPrintEventData({
  //   blockHeight: rollbackBlock.block_identifier.index,
  //   blockHash: rollbackBlock.block_identifier.hash
  // });
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