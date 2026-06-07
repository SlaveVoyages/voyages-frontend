/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useMemo, useRef, useState } from 'react';

import { EditOutlined, FileAddOutlined } from '@ant-design/icons';
import { Box } from '@mui/material';
import { ContributionStatus } from '@slavevoyages/voyages-contribute';
import { AgGridReact } from 'ag-grid-react';
import { Alert, Input, Pagination, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';

const MIN_VALID_TIMESTAMP = new Date('2000-01-01').getTime();

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import '@/style/table.scss';

import ListEditorialPlatForm from '../commons/ListEditorialPlatForm';
import {
  MOCK_PENDING_CONTRIBUTIONS,
  PendingContribution,
} from '../mockData/pendingContributions';
import DrawerVoyageById from './editVoyages/DrawerVoyageById';

const { Title } = Typography;
const { Search } = Input;

// ── Main component ───────────────────────────────────────────────────────────
const EditVoyages: React.FC = () => {
  const gridRef = useRef<any>(null);

  const [contribs, setContribs] = useState<PendingContribution[]>(
    MOCK_PENDING_CONTRIBUTIONS,
  );
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<PendingContribution | null>(null);

  // ── Actions ─────────────────────────────────────────────────────────────
  const handleAccept = useCallback((id: string) => {
    setContribs((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: ContributionStatus.Accepted } : c,
      ),
    );
  }, []);

  const handleReject = useCallback((id: string) => {
    setContribs((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: ContributionStatus.Rejected } : c,
      ),
    );
  }, []);

  // ── Filtered data ────────────────────────────────────────────────────────
  const filteredContribs = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return contribs;
    return contribs.filter(
      (c) =>
        String(c.voyage_id).includes(q) ||
        c.shipName?.toLowerCase().includes(q) ||
        c.nationality?.toLowerCase().includes(q) ||
        c.changeSet?.author?.toLowerCase().includes(q) ||
        c.changeSet?.title?.toLowerCase().includes(q) ||
        c.majorPlaceOfPurchase?.toLowerCase().includes(q) ||
        c.majorPlaceOfLanding?.toLowerCase().includes(q) ||
        String(c.year ?? '').includes(q),
    );
  }, [contribs, search]);

  const pendingCount = useMemo(
    () =>
      contribs.filter((c) => c.status === ContributionStatus.Submitted).length,
    [contribs],
  );

  // ── Column definitions ───────────────────────────────────────────────────
  const columnDefs = useMemo(
    () =>
      [
        // 1. Voyage ID
        {
          headerName: 'Voyage ID',
          field: 'voyage_id',
          width: 110,
          sortable: true,
        },
        // 2. Type — clicks here should NOT open the drawer
        {
          headerName: 'Type',
          field: 'type',
          colId: 'type',
          width: 70,
          sortable: true,
          cellRenderer: (params: any) => {
            const isNew = params.value === 'new';
            return (
              <Tooltip title={isNew ? 'New Voyage' : 'Edit Existing Voyage'}>
                <span
                  style={{
                    fontSize: 16,
                    color: '#37948d',
                    display: 'inline-block',
                    marginTop: 6,
                    cursor: 'default',
                  }}
                >
                  {isNew ? <FileAddOutlined /> : <EditOutlined />}
                </span>
              </Tooltip>
            );
          },
        },
        // 3. Ship
        {
          headerName: 'Ship',
          field: 'shipName',
          width: 180,
          sortable: true,
          tooltipField: 'shipName',
        },
        // 4. Year
        {
          headerName: 'Year',
          field: 'year',
          width: 75,
          sortable: true,
        },
        // 5. Nation
        {
          headerName: 'Nation',
          field: 'nationality',
          width: 120,
          sortable: true,
          tooltipField: 'nationality',
        },
        // 6. Exported
        {
          headerName: 'Exported',
          field: 'exported',
          width: 100,
          sortable: true,
          cellStyle: { textAlign: 'right' },
          valueFormatter: ({ value }: { value: number | string }) =>
            value != null ? Number(value).toLocaleString() : '—',
        },
        // 7. Imported
        {
          headerName: 'Imported',
          field: 'imported',
          width: 100,
          sortable: true,
          cellStyle: { textAlign: 'right' },
          valueFormatter: ({ value }: { value: number | string }) =>
            value != null ? Number(value).toLocaleString() : '—',
        },
        // 8. Major place of purchase
        {
          headerName: 'Major place of purchase',
          field: 'majorPlaceOfPurchase',
          flex: 1,
          minWidth: 160,
          sortable: true,
          tooltipField: 'majorPlaceOfPurchase',
        },
        // 9. Major place of landing
        {
          headerName: 'Major place of landing',
          field: 'majorPlaceOfLanding',
          flex: 1,
          minWidth: 160,
          sortable: true,
          tooltipField: 'majorPlaceOfLanding',
        },
        // 10. Contributor
        {
          headerName: 'Contributor',
          field: 'contributor',
          valueGetter: (p: any) => p.data?.changeSet?.author || '—',
          tooltipValueGetter: (p: any) => p.data?.changeSet?.author || '',
          width: 180,
          sortable: true,
        },
        // 11. Date
        {
          headerName: 'Date',
          field: 'timestamp',
          valueGetter: (p: any) => {
            const ts = p.data?.changeSet?.timestamp;
            return ts && ts >= MIN_VALID_TIMESTAMP ? ts : 0;
          },
          valueFormatter: ({ value }: { value: number }) =>
            value ? dayjs(value).format('YYYY-MM-DD') : '—',
          width: 115,
          sort: 'desc' as const,
        },
      ] as any[],
    [],
  );

  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      resizable: true,
      filter: false,
      cellStyle: { paddingTop: '10px', fontSize: '13px' },
    }),
    [],
  );

  const getRowStyle = useCallback(
    () => ({
      fontSize: '0.8rem',
      fontWeight: 500,
      color: '#000',
      fontFamily: 'sans-serif',
      cursor: 'pointer',
    }),
    [],
  );

  // ── Row click → skip Type column, open detail drawer ────────────────────
  const handleRowClick = useCallback(({ data, event }: any) => {
    if (!data || !event) return;
    const target = event.target as HTMLElement;
    const colId = target.closest('.ag-cell')?.getAttribute('col-id') ?? '';

    // Skip the Type icon column — all other columns open the drawer
    if (colId !== 'type') return;

    setSelected(data);
    setDrawerOpen(true);
  }, []);

  // ── Pagination ───────────────────────────────────────────────────────────
  const handlePageChange = useCallback(
    (newPage: number, pageSize?: number) => {
      setPage(newPage);
      if (pageSize && pageSize !== rowsPerPage) {
        setRowsPerPage(pageSize);
      }
      gridRef.current?.api.paginationGoToPage(newPage - 1);
    },
    [rowsPerPage],
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value);
      setPage(1);
    },
    [],
  );

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <Box sx={{ pr: 4, pl: 2, pb: 4, width: '100%' }}>
      <ListEditorialPlatForm />

      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          borderRadius: '12px 12px 4px 4px',
          padding: '12px',
          marginBottom: '12px',
          border: '1px solid #e8f0fe',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <Title level={2} style={{ margin: 0, color: '#333' }}>
              Edit Voyages
            </Title>
            <div style={{ marginTop: '4px', color: '#6b7280' }}>
              {pendingCount} contribution{pendingCount !== 1 ? 's' : ''}{' '}
              awaiting review
            </div>
          </div>
          <Search
            placeholder="Search voyage, ship, place, contributor..."
            value={search}
            onChange={handleSearchChange}
            onSearch={(val) => setSearch(val)}
            style={{ width: 340 }}
            allowClear
          />
        </div>
      </div>

      {/* Demo mode banner */}
      <Alert
        type="info"
        showIcon
        message="Demo Mode — Mock Data"
        description="This page uses mock data while the backend is under development. Accept / Reject actions update local state only."
        style={{ marginBottom: 12, borderRadius: 8 }}
        closable
      />

      {/* Table */}
      <div
        className="ag-theme-alpine compact-table"
        style={{
          height: 'calc(90vh - 370px)',
          width: '100%',
          border: '1px solid #d9d9d9',
          borderRadius: 12,
          boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
        }}
      >
        <AgGridReact<any>
          theme="legacy"
          ref={gridRef}
          rowData={filteredContribs}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          getRowStyle={getRowStyle}
          enableBrowserTooltips
          paginationPageSize={rowsPerPage}
          pagination
          suppressPaginationPanel
          onRowClicked={handleRowClick}
          getRowClass={(params: any) =>
            params.rowIndex % 2 === 0 ? 'even-row' : 'odd-row'
          }
          headerHeight={36}
          rowHeight={42}
        />
      </div>

      {/* Pagination */}
      <div
        style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}
      >
        <Pagination
          current={page}
          total={filteredContribs.length}
          pageSize={rowsPerPage}
          showSizeChanger
          showTotal={(total, range) =>
            `Showing ${range[0]}–${range[1]} of ${total} contributions`
          }
          pageSizeOptions={['5', '10', '20', '50']}
          onChange={handlePageChange}
          onShowSizeChange={handlePageChange}
          style={{ margin: 0 }}
        />
      </div>

      {/* Detail drawer — voyage comparison */}
      <DrawerVoyageById
        selected={selected}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onAccept={handleAccept}
        onReject={handleReject}
      />
    </Box>
  );
};

export default EditVoyages;
