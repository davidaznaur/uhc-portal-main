import React from 'react';
import { EChart } from '@perses-dev/components';
import { useSelector } from 'react-redux';
import type { EChartsCoreOption } from 'echarts/core';

interface ClusterMetricsProps {
  clusterId: string;
}

interface MetricsState {
  clusters: {
    data: Record<
      string,
      {
        metrics?: {
          cpu?: { used?: { value: number }; total?: { value: number } };
          memory?: { used?: { value: number }; total?: { value: number } };
        };
      }
    >;
  };
}

// Generate mock time series data for demo
const generateMockTimeSeries = (baseValue: number, points = 24): [number, number][] => {
  const now = Date.now();
  const hourMs = 3600000;

  return Array.from({ length: points }, (_, i) => {
    const timestamp = now - (points - i - 1) * hourMs;
    const variation = Math.random() * 0.2 - 0.1; // ±10% variation
    const value = baseValue * (1 + variation);
    return [timestamp, Math.round(value * 100) / 100];
  });
};

export const PersesMetricsPOC = ({ clusterId }: ClusterMetricsProps): React.ReactElement => {
  const metrics = useSelector((state: MetricsState) => state.clusters.data[clusterId]?.metrics);

  const cpuUsed = metrics?.cpu?.used?.value ?? 4;
  const cpuTotal = metrics?.cpu?.total?.value ?? 16;
  const memoryUsed = metrics?.memory?.used?.value ?? 8000000000;
  const memoryTotal = metrics?.memory?.total?.value ?? 32000000000;

  // Generate mock time series for the demo
  const cpuData = generateMockTimeSeries(cpuUsed);
  const memoryData = generateMockTimeSeries(memoryUsed / 1000000000); // Convert to GB

  const chartOption: EChartsCoreOption = {
    title: {
      text: 'Cluster Resource Usage',
      left: 'center',
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
      containLabel: true,
    },
    xAxis: {
      type: 'time',
      boundaryGap: false,
    },
    yAxis: [
      {
        type: 'value',
        name: 'CPU (cores)',
        position: 'left',
        max: cpuTotal,
      },
      {
        type: 'value',
        name: 'Memory (GB)',
        position: 'right',
        max: Math.round(memoryTotal / 1000000000),
      },
    ],
    series: [
      {
        name: 'CPU (cores)',
        type: 'line',
        data: cpuData,
        smooth: true,
        areaStyle: { opacity: 0.3 },
        yAxisIndex: 0,
      },
      {
        name: 'Memory (GB)',
        type: 'line',
        data: memoryData,
        smooth: true,
        areaStyle: { opacity: 0.3 },
        yAxisIndex: 1,
      },
    ],
  };

  return <EChart option={chartOption} style={{ height: '400px', width: '100%' }} />;
};

export default PersesMetricsPOC;
