import axios from 'axios';

import { GeoTreeSelectStateProps } from '@/share/InterfaceTypes';

import { AUTHTOKEN, BASEURL } from '../../share/AUTH_BASEURL';

export const fetchEnslaversGeoTreeSelect = async (
  dataSend?: GeoTreeSelectStateProps,
) => {
  const response = await axios.post(
    `${BASEURL}/past/enslaver/geotree/`,
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
