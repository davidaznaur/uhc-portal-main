import React from 'react';
import {
  Bullseye,
  Spinner,
  EmptyState,
  EmptyStateBody,
  Button,
  Label,
} from '@patternfly/react-core';
import { Table, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';
import { ExclamationCircleIcon } from '@patternfly/react-icons';

import { useFetchUnhealthyClusters } from '~/queries/DashboardQueries';

export const UnhealthyClustersTable = (): React.ReactElement => {
  const { unhealthyClusters, isLoading, isError, refetch } = useFetchUnhealthyClusters();

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

  if (isError) {
    return (
      <div style={{ ...containerStyle, height: '300px' }}>
        <EmptyState titleText="Unable to load data" headingLevel="h3">
          <EmptyStateBody>Unhealthy clusters data is not available.</EmptyStateBody>
          <Button variant="link" onClick={() => refetch()}>
            Retry
          </Button>
        </EmptyState>
      </div>
    );
  }

  if (unhealthyClusters.length === 0) {
    return (
      <div style={containerStyle}>
        <h3 style={{ marginBottom: '16px', color: '#333', fontSize: '14px', fontWeight: 'bold' }}>
          Unhealthy Clusters
        </h3>
        <EmptyState titleText="All clusters healthy" headingLevel="h4">
          <EmptyStateBody>No unhealthy clusters detected. Great job!</EmptyStateBody>
        </EmptyState>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h3 style={{ marginBottom: '16px', color: '#333', fontSize: '14px', fontWeight: 'bold' }}>
        <ExclamationCircleIcon style={{ color: '#c9190b', marginRight: '8px' }} />
        Unhealthy Clusters ({unhealthyClusters.length})
      </h3>
      <div style={{ maxHeight: '250px', overflow: 'auto' }}>
        <Table aria-label="Unhealthy clusters table" variant="compact">
          <Thead>
            <Tr>
              <Th>Cluster Name</Th>
              <Th>Cloud</Th>
              <Th>Version</Th>
              <Th>Critical Alerts</Th>
              <Th>Failing Operators</Th>
            </Tr>
          </Thead>
          <Tbody>
            {unhealthyClusters.slice(0, 10).map((cluster) => (
              <Tr key={cluster.id}>
                <Td dataLabel="Cluster Name">
                  <span style={{ fontWeight: 500 }}>{cluster.displayName}</span>
                </Td>
                <Td dataLabel="Cloud">
                  <Label isCompact color="blue">
                    {cluster.cloudProvider.toUpperCase()}
                  </Label>
                </Td>
                <Td dataLabel="Version">{cluster.openshiftVersion}</Td>
                <Td dataLabel="Critical Alerts">
                  {cluster.criticalAlerts > 0 ? (
                    <Label isCompact color="red">
                      {cluster.criticalAlerts}
                    </Label>
                  ) : (
                    <span style={{ color: '#666' }}>0</span>
                  )}
                </Td>
                <Td dataLabel="Failing Operators">
                  {cluster.operatorsConditionFailing > 0 ? (
                    <Label isCompact color="orange">
                      {cluster.operatorsConditionFailing}
                    </Label>
                  ) : (
                    <span style={{ color: '#666' }}>0</span>
                  )}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </div>
      {unhealthyClusters.length > 10 && (
        <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '12px', color: '#666' }}>
          Showing 10 of {unhealthyClusters.length} unhealthy clusters
        </div>
      )}
    </div>
  );
};

export default UnhealthyClustersTable;
