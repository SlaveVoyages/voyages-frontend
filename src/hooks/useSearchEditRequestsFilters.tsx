/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useMemo, useState } from 'react';

import { ContributionStatus } from '@slavevoyages/voyages-contribute';
import { Dayjs } from 'dayjs';
import { useSelector } from 'react-redux';

import { RootState } from '@/redux/store';

// Types
export interface ContributionFilters {
  status?: ContributionStatus;
  author: string;
  voyageId: string;
  shipName: string;
  nationality: string;
  dateRange: [Dayjs | null, Dayjs | null] | null;
  publicationBatch: number | string;
  reviewer: string;
  search?: string;
}

const initialFilters: ContributionFilters = {
  status: undefined,
  author: '',
  voyageId: '',
  shipName: '',
  nationality: '',
  dateRange: null,
  publicationBatch: '',
  reviewer: '',
  search: '',
};
export interface NewVoyagesFilters {
  author?: string;
}

// Custom hooks
export const useSearchEditRequestsFilters = (form: any, gridRef?: any) => {
  const { user } = useSelector((state: RootState) => state.getAuthUserSlice);
  const [newVoyagesFilters, setNewVoyagesFilters] = useState<NewVoyagesFilters>(
    { author: user?.email },
  );

  const buildNewVoyagesFilterQuery = useCallback((): string => {
    const params = new URLSearchParams();
    params.append('status', '0');
    if (user?.email) params.append('author', user.email);
    return params.toString();
  }, [user?.email]);
  const [filters, setFilters] = useState<ContributionFilters>(initialFilters);

  const buildExisingVoyagesFilterQuery = useCallback((): string => {
    const params = new URLSearchParams();
    params.append('status', '0');
    if (user?.email) params.append('author', user.email);
    return params.toString();
  }, [user?.email]);

  const buildFilterQuery = useCallback(
    (filters: ContributionFilters): string => {
      const params = new URLSearchParams();

      if (filters.status !== undefined)
        params.append('status', String(filters.status));

      if (filters.author) params.append('author', String(filters.author));
      if (filters.voyageId) params.append('voyageId', String(filters.voyageId));
      if (filters.shipName) params.append('shipName', String(filters.shipName));
      if (filters.nationality)
        params.append('nationality', filters.nationality);
      if (filters.publicationBatch)
        params.append('publicationBatch', String(filters.publicationBatch));
      if (filters.reviewer) params.append('reviewer', filters.reviewer);
      if (filters.search) params.append('search', filters.search);
      if (filters.dateRange?.[0])
        params.append('dateFrom', filters.dateRange[0].toISOString());
      if (filters.dateRange?.[1])
        params.append('dateTo', filters.dateRange[1].toISOString());

      return params.toString();
    },
    [],
  );

  const handleFilterChange = useCallback(
    (field: keyof ContributionFilters, value: any) => {
      setFilters((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleClearFilters = useCallback(() => {
    setFilters(initialFilters);
    form.resetFields();
    gridRef?.current?.api.refreshInfiniteCache();
  }, [form, gridRef]);

  const handleApplyFilters = useCallback(() => {
    gridRef?.current?.api.refreshInfiniteCache();
  }, [gridRef]);

  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(([key, value]) => {
      if (key === 'status') return value !== undefined;
      if (key === 'dateRange')
        return value !== null && (value[0] !== null || value[1] !== null);
      return value !== '';
    });
  }, [filters]);

  const activeFilterCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => {
      if (key === 'status') return value !== undefined;
      if (key === 'dateRange')
        return value !== null && (value[0] !== null || value[1] !== null);
      return value !== '';
    }).length;
  }, [filters]);

  return {
    filters,
    setFilters,
    buildFilterQuery,
    handleFilterChange,
    handleClearFilters,
    handleApplyFilters,
    hasActiveFilters,
    activeFilterCount,
    buildNewVoyagesFilterQuery,
    newVoyagesFilters,
    setNewVoyagesFilters,
    buildExisingVoyagesFilterQuery,
  };
};
