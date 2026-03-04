'use client';

import React, { useState } from 'react';
import { useWithdrawDispute } from '@/hooks/useDisputeActions';
import { Dispute, DisputeStatus } from '@/types/dispute';
import { cn } from '@/lib/utils';
import {
  XCircle,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

// ===============================================
// TYPES
// ===============================================

export interface WithdrawDisputeButtonProps {
  /**
   * The dispute to withdraw
   */
  dispute: Dispute;

  /**
   * Current user's address
   */
  currentUserAddress?: string;

  /**
   * Callback after successful withdrawal
   */
  onSuccess?: () => void;

  /**
   * Button variant
   * @default 'default'
   */
  variant?: 'default' | 'outline' | 'ghost';

  /**
   * Button size
   * @default 'default'
   */
  size?: 'sm' | 'default' | 'lg';

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Full width button
   */
  fullWidth?: boolean;

  /**
   * Whether to show confirmation modal before withdrawing
   * @default true
   */
  requireConfirmation?: boolean;
}

// ===============================================
// BUTTON VARIANTS
// ===============================================

const buttonVariants = {
  default: 'bg-gray-600 text-white hover:bg-gray-700 active:bg-gray-800',
  outline:
    'border-2 border-gray-600 text-gray-600 hover:bg-gray-50 active:bg-gray-100',
  ghost: 'text-gray-600 hover:bg-gray-50 active:bg-gray-100',
};

const sizeVariants = {
  sm: 'px-3 py-1.5 text-sm',
  default: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

// ===============================================
// CONFIRMATION MODAL
// ===============================================

interface ConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

function ConfirmationModal({
  isOpen,
  onConfirm,
  onCancel,
  isPending,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) onCancel();
      }}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md animate-in zoom-in-95 slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              Withdraw Dispute?
            </h3>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-gray-700">
            Are you sure you want to withdraw this dispute? This action cannot be
            undone.
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-900">
              <strong>Note:</strong> Withdrawing will:
            </p>
            <ul className="list-disc list-inside text-sm text-yellow-800 mt-2 space-y-1">
              <li>Close the dispute permanently</li>
              <li>Allow the contract to proceed normally</li>
              <li>Not create a DAO proposal</li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Withdrawing...
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4" />
                Withdraw Dispute
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ===============================================
// MAIN COMPONENT
// ===============================================

/**
 * WithdrawDisputeButton Component
 *
 * A button that allows the dispute opener to withdraw their dispute.
 * Includes permission checks and optional confirmation modal.
 *
 * @example
 * ```tsx
 * <WithdrawDisputeButton
 *   dispute={dispute}
 *   currentUserAddress={userAddress}
 *   onSuccess={() => router.push('/disputes')}
 * />
 * ```
 */
export function WithdrawDisputeButton({
  dispute,
  currentUserAddress,
  onSuccess,
  variant = 'default',
  size = 'default',
  className,
  fullWidth = false,
  requireConfirmation = true,
}: WithdrawDisputeButtonProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Hooks
  const { mutate: withdrawDispute, isPending, isSuccess } = useWithdrawDispute();

  // Permission checks
  const isOpener = currentUserAddress === dispute.openedBy;
  const isOpen = dispute.status === DisputeStatus.OPEN;

  // Determine disabled state and reason
  let disabled = false;
  let reason = '';

  if (!currentUserAddress) {
    disabled = true;
    reason = 'Please connect your wallet';
  } else if (!isOpener) {
    disabled = true;
    reason = 'Only the person who opened the dispute can withdraw it';
  } else if (!isOpen) {
    disabled = true;
    reason = 'This dispute has already been resolved or withdrawn';
  }

  const handleClick = () => {
    if (disabled || isPending) return;

    if (requireConfirmation) {
      setShowConfirmation(true);
    } else {
      handleWithdraw();
    }
  };

  const handleWithdraw = () => {
    withdrawDispute(
      { disputeId: dispute.id },
      {
        onSuccess: () => {
          onSuccess?.();
          setShowConfirmation(false);
        },
      }
    );
  };

  const handleMouseEnter = () => {
    if (disabled) setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  return (
    <>
      <div className="relative inline-block">
        <button
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          disabled={disabled || isPending}
          className={cn(
            // Base styles
            'inline-flex items-center justify-center gap-2',
            'font-medium rounded-lg',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2',
            // Variant styles
            buttonVariants[variant],
            // Size styles
            sizeVariants[size],
            // Disabled styles
            (disabled || isPending) &&
              'opacity-50 cursor-not-allowed hover:bg-gray-600',
            // Full width
            fullWidth && 'w-full',
            // Success state
            isSuccess && 'bg-green-600 hover:bg-green-600',
            // Custom classes
            className
          )}
          aria-label="Withdraw dispute"
          title={disabled ? reason : 'Withdraw this dispute'}
        >
          {/* Icon */}
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isSuccess ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}

          {/* Text */}
          <span>
            {isPending
              ? 'Withdrawing...'
              : isSuccess
              ? 'Withdrawn!'
              : 'Withdraw Dispute'}
          </span>
        </button>

        {/* Tooltip */}
        {showTooltip && disabled && reason && (
          <div
            className={cn(
              'absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg',
              'bottom-full left-1/2 -translate-x-1/2 mb-2',
              'whitespace-nowrap',
              'animate-in fade-in slide-in-from-bottom-1 duration-200'
            )}
            role="tooltip"
          >
            {reason}
            {/* Arrow */}
            <div
              className="absolute top-full left-1/2 -translate-x-1/2 -mt-px"
              style={{
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '6px solid #111827',
              }}
            />
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {requireConfirmation && (
        <ConfirmationModal
          isOpen={showConfirmation}
          onConfirm={handleWithdraw}
          onCancel={() => setShowConfirmation(false)}
          isPending={isPending}
        />
      )}
    </>
  );
}

// ===============================================
// PRESET VARIANTS
// ===============================================

/**
 * Small outline button variant
 */
export function WithdrawDisputeButtonSmall(
  props: Omit<WithdrawDisputeButtonProps, 'variant' | 'size'>
) {
  return <WithdrawDisputeButton {...props} variant="outline" size="sm" />;
}

/**
 * Full width button variant
 */
export function WithdrawDisputeButtonFullWidth(
  props: Omit<WithdrawDisputeButtonProps, 'fullWidth'>
) {
  return <WithdrawDisputeButton {...props} fullWidth />;
}

/**
 * Button without confirmation (direct withdraw)
 */
export function WithdrawDisputeButtonDirect(
  props: Omit<WithdrawDisputeButtonProps, 'requireConfirmation'>
) {
  return <WithdrawDisputeButton {...props} requireConfirmation={false} />;
}

// ===============================================
// ICON ONLY VARIANT
// ===============================================

/**
 * Icon-only button variant (for compact displays)
 */
export function WithdrawDisputeButtonIcon({
  onClick,
  disabled,
  isPending,
  className,
}: {
  onClick?: () => void;
  disabled?: boolean;
  isPending?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isPending}
      className={cn(
        'p-2 rounded-lg',
        'text-gray-600 hover:bg-gray-50 active:bg-gray-100',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2',
        (disabled || isPending) && 'opacity-50 cursor-not-allowed',
        className
      )}
      aria-label="Withdraw dispute"
      title="Withdraw dispute"
    >
      {isPending ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <XCircle className="h-5 w-5" />
      )}
    </button>
  );
}

// ===============================================
// EXPORT
// ===============================================

export default WithdrawDisputeButton;
