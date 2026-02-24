import { useMemo, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { MOCK_USERS, UserRecord } from '../Contribute/mockData/usersData';

// ── Types ────────────────────────────────────────────────────────────────────
type FilterKey =
  | 'all'
  | 'staff_yes'
  | 'staff_no'
  | 'super_yes'
  | 'super_no'
  | 'active_yes'
  | 'active_no';

type SortField = 'username' | 'email' | 'firstName' | 'lastName' | 'isStaff' | 'isSuperuser';
type SortDir = 'asc' | 'desc';

// ── Bool icon (green check / red dash) ───────────────────────────────────────
const BoolIcon: React.FC<{ value: boolean }> = ({ value }) =>
  value ? (
    <img
      src="https://legacy.slavevoyages.org/static/admin/img/icon-yes.gif"
      alt="True"
      title="True"
      style={{ width: 16, height: 16 }}
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).style.display = 'none';
        (e.currentTarget as HTMLElement).insertAdjacentText(
          'afterend',
          value ? '✔' : '✘',
        );
      }}
    />
  ) : (
    <img
      src="https://legacy.slavevoyages.org/static/admin/img/icon-no.gif"
      alt="False"
      title="False"
      style={{ width: 16, height: 16 }}
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).style.display = 'none';
        (e.currentTarget as HTMLElement).insertAdjacentText('afterend', '✘');
      }}
    />
  );

// ── Sort arrow ────────────────────────────────────────────────────────────────
const SortArrow: React.FC<{
  field: SortField;
  sortField: SortField;
  sortDir: SortDir;
}> = ({ field, sortField, sortDir }) => {
  if (field !== sortField) return null;
  return (
    <span style={{ marginLeft: 4, fontSize: 10, color: '#999' }}>
      {sortDir === 'asc' ? '▲' : '▼'}
    </span>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const AdminUserList: React.FC = () => {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [filterKey, setFilterKey] = useState<FilterKey>('all');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [sortField, setSortField] = useState<SortField>('username');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // ── Filtering ────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...MOCK_USERS];

    if (filterKey === 'staff_yes') list = list.filter((u) => u.isStaff);
    else if (filterKey === 'staff_no') list = list.filter((u) => !u.isStaff);
    else if (filterKey === 'super_yes') list = list.filter((u) => u.isSuperuser);
    else if (filterKey === 'super_no') list = list.filter((u) => !u.isSuperuser);
    else if (filterKey === 'active_yes') list = list.filter((u) => u.isActive);
    else if (filterKey === 'active_no') list = list.filter((u) => !u.isActive);

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

    list.sort((a, b) => {
      let aVal: string | boolean = a[sortField] as string | boolean;
      let bVal: string | boolean = b[sortField] as string | boolean;
      if (typeof aVal === 'boolean') {
        aVal = aVal ? '1' : '0';
        bVal = bVal ? '1' : '0';
      }
      const cmp = (aVal as string).localeCompare(bVal as string);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [search, filterKey, sortField, sortDir]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const allOnPageSelected =
    paged.length > 0 && paged.every((u) => selectedIds.has(u.id));
  const someSelected = selectedIds.size > 0;
  const totalPages = Math.ceil(filtered.length / pageSize);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const toggleSelectAll = () => {
    if (allOnPageSelected) {
      const next = new Set(selectedIds);
      paged.forEach((u) => next.delete(u.id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      paged.forEach((u) => next.add(u.id));
      setSelectedIds(next);
    }
  };

  const toggleOne = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSort = (field: SortField) => {
    if (field === sortField) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
    setPage(1);
  };

  const setFilter = (key: FilterKey) => { setFilterKey(key); setPage(1); };

  const thStyle = (field: SortField): React.CSSProperties => ({
    padding: '2px 8px',
    fontWeight: 'bold',
    fontSize: 11,
    color: '#666',
    background: sortField === field ? '#c5c5c5' : '#e1e1e1',
    borderLeft: '1px solid #ddd',
    borderBottom: '1px solid #ddd',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    userSelect: 'none',
  });

  const filterLinkStyle = (key: FilterKey): React.CSSProperties => ({
    display: 'block',
    padding: '3px 5px',
    fontSize: 12,
    color: filterKey === key ? '#000' : '#416d8c',
    fontWeight: filterKey === key ? 'bold' : 'normal',
    textDecoration: 'none',
    cursor: 'pointer',
    background: filterKey === key ? '#f0f0f0' : 'transparent',
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f8f8f8',
        fontFamily:
          '"Lucida Grande","DejaVu Sans","Bitstream Vera Sans",Verdana,Arial,sans-serif',
        fontSize: 13,
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div
        style={{
          background: '#05768A',
          color: '#fff',
          overflow: 'hidden',
          padding: '0 10px',
          position: 'relative',
        }}
      >
        <div style={{ float: 'left', paddingTop: 6 }}>
          <h1
            style={{
              padding: '0 10px 5px 0',
              margin: 0,
              fontWeight: 'normal',
              color: '#fff',
              fontSize: 18,
            }}
          >
            Voyage Admin Live
          </h1>
          <h2
            style={{
              padding: 0,
              fontSize: 12,
              margin: '-6px 0 8px 0',
              fontWeight: 'normal',
              color: '#fff',
              opacity: 0.8,
            }}
          >
            Any changes will take effect immediately
          </h2>
        </div>
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            padding: '10px 12px',
            fontSize: 11,
            textAlign: 'right',
            color: '#fff',
          }}
        >
          Welcome, <strong>admin</strong>.&nbsp;&nbsp;
          <a href="#" style={{ color: '#fff', textDecoration: 'underline', marginRight: 8 }} onClick={(e) => e.preventDefault()}>
            Change password
          </a>
          <a href="/" style={{ color: '#fff', textDecoration: 'underline', marginRight: 8 }} onClick={(e) => { e.preventDefault(); navigate('/'); }}>
            View site
          </a>
          <a href="#" style={{ color: '#fff', textDecoration: 'underline' }} onClick={(e) => e.preventDefault()}>
            Log out
          </a>
        </div>
      </div>

      {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
      <div
        style={{
          padding: '2px 8px 3px 8px',
          fontSize: 11,
          color: '#999',
          borderBottom: '1px solid #ccc',
          background: '#fff',
        }}
      >
        <a href="/admin/" style={{ color: '#417690' }} onClick={(e) => { e.preventDefault(); navigate('/admin/'); }}>
          Home
        </a>
        {' › '}
        <a href="#" style={{ color: '#417690' }} onClick={(e) => e.preventDefault()}>
          Authentication and Authorization
        </a>
        {' › '}
        Users
      </div>

      {/* ── Page content ────────────────────────────────────────────────── */}
      <div id="content" style={{ margin: '10px 15px', position: 'relative' }}>

        {/* Object tools (Add user button) */}
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: '0 0 4px 0',
            float: 'right',
            display: 'flex',
            gap: 4,
          }}
        >
          <li>
            <a
              href="/admin/auth/user/add/"
              style={{
                display: 'inline-block',
                padding: '3px 10px 3px 20px',
                background: `#417690 url(https://legacy.slavevoyages.org/static/admin/img/icon_addlink.gif) 4px center no-repeat`,
                color: '#fff',
                fontSize: 11,
                fontWeight: 'bold',
                textDecoration: 'none',
                borderRadius: 2,
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#205067 url(https://legacy.slavevoyages.org/static/admin/img/icon_addlink.gif) 4px center no-repeat')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '#417690 url(https://legacy.slavevoyages.org/static/admin/img/icon_addlink.gif) 4px center no-repeat')}
              onClick={(e) => e.preventDefault()}
            >
              Add user
            </a>
          </li>
        </ul>

        <h1 style={{ fontSize: 18, color: '#666', margin: '0 0 8px 0', fontWeight: 'bold', clear: 'none' }}>
          Select user to change
        </h1>

        {/* ── Changelist ──────────────────────────────────────────────── */}
        <div id="changelist" style={{ position: 'relative', width: '100%', clear: 'both' }}>

          {/* Filter sidebar */}
          <div
            id="changelist-filter"
            style={{
              float: 'right',
              width: 160,
              background: '#fff',
              border: '1px solid #ddd',
              marginLeft: 10,
              padding: 0,
            }}
          >
            <h2
              style={{
                padding: '3px 8px',
                margin: 0,
                fontSize: 11,
                fontWeight: 'bold',
                background: '#008ca8',
                color: '#fff',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Filter
            </h2>

            {/* By staff status */}
            <h3 style={{ padding: '4px 8px 2px', margin: 0, fontSize: 11, fontWeight: 'bold', color: '#666', borderTop: '1px solid #eee' }}>
              By staff status
            </h3>
            <ul style={{ listStyle: 'none', margin: 0, padding: '0 0 4px 0' }}>
              {[
                { key: 'all', label: 'All' },
                { key: 'staff_yes', label: 'Yes' },
                { key: 'staff_no', label: 'No' },
              ].map(({ key, label }) => (
                <li key={key}>
                  <a style={filterLinkStyle(key as FilterKey)} onClick={() => setFilter(key as FilterKey)}>
                    {label}
                  </a>
                </li>
              ))}
            </ul>

            {/* By superuser status */}
            <h3 style={{ padding: '4px 8px 2px', margin: 0, fontSize: 11, fontWeight: 'bold', color: '#666', borderTop: '1px solid #eee' }}>
              By superuser status
            </h3>
            <ul style={{ listStyle: 'none', margin: 0, padding: '0 0 4px 0' }}>
              {[
                { key: 'all', label: 'All' },
                { key: 'super_yes', label: 'Yes' },
                { key: 'super_no', label: 'No' },
              ].map(({ key, label }) => (
                <li key={key}>
                  <a style={filterLinkStyle(key as FilterKey)} onClick={() => setFilter(key as FilterKey)}>
                    {label}
                  </a>
                </li>
              ))}
            </ul>

            {/* By active */}
            <h3 style={{ padding: '4px 8px 2px', margin: 0, fontSize: 11, fontWeight: 'bold', color: '#666', borderTop: '1px solid #eee' }}>
              By active
            </h3>
            <ul style={{ listStyle: 'none', margin: 0, padding: '0 0 4px 0' }}>
              {[
                { key: 'all', label: 'All' },
                { key: 'active_yes', label: 'Yes' },
                { key: 'active_no', label: 'No' },
              ].map(({ key, label }) => (
                <li key={key}>
                  <a style={filterLinkStyle(key as FilterKey)} onClick={() => setFilter(key as FilterKey)}>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Main results area ──────────────────────────────────────── */}
          <div style={{ marginRight: 180 }}>

            {/* Toolbar / Search */}
            <div
              id="toolbar"
              style={{
                padding: '8px 10px',
                marginBottom: 12,
                borderTop: '1px solid #eee',
                borderBottom: '1px solid #eee',
                background: '#f8f8f8',
                color: '#666',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <label style={{ fontSize: 12, fontWeight: 'bold', marginRight: 4 }}>Search:</label>
              <input
                id="searchbar"
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="username, name or email"
                style={{
                  height: 19,
                  border: '1px solid #ccc',
                  padding: '2px 5px',
                  fontSize: 13,
                  verticalAlign: 'top',
                  borderRadius: 0,
                  width: 260,
                }}
              />
              <input
                type="submit"
                value="Search"
                style={{
                  padding: '2px 8px',
                  fontSize: 12,
                  border: '1px solid #bbb',
                  background: '#e8e8e8',
                  cursor: 'pointer',
                }}
                onClick={() => { /* already reactive */ }}
              />
              <span style={{ marginLeft: 'auto', fontSize: 12 }}>
                {filtered.length} user{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Action bar */}
            {someSelected && (
              <div
                style={{
                  padding: '4px 8px',
                  marginBottom: 8,
                  background: '#fffbcc',
                  border: '1px solid #e8d000',
                  fontSize: 12,
                  color: '#555',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>{selectedIds.size} of {filtered.length} selected</span>
                <select
                  style={{ fontSize: 12, padding: '1px 4px', border: '1px solid #ccc' }}
                  defaultValue=""
                >
                  <option value="">---------</option>
                  <option value="delete">Delete selected users</option>
                </select>
                <button style={{ fontSize: 12, padding: '2px 6px', border: '1px solid #bbb', cursor: 'pointer' }}>
                  Go
                </button>
              </div>
            )}

            {/* Table */}
            <table
              id="result_list"
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                border: '1px solid #ddd',
              }}
            >
              <thead>
                <tr>
                  {/* Checkbox col */}
                  <th
                    style={{
                      width: 22,
                      textAlign: 'center',
                      padding: '2px 5px',
                      background: '#e1e1e1',
                      borderBottom: '1px solid #ddd',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={allOnPageSelected}
                      ref={(el) => {
                        if (el)
                          el.indeterminate =
                            !allOnPageSelected && paged.some((u) => selectedIds.has(u.id));
                      }}
                      onChange={toggleSelectAll}
                      title="Select all"
                    />
                  </th>
                  {(
                    [
                      { field: 'username', label: 'Username' },
                      { field: 'email', label: 'Email address' },
                      { field: 'firstName', label: 'First name' },
                      { field: 'lastName', label: 'Last name' },
                      { field: 'isStaff', label: 'Staff status' },
                      { field: 'isSuperuser', label: 'Superuser status' },
                    ] as { field: SortField; label: string }[]
                  ).map(({ field, label }) => (
                    <th
                      key={field}
                      style={thStyle(field)}
                      onClick={() => handleSort(field)}
                    >
                      {label}
                      <SortArrow field={field} sortField={sortField} sortDir={sortDir} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        padding: '10px',
                        textAlign: 'center',
                        color: '#999',
                        fontSize: 12,
                      }}
                    >
                      0 users
                    </td>
                  </tr>
                ) : (
                  paged.map((user, idx) => (
                    <tr
                      key={user.id}
                      style={{ background: idx % 2 === 0 ? '#EDF3FE' : '#fff' }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLElement).style.background = '#d0e3f0')
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLElement).style.background =
                          idx % 2 === 0 ? '#EDF3FE' : '#fff')
                      }
                    >
                      <td
                        style={{ textAlign: 'center', padding: '5px', borderBottom: '1px solid #eee' }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.has(user.id)}
                          onChange={() => toggleOne(user.id)}
                        />
                      </td>
                      <td style={{ padding: '5px 8px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>
                        <a
                          href={`/admin/auth/user/${user.id}/change/`}
                          style={{ color: '#417690', textDecoration: 'none', fontSize: 12 }}
                          onClick={(e) => e.preventDefault()}
                        >
                          {user.username}
                        </a>
                      </td>
                      <td style={{ padding: '5px 8px', borderBottom: '1px solid #eee', fontSize: 12 }}>{user.email}</td>
                      <td style={{ padding: '5px 8px', borderBottom: '1px solid #eee', fontSize: 12 }}>{user.firstName}</td>
                      <td style={{ padding: '5px 8px', borderBottom: '1px solid #eee', fontSize: 12 }}>{user.lastName}</td>
                      <td style={{ padding: '5px 8px', borderBottom: '1px solid #eee', textAlign: 'center' }}>
                        <BoolIcon value={user.isStaff} />
                      </td>
                      <td style={{ padding: '5px 8px', borderBottom: '1px solid #eee', textAlign: 'center' }}>
                        <BoolIcon value={user.isSuperuser} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <p
              className="paginator"
              style={{
                color: '#666',
                borderBottom: '1px solid #eee',
                background: '#fff',
                padding: '8px 10px',
                fontSize: 12,
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {page > 1 && (
                <a
                  style={{ color: '#417690', cursor: 'pointer' }}
                  onClick={() => setPage((p) => p - 1)}
                >
                  « Previous
                </a>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <span key={p}>
                  {p === page ? (
                    <strong style={{ padding: '2px 5px', background: '#c5c5c5', color: '#000' }}>
                      {p}
                    </strong>
                  ) : (
                    <a
                      style={{ color: '#417690', cursor: 'pointer', padding: '2px 5px' }}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </a>
                  )}
                </span>
              ))}
              {page < totalPages && (
                <a
                  style={{ color: '#417690', cursor: 'pointer' }}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next »
                </a>
              )}
              <span style={{ marginLeft: 'auto' }}>
                {(page - 1) * pageSize + 1}–
                {Math.min(page * pageSize, filtered.length)} of {filtered.length}
              </span>
            </p>
          </div>
          {/* clear float */}
          <div style={{ clear: 'both' }} />
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div
        style={{
          clear: 'both',
          paddingLeft: 17,
          paddingTop: 8,
          paddingBottom: 12,
          fontSize: 11,
          color: '#999',
        }}
      >
        <a
          href="https://legacy.slavevoyages.org/admin/auth/user/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#417690' }}
        >
          Open Legacy Admin ↗
        </a>
      </div>
    </div>
  );
};

export default AdminUserList;
