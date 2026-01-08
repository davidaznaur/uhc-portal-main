import React, { useMemo } from 'react';
import { Bullseye, Spinner, EmptyState, EmptyStateBody, Button } from '@patternfly/react-core';
import { EChart } from '@perses-dev/components';
import type { EChartsCoreOption } from 'echarts/core';

import { useFetchClusterDistribution } from '~/queries/DashboardQueries';

// Generate distinct colors for versions
const generateVersionColors = (count: number): string[] => {
  const baseColors = [
    '#0066CC',
    '#00A1E0',
    '#009596',
    '#5752D1',
    '#8A8D90',
    '#F0AB00',
    '#EC7A08',
    '#C9190B',
    '#7D1007',
    '#3E8635',
    '#1E4F18',
    '#004080',
  ];

  return Array.from({ length: count }, (_, i) => baseColors[i % baseColors.length]);
};

const createVersionBarChartOption = (byVersion: Record<string, number>): EChartsCoreOption => {
  // Sort versions in descending order (newest first)
  const sortedVersions = Object.entries(byVersion).sort((a, b) => {
    const versionA = a[0].split('.').map(Number);
    const versionB = b[0].split('.').map(Number);
    for (let i = 0; i < Math.max(versionA.length, versionB.length); i++) {
      const diff = (versionB[i] || 0) - (versionA[i] || 0);
      if (diff !== 0) return diff;
    }
    return 0;
  });

  const versions = sortedVersions.map(([v]) => v);
  const counts = sortedVersions.map(([, c]) => c);
  const colors = generateVersionColors(versions.length);

  return {
    title: {
      text: 'Clusters by OpenShift Version',
      left: 'center',
      textStyle: { fontSize: 14 },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const data = params[0];
        return `OpenShift ${data.name}<br/>Clusters: ${data.value}`;
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '20%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: versions,
      axisLabel: {
        fontSize: 10,
        rotate: versions.length > 6 ? 45 : 0,
      },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
    },
    series: [
      {
        type: 'bar',
        data: counts.map((count, index) => ({
          value: count,
          itemStyle: { color: colors[index] },
        })),
        barWidth: '60%',
        label: {
          show: true,
          position: 'top',
          formatter: '{c}',
          fontSize: 11,
        },
      },
    ],
  };
};

export const VersionDistribution = (): React.ReactElement => {
  const { distribution, isLoading, isError, refetch } = useFetchClusterDistribution();

  const containerStyle: React.CSSProperties = {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  };

  const versionStats = useMemo(() => {
    if (!distribution?.byVersion) return null;

    const versions = Object.keys(distribution.byVersion);
    const sortedVersions = versions.sort((a, b) => {
      const versionA = a.split('.').map(Number);
      const versionB = b.split('.').map(Number);
      for (let i = 0; i < Math.max(versionA.length, versionB.length); i++) {
        const diff = (versionB[i] || 0) - (versionA[i] || 0);
        if (diff !== 0) return diff;
      }
      return 0;
    });

    return {
      newest: sortedVersions[0],
      oldest: sortedVersions[sortedVersions.length - 1],
      count: versions.length,
    };
  }, [distribution?.byVersion]);

  if (isLoading) {
    return (
      <div style={{ ...containerStyle, height: '300px' }}>
        <Bullseye style={{ height: '100%' }}>
          <Spinner size="lg" />
        </Bullseye>
      </div>
    );
  }

  if (isError || !distribution) {
    return (
      <div style={{ ...containerStyle, height: '300px' }}>
        <EmptyState titleText="Unable to load data" headingLevel="h3">
          <EmptyStateBody>Version distribution data is not available.</EmptyStateBody>
          <Button variant="link" onClick={() => refetch()}>
            Retry
          </Button>
        </EmptyState>
      </div>
    );
  }

  const chartOption = createVersionBarChartOption(distribution.byVersion);

  return (
    <div style={containerStyle}>
      <EChart option={chartOption} style={{ height: '250px' }} />
      {versionStats && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-around',
            marginTop: '8px',
            fontSize: '12px',
            color: '#666',
          }}
        >
          <span>
            Newest: <strong>{versionStats.newest}</strong>
          </span>
          <span>
            Oldest: <strong>{versionStats.oldest}</strong>
          </span>
          <span>
            Versions in use: <strong>{versionStats.count}</strong>
          </span>
        </div>
      )}
    </div>
  );
};

export default VersionDistribution;
