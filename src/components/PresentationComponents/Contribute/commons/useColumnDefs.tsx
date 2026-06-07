/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from 'react';

import dayjs from 'dayjs';

import ActionCellRenderer from './ActionCellRenderer';
import StatusCellRenderer from './StatusCellRenderer';

export const useColumnDefs = () => {
  return useMemo(
    () =>
      [
        {
          headerName: 'Comments',
          field: 'comments' as string,
          valueGetter: (params: any) =>
            params.data?.changeSet?.comments || params.data?.comments || '—',
          tooltipValueGetter: (params: any) =>
            params.data?.changeSet?.comments || params.data?.comments || '—',
          width: 200,
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
          headerName: 'Voyage ID',
          field: 'voyage_id' as any,
          tooltipValueGetter: (params: any) =>
            `Voyage ID: ${params.data?.voyage_id}`,
          valueGetter: (params: any) => {
            return params.data?.voyage_id || params.data?.voyage_id || '';
          },
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
          headerName: 'Contributor',
          field: 'author' as any,
          valueGetter: (params: any) =>
            params.data?.changeSet?.author || params.data?.author || '—',
          tooltipValueGetter: (params: any) =>
            params.data?.changeSet?.author || params.data?.author || '—',
          width: 200,
          sortable: true,
        },
        {
          headerName: 'Date',
          field: 'timestamp' as any,
          valueGetter: (p: any) => p.data?.timestamp,
          valueFormatter: ({ value }: { value: number }) =>
            value && dayjs(value).isValid()
              ? dayjs(value).format('MM/DD/YYYY')
              : '—',
          width: 100,
          sort: 'desc',
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
          width: 180,
          flex: 1,
          sortable: true,
        },
      ] as any[],
    [],
  );
};

export const useColumnNewVoyagesDefs = (
  onEdit?: (data: any) => void,
  onDelete?: (contributionId: string) => Promise<void>,
) => {
  return useMemo(
    () =>
      [
        {
          headerName: 'Voyage ID(s)',
          field: 'voyage_id' as any,
          valueGetter: (params: any) => {
            return params.data?.voyage_id || params.voyage_id || '-';
          },
          tooltipValueGetter: (params: any) =>
            `Voyage ID: ${params.data?.voyage_id}`,
          sortable: true,
          flex: 1,
        },
        {
          headerName: 'Comments',
          field: 'comments' as any,
          valueGetter: (params: any) =>
            params.data?.changeSet?.comments || params.data?.comments || '—',
          tooltipValueGetter: (params: any) =>
            params.data?.changeSet?.comments || params.data?.comments || '—',
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
          headerName: 'Status',
          field: 'status' as any,
          cellRenderer: StatusCellRenderer,
          flex: 1,
          sortable: true,
        },
        {
          headerName: 'Date',
          field: 'timestamp' as any,
          valueGetter: (p: any) => p.data?.timestamp,
          valueFormatter: ({ value }: { value: number }) =>
            value && dayjs(value).isValid()
              ? dayjs(value).format('MM/DD/YYYY')
              : '—',
          width: 200,
          sort: 'desc',
        },
        {
          headerName: 'Action',
          field: 'action' as any,
          cellRenderer: ActionCellRenderer,
          cellRendererParams: {
            onEdit,
            onDelete,
          },
          width: 120,
          sortable: false,
        },
      ] as any[],
    [onEdit, onDelete],
  );
};
