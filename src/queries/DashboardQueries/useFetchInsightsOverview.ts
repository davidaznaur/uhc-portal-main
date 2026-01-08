import { useQuery } from '@tanstack/react-query';

import { insightsService } from '~/services';

const FETCH_INSIGHTS_OVERVIEW_QUERY_KEY = 'fetchInsightsOverview';

export interface InsightsOverview {
  clustersHit: number;
  hitByRisk: {
    critical: number;
    important: number;
    moderate: number;
    low: number;
  };
  hitByTag: Record<string, number>;
}

const fetchInsightsOverview = async (): Promise<InsightsOverview> => {
  const response = await insightsService.getOrganizationInsights();
  const overview = response.data?.overview;

  return {
    clustersHit: overview?.clusters_hit ?? 0,
    hitByRisk: {
      critical: overview?.hit_by_risk?.['4'] ?? 0,
      important: overview?.hit_by_risk?.['3'] ?? 0,
      moderate: overview?.hit_by_risk?.['2'] ?? 0,
      low: overview?.hit_by_risk?.['1'] ?? 0,
    },
    hitByTag: overview?.hit_by_tag ?? {},
  };
};

/**
 * Hook for fetching Insights Advisor overview data
 */
export const useFetchInsightsOverview = () => {
  const { data, isLoading, isError, error, isFetching, refetch } = useQuery({
    queryKey: [FETCH_INSIGHTS_OVERVIEW_QUERY_KEY],
    queryFn: fetchInsightsOverview,
    staleTime: 60000,
    refetchInterval: 120000, // Refresh every 2 minutes
  });

  return {
    insightsOverview: data,
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  };
};

export default useFetchInsightsOverview;
