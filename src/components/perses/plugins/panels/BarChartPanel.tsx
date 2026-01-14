import React, { useEffect, useState } from 'react';
import type { PanelPlugin, PanelProps } from '@perses-dev/plugin-system';
import { useDatasourceStore } from '@perses-dev/plugin-system';
import { EChart, useChartsTheme } from '@perses-dev/components';
import type { EChartsOption } from 'echarts';

import type { AMSClient, ClusterDistributionData } from '../ams-datasource';

/**
 * Bar Chart Data format for the panel
 */
export interface BarChartData {
  categories: string[];
  values: number[];
  colors?: string[];
}

/**
 * Available data types for bar chart
 */
export type BarChartDataType = 'version_distribution' | 'region_distribution' | 'cluster_alerts';

/**
 * Specification for the BarChart panel
 */
export interface BarChartPanelSpec {
  title?: string;
  horizontal?: boolean;
  showLabels?: boolean;
  barWidth?: number;
  colorScheme?: 'default' | 'gradient';
  /** Data type to fetch */
  dataType?: BarChartDataType;
  /** Max items to display */
  maxItems?: number;
}

/**
 * Props for the BarChart panel component
 */
export type BarChartPanelProps = PanelProps<BarChartPanelSpec, BarChartData>;

/**
 * Version distribution color palette
 */
const VERSION_COLORS = ['#3e8635', '#0066cc', '#6a6e73', '#f0ab00', '#c9190b'];

/**
 * Process distribution data
 */
const processDistributionData = (
  data: Record<string, number>,
  maxItems: number = 10,
): { categories: string[]; values: number[] } => {
  const entries = Object.entries(data);
  entries.sort((a, b) => b[1] - a[1]);
  const limited = entries.slice(0, maxItems);
  return {
    categories: limited.map(([name]) => name),
    values: limited.map(([, value]) => value),
  };
};

/**
 * BarChart Panel Component
 *
 * Renders a bar chart visualization for categorical data
 */
export const BarChartPanelComponent: React.FC<BarChartPanelProps> = ({
  spec,
  contentDimensions,
}) => {
  const chartsTheme = useChartsTheme();
  const colors = chartsTheme.echartsTheme.color as string[];
  const datasourceStore = useDatasourceStore();

  const [data, setData] = useState<BarChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const client = await datasourceStore.getDatasourceClient<AMSClient>({
          kind: 'AMSDatasource',
        });

        const distribution: ClusterDistributionData = await client.fetchClusterDistribution();
        const dataType = spec.dataType ?? 'version_distribution';
        const maxItems = spec.maxItems ?? 10;

        let result: BarChartData;

        switch (dataType) {
          case 'version_distribution': {
            const processed = processDistributionData(distribution.byVersion, maxItems);
            result = {
              categories: processed.categories,
              values: processed.values,
              colors: processed.categories.map((_, i) => VERSION_COLORS[i % VERSION_COLORS.length]),
            };
            break;
          }
          case 'region_distribution': {
            const processed = processDistributionData(distribution.byRegion, maxItems);
            result = {
              categories: processed.categories,
              values: processed.values,
            };
            break;
          }
          case 'cluster_alerts': {
            const alerts = distribution.clusterAlerts.slice(0, maxItems);
            result = {
              categories: alerts.map((a) => a.displayName),
              values: alerts.map((a) => a.criticalAlerts),
              colors: alerts.map(() => '#c9190b'),
            };
            break;
          }
          default:
            result = { categories: [], values: [] };
        }

        setData(result);
        setError(null);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[BarChartPanel] Error fetching data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [datasourceStore, spec.dataType, spec.maxItems]);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: contentDimensions?.height ?? 200,
          color: '#666',
        }}
      >
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: contentDimensions?.height ?? 200,
          color: '#c9190b',
        }}
      >
        {error}
      </div>
    );
  }

  if (!data || data.categories.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: contentDimensions?.height ?? 200,
          color: '#666',
        }}
      >
        No data available
      </div>
    );
  }

  const isHorizontal = spec.horizontal ?? false;
  const showLabels = spec.showLabels ?? true;

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    grid: {
      left: isHorizontal ? '20%' : '10%',
      right: '10%',
      bottom: isHorizontal ? '10%' : '25%',
      top: spec.title ? '15%' : '10%',
      containLabel: true,
    },
    ...(spec.title && {
      title: {
        text: spec.title,
        left: 'center',
        textStyle: {
          fontSize: 14,
          fontWeight: 'bold',
        },
      },
    }),
    xAxis: isHorizontal
      ? {
          type: 'value',
          axisLabel: {
            formatter: '{value}',
          },
        }
      : {
          type: 'category',
          data: data.categories,
          axisLabel: {
            rotate: data.categories.length > 5 ? 45 : 0,
            interval: 0,
          },
        },
    yAxis: isHorizontal
      ? {
          type: 'category',
          data: data.categories,
        }
      : {
          type: 'value',
        },
    series: [
      {
        type: 'bar',
        data: data.values.map((value, index) => ({
          value,
          itemStyle: {
            color: data.colors?.[index] ?? colors[index % colors.length],
          },
        })),
        barWidth: spec.barWidth ?? '60%',
        label: showLabels
          ? {
              show: true,
              position: isHorizontal ? 'right' : 'top',
              formatter: '{c}',
            }
          : undefined,
      },
    ],
  };

  return (
    <EChart
      sx={{
        width: contentDimensions?.width ?? '100%',
        height: contentDimensions?.height ?? 200,
      }}
      option={option}
    />
  );
};

/**
 * BarChart Panel Plugin definition
 */
export const BarChartPanel: PanelPlugin<BarChartPanelSpec, unknown> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  PanelComponent: BarChartPanelComponent as any,
  supportedQueryTypes: [], // Data is fetched directly from datasource
  createInitialOptions: () => ({
    horizontal: false,
    showLabels: true,
    barWidth: 60,
    dataType: 'version_distribution',
    maxItems: 10,
  }),
};

export default BarChartPanel;
