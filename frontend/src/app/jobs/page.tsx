'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useStacks } from '@/hooks/useStacks';
import { getJobsFromBackend } from '@/lib/apiClient';
import { JobCard } from '@/components/marketplace/JobCard';
import { AppLayout } from '@/components/layout';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { Briefcase, Plus, SearchX, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 10;

export default function JobsPage() {
  const { isSignedIn } = useStacks();
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(1);

  // Reset to page 1 when filter changes
  const handleFilterChange = (value: number | undefined) => {
    setStatusFilter(value);
    setPage(1);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['jobs', { status: statusFilter, page }],
    queryFn: () => getJobsFromBackend({ status: statusFilter, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }),
    staleTime: 30_000,
  });

  const jobs = data?.jobs ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AppLayout>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumbs className="mb-6" />

        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Job Marketplace
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {total} job{total !== 1 ? 's' : ''} posted
              </p>
            </div>
          </div>
          {isSignedIn && (
            <Link
              href="/jobs/create"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Post a Job
            </Link>
          )}
        </div>

        {/* Pill-style filter tabs */}
        <div className="inline-flex bg-gray-100 dark:bg-gray-800/80 rounded-lg p-1 gap-1 mb-8">
          {[
            { label: 'All', value: undefined },
            { label: 'Open', value: 0 },
            { label: 'Filled', value: 1 },
            { label: 'Cancelled', value: 2 },
          ].map((filter) => (
            <button
              key={filter.label}
              onClick={() => handleFilterChange(filter.value)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                statusFilter === filter.value
                  ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Job list */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="animate-pulse bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-lg w-2/3" />
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16" />
                </div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4" />
                <div className="flex gap-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 py-16 text-center">
            <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <SearchX className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-900 dark:text-white mb-1">No jobs found</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Be the first to post a job on BlockLancer!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <JobCard key={job.on_chain_id} job={job} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-8">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {(page - 1) * PAGE_SIZE + 1}--{Math.min(page * PAGE_SIZE, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .map((p, idx, arr) => (
                  <span key={p} className="flex items-center">
                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                      <span className="px-1 text-gray-400">...</span>
                    )}
                    <button
                      onClick={() => setPage(p)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                        p === page
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      {p}
                    </button>
                  </span>
                ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    </AppLayout>
  );
}
