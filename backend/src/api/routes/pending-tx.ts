import { FastifyInstance } from 'fastify';
import { createPendingTx, getPendingTxByTxId } from '../../db/queries/pending-transactions.js';

export async function pendingTxRoutes(app: FastifyInstance) {
  // POST /api/pending-tx
  app.post<{
    Body: {
      txId: string;
      functionName: string;
      contractName: string;
      args: Record<string, any>;
      senderAddress: string;
    };
  }>('/api/pending-tx', async (request, reply) => {
    const { txId, functionName, contractName, args, senderAddress } = request.body;

    if (!txId || !functionName || !senderAddress) {
      return reply.code(400).send({ error: 'Missing required fields: txId, functionName, senderAddress' });
    }

    const pending = await createPendingTx({
      tx_id: txId,
      function_name: functionName,
      contract_name: contractName || '',
      args: args || {},
      sender_address: senderAddress,
    });

    return {
      txId: pending.tx_id,
      status: pending.status,
      createdAt: pending.created_at,
      expiresAt: pending.expires_at,
    };
  });

  // GET /api/pending-tx/:txId
  app.get<{ Params: { txId: string } }>('/api/pending-tx/:txId', async (request, reply) => {
    const { txId } = request.params;
    if (!txId) return reply.code(400).send({ error: 'txId required' });

    const pending = await getPendingTxByTxId(txId);
    if (!pending) return reply.code(404).send({ error: 'Pending transaction not found' });

    return {
      txId: pending.tx_id,
      functionName: pending.function_name,
      contractName: pending.contract_name,
      args: pending.args,
      senderAddress: pending.sender_address,
      status: pending.status,
      createdAt: pending.created_at,
      expiresAt: pending.expires_at,
    };
  });
}
