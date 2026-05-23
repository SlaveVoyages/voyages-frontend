// Contribute/BatchComponent/utils/batchApi.ts
import { PublicationBatch } from '@slavevoyages/voyages-contribute';

import { BASEURLNODE } from '@/share/AUTH_BASEURL';
import { getAuthHeader } from '@/utils/getAuthHeaders';

export interface BatchResponse {
  filter: string;
  count: number;
  batches: PublicationBatch[];
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

// Helper function to format date
export const formatBatchDate = (timestamp: number | null): string => {
  if (!timestamp) return 'Not published';
  return new Date(timestamp).toLocaleDateString();
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
  async getPendingBatches(): Promise<PublicationBatch[]> {
    const response = await this.getBatches('pending');
    return response.batches;
  },

  // Get published batches (utility function)
  async getPublishedBatches(): Promise<PublicationBatch[]> {
    const response = await this.getBatches('published');
    return response.batches;
  },

  // Get all batches (utility function)
  async getAllBatches(): Promise<PublicationBatch[]> {
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
