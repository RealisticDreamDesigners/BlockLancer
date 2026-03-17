'use client';

import React from 'react';

export interface MiniBarProps {
  value: number;
  max: number;
  color?: string;
  className?: string;
  showLabel?: boolean;
}

export function MiniBar({
  value,
  max,
  color = 'bg-blue-500',
  className = '',
  showLabel = false,
}: MiniBarProps) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-[11px] text-gray-500 dark:text-gray-400 tabular-nums whitespace-nowrap">
          {pct}%
        </span>
      )}
    </div>
  );
}
