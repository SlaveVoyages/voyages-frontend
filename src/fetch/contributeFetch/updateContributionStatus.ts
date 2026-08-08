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
      // `id` is sent in the body as well as the path because the endpoint reads
      // it from the body (`req.body.id`) and ignores its own `:id` route param.
      // Without it the lookup runs on `undefined` and every call 404s. Callers
      // that send a whole contribution work by accident, since that carries an
      // id already.
      { id: contributionId, status, decisionComments },
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
