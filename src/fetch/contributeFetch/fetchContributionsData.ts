import axios, { isAxiosError } from 'axios';

import { AUTHTOKEN, BASEURLNODE } from '@/share/AUTH_BASEURL';

export const fetchContributionsData = async (filterQuery: string) => {
  const response = await axios.get(
    `${BASEURLNODE}/contributions?page=1&limit=50000&${filterQuery}`,
    {
      headers: {
        Authorization: AUTHTOKEN,
        'Content-Type': 'application/json',
      },
    },
  );
  return response.data;
};

export const fetchContributionsDataByAuthor = async (
  filterQuery: string,
  _authorEmail?: string,
) => {
  const params = new URLSearchParams(filterQuery);
  if (!params.has('page')) {
    params.append('page', '1');
  }
  if (!params.has('limit')) {
    params.append('limit', '10000');
  }

  const url = `${BASEURLNODE}/contributions/wip?${params.toString()}`;

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: AUTHTOKEN,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching WIP contributions:', error);
    if (isAxiosError(error)) {
      console.error('Response data:', error.response?.data);
    }
    throw error;
  }
};
