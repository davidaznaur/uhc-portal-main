import { useQuery } from '@tanstack/react-query';

import { accountsService } from '~/services';
import type { Subscription } from '~/types/accounts_mgmt.v1';

const FETCH_CLUSTER_DISTRIBUTION_QUERY_KEY = 'fetchClusterDistribution';

export interface ClusterDistribution {
  byCloudProvider: Record<string, number>;
  byVersion: Record<string, number>;
  byRegion: Record<string, number>;
  totalAlerts: number;
  clusterAlerts: Array<{
    clusterId: string;
    displayName: string;
    criticalAlerts: number;
    operatorsConditionFailing: number;
  }>;
}

const fetchClusterDistribution = async (): Promise<ClusterDistribution> => {
  const accountResponse = await accountsService.getCurrentAccount();
  const orgId = accountResponse.data?.organization?.id;

  if (!orgId) {
    throw new Error('No organization ID found for current user');
  }

  // Fetch subscriptions with metrics
  const response = await accountsService.getSubscriptions({
    page: 1,
    page_size: 500,
    filter: `organization_id = '${orgId}' and status NOT IN ('Deprovisioned', 'Archived')`,
  });

  const subscriptions = response.data.items ?? [];

  const byCloudProvider: Record<string, number> = {};
  const byVersion: Record<string, number> = {};
  const byRegion: Record<string, number> = {};
  let totalAlerts = 0;
  const clusterAlerts: ClusterDistribution['clusterAlerts'] = [];

  subscriptions.forEach((sub: Subscription) => {
    const metrics = sub.metrics?.[0];
    if (!metrics) return;

    // Cloud provider distribution
    const provider = metrics.cloud_provider || 'Unknown';
    byCloudProvider[provider] = (byCloudProvider[provider] || 0) + 1;

    // Version distribution (major.minor only)
    const version = metrics.openshift_version || 'Unknown';
    const majorMinor = version.split('.').slice(0, 2).join('.') || 'Unknown';
    byVersion[majorMinor] = (byVersion[majorMinor] || 0) + 1;

    // Region distribution
    const region = metrics.region || 'Unknown';
    byRegion[region] = (byRegion[region] || 0) + 1;

    // Alerts
    const criticalAlerts = metrics.critical_alerts_firing ?? 0;
    const operatorsConditionFailing = metrics.operators_condition_failing ?? 0;
    totalAlerts += criticalAlerts;

    if (criticalAlerts > 0 || operatorsConditionFailing > 0) {
      clusterAlerts.push({
        clusterId: sub.cluster_id ?? '',
        displayName: sub.display_name ?? sub.cluster_id ?? 'Unknown',
        criticalAlerts,
        operatorsConditionFailing,
      });
    }
  });

  // Sort alerts by critical count descending
  clusterAlerts.sort((a, b) => b.criticalAlerts - a.criticalAlerts);

  return {
    byCloudProvider,
    byVersion,
    byRegion,
    totalAlerts,
    clusterAlerts: clusterAlerts.slice(0, 10), // Top 10
  };
};

/**
 * Hook for fetching cluster distribution data (by cloud, version, region)
 */
export const useFetchClusterDistribution = () => {
  const { data, isLoading, isError, error, isFetching, refetch } = useQuery({
    queryKey: [FETCH_CLUSTER_DISTRIBUTION_QUERY_KEY],
    queryFn: fetchClusterDistribution,
    staleTime: 60000,
    refetchInterval: 120000,
  });

  return {
    distribution: data,
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  };
};

export default useFetchClusterDistribution;
