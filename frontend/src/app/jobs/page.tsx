'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useStacks } from '@/hooks/useStacks';
import { getJobsFromBackend } from '@/lib/apiClient';
import { JobCard } from '@/components/marketplace/JobCard';
import { AppLayout } from '@/components/layout';
import Breadcrumbs from '@/components/layout/Breadcrumbs';

export default function JobsPage() {
  const { isSignedIn } = useStacks();
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);

  const { data, isLoading } = useQuery({
    queryKey: ['jobs', { status: statusFilter }],
    queryFn: () => getJobsFromBackend({ status: statusFilter }),
    staleTime: 30_000,
  });

  const jobs = data?.jobs ?? [];
  const total = data?.total ?? 0;

  return (
    <AppLayout>
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Breadcrumbs className="mb-4" />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Job Marketplace
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {total} job{total !== 1 ? 's' : ''} posted
          </p>
        </div>
        {isSignedIn && (
          <Link
            href="/jobs/create"
            className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700"
          >
            Post a Job
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {[
          { label: 'All', value: undefined },
          { label: 'Open', value: 0 },
          { label: 'Filled', value: 1 },
          { label: 'Cancelled', value: 2 },
        ].map((filter) => (
          <button
            key={filter.label}
            onClick={() => setStatusFilter(filter.value)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md ${
              statusFilter === filter.value
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Job list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="animate-pulse h-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p className="text-lg mb-2">No jobs found</p>
          <p className="text-sm">Be the first to post a job on BlockLancer!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <JobCard key={job.on_chain_id} job={job} />
          ))}
        </div>
      )}
    </div>
    </AppLayout>
  );
}
