import { ContribuitLocation } from '@/share/InterfaceTypes';
import { useEnumeration, UseEnumerationOptions } from './useEnumeration';
import { fetchTreeSelectedContributeLocation } from '@/fetch/contributeFetch/fetchTreeSelectedContributeLocation';

export const useTreeSelectContributeLocation = (
  options?: UseEnumerationOptions,
) => {
  const {
    items: locationsList,
    loading,
    error,
  } = useEnumeration<ContribuitLocation>(
    'ContributeLocationTree',
    fetchTreeSelectedContributeLocation,
    options,
  );
  return { locationsList, loading, error };
};
