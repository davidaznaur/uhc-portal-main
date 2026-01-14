// Perses Dashboard POC Components
// These components use Perses's EChart wrapper with real API data

export { PersesMetricsPOC } from './ClusterMetricsChart';
export { PersesDashboardPOC } from './PersesDashboard';

// Full Perses Dashboard Implementation
export { PersesDashboardFull } from './PersesDashboardFull';

// Widget Components
export { InsightsAdvisorWidget } from './InsightsAdvisorWidget';
export { CloudProviderDistribution } from './CloudProviderDistribution';
export { UnhealthyClustersTable } from './UnhealthyClustersTable';
export { AlertsSummary } from './AlertsSummary';
export { VersionDistribution } from './VersionDistribution';

// Re-export plugins and dashboards
export { createPluginLoader } from './plugins';
export { clusterOverviewDashboard } from './dashboards';
export { createDatasourceApi } from './datasourceApi';
