import axios, { isAxiosError } from 'axios';

import { BASEURLNODE } from '@/share/AUTH_BASEURL';
import { getAuthHeader } from '@/utils/getAuthHeaders';

export const fetchContributionsData = async (
  page: number,
  limit: number,
  filterQuery: string,
) => {
  const params = new URLSearchParams(filterQuery);
  const response = await axios.get(
    `${BASEURLNODE}/contributions?page=${page}&limit=${limit}&${params.toString()}`,
    {
      headers: {
        Authorization: getAuthHeader(),
        'Content-Type': 'application/json',
      },
    },
  );
  return response.data;
};

export const fetchCheckVoyageConflict = async (_userEmail?: string) => {
  const response = await axios.get(`${BASEURLNODE}/contributions`, {
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
    },
  });
  return response.data;
};

export const fetchContributionsDataByAuthor = async (filterQuery: string) => {
  const params = new URLSearchParams(filterQuery);
  const url = `${BASEURLNODE}/contributions/wip?${params.toString()}`;

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: getAuthHeader(),
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

export const fetchContributionById = async (contributionId: string) => {
  const url = `${BASEURLNODE}/contributions/wip/${contributionId}`;

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: getAuthHeader(),
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching contribution by ID:', error);
    if (isAxiosError(error)) {
      console.error('Response data:', error.response?.data);
    }
    throw error;
  }
};

// For editorial platform — fetches any contribution regardless of status (submitted, accepted, etc.)
export const fetchContributionByIdForEditor = async (
  contributionId: string,
) => {
  const url = `${BASEURLNODE}/contributions/${contributionId}`;
  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: getAuthHeader(),
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching editorial contribution by ID:', error);
    if (isAxiosError(error)) {
      console.error('Response data:', error.response?.data);
    }
    throw error;
  }
};

export const deleteContribution = async (contributionId: string) => {
  const url = `${BASEURLNODE}/contributions/wip/${contributionId}`;

  try {
    const response = await axios.delete(url, {
      headers: {
        Authorization: getAuthHeader(),
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
