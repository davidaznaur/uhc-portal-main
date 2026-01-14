import type { TimeSeriesQueryPlugin } from '@perses-dev/plugin-system';
import type { TimeSeriesData, TimeSeries } from '@perses-dev/core';

import type { AMSClient, AMSDashboardMetrics } from '../ams-datasource';

/**
 * Available metrics that can be queried
 */
export type AMSMetricType =
  | 'cpu_usage'
  | 'cpu_total'
  | 'memory_usage'
  | 'memory_total'
  | 'clusters_total'
  | 'clusters_connected'
  | 'clusters_unhealthy'
  | 'clusters_up_to_date'
  | 'clusters_upgrade_available';

/**
 * Specification for AMS Time Series Query
 */
export interface AMSTimeSeriesQuerySpec {
  /** The metric to query */
  metric: AMSMetricType;
  /** Optional legend label override */
  legendLabel?: string;
}

/**
 * Extract the metric value from dashboard metrics
 */
const getMetricValue = (metrics: AMSDashboardMetrics, metric: AMSMetricType): number => {
  switch (metric) {
    case 'cpu_usage':
      return metrics.usedCPU.value;
    case 'cpu_total':
      return metrics.totalCPU.value;
    case 'memory_usage':
      // Convert bytes to GB for display
      return metrics.usedMemory.value / (1024 * 1024 * 1024);
    case 'memory_total':
      return metrics.totalMemory.value / (1024 * 1024 * 1024);
    case 'clusters_total':
      return metrics.clustersTotal;
    case 'clusters_connected':
      return metrics.connectedClustersTotal;
    case 'clusters_unhealthy':
      return metrics.unhealthyClustersTotal;
    case 'clusters_up_to_date':
      return metrics.clustersUpToDate;
    case 'clusters_upgrade_available':
      return metrics.clustersUpgradeAvailable;
    default:
      return 0;
  }
};

/**
 * Get default legend label for a metric
 */
const getDefaultLegendLabel = (metric: AMSMetricType): string => {
  const labels: Record<AMSMetricType, string> = {
    cpu_usage: 'CPU Usage',
    cpu_total: 'Total CPU',
    memory_usage: 'Memory Usage',
    memory_total: 'Total Memory',
    clusters_total: 'Total Clusters',
    clusters_connected: 'Connected Clusters',
    clusters_unhealthy: 'Unhealthy Clusters',
    clusters_up_to_date: 'Up to Date',
    clusters_upgrade_available: 'Upgrades Available',
  };
  return labels[metric] ?? metric;
};

/**
 * Generate simulated time series data points
 * Since AMS provides point-in-time metrics, we simulate historical data
 * with slight variations for visualization purposes
 */
const generateTimeSeriesPoints = (
  currentValue: number,
  timeRange: { start: Date; end: Date },
  pointCount: number = 24,
): Array<[number, number]> => {
  const points: Array<[number, number]> = [];
  const startTime = timeRange.start.getTime();
  const endTime = timeRange.end.getTime();
  const interval = (endTime - startTime) / (pointCount - 1);

  // Generate points with slight random variation (±5%)
  for (let i = 0; i < pointCount; i++) {
    const timestamp = startTime + interval * i;
    // Add slight variation to make the chart more interesting
    const variation = 1 + (Math.random() - 0.5) * 0.1;
    const value = currentValue * variation;
    points.push([timestamp, Math.max(0, value)]);
  }

  return points;
};

/**
 * AMS Time Series Query Plugin for Perses
 *
 * This plugin fetches metrics from AMS and transforms them into
 * time series data format expected by Perses charts.
 */
export const AMSTimeSeriesQueryPlugin: TimeSeriesQueryPlugin<AMSTimeSeriesQuerySpec> = {
  getTimeSeriesData: async (spec, ctx): Promise<TimeSeriesData> => {
    try {
      // eslint-disable-next-line no-console
      console.log('[AMSTimeSeriesQuery] Fetching data for metric:', spec.metric);
      // eslint-disable-next-line no-console
      console.log('[AMSTimeSeriesQuery] Time range:', ctx.timeRange);
      // eslint-disable-next-line no-console
      console.log('[AMSTimeSeriesQuery] Suggested step:', ctx.suggestedStepMs);

      // Get the AMS client from the datasource store
      const client = await ctx.datasourceStore.getDatasourceClient<AMSClient>({
        kind: 'AMSDatasource',
      });

      // Fetch current metrics
      const metrics = await client.fetchDashboardMetrics();

      // eslint-disable-next-line no-console
      console.log('[AMSTimeSeriesQuery] Fetched metrics:', metrics);

      // Extract the specific metric value
      const metricValue = getMetricValue(metrics, spec.metric);

      // eslint-disable-next-line no-console
      console.log('[AMSTimeSeriesQuery] Metric value for', spec.metric, ':', metricValue);

      // Calculate step for time series points
      const timeRangeMs = ctx.timeRange.end.getTime() - ctx.timeRange.start.getTime();
      // Use suggestedStepMs if available, otherwise calculate based on desired point count (24 points)
      const calculatedStepMs = ctx.suggestedStepMs ?? Math.floor(timeRangeMs / 24);
      // Ensure stepMs is at least 1000ms (1 second)
      const stepMs = Math.max(calculatedStepMs, 1000);

      // eslint-disable-next-line no-console
      console.log('[AMSTimeSeriesQuery] stepMs calculation:', {
        suggestedStepMs: ctx.suggestedStepMs,
        calculatedStepMs,
        finalStepMs: stepMs,
      });

      // Generate time series points
      const pointCount = Math.ceil(timeRangeMs / stepMs);
      const timeSeriesPoints = generateTimeSeriesPoints(
        metricValue,
        {
          start: ctx.timeRange.start,
          end: ctx.timeRange.end,
        },
        Math.max(pointCount, 2),
      ); // Ensure at least 2 points

      // Create the time series
      const series: TimeSeries[] = [
        {
          name: spec.legendLabel ?? getDefaultLegendLabel(spec.metric),
          values: timeSeriesPoints,
          formattedName: spec.legendLabel ?? getDefaultLegendLabel(spec.metric),
        },
      ];

      // eslint-disable-next-line no-console
      console.log('[AMSTimeSeriesQuery] Generated series:', series);

      const result: TimeSeriesData = {
        timeRange: ctx.timeRange,
        stepMs: stepMs, // Use our calculated stepMs, NOT ctx.suggestedStepMs which can be undefined
        series,
      };

      // eslint-disable-next-line no-console
      console.log('[AMSTimeSeriesQuery] Returning TimeSeriesData:', result);

      return result;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[AMSTimeSeriesQuery] Error fetching data:', error);

      // Return empty data on error
      return {
        timeRange: ctx.timeRange,
        stepMs: ctx.suggestedStepMs ?? 60000, // Default to 1 minute
        series: [],
      };
    }
  },

  createInitialOptions: () => ({
    metric: 'cpu_usage',
  }),
};

export default AMSTimeSeriesQueryPlugin;
