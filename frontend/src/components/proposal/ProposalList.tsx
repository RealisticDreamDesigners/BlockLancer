'use client';

import React, { useState, useMemo } from 'react';
import { Proposal, ProposalStatus } from '@/types/dispute';
import { ProposalCard, ProposalCardSkeleton } from './ProposalCard';
import { ProposalStatusLegend } from './ProposalBadge';
import {
  filterProposalsByStatus,
  sortProposals,
  searchProposals,
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

export type ProposalSortOption = 'date' | 'status' | 'votes' | 'id';
export type SortOrder = 'asc' | 'desc';

export interface ProposalListProps {
  /**
   * Array of proposals to display
   */
  proposals: Proposal[] | undefined;

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
  defaultFilter?: ProposalStatus | 'all';

  /**
   * Default sort option
   * @default 'date'
   */
  defaultSort?: ProposalSortOption;

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
}

// ===============================================
// COMPONENT
// ===============================================

/**
 * ProposalList Component
 *
 * Displays a filterable, sortable, searchable list of proposals.
 * Includes loading states, empty states, and error handling.
 *
 * @example
 * ```tsx
 * <ProposalList
 *   proposals={proposals}
 *   currentUserAddress={userAddress}
 *   isLoading={isLoading}
 *   showFilters
 *   showSearch
 * />
 * ```
 */
export function ProposalList({
  proposals,
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
}: ProposalListProps) {
  // State
  const [filterStatus, setFilterStatus] = useState<ProposalStatus | 'all'>(defaultFilter);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<ProposalSortOption>(defaultSort);
  const [sortOrder, setSortOrder] = useState<SortOrder>(defaultSortOrder);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Processed proposals
  const processedProposals = useMemo(() => {
    if (!proposals) return [];

    let result = [...proposals];

    // Filter by status
    if (filterStatus !== 'all') {
      result = filterProposalsByStatus(result, filterStatus);
    }

    // Search
    if (searchTerm) {
      result = searchProposals(result, searchTerm);
    }

    // Sort
    result = sortProposals(result, sortBy, sortOrder);

    return result;
  }, [proposals, filterStatus, searchTerm, sortBy, sortOrder]);

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  // Handlers
  const handleFilterChange = (status: ProposalStatus | 'all') => {
    setFilterStatus(status);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSortChange = (option: ProposalSortOption) => {
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
            <h3 className="font-semibold">Failed to load proposals</h3>
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
          <ProposalCardSkeleton key={i} />
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
                  placeholder="Search proposals by ID, description, or proposer..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                )}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </button>
            )}
          </div>

          {/* Filter Panel */}
          {showFilters && showFilterPanel && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="space-y-3">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleFilterChange('all')}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                        filterStatus === 'all'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      )}
                    >
                      All Proposals
                    </button>
                    <button
                      onClick={() => handleFilterChange(ProposalStatus.ACTIVE)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                        filterStatus === ProposalStatus.ACTIVE
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      )}
                    >
                      Active
                    </button>
                    <button
                      onClick={() => handleFilterChange(ProposalStatus.PASSED)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                        filterStatus === ProposalStatus.PASSED
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      )}
                    >
                      Passed
                    </button>
                    <button
                      onClick={() => handleFilterChange(ProposalStatus.FAILED)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                        filterStatus === ProposalStatus.FAILED
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      )}
                    >
                      Failed
                    </button>
                    <button
                      onClick={() => handleFilterChange(ProposalStatus.EXECUTED)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                        filterStatus === ProposalStatus.EXECUTED
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      )}
                    >
                      Executed
                    </button>
                  </div>
                </div>

                {/* Sort Options */}
                {showSort && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
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
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        )}
                      >
                        Status
                        {sortBy === 'status' && (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                      </button>
                      <button
                        onClick={() => handleSortChange('votes')}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                          'flex items-center gap-1',
                          sortBy === 'votes'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        )}
                      >
                        Votes
                        {sortBy === 'votes' && (
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
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
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
          <div className="text-sm text-gray-600">
            Showing {processedProposals.length} {processedProposals.length === 1 ? 'proposal' : 'proposals'}
            {filterStatus !== 'all' && ' (filtered)'}
            {searchTerm && ' (searched)'}
          </div>
        </div>
      )}

      {/* Proposal Cards */}
      {processedProposals.length > 0 ? (
        <div className="space-y-4">
          {processedProposals.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              currentUserAddress={currentUserAddress}
              variant={cardVariant}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-12 px-4 bg-gray-50 rounded-lg border border-gray-200">
          <FileX className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            No proposals found
          </h3>
          <p className="text-sm text-gray-600">
            {emptyMessage ||
              (searchTerm
                ? 'Try adjusting your search or filters'
                : filterStatus !== 'all'
                ? 'No proposals match the selected filter'
                : 'There are no proposals to display')}
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
 * Compact proposal list without filters
 */
export function ProposalListCompact(props: Omit<ProposalListProps, 'showFilters' | 'showSearch' | 'cardVariant'>) {
  return (
    <ProposalList
      {...props}
      showFilters={false}
      showSearch={false}
      cardVariant="compact"
    />
  );
}

/**
 * Simple proposal list with minimal controls
 */
export function ProposalListSimple(props: Omit<ProposalListProps, 'showFilters' | 'showSort'>) {
  return (
    <ProposalList
      {...props}
      showFilters={false}
      showSort={false}
    />
  );
}

// ===============================================
// EXPORT
// ===============================================

export default ProposalList;
