'use client';

import React from 'react';
import { CreditCard, X, Shield, AlertCircle, Loader2 } from 'lucide-react';
import { formatX402Amount, type PaymentRequired } from '@/lib/x402';

interface X402PaymentModalProps {
  paymentRequired: PaymentRequired;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

/**
 * Modal shown when an API endpoint requires x402 payment.
 * Displays the payment requirements and asks the user to confirm.
 */
export function X402PaymentModal({
  paymentRequired,
  onConfirm,
  onCancel,
  loading,
}: X402PaymentModalProps) {
  const requirement = paymentRequired.accepts[0];
  if (!requirement) return null;

  const formattedAmount = formatX402Amount(requirement.amount, requirement.asset);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Payment Required
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                x402 Protocol
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={loading}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Resource description */}
          {paymentRequired.resource.description && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {paymentRequired.resource.description}
            </div>
          )}

          {/* Payment amount */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Amount</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formattedAmount}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Payable to {requirement.payTo.slice(0, 8)}...{requirement.payTo.slice(-6)}
            </div>
          </div>

          {/* Security note */}
          <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Shield className="h-4 w-4 flex-shrink-0 mt-0.5 text-blue-500" />
            <span>
              Payment is processed via the x402 protocol. Your transaction will be signed
              by your wallet and settled through a secure facilitator.
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="p-5 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4" />
                Pay {formattedAmount}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
