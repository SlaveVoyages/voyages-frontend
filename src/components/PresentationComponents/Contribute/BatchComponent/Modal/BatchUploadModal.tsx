import React, { useRef } from 'react';

import {
  DownloadOutlined,
  InboxOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { Close } from '@mui/icons-material';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
} from '@mui/material';
import { Alert, Button, Progress, Select, Space, Spin, Typography } from 'antd';

import {
  PaperDraggableCreateBatch,
  PaperDraggableUploadBatch,
} from '@/components/SelectorComponents/Cascading/PaperDraggable';
import { UploadEntity } from '@/fetch/contributeFetch/batchUploadApi';
import { SUPPORTED_ENTITIES, useBatchUpload } from '@/hooks/useBatchUpload';
import { StyleDialogOnTop } from '@/styleMUI';

const { Text } = Typography;
const { Option } = Select;

interface BatchUploadModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingBatchTitles?: string[];
}

const BatchUploadModal: React.FC<BatchUploadModalProps> = ({
  visible,
  onClose,
  onSuccess,
  existingBatchTitles,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    templateLoading,
    templateError,
    downloadTemplate,
    selectedEntity,
    setSelectedEntity,
    selectedFile,
    dragging,
    handleFileChange,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    clearFile,
    inspecting,
    inspectResult,
    inspectError,
    hasBlockingErrors,
    duplicateTitleWarning,
    uploading,
    uploadError,
    jobStatus,
    handleUpload,
    progressPercent,
    isTerminal,
  } = useBatchUpload({
    existingBatchTitles,
    onUploadSuccess: () => {
      onSuccess();
      handleClose();
    },
  });

  const handleClose = () => {
    clearFile();
    onClose();
  };

  const isUploadDisabled =
    !selectedFile ||
    uploading ||
    isTerminal ||
    inspecting ||
    hasBlockingErrors ||
    !!duplicateTitleWarning;

  return (
    <Dialog
      open={visible}
      onClose={handleClose}
      disableScrollLock={false}
      sx={StyleDialogOnTop}
      fullWidth
      maxWidth="sm"
      PaperComponent={PaperDraggableUploadBatch}
      aria-labelledby="draggable-dialog-upload-batch"
    >
      {/* ── Header ── */}
      <DialogTitle
        sx={{
          cursor: 'move',
          position: 'relative',
          textAlign: 'center',
          fontWeight: 600,
          bgcolor: 'rgb(55, 148, 141)',
          color: '#fff',
          py: 2,
        }}
      >
        <Text
          style={{
            margin: 0,
            color: '#fff',
            fontSize: '1.25rem',
            fontWeight: 600,
          }}
        >
          Upload Batch CSV
        </Text>
        <IconButton
          edge="end"
          color="inherit"
          onClick={handleClose}
          sx={{ position: 'absolute', top: 8, right: 8 }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {/* ── Entity + template download ── */}
          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              Entity type
            </Text>
            <Space wrap>
              <Select
                value={selectedEntity}
                onChange={(val) => setSelectedEntity(val as UploadEntity)}
                style={{ width: 140 }}
                size="middle"
              >
                {SUPPORTED_ENTITIES.map((e) => (
                  <Option key={e} value={e}>
                    {e}
                  </Option>
                ))}
              </Select>
              <Button
                size="small"
                icon={<DownloadOutlined />}
                onClick={() => downloadTemplate(selectedEntity)}
                loading={templateLoading}
                style={{
                  color: 'rgb(55, 148, 141)',
                  border: '1px solid rgb(55, 148, 141)',
                  fontSize: '0.75rem',
                }}
              >
                Download template
              </Button>
            </Space>
            {templateError && (
              <Alert
                type="error"
                message={templateError}
                style={{ marginTop: 8 }}
                showIcon
              />
            )}
            <Text
              type="secondary"
              style={{ display: 'block', marginTop: 6, fontSize: 12 }}
            >
              Download the blank template to get the correct column headers,
              fill in your data, then upload the file below.
            </Text>
          </div>

          {/* ── Drop zone ── */}
          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              Select CSV file
            </Text>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? '#37948d' : '#d9d9d9'}`,
                borderRadius: 8,
                padding: '24px 16px',
                textAlign: 'center',
                cursor: 'pointer',
                background: dragging ? '#f0fffe' : '#fafafa',
                transition: 'border-color 0.2s, background 0.2s',
              }}
            >
              <InboxOutlined
                style={{ fontSize: 30, color: '#37948d', marginBottom: 6 }}
              />
              <div>
                <Text style={{ fontSize: 13 }}>
                  {selectedFile
                    ? selectedFile.name
                    : 'Drag and drop a CSV file here, or click to select'}
                </Text>
              </div>
              {selectedFile && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </Text>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </div>
            {uploadError && (
              <Alert
                type="error"
                message={uploadError}
                style={{ marginTop: 8 }}
                showIcon
              />
            )}
          </div>

          {/* ── Validation panel (shown after a file is selected) ── */}
          {selectedFile && (
            <div
              style={{
                border: '1px solid #e8e8e8',
                borderRadius: 8,
                padding: '12px 14px',
                background: '#fafafa',
              }}
            >
              <Text
                strong
                style={{ fontSize: 13, display: 'block', marginBottom: 8 }}
              >
                File validation
              </Text>

              {inspecting && (
                <Space>
                  <Spin size="small" />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Checking columns against schema…
                  </Text>
                </Space>
              )}

              {!inspecting && inspectError && (
                <Alert
                  type="warning"
                  message={inspectError}
                  style={{ fontSize: 12 }}
                  showIcon
                />
              )}

              {/* Duplicate batch title — warning */}
              {duplicateTitleWarning && (
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginBottom: 6 }}
                  message={
                    <span style={{ fontSize: 12 }}>
                      {duplicateTitleWarning}
                    </span>
                  }
                />
              )}

              {!inspecting && inspectResult && (
                <Space direction="vertical" size={6} style={{ width: '100%' }}>
                  {/* Missing required columns — blocking */}
                  {inspectResult.mappingHeadersNotInCsv.length > 0 && (
                    <Alert
                      type="error"
                      showIcon
                      message={
                        <span style={{ fontSize: 12 }}>
                          <strong>
                            {inspectResult.mappingHeadersNotInCsv.length}{' '}
                            required column
                            {inspectResult.mappingHeadersNotInCsv.length !== 1
                              ? 's'
                              : ''}{' '}
                            missing
                          </strong>{' '}
                          — fix these before uploading:
                          <div
                            style={{
                              marginTop: 4,
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: 4,
                              maxHeight: 130,
                              overflowY: 'auto',
                            }}
                          >
                            {inspectResult.mappingHeadersNotInCsv.map((col) => (
                              <code
                                key={col}
                                style={{
                                  background: '#fff1f0',
                                  border: '1px solid #ffa39e',
                                  borderRadius: 3,
                                  padding: '1px 5px',
                                  fontSize: 11,
                                }}
                              >
                                {col}
                              </code>
                            ))}
                          </div>
                        </span>
                      }
                    />
                  )}

                  {/* Unknown columns — warning only */}
                  {inspectResult.csvHeadersNotInMapping.length > 0 && (
                    <Alert
                      type="warning"
                      showIcon
                      message={
                        <span style={{ fontSize: 12 }}>
                          <strong>
                            {inspectResult.csvHeadersNotInMapping.length}{' '}
                            unrecognised column
                            {inspectResult.csvHeadersNotInMapping.length !== 1
                              ? 's'
                              : ''}
                          </strong>{' '}
                          — these will be ignored by the importer:
                          <div
                            style={{
                              marginTop: 4,
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: 4,
                              maxHeight: 130,
                              overflowY: 'auto',
                            }}
                          >
                            {inspectResult.csvHeadersNotInMapping.map((col) => (
                              <code
                                key={col}
                                style={{
                                  background: '#fffbe6',
                                  border: '1px solid #ffe58f',
                                  borderRadius: 3,
                                  padding: '1px 5px',
                                  fontSize: 11,
                                }}
                              >
                                {col}
                              </code>
                            ))}
                          </div>
                        </span>
                      }
                    />
                  )}

                  {/* All clear */}
                  {inspectResult.mappingHeadersNotInCsv.length === 0 &&
                    inspectResult.csvHeadersNotInMapping.length === 0 && (
                      <Alert
                        type="success"
                        showIcon
                        message={
                          <span style={{ fontSize: 12 }}>
                            All columns match the schema — ready to upload.
                          </span>
                        }
                      />
                    )}
                </Space>
              )}

              {/* Validation rules info */}
              <details style={{ marginTop: 10 }}>
                <summary
                  style={{
                    fontSize: 12,
                    color: '#595959',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  What does validation check?
                </summary>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 12,
                    color: '#595959',
                    lineHeight: 1.6,
                  }}
                >
                  <p style={{ margin: '0 0 4px' }}>
                    <strong>Required columns</strong> — the file must contain
                    every column header defined in the entity mapping. Missing
                    columns block upload.
                  </p>
                  <p style={{ margin: '0 0 4px' }}>
                    <strong>Unrecognised columns</strong> — extra headers not in
                    the mapping are silently ignored; they do not cause a
                    failure.
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong>Tip:</strong> use the <em>Download template</em>{' '}
                    button above to get a file with all the correct headers
                    already in place.
                  </p>
                </div>
              </details>
            </div>
          )}

          {/* ── Progress ── */}
          {jobStatus && (
            <div>
              {(jobStatus.status === 'pending' ||
                jobStatus.status === 'running') && (
                <Space>
                  <Spin size="small" />
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    Processing rows… {jobStatus.progress.processed} /{' '}
                    {jobStatus.progress.total || '?'}
                  </Text>
                </Space>
              )}

              {jobStatus.progress.total > 0 && (
                <Progress
                  percent={progressPercent}
                  status={
                    jobStatus.status === 'failed'
                      ? 'exception'
                      : jobStatus.status === 'completed'
                        ? 'success'
                        : 'active'
                  }
                  style={{ marginTop: 8 }}
                />
              )}

              {jobStatus.status === 'completed' && jobStatus.result && (
                <Alert
                  type="success"
                  style={{ marginTop: 8 }}
                  message={
                    <>
                      Import complete —{' '}
                      <strong>{jobStatus.result.pushed}</strong> contribution
                      {jobStatus.result.pushed !== 1 ? 's' : ''} created.
                      {jobStatus.progress.total - jobStatus.result.pushed >
                        0 && (
                        <>
                          {' '}
                          {jobStatus.progress.total -
                            jobStatus.result.pushed}{' '}
                          row
                          {jobStatus.progress.total -
                            jobStatus.result.pushed !==
                          1
                            ? 's'
                            : ''}{' '}
                          were dropped by the mapper.
                        </>
                      )}
                    </>
                  }
                  showIcon
                />
              )}

              {jobStatus.status === 'failed' && (
                <Alert
                  type="error"
                  style={{ marginTop: 8 }}
                  message={
                    jobStatus.failureReason ??
                    'Import failed. Check your CSV and try again.'
                  }
                  showIcon
                />
              )}
            </div>
          )}
        </Space>
      </DialogContent>

      <DialogActions sx={{ p: 3, bgcolor: 'grey.50' }}>
        <Space>
          {selectedFile && !uploading && !isTerminal && (
            <Button onClick={clearFile}>Clear file</Button>
          )}

          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => handleUpload()}
            disabled={isUploadDisabled}
            loading={uploading}
            title={
              duplicateTitleWarning
                ? 'Rename the file or remove the existing batch before uploading'
                : hasBlockingErrors
                  ? 'Fix the missing columns before uploading'
                  : inspecting
                    ? 'Validating file…'
                    : undefined
            }
            style={{
              textTransform: 'unset',
              fontWeight: 600,
              fontSize: '0.75rem',
              border: 'none',
              color: '#fff',
              background: isUploadDisabled ? '#b0b0b0' : 'rgb(55, 148, 141)',
              cursor: isUploadDisabled ? 'not-allowed' : 'pointer',
              opacity: isUploadDisabled ? 0.6 : 1,
              transition: 'background 0.2s, opacity 0.2s',
            }}
          >
            {uploading
              ? 'Uploading…'
              : duplicateTitleWarning
                ? 'Duplicate batch title'
                : hasBlockingErrors
                  ? 'Fix errors to upload'
                  : 'Upload CSV'}
          </Button>

          {isTerminal && <Button onClick={handleClose}>Close</Button>}
        </Space>
      </DialogActions>
    </Dialog>
  );
};

export default BatchUploadModal;
