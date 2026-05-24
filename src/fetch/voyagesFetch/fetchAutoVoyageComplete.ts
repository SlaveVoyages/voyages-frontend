import axios from 'axios';

import { IRootFilterObject } from '@/share/InterfaceTypes';

import { AUTHTOKEN, BASEURL } from '../../share/AUTH_BASEURL';

export const fetchAutoVoyageComplete = async (dataSend?: IRootFilterObject) => {
  const response = await axios.post(
    `${BASEURL}/voyage/autocomplete/`,
    dataSend,
    {
      headers: {
        Authorization: AUTHTOKEN,
        'Content-Type': 'application/json',
      },
    },
  );
  return response.data;
};
