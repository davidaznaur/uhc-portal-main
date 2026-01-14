import React, { useEffect, useState } from 'react';
import type { PanelPlugin, PanelProps } from '@perses-dev/plugin-system';
import { useDatasourceStore } from '@perses-dev/plugin-system';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import type { AMSClient } from '../ams-datasource';

/**
 * Stat Panel Data format
 */
export interface StatData {
  value: number;
  label?: string;
  unit?: string;
  previousValue?: number;
  trend?: 'up' | 'down' | 'stable';
}

/**
 * Available stat metrics
 */
export type StatMetricType =
  | 'total_clusters'
  | 'connected_clusters'
  | 'unhealthy_clusters'
  | 'total_cpu'
  | 'used_cpu'
  | 'total_memory'
  | 'used_memory'
  | 'clusters_up_to_date'
  | 'clusters_upgrade_available'
  | 'total_alerts';

/**
 * Specification for the Stat panel
 */
export interface StatPanelSpec {
  title?: string;
  unit?: string;
  decimals?: number;
  colorMode?: 'value' | 'background' | 'none';
  thresholds?: {
    warning?: number;
    critical?: number;
  };
  showTrend?: boolean;
  fontSize?: 'small' | 'medium' | 'large';
  /** Metric to display */
  metric?: StatMetricType;
}

/**
 * Props for the Stat panel component
 */
export type StatPanelProps = PanelProps<StatPanelSpec, StatData>;

/**
 * Get color based on value and thresholds
 */
const getValueColor = (
  value: number,
  thresholds?: { warning?: number; critical?: number },
): string => {
  if (!thresholds) return '#333';

  if (thresholds.critical !== undefined && value >= thresholds.critical) {
    return '#c9190b'; // Red
  }
  if (thresholds.warning !== undefined && value >= thresholds.warning) {
    return '#f0ab00'; // Yellow/Orange
  }
  return '#3e8635'; // Green
};

/**
 * Format value with proper decimals and unit
 */
const formatValue = (value: number, decimals?: number, unit?: string): string => {
  const formatted = decimals !== undefined ? value.toFixed(decimals) : value.toLocaleString();

  return unit ? `${formatted} ${unit}` : formatted;
};

/**
 * Get trend icon and color
 */
const getTrendDisplay = (trend?: 'up' | 'down' | 'stable'): { icon: string; color: string } => {
  switch (trend) {
    case 'up':
      return { icon: '↑', color: '#3e8635' };
    case 'down':
      return { icon: '↓', color: '#c9190b' };
    case 'stable':
      return { icon: '→', color: '#6a6e73' };
    default:
      return { icon: '', color: 'transparent' };
  }
};

/**
 * Get font size based on spec
 */
const getFontSize = (size?: 'small' | 'medium' | 'large'): string => {
  switch (size) {
    case 'small':
      return '24px';
    case 'large':
      return '48px';
    default:
      return '36px';
  }
};

/**
 * Convert bytes to gigabytes
 */
const bytesToGB = (bytes: number): number => Math.round((bytes / (1024 * 1024 * 1024)) * 10) / 10;

/**
 * Get default label for a metric
 */
const getDefaultLabel = (metric: StatMetricType): string => {
  const labels: Record<StatMetricType, string> = {
    total_clusters: 'Total Clusters',
    connected_clusters: 'Connected',
    unhealthy_clusters: 'Unhealthy',
    total_cpu: 'Total CPU',
    used_cpu: 'CPU Used',
    total_memory: 'Total Memory',
    used_memory: 'Memory Used',
    clusters_up_to_date: 'Up to Date',
    clusters_upgrade_available: 'Upgrades Available',
    total_alerts: 'Critical Alerts',
  };
  return labels[metric] ?? metric;
};

/**
 * Get unit for a metric
 */
const getMetricUnit = (metric: StatMetricType): string | undefined => {
  if (metric.includes('cpu')) return 'cores';
  if (metric.includes('memory')) return 'GB';
  return undefined;
};

/**
 * Stat Panel Component
 *
 * Renders a single statistic value with optional trend indicator
 */
export const StatPanelComponent: React.FC<StatPanelProps> = ({ spec, contentDimensions }) => {
  const datasourceStore = useDatasourceStore();
  const [data, setData] = useState<StatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const client = await datasourceStore.getDatasourceClient<AMSClient>({
          kind: 'AMSDatasource',
        });

        const metric = spec.metric ?? 'total_clusters';
        const dashboardMetrics = await client.fetchDashboardMetrics();

        let value: number;

        switch (metric) {
          case 'total_clusters':
            value = dashboardMetrics.clustersTotal;
            break;
          case 'connected_clusters':
            value = dashboardMetrics.connectedClustersTotal;
            break;
          case 'unhealthy_clusters':
            value = dashboardMetrics.unhealthyClustersTotal;
            break;
          case 'total_cpu':
            value = Math.round(dashboardMetrics.totalCPU.value);
            break;
          case 'used_cpu':
            value = Math.round(dashboardMetrics.usedCPU.value);
            break;
          case 'total_memory':
            value = bytesToGB(dashboardMetrics.totalMemory.value);
            break;
          case 'used_memory':
            value = bytesToGB(dashboardMetrics.usedMemory.value);
            break;
          case 'clusters_up_to_date':
            value = dashboardMetrics.clustersUpToDate;
            break;
          case 'clusters_upgrade_available':
            value = dashboardMetrics.clustersUpgradeAvailable;
            break;
          case 'total_alerts': {
            const distribution = await client.fetchClusterDistribution();
            value = distribution.totalAlerts;
            break;
          }
          default:
            value = 0;
        }

        setData({
          value,
          label: spec.title ?? getDefaultLabel(metric),
          unit: spec.unit ?? getMetricUnit(metric),
        });
        setError(null);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[StatPanel] Error fetching data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [datasourceStore, spec.metric, spec.title, spec.unit]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: contentDimensions?.height ?? 100,
          color: '#666',
        }}
      >
        Loading...
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: contentDimensions?.height ?? 100,
          color: '#c9190b',
        }}
      >
        {error ?? 'No data available'}
      </Box>
    );
  }

  const valueColor = getValueColor(data.value, spec.thresholds);
  const trendDisplay = getTrendDisplay(data.trend);
  const unit = spec.unit ?? data.unit;
  const formattedValue = formatValue(data.value, spec.decimals, unit);
  const fontSize = getFontSize(spec.fontSize);

  const backgroundColor = spec.colorMode === 'background' ? `${valueColor}15` : 'transparent';
  const textColor = spec.colorMode !== 'none' ? valueColor : '#333';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: contentDimensions?.height ?? 100,
        width: contentDimensions?.width ?? '100%',
        backgroundColor,
        borderRadius: 1,
        padding: 2,
      }}
    >
      {spec.title && (
        <Typography
          variant="subtitle2"
          sx={{
            color: '#666',
            marginBottom: 0.5,
            textAlign: 'center',
          }}
        >
          {spec.title}
        </Typography>
      )}

      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
        <Typography
          sx={{
            fontSize,
            fontWeight: 'bold',
            color: textColor,
            lineHeight: 1,
          }}
        >
          {formattedValue}
        </Typography>

        {spec.showTrend && data.trend && (
          <Typography
            sx={{
              fontSize: '24px',
              color: trendDisplay.color,
              fontWeight: 'bold',
            }}
          >
            {trendDisplay.icon}
          </Typography>
        )}
      </Box>

      {data.label && (
        <Typography
          variant="caption"
          sx={{
            color: '#888',
            marginTop: 0.5,
            textAlign: 'center',
          }}
        >
          {data.label}
        </Typography>
      )}
    </Box>
  );
};

/**
 * Stat Panel Plugin definition
 */
export const StatPanel: PanelPlugin<StatPanelSpec, unknown> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  PanelComponent: StatPanelComponent as any,
  supportedQueryTypes: [], // Data is fetched directly from datasource
  createInitialOptions: () => ({
    colorMode: 'value',
    showTrend: false,
    fontSize: 'medium',
    metric: 'total_clusters',
  }),
};

export default StatPanel;
