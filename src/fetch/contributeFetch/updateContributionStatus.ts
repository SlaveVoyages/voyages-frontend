import { ContributionStatus } from '@slavevoyages/voyages-contribute';
import axios from 'axios';

import { BASEURLNODE } from '@/share/AUTH_BASEURL';
import { getAuthHeader } from '@/utils/getAuthHeaders';

// API function for updating contribution status
export const updateContributionStatus = async (
  contributionId: string,
  status: ContributionStatus,
  decisionComments?: string,
) => {
  try {
    const response = await axios.patch(
      `${BASEURLNODE}/contributions/${contributionId}/change_status`,
      { status, decisionComments },
      {
        headers: {
          Authorization: getAuthHeader(),
          'Content-Type': 'application/json',
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error('Error updating contribution status:', error);

    // eslint-disable-next-line import/no-named-as-default-member
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Failed to update status: ${error.response?.data?.message || error.message}`,
      );
    }

    throw error;
  }
};
