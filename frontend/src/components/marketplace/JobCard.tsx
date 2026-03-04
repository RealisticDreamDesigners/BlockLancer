'use client';

import Link from 'next/link';

interface JobCardProps {
  job: {
    on_chain_id: number;
    poster: string;
    title: string;
    description: string;
    budget_min: string;
    budget_max: string;
    deadline: number;
    status: number;
    skills: string;
    created_at: number;
    application_count: number;
    escrow_id?: number;
  };
}

const STATUS_LABELS: Record<number, { label: string; color: string }> = {
  0: { label: 'Open', color: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' },
  1: { label: 'Filled', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' },
  2: { label: 'Cancelled', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400' },
};

function formatSTX(microSTX: string): string {
  return (parseInt(microSTX) / 1_000_000).toFixed(2);
}

function formatAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function JobCard({ job }: JobCardProps) {
  const status = STATUS_LABELS[job.status] || STATUS_LABELS[0];
  const skills = job.skills ? job.skills.split(',').map(s => s.trim()).filter(Boolean) : [];

  return (
    <Link href={`/jobs/${job.on_chain_id}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-orange-300 dark:hover:border-orange-600 transition-colors cursor-pointer">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white line-clamp-1">
            {job.title || 'Untitled Job'}
          </h3>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
            {status.label}
          </span>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
          {job.description || 'No description provided.'}
        </p>

        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
          <span>Budget: {formatSTX(job.budget_min)} - {formatSTX(job.budget_max)} STX</span>
          <span>{job.application_count} application{job.application_count !== 1 ? 's' : ''}</span>
        </div>

        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {skills.slice(0, 5).map((skill) => (
              <span
                key={skill}
                className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
              >
                {skill}
              </span>
            ))}
            {skills.length > 5 && (
              <span className="text-xs text-gray-400">+{skills.length - 5} more</span>
            )}
          </div>
        )}

        <div className="text-xs text-gray-400 dark:text-gray-500">
          Posted by {formatAddress(job.poster)}
        </div>
      </div>
    </Link>
  );
}
