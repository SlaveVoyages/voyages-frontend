// Contribute/BatchComponent/utils/batchApi.ts
import {
  Contribution,
  PublicationBatch,
} from '@slavevoyages/voyages-contribute';

import { BASEURLNODE } from '@/share/AUTH_BASEURL';
import { getAuthHeader } from '@/utils/getAuthHeaders';

/**
 * A batch as the server actually sends it.
 *
 * `/batches/:filter` left-joins the contributions and their change sets (see
 * `getBatchesByStatus` in voyages-contribute), but the package's
 * `PublicationBatch` stops at the batch row itself. Widened here rather than
 * cast at each use, so callers can read the contributions with types intact.
 *
 * Optional because only the list endpoints hydrate it — a batch returned from
 * create/update carries no contributions.
 */
export interface BatchWithContributions extends PublicationBatch {
  contributions?: Contribution[];
}

export interface BatchResponse {
  filter: string;
  count: number;
  batches: BatchWithContributions[];
}

// Helper function to get auth headers
const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: getAuthHeader(),
});

// Helper function to determine batch status
export const getBatchStatus = (
  batch: PublicationBatch,
): 'pending' | 'published' => {
  return batch.published !== null ? 'published' : 'pending';
};

/**
 * Read a batch's publication timestamp.
 *
 * `publication_batches.published` is a varchar column, so SQLite stores the
 * epoch number with text affinity and hands it back as `"1754732400000"`.
 * `new Date` on that string is an Invalid Date, so go through `Number` first
 * and fall back to string parsing in case the column ever holds an ISO date.
 */
export const parseBatchDate = (
  timestamp: number | string | null | undefined,
): Date | null => {
  if (timestamp === null || timestamp === undefined || timestamp === '') {
    return null;
  }
  const epoch = Number(timestamp);
  const date = Number.isFinite(epoch) ? new Date(epoch) : new Date(timestamp);
  return Number.isNaN(date.getTime()) ? null : date;
};

// Helper function to format date
export const formatBatchDate = (timestamp: number | string | null): string => {
  return parseBatchDate(timestamp)?.toLocaleDateString() ?? 'Not published';
};

// API functions
export const batchApi = {
  // Create a new publication batch
  async createBatch(data: PublicationBatch): Promise<PublicationBatch> {
    const response = await fetch(`${BASEURLNODE}/create_batch`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create batch');
    }

    return response.json();
  },

  // Get batches by status filter
  async getBatches(
    filter: 'all' | 'pending' | 'published',
  ): Promise<BatchResponse> {
    const response = await fetch(`${BASEURLNODE}/batches/${filter}`, {
      headers: {
        Authorization: getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch batches');
    }

    return response.json();
  },

  // Assign contribution to batch
  async assignContributionToBatch(
    contributionId: string,
    batchId: number | null,
  ): Promise<unknown> {
    const response = await fetch(`${BASEURLNODE}/assign_to_batch`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        contribution_id: contributionId,
        batch_id: batchId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to assign contribution to batch');
    }

    return response.json();
  },

  // Bulk assign contributions to batch
  async bulkAssignContributionsToBatch(
    contributionIds: string[],
    batchId: number | null,
  ): Promise<unknown[]> {
    const promises = contributionIds.map((contributionId) =>
      this.assignContributionToBatch(contributionId, batchId),
    );

    const results = await Promise.allSettled(promises);
    const failures = results.filter((result) => result.status === 'rejected');

    if (failures.length > 0) {
      throw new Error(
        `Failed to assign ${failures.length} out of ${contributionIds.length} contributions`,
      );
    }

    return results
      .filter((result) => result.status === 'fulfilled')
      .map((result) => (result as PromiseFulfilledResult<unknown>).value);
  },

  // Get pending batches (utility function)
  async getPendingBatches(): Promise<BatchWithContributions[]> {
    const response = await this.getBatches('pending');
    return response.batches;
  },

  // Get published batches (utility function)
  async getPublishedBatches(): Promise<BatchWithContributions[]> {
    const response = await this.getBatches('published');
    return response.batches;
  },

  // Get all batches (utility function)
  async getAllBatches(): Promise<BatchWithContributions[]> {
    const response = await this.getBatches('all');
    return response.batches;
  },

  // Update batch (rename and/or update comments)
  async updateBatch(
    batchId: number,
    data: Partial<PublicationBatch>,
  ): Promise<PublicationBatch> {
    const response = await fetch(`${BASEURLNODE}/edit_batch`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        id: batchId,
        title: data.title,
        comments: data.comments,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.details || 'Failed to update batch');
    }

    return response.json();
  },

  // Delete batch (only if no contributions are assigned)
  async deleteBatch(batchId: number): Promise<void> {
    const response = await fetch(`${BASEURLNODE}/batches/${batchId}`, {
      method: 'DELETE',
      headers: {
        Authorization: getAuthHeader(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.details || 'Failed to delete batch');
    }
    // Success returns 204 No Content
  },
};
