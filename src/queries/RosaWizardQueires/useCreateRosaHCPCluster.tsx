import { useMutation } from '@tanstack/react-query';
import { clusterService } from '~/services';

export const useCreateRosaHCPCluster = () => {
  const { isSuccess, isError, isPending, mutate, reset } = useMutation({
    mutationKey: ['clusterService', 'createROSAHCPCluster'],
    mutationFn: ({ cluster }: { cluster: any }) => {
      return clusterService.postNewCluster(cluster);
    },
  });

  return {
    isSuccess,
    isError,
    isPending,
    mutate,
    reset,
  };
};
