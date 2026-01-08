import React from 'react';
import {
  Bullseye,
  Spinner,
  EmptyState,
  EmptyStateBody,
  Button,
  Label,
} from '@patternfly/react-core';
import { EChart } from '@perses-dev/components';
import type { EChartsCoreOption } from 'echarts/core';

import { useFetchClusterDistribution } from '~/queries/DashboardQueries';

const createAlertsGaugeOption = (
  totalAlerts: number,
  clustersWithAlerts: number,
): EChartsCoreOption => ({
  series: [
    {
      type: 'gauge',
      startAngle: 180,
      endAngle: 0,
      min: 0,
      max: Math.max(totalAlerts, 10),
      progress: {
        show: true,
        width: 18,
        itemStyle: {
          color: totalAlerts > 0 ? '#c9190b' : '#3e8635',
        },
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
        formatter: '{value}',
        fontSize: 28,
        offsetCenter: [0, '15%'],
        color: totalAlerts > 0 ? '#c9190b' : '#3e8635',
      },
      data: [{ value: totalAlerts, name: 'Critical Alerts' }],
    },
  ],
});

export const AlertsSummary = (): React.ReactElement => {
  const { distribution, isLoading, isError, refetch } = useFetchClusterDistribution();

  const containerStyle: React.CSSProperties = {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  };

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
          <EmptyStateBody>Alerts data is not available.</EmptyStateBody>
          <Button variant="link" onClick={() => refetch()}>
            Retry
          </Button>
        </EmptyState>
      </div>
    );
  }

  const chartOption = createAlertsGaugeOption(
    distribution.totalAlerts,
    distribution.clusterAlerts.length,
  );

  return (
    <div style={containerStyle}>
      <EChart option={chartOption} style={{ height: '180px' }} />

      {distribution.clusterAlerts.length > 0 ? (
        <div style={{ marginTop: '8px' }}>
          <div
            style={{
              fontSize: '12px',
              color: '#666',
              marginBottom: '8px',
              textAlign: 'center',
            }}
          >
            Clusters with alerts: {distribution.clusterAlerts.length}
          </div>
          <div style={{ maxHeight: '80px', overflow: 'auto' }}>
            {distribution.clusterAlerts.slice(0, 5).map((cluster) => (
              <div
                key={cluster.clusterId}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '4px 8px',
                  backgroundColor: '#fdf7f7',
                  borderRadius: '4px',
                  marginBottom: '4px',
                  fontSize: '12px',
                }}
              >
                <span style={{ fontWeight: 500, color: '#333' }}>{cluster.displayName}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {cluster.criticalAlerts > 0 && (
                    <Label isCompact color="red">
                      {cluster.criticalAlerts} critical
                    </Label>
                  )}
                  {cluster.operatorsConditionFailing > 0 && (
                    <Label isCompact color="orange">
                      {cluster.operatorsConditionFailing} operators
                    </Label>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div
          style={{
            textAlign: 'center',
            color: '#3e8635',
            fontSize: '14px',
            marginTop: '8px',
          }}
        >
          No critical alerts - All systems operational
        </div>
      )}
    </div>
  );
};

export default AlertsSummary;
