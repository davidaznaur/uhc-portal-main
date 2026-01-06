import { useMutation } from '@tanstack/react-query';
import { accountsService } from '~/services';

export const useMutateAccountRoles = () => {
  const { data, isSuccess, isPending, mutateAsync, reset } = useMutation({
    mutationKey: ['clusterService', 'rosaWizardFetchAccountRoles'],
    mutationFn: ({ accountId }: { accountId: string }) => {
      return accountsService.getAWSAccountARNs(accountId);
    },
  });
  console.log('DATA', data);

  return {
    data: data?.data.items,
    isSuccess,
    isPending,
    mutateAsync,
    reset,
  };
};
