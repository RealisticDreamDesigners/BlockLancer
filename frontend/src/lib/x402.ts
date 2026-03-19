/**
 * x402 Payment Client for BlockLancer Frontend
 *
 * Handles the x402 HTTP 402 Payment Required protocol flow:
 * 1. Makes an API request
 * 2. If 402 returned, decodes payment requirements
 * 3. Prompts user to sign a transaction via wallet
 * 4. Retries the request with the payment-signature header
 */

export interface PaymentRequirements {
  scheme: string;
  network: string;
  amount: string;
  asset: string;
  payTo: string;
  maxTimeoutSeconds: number;
}

export interface PaymentRequired {
  x402Version: 2;
  error?: string;
  resource: {
    url: string;
    description?: string;
    mimeType?: string;
  };
  accepts: PaymentRequirements[];
}

export interface PaymentReceipt {
  success: boolean;
  payer?: string;
  transaction: string;
  network: string;
}

/**
 * Format an atomic amount to human-readable with token symbol
 */
export function formatX402Amount(atomicAmount: string, asset: string): string {
  const amount = BigInt(atomicAmount);
  if (asset === 'STX') {
    const stx = Number(amount) / 1_000_000;
    return `${stx} STX`;
  }
  if (asset.includes('sbtc')) {
    const btc = Number(amount) / 100_000_000;
    return `${btc} sBTC`;
  }
  if (asset.includes('usdcx')) {
    const usdcx = Number(amount) / 1_000_000;
    return `$${usdcx} USDCx`;
  }
  return `${atomicAmount} (unknown token)`;
}

/**
 * Decode the payment-required header from a 402 response
 */
export function decodePaymentRequired(response: Response): PaymentRequired | null {
  const header = response.headers.get('payment-required');
  if (!header) return null;

  try {
    return JSON.parse(atob(header));
  } catch {
    return null;
  }
}

/**
 * Decode the payment-response header from a successful response
 */
export function decodePaymentReceipt(response: Response): PaymentReceipt | null {
  const header = response.headers.get('payment-response');
  if (!header) return null;

  try {
    return JSON.parse(atob(header));
  } catch {
    return null;
  }
}

/**
 * Encode a payment payload as a base64 header value
 */
export function encodePaymentSignature(payload: {
  x402Version: 2;
  resource?: { url: string };
  accepted: PaymentRequirements;
  payload: { transaction: string };
}): string {
  return btoa(JSON.stringify(payload));
}

/**
 * Make an x402-aware fetch request.
 *
 * If the endpoint returns 402, calls onPaymentRequired with the requirements.
 * The caller should prompt the user to sign a transaction and return the signed tx hex.
 * This function then retries the request with the payment-signature header.
 */
export async function x402Fetch(
  url: string,
  options: RequestInit = {},
  onPaymentRequired: (requirements: PaymentRequired) => Promise<string | null>,
): Promise<Response> {
  // First attempt
  const response = await fetch(url, options);

  if (response.status !== 402) {
    return response;
  }

  // Decode 402 requirements
  const paymentRequired = decodePaymentRequired(response);
  if (!paymentRequired || paymentRequired.accepts.length === 0) {
    throw new Error('Invalid 402 response: missing payment requirements');
  }

  // Ask the caller to sign the payment
  const signedTxHex = await onPaymentRequired(paymentRequired);
  if (!signedTxHex) {
    throw new Error('Payment cancelled by user');
  }

  // Build payment payload
  const accepted = paymentRequired.accepts[0];
  const paymentPayload = {
    x402Version: 2 as const,
    resource: paymentRequired.resource,
    accepted,
    payload: {
      transaction: signedTxHex,
    },
  };

  // Retry with payment-signature header
  const retryHeaders = new Headers(options.headers);
  retryHeaders.set('payment-signature', encodePaymentSignature(paymentPayload));

  const retryResponse = await fetch(url, {
    ...options,
    headers: retryHeaders,
  });

  return retryResponse;
}
