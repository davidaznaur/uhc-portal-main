import { useQuery } from '@tanstack/react-query';

import { accountManager, accountsService } from '~/services';
import type { SummaryVector } from '~/types/accounts_mgmt.v1';

const FETCH_DASHBOARD_METRICS_QUERY_KEY = 'fetchDashboardMetrics';

export interface DashboardMetrics {
  clustersTotal: number;
  connectedClustersTotal: number;
  unhealthyClustersTotal: number;
  totalCPU: { value: number; unit?: string };
  usedCPU: { value: number; unit?: string };
  totalMemory: { value: number; unit?: string };
  usedMemory: { value: number; unit?: string };
  clustersUpToDate: number;
  clustersUpgradeAvailable: number;
}

interface RawMetrics {
  [name: string]: SummaryVector[];
}

const parseMetricValue = (
  metrics: RawMetrics,
  metricName: string,
  defaultValue: number = 0,
): number => {
  const metric = metrics[metricName]?.[0];
  return metric?.value ?? defaultValue;
};

const parseMetricWithUnit = (
  metrics: RawMetrics,
  metricName: string,
  defaultValue: number = 0,
): { value: number; unit?: string } => {
  const metric = metrics[metricName]?.[0];
  return {
    value: metric?.value ?? defaultValue,
    // Note: SummaryVector doesn't include unit in the API schema
  };
};

const transformMetrics = (rawMetrics: RawMetrics): DashboardMetrics => ({
  clustersTotal: parseMetricValue(rawMetrics, 'clusters_total'),
  connectedClustersTotal: parseMetricValue(rawMetrics, 'connected_clusters_total'),
  unhealthyClustersTotal: parseMetricValue(rawMetrics, 'unhealthy_clusters_total'),
  totalCPU: parseMetricWithUnit(rawMetrics, 'sum_total_cpu'),
  usedCPU: parseMetricWithUnit(rawMetrics, 'sum_used_cpu'),
  totalMemory: parseMetricWithUnit(rawMetrics, 'sum_total_memory'),
  usedMemory: parseMetricWithUnit(rawMetrics, 'sum_used_memory'),
  clustersUpToDate: parseMetricValue(rawMetrics, 'clusters_up_to_date_total'),
  clustersUpgradeAvailable: parseMetricValue(rawMetrics, 'clusters_upgrade_available_total'),
});

const fetchDashboardMetrics = async (): Promise<DashboardMetrics> => {
  const accountResponse = await accountsService.getCurrentAccount();
  const orgId = accountResponse.data?.organization?.id;

  if (!orgId) {
    throw new Error('No organization ID found for current user');
  }

  const dashboardResponse = await accountManager.getDashboard(orgId);
  const rawMetrics: RawMetrics = {};

  dashboardResponse.data.metrics?.forEach((metric) => {
    if (metric.name) {
      rawMetrics[metric.name] = metric.vector ?? [];
    }
  });

  return transformMetrics(rawMetrics);
};

/**
 * Hook for fetching dashboard metrics from the accounts management API
 * Returns aggregated CPU, memory, and cluster statistics
 */
export const useFetchDashboardMetrics = () => {
  const { data, isLoading, isError, error, isFetching, refetch } = useQuery({
    queryKey: [FETCH_DASHBOARD_METRICS_QUERY_KEY],
    queryFn: fetchDashboardMetrics,
    staleTime: 60000, // 1 minute
    refetchInterval: 60000, // Auto-refresh every minute
  });

  return {
    metrics: data,
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  };
};

export default useFetchDashboardMetrics;
