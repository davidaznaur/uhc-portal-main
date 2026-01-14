import type {
  DatasourceApi,
  DatasourceResource,
  DatasourceSelector,
  GlobalDatasourceResource,
} from '@perses-dev/core';

/**
 * Create a datasource API implementation for Perses
 *
 * This API provides access to datasources defined in the dashboard
 * and handles datasource resolution for panels and queries.
 */
export const createDatasourceApi = (): DatasourceApi => ({
  /**
   * Get a datasource by selector from a specific project
   */
  getDatasource: async (
    project: string,
    selector: DatasourceSelector,
  ): Promise<DatasourceResource | undefined> => {
    // eslint-disable-next-line no-console
    console.log('[DatasourceApi] getDatasource called:', { project, selector });

    // For now, we handle AMS datasource directly
    if (selector.kind === 'AMSDatasource') {
      return {
        kind: 'Datasource',
        metadata: {
          name: selector.name ?? 'ams',
          project,
        },
        spec: {
          default: true,
          display: {
            name: 'Account Management Service',
          },
          plugin: {
            kind: 'AMSDatasource',
            spec: {},
          },
        },
      };
    }

    return undefined;
  },

  /**
   * Get a global datasource by selector
   */
  getGlobalDatasource: async (
    selector: DatasourceSelector,
  ): Promise<GlobalDatasourceResource | undefined> => {
    // eslint-disable-next-line no-console
    console.log('[DatasourceApi] getGlobalDatasource called:', selector);

    // For now, we handle AMS datasource as global
    if (selector.kind === 'AMSDatasource') {
      return {
        kind: 'GlobalDatasource',
        metadata: {
          name: selector.name ?? 'ams',
        },
        spec: {
          default: true,
          display: {
            name: 'Account Management Service',
          },
          plugin: {
            kind: 'AMSDatasource',
            spec: {},
          },
        },
      };
    }

    return undefined;
  },

  /**
   * List all datasources for a project
   */
  listDatasources: async (project: string, pluginKind?: string): Promise<DatasourceResource[]> => {
    // eslint-disable-next-line no-console
    console.log('[DatasourceApi] listDatasources called:', { project, pluginKind });

    const datasources: DatasourceResource[] = [
      {
        kind: 'Datasource',
        metadata: {
          name: 'ams',
          project,
        },
        spec: {
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
    ];

    if (pluginKind) {
      return datasources.filter((ds) => ds.spec.plugin.kind === pluginKind);
    }

    return datasources;
  },

  /**
   * List all global datasources
   */
  listGlobalDatasources: async (pluginKind?: string): Promise<GlobalDatasourceResource[]> => {
    // eslint-disable-next-line no-console
    console.log('[DatasourceApi] listGlobalDatasources called:', { pluginKind });

    const datasources: GlobalDatasourceResource[] = [
      {
        kind: 'GlobalDatasource',
        metadata: {
          name: 'ams',
        },
        spec: {
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
    ];

    if (pluginKind) {
      return datasources.filter((ds) => ds.spec.plugin.kind === pluginKind);
    }

    return datasources;
  },
});

export default createDatasourceApi;
