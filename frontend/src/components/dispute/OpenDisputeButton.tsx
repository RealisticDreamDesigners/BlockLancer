'use client';

import React, { useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ===============================================
// TYPES
// ===============================================

export interface OpenDisputeButtonProps {
  /**
   * Contract ID to open dispute for
   */
  contractId: number;

  /**
   * Client address
   */
  clientAddress: string;

  /**
   * Freelancer address
   */
  freelancerAddress: string;

  /**
   * Current user's address
   */
  currentUserAddress?: string;

  /**
   * Whether the contract already has a dispute
   */
  hasActiveDispute?: boolean;

  /**
   * Whether user is signed in
   */
  isSignedIn?: boolean;

  /**
   * Click handler that opens modal
   */
  onClick?: () => void;

  /**
   * Button variant
   * @default 'default'
   */
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';

  /**
   * Button size
   * @default 'default'
   */
  size?: 'sm' | 'default' | 'lg';

  /**
   * Loading state
   */
  isLoading?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Full width button
   */
  fullWidth?: boolean;

  /**
   * Custom disabled reason (overrides default checks)
   */
  disabledReason?: string;
}

// ===============================================
// BUTTON VARIANTS
// ===============================================

const buttonVariants = {
  default: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
  outline:
    'border-2 border-red-600 text-red-600 hover:bg-red-50 active:bg-red-100',
  ghost: 'text-red-600 hover:bg-red-50 active:bg-red-100',
  destructive: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
};

const sizeVariants = {
  sm: 'px-3 py-1.5 text-sm',
  default: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

// ===============================================
// COMPONENT
// ===============================================

/**
 * OpenDisputeButton Component
 *
 * A button that triggers the dispute creation flow.
 * Handles permission checks and shows appropriate disabled states.
 *
 * @example
 * ```tsx
 * <OpenDisputeButton
 *   contractId={1}
 *   clientAddress="ST1..."
 *   freelancerAddress="ST2..."
 *   currentUserAddress={userAddress}
 *   onClick={() => setShowModal(true)}
 * />
 * ```
 */
export function OpenDisputeButton({
  contractId,
  clientAddress,
  freelancerAddress,
  currentUserAddress,
  hasActiveDispute = false,
  isSignedIn = false,
  onClick,
  variant = 'default',
  size = 'default',
  isLoading = false,
  className,
  fullWidth = false,
  disabledReason,
}: OpenDisputeButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Permission checks
  const isClient = currentUserAddress === clientAddress;
  const isFreelancer = currentUserAddress === freelancerAddress;
  const isParticipant = isClient || isFreelancer;

  // Determine disabled state and reason
  let disabled = false;
  let reason = disabledReason;

  if (!reason) {
    if (!isSignedIn) {
      disabled = true;
      reason = 'Please connect your wallet to open a dispute';
    } else if (hasActiveDispute) {
      disabled = true;
      reason = 'This contract already has an active dispute';
    } else if (!isParticipant) {
      disabled = true;
      reason = 'Only the client or freelancer can open a dispute';
    }
  } else {
    disabled = true;
  }

  const handleClick = () => {
    if (disabled || isLoading) return;
    onClick?.();
  };

  const handleMouseEnter = () => {
    if (disabled) setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        disabled={disabled || isLoading}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center gap-2',
          'font-medium rounded-lg',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
          // Variant styles
          buttonVariants[variant],
          // Size styles
          sizeVariants[size],
          // Disabled styles
          (disabled || isLoading) &&
            'opacity-50 cursor-not-allowed hover:bg-red-600',
          // Full width
          fullWidth && 'w-full',
          // Custom classes
          className
        )}
        aria-label="Open dispute"
        title={disabled ? reason : 'Open a dispute for this contract'}
      >
        {/* Icon */}
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <AlertCircle className="h-4 w-4" />
        )}

        {/* Text */}
        <span>{isLoading ? 'Opening...' : 'Open Dispute'}</span>
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
  );
}

// ===============================================
// PRESET VARIANTS
// ===============================================

/**
 * Small outline button variant
 */
export function OpenDisputeButtonSmall(
  props: Omit<OpenDisputeButtonProps, 'variant' | 'size'>
) {
  return <OpenDisputeButton {...props} variant="outline" size="sm" />;
}

/**
 * Large primary button variant
 */
export function OpenDisputeButtonLarge(
  props: Omit<OpenDisputeButtonProps, 'size'>
) {
  return <OpenDisputeButton {...props} size="lg" />;
}

/**
 * Full width button variant
 */
export function OpenDisputeButtonFullWidth(
  props: Omit<OpenDisputeButtonProps, 'fullWidth'>
) {
  return <OpenDisputeButton {...props} fullWidth />;
}

// ===============================================
// ICON ONLY VARIANT
// ===============================================

/**
 * Icon-only button variant (for compact displays)
 */
export function OpenDisputeButtonIcon({
  onClick,
  disabled,
  isLoading,
  className,
}: {
  onClick?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        'p-2 rounded-lg',
        'text-red-600 hover:bg-red-50 active:bg-red-100',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
        (disabled || isLoading) && 'opacity-50 cursor-not-allowed',
        className
      )}
      aria-label="Open dispute"
      title="Open dispute"
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <AlertCircle className="h-5 w-5" />
      )}
    </button>
  );
}

// ===============================================
// EXPORT
// ===============================================

export default OpenDisputeButton;
