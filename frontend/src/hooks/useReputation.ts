'use client';

import { useQuery } from '@tanstack/react-query';
import { getReputationFromBackend, getLeaderboardFromBackend, getReputationHistoryFromBackend } from '@/lib/apiClient';

export function useReputation(address?: string) {
  const { data: reputation, isLoading: reputationLoading } = useQuery({
    queryKey: ['reputation', address],
    queryFn: () => getReputationFromBackend(address!),
    enabled: !!address,
    staleTime: 60_000,
  });

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['reputationHistory', address],
    queryFn: () => getReputationHistoryFromBackend(address!),
    enabled: !!address,
    staleTime: 60_000,
  });

  // Calculate score change from history
  const history = historyData?.history ?? [];
  let scoreChange = 0;
  if (history.length >= 2) {
    scoreChange = history[0].score - history[1].score;
  } else if (history.length === 1 && reputation) {
    scoreChange = reputation.score - 500; // Change from default
  }

  return {
    reputation,
    reputationLoading,
    score: reputation?.score ?? 500,
    history,
    historyLoading,
    scoreChange,
  };
}

export function useLeaderboard(limit = 20, offset = 0) {
  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard', limit, offset],
    queryFn: () => getLeaderboardFromBackend(limit, offset),
    staleTime: 60_000,
  });

  return {
    leaderboard: data?.leaderboard ?? [],
    total: data?.total ?? 0,
    isLoading,
  };
}
