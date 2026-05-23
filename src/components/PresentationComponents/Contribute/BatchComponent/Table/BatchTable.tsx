/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useCallback } from 'react';

import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import {
  Box,
  IconButton,
  Chip,
  Typography as MuiTypography,
} from '@mui/material';
import { PublicationBatch } from '@slavevoyages/voyages-contribute';
import { AgGridReact } from 'ag-grid-react';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

interface BatchTableProps {
  batches: PublicationBatch[];
  loading: boolean;
  onEditBatch?: (batch: PublicationBatch) => void;
  onDeleteBatch?: (batch: PublicationBatch) => void;
}

// Custom cell renderers
const TitleCellRenderer = (params: any) => {
  const batch = params.data;
  return (
    <Box>
      <MuiTypography variant="subtitle2" sx={{ fontWeight: 600 }}>
        {batch.title}
      </MuiTypography>
    </Box>
  );
};

// Custom cell renderers
const BatchIDCellRenderer = (params: any) => {
  const batch = params.data;
  return (
    <Box>
      <MuiTypography variant="subtitle2" sx={{ fontWeight: 600 }}>
        {batch.id}
      </MuiTypography>
    </Box>
  );
};
const StatusCellRenderer = (params: any) => {
  const batch = params.data;
  const isPublished = batch.published !== null;

  return (
    <Chip
      label={isPublished ? 'Published' : 'Pending'}
      color={isPublished ? 'success' : 'warning'}
      size="small"
      sx={{ fontSize: '0.75rem' }}
    />
  );
};

const PublishedDateCellRenderer = (params: any) => {
  const batch = params.data;
  return (
    <MuiTypography variant="body2">
      {batch.published
        ? new Date(batch.published).toLocaleDateString()
        : 'Not published'}
    </MuiTypography>
  );
};

const ContributionsCellRenderer = (params: any) => {
  const count = params.data?.contributions?.length || 0;
  return (
    <Chip
      label={count}
      color={count > 0 ? 'primary' : 'default'}
      size="small"
      sx={{ fontSize: '0.75rem' }}
    />
  );
};

const CommentsCellRenderer = (params: any) => {
  const comments = params.data.comments || 'No comments';
  return (
    <MuiTypography
      variant="body2"
      sx={{
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
      title={comments}
    >
      {comments}
    </MuiTypography>
  );
};

const ActionsCellRenderer = (
  params: any,
  onEditBatch?: (batch: PublicationBatch) => void,
  onDeleteBatch?: (batch: PublicationBatch) => void,
) => {
  const batch = params.data;

  const handleEdit = () => {
    if (onEditBatch) {
      onEditBatch(batch);
    }
  };

  const handleDelete = () => {
    if (onDeleteBatch) {
      onDeleteBatch(batch);
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', height: '100%' }}>
      <IconButton size="small" onClick={handleEdit} title="Edit batch">
        <EditOutlined style={{ fontSize: '16px' }} />
      </IconButton>
      <IconButton
        size="small"
        color="error"
        onClick={handleDelete}
        title="Delete batch"
      >
        <DeleteOutlined style={{ fontSize: '16px' }} />
      </IconButton>
    </Box>
  );
};

const BatchTable: React.FC<BatchTableProps> = ({
  batches,
  loading,
  onEditBatch,
  onDeleteBatch,
}) => {
  const columnDefs = useMemo(
    () => [
      {
        headerName: 'ID',
        field: 'id',
        cellRenderer: BatchIDCellRenderer,
        width: 80,
        minWidth: 80,
        sortable: true,
      },
      {
        headerName: 'Title',
        field: 'title',
        cellRenderer: TitleCellRenderer,
        width: 200,
        minWidth: 120,
        flex: 1,
        sortable: true,
      },
      {
        headerName: 'Status',
        field: 'published',
        cellRenderer: StatusCellRenderer,
        width: 120,
        sortable: true,
        filterParams: {
          values: ['Published', 'Pending'],
          valueGetter: (params: any) => {
            return params.data.published !== null ? 'Published' : 'Pending';
          },
        },
      },
      {
        headerName: 'Published Date',
        field: 'published',
        cellRenderer: PublishedDateCellRenderer,
        width: 150,
        sortable: true,
        comparator: (valueA: any, valueB: any) => {
          // Custom comparator for published dates
          const dateA = valueA ? new Date(valueA).getTime() : 0;
          const dateB = valueB ? new Date(valueB).getTime() : 0;
          return dateA - dateB;
        },
      },
      {
        headerName: 'Contributions',
        field: 'contribution_count',
        cellRenderer: ContributionsCellRenderer,
        width: 120,
        sortable: true,
      },
      {
        headerName: 'Comments',
        field: 'comments',
        cellRenderer: CommentsCellRenderer,
        width: 150,
        flex: 1,
        sortable: true,
      },
      {
        headerName: 'Actions',
        field: 'actions',
        cellRenderer: (params: any) =>
          ActionsCellRenderer(params, onEditBatch, onDeleteBatch),
        width: 110,
        sortable: false,
        filter: false,
        resizable: false,
        pinned: 'right',
      },
    ],
    [onEditBatch, onDeleteBatch],
  );

  const defaultColDef = useMemo(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
      floatingFilter: false,
      cellStyle: {
        display: 'flex',
        alignItems: 'center',
        fontSize: '13px',
      },
    }),
    [],
  );

  const gridOptions = useMemo(
    () => ({
      animateRows: true,
      headerHeight: 45,
      suppressMovableColumns: true,
      suppressFieldDotNotation: true,
    }),
    [],
  );

  const onGridReady = useCallback((params: any) => {
    params.api.sizeColumnsToFit();
  }, []);

  const onFirstDataRendered = useCallback((params: any) => {
    params.api.sizeColumnsToFit();
  }, []);

  return (
    <Box
      className="ag-theme-alpine"
      sx={{
        height: '400px',
        width: '100%',
        overflowY: 'auto',
        '& .ag-header-cell': {
          fontWeight: 600,
        },
        '& .ag-row': {
          cursor: 'default',
        },
        '& .ag-row:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.04)',
        },
      }}
    >
      <AgGridReact
        theme="legacy"
        key={`batch-table-${batches.length}`}
        // ref={gridRef}
        columnDefs={columnDefs as any}
        rowData={batches}
        defaultColDef={defaultColDef}
        gridOptions={gridOptions}
        loading={loading}
        onGridReady={onGridReady}
        onFirstDataRendered={onFirstDataRendered}
        pagination={true}
        paginationPageSize={10}
        paginationPageSizeSelector={[5, 10, 20, 50]}
        suppressPaginationPanel={false}
        enableBrowserTooltips={true}
        noRowsOverlayComponent={() => (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'text.secondary',
            }}
          >
            <MuiTypography variant="h6" sx={{ mb: 1 }}>
              No batches found
            </MuiTypography>
            <MuiTypography variant="body2">
              Create your first batch to get started
            </MuiTypography>
          </Box>
        )}
      />
    </Box>
  );
};

export default BatchTable;
