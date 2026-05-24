import { BASEURLNODE } from '@/share/AUTH_BASEURL';
import { getAuthHeader } from '@/utils/getAuthHeaders';

export type UploadEntity = 'Voyage' | 'Enslaved' | 'Enslaver';

export interface InspectResult {
  entityName: string;
  /** CSV headers that the backend mapping does not recognise. */
  csvHeadersNotInMapping: string[];
  /** Headers the backend mapping expects that are absent from the CSV. */
  mappingHeadersNotInCsv: string[];
}

export interface UploadMetadata {
  /** Contribution status: 0=WorkInProgress, 1=Submitted, 2=Accepted. Default 0. */
  contribStatus?: 0 | 1 | 2;
  /** How to handle mapping errors. Default "abort". */
  onError?: 'abort' | 'continue';
  /** Title for the created batch. */
  batchTitle?: string;
  /** Comments for the created batch. */
  batchComments?: string;
  /** Per-row contribution title template. Supports {id}, {entityName}, {filename}, {index}. */
  contributionTitle?: string;
  /** Per-row contribution comments template. */
  contributionComments?: string;
  /** Optional cap on rows processed (useful for smoke tests). */
  maxRows?: number;
}

export interface UploadJobStatus {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  entityName: string;
  filename: string;
  progress: {
    /** Total CSV rows the importer will process (capped by maxRows). */
    total: number;
    /** Rows decided so far (mapped or dropped). */
    processed: number;
  };
  errors?: unknown[];
  result?: {
    /** Number of contributions actually inserted. */
    pushed: number;
    batchId: number;
    batchTitle: string;
  };
  /** Reason string populated when status === 'failed'. */
  failureReason?: string;
}

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

const authHeaders = () => ({ Authorization: getAuthHeader() });

/**
 * POST /inspect-batched-contributions/:entity
 *
 * Sends a CSV file and returns the diff between its headers and the backend
 * entity mapping's expected headers. Passing an empty CSV (no columns) will
 * return all expected headers as `missingHeaders` — useful for building a
 * blank template.
 */
export async function inspectBatchedContributions(
  entity: UploadEntity,
  file: File,
): Promise<InspectResult> {
  const form = new FormData();
  form.append('file', file, file.name);

  const response = await fetch(
    `${BASEURLNODE}/inspect-batched-contributions/${entity}`,
    {
      method: 'POST',
      headers: authHeaders(),
      body: form,
    },
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new HttpError(
      response.status,
      error.error ??
        `inspect-batched-contributions failed (${response.status})`,
    );
  }

  return response.json();
}

/**
 * POST /upload-batched-contributions/:entity
 *
 * Starts an async bulk import job. Returns a jobId you can poll with
 * `pollUploadJob`.
 */
export async function uploadBatchedContributions(
  entity: UploadEntity,
  file: File,
  metadata?: UploadMetadata,
): Promise<{ jobId: string }> {
  const form = new FormData();
  form.append('file', file, file.name);
  if (metadata) {
    form.append(
      'metadata',
      new Blob([JSON.stringify(metadata)], { type: 'application/json' }),
    );
  }

  const response = await fetch(
    `${BASEURLNODE}/upload-batched-contributions/${entity}`,
    {
      method: 'POST',
      headers: authHeaders(),
      body: form,
    },
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new HttpError(
      response.status,
      error.error ?? `upload-batched-contributions failed (${response.status})`,
    );
  }

  return response.json();
}

/**
 * GET /upload-jobs/:jobId
 *
 * Polls the status of a running import job. Repeat until
 * `status === 'completed' | 'failed'`.
 */
export async function pollUploadJob(jobId: string): Promise<UploadJobStatus> {
  const response = await fetch(`${BASEURLNODE}/upload-jobs/${jobId}`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new HttpError(
      response.status,
      error.error ?? `poll upload-jobs failed (${response.status})`,
    );
  }

  return response.json();
}
