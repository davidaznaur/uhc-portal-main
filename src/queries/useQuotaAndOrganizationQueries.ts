import { useMutation, useQueries, useQuery } from '@tanstack/react-query';

import { normalizeQuotaCost } from '~/common/normalize';
import { accountsService, authorizationsService } from '~/services';
import { formatErrorData } from '~/queries/helpers';
import type { Organization, QuotaCost, QuotaCostList } from '~/types/accounts_mgmt.v1';
import type { AxiosResponse } from 'axios';

const processQuota = (
  response: AxiosResponse<QuotaCostList>,
): {
  items?: QuotaCost[] | undefined;
} => ({
  items: (response.data?.items ?? []).map(normalizeQuotaCost),
});

export const useOrganizationQuota = (organizationID: string, enabled: boolean = true) => {
  const { data, isLoading, isPending, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['organizationQuota', organizationID],
    queryFn: async () => {
      const response = await accountsService.getOrganizationQuota(organizationID);
      return processQuota(response);
    },
    enabled: enabled && !!organizationID,
  });

  if (isError) {
    const formattedError = formatErrorData(isPending, isError, error);

    return {
      data: undefined,
      isLoading,
      isPending,
      isFetching,
      isError,
      error: formattedError.error,
      refetch,
    };
  }

  return {
    data,
    isLoading,
    isPending,
    isFetching,
    isError,
    error,
    refetch,
  };
};

export const useOrganization = (organizationID: string, enabled: boolean = true) => {
  const { data, isLoading, isPending, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['organization', organizationID],
    queryFn: async () => {
      const response = await accountsService.getOrganization(organizationID);
      return response.data;
    },
    enabled: enabled && !!organizationID,
  });

  if (isError) {
    const formattedError = formatErrorData(isPending, isError, error);

    return {
      data: undefined,
      isLoading,
      isPending,
      isFetching,
      isError,
      error: formattedError.error,
      refetch,
    };
  }

  return {
    data,
    isLoading,
    isPending,
    isFetching,
    isError,
    error,
    refetch,
  };
};

export const useQuotaAndOrganization = (
  organizationID: string,
  organization?: Organization,
  enabled: boolean = true,
) => {
  const results = useQueries({
    queries: [
      {
        queryKey: ['organizationQuota', organizationID],
        queryFn: async () => {
          const response = await accountsService.getOrganizationQuota(organizationID);
          return processQuota(response);
        },
        enabled: enabled && !!organizationID,
      },
      {
        queryKey: ['organization', organizationID],
        queryFn: async () => {
          if (organization) {
            return organization;
          }
          const response = await accountsService.getOrganization(organizationID);
          return response.data;
        },
        enabled: enabled && !!organizationID,
      },
    ],
  });

  const [quotaQuery, organizationQuery] = results;

  const isLoading = quotaQuery.isLoading || organizationQuery.isLoading;
  const isPending = quotaQuery.isPending || organizationQuery.isPending;
  const isFetching = quotaQuery.isFetching || organizationQuery.isFetching;
  const isError = quotaQuery.isError || organizationQuery.isError;
  const error = quotaQuery.error || organizationQuery.error;

  if (isError) {
    const formattedError = formatErrorData(isPending, isError, error);

    return {
      data: undefined,
      quota: undefined,
      organization: undefined,
      isLoading,
      isPending,
      isFetching,
      isError,
      error: formattedError.error,
      refetch: () => {
        quotaQuery.refetch();
        organizationQuery.refetch();
      },
    };
  }

  return {
    data:
      quotaQuery.data && organizationQuery.data
        ? {
            quota: quotaQuery.data,
            organization: organizationQuery.data,
          }
        : undefined,
    quota: quotaQuery.data,
    organization: organizationQuery.data,
    isLoading,
    isPending,
    isFetching,
    isError,
    error,
    refetch: () => {
      quotaQuery.refetch();
      organizationQuery.refetch();
    },
  };
};

export const useCurrentAccount = (enabled: boolean = true) => {
  const { data, isLoading, isPending, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['currentAccount'],
    queryFn: async () => {
      const response = await accountsService.getCurrentAccount();
      return response.data;
    },
    enabled,
  });

  if (isError) {
    const formattedError = formatErrorData(isPending, isError, error);

    return {
      data: undefined,
      isLoading,
      isPending,
      isFetching,
      isError,
      error: formattedError.error,
      refetch,
    };
  }

  return {
    data,
    isLoading,
    isPending,
    isFetching,
    isError,
    error,
    refetch,
  };
};

export const useAccountQuotaAndOrganization = (enabled: boolean = true) => {
  const { data, isLoading, isPending, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['accountQuotaAndOrganization'],
    queryFn: async () => {
      const accountResponse = await accountsService.getCurrentAccount();
      const organizationID = accountResponse.data?.organization?.id;

      if (!organizationID) {
        throw new Error('No organization');
      }

      const [quotaResponse, organizationResponse] = await Promise.all([
        accountsService.getOrganizationQuota(organizationID),
        accountsService.getOrganization(organizationID),
      ]);

      return {
        quota: processQuota(quotaResponse),
        organization: organizationResponse.data,
      };
    },
    enabled,
  });

  if (isError) {
    const formattedError = formatErrorData(isPending, isError, error);

    return {
      data: undefined,
      quota: undefined,
      organization: undefined,
      isLoading,
      isPending,
      isFetching,
      isError,
      error: formattedError.error,
      refetch,
    };
  }

  return {
    data,
    quota: data?.quota,
    organization: data?.organization,
    isLoading,
    isPending,
    isFetching,
    isError,
    error,
    refetch,
  };
};

export const useSelfTermsReview = () => {
  const { data, mutate, mutateAsync, isPending, isError, error } = useMutation({
    mutationKey: ['selfTermsReview'],
    mutationFn: async () => {
      const response = await authorizationsService.selfTermsReview();
      return response;
    },
  });

  if (isError) {
    const formattedError = formatErrorData(isPending, isError, error);

    return {
      data: undefined,
      isPending,
      isError,
      mutate,
      mutateAsync,
      error: formattedError.error,
    };
  }

  return {
    data,
    isPending,
    isError,
    error,
    mutate,
    mutateAsync,
  };
};
