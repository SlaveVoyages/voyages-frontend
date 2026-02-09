import { ContributionStatus } from '@slavevoyages/voyages-contribute';
import axios from 'axios';

import { BASEURLNODE } from '@/share/AUTH_BASEURL';
import { getAuthHeader } from '@/utils/getAuthHeaders';

// Optional: Bulk update function for multiple contributions
export const bulkUpdateContributionStatus = async (
  contributionIds: string[],
  status: ContributionStatus,
) => {
  try {
    const response = await axios.patch(
      `${BASEURLNODE}/contributions/bulk-status`,
      {
        contributionIds,
        status,
      },
      {
        headers: {
          Authorization: getAuthHeader(),
          'Content-Type': 'application/json',
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error('Error bulk updating contribution status:', error);

    // eslint-disable-next-line import/no-named-as-default-member
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Failed to bulk update status: ${error.response?.data?.message || error.message}`,
      );
    }

    throw error;
  }
};
