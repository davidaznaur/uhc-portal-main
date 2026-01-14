import type { DatasourcePlugin } from '@perses-dev/plugin-system';

import { accountManager, accountsService } from '~/services';
import type { SummaryVector, Subscription } from '~/types/accounts_mgmt.v1';

/**
 * Specification for the AMS Datasource
 */
export interface AMSDatasourceSpec {
  // No additional configuration needed - uses authenticated user's context
}

/**
 * Raw metrics response from AMS summary_dashboard endpoint
 */
export interface RawAMSMetrics {
  clusters_total?: number;
  connected_clusters_total?: number;
  unhealthy_clusters_total?: number;
  total_cpu?: SummaryVector;
  used_cpu?: SummaryVector;
  total_memory?: SummaryVector;
  used_memory?: SummaryVector;
  clusters_up_to_date?: number;
  clusters_upgrade_available?: number;
}

/**
 * Parsed dashboard metrics from AMS
 */
export interface AMSDashboardMetrics {
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

/**
 * Cluster distribution data for visualizations
 */
export interface ClusterDistributionData {
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

/**
 * Client interface for interacting with AMS API
 */
export interface AMSClient {
  kind: 'AMSDatasource';
  /**
   * Fetch dashboard metrics for the current organization
   */
  fetchDashboardMetrics: () => Promise<AMSDashboardMetrics>;
  /**
   * Fetch raw metrics from AMS API
   */
  fetchRawMetrics: () => Promise<RawAMSMetrics>;
  /**
   * Fetch cluster distribution data
   */
  fetchClusterDistribution: () => Promise<ClusterDistributionData>;
  /**
   * Get the current organization ID
   */
  getOrganizationId: () => Promise<string>;
  /**
   * Health check for the datasource
   */
  healthCheck: () => Promise<boolean>;
}

/**
 * Parse a metric with optional unit from SummaryVector
 */
const parseMetricWithUnit = (metric?: SummaryVector): { value: number; unit?: string } => {
  if (!metric) {
    return { value: 0 };
  }
  return {
    value: metric.value ?? 0,
    // SummaryVector doesn't have a unit field in the API schema
  };
};

/**
 * Transform raw AMS metrics to our dashboard format
 */
const transformMetrics = (raw: RawAMSMetrics): AMSDashboardMetrics => {
  return {
    clustersTotal: raw.clusters_total ?? 0,
    connectedClustersTotal: raw.connected_clusters_total ?? 0,
    unhealthyClustersTotal: raw.unhealthy_clusters_total ?? 0,
    totalCPU: parseMetricWithUnit(raw.total_cpu),
    usedCPU: parseMetricWithUnit(raw.used_cpu),
    totalMemory: parseMetricWithUnit(raw.total_memory),
    usedMemory: parseMetricWithUnit(raw.used_memory),
    clustersUpToDate: raw.clusters_up_to_date ?? 0,
    clustersUpgradeAvailable: raw.clusters_upgrade_available ?? 0,
  };
};

/**
 * Create an AMS client instance
 */
const createAMSClient = (): AMSClient => {
  // Cache for organization ID
  let cachedOrgId: string | null = null;

  const getOrganizationId = async (): Promise<string> => {
    if (cachedOrgId) {
      return cachedOrgId;
    }

    const accountResponse = await accountsService.getCurrentAccount();
    const orgId = accountResponse.data?.organization?.id;

    if (!orgId) {
      throw new Error('No organization ID found for current user');
    }

    cachedOrgId = orgId;
    return orgId;
  };

  const fetchRawMetrics = async (): Promise<RawAMSMetrics> => {
    const orgId = await getOrganizationId();
    // eslint-disable-next-line no-console
    console.log('[AMSDatasource] Fetching metrics for org:', orgId);

    const response = await accountManager.getDashboard(orgId);
    // eslint-disable-next-line no-console
    console.log('[AMSDatasource] Raw response:', response.data);
    return response.data as RawAMSMetrics;
  };

  const fetchDashboardMetrics = async (): Promise<AMSDashboardMetrics> => {
    const rawMetrics = await fetchRawMetrics();
    const metrics = transformMetrics(rawMetrics);
    // eslint-disable-next-line no-console
    console.log('[AMSDatasource] Transformed metrics:', metrics);
    return metrics;
  };

  const fetchClusterDistribution = async (): Promise<ClusterDistributionData> => {
    const orgId = await getOrganizationId();
    // eslint-disable-next-line no-console
    console.log('[AMSDatasource] Fetching cluster distribution for org:', orgId);

    // Fetch subscriptions with metrics
    const response = await accountsService.getSubscriptions({
      page: 1,
      page_size: 500,
      filter: `organization_id = '${orgId}' and status NOT IN ('Deprovisioned', 'Archived')`,
    });

    const subscriptions = response.data.items ?? [];
    // eslint-disable-next-line no-console
    console.log('[AMSDatasource] Got', subscriptions.length, 'subscriptions');

    const byCloudProvider: Record<string, number> = {};
    const byVersion: Record<string, number> = {};
    const byRegion: Record<string, number> = {};
    let totalAlerts = 0;
    const clusterAlerts: ClusterDistributionData['clusterAlerts'] = [];

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

    const result: ClusterDistributionData = {
      byCloudProvider,
      byVersion,
      byRegion,
      totalAlerts,
      clusterAlerts: clusterAlerts.slice(0, 10), // Top 10
    };

    // eslint-disable-next-line no-console
    console.log('[AMSDatasource] Cluster distribution:', result);
    return result;
  };

  const healthCheck = async (): Promise<boolean> => {
    try {
      await getOrganizationId();
      return true;
    } catch {
      return false;
    }
  };

  return {
    kind: 'AMSDatasource',
    fetchDashboardMetrics,
    fetchRawMetrics,
    fetchClusterDistribution,
    getOrganizationId,
    healthCheck,
  };
};

/**
 * AMS Datasource Plugin for Perses
 *
 * This plugin connects to the Account Management Service (AMS) API
 * to fetch cluster metrics and statistics for the authenticated user's organization.
 */
export const AMSDatasourcePlugin: DatasourcePlugin<AMSDatasourceSpec, AMSClient> = {
  createClient: () => createAMSClient(),
  createInitialOptions: () => ({}),
};

export default AMSDatasourcePlugin;
