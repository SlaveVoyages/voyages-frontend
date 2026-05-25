import axios from 'axios';

import { BASEURLNODE } from '@/share/AUTH_BASEURL';
import { getAuthHeader } from '@/utils/getAuthHeaders';

// TODO: confirm endpoint with backend team — placeholder until API is ready
export const fetchImpute = async (contributionId: string): Promise<void> => {
  await axios.post(
    `${BASEURLNODE}/contributions/${contributionId}/impute`,
    {},
    {
      headers: {
        Authorization: getAuthHeader(),
        'Content-Type': 'application/json',
      },
    },
  );
};
