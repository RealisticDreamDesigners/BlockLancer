'use client';

import React from 'react';
import { useDAOMembership } from '@/hooks/useDAOMembership';
import { cn } from '@/lib/utils';
import {
  Shield,
  Star,
  Users,
  Loader2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

// ===============================================
// TYPES
// ===============================================

export interface DAOMemberBadgeProps {
  /**
   * User address to check membership for
   */
  userAddress?: string;

  /**
   * Size variant of the badge
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';

  /**
   * Whether to show the icon
   * @default true
   */
  showIcon?: boolean;

  /**
   * Whether to show additional info on hover
   * @default false
   */
  showTooltip?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Badge style variant
   * @default 'default'
   */
  variant?: 'default' | 'pill' | 'square';
}

// ===============================================
// SIZE VARIANTS
// ===============================================

const sizeVariants = {
  small: {
    container: 'px-2 py-0.5 text-xs gap-1',
    icon: 'h-3 w-3',
  },
  medium: {
    container: 'px-2.5 py-1 text-sm gap-1.5',
    icon: 'h-4 w-4',
  },
  large: {
    container: 'px-3 py-1.5 text-base gap-2',
    icon: 'h-5 w-5',
  },
};

// ===============================================
// COMPONENT
// ===============================================

/**
 * DAOMemberBadge Component
 *
 * Displays a badge indicating DAO membership status.
 * Fetches membership data automatically.
 *
 * @example
 * ```tsx
 * <DAOMemberBadge userAddress={userAddress} />
 * <DAOMemberBadge userAddress={userAddress} size="large" showTooltip />
 * ```
 */
export function DAOMemberBadge({
  userAddress,
  size = 'medium',
  showIcon = true,
  showTooltip = false,
  className,
  variant = 'default',
}: DAOMemberBadgeProps) {
  const { data: membership, isLoading } = useDAOMembership();
  const sizeStyle = sizeVariants[size];

  // Loading state
  if (isLoading) {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full font-medium',
          'bg-gray-100 text-gray-600',
          sizeStyle.container,
          variant === 'pill' && 'rounded-full',
          variant === 'square' && 'rounded',
          className
        )}
      >
        <Loader2 className={cn('animate-spin', sizeStyle.icon)} />
        <span>Checking...</span>
      </span>
    );
  }

  const isMember = membership?.isMember || false;

  // Determine badge content
  const badgeContent = {
    icon: isMember ? (
      <Shield className={sizeStyle.icon} />
    ) : (
      <Users className={sizeStyle.icon} />
    ),
    text: isMember ? 'DAO Member' : 'Not a Member',
    color: isMember
      ? 'bg-purple-100 text-purple-700 border-purple-300'
      : 'bg-gray-100 text-gray-600 border-gray-300',
    tooltip: isMember
      ? `Active DAO member with voting rights`
      : 'Not a member of the DAO',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium border',
        'transition-all duration-200',
        sizeStyle.container,
        badgeContent.color,
        variant === 'pill' && 'rounded-full',
        variant === 'square' && 'rounded',
        variant === 'default' && 'rounded-lg',
        className
      )}
      title={showTooltip ? badgeContent.tooltip : undefined}
      role="status"
      aria-label={`DAO membership: ${badgeContent.text}`}
    >
      {showIcon && badgeContent.icon}
      <span>{badgeContent.text}</span>
    </span>
  );
}

// ===============================================
// PRESET VARIANTS
// ===============================================

/**
 * Small badge variant
 */
export function DAOMemberBadgeSmall(
  props: Omit<DAOMemberBadgeProps, 'size'>
) {
  return <DAOMemberBadge {...props} size="small" />;
}

/**
 * Large badge variant with tooltip
 */
export function DAOMemberBadgeLarge(
  props: Omit<DAOMemberBadgeProps, 'size' | 'showTooltip'>
) {
  return <DAOMemberBadge {...props} size="large" showTooltip />;
}

/**
 * Pill-shaped badge
 */
export function DAOMemberBadgePill(
  props: Omit<DAOMemberBadgeProps, 'variant'>
) {
  return <DAOMemberBadge {...props} variant="pill" />;
}

// ===============================================
// DETAILED CARD
// ===============================================

export interface DAOMemberCardProps {
  userAddress?: string;
  className?: string;
}

/**
 * Detailed DAO membership card with stats
 */
export function DAOMemberCard({ userAddress, className }: DAOMemberCardProps) {
  const { data: membership, isLoading } = useDAOMembership();

  if (isLoading) {
    return (
      <div
        className={cn(
          'bg-white rounded-lg border border-gray-200 p-4 animate-pulse',
          className
        )}
      >
        <div className="h-6 bg-gray-200 rounded w-32 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-48" />
      </div>
    );
  }

  const isMember = membership?.isMember || false;

  return (
    <div
      className={cn(
        'bg-white rounded-lg border p-4',
        isMember ? 'border-purple-200 bg-purple-50' : 'border-gray-200',
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {isMember ? (
            <Shield className="h-6 w-6 text-purple-600" />
          ) : (
            <Users className="h-6 w-6 text-gray-600" />
          )}
          <h3
            className={cn(
              'font-bold',
              isMember ? 'text-purple-900' : 'text-gray-900'
            )}
          >
            {isMember ? 'DAO Member' : 'Not a DAO Member'}
          </h3>
        </div>
        {isMember ? (
          <CheckCircle2 className="h-5 w-5 text-green-600" />
        ) : (
          <XCircle className="h-5 w-5 text-gray-400" />
        )}
      </div>

      <div className="space-y-2">
        {isMember ? (
          <>
            <p className="text-sm text-purple-800">
              You have full voting rights on DAO proposals.
            </p>
            {membership?.memberCount && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-purple-700">Total Members:</span>
                <span className="font-semibold text-purple-900">
                  {membership.memberCount} / 100
                </span>
              </div>
            )}
            {membership?.activity && (
              <div className="pt-2 border-t border-purple-200">
                <p className="text-xs font-medium text-purple-700 mb-1">
                  Your Activity:
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-purple-600">Proposals:</span>{' '}
                    <span className="font-semibold text-purple-900">
                      {membership.activity.proposalsCreated}
                    </span>
                  </div>
                  <div>
                    <span className="text-purple-600">Votes:</span>{' '}
                    <span className="font-semibold text-purple-900">
                      {membership.activity.totalVotes}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <p className="text-sm text-gray-600">
              DAO membership is required to vote on proposals.
            </p>
            {membership?.memberCount && (
              <p className="text-xs text-gray-500">
                Current members: {membership.memberCount} / 100
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ===============================================
// SIMPLE STATUS INDICATOR
// ===============================================

export interface DAOMemberStatusProps {
  userAddress?: string;
  className?: string;
}

/**
 * Simple inline membership status indicator
 */
export function DAOMemberStatus({
  userAddress,
  className,
}: DAOMemberStatusProps) {
  const { data: membership, isLoading } = useDAOMembership();

  if (isLoading) {
    return (
      <span className={cn('text-sm text-gray-500', className)}>
        Checking membership...
      </span>
    );
  }

  const isMember = membership?.isMember || false;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {isMember ? (
        <>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-700">
            DAO Member
          </span>
        </>
      ) : (
        <>
          <XCircle className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">Not a Member</span>
        </>
      )}
    </div>
  );
}

// ===============================================
// MEMBERSHIP GATE
// ===============================================

export interface DAOMemberGateProps {
  /**
   * Content to show if user is a member
   */
  children: React.ReactNode;

  /**
   * Fallback content to show if user is not a member
   */
  fallback?: React.ReactNode;

  /**
   * Loading content
   */
  loading?: React.ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Conditional rendering based on DAO membership
 */
export function DAOMemberGate({
  children,
  fallback,
  loading,
  className,
}: DAOMemberGateProps) {
  const { data: membership, isLoading } = useDAOMembership();

  if (isLoading) {
    return (
      <div className={className}>
        {loading || (
          <div className="text-center py-4">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
            <p className="text-sm text-gray-600 mt-2">
              Checking DAO membership...
            </p>
          </div>
        )}
      </div>
    );
  }

  const isMember = membership?.isMember || false;

  if (!isMember && fallback) {
    return <div className={className}>{fallback}</div>;
  }

  if (!isMember) {
    return (
      <div
        className={cn(
          'bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center',
          className
        )}
      >
        <Shield className="h-12 w-12 text-yellow-600 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-yellow-900 mb-2">
          DAO Membership Required
        </h3>
        <p className="text-sm text-yellow-800">
          You need to be a DAO member to access this feature.
        </p>
      </div>
    );
  }

  return <div className={className}>{children}</div>;
}

// ===============================================
// EXPORT
// ===============================================

export default DAOMemberBadge;
