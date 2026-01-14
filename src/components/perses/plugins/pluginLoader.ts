import { dynamicImportPluginLoader } from '@perses-dev/plugin-system';
import type { PluginLoader, PluginModuleResource, PluginMetadata } from '@perses-dev/plugin-system';

/**
 * Supported plugin kinds
 */
type PluginKind = 'Panel' | 'Datasource' | 'TimeSeriesQuery';

/**
 * Helper to create plugin metadata
 */
const createPluginMetadata = (kind: PluginKind, name: string): PluginMetadata => ({
  kind,
  spec: {
    name,
    display: {
      name,
    },
  },
});

/**
 * Plugin module resources for all available plugins
 *
 * Note: The importPlugin function must return an object with named exports
 * that match the plugin names (e.g., { TimeSeriesChart: pluginImpl })
 */
const pluginResources: Array<{
  resource: PluginModuleResource;
  importPlugin: () => Promise<unknown>;
}> = [
  // TimeSeriesChart Panel Plugin (from Perses)
  // The module exports TimeSeriesChart as a named export
  {
    resource: {
      kind: 'PluginModule',
      metadata: { name: '@perses-dev/timeseries-chart-plugin', version: '1.0.0' },
      spec: {
        plugins: [createPluginMetadata('Panel', 'TimeSeriesChart')],
      },
    },
    importPlugin: () => import('@perses-dev/timeseries-chart-plugin'),
  },

  // AMS Datasource Plugin (custom)
  // Export as { AMSDatasource: plugin }
  {
    resource: {
      kind: 'PluginModule',
      metadata: { name: 'ams-datasource-plugin', version: '1.0.0' },
      spec: {
        plugins: [createPluginMetadata('Datasource', 'AMSDatasource')],
      },
    },
    importPlugin: () =>
      import('./ams-datasource').then((m) => ({
        AMSDatasource: m.AMSDatasourcePlugin,
      })),
  },

  // AMS TimeSeriesQuery Plugin (custom)
  // Export as { AMSTimeSeriesQuery: plugin }
  {
    resource: {
      kind: 'PluginModule',
      metadata: { name: 'ams-query-plugin', version: '1.0.0' },
      spec: {
        plugins: [createPluginMetadata('TimeSeriesQuery', 'AMSTimeSeriesQuery')],
      },
    },
    importPlugin: () =>
      import('./ams-query').then((m) => ({
        AMSTimeSeriesQuery: m.AMSTimeSeriesQueryPlugin,
      })),
  },

  // BarChart Panel Plugin (custom)
  {
    resource: {
      kind: 'PluginModule',
      metadata: { name: 'barchart-panel-plugin', version: '1.0.0' },
      spec: {
        plugins: [createPluginMetadata('Panel', 'BarChart')],
      },
    },
    importPlugin: () =>
      import('./panels').then((m) => ({
        BarChart: m.BarChartPanel,
      })),
  },

  // PieChart Panel Plugin (custom)
  {
    resource: {
      kind: 'PluginModule',
      metadata: { name: 'piechart-panel-plugin', version: '1.0.0' },
      spec: {
        plugins: [createPluginMetadata('Panel', 'PieChart')],
      },
    },
    importPlugin: () =>
      import('./panels').then((m) => ({
        PieChart: m.PieChartPanel,
      })),
  },

  // Stat Panel Plugin (custom)
  {
    resource: {
      kind: 'PluginModule',
      metadata: { name: 'stat-panel-plugin', version: '1.0.0' },
      spec: {
        plugins: [createPluginMetadata('Panel', 'Stat')],
      },
    },
    importPlugin: () =>
      import('./panels').then((m) => ({
        Stat: m.StatPanel,
      })),
  },
];

/**
 * Plugin loader for the Perses dashboard
 * Loads built-in Perses plugins and custom AMS plugins
 */
export const createPluginLoader = (): PluginLoader => {
  // eslint-disable-next-line no-console
  console.log('[PluginLoader] Creating plugin loader with resources:', pluginResources);

  const loader = dynamicImportPluginLoader(pluginResources);

  // Wrap the loader to add logging
  return {
    getInstalledPlugins: async () => {
      const plugins = await loader.getInstalledPlugins();
      // eslint-disable-next-line no-console
      console.log('[PluginLoader] Installed plugins:', plugins);
      return plugins;
    },
    importPluginModule: async (resource) => {
      // eslint-disable-next-line no-console
      console.log('[PluginLoader] Importing module:', resource.metadata.name);
      const module = await loader.importPluginModule(resource);
      // eslint-disable-next-line no-console
      console.log('[PluginLoader] Imported module:', resource.metadata.name, module);
      return module;
    },
  };
};

export default createPluginLoader;
