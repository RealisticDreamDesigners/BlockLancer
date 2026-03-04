// api/webhooks/organization-events/route.ts
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
      console.warn('🚫 Unauthorized organization chainhook request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload: ChainhookPayload = await request.json();
    
    console.log('📥 Received organization chainhook event:', {
      uuid: payload.chainhook.uuid,
      blocks: payload.apply.length,
      rollbacks: payload.rollback.length,
    });

    // Process apply events (new blocks)
    for (const block of payload.apply) {
      console.log(`📦 Processing organization block ${block.block_identifier.index}`);
      
      for (const transaction of block.transactions) {
        const contractCall = transaction.metadata.contract_call;
        
        if (contractCall) {
          console.log(`🏢 Organization call: ${contractCall.function_name}`);
          
          // Process different organization events
          switch (contractCall.function_name) {
            case 'create-organization':
              await handleCreateOrganization(transaction, block);
              break;
            case 'add-organization-member':
              await handleAddOrganizationMember(transaction, block);
              break;
            case 'update-organization-member-role':
              await handleUpdateMemberRole(transaction, block);
              break;
            default:
              console.log(`⚠️ Unknown organization function: ${contractCall.function_name}`);
          }
        }
      }
    }

    // Process rollback events (chain reorgs)
    for (const rollbackBlock of payload.rollback) {
      console.log(`↩️ Rolling back organization block ${rollbackBlock.block_identifier.index}`);
      await handleOrganizationRollback(rollbackBlock);
    }

    return NextResponse.json({ 
      status: 'success', 
      processed: {
        applied_blocks: payload.apply.length,
        rolled_back_blocks: payload.rollback.length,
      }
    });

  } catch (error) {
    console.error('❌ Error processing organization chainhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// Organization event handlers
async function handleCreateOrganization(transaction: any, block: any) {
  console.log('🏢 New organization created:', {
    txHash: transaction.transaction_identifier.hash,
    blockHeight: block.block_identifier.index,
  });
  
  try {
    const contractArgs = transaction.metadata.contract_call.function_args;
    console.log('📋 Organization args:', contractArgs);
    
    // TODO: Extract organization data from contract args
    // const orgName = contractArgs[0]; // name
    // const orgDescription = contractArgs[1]; // description
    // const creator = transaction.metadata.sender;
    
    // TODO: Store in database
    // await storeOrganizationInDatabase({
    //   name: orgName,
    //   description: orgDescription,
    //   owner: creator,
    //   txHash: transaction.transaction_identifier.hash,
    //   blockHeight: block.block_identifier.index,
    //   createdAt: new Date()
    // });
    
  } catch (error) {
    console.error('Error handling create organization:', error);
  }
}

async function handleAddOrganizationMember(transaction: any, block: any) {
  console.log('👥 Organization member added:', {
    txHash: transaction.transaction_identifier.hash,
    blockHeight: block.block_identifier.index,
  });
  
  try {
    const contractArgs = transaction.metadata.contract_call.function_args;
    console.log('📋 Member args:', contractArgs);
    
    // TODO: Extract member data from contract args
    // const orgId = contractArgs[0]; // organization-id
    // const memberAddress = contractArgs[1]; // member-address
    // const role = contractArgs[2]; // role
    
    // TODO: Store in database
    // await addOrganizationMemberToDatabase({
    //   organizationId: orgId,
    //   memberAddress: memberAddress,
    //   role: role,
    //   addedBy: transaction.metadata.sender,
    //   txHash: transaction.transaction_identifier.hash,
    //   blockHeight: block.block_identifier.index,
    //   addedAt: new Date()
    // });
    
  } catch (error) {
    console.error('Error handling add organization member:', error);
  }
}

async function handleUpdateMemberRole(transaction: any, block: any) {
  console.log('🔄 Organization member role updated:', {
    txHash: transaction.transaction_identifier.hash,
    blockHeight: block.block_identifier.index,
  });
  
  try {
    const contractArgs = transaction.metadata.contract_call.function_args;
    console.log('📋 Role update args:', contractArgs);
    
    // TODO: Extract role update data from contract args
    // const orgId = contractArgs[0]; // organization-id
    // const memberAddress = contractArgs[1]; // member-address
    // const newRole = contractArgs[2]; // new-role
    
    // TODO: Update in database
    // await updateOrganizationMemberRoleInDatabase({
    //   organizationId: orgId,
    //   memberAddress: memberAddress,
    //   newRole: newRole,
    //   updatedBy: transaction.metadata.sender,
    //   txHash: transaction.transaction_identifier.hash,
    //   blockHeight: block.block_identifier.index,
    //   updatedAt: new Date()
    // });
    
  } catch (error) {
    console.error('Error handling update member role:', error);
  }
}

async function handleOrganizationRollback(rollbackBlock: any) {
  console.log('🔄 Handling organization rollback for block:', rollbackBlock.block_identifier.index);
  
  // TODO: Reverse organization-related database changes for this block
  // This ensures data consistency during chain reorgs
  // 
  // await rollbackOrganizationChanges({
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