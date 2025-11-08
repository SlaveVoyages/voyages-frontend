import axios, { isAxiosError } from 'axios';

import { AUTHTOKEN, BASEURLNODE } from '@/share/AUTH_BASEURL';

export const deleteContribution = async (
  contributionId: string,
  authorUser?: string,
) => {
  const url = `${BASEURLNODE}/contributions/wip/${contributionId}`;

  try {
    const response = await axios.delete(url, {
      headers: {
        // Todo: Authorization: AUTHTOKEN, ==> will change when we can get Auth from API
        Authorization: authorUser || AUTHTOKEN,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting contribution:', error);
    if (isAxiosError(error)) {
      console.error('Response data:', error.response?.data);
    }
    throw error;
  }
};
