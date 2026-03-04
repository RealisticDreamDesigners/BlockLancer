'use client';

import React from 'react';
import { ProposalStatus, getProposalStatusInfo } from '@/types/dispute';
import { cn } from '@/lib/utils';

// ===============================================
// TYPES
// ===============================================

export interface ProposalBadgeProps {
  /**
   * The proposal status to display
   */
  status: ProposalStatus;

  /**
   * Size variant of the badge
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';

  /**
   * Whether to show the status icon
   * @default true
   */
  showIcon?: boolean;

  /**
   * Whether to show full description on hover
   * @default false
   */
  showTooltip?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Whether to use dot indicator instead of icon
   * @default false
   */
  useDot?: boolean;
}

// ===============================================
// SIZE VARIANTS
// ===============================================

const sizeVariants = {
  small: {
    container: 'px-2 py-0.5 text-xs gap-1',
    icon: 'text-xs',
    dot: 'w-1.5 h-1.5',
  },
  medium: {
    container: 'px-2.5 py-1 text-sm gap-1.5',
    icon: 'text-sm',
    dot: 'w-2 h-2',
  },
  large: {
    container: 'px-3 py-1.5 text-base gap-2',
    icon: 'text-base',
    dot: 'w-2.5 h-2.5',
  },
};

// ===============================================
// COMPONENT
// ===============================================

/**
 * ProposalBadge Component
 *
 * Displays a colored badge showing the status of a DAO proposal with optional icon.
 * Used throughout the DAO interface for status visualization.
 *
 * @example
 * ```tsx
 * <ProposalBadge status={ProposalStatus.ACTIVE} />
 * <ProposalBadge status={ProposalStatus.PASSED} size="large" />
 * <ProposalBadge status={ProposalStatus.FAILED} showIcon={false} />
 * <ProposalBadge status={ProposalStatus.EXECUTED} useDot />
 * ```
 */
export function ProposalBadge({
  status,
  size = 'medium',
  showIcon = true,
  showTooltip = false,
  className,
  useDot = false,
}: ProposalBadgeProps) {
  const statusInfo = getProposalStatusInfo(status);
  const variant = sizeVariants[size];

  return (
    <span
      className={cn(
        // Base styles
        'inline-flex items-center rounded-full font-medium',
        'transition-all duration-200',
        // Size variant
        variant.container,
        // Color from status info
        statusInfo.color,
        // Custom classes
        className
      )}
      title={showTooltip ? statusInfo.description : undefined}
      role="status"
      aria-label={`Proposal status: ${statusInfo.text}`}
    >
      {/* Icon or Dot */}
      {showIcon && !useDot && (
        <span className={cn('flex-shrink-0', variant.icon)} aria-hidden="true">
          {React.createElement(statusInfo.icon, { className: 'w-full h-full' })}
        </span>
      )}

      {useDot && (
        <span
          className={cn(
            'flex-shrink-0 rounded-full',
            variant.dot,
            // Extract background color from statusInfo.color
            statusInfo.color.includes('blue')
              ? 'bg-blue-600'
              : statusInfo.color.includes('green')
              ? 'bg-green-600'
              : statusInfo.color.includes('red')
              ? 'bg-red-600'
              : 'bg-gray-600'
          )}
          aria-hidden="true"
        />
      )}

      {/* Status Text */}
      <span className="flex-shrink-0">{statusInfo.text}</span>
    </span>
  );
}

// ===============================================
// PRESET VARIANTS
// ===============================================

/**
 * Small badge variant without icon - useful for compact displays
 */
export function ProposalBadgeSmall({
  status,
  className,
  ...props
}: Omit<ProposalBadgeProps, 'size' | 'showIcon'>) {
  return (
    <ProposalBadge
      status={status}
      size="small"
      showIcon={false}
      className={className}
      {...props}
    />
  );
}

/**
 * Badge with dot indicator - useful for minimal status display
 */
export function ProposalBadgeDot({
  status,
  className,
  ...props
}: Omit<ProposalBadgeProps, 'useDot'>) {
  return (
    <ProposalBadge status={status} useDot className={className} {...props} />
  );
}

/**
 * Large badge with tooltip - useful for prominent status display
 */
export function ProposalBadgeLarge({
  status,
  className,
  ...props
}: Omit<ProposalBadgeProps, 'size' | 'showTooltip'>) {
  return (
    <ProposalBadge
      status={status}
      size="large"
      showTooltip
      className={className}
      {...props}
    />
  );
}

// ===============================================
// UTILITY COMPONENTS
// ===============================================

/**
 * Component to display all proposal statuses
 * Useful for filtering UI or legends
 */
export function ProposalStatusLegend({
  className,
}: {
  className?: string;
}) {
  const statuses = [
    ProposalStatus.ACTIVE,
    ProposalStatus.PASSED,
    ProposalStatus.FAILED,
    ProposalStatus.EXECUTED,
  ];

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {statuses.map((status) => (
        <ProposalBadge key={status} status={status} showTooltip />
      ))}
    </div>
  );
}

// ===============================================
// EXPORT
// ===============================================

export default ProposalBadge;
