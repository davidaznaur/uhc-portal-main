import type { DashboardResource } from '@perses-dev/core';

/**
 * Cluster Overview Dashboard Definition
 *
 * This dashboard displays key metrics from the Account Management Service (AMS)
 * including CPU usage, memory usage, and cluster statistics.
 */
export const clusterOverviewDashboard: DashboardResource = {
  kind: 'Dashboard',
  metadata: {
    name: 'cluster-overview',
    project: 'uhc-portal',
    version: 1,
  },
  spec: {
    display: {
      name: 'Cluster Overview',
    },
    duration: '6h',
    refreshInterval: '1m',
    variables: [],
    datasources: {
      ams: {
        default: true,
        display: {
          name: 'Account Management Service',
        },
        plugin: {
          kind: 'AMSDatasource',
          spec: {},
        },
      },
    },
    layouts: [
      // Summary Stats Row
      {
        kind: 'Grid',
        spec: {
          display: {
            title: 'Cluster Summary',
            collapse: {
              open: true,
            },
          },
          items: [
            {
              x: 0,
              y: 0,
              width: 4,
              height: 4,
              content: {
                $ref: '#/spec/panels/totalClustersPanel',
              },
            },
            {
              x: 4,
              y: 0,
              width: 4,
              height: 4,
              content: {
                $ref: '#/spec/panels/connectedClustersPanel',
              },
            },
            {
              x: 8,
              y: 0,
              width: 4,
              height: 4,
              content: {
                $ref: '#/spec/panels/unhealthyClustersPanel',
              },
            },
            {
              x: 12,
              y: 0,
              width: 4,
              height: 4,
              content: {
                $ref: '#/spec/panels/upgradesAvailablePanel',
              },
            },
            {
              x: 16,
              y: 0,
              width: 4,
              height: 4,
              content: {
                $ref: '#/spec/panels/usedCpuPanel',
              },
            },
            {
              x: 20,
              y: 0,
              width: 4,
              height: 4,
              content: {
                $ref: '#/spec/panels/usedMemoryPanel',
              },
            },
          ],
        },
      },
      // Distribution Charts Row
      {
        kind: 'Grid',
        spec: {
          display: {
            title: 'Cluster Distribution',
            collapse: {
              open: true,
            },
          },
          items: [
            // Cloud Provider Distribution (Pie Chart)
            {
              x: 0,
              y: 0,
              width: 8,
              height: 8,
              content: {
                $ref: '#/spec/panels/cloudProviderPieChart',
              },
            },
            // Version Distribution (Bar Chart)
            {
              x: 8,
              y: 0,
              width: 8,
              height: 8,
              content: {
                $ref: '#/spec/panels/versionBarChart',
              },
            },
            // Cluster Health Status (Pie Chart)
            {
              x: 16,
              y: 0,
              width: 8,
              height: 8,
              content: {
                $ref: '#/spec/panels/healthStatusPieChart',
              },
            },
          ],
        },
      },
      // Resource Utilization Row
      {
        kind: 'Grid',
        spec: {
          display: {
            title: 'Resource Utilization',
            collapse: {
              open: true,
            },
          },
          items: [
            // CPU Usage Time Series
            {
              x: 0,
              y: 0,
              width: 12,
              height: 8,
              content: {
                $ref: '#/spec/panels/cpuUsageChart',
              },
            },
            // Memory Usage Time Series
            {
              x: 12,
              y: 0,
              width: 12,
              height: 8,
              content: {
                $ref: '#/spec/panels/memoryUsageChart',
              },
            },
          ],
        },
      },
      // Cluster Statistics Row
      {
        kind: 'Grid',
        spec: {
          display: {
            title: 'Cluster Statistics',
            collapse: {
              open: true,
            },
          },
          items: [
            // Cluster Count Time Series
            {
              x: 0,
              y: 0,
              width: 8,
              height: 8,
              content: {
                $ref: '#/spec/panels/clusterCountChart',
              },
            },
            // Connected vs Unhealthy Clusters
            {
              x: 8,
              y: 0,
              width: 8,
              height: 8,
              content: {
                $ref: '#/spec/panels/clusterHealthChart',
              },
            },
            // Upgrade Status
            {
              x: 16,
              y: 0,
              width: 8,
              height: 8,
              content: {
                $ref: '#/spec/panels/upgradeStatusChart',
              },
            },
          ],
        },
      },
    ],
    panels: {
      // ============ STAT PANELS ============
      totalClustersPanel: {
        kind: 'Panel',
        spec: {
          display: {
            name: 'Total Clusters',
            description: 'Total number of clusters in the organization',
          },
          plugin: {
            kind: 'Stat',
            spec: {
              metric: 'total_clusters',
              colorMode: 'value',
              fontSize: 'large',
              thresholds: {},
            },
          },
          queries: [],
        },
      },
      connectedClustersPanel: {
        kind: 'Panel',
        spec: {
          display: {
            name: 'Connected',
            description: 'Number of connected clusters',
          },
          plugin: {
            kind: 'Stat',
            spec: {
              metric: 'connected_clusters',
              colorMode: 'value',
              fontSize: 'large',
              thresholds: {},
            },
          },
          queries: [],
        },
      },
      unhealthyClustersPanel: {
        kind: 'Panel',
        spec: {
          display: {
            name: 'Unhealthy',
            description: 'Number of unhealthy clusters',
          },
          plugin: {
            kind: 'Stat',
            spec: {
              metric: 'unhealthy_clusters',
              colorMode: 'value',
              fontSize: 'large',
              thresholds: {
                warning: 1,
                critical: 5,
              },
            },
          },
          queries: [],
        },
      },
      upgradesAvailablePanel: {
        kind: 'Panel',
        spec: {
          display: {
            name: 'Upgrades Available',
            description: 'Clusters with available upgrades',
          },
          plugin: {
            kind: 'Stat',
            spec: {
              metric: 'clusters_upgrade_available',
              colorMode: 'value',
              fontSize: 'large',
              thresholds: {},
            },
          },
          queries: [],
        },
      },
      usedCpuPanel: {
        kind: 'Panel',
        spec: {
          display: {
            name: 'CPU Used',
            description: 'Total CPU cores in use',
          },
          plugin: {
            kind: 'Stat',
            spec: {
              metric: 'used_cpu',
              colorMode: 'none',
              fontSize: 'large',
              unit: 'cores',
            },
          },
          queries: [],
        },
      },
      usedMemoryPanel: {
        kind: 'Panel',
        spec: {
          display: {
            name: 'Memory Used',
            description: 'Total memory in use',
          },
          plugin: {
            kind: 'Stat',
            spec: {
              metric: 'used_memory',
              colorMode: 'none',
              fontSize: 'large',
              unit: 'GB',
            },
          },
          queries: [],
        },
      },

      // ============ DISTRIBUTION PANELS ============
      cloudProviderPieChart: {
        kind: 'Panel',
        spec: {
          display: {
            name: 'Cloud Provider Distribution',
            description: 'Clusters by cloud provider',
          },
          plugin: {
            kind: 'PieChart',
            spec: {
              dataType: 'cloud_provider',
              donut: true,
              showLegend: true,
              showLabels: true,
              labelFormat: 'percent',
              maxItems: 5,
            },
          },
          queries: [],
        },
      },
      versionBarChart: {
        kind: 'Panel',
        spec: {
          display: {
            name: 'OpenShift Version Distribution',
            description: 'Clusters by OpenShift version',
          },
          plugin: {
            kind: 'BarChart',
            spec: {
              dataType: 'version_distribution',
              horizontal: false,
              showLabels: true,
              maxItems: 8,
            },
          },
          queries: [],
        },
      },
      healthStatusPieChart: {
        kind: 'Panel',
        spec: {
          display: {
            name: 'Health Status',
            description: 'Healthy vs unhealthy clusters',
          },
          plugin: {
            kind: 'PieChart',
            spec: {
              dataType: 'status_distribution',
              donut: true,
              showLegend: true,
              showLabels: true,
              labelFormat: 'all',
            },
          },
          queries: [],
        },
      },

      // ============ TIME SERIES PANELS ============
      cpuUsageChart: {
        kind: 'Panel',
        spec: {
          display: {
            name: 'CPU Usage',
            description: 'Total CPU usage across all clusters',
          },
          plugin: {
            kind: 'TimeSeriesChart',
            spec: {
              legend: {
                position: 'bottom',
                mode: 'list',
              },
              yAxis: {
                show: true,
                label: 'CPU (cores)',
                format: {
                  unit: 'decimal',
                  shortValues: true,
                },
              },
              visual: {
                lineWidth: 2,
                areaOpacity: 0.3,
                showPoints: 'auto',
                palette: {
                  mode: 'auto',
                },
              },
            },
          },
          queries: [
            {
              kind: 'TimeSeriesQuery',
              spec: {
                plugin: {
                  kind: 'AMSTimeSeriesQuery',
                  spec: {
                    metric: 'cpu_usage',
                    legendLabel: 'Used CPU',
                  },
                },
              },
            },
            {
              kind: 'TimeSeriesQuery',
              spec: {
                plugin: {
                  kind: 'AMSTimeSeriesQuery',
                  spec: {
                    metric: 'cpu_total',
                    legendLabel: 'Total CPU',
                  },
                },
              },
            },
          ],
        },
      },
      memoryUsageChart: {
        kind: 'Panel',
        spec: {
          display: {
            name: 'Memory Usage',
            description: 'Total memory usage across all clusters',
          },
          plugin: {
            kind: 'TimeSeriesChart',
            spec: {
              legend: {
                position: 'bottom',
                mode: 'list',
              },
              yAxis: {
                show: true,
                label: 'Memory (GB)',
                format: {
                  unit: 'decimal',
                  shortValues: true,
                },
              },
              visual: {
                lineWidth: 2,
                areaOpacity: 0.3,
                showPoints: 'auto',
                palette: {
                  mode: 'auto',
                },
              },
            },
          },
          queries: [
            {
              kind: 'TimeSeriesQuery',
              spec: {
                plugin: {
                  kind: 'AMSTimeSeriesQuery',
                  spec: {
                    metric: 'memory_usage',
                    legendLabel: 'Used Memory',
                  },
                },
              },
            },
            {
              kind: 'TimeSeriesQuery',
              spec: {
                plugin: {
                  kind: 'AMSTimeSeriesQuery',
                  spec: {
                    metric: 'memory_total',
                    legendLabel: 'Total Memory',
                  },
                },
              },
            },
          ],
        },
      },
      clusterCountChart: {
        kind: 'Panel',
        spec: {
          display: {
            name: 'Total Clusters',
            description: 'Total number of clusters in the organization',
          },
          plugin: {
            kind: 'TimeSeriesChart',
            spec: {
              legend: {
                position: 'bottom',
                mode: 'list',
              },
              yAxis: {
                show: true,
                label: 'Clusters',
                format: {
                  unit: 'decimal',
                },
              },
              visual: {
                lineWidth: 2,
                areaOpacity: 0.2,
                showPoints: 'auto',
                palette: {
                  mode: 'auto',
                },
              },
            },
          },
          queries: [
            {
              kind: 'TimeSeriesQuery',
              spec: {
                plugin: {
                  kind: 'AMSTimeSeriesQuery',
                  spec: {
                    metric: 'clusters_total',
                    legendLabel: 'Total Clusters',
                  },
                },
              },
            },
          ],
        },
      },
      clusterHealthChart: {
        kind: 'Panel',
        spec: {
          display: {
            name: 'Cluster Health',
            description: 'Connected vs unhealthy clusters',
          },
          plugin: {
            kind: 'TimeSeriesChart',
            spec: {
              legend: {
                position: 'bottom',
                mode: 'list',
              },
              yAxis: {
                show: true,
                label: 'Clusters',
                format: {
                  unit: 'decimal',
                },
              },
              visual: {
                lineWidth: 2,
                areaOpacity: 0.2,
                showPoints: 'auto',
                palette: {
                  mode: 'auto',
                },
              },
            },
          },
          queries: [
            {
              kind: 'TimeSeriesQuery',
              spec: {
                plugin: {
                  kind: 'AMSTimeSeriesQuery',
                  spec: {
                    metric: 'clusters_connected',
                    legendLabel: 'Connected',
                  },
                },
              },
            },
            {
              kind: 'TimeSeriesQuery',
              spec: {
                plugin: {
                  kind: 'AMSTimeSeriesQuery',
                  spec: {
                    metric: 'clusters_unhealthy',
                    legendLabel: 'Unhealthy',
                  },
                },
              },
            },
          ],
        },
      },
      upgradeStatusChart: {
        kind: 'Panel',
        spec: {
          display: {
            name: 'Upgrade Status',
            description: 'Cluster upgrade availability',
          },
          plugin: {
            kind: 'TimeSeriesChart',
            spec: {
              legend: {
                position: 'bottom',
                mode: 'list',
              },
              yAxis: {
                show: true,
                label: 'Clusters',
                format: {
                  unit: 'decimal',
                },
              },
              visual: {
                lineWidth: 2,
                areaOpacity: 0.2,
                showPoints: 'auto',
                palette: {
                  mode: 'auto',
                },
              },
            },
          },
          queries: [
            {
              kind: 'TimeSeriesQuery',
              spec: {
                plugin: {
                  kind: 'AMSTimeSeriesQuery',
                  spec: {
                    metric: 'clusters_up_to_date',
                    legendLabel: 'Up to Date',
                  },
                },
              },
            },
            {
              kind: 'TimeSeriesQuery',
              spec: {
                plugin: {
                  kind: 'AMSTimeSeriesQuery',
                  spec: {
                    metric: 'clusters_upgrade_available',
                    legendLabel: 'Upgrade Available',
                  },
                },
              },
            },
          ],
        },
      },
    },
  },
};

export default clusterOverviewDashboard;
