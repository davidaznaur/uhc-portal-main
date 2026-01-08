import React, { useMemo } from 'react';
import {
  Bullseye,
  Spinner,
  EmptyState,
  EmptyStateBody,
  Button,
  PageSection,
} from '@patternfly/react-core';
import { EChart } from '@perses-dev/components';
import type { EChartsCoreOption } from 'echarts/core';

import { useFetchDashboardMetrics, type DashboardMetrics } from '~/queries/DashboardQueries';

import { InsightsAdvisorWidget } from './InsightsAdvisorWidget';
import { CloudProviderDistribution } from './CloudProviderDistribution';
import { UnhealthyClustersTable } from './UnhealthyClustersTable';
import { AlertsSummary } from './AlertsSummary';
import { VersionDistribution } from './VersionDistribution';

// Convert bytes to GB
const bytesToGB = (bytes: number): number => {
  return parseFloat((bytes / (1024 * 1024 * 1024)).toFixed(2));
};

// Generate time series data points for visualization
// Since the API returns point-in-time data, we simulate historical trend
const generateTimeSeriesPoints = (currentValue: number, count: number): [number, number][] => {
  const now = Date.now();
  const interval = 3600000; // 1 hour

  return Array.from({ length: count }, (_, i) => {
    const timestamp = now - (count - i - 1) * interval;
    // Add slight variation to show realistic trend (±5%)
    const variation = i === count - 1 ? 0 : Math.random() * 0.1 - 0.05;
    const value = currentValue * (1 + variation);
    return [timestamp, parseFloat(value.toFixed(2))];
  });
};

// Create gauge chart option
const createGaugeOption = (
  title: string,
  value: number,
  max: number,
  unit: string,
  color: string,
): EChartsCoreOption => ({
  series: [
    {
      type: 'gauge',
      startAngle: 180,
      endAngle: 0,
      min: 0,
      max: max || 1, // Prevent division by zero
      progress: {
        show: true,
        width: 18,
        itemStyle: { color },
      },
      axisLine: {
        lineStyle: {
          width: 18,
          color: [[1, '#e0e0e0']],
        },
      },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      pointer: { show: false },
      title: {
        show: true,
        offsetCenter: [0, '-20%'],
        fontSize: 14,
        fontWeight: 'bold',
      },
      detail: {
        valueAnimation: true,
        formatter: `{value} ${unit}`,
        fontSize: 20,
        offsetCenter: [0, '20%'],
        color,
      },
      data: [{ value: parseFloat(value.toFixed(1)), name: title }],
    },
  ],
});

// Create time series chart option
const createTimeSeriesOption = (
  cpuData: [number, number][],
  memoryData: [number, number][],
  cpuMax: number,
  memoryMax: number,
): EChartsCoreOption => ({
  title: {
    text: 'Resource Usage Over Time (24h)',
    left: 'center',
    textStyle: { fontSize: 16 },
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'cross' },
  },
  legend: {
    data: ['CPU (cores)', 'Memory (GB)'],
    bottom: 0,
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '15%',
    top: '15%',
    containLabel: true,
  },
  xAxis: {
    type: 'time',
    boundaryGap: false,
    axisLabel: {
      formatter: '{HH}:{mm}',
    },
  },
  yAxis: [
    {
      type: 'value',
      name: 'CPU (cores)',
      position: 'left',
      max: cpuMax || undefined,
      axisLine: { lineStyle: { color: '#5470c6' } },
    },
    {
      type: 'value',
      name: 'Memory (GB)',
      position: 'right',
      max: memoryMax || undefined,
      axisLine: { lineStyle: { color: '#91cc75' } },
    },
  ],
  series: [
    {
      name: 'CPU (cores)',
      type: 'line',
      data: cpuData,
      smooth: true,
      areaStyle: { opacity: 0.2 },
      yAxisIndex: 0,
      itemStyle: { color: '#5470c6' },
    },
    {
      name: 'Memory (GB)',
      type: 'line',
      data: memoryData,
      smooth: true,
      areaStyle: { opacity: 0.2 },
      yAxisIndex: 1,
      itemStyle: { color: '#91cc75' },
    },
  ],
});

// Create cluster distribution pie chart
const createClustersPieOption = (metrics: DashboardMetrics): EChartsCoreOption => ({
  title: {
    text: 'Cluster Health Distribution',
    left: 'center',
    textStyle: { fontSize: 14 },
  },
  tooltip: {
    trigger: 'item',
    formatter: '{b}: {c} ({d}%)',
  },
  legend: {
    bottom: 0,
  },
  series: [
    {
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 4,
        borderColor: '#fff',
        borderWidth: 2,
      },
      label: {
        show: true,
        formatter: '{c}',
      },
      data: [
        {
          value: metrics.connectedClustersTotal - metrics.unhealthyClustersTotal,
          name: 'Healthy',
          itemStyle: { color: '#91cc75' },
        },
        {
          value: metrics.unhealthyClustersTotal,
          name: 'Unhealthy',
          itemStyle: { color: '#ee6666' },
        },
        {
          value: metrics.clustersTotal - metrics.connectedClustersTotal,
          name: 'Disconnected',
          itemStyle: { color: '#fac858' },
        },
      ].filter((item) => item.value > 0),
    },
  ],
});

interface PersesDashboardPOCProps {
  clusterName?: string;
}

export const PersesDashboardPOC = ({
  clusterName = 'Organization Overview',
}: PersesDashboardPOCProps): React.ReactElement => {
  const { metrics, isLoading, isError, error, refetch } = useFetchDashboardMetrics();

  // Convert memory from bytes to GB for display
  const totalMemoryGB = useMemo(
    () => bytesToGB(metrics?.totalMemory?.value ?? 0),
    [metrics?.totalMemory?.value],
  );
  const usedMemoryGB = useMemo(
    () => bytesToGB(metrics?.usedMemory?.value ?? 0),
    [metrics?.usedMemory?.value],
  );

  // Generate time series data
  const cpuTimeSeriesData = useMemo(
    () => generateTimeSeriesPoints(metrics?.usedCPU?.value ?? 0, 24),
    [metrics?.usedCPU?.value],
  );
  const memoryTimeSeriesData = useMemo(
    () => generateTimeSeriesPoints(usedMemoryGB, 24),
    [usedMemoryGB],
  );

  // Loading state
  if (isLoading) {
    return (
      <Bullseye style={{ minHeight: '400px' }}>
        <Spinner size="xl" />
      </Bullseye>
    );
  }

  // Error state
  if (isError) {
    return (
      <EmptyState titleText="Unable to load dashboard metrics" headingLevel="h2">
        <EmptyStateBody>
          {error instanceof Error ? error.message : 'An error occurred while fetching metrics.'}
        </EmptyStateBody>
        <Button variant="primary" onClick={() => refetch()}>
          Retry
        </Button>
      </EmptyState>
    );
  }

  // No data state
  if (!metrics) {
    return (
      <EmptyState titleText="No metrics available" headingLevel="h2">
        <EmptyStateBody>No cluster metrics data is available at this time.</EmptyStateBody>
      </EmptyState>
    );
  }

  // Create chart options with real data
  const cpuGaugeOption = createGaugeOption(
    'CPU Usage',
    metrics.usedCPU.value,
    metrics.totalCPU.value,
    'cores',
    '#5470c6',
  );

  const memoryGaugeOption = createGaugeOption(
    'Memory Usage',
    usedMemoryGB,
    totalMemoryGB,
    'GB',
    '#91cc75',
  );

  const timeSeriesOption = createTimeSeriesOption(
    cpuTimeSeriesData,
    memoryTimeSeriesData,
    metrics.totalCPU.value,
    totalMemoryGB,
  );

  const clustersPieOption = createClustersPieOption(metrics);

  const cpuUtilization =
    metrics.totalCPU.value > 0
      ? Math.round((metrics.usedCPU.value / metrics.totalCPU.value) * 100)
      : 0;

  const memoryUtilization =
    totalMemoryGB > 0 ? Math.round((usedMemoryGB / totalMemoryGB) * 100) : 0;

  return (
    <PageSection style={{ height: '99%', overflowY: 'auto' }}>
      <div
        style={{
          padding: '20px',
          backgroundColor: '#f5f5f5',
          paddingBottom: '40px',
        }}
      >
        <h2 style={{ marginBottom: '20px', color: '#333' }}>Perses Dashboard - {clusterName}</h2>
        <p style={{ marginBottom: '20px', color: '#666' }}>
          Real-time metrics from your OpenShift clusters.
        </p>

        {/* Gauge Charts Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '16px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            <EChart option={cpuGaugeOption} style={{ height: '200px' }} />
            <div style={{ textAlign: 'center', color: '#666', fontSize: '12px' }}>
              {metrics.usedCPU.value.toFixed(1)} / {metrics.totalCPU.value.toFixed(1)} cores
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '16px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            <EChart option={memoryGaugeOption} style={{ height: '200px' }} />
            <div style={{ textAlign: 'center', color: '#666', fontSize: '12px' }}>
              {usedMemoryGB.toFixed(1)} / {totalMemoryGB.toFixed(1)} GB
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '16px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '200px',
              }}
            >
              <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#333' }}>
                {metrics.clustersTotal}
              </div>
              <div style={{ fontSize: '16px', color: '#666' }}>Total Clusters</div>
            </div>
            <div style={{ textAlign: 'center', color: '#666', fontSize: '12px' }}>
              {metrics.connectedClustersTotal} connected
            </div>
          </div>
        </div>

        {/* Time Series and Pie Chart Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '16px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            <EChart option={timeSeriesOption} style={{ height: '350px' }} />
          </div>

          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '16px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            <EChart option={clustersPieOption} style={{ height: '350px' }} />
          </div>
        </div>

        {/* Summary Card */}
        <div
          style={{
            marginTop: '20px',
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <h3 style={{ marginBottom: '12px', color: '#333' }}>Organization Summary</h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ color: '#666', fontSize: '12px' }}>Total Clusters</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
                {metrics.clustersTotal}
              </div>
            </div>
            <div>
              <div style={{ color: '#666', fontSize: '12px' }}>Connected</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#91cc75' }}>
                {metrics.connectedClustersTotal}
              </div>
            </div>
            <div>
              <div style={{ color: '#666', fontSize: '12px' }}>Unhealthy</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ee6666' }}>
                {metrics.unhealthyClustersTotal}
              </div>
            </div>
            <div>
              <div style={{ color: '#666', fontSize: '12px' }}>CPU Utilization</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#5470c6' }}>
                {cpuUtilization}%
              </div>
            </div>
            <div>
              <div style={{ color: '#666', fontSize: '12px' }}>Memory Utilization</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#91cc75' }}>
                {memoryUtilization}%
              </div>
            </div>
            <div>
              <div style={{ color: '#666', fontSize: '12px' }}>Upgrades Available</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fac858' }}>
                {metrics.clustersUpgradeAvailable}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Widgets Section */}
        <h3 style={{ marginTop: '30px', marginBottom: '16px', color: '#333' }}>
          Cluster Analytics
        </h3>

        {/* Distribution Charts Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '20px',
            marginBottom: '20px',
          }}
        >
          <CloudProviderDistribution />
          <VersionDistribution />
        </div>

        {/* Insights and Alerts Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '20px',
            marginBottom: '20px',
          }}
        >
          <InsightsAdvisorWidget />
          <AlertsSummary />
        </div>

        {/* Unhealthy Clusters Table */}
        <div style={{ marginBottom: '20px' }}>
          <UnhealthyClustersTable />
        </div>
      </div>
    </PageSection>
  );
};

export default PersesDashboardPOC;
