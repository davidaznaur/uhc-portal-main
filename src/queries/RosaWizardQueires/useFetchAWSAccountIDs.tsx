import { useQuery } from '@tanstack/react-query';
import { accountsService } from '~/services';

const extractAWSID = (arn: string): string => {
  // Ex: arn = 'arn:aws:iam::268733382466:role/ManagedOpenShift-OCM-Role-15212158'
  // '268733382466' above ^^ is an example AWS account ID
  const arnSegment = arn.substr(arn.indexOf('::') + 2);
  return arnSegment.substr(0, arnSegment.indexOf(':'));
};

export const getAWSIDsFromARNs = (arns: any) => {
  const ids = arns.map(extractAWSID);
  return [...new Set(ids)]; // convert to Set to remove duplicates, spread to convert back to array
};

const fetchAWSAccountIDs = async (organizationID: string) => {
  const response = await accountsService.getOrganizationLabels(organizationID);
  console.log('response1', response);
  if (!response.data || !response.data.items) {
    return [];
  }

  const stsOCMRoleLabel = response.data.items.find((label) => label.key === 'sts_ocm_role');

  const stsOCMRoleValue = stsOCMRoleLabel?.value ?? '';
  const arns = stsOCMRoleValue === '' ? [] : stsOCMRoleValue.split(',');

  const awsAccountIDs = getAWSIDsFromARNs(arns);

  return awsAccountIDs;
};

export const useFetchAWSAccountIDs = (organizationID: string) => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['accountService', organizationID],
    queryFn: () => fetchAWSAccountIDs(organizationID),
    enabled: !!organizationID,
  });

  return {
    data,
    isLoading,
    isError,
    error,
  };
};
