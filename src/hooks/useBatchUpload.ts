import { useCallback, useEffect, useRef, useState } from 'react';

import {
  UploadEntity,
  UploadJobStatus,
  UploadMetadata,
  pollUploadJob,
  uploadBatchedContributions,
} from '@/fetch/contributeFetch/batchUploadApi';
import { useDownloadCsvTemplate } from '@/hooks/useDownloadCsvTemplate';

const POLL_INTERVAL_MS = 5000;

export const SUPPORTED_ENTITIES: UploadEntity[] = ['Voyage'];

export interface UseBatchUploadReturn {
  // Template download
  templateLoading: boolean;
  templateError: string | null;
  downloadTemplate: (entity: UploadEntity) => void;

  // Entity selection
  selectedEntity: UploadEntity;
  setSelectedEntity: (entity: UploadEntity) => void;

  // File selection
  selectedFile: File | null;
  dragging: boolean;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDragLeave: () => void;
  clearFile: () => void;

  // Upload & polling
  uploading: boolean;
  uploadError: string | null;
  jobStatus: UploadJobStatus | null;
  handleUpload: () => Promise<void>;

  // Derived state
  progressPercent: number;
  isTerminal: boolean;
}

export function useBatchUpload(): UseBatchUploadReturn {
  const {
    download: downloadTemplate,
    loading: templateLoading,
    error: templateError,
  } = useDownloadCsvTemplate();

  const [selectedEntity, setSelectedEntity] = useState<UploadEntity>('Voyage');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<UploadJobStatus | null>(null);

  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeJobIdRef = useRef<string | null>(null);

  // Clean up polling timer on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, []);

  // ── File selection ──────────────────────────────────────────────────────────

  const acceptFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setUploadError('Only CSV files are supported.');
      return;
    }
    setSelectedFile(file);
    setUploadError(null);
    setJobStatus(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) acceptFile(file);
    e.target.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) acceptFile(file);
  }, []);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const clearFile = () => {
    setSelectedFile(null);
    setUploadError(null);
    setJobStatus(null);
  };

  // ── Upload & polling ────────────────────────────────────────────────────────

  const stopPolling = () => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    activeJobIdRef.current = null;
  };

  const startPolling = (jobId: string) => {
    activeJobIdRef.current = jobId;
    // We use recursive setTimeout instead of setInterval so that we always
    // wait for the previous GET response before scheduling the next request.
    // This prevents overlapping requests if the server is slow to respond.
    const tick = async () => {
      // Bail out if a newer upload has superseded this polling loop.
      if (activeJobIdRef.current !== jobId) return;
      try {
        // Ask the backend how the job is progressing.
        const status = await pollUploadJob(jobId);
        // Guard again after the await — a new upload may have started while
        // this request was in-flight.
        if (activeJobIdRef.current !== jobId) return;
        setJobStatus(status);

        if (status.status === 'completed' || status.status === 'failed') {
          // Job is done — stop polling and let the UI show the final result.
          setUploading(false);
          stopPolling();
        } else {
          // Job is still running — wait POLL_INTERVAL_MS then check again.
          pollTimerRef.current = setTimeout(tick, POLL_INTERVAL_MS);
        }
      } catch {
        if (activeJobIdRef.current !== jobId) return;
        // Network or server error — stop polling and surface the message.
        setUploading(false);
        setUploadError(
          'Failed to poll job status. Please refresh and check your batches.',
        );
        stopPolling();
      }
    };

    // Kick off the first poll after the initial delay.
    pollTimerRef.current = setTimeout(tick, POLL_INTERVAL_MS);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    stopPolling();
    setUploading(true);
    setUploadError(null);
    setJobStatus(null);

    const metadata: UploadMetadata = {
      contribStatus: 0,
      onError: 'continue',
    };

    try {
      const { jobId } = await uploadBatchedContributions(
        selectedEntity,
        selectedFile,
        metadata,
      );
      setJobStatus({
        jobId,
        status: 'pending',
        entityName: selectedEntity,
        filename: selectedFile.name,
        progress: { total: 0, processed: 0 },
      });
      startPolling(jobId);
    } catch (err) {
      setUploading(false);
      setUploadError(
        err instanceof Error ? err.message : 'Upload failed. Please try again.',
      );
    }
  };

  // ── Derived state ───────────────────────────────────────────────────────────

  const progressPercent =
    jobStatus && jobStatus.progress.total > 0
      ? Math.round(
          (jobStatus.progress.processed / jobStatus.progress.total) * 100,
        )
      : 0;

  const isTerminal =
    jobStatus?.status === 'completed' || jobStatus?.status === 'failed';

  return {
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
    uploading,
    uploadError,
    jobStatus,
    handleUpload,
    progressPercent,
    isTerminal,
  };
}
