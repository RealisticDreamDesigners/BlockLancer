'use client';

import React, { useState, useMemo } from 'react';
import { Dispute, DisputeStatus } from '@/types/dispute';
import { DisputeCard, DisputeCardSkeleton } from './DisputeCard';
import { DisputeStatusLegend } from './DisputeBadge';
import {
  filterDisputesByStatus,
  sortDisputes,
  searchDisputes,
} from '@/lib/disputeUtils';
import { cn } from '@/lib/utils';
import {
  Search,
  SlidersHorizontal,
  AlertCircle,
  ArrowUpDown,
  FileX,
} from 'lucide-react';

// ===============================================
// TYPES
// ===============================================

export type SortOption = 'date' | 'status' | 'id';
export type SortOrder = 'asc' | 'desc';

export interface DisputeListProps {
  /**
   * Array of disputes to display
   */
  disputes: Dispute[] | undefined;

  /**
   * Current user's address for highlighting
   */
  currentUserAddress?: string;

  /**
   * Loading state
   */
  isLoading?: boolean;

  /**
   * Error state
   */
  error?: Error | null;

  /**
   * Whether to show filters
   * @default true
   */
  showFilters?: boolean;

  /**
   * Whether to show search
   * @default true
   */
  showSearch?: boolean;

  /**
   * Whether to show sorting
   * @default true
   */
  showSort?: boolean;

  /**
   * Default filter status
   * @default 'all'
   */
  defaultFilter?: DisputeStatus | 'all';

  /**
   * Default sort option
   * @default 'date'
   */
  defaultSort?: SortOption;

  /**
   * Default sort order
   * @default 'desc'
   */
  defaultSortOrder?: SortOrder;

  /**
   * Number of skeleton loaders to show
   * @default 3
   */
  skeletonCount?: number;

  /**
   * Custom empty state message
   */
  emptyMessage?: string;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Card variant to use
   */
  cardVariant?: 'default' | 'compact' | 'detailed';

  /**
   * Whether the current user is a DAO member
   * @default false
   */
  isDAOMember?: boolean;
}

// ===============================================
// COMPONENT
// ===============================================

/**
 * DisputeList Component
 *
 * Displays a filterable, sortable, searchable list of disputes.
 * Includes loading states, empty states, and error handling.
 *
 * @example
 * ```tsx
 * <DisputeList
 *   disputes={disputes}
 *   currentUserAddress={userAddress}
 *   isLoading={isLoading}
 *   showFilters
 *   showSearch
 * />
 * ```
 */
export function DisputeList({
  disputes,
  currentUserAddress,
  isLoading = false,
  error = null,
  showFilters = true,
  showSearch = true,
  showSort = true,
  defaultFilter = 'all',
  defaultSort = 'date',
  defaultSortOrder = 'desc',
  skeletonCount = 3,
  emptyMessage,
  className,
  cardVariant = 'default',
  isDAOMember = false,
}: DisputeListProps) {
  // State
  const [filterStatus, setFilterStatus] = useState<DisputeStatus | 'all'>(defaultFilter);
  const [searchTerm, setSearchTerm] = useState('-');
  const [sortBy, setSortBy] = useState<SortOption>(defaultSort);
  const [sortOrder, setSortOrder] = useState<SortOrder>(defaultSortOrder);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Processed disputes
  const processedDisputes = useMemo(() => {
    if (!disputes) return [];

    let result = [...disputes];

    // Filter by status
    if (filterStatus !== 'all') {
      result = filterDisputesByStatus(result, filterStatus);
    }

    // Search
    if (searchTerm) {
      result = searchDisputes(result, searchTerm);
    }

    // Sort
    result = sortDisputes(result, sortBy, sortOrder);

    return result;
  }, [disputes, filterStatus, searchTerm, sortBy, sortOrder]);

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  // Handlers
  const handleFilterChange = (status: DisputeStatus | 'all') => {
    setFilterStatus(status);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSortChange = (option: SortOption) => {
    if (sortBy === option) {
      toggleSortOrder();
    } else {
      setSortBy(option);
      setSortOrder('desc');
    }
  };

  // Render error state
  if (error) {
    return (
      <div className={cn('rounded-lg border border-red-200 bg-red-50 p-6', className)}>
        <div className="flex items-center gap-3 text-red-800">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold">Failed to load disputes</h3>
            <p className="text-sm mt-1">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  // Render loading state
  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <DisputeCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Controls */}
      {(showFilters || showSearch || showSort) && (
        <div className="space-y-3">
          {/* Search and Filter Toggle */}
          <div className="flex gap-2">
            {/* Search */}
            {showSearch && (
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search disputes by ID, address, or reason..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                />
              </div>
            )}

            {/* Filter Toggle */}
            {showFilters && (
              <button
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className={cn(
                  'px-4 py-2 border rounded-lg font-medium transition-colors',
                  'flex items-center gap-2',
                  showFilterPanel
                    ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/20 dark:border-blue-600 dark:text-blue-400'
                    : 'bg-white dark:bg-gray-800/50 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                )}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </button>
            )}
          </div>

          {/* Filter Panel */}
          {showFilters && showFilterPanel && (
            <div className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700/50 rounded-lg p-4">
              <div className="space-y-3">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleFilterChange('all')}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                        filterStatus === 'all'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                      )}
                    >
                      All Disputes
                    </button>
                    <button
                      onClick={() => handleFilterChange(DisputeStatus.OPEN)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                        filterStatus === DisputeStatus.OPEN
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                      )}
                    >
                      Open
                    </button>
                    <button
                      onClick={() => handleFilterChange(DisputeStatus.RESOLVED)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                        filterStatus === DisputeStatus.RESOLVED
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                      )}
                    >
                      Resolved
                    </button>
                    <button
                      onClick={() => handleFilterChange(DisputeStatus.WITHDRAWN)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                        filterStatus === DisputeStatus.WITHDRAWN
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                      )}
                    >
                      Withdrawn
                    </button>
                  </div>
                </div>

                {/* Sort Options */}
                {showSort && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Sort By
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleSortChange('date')}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                          'flex items-center gap-1',
                          sortBy === 'date'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                        )}
                      >
                        Date
                        {sortBy === 'date' && (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                      </button>
                      <button
                        onClick={() => handleSortChange('status')}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                          'flex items-center gap-1',
                          sortBy === 'status'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                        )}
                      >
                        Status
                        {sortBy === 'status' && (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                      </button>
                      <button
                        onClick={() => handleSortChange('id')}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                          'flex items-center gap-1',
                          sortBy === 'id'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                        )}
                      >
                        ID
                        {sortBy === 'id' && (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Results Count */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {processedDisputes.length} {processedDisputes.length === 1 ? 'dispute' : 'disputes'}
            {filterStatus !== 'all' && ' (filtered)'}
            {searchTerm && ' (searched)'}
          </div>
        </div>
      )}

      {/* Dispute Cards */}
      {processedDisputes.length > 0 ? (
        <div className="space-y-4">
          {processedDisputes.map((dispute) => (
            <DisputeCard
              key={dispute.id}
              dispute={dispute}
              currentUserAddress={currentUserAddress}
              variant={cardVariant}
              isDAOMember={isDAOMember}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-12 px-4 bg-gray-50 dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-700/50">
          <FileX className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            No disputes found
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {emptyMessage ||
              (searchTerm
                ? 'Try adjusting your search or filters'
                : filterStatus !== 'all'
                ? 'No disputes match the selected filter'
                : 'There are no disputes to display')}
          </p>
        </div>
      )}
    </div>
  );
}

// ===============================================
// PRESET VARIANTS
// ===============================================

/**
 * Compact dispute list without filters
 */
export function DisputeListCompact(props: Omit<DisputeListProps, 'showFilters' | 'showSearch' | 'cardVariant'>) {
  return (
    <DisputeList
      {...props}
      showFilters={false}
      showSearch={false}
      cardVariant="compact"
    />
  );
}

/**
 * Simple dispute list with minimal controls
 */
export function DisputeListSimple(props: Omit<DisputeListProps, 'showFilters' | 'showSort'>) {
  return (
    <DisputeList
      {...props}
      showFilters={false}
      showSort={false}
    />
  );
}

// ===============================================
// EXPORT
// ===============================================

export default DisputeList;
