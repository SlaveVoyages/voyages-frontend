import axios from 'axios';

import { BASEURL } from '../../share/AUTH_BASEURL';
import { getAuthHeader } from '@/utils/getAuthHeaders';

export const fetchTreeSelectedContributeLocation = async () => {
  const response = await axios.get(`${BASEURL}/contrib/location_tree`, {
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
    },
  });

  return response.data;
};
