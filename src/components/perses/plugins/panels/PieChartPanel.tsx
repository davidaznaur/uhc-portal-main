import React, { useEffect, useState } from 'react';
import type { PanelPlugin, PanelProps } from '@perses-dev/plugin-system';
import { useDatasourceStore } from '@perses-dev/plugin-system';
import { EChart, useChartsTheme } from '@perses-dev/components';
import type { EChartsOption } from 'echarts';

import type { AMSClient, ClusterDistributionData, AMSDashboardMetrics } from '../ams-datasource';

/**
 * Pie Chart Data format for the panel
 */
export interface PieChartData {
  items: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
  total?: number;
}

/**
 * Available data types for pie chart
 */
export type PieChartDataType = 'cloud_provider' | 'status_distribution';

/**
 * Specification for the PieChart panel
 */
export interface PieChartPanelSpec {
  title?: string;
  donut?: boolean;
  showLegend?: boolean;
  showLabels?: boolean;
  labelFormat?: 'name' | 'value' | 'percent' | 'all';
  roseType?: boolean;
  /** Data type to fetch */
  dataType?: PieChartDataType;
  /** Max items to display */
  maxItems?: number;
}

/**
 * Props for the PieChart panel component
 */
export type PieChartPanelProps = PanelProps<PieChartPanelSpec, PieChartData>;

/**
 * Cloud provider color mapping
 */
const CLOUD_PROVIDER_COLORS: Record<string, string> = {
  aws: '#ff9900',
  AWS: '#ff9900',
  gcp: '#4285f4',
  GCP: '#4285f4',
  azure: '#0078d4',
  Azure: '#0078d4',
  ibm: '#1f70c1',
  IBM: '#1f70c1',
  baremetal: '#6a6e73',
  BareMetal: '#6a6e73',
  Unknown: '#8a8d90',
};

/**
 * PieChart Panel Component
 *
 * Renders a pie or donut chart visualization
 */
export const PieChartPanelComponent: React.FC<PieChartPanelProps> = ({
  spec,
  contentDimensions,
}) => {
  const chartsTheme = useChartsTheme();
  const colors = chartsTheme.echartsTheme.color as string[];
  const datasourceStore = useDatasourceStore();

  const [data, setData] = useState<PieChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const client = await datasourceStore.getDatasourceClient<AMSClient>({
          kind: 'AMSDatasource',
        });

        const dataType = spec.dataType ?? 'cloud_provider';
        const maxItems = spec.maxItems ?? 5;

        let result: PieChartData;

        switch (dataType) {
          case 'cloud_provider': {
            const distribution: ClusterDistributionData = await client.fetchClusterDistribution();
            const entries = Object.entries(distribution.byCloudProvider);
            entries.sort((a, b) => b[1] - a[1]);

            const topItems = entries.slice(0, maxItems);
            const otherItems = entries.slice(maxItems);
            const otherTotal = otherItems.reduce((sum, [, count]) => sum + count, 0);

            const items = topItems.map(([name, value]) => ({
              name: name.toUpperCase(),
              value,
              color: CLOUD_PROVIDER_COLORS[name] ?? '#8a8d90',
            }));

            if (otherTotal > 0) {
              items.push({
                name: 'Other',
                value: otherTotal,
                color: '#8a8d90',
              });
            }

            const total = entries.reduce((sum, [, count]) => sum + count, 0);
            result = { items, total };
            break;
          }
          case 'status_distribution': {
            const dashboardMetrics: AMSDashboardMetrics = await client.fetchDashboardMetrics();
            const healthy =
              dashboardMetrics.clustersTotal - dashboardMetrics.unhealthyClustersTotal;
            const unhealthy = dashboardMetrics.unhealthyClustersTotal;

            result = {
              items: [
                { name: 'Healthy', value: healthy, color: '#3e8635' },
                { name: 'Unhealthy', value: unhealthy, color: '#c9190b' },
              ],
              total: dashboardMetrics.clustersTotal,
            };
            break;
          }
          default:
            result = { items: [] };
        }

        setData(result);
        setError(null);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[PieChartPanel] Error fetching data:', err);
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

  if (!data || data.items.length === 0) {
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

  const isDonut = spec.donut ?? false;
  const showLegend = spec.showLegend ?? true;
  const showLabels = spec.showLabels ?? true;
  const labelFormat = spec.labelFormat ?? 'percent';

  const getLabelFormatter = (): string => {
    switch (labelFormat) {
      case 'name':
        return '{b}';
      case 'value':
        return '{c}';
      case 'percent':
        return '{d}%';
      case 'all':
        return '{b}: {c} ({d}%)';
      default:
        return '{d}%';
    }
  };

  const option: EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
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
    ...(showLegend && {
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'middle',
        type: 'scroll',
      },
    }),
    series: [
      {
        type: 'pie',
        radius: isDonut ? ['40%', '70%'] : '70%',
        center: showLegend ? ['60%', '50%'] : ['50%', '50%'],
        roseType: spec.roseType ? 'radius' : undefined,
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: isDonut ? 8 : 0,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: showLabels
          ? {
              show: true,
              formatter: getLabelFormatter(),
            }
          : {
              show: false,
            },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
        labelLine: {
          show: showLabels,
        },
        data: data.items.map((item, index) => ({
          name: item.name,
          value: item.value,
          itemStyle: {
            color: item.color ?? colors[index % colors.length],
          },
        })),
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
 * PieChart Panel Plugin definition
 */
export const PieChartPanel: PanelPlugin<PieChartPanelSpec, unknown> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  PanelComponent: PieChartPanelComponent as any,
  supportedQueryTypes: [], // Data is fetched directly from datasource
  createInitialOptions: () => ({
    donut: true,
    showLegend: true,
    showLabels: true,
    labelFormat: 'percent',
    dataType: 'cloud_provider',
    maxItems: 5,
  }),
};

export default PieChartPanel;
