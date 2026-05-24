import axios from 'axios';

import { IRootFilterObject } from '@/share/InterfaceTypes';

import { AUTHTOKEN, BASEURL } from '../../share/AUTH_BASEURL';

export const fetchPastEnslaversAutoCompleted = async (
  dataSend?: IRootFilterObject,
) => {
  const response = await axios.post(
    `${BASEURL}/past/enslaver/autocomplete/`,
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
