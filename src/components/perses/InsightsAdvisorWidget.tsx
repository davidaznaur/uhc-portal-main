import React from 'react';
import { Bullseye, Spinner, EmptyState, EmptyStateBody, Button } from '@patternfly/react-core';
import { EChart } from '@perses-dev/components';
import type { EChartsCoreOption } from 'echarts/core';

import { useFetchInsightsOverview } from '~/queries/DashboardQueries';

const RISK_COLORS = {
  critical: '#A30000',
  important: '#EC7A08',
  moderate: '#F0AB00',
  low: '#2B9AF3',
};

const createInsightsBarChartOption = (hitByRisk: {
  critical: number;
  important: number;
  moderate: number;
  low: number;
}): EChartsCoreOption => ({
  title: {
    text: 'Insights Advisor Recommendations',
    left: 'center',
    textStyle: { fontSize: 14 },
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '10%',
    top: '20%',
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    data: ['Critical', 'Important', 'Moderate', 'Low'],
    axisLabel: {
      fontSize: 11,
    },
  },
  yAxis: {
    type: 'value',
    minInterval: 1,
  },
  series: [
    {
      type: 'bar',
      data: [
        { value: hitByRisk.critical, itemStyle: { color: RISK_COLORS.critical } },
        { value: hitByRisk.important, itemStyle: { color: RISK_COLORS.important } },
        { value: hitByRisk.moderate, itemStyle: { color: RISK_COLORS.moderate } },
        { value: hitByRisk.low, itemStyle: { color: RISK_COLORS.low } },
      ],
      barWidth: '50%',
      label: {
        show: true,
        position: 'top',
        formatter: '{c}',
      },
    },
  ],
});

export const InsightsAdvisorWidget = (): React.ReactElement => {
  const { insightsOverview, isLoading, isError, refetch } = useFetchInsightsOverview();

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

  if (isError || !insightsOverview) {
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
        <EmptyState titleText="Unable to load Insights data" headingLevel="h3">
          <EmptyStateBody>Insights Advisor data is not available.</EmptyStateBody>
          <Button variant="link" onClick={() => refetch()}>
            Retry
          </Button>
        </EmptyState>
      </div>
    );
  }

  const chartOption = createInsightsBarChartOption(insightsOverview.hitByRisk);
  const totalRecommendations =
    insightsOverview.hitByRisk.critical +
    insightsOverview.hitByRisk.important +
    insightsOverview.hitByRisk.moderate +
    insightsOverview.hitByRisk.low;

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
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '8px',
          fontSize: '12px',
          color: '#666',
        }}
      >
        <span>Total recommendations: {totalRecommendations}</span>
        <span>Clusters affected: {insightsOverview.clustersHit}</span>
      </div>
    </div>
  );
};

export default InsightsAdvisorWidget;
