/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from 'react';

import { ContributionStatus } from '@dotproductdev/voyages-contribute';
import dayjs from 'dayjs';

import StatusCellRenderer from './StatusCellRenderer';

export const useColumnDefs = (
  handleStatusChange: (
    contributionId: string,
    newStatus: ContributionStatus,
    comment?: string,
  ) => Promise<void>,
) => {
  return useMemo(
    () =>
      [
        {
          headerName: 'Title',
          field: 'title' as string,
          tooltipField: 'title',
          width: 200,
          sortable: true,
        },
        {
          headerName: 'Comments',
          field: 'comments' as string,
          tooltipField: 'comments',
          width: 250,
          sortable: true,
        },
        {
          headerName: 'Batch',
          field: 'batch' as string,
          tooltipField: 'batch',
          valueGetter: (params: any) => {
            return (
              params.data?.batch?.title || params.data?.batch || 'Unassigned'
            );
          },
          width: 180,
          sortable: true,
        },
        {
          headerName: 'Date',
          field: 'timestamp' as any,
          valueFormatter: ({ value }: { value: number }) =>
            dayjs(value).format('MM/DD/YYYY'),
          width: 100,
          // sort: 'desc',
        },
        {
          headerName: 'Voyage ID',
          field: 'voyage_id' as any,
          tooltipValueGetter: (params: any) =>
            `Voyage ID: ${params.data?.voyage_id}`,
          width: 120,
          sortable: true,
        },
        {
          headerName: 'Ship',
          field: 'shipName' as any,
          width: 150,
          tooltipField: 'shipName',
          sortable: true,
        },
        {
          headerName: 'Port of Departure',
          field: 'portOfDeparture' as any,
          tooltipField: 'portOfDeparture',
          width: 200,
          sortable: true,
        },
        {
          headerName: 'Nationality',
          field: 'nationality' as any,
          width: 120,
          flex: 1,
          tooltipField: 'nationality',
          sortable: true,
        },
        {
          headerName: 'Reviewer',
          field: undefined as any,
          valueGetter: () => 'David Ellis',
          width: 120,
          flex: 1,
          sortable: true,
        },
        {
          headerName: 'Status & Actions',
          field: 'status' as any,
          cellRenderer: StatusCellRenderer,
          cellRendererParams: (params: any) => ({
            onStatusChange: handleStatusChange,
            data: params.data,
          }),
          width: 180,
          flex: 1,
          sortable: true,
        },
      ] as any[],
    [handleStatusChange],
  );
};

export const useColumnNewVoyagesDefs = () => {
  return useMemo(
    () =>
      [
        {
          headerName: 'Voyage ID(s)',
          field: 'voyage_id' as any,
          tooltipValueGetter: (params: any) =>
            `Voyage ID: ${params.data?.voyage_id}`,
          sortable: true,
          flex: 1,
        },
        {
          headerName: 'Type of contribution',
          field: 'type' as string,
          tooltipField: 'type',
          flex: 1,
          sortable: true,
        },

        {
          headerName: 'Status & Actions',
          field: 'status' as any,
          cellRenderer: StatusCellRenderer,
          flex: 1,
          sortable: true,
        },
      ] as any[],
    [],
  );
};
