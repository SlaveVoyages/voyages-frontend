import { useQuery } from 'react-query';

import { fetchInstitutionData } from '@/fetch/blogFetch/fetchInstitutionData';
import { BlogDataPropsRequest } from '@/share/InterfaceTypesBlog';

export const useInstitutionAuthor = (dataSend: BlogDataPropsRequest) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['institutionAuthor', dataSend],
    queryFn: () => fetchInstitutionData(dataSend),
  });
  return { data, isLoading, isError };
};
