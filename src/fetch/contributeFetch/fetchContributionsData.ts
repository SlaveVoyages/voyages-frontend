import axios from 'axios';

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

export const fetchContributionsDataByID = async (id: string) => {
  const response = await axios.get(`${BASEURLNODE}/contributions/${id}`, {
    headers: {
      Authorization: AUTHTOKEN,
      'Content-Type': 'application/json',
    },
  });
  return {
    data: response?.data,
    status: response.statusText,
  };
};
