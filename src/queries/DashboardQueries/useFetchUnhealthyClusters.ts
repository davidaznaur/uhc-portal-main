import { useQuery } from '@tanstack/react-query';

import { accountsService } from '~/services';
import type { Subscription } from '~/types/accounts_mgmt.v1';

const FETCH_UNHEALTHY_CLUSTERS_QUERY_KEY = 'fetchUnhealthyClusters';

export interface UnhealthyCluster {
  id: string;
  clusterId: string;
  displayName: string;
  cloudProvider: string;
  region: string;
  healthState: string;
  openshiftVersion: string;
  criticalAlerts: number;
  operatorsConditionFailing: number;
}

const transformUnhealthyClusters = (subscriptions: Subscription[]): UnhealthyCluster[] => {
  return subscriptions.map((sub) => {
    const metrics = sub.metrics?.[0];
    return {
      id: sub.id ?? '',
      clusterId: sub.cluster_id ?? '',
      displayName: sub.display_name ?? sub.cluster_id ?? 'Unknown',
      cloudProvider: metrics?.cloud_provider ?? 'Unknown',
      region: metrics?.region ?? 'Unknown',
      healthState: metrics?.health_state ?? 'unknown',
      openshiftVersion: metrics?.openshift_version ?? 'Unknown',
      criticalAlerts: metrics?.critical_alerts_firing ?? 0,
      operatorsConditionFailing: metrics?.operators_condition_failing ?? 0,
    };
  });
};

const fetchUnhealthyClusters = async (): Promise<UnhealthyCluster[]> => {
  const accountResponse = await accountsService.getCurrentAccount();
  const orgId = accountResponse.data?.organization?.id;

  if (!orgId) {
    throw new Error('No organization ID found for current user');
  }

  const response = await accountsService.getUnhealthyClusters(orgId, {
    page: 1,
    page_size: 100,
  });

  return transformUnhealthyClusters(response.data.items ?? []);
};

/**
 * Hook for fetching unhealthy clusters from the accounts management API
 */
export const useFetchUnhealthyClusters = () => {
  const { data, isLoading, isError, error, isFetching, refetch } = useQuery({
    queryKey: [FETCH_UNHEALTHY_CLUSTERS_QUERY_KEY],
    queryFn: fetchUnhealthyClusters,
    staleTime: 60000,
    refetchInterval: 60000,
  });

  return {
    unhealthyClusters: data ?? [],
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  };
};

export default useFetchUnhealthyClusters;
