import axios from 'axios';

import { BlogDataPropsRequest } from '@/share/InterfaceTypesBlog';

import { AUTHTOKEN, BASEURL } from '../../share/AUTH_BASEURL';

export const fetchInstitutionData = async (dataSend?: BlogDataPropsRequest) => {
  const response = await axios.post(`${BASEURL}/blog/institution/`, dataSend, {
    headers: {
      Authorization: AUTHTOKEN,
      'Content-Type': 'application/json',
    },
  });
  return response.data;
};
