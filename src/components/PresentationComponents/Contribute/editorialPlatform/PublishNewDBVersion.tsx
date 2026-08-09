import { useCallback, useEffect, useState } from 'react';

import { Box, Typography } from '@mui/material';
import { PublicationBatch } from '@slavevoyages/voyages-contribute';
import { Alert, Button, Modal, Progress, Table, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';

import { batchApi, formatBatchDate } from '@/fetch/contributeFetch/batchApi';
import { usePublication } from '@/hooks/contribute/usePublication';
import { warningsOf } from '@/utils/contribute/publicationReport';

import PublicationBlockedReport from './PublicationBlockedReport';
import ListEditorialPlatForm from '../commons/ListEditorialPlatForm';

const TEAL = 'rgb(55, 148, 141)';

const PublishNewDBVersion: React.FC = () => {
  const navigate = useNavigate();
  const [batches, setBatches] = useState<PublicationBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const {
    phase,
    target,
    status,
    conflicts,
    validation,
    error,
    publish,
    reset,
  } = usePublication();

  const loadBatches = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setBatches(await batchApi.getPendingBatches());
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : 'Could not load batches.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBatches();
  }, [loadBatches]);

  // A published batch drops off the pending list, so refresh once it lands.
  useEffect(() => {
    if (phase === 'completed') {
      void loadBatches();
    }
  }, [phase, loadBatches]);

  const confirmPublish = (batch: PublicationBatch) => {
    Modal.confirm({
      title: `Publish “${batch.title}”?`,
      content:
        'Every accepted contribution in this batch will be written to the voyage records. This cannot be undone from here.',
      okText: 'Publish',
      cancelText: 'Cancel',
      okButtonProps: { style: { backgroundColor: TEAL } },
      onOk: () => publish({ id: batch.id, mode: 'batch', label: batch.title }),
    });
  };

  const columns = [
    {
      title: 'Batch',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, batch: PublicationBatch) => (
        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
            {title}
          </Typography>
          {batch.comments && (
            <Typography sx={{ fontSize: 12.5, color: '#888' }}>
              {batch.comments}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      title: 'Published',
      dataIndex: 'published',
      key: 'published',
      width: 160,
      render: (published: number | null) =>
        published === null ? (
          <Tag>Not published</Tag>
        ) : (
          <span>{formatBatchDate(published)}</span>
        ),
    },
    {
      title: '',
      key: 'actions',
      width: 130,
      render: (_: unknown, batch: PublicationBatch) => (
        <Button
          size="small"
          type="primary"
          style={{ backgroundColor: TEAL }}
          disabled={phase === 'starting' || phase === 'publishing'}
          onClick={() => confirmPublish(batch)}
        >
          Publish
        </Button>
      ),
    },
  ];

  const warnings = warningsOf(validation);

  return (
    <Box sx={{ pr: 4, pl: 2, pb: 4, width: '100%' }}>
      <ListEditorialPlatForm />
      <Typography
        variant="h4"
        sx={{ mb: 3, fontSize: '24px', fontWeight: 600 }}
      >
        Publish New DB Version
      </Typography>

      {phase === 'blocked' && target && (
        <PublicationBlockedReport
          targetLabel={target.label ?? `Batch ${target.id}`}
          conflicts={conflicts}
          validation={validation}
          reason={error}
          onDismiss={reset}
          onOpenContribution={(id) =>
            navigate(`/contribute/editor_main/requests/${id}`)
          }
        />
      )}

      {(phase === 'starting' || phase === 'publishing') && (
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 600, mb: 0.5 }}>
            Publishing {target?.label ?? ''}
          </Typography>
          <Typography sx={{ fontSize: 13, color: '#888', mb: 1.5 }}>
            You can leave this page — publishing continues on the server.
          </Typography>
          {/* No total to divide by, so the bar is indeterminate and the
              operation count carries the actual information. */}
          <Progress
            percent={100}
            status="active"
            showInfo={false}
            strokeColor={TEAL}
          />
          <Typography sx={{ fontSize: 13.5, mt: 1 }}>
            {status?.processed_operations
              ? `${status.processed_operations.toLocaleString()} operations processed`
              : 'Starting…'}
          </Typography>
        </Box>
      )}

      {phase === 'completed' && (
        <Alert
          type="success"
          showIcon
          style={{ marginBottom: 24 }}
          message={<strong>Published</strong>}
          description={
            <Box>
              <div>
                {/* The server only reports the operation count every hundred
                    operations, so a small batch finishes reporting zero. Saying
                    "0 operations" would read as though nothing happened. */}
                {status?.processed_operations
                  ? `${status.processed_operations.toLocaleString()} operations`
                  : `${target?.label ?? 'The batch'} is now in the voyage records`}
                {status?.duration_seconds
                  ? ` in ${Math.round(status.duration_seconds)}s`
                  : ''}
                .
              </div>
              {warnings.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <strong>
                    {warnings.length}{' '}
                    {warnings.length === 1 ? 'warning' : 'warnings'}, published
                    anyway:
                  </strong>
                  {warnings.slice(0, 5).map((w, i) => (
                    <div key={i} style={{ fontSize: 13 }}>
                      {w.message}
                    </div>
                  ))}
                </Box>
              )}
            </Box>
          }
          action={
            <Button size="small" onClick={reset}>
              Done
            </Button>
          }
        />
      )}

      {phase === 'failed' && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 24 }}
          message={<strong>Publication failed — nothing was published</strong>}
          description={
            <Box>
              {/* The whole run is one transaction, so a failure rolls it back
                  entirely. And since data problems are caught before this
                  stage, getting here means a bug rather than bad records —
                  which is why the detail below is worth passing on. */}
              <div>
                The voyage records are unchanged. Data problems are caught
                before this stage, so this is likely a bug — send the details
                below to a developer.
              </div>
              {error && (
                <Box
                  sx={{
                    mt: 1,
                    fontFamily: 'monospace',
                    fontSize: 12,
                    whiteSpace: 'pre-wrap',
                    maxHeight: 160,
                    overflow: 'auto',
                  }}
                >
                  {error}
                </Box>
              )}
            </Box>
          }
          action={
            <Button size="small" onClick={reset}>
              Back
            </Button>
          }
        />
      )}

      {loadError && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message={loadError}
          action={
            <Button size="small" onClick={() => void loadBatches()}>
              Retry
            </Button>
          }
        />
      )}

      {phase !== 'blocked' && (
        <Table
          rowKey="id"
          size="small"
          loading={loading}
          columns={columns}
          dataSource={batches}
          pagination={false}
          locale={{ emptyText: 'No batches waiting to be published.' }}
        />
      )}
    </Box>
  );
};

export default PublishNewDBVersion;
