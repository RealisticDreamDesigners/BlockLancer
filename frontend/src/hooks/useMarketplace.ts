'use client';

import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  uintCV,
  stringUtf8CV,
  standardPrincipalCV,
  PostConditionMode,
} from '@stacks/transactions';
import { getNetwork } from '@/lib/networkConfig';
import {
  getJobsFromBackend,
  getJobFromBackend,
  getJobApplicationsFromBackend,
  getUserApplicationsFromBackend,
} from '@/lib/apiClient';
import { useStacks } from './useStacks';
import { useContractCall } from './useContractCall';

const MARKETPLACE_CONTRACT = process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT || 'ST30M31FNAKNX5EJKV10V7SJSE07VVDFFZHZHGE0J.blocklancer-marketplace';

const parseContractId = (contractId: string) => {
  const [address, name] = contractId.split('.');
  return { address, name };
};

export function useMarketplace() {
  const { isSignedIn, userAddress } = useStacks();
  const network = getNetwork();
  const queryClient = useQueryClient();
  const { execute } = useContractCall();
  const marketplaceContract = parseContractId(MARKETPLACE_CONTRACT);

  const useJobs = (filters: { status?: number; poster?: string } = {}) => {
    return useQuery({
      queryKey: ['jobs', filters],
      queryFn: () => getJobsFromBackend(filters),
      staleTime: 30_000,
    });
  };

  const useJob = (jobId: number) => {
    return useQuery({
      queryKey: ['job', jobId],
      queryFn: () => getJobFromBackend(jobId),
      enabled: jobId > 0,
      staleTime: 30_000,
    });
  };

  const useJobApplications = (jobId: number) => {
    return useQuery({
      queryKey: ['jobApplications', jobId],
      queryFn: () => getJobApplicationsFromBackend(jobId),
      enabled: jobId > 0,
      staleTime: 30_000,
    });
  };

  const useUserApplications = (address?: string) => {
    return useQuery({
      queryKey: ['userApplications', address],
      queryFn: () => getUserApplicationsFromBackend(address!),
      enabled: !!address,
      staleTime: 30_000,
    });
  };

  const postJob = useCallback(async (
    title: string,
    description: string,
    budgetMin: number,
    budgetMax: number,
    deadline: number,
    skills: string
  ) => {
    if (!isSignedIn) return { success: false, error: 'Not signed in' };

    return execute({
      callOptions: {
        network,
        contractAddress: marketplaceContract.address,
        contractName: marketplaceContract.name,
        functionName: 'post-job',
        functionArgs: [
          stringUtf8CV(title),
          stringUtf8CV(description),
          uintCV(budgetMin),
          uintCV(budgetMax),
          uintCV(deadline),
          stringUtf8CV(skills),
        ],
        postConditions: [],
        postConditionMode: PostConditionMode.Allow,
      },
      actionLabel: 'Post Job',
      onBroadcast: () => {
        setTimeout(() => queryClient.invalidateQueries({ queryKey: ['jobs'] }), 2000);
      },
    });
  }, [isSignedIn, network, marketplaceContract, queryClient, execute]);

  const applyToJob = useCallback(async (
    jobId: number,
    coverLetter: string,
    proposedAmount: number,
    proposedTimeline: number
  ) => {
    if (!isSignedIn) return { success: false, error: 'Not signed in' };

    return execute({
      callOptions: {
        network,
        contractAddress: marketplaceContract.address,
        contractName: marketplaceContract.name,
        functionName: 'apply-to-job',
        functionArgs: [
          uintCV(jobId),
          stringUtf8CV(coverLetter),
          uintCV(proposedAmount),
          uintCV(proposedTimeline),
        ],
        postConditions: [],
        postConditionMode: PostConditionMode.Allow,
      },
      actionLabel: 'Apply to Job',
      onBroadcast: () => {
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['job', jobId] });
          queryClient.invalidateQueries({ queryKey: ['jobApplications', jobId] });
        }, 2000);
      },
    });
  }, [isSignedIn, network, marketplaceContract, queryClient, execute]);

  const acceptApplication = useCallback(async (jobId: number, applicant: string) => {
    if (!isSignedIn) return { success: false, error: 'Not signed in' };

    return execute({
      callOptions: {
        network,
        contractAddress: marketplaceContract.address,
        contractName: marketplaceContract.name,
        functionName: 'accept-application',
        functionArgs: [uintCV(jobId), standardPrincipalCV(applicant)],
        postConditions: [],
        postConditionMode: PostConditionMode.Allow,
      },
      actionLabel: 'Accept Application',
      onBroadcast: () => {
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['job', jobId] });
          queryClient.invalidateQueries({ queryKey: ['jobApplications', jobId] });
        }, 2000);
      },
    });
  }, [isSignedIn, network, marketplaceContract, queryClient, execute]);

  const rejectApplication = useCallback(async (jobId: number, applicant: string) => {
    if (!isSignedIn) return { success: false, error: 'Not signed in' };

    return execute({
      callOptions: {
        network,
        contractAddress: marketplaceContract.address,
        contractName: marketplaceContract.name,
        functionName: 'reject-application',
        functionArgs: [uintCV(jobId), standardPrincipalCV(applicant)],
        postConditions: [],
        postConditionMode: PostConditionMode.Allow,
      },
      actionLabel: 'Reject Application',
      onBroadcast: () => {
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['job', jobId] });
          queryClient.invalidateQueries({ queryKey: ['jobApplications', jobId] });
        }, 2000);
      },
    });
  }, [isSignedIn, network, marketplaceContract, queryClient, execute]);

  const linkEscrowToJob = useCallback(async (jobId: number, escrowId: number) => {
    if (!isSignedIn) return { success: false, error: 'Not signed in' };

    return execute({
      callOptions: {
        network,
        contractAddress: marketplaceContract.address,
        contractName: marketplaceContract.name,
        functionName: 'link-escrow-to-job',
        functionArgs: [uintCV(jobId), uintCV(escrowId)],
        postConditions: [],
        postConditionMode: PostConditionMode.Allow,
      },
      actionLabel: 'Link Escrow to Job',
      onBroadcast: () => {
        setTimeout(() => queryClient.invalidateQueries({ queryKey: ['job', jobId] }), 2000);
      },
    });
  }, [isSignedIn, network, marketplaceContract, queryClient, execute]);

  const cancelJob = useCallback(async (jobId: number) => {
    if (!isSignedIn) return { success: false, error: 'Not signed in' };

    return execute({
      callOptions: {
        network,
        contractAddress: marketplaceContract.address,
        contractName: marketplaceContract.name,
        functionName: 'cancel-job',
        functionArgs: [uintCV(jobId)],
        postConditions: [],
        postConditionMode: PostConditionMode.Allow,
      },
      actionLabel: 'Cancel Job',
      onBroadcast: () => {
        setTimeout(() => queryClient.invalidateQueries({ queryKey: ['jobs'] }), 2000);
      },
    });
  }, [isSignedIn, network, marketplaceContract, queryClient, execute]);

  return {
    useJobs,
    useJob,
    useJobApplications,
    useUserApplications,
    postJob,
    applyToJob,
    acceptApplication,
    rejectApplication,
    linkEscrowToJob,
    cancelJob,
  };
}
