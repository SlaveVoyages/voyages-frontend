/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useMemo, useRef, useState } from 'react';

import {
  DeleteOutlined,
  EditOutlined,
  FileAddOutlined,
  MergeCellsOutlined,
} from '@ant-design/icons';
import { Box } from '@mui/material';
import { ContributionStatus } from '@slavevoyages/voyages-contribute';
import { AgGridReact } from 'ag-grid-react';
import { Alert, Input, Pagination, Tag, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import '@/style/table.scss';

import ListEditorialPlatForm from '../commons/ListEditorialPlatForm';
import {
  MOCK_ENSLAVER_CONTRIBUTIONS,
  PendingEnslaverContrib,
} from '../mockData/pendingEnslavers';

const { Title } = Typography;
const { Search } = Input;

// ── Type icon ────────────────────────────────────────────────────────────────
const TypeIcon: React.FC<{ type: PendingEnslaverContrib['type'] }> = ({
  type,
}) => {
  const map = {
    edit: { icon: <EditOutlined />, title: 'Edit Enslaver' },
    merge: { icon: <MergeCellsOutlined />, title: 'Merge Enslavers' },
    new: { icon: <FileAddOutlined />, title: 'New Enslaver' },
    delete: { icon: <DeleteOutlined />, title: 'Recommend Deletion' },
  };
  const { icon, title } = map[type];
  return (
    <Tooltip title={title}>
      <span
        style={{
          fontSize: 16,
          color: '#37948d',
          display: 'inline-block',
          marginTop: 6,
          cursor: 'default',
        }}
      >
        {icon}
      </span>
    </Tooltip>
  );
};

// ── Main component ───────────────────────────────────────────────────────────
const EditEnslavers: React.FC = () => {
  const gridRef = useRef<any>(null);
  const navigate = useNavigate();

  const [contribs] = useState<PendingEnslaverContrib[]>(
    MOCK_ENSLAVER_CONTRIBUTIONS,
  );
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // ── Filtered data ─────────────────────────────────────────────────────────
  const filteredContribs = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return contribs;
    return contribs.filter(
      (c) =>
        c.enslaver.toLowerCase().includes(q) ||
        (c.enslaverMergeTarget?.toLowerCase().includes(q) ?? false) ||
        c.contributor.toLowerCase().includes(q) ||
        c.type.includes(q),
    );
  }, [contribs, search]);

  const pendingCount = useMemo(
    () =>
      contribs.filter((c) => c.status === ContributionStatus.Submitted).length,
    [contribs],
  );

  // ── Column definitions ────────────────────────────────────────────────────
  const columnDefs = useMemo(
    () =>
      [
        // 1. Type icon — clicks here do NOT open the drawer
        {
          headerName: 'Type',
          field: 'type',
          colId: 'type',
          width: 70,
          sortable: true,
          cellRenderer: ({ value }: any) => <TypeIcon type={value} />,
        },
        // 2. Enslaver name
        {
          headerName: 'Enslaver',
          field: 'enslaver',
          flex: 1,
          minWidth: 200,
          sortable: true,
          tooltipField: 'enslaver',
          valueGetter: (p: any) => {
            const c: PendingEnslaverContrib = p.data;
            if (!c) return '';
            return c.type === 'merge' && c.enslaverMergeTarget
              ? `${c.enslaver}  ···  ${c.enslaverMergeTarget}`
              : c.enslaver;
          },
          cellRenderer: (p: any) => {
            const c: PendingEnslaverContrib = p.data;
            if (!c) return null;
            if (c.type === 'merge' && c.enslaverMergeTarget) {
              return (
                <span>
                  {c.enslaver}
                  <span style={{ color: '#9ca3af', margin: '0 6px' }}>···</span>
                  <span style={{ color: '#6b7280' }}>
                    {c.enslaverMergeTarget}
                  </span>
                </span>
              );
            }
            return <span>{c.enslaver}</span>;
          },
        },
        // 3. Contributor
        {
          headerName: 'Contributor',
          field: 'contributor',
          width: 220,
          sortable: true,
          tooltipField: 'contributor',
        },
        // 4. Date
        {
          headerName: 'Date',
          field: 'timestamp',
          width: 200,
          sortable: true,
          sort: 'desc' as const,
          valueFormatter: ({ value }: { value: number }) =>
            value ? dayjs(value).format('YYYY-MM-DDTHH:mm:ss.SSS[Z]') : '—',
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

  // ── Row click → navigate to review page ──────────────────────────────────
  const handleRowClick = useCallback(
    ({ data, event }: any) => {
      if (!data || !event) return;
      const target = event.target as HTMLElement;
      const colId = target.closest('.ag-cell')?.getAttribute('col-id') ?? '';
      if (colId !== 'type') return;
      navigate(`/contribute/enslaver_contribution_review/${data.id}`);
    },
    [navigate],
  );

  // ── Pagination ────────────────────────────────────────────────────────────
  const handlePageChange = useCallback(
    (newPage: number, pageSize?: number) => {
      setPage(newPage);
      if (pageSize && pageSize !== rowsPerPage) setRowsPerPage(pageSize);
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Box style={{ paddingTop: '16px', paddingBottom: '16px', width: '100%' }}>
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
              Edit Enslavers
            </Title>
            <div style={{ marginTop: '4px', color: '#6b7280' }}>
              {pendingCount} contribution{pendingCount !== 1 ? 's' : ''}{' '}
              awaiting review
            </div>
          </div>
          <Search
            placeholder="Search enslaver, contributor, type..."
            value={search}
            onChange={handleSearchChange}
            onSearch={(val) => setSearch(val)}
            style={{ width: 340 }}
            allowClear
          />
        </div>

        {/* Type legend */}
        <div
          style={{ marginTop: 10, display: 'flex', gap: 12, flexWrap: 'wrap' }}
        >
          <span style={{ fontSize: 12, color: '#6b7280' }}>Types:</span>
          <Tag icon={<EditOutlined />} color="default">
            Edit
          </Tag>
          <Tag icon={<MergeCellsOutlined />} color="purple">
            Merge
          </Tag>
          <Tag icon={<FileAddOutlined />} color="blue">
            New
          </Tag>
          <Tag icon={<DeleteOutlined />} color="red">
            Recommend Deletion
          </Tag>
        </div>
      </div>

      {/* Demo banner */}
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
          height: 'calc(90vh - 400px)',
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
    </Box>
  );
};

export default EditEnslavers;
