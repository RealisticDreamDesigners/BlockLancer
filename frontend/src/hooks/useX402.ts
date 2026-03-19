'use client';

import { useState, useCallback } from 'react';
import { useStacks } from './useStacks';
import {
  x402Fetch,
  formatX402Amount,
  type PaymentRequired,
  type PaymentReceipt,
  decodePaymentReceipt,
} from '@/lib/x402';

export interface X402State {
  loading: boolean;
  paymentPending: boolean;
  paymentRequired: PaymentRequired | null;
  receipt: PaymentReceipt | null;
  error: string | null;
}

/**
 * Hook for making x402-gated API requests.
 *
 * Returns a `fetchWithPayment` function that handles the 402 flow.
 * When a 402 is received, it sets `paymentPending` to true and
 * stores the payment requirements. The consumer should then call
 * `confirmPayment` with the signed transaction hex, or `cancelPayment`.
 */
export function useX402() {
  const { isSignedIn, userAddress } = useStacks();
  const [state, setState] = useState<X402State>({
    loading: false,
    paymentPending: false,
    paymentRequired: null,
    receipt: null,
    error: null,
  });

  // Resolve function for the pending payment promise
  const [paymentResolver, setPaymentResolver] = useState<{
    resolve: (txHex: string | null) => void;
  } | null>(null);

  /**
   * Make an x402-aware API request.
   * Returns the JSON response data.
   */
  const fetchWithPayment = useCallback(async <T = any>(
    url: string,
    options?: RequestInit,
  ): Promise<T> => {
    if (!isSignedIn) {
      throw new Error('Wallet not connected');
    }

    setState(prev => ({ ...prev, loading: true, error: null, receipt: null }));

    try {
      const response = await x402Fetch(
        url,
        options || {},
        async (paymentRequired) => {
          // Set payment pending state — UI should show confirmation
          setState(prev => ({
            ...prev,
            paymentPending: true,
            paymentRequired,
          }));

          // Wait for user to confirm or cancel
          return new Promise<string | null>((resolve) => {
            setPaymentResolver({ resolve });
          });
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Request failed: ${response.status}`);
      }

      // Check for payment receipt
      const receipt = decodePaymentReceipt(response);

      const data = await response.json();

      setState(prev => ({
        ...prev,
        loading: false,
        paymentPending: false,
        paymentRequired: null,
        receipt,
      }));

      return data as T;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({
        ...prev,
        loading: false,
        paymentPending: false,
        paymentRequired: null,
        error: message,
      }));
      throw error;
    }
  }, [isSignedIn]);

  /**
   * Confirm a pending x402 payment with a signed transaction hex.
   */
  const confirmPayment = useCallback((signedTxHex: string) => {
    if (paymentResolver) {
      paymentResolver.resolve(signedTxHex);
      setPaymentResolver(null);
    }
  }, [paymentResolver]);

  /**
   * Cancel a pending x402 payment.
   */
  const cancelPayment = useCallback(() => {
    if (paymentResolver) {
      paymentResolver.resolve(null);
      setPaymentResolver(null);
    }
    setState(prev => ({
      ...prev,
      paymentPending: false,
      paymentRequired: null,
    }));
  }, [paymentResolver]);

  /**
   * Reset error state.
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    fetchWithPayment,
    confirmPayment,
    cancelPayment,
    clearError,
    formatAmount: formatX402Amount,
  };
}
