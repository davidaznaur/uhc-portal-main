import React from 'react';
import { Bullseye, Spinner, EmptyState, EmptyStateBody, Button } from '@patternfly/react-core';
import { EChart } from '@perses-dev/components';
import type { EChartsCoreOption } from 'echarts/core';

import { useFetchClusterDistribution } from '~/queries/DashboardQueries';

const PROVIDER_COLORS: Record<string, string> = {
  aws: '#FF9900',
  gcp: '#4285F4',
  azure: '#0089D6',
  Unknown: '#888888',
};

const PROVIDER_LABELS: Record<string, string> = {
  aws: 'AWS',
  gcp: 'GCP',
  azure: 'Azure',
  Unknown: 'Unknown',
};

const createCloudProviderPieOption = (
  byCloudProvider: Record<string, number>,
): EChartsCoreOption => {
  const data = Object.entries(byCloudProvider).map(([provider, count]) => ({
    value: count,
    name: PROVIDER_LABELS[provider] ?? provider,
    itemStyle: {
      color: PROVIDER_COLORS[provider] ?? '#888888',
    },
  }));

  return {
    title: {
      text: 'Clusters by Cloud Provider',
      left: 'center',
      textStyle: { fontSize: 14 },
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      bottom: 0,
      itemWidth: 14,
      itemHeight: 14,
    },
    series: [
      {
        type: 'pie',
        radius: ['35%', '60%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 4,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: '{c}',
          fontSize: 12,
        },
        labelLine: {
          show: true,
        },
        data,
      },
    ],
  };
};

export const CloudProviderDistribution = (): React.ReactElement => {
  const { distribution, isLoading, isError, refetch } = useFetchClusterDistribution();

  if (isLoading) {
    return (
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          height: '300px',
        }}
      >
        <Bullseye style={{ height: '100%' }}>
          <Spinner size="lg" />
        </Bullseye>
      </div>
    );
  }

  if (isError || !distribution) {
    return (
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          height: '300px',
        }}
      >
        <EmptyState titleText="Unable to load data" headingLevel="h3">
          <EmptyStateBody>Cloud provider distribution data is not available.</EmptyStateBody>
          <Button variant="link" onClick={() => refetch()}>
            Retry
          </Button>
        </EmptyState>
      </div>
    );
  }

  const chartOption = createCloudProviderPieOption(distribution.byCloudProvider);
  const totalClusters = Object.values(distribution.byCloudProvider).reduce(
    (sum, count) => sum + count,
    0,
  );

  return (
    <div
      style={{
        backgroundColor: '#fff',
        borderRadius: '8px',
        padding: '16px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <EChart option={chartOption} style={{ height: '250px' }} />
      <div
        style={{
          textAlign: 'center',
          marginTop: '8px',
          fontSize: '12px',
          color: '#666',
        }}
      >
        Total clusters: {totalClusters}
      </div>
    </div>
  );
};

export default CloudProviderDistribution;
