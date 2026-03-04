'use client';

import React from 'react';
import { DisputeStatus, getDisputeStatusInfo } from '@/types/dispute';
import { cn } from '@/lib/utils';

// ===============================================
// TYPES
// ===============================================

export interface DisputeBadgeProps {
  /**
   * The dispute status to display
   */
  status: DisputeStatus;

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
 * DisputeBadge Component
 *
 * Displays a colored badge showing the status of a dispute with optional icon.
 * Used throughout the dispute interface for status visualization.
 *
 * @example
 * ```tsx
 * <DisputeBadge status={DisputeStatus.OPEN} />
 * <DisputeBadge status={DisputeStatus.RESOLVED} size="large" />
 * <DisputeBadge status={DisputeStatus.WITHDRAWN} showIcon={false} />
 * <DisputeBadge status={DisputeStatus.OPEN} useDot />
 * ```
 */
export function DisputeBadge({
  status,
  size = 'medium',
  showIcon = true,
  showTooltip = false,
  className,
  useDot = false,
}: DisputeBadgeProps) {
  const statusInfo = getDisputeStatusInfo(status);
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
      aria-label={`Dispute status: ${statusInfo.text}`}
    >
      {/* Icon or Dot */}
      {showIcon && !useDot && statusInfo.icon && (
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
            statusInfo.color.includes('orange')
              ? 'bg-orange-600'
              : statusInfo.color.includes('green')
              ? 'bg-green-600'
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
export function DisputeBadgeSmall({
  status,
  className,
  ...props
}: Omit<DisputeBadgeProps, 'size' | 'showIcon'>) {
  return (
    <DisputeBadge
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
export function DisputeBadgeDot({
  status,
  className,
  ...props
}: Omit<DisputeBadgeProps, 'useDot'>) {
  return (
    <DisputeBadge status={status} useDot className={className} {...props} />
  );
}

/**
 * Large badge with tooltip - useful for prominent status display
 */
export function DisputeBadgeLarge({
  status,
  className,
  ...props
}: Omit<DisputeBadgeProps, 'size' | 'showTooltip'>) {
  return (
    <DisputeBadge
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
 * Component to display multiple dispute statuses
 * Useful for filtering UI or legends
 */
export function DisputeStatusLegend({
  className,
}: {
  className?: string;
}) {
  const statuses = [
    DisputeStatus.OPEN,
    DisputeStatus.RESOLVED,
    DisputeStatus.WITHDRAWN,
  ];

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {statuses.map((status) => (
        <DisputeBadge key={status} status={status} showTooltip />
      ))}
    </div>
  );
}

// ===============================================
// EXPORT
// ===============================================

export default DisputeBadge;
