'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { X402PaymentModal } from '@/components/payments/X402PaymentModal';
import { useX402 } from '@/hooks/useX402';
import { useStacks } from '@/hooks/useStacks';
import {
  CreditCard,
  BarChart3,
  FileText,
  Briefcase,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Zap,
} from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

interface PremiumEndpoint {
  name: string;
  description: string;
  path: string;
  fee: string;
  icon: React.ReactNode;
}

const ENDPOINTS: PremiumEndpoint[] = [
  {
    name: 'Premium Analytics',
    description: 'Platform-wide statistics, top users, and trends',
    path: '/api/x402/analytics/premium',
    fee: '0.001 STX',
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    name: 'Dispute Report',
    description: 'Detailed dispute report with full evidence and timeline',
    path: '/api/x402/reports/dispute/1',
    fee: '0.001 STX',
    icon: <FileText className="h-5 w-5" />,
  },
  {
    name: 'Featured Jobs',
    description: 'Featured job listings with priority placement',
    path: '/api/x402/marketplace/featured',
    fee: '0.0005 STX',
    icon: <Briefcase className="h-5 w-5" />,
  },
];

export default function X402Page() {
  const { isSignedIn } = useStacks();
  const {
    loading,
    paymentPending,
    paymentRequired,
    receipt,
    error,
    fetchWithPayment,
    confirmPayment,
    cancelPayment,
    clearError,
  } = useX402();

  const [result, setResult] = useState<any>(null);
  const [activeEndpoint, setActiveEndpoint] = useState<string | null>(null);

  const handleFetch = async (endpoint: PremiumEndpoint) => {
    setActiveEndpoint(endpoint.path);
    setResult(null);
    clearError();

    try {
      const data = await fetchWithPayment(
        `${BACKEND_URL}${endpoint.path}`,
      );
      setResult(data);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleConfirmPayment = () => {
    // In a production implementation, this would use the Stacks wallet
    // to sign an STX transfer transaction and return the hex.
    // For the hackathon demo, we show that the protocol flow works.
    confirmPayment('demo-signed-tx-hex');
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  x402 Premium API
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Pay-per-request API access using HTTP 402 protocol on Stacks
                </p>
              </div>
            </div>

            {/* Protocol info */}
            <div className="mt-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/40 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-300">
                  <p className="font-medium mb-1">How x402 Works</p>
                  <ol className="list-decimal ml-4 space-y-1 text-blue-700 dark:text-blue-400">
                    <li>Request a premium endpoint</li>
                    <li>Server returns HTTP 402 with payment requirements</li>
                    <li>Your wallet signs a payment transaction</li>
                    <li>A facilitator settles the payment on-chain</li>
                    <li>Server grants access and returns data</li>
                  </ol>
                  <p className="mt-2 text-xs">
                    Based on{' '}
                    <a
                      href="https://www.x402.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-blue-600"
                    >
                      Coinbase x402 protocol
                    </a>
                    {' '}implemented via{' '}
                    <a
                      href="https://www.npmjs.com/package/x402-stacks"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-blue-600"
                    >
                      x402-stacks
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Wallet check */}
          {!isSignedIn && (
            <div className="mb-6 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800/50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Connect your wallet to make x402 payments
                </p>
              </div>
            </div>
          )}

          {/* Endpoints */}
          <div className="grid gap-4 mb-8">
            {ENDPOINTS.map((endpoint) => (
              <div
                key={endpoint.path}
                className="bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400">
                      {endpoint.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {endpoint.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {endpoint.description}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs font-mono text-gray-400 dark:text-gray-500">
                          GET {endpoint.path}
                        </span>
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">
                          {endpoint.fee}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleFetch(endpoint)}
                    disabled={loading || !isSignedIn}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                      loading && activeEndpoint === endpoint.path
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {loading && activeEndpoint === endpoint.path ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4" />
                        Access
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-300">
                    Request Failed
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Receipt */}
          {receipt && (
            <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                <p className="text-sm font-medium text-green-800 dark:text-green-300">
                  Payment Settled
                </p>
              </div>
              <div className="text-xs text-green-700 dark:text-green-400 space-y-1 ml-8">
                <p>Payer: {receipt.payer}</p>
                <p className="flex items-center gap-1">
                  Transaction: {receipt.transaction}
                  <a
                    href={`https://explorer.hiro.so/txid/${receipt.transaction}?chain=testnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:text-green-500"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Response Data
              </h3>
              <pre className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 overflow-x-auto max-h-96 overflow-y-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {paymentPending && paymentRequired && (
        <X402PaymentModal
          paymentRequired={paymentRequired}
          onConfirm={handleConfirmPayment}
          onCancel={cancelPayment}
          loading={loading}
        />
      )}
    </AppLayout>
  );
}
