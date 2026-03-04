'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ChevronRight, Home } from 'lucide-react';

/**
 * Breadcrumbs Component
 *
 * Automatically generates breadcrumbs based on current path.
 * Shows hierarchy and allows navigation to parent pages.
 */
export interface BreadcrumbsProps {
  /**
   * Custom labels for paths
   */
  customLabels?: Record<string, string>;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Show home icon
   * @default true
   */
  showHome?: boolean;
}

export function Breadcrumbs({
  customLabels = {},
  className,
  showHome = true,
}: BreadcrumbsProps) {
  const pathname = usePathname();

  // Don't show breadcrumbs on home page
  if (!pathname || pathname === '/') return null;

  // Split path into segments
  const segments = pathname.split('/').filter(Boolean);

  // Build breadcrumb items
  const breadcrumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    const isLast = index === segments.length - 1;

    // Get label (custom or capitalize segment)
    let label = customLabels[href] || customLabels[segment];
    if (!label) {
      // Try to format segment nicely
      label = segment
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      // Special cases for IDs (numbers)
      if (/^\d+$/.test(segment)) {
        label = `#${segment}`;
      }
    }

    return {
      href,
      label,
      isLast,
    };
  });

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center gap-2 text-sm', className)}
    >
      {/* Home Link */}
      {showHome && (
        <>
          <Link
            href="/"
            className="text-gray-600 hover:text-gray-900 transition-colors"
            aria-label="Home"
          >
            <Home className="h-4 w-4" />
          </Link>
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </>
      )}

      {/* Breadcrumb Items */}
      {breadcrumbs.map((item, index) => (
        <React.Fragment key={item.href}>
          {item.isLast ? (
            <span className="font-medium text-gray-900">{item.label}</span>
          ) : (
            <>
              <Link
                href={item.href}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                {item.label}
              </Link>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

export default Breadcrumbs;
