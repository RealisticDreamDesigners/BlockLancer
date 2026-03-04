'use client';

interface TierBadgeProps {
  tier: number;
  className?: string;
}

export function TierBadge({ tier, className = '' }: TierBadgeProps) {
  if (tier >= 1) {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-purple-500 to-indigo-600 text-white ${className}`}>
        PRO
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 ${className}`}>
      Free
    </span>
  );
}
