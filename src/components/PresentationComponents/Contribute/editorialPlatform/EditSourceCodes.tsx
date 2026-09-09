/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from 'react';

import { Box, Typography } from '@mui/material';
import { Button, message, Space, Table, Tooltip } from 'antd';

import {
  fetchSourcesData,
  SourceRow,
} from '@/fetch/contributeFetch/fetchSourcesData';
import { BASEURL } from '@/share/AUTH_BASEURL';

import ListEditorialPlatForm from '../commons/ListEditorialPlatForm';

const stripHtml = (v?: string | null): string =>
  (v ?? '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const EditSourceCodes: React.FC = () => {
  const [rows, setRows] = useState<SourceRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetchSourcesData(page, pageSize);
        if (cancelled) return;
        setRows(res.results ?? []);
        setTotal(res.count ?? 0);
      } catch (error) {
        if (cancelled) return;
        setRows([]);
        setTotal(0);
        message.error('Failed to load sources');
        console.error('Sources load error:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [page, pageSize]);

  const columns = [
    {
      title: 'Short ref',
      dataIndex: ['short_ref', 'name'],
      key: 'short_ref',
      width: 160,
      render: (_: any, r: SourceRow) => r.short_ref?.name ?? '—',
    },
    {
      title: 'Bibliography',
      key: 'bib',
      render: (_: any, r: SourceRow) => {
        const text = stripHtml(r.bib);
        return text ? (
          <Tooltip title={text}>
            <span
              style={{
                display: 'inline-block',
                maxWidth: 520,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                verticalAlign: 'bottom',
              }}
            >
              {text}
            </span>
          </Tooltip>
        ) : (
          '—'
        );
      },
    },
    {
      title: 'Source type',
      key: 'source_type',
      width: 160,
      render: (_: any, r: SourceRow) => r.source_type?.name ?? '—',
    },
    {
      title: 'Enslavers',
      dataIndex: 'enslavers_count',
      key: 'enslavers_count',
      width: 110,
      align: 'right' as const,
      render: (v: number | null) => v ?? 0,
    },
    {
      title: 'Named enslaved',
      dataIndex: 'named_enslaved_count',
      key: 'named_enslaved_count',
      width: 140,
      align: 'right' as const,
      render: (v: number | null) => v ?? 0,
    },
  ];

  const onTableChange = useCallback(
    (pagination: any) => {
      if (pagination.current) setPage(pagination.current);
      if (pagination.pageSize && pagination.pageSize !== pageSize) {
        setPageSize(pagination.pageSize);
        setPage(1);
      }
    },
    [pageSize],
  );

  return (
    <Box sx={{ pr: 4, pl: 2, pb: 4, width: '100%' }}>
      <ListEditorialPlatForm />

      <Box
        sx={{
          mt: 2,
          mb: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Typography variant="h4" sx={{ fontSize: '26px', fontWeight: 700 }}>
          Source Codes
        </Typography>
        <Space>
          {/* Creating/editing sources lives in the Django admin (no API CRUD),
              so these open it in a new tab; the table itself is read-only. */}
          <Button
            type="primary"
            href={`${BASEURL}/admin/document/source/add/`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Add Source Code
          </Button>
          <Button
            href={`${BASEURL}/admin/document/source/`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View in Django admin
          </Button>
        </Space>
      </Box>

      <Table<SourceRow>
        rowKey={(r) =>
          r.zotero_item_id ?? `${r.short_ref?.id ?? ''}-${r.bib ?? ''}`
        }
        columns={columns}
        dataSource={rows}
        loading={loading}
        size="small"
        onChange={onTableChange}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          showTotal: (t, range) =>
            `Showing ${range[0]}–${range[1]} of ${t} sources`,
        }}
      />
    </Box>
  );
};

export default EditSourceCodes;
