import { getPendingTxStatus } from '@/lib/apiClient';
import { getApiBaseUrl } from '@/lib/networkConfig';

export type TxStatus = 'pending' | 'success' | 'failed' | 'dropped';

export interface TxPollResult {
  txId: string;
  status: TxStatus;
  error?: string;
}

/**
 * Poll a transaction's status. Checks backend first, falls back to Hiro API.
 */
export async function pollTxStatus(txId: string): Promise<TxPollResult> {
  // Try backend first
  try {
    const backendResult = await getPendingTxStatus(txId);
    if (backendResult && backendResult.status) {
      const mapped = mapBackendStatus(backendResult.status);
      if (mapped !== 'pending') {
        return { txId, status: mapped };
      }
    }
  } catch {
    // Backend unavailable, fall through to Hiro
  }

  // Fallback: Hiro API
  try {
    const hiroUrl = `${getApiBaseUrl()}/extended/v1/tx/${txId}`;
    const res = await fetch(hiroUrl, { signal: AbortSignal.timeout(5000) });

    if (!res.ok) {
      // 404 = TX not yet indexed, treat as pending
      if (res.status === 404) return { txId, status: 'pending' };
      return { txId, status: 'pending' };
    }

    const data = await res.json();
    return { txId, status: mapHiroStatus(data.tx_status) };
  } catch {
    // Network error — treat as still pending
    return { txId, status: 'pending' };
  }
}

function mapBackendStatus(status: string): TxStatus {
  switch (status) {
    case 'confirmed':
    case 'success':
      return 'success';
    case 'failed':
    case 'abort_by_response':
    case 'abort_by_post_condition':
      return 'failed';
    case 'dropped':
      return 'dropped';
    default:
      return 'pending';
  }
}

function mapHiroStatus(status: string): TxStatus {
  switch (status) {
    case 'success':
      return 'success';
    case 'abort_by_response':
    case 'abort_by_post_condition':
      return 'failed';
    case 'dropped_replace_by_fee':
    case 'dropped_replace_across_fork':
    case 'dropped_too_expensive':
    case 'dropped_stale_garbage_collect':
      return 'dropped';
    default:
      return 'pending';
  }
}
