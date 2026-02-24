import { useMemo, useState } from 'react';

import { CheckOutlined, CloseOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  Checkbox,
  Input,
  Menu,
  Pagination,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';

import { MOCK_USERS, UserRecord } from '../mockData/usersData';

const { Title } = Typography;
const { Search } = Input;

// ── Helpers ──────────────────────────────────────────────────────────────────
const BoolIcon: React.FC<{ value: boolean }> = ({ value }) =>
  value ? (
    <CheckOutlined style={{ color: '#2e7d32', fontSize: 16 }} />
  ) : (
    <CloseOutlined style={{ color: '#b91c1c', fontSize: 16 }} />
  );

type FilterKey =
  | 'all'
  | 'staff'
  | 'nonstaff'
  | 'super'
  | 'nonsuper'
  | 'active'
  | 'inactive';

const AdminUserList: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterKey, setFilterKey] = useState<FilterKey>('all');
  const [selectedKeys, setSelectedKeys] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // ── Filter logic ────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = MOCK_USERS;

    // sidebar filter
    if (filterKey === 'staff') list = list.filter((u) => u.isStaff);
    else if (filterKey === 'nonstaff') list = list.filter((u) => !u.isStaff);
    else if (filterKey === 'super') list = list.filter((u) => u.isSuperuser);
    else if (filterKey === 'nonsuper')
      list = list.filter((u) => !u.isSuperuser);
    else if (filterKey === 'active') list = list.filter((u) => u.isActive);
    else if (filterKey === 'inactive') list = list.filter((u) => !u.isActive);

    // search
    const q = search.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (u) =>
          u.username.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.firstName.toLowerCase().includes(q) ||
          u.lastName.toLowerCase().includes(q),
      );
    }
    return list;
  }, [search, filterKey]);

  // ── Columns ─────────────────────────────────────────────────────────────────
  const columns: ColumnsType<UserRecord> = [
    {
      title: (
        <Checkbox
          checked={
            selectedKeys.length === filtered.length && filtered.length > 0
          }
          indeterminate={
            selectedKeys.length > 0 && selectedKeys.length < filtered.length
          }
          onChange={(e) =>
            setSelectedKeys(e.target.checked ? filtered.map((u) => u.id) : [])
          }
        />
      ),
      key: 'select',
      width: 44,
      render: (_: unknown, record: UserRecord) => (
        <Checkbox
          checked={selectedKeys.includes(record.id)}
          onChange={(e) =>
            setSelectedKeys((prev) =>
              e.target.checked
                ? [...prev, record.id]
                : prev.filter((k) => k !== record.id),
            )
          }
        />
      ),
    },
    {
      title: 'Username',
      dataIndex: 'username',
      sorter: (a, b) => a.username.localeCompare(b.username),
      render: (val: string) => (
        <a
          href="#"
          style={{ color: '#417690', fontWeight: 600 }}
          onClick={(e) => e.preventDefault()}
        >
          {val}
        </a>
      ),
    },
    {
      title: 'Email address',
      dataIndex: 'email',
      sorter: (a, b) => a.email.localeCompare(b.email),
    },
    {
      title: 'First name',
      dataIndex: 'firstName',
      sorter: (a, b) => a.firstName.localeCompare(b.firstName),
    },
    {
      title: 'Last name',
      dataIndex: 'lastName',
      sorter: (a, b) => a.lastName.localeCompare(b.lastName),
    },
    {
      title: 'Staff status',
      dataIndex: 'isStaff',
      width: 110,
      align: 'center',
      sorter: (a, b) => Number(a.isStaff) - Number(b.isStaff),
      render: (val: boolean) => <BoolIcon value={val} />,
    },
    {
      title: 'Superuser status',
      dataIndex: 'isSuperuser',
      width: 130,
      align: 'center',
      sorter: (a, b) => Number(a.isSuperuser) - Number(b.isSuperuser),
      render: (val: boolean) => <BoolIcon value={val} />,
    },
  ];

  const sideMenuItems = [
    {
      key: 'heading-staff',
      label: (
        <strong style={{ color: '#666', fontSize: 11 }}>BY STAFF STATUS</strong>
      ),
      disabled: true,
    },
    { key: 'all', label: 'All' },
    { key: 'staff', label: 'Yes' },
    { key: 'nonstaff', label: 'No' },
    {
      key: 'heading-super',
      label: (
        <strong style={{ color: '#666', fontSize: 11 }}>
          BY SUPERUSER STATUS
        </strong>
      ),
      disabled: true,
    },
    { key: 'super', label: 'Yes' },
    { key: 'nonsuper', label: 'No' },
    {
      key: 'heading-active',
      label: <strong style={{ color: '#666', fontSize: 11 }}>BY ACTIVE</strong>,
      disabled: true,
    },
    { key: 'active', label: 'Yes' },
    { key: 'inactive', label: 'No' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: '#f8f8f8',
        fontFamily:
          '"Roboto","Lucida Grande","DejaVu Sans","Bitstream Vera Sans",Verdana,Arial,sans-serif',
      }}
    >
      {/* ── Main content ──────────────────────────────────────────────── */}
      <div style={{ flex: 1, padding: '20px 24px' }}>
        {/* Breadcrumb */}
        <div style={{ color: '#999', fontSize: 13, marginBottom: 6 }}>
          <a href="/admin/" style={{ color: '#417690' }} onClick={(e) => { e.preventDefault(); navigate('/admin/'); }}>
            Home
          </a>
          {' › '}
          <a href="/admin/auth/" style={{ color: '#417690' }} onClick={(e) => e.preventDefault()}>
            Authentication and Authorization
          </a>
          {' › '}
          Users
        </div>

        {/* Title row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <Title level={3} style={{ margin: 0, color: '#333' }}>
            Select user to change
          </Title>
          <a
            href="/admin/auth/user/add/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#417690',
              color: '#fff',
              padding: '8px 14px',
              borderRadius: 4,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
            }}
            onClick={(e) => e.preventDefault()}
          >
            <PlusOutlined />
            Add user
          </a>
        </div>

        {/* Action bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 12,
          }}
        >
          <Search
            placeholder="Search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            onSearch={(v) => setSearch(v)}
            style={{ width: 280 }}
            allowClear
          />
          {selectedKeys.length > 0 && (
            <Tag color="blue">{selectedKeys.length} selected</Tag>
          )}
          <span style={{ marginLeft: 'auto', color: '#666', fontSize: 13 }}>
            {filtered.length} user{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Table */}
        <Table<UserRecord>
          rowKey="id"
          columns={columns}
          dataSource={filtered.slice((page - 1) * pageSize, page * pageSize)}
          pagination={false}
          size="small"
          bordered
          style={{
            background: '#fff',
            borderRadius: 4,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
          onRow={(record) => ({
            style: { cursor: 'pointer' },
            onMouseEnter: (e) =>
              ((e.currentTarget as HTMLElement).style.background = '#f0f5f9'),
            onMouseLeave: (e) =>
              ((e.currentTarget as HTMLElement).style.background = ''),
          })}
        />

        {/* Pagination */}
        <div
          style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}
        >
          <Pagination
            current={page}
            total={filtered.length}
            pageSize={pageSize}
            onChange={setPage}
            showTotal={(total, range) => `${range[0]}–${range[1]} of ${total}`}
            size="small"
          />
        </div>
      </div>

      {/* ── Sidebar filter ────────────────────────────────────────────── */}
      <div
        style={{
          width: 200,
          background: '#fff',
          borderLeft: '1px solid #e0e0e0',
          padding: '16px 0',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: '0 16px 8px',
            fontWeight: 700,
            fontSize: 13,
            color: '#666',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Filter
        </div>
        <Menu
          mode="inline"
          selectedKeys={[filterKey]}
          onClick={({ key }) => {
            setFilterKey(key as FilterKey);
            setPage(1);
          }}
          items={sideMenuItems}
          style={{ border: 'none', fontSize: 13 }}
        />
      </div>
    </div>
  );
};

export default AdminUserList;
