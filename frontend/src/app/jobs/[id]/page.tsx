'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useStacks } from '@/hooks/useStacks';
import { useMarketplace } from '@/hooks/useMarketplace';
import { getJobFromBackend, getJobApplicationsFromBackend } from '@/lib/apiClient';
import { ApplicationForm } from '@/components/marketplace/ApplicationForm';
import { CreateEscrowFromJobModal } from '@/components/marketplace/CreateEscrowFromJobModal';
import { AppLayout } from '@/components/layout';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { formatBlockHeight, formatBlockDuration } from '@/lib/blockTime';
import Link from 'next/link';
import { toast } from 'sonner';

const STATUS_LABELS: Record<number, { label: string; color: string }> = {
  0: { label: 'Open', color: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' },
  1: { label: 'Filled', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' },
  2: { label: 'Cancelled', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400' },
};

const APP_STATUS: Record<number, { label: string; color: string }> = {
  0: { label: 'Pending', color: 'text-yellow-600 dark:text-yellow-400' },
  1: { label: 'Accepted', color: 'text-green-600 dark:text-green-400' },
  2: { label: 'Rejected', color: 'text-red-600 dark:text-red-400' },
};

function formatSTX(microSTX: string | number): string {
  return (Number(microSTX) / 1_000_000).toFixed(2);
}

function formatAddress(address: string): string {
  if (address.length <= 16) return address;
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

export default function JobDetailPage() {
  const params = useParams();
  const jobId = parseInt(params.id as string, 10);
  const { isSignedIn, userAddress } = useStacks();
  const { applyToJob, acceptApplication, rejectApplication } = useMarketplace();
  const queryClient = useQueryClient();
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [showEscrowModal, setShowEscrowModal] = useState(false);
  const [acceptedApplicant, setAcceptedApplicant] = useState<{ address: string; amount: number } | null>(null);

  const { data: job, isLoading: jobLoading, error: jobError } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => getJobFromBackend(jobId),
    enabled: !isNaN(jobId),
    staleTime: 30_000,
  });

  const { data: applications, isLoading: appsLoading } = useQuery({
    queryKey: ['jobApplications', jobId],
    queryFn: () => getJobApplicationsFromBackend(jobId),
    enabled: !isNaN(jobId),
    staleTime: 30_000,
  });

  if (jobLoading) {
    return (
      <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
      </AppLayout>
    );
  }

  if (jobError) {
    return (
      <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-red-500">Failed to load job. Please try again later.</p>
      </div>
      </AppLayout>
    );
  }

  if (!job) {
    return (
      <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">Job not found</p>
      </div>
      </AppLayout>
    );
  }

  const status = STATUS_LABELS[job.status] || STATUS_LABELS[0];
  const isJobPoster = userAddress === job.poster;
  const skills = job.skills ? job.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
  const hasApplied = applications?.some(a => a.applicant === userAddress);

  const handleAccept = async (applicant: string, proposedAmount: string) => {
    const result = await acceptApplication(jobId, applicant);
    if (result.success) {
      toast.success('Application accepted');
      setAcceptedApplicant({ address: applicant, amount: Number(proposedAmount) });
      setShowEscrowModal(true);
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      queryClient.invalidateQueries({ queryKey: ['jobApplications', jobId] });
    } else {
      toast.error(result.error || 'Failed to accept application');
    }
  };

  const handleReject = async (applicant: string) => {
    const result = await rejectApplication(jobId, applicant);
    if (result.success) {
      toast.success('Application rejected');
      queryClient.invalidateQueries({ queryKey: ['jobApplications', jobId] });
    } else {
      toast.error(result.error || 'Failed to reject application');
    }
  };

  return (
    <AppLayout>
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Breadcrumbs customLabels={{ [`/jobs/${jobId}`]: job.title || `Job #${jobId}` }} className="mb-4" />
      {/* Job header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {job.title || 'Untitled Job'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Posted by {formatAddress(job.poster)}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
            {status.label}
          </span>
        </div>

        <p className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-wrap">
          {job.description || 'No description provided.'}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm mb-4">
          <div>
            <p className="text-gray-500 dark:text-gray-400">Budget Range</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {formatSTX(job.budget_min)} - {formatSTX(job.budget_max)} STX
            </p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Deadline</p>
            <p className="font-medium text-gray-900 dark:text-white">{formatBlockHeight(job.deadline)}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Applications</p>
            <p className="font-medium text-gray-900 dark:text-white">{job.application_count}</p>
          </div>
        </div>

        {skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span key={skill} className="px-2.5 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                {skill}
              </span>
            ))}
          </div>
        )}

        {/* Apply button — visible to freelancers when job is open */}
        {isSignedIn && !isJobPoster && job.status === 0 && !hasApplied && !showApplicationForm && (
          <button
            onClick={() => setShowApplicationForm(true)}
            className="mt-4 px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700"
          >
            Apply for this Job
          </button>
        )}

        {hasApplied && (
          <p className="mt-4 text-sm text-green-600 dark:text-green-400 font-medium">
            You have already applied for this job.
          </p>
        )}
      </div>

      {/* Application form */}
      {showApplicationForm && (
        <div className="mb-6">
          <ApplicationForm
            jobId={jobId}
            budgetMin={parseInt(job.budget_min)}
            budgetMax={parseInt(job.budget_max)}
            onSubmit={async (coverLetter, amount, timeline) => {
              const result = await applyToJob(jobId, coverLetter, amount, timeline);
              if (result.success) setShowApplicationForm(false);
              return result;
            }}
            onCancel={() => setShowApplicationForm(false)}
          />
        </div>
      )}

      {/* Applications list (visible to job poster) */}
      {isJobPoster && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Applications ({applications?.length || 0})
          </h2>

          {appsLoading ? (
            <div className="animate-pulse space-y-3">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
              ))}
            </div>
          ) : !applications || applications.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">No applications yet.</p>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => {
                const appStatus = APP_STATUS[app.status] || APP_STATUS[0];
                return (
                  <div key={app.applicant} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
                        {formatAddress(app.applicant)}
                      </span>
                      <span className={`text-sm font-medium ${appStatus.color}`}>
                        {appStatus.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      {app.cover_letter}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Proposed: {formatSTX(app.proposed_amount)} STX</span>
                      <span>Timeline: {formatBlockDuration(app.proposed_timeline)}</span>
                    </div>
                    {app.status === 0 && job.status === 0 && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleAccept(app.applicant, app.proposed_amount)}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleReject(app.applicant)}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {app.status === 1 && (
                      <div className="mt-3">
                        <span className="text-xs text-green-600 font-medium">Accepted</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Linked Escrow Section */}
      {job.escrow_id && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Linked Escrow</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            This job has an escrow contract linked for payment protection.
          </p>
          <Link
            href={`/contracts/${job.escrow_id}`}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700"
          >
            View Escrow Contract #{job.escrow_id}
          </Link>
        </div>
      )}

      {/* Create Escrow Modal (shown after accepting an application) */}
      {showEscrowModal && acceptedApplicant && (
        <CreateEscrowFromJobModal
          isOpen={showEscrowModal}
          onClose={() => {
            setShowEscrowModal(false);
            setAcceptedApplicant(null);
          }}
          jobId={jobId}
          freelancerAddress={acceptedApplicant.address}
          proposedAmount={acceptedApplicant.amount}
          deadline={job.deadline}
          description={job.title || `Job #${jobId}`}
          onEscrowCreated={() => {
            toast.success('Escrow creation submitted! It will appear on the job once confirmed on-chain.');
            setShowEscrowModal(false);
            setAcceptedApplicant(null);
          }}
        />
      )}
    </div>
    </AppLayout>
  );
}
