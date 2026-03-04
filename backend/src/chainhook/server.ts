import { FastifyInstance } from 'fastify';
import { config } from '../config.js';
import { insertEvent } from '../db/queries/blockchain-events.js';
import { handleEscrowEvent } from './handlers/escrow-handler.js';
import { handleDisputeEvent } from './handlers/dispute-handler.js';
import { handleDAOEvent } from './handlers/dao-handler.js';
import { handleMembershipEvent } from './handlers/membership-handler.js';
import { handlePaymentsEvent } from './handlers/payments-handler.js';
import { handleReputationEvent } from './handlers/reputation-handler.js';
import { handleMarketplaceEvent } from './handlers/marketplace-handler.js';
import pino from 'pino';

const logger = pino({ name: 'chainhook' });

/**
 * Chainhook event payload structure.
 * Chainhook sends arrays of transactions that matched the predicate.
 */
interface ChainhookPayload {
  apply: Array<{
    block_identifier: {
      index: number;
      hash: string;
    };
    transactions: Array<{
      transaction_identifier: {
        hash: string;
      };
      metadata: {
        success: boolean;
        sender: string;
        kind: {
          type: string;
          data?: {
            contract_identifier?: string;
            method?: string;
            args?: string[];
          };
        };
        receipt?: {
          events?: any[];
        };
      };
    }>;
  }>;
  rollback?: any[];
  chainhook?: {
    uuid: string;
    predicate?: any;
  };
}

/**
 * Extract contract events from Chainhook payload and dispatch to handlers.
 */
async function processPayload(
  payload: ChainhookPayload,
  contractType: 'escrow' | 'dispute' | 'dao' | 'membership' | 'payments' | 'reputation' | 'marketplace'
) {
  if (!payload.apply || !Array.isArray(payload.apply)) {
    logger.warn('No apply blocks in payload');
    return;
  }

  for (const block of payload.apply) {
    const blockHeight = block.block_identifier?.index || 0;

    for (const tx of block.transactions || []) {
      const txId = tx.transaction_identifier?.hash || '';
      const metadata = tx.metadata;

      if (!metadata) continue;

      const kind = metadata.kind;
      if (kind?.type !== 'ContractCall' && kind?.type !== 'contract_call') continue;

      const contractId = kind.data?.contract_identifier || '';
      const functionName = kind.data?.method || '';
      const args = kind.data?.args || [];
      const success = metadata.success;
      const sender = metadata.sender || '';

      // Store raw event
      await insertEvent({
        tx_id: txId,
        block_height: blockHeight,
        contract_name: contractId,
        function_name: functionName,
        args: { raw: args },
        success,
        sender,
      });

      const event = {
        txId,
        functionName,
        args: parseArgs(args),
        success,
        sender,
      };

      // Dispatch to appropriate handler
      try {
        switch (contractType) {
          case 'escrow':
            await handleEscrowEvent(event);
            break;
          case 'dispute':
            await handleDisputeEvent(event);
            break;
          case 'dao':
            await handleDAOEvent(event);
            break;
          case 'membership':
            await handleMembershipEvent(event);
            break;
          case 'payments':
            await handlePaymentsEvent(event);
            break;
          case 'reputation':
            await handleReputationEvent(event);
            break;
          case 'marketplace':
            await handleMarketplaceEvent(event);
            break;
        }
      } catch (err) {
        logger.error({ err, txId, functionName, contractType }, 'Handler error');
      }
    }
  }
}

/**
 * Parse Clarity serialized args into a key-value object.
 * Args from Chainhook come as hex-encoded Clarity values.
 */
function parseArgs(args: string[]): Record<string, any> {
  const result: Record<string, any> = {};
  args.forEach((arg, i) => {
    result[String(i)] = arg;
  });
  return result;
}

/**
 * Validate the chainhook auth token.
 */
function validateAuth(authHeader: string | undefined): boolean {
  if (!config.chainhookAuthToken) return true;
  if (!authHeader) return false;
  const token = authHeader.replace('Bearer ', '');
  return token === config.chainhookAuthToken;
}

/**
 * Register chainhook webhook routes on the Fastify app.
 */
export async function chainhookRoutes(app: FastifyInstance) {
  // POST /webhooks/escrow
  app.post('/webhooks/escrow', async (request, reply) => {
    if (!validateAuth(request.headers.authorization)) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    const payload = request.body as ChainhookPayload;
    logger.info('Received escrow webhook');
    await processPayload(payload, 'escrow');
    return { status: 'ok' };
  });

  // POST /webhooks/dispute
  app.post('/webhooks/dispute', async (request, reply) => {
    if (!validateAuth(request.headers.authorization)) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    const payload = request.body as ChainhookPayload;
    logger.info('Received dispute webhook');
    await processPayload(payload, 'dispute');
    return { status: 'ok' };
  });

  // POST /webhooks/dao
  app.post('/webhooks/dao', async (request, reply) => {
    if (!validateAuth(request.headers.authorization)) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    const payload = request.body as ChainhookPayload;
    logger.info('Received DAO webhook');
    await processPayload(payload, 'dao');
    return { status: 'ok' };
  });

  // POST /webhooks/membership
  app.post('/webhooks/membership', async (request, reply) => {
    if (!validateAuth(request.headers.authorization)) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    const payload = request.body as ChainhookPayload;
    logger.info('Received membership webhook');
    await processPayload(payload, 'membership');
    return { status: 'ok' };
  });

  // POST /webhooks/payments
  app.post('/webhooks/payments', async (request, reply) => {
    if (!validateAuth(request.headers.authorization)) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    const payload = request.body as ChainhookPayload;
    logger.info('Received payments webhook');
    await processPayload(payload, 'payments');
    return { status: 'ok' };
  });

  // POST /webhooks/reputation
  app.post('/webhooks/reputation', async (request, reply) => {
    if (!validateAuth(request.headers.authorization)) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    const payload = request.body as ChainhookPayload;
    logger.info('Received reputation webhook');
    await processPayload(payload, 'reputation');
    return { status: 'ok' };
  });

  // POST /webhooks/marketplace
  app.post('/webhooks/marketplace', async (request, reply) => {
    if (!validateAuth(request.headers.authorization)) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    const payload = request.body as ChainhookPayload;
    logger.info('Received marketplace webhook');
    await processPayload(payload, 'marketplace');
    return { status: 'ok' };
  });
}
