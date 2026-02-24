import { useCallback, useMemo, useRef, useState } from 'react';

import { ExportOutlined, UserAddOutlined } from '@ant-design/icons';
import { Box, Button as MuiButton } from '@mui/material';
import { AgGridReact } from 'ag-grid-react';
import { Alert, Badge, Input, Pagination, Tag, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import '@/style/table.scss';

import { MOCK_USERS, UserRecord } from '../mockData/usersData';
import ListEditorialPlatForm from '../commons/ListEditorialPlatForm';

const { Title } = Typography;
const { Search } = Input;

// ── Role badge ───────────────────────────────────────────────────────────────
const RoleBadge: React.FC<{ isStaff: boolean; isSuperuser: boolean }> = ({
  isStaff,
  isSuperuser,
}) => {
  if (isSuperuser) return <Tag color="red">Superuser</Tag>;
  if (isStaff) return <Tag color="blue">Staff</Tag>;
  return <Tag color="default">Contributor</Tag>;
};

// ── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ isActive: boolean }> = ({ isActive }) =>
  isActive ? (
    <Badge status="success" text="Active" />
  ) : (
    <Badge status="error" text="Inactive" />
  );

// ── Main component ───────────────────────────────────────────────────────────
const EditUser: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gridRef = useRef<any>(null);

  const [users] = useState<UserRecord[]>(MOCK_USERS);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // ── Open Django admin ─────────────────────────────────────────────────────
  const handleOpenAdmin = () => {
    window.open(
      'https://legacy.slavevoyages.org/admin/auth/user/',
      '_blank',
      'noopener,noreferrer',
    );
  };

  // ── Filtered data ─────────────────────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q),
    );
  }, [users, search]);

  const activeCount = useMemo(
    () => users.filter((u) => u.isActive).length,
    [users],
  );

  const staffCount = useMemo(
    () => users.filter((u) => u.isStaff || u.isSuperuser).length,
    [users],
  );

  // ── Column definitions ────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columnDefs = useMemo(
    () =>
      [
        {
          headerName: 'Username',
          field: 'username',
          flex: 1,
          minWidth: 150,
          sortable: true,
          tooltipField: 'username',
        },
        {
          headerName: 'Full Name',
          field: 'firstName',
          flex: 1,
          minWidth: 160,
          sortable: true,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          valueGetter: (p: any) =>
            p.data ? `${p.data.firstName} ${p.data.lastName}` : '',
        },
        {
          headerName: 'Email',
          field: 'email',
          flex: 2,
          minWidth: 220,
          sortable: true,
          tooltipField: 'email',
        },
        {
          headerName: 'Role',
          field: 'isStaff',
          width: 130,
          sortable: true,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          cellRenderer: (p: any) =>
            p.data ? (
              <RoleBadge
                isStaff={p.data.isStaff}
                isSuperuser={p.data.isSuperuser}
              />
            ) : null,
        },
        {
          headerName: 'Status',
          field: 'isActive',
          width: 120,
          sortable: true,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          cellRenderer: (p: any) =>
            p.data ? <StatusBadge isActive={p.data.isActive} /> : null,
        },
        {
          headerName: 'Date Joined',
          field: 'dateJoined',
          width: 180,
          sortable: true,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          valueFormatter: ({ value }: { value: string }) =>
            value ? dayjs(value).format('YYYY-MM-DD') : '—',
        },
        {
          headerName: 'Last Login',
          field: 'lastLogin',
          width: 180,
          sortable: true,
          sort: 'desc' as const,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          valueFormatter: ({ value }: { value: string | null }) =>
            value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '—',
        },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    }),
    [],
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
          padding: '12px 16px',
          marginBottom: '12px',
          border: '1px solid #e8f0fe',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          {/* Left: title + stats */}
          <div>
            <Title level={2} style={{ margin: 0, color: '#333' }}>
              Users
            </Title>
            <div
              style={{
                marginTop: '6px',
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontSize: 13, color: '#6b7280' }}>
                {users.length} total users
              </span>
              <span style={{ fontSize: 13, color: '#059669' }}>
                {activeCount} active
              </span>
              <span style={{ fontSize: 13, color: '#2563eb' }}>
                {staffCount} staff / admin
              </span>
            </div>
          </div>

          {/* Right: search + Live Admin button */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexWrap: 'wrap',
            }}
          >
            <Search
              placeholder="Search username, name, email..."
              value={search}
              onChange={handleSearchChange}
              onSearch={(val) => setSearch(val)}
              style={{ width: 300 }}
              allowClear
            />
            <Tooltip title="Open Django admin to add or manage users">
              <MuiButton
                variant="contained"
                startIcon={<UserAddOutlined />}
                endIcon={<ExportOutlined />}
                onClick={handleOpenAdmin}
                sx={{
                  backgroundColor: 'rgb(55, 148, 141)',
                  color: '#fff',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    backgroundColor: 'rgb(1, 136, 125)',
                  },
                }}
              >
                Add Users on Live Admin
              </MuiButton>
            </Tooltip>
          </div>
        </div>

        {/* Role legend */}
        <div
          style={{ marginTop: 10, display: 'flex', gap: 12, flexWrap: 'wrap' }}
        >
          <span style={{ fontSize: 12, color: '#6b7280' }}>Roles:</span>
          <Tag color="red">Superuser</Tag>
          <Tag color="blue">Staff</Tag>
          <Tag color="default">Contributor</Tag>
        </div>
      </div>

      {/* Demo banner */}
      <Alert
        type="info"
        showIcon
        message="Demo Mode — Mock Data"
        description='This page uses mock data while the live API is connected. To add, edit, or deactivate users, click "Add Users on Live Admin" above.'
        style={{ marginBottom: 12, borderRadius: 8 }}
        closable
      />

      {/* Table */}
      <div
        className="ag-theme-alpine compact-table"
        style={{
          height: 'calc(90vh - 420px)',
          minHeight: '300px',
          width: '100%',
          border: '1px solid #d9d9d9',
          borderRadius: 12,
          boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
        }}
      >
        <AgGridReact
          theme="legacy"
          ref={gridRef}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          rowData={filteredUsers as any[]}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          getRowStyle={getRowStyle}
          enableBrowserTooltips
          paginationPageSize={rowsPerPage}
          pagination
          suppressPaginationPanel
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          total={filteredUsers.length}
          pageSize={rowsPerPage}
          showSizeChanger
          showTotal={(total, range) =>
            `Showing ${range[0]}–${range[1]} of ${total} users`
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

export default EditUser;
