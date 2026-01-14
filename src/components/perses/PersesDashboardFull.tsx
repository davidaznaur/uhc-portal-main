import React, { useMemo, useState, useCallback } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { PageSection } from '@patternfly/react-core';
import type { TimeRangeValue, DurationString } from '@perses-dev/core';
import { PluginRegistry, TimeRangeProvider } from '@perses-dev/plugin-system';
import { ChartsProvider, generateChartsTheme, getTheme } from '@perses-dev/components';
import {
  DashboardProvider,
  Dashboard,
  DatasourceStoreProvider,
  VariableProvider,
} from '@perses-dev/dashboards';

import { createPluginLoader } from './plugins';
import { clusterOverviewDashboard } from './dashboards';
import { createDatasourceApi } from './datasourceApi';

/**
 * Props for the PersesDashboardFull component
 */
export interface PersesDashboardFullProps {
  /** Dashboard title */
  title?: string;
  /** Whether the dashboard is in edit mode */
  isEditing?: boolean;
}

/**
 * Full Perses Dashboard Implementation
 *
 * This component renders a complete Perses dashboard with:
 * - Custom AMS datasource for fetching cluster metrics
 * - Custom time series query plugin for transforming data
 * - TimeSeriesChart panels for visualization
 */
export const PersesDashboardFull: React.FC<PersesDashboardFullProps> = ({
  title = 'Cluster Overview',
  isEditing = false,
}) => {
  // Create MUI theme for Perses components
  const muiTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: 'light',
        },
      }),
    [],
  );

  // Create Perses theme
  const persesTheme = useMemo(() => getTheme('light'), []);

  // Create charts theme
  const chartsTheme = useMemo(() => generateChartsTheme(persesTheme, {}), [persesTheme]);

  // Create plugin loader
  const pluginLoader = useMemo(() => createPluginLoader(), []);

  // Create datasource API
  const datasourceApi = useMemo(() => createDatasourceApi(), []);

  // Time range state
  const [timeRange, setTimeRange] = useState<TimeRangeValue>({
    pastDuration: '6h' as DurationString,
  });

  // Refresh interval state
  const [refreshInterval, setRefreshInterval] = useState<DurationString>('1m');

  // Handle time range changes
  const handleTimeRangeChange = useCallback((newTimeRange: TimeRangeValue) => {
    setTimeRange(newTimeRange);
  }, []);

  // Handle refresh interval changes
  const handleRefreshIntervalChange = useCallback((newInterval: DurationString) => {
    setRefreshInterval(newInterval);
  }, []);

  // Dashboard state for the provider
  const dashboardState = useMemo(
    () => ({
      isEditMode: isEditing,
      dashboardResource: clusterOverviewDashboard,
    }),
    [isEditing],
  );

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <PageSection style={{ height: '95%', padding: 0, overflowY: 'auto' }}>
        <PluginRegistry
          pluginLoader={pluginLoader}
          defaultPluginKinds={{
            TimeSeriesQuery: 'AMSTimeSeriesQuery',
          }}
        >
          <ChartsProvider chartsTheme={chartsTheme} enablePinning enableSyncGrouping>
            <TimeRangeProvider
              timeRange={timeRange}
              setTimeRange={handleTimeRangeChange}
              refreshInterval={refreshInterval}
              setRefreshInterval={handleRefreshIntervalChange}
            >
              <DatasourceStoreProvider
                datasourceApi={datasourceApi}
                dashboardResource={clusterOverviewDashboard}
              >
                <VariableProvider initialVariableDefinitions={[]}>
                  <DashboardProvider initialState={dashboardState}>
                    <Box
                      sx={{
                        height: '100%',
                        minHeight: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: 'background.default',
                      }}
                    >
                      {/* Dashboard Header */}
                      <Box
                        sx={{
                          p: 2,
                          borderBottom: 1,
                          borderColor: 'divider',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Typography variant="h5" component="h1">
                          {title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Auto-refresh: {refreshInterval}
                        </Typography>
                      </Box>

                      {/* Dashboard Content */}
                      <Box
                        sx={{
                          flex: 1,
                          minHeight: 0,
                          overflowY: 'auto',
                          p: 2,
                        }}
                      >
                        <Dashboard
                          emptyDashboardProps={{
                            title: 'No panels configured',
                            description: 'Add panels to visualize your cluster metrics.',
                          }}
                        />
                      </Box>
                    </Box>
                  </DashboardProvider>
                </VariableProvider>
              </DatasourceStoreProvider>
            </TimeRangeProvider>
          </ChartsProvider>
        </PluginRegistry>
      </PageSection>
    </ThemeProvider>
  );
};

export default PersesDashboardFull;
