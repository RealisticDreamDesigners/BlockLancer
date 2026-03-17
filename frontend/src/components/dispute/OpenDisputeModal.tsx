'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useOpenDispute } from '@/hooks/useDisputeActions';
import { validateDisputeReason, truncateAddress } from '@/lib/disputeUtils';
import { cn } from '@/lib/utils';
import {
  X,
  AlertTriangle,
  Info,
  Loader2,
  CheckCircle,
} from 'lucide-react';

// ===============================================
// TYPES
// ===============================================

export interface OpenDisputeModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;

  /**
   * Callback to close the modal
   */
  onClose: () => void;

  /**
   * Contract ID to create dispute for
   */
  contractId: number;

  /**
   * Employer address
   */
  clientAddress: string;

  /**
   * Worker address
   */
  freelancerAddress: string;

  /**
   * Current user address
   */
  currentUserAddress?: string;

  /**
   * Callback after successful dispute creation
   */
  onSuccess?: (disputeId?: number) => void;

  /**
   * Additional CSS classes for modal content
   */
  className?: string;
}

// ===============================================
// CONSTANTS
// ===============================================

const MIN_REASON_LENGTH = 10;
const MAX_REASON_LENGTH = 500;

// ===============================================
// COMPONENT
// ===============================================

/**
 * OpenDisputeModal Component
 *
 * A modal dialog for creating a new dispute.
 * Includes form validation, character counting, and submission handling.
 *
 * @example
 * ```tsx
 * const [showModal, setShowModal] = useState(false);
 *
 * <OpenDisputeModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   contractId={1}
 *   clientAddress="ST1..."
 *   freelancerAddress="ST2..."
 *   currentUserAddress={userAddress}
 *   onSuccess={() => router.push('/disputes')}
 * />
 * ```
 */
export function OpenDisputeModal({
  isOpen,
  onClose,
  contractId,
  clientAddress,
  freelancerAddress,
  currentUserAddress,
  onSuccess,
  className,
}: OpenDisputeModalProps) {
  // State
  const [reason, setReason] = useState('-');
  const [showValidation, setShowValidation] = useState(false);

  // Refs
  const modalRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Hooks
  const { mutate: openDispute, isPending, isSuccess } = useOpenDispute();

  // Determine user role
  const isClient = currentUserAddress === clientAddress;
  const isFreelancer = currentUserAddress === freelancerAddress;
  const userRole = isClient ? 'Employer' : isFreelancer ? 'Worker' : 'Unknown';

  // Validation
  const validation = validateDisputeReason(reason);
  const charCount = reason.length;
  const isValid = validation.isValid;
  const showError = showValidation && !isValid;

  // Character count color
  const charCountColor =
    charCount < MIN_REASON_LENGTH
      ? 'text-gray-500'
      : charCount > MAX_REASON_LENGTH * 0.9
      ? 'text-red-600 font-semibold'
      : charCount > MAX_REASON_LENGTH * 0.7
      ? 'text-blue-600'
      : 'text-green-600';

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowValidation(true);

    if (!isValid) return;

    openDispute(
      {
        contractId,
        clientAddress,
        freelancerAddress,
        reason,
      },
      {
        onSuccess: (response) => {
          onSuccess?.(response.disputeId);
          // Reset form and close modal
          setTimeout(() => {
            setReason('-');
            setShowValidation(false);
            onClose();
          }, 1500); // Give time to show success state
        },
      }
    );
  };

  // Handle cancel
  const handleCancel = () => {
    if (!isPending) {
      setReason('-');
      setShowValidation(false);
      onClose();
    }
  };

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPending) {
        handleCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      // Focus textarea when modal opens
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, isPending]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isPending) {
      handleCancel();
    }
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '-';
    }

    return () => {
      document.body.style.overflow = '-';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className={cn(
          'bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto',
          'animate-in zoom-in-95 slide-in-from-bottom-4 duration-200',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h2 id="modal-title" className="text-xl font-bold text-gray-900 dark:text-white">
                Open Dispute
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Contract #{contractId}
              </p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            disabled={isPending}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Info Banner */}
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/40 rounded-lg p-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-200">
                <p className="font-medium mb-1">Before opening a dispute:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-300">
                  <li>Try to resolve the issue directly with the other party</li>
                  <li>Gather any evidence to support your case</li>
                  <li>Clearly explain the reason for the dispute</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Contract Parties */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Parties Involved
            </label>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-950 rounded-lg">
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Employer</span>
                  <code className="block text-xs font-mono text-gray-600 dark:text-gray-400 mt-1">
                    {truncateAddress(clientAddress)}
                  </code>
                </div>
                {isClient && (
                  <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-1 rounded-full font-medium">
                    You
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-950 rounded-lg">
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Worker</span>
                  <code className="block text-xs font-mono text-gray-600 dark:text-gray-400 mt-1">
                    {truncateAddress(freelancerAddress)}
                  </code>
                </div>
                {isFreelancer && (
                  <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-1 rounded-full font-medium">
                    You
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Reason Input */}
          <div className="space-y-2">
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Dispute Reason <span className="text-red-600">*</span>
            </label>
            <textarea
              ref={textareaRef}
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why you're opening this dispute. Be clear and specific..."
              rows={6}
              disabled={isPending || isSuccess}
              className={cn(
                'w-full px-4 py-3 border rounded-lg resize-none',
                'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                'transition-all duration-200',
                'disabled:bg-gray-100 disabled:cursor-not-allowed',
                'dark:bg-gray-900 dark:border-gray-600 dark:text-white',
                showError && 'border-red-500 focus:ring-red-500'
              )}
              aria-invalid={showError}
              aria-describedby={showError ? 'reason-error' : 'reason-hint'}
            />

            {/* Character Count */}
            <div className="flex items-center justify-between text-xs">
              <span className={charCountColor}>
                {charCount} / {MAX_REASON_LENGTH} characters
                {charCount < MIN_REASON_LENGTH &&
                  ` (${MIN_REASON_LENGTH - charCount} more required)`}
              </span>
            </div>

            {/* Validation Error */}
            {showError && (
              <p id="reason-error" className="text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                {validation.error}
              </p>
            )}

            {/* Hint */}
            {!showError && (
              <p id="reason-hint" className="text-xs text-gray-500 dark:text-gray-400">
                Provide a detailed explanation ({MIN_REASON_LENGTH}-{MAX_REASON_LENGTH} characters)
              </p>
            )}
          </div>

          {/* Warning */}
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/40 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-200">
                <p className="font-medium mb-1">Important:</p>
                <p className="text-blue-800 dark:text-blue-300">
                  Opening a dispute will pause this contract until the DAO resolves it.
                  The decision will be binding and enforced on-chain.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700/50">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isPending || isSuccess}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || isSuccess || (showValidation && !isValid)}
              className={cn(
                'flex-1 px-4 py-2 rounded-lg font-medium transition-all',
                'flex items-center justify-center gap-2',
                'focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
                isSuccess
                  ? 'bg-green-600 text-white'
                  : 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Opening Dispute...
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Dispute Opened!
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4" />
                  Open Dispute
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===============================================
// EXPORT
// ===============================================

export default OpenDisputeModal;
