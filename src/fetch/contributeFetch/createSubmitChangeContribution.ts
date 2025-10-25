import { Contribution } from '@dotproductdev/voyages-contribute';
import axios, { isAxiosError } from 'axios';

import { BASEURLNODE } from '@/share/AUTH_BASEURL';

// API function for creating/updating contribution
export const createSubmitChangeContribution = async (
  contribution: Contribution,
): Promise<Contribution> => {
  try {
    const response = await axios.post(
      `${BASEURLNODE}/contributions/${contribution.id}/change_status`,
      contribution,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error('Error creating contribution:', error);

    if (isAxiosError(error)) {
      throw new Error(
        `Failed to create contribution: ${error.response?.data?.error || error.message}`,
      );
    }

    throw error;
  }
};
