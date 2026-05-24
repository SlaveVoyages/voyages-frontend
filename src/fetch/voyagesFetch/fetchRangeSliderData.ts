import axios from 'axios';

import { RangeSliderStateProps } from '@/share/InterfaceTypes';

import { AUTHTOKEN, BASEURL } from '../../share/AUTH_BASEURL';

export const fetchRangeVoyageSliderData = async (
  dataSend?: RangeSliderStateProps,
) => {
  const response = await axios.post(
    `${BASEURL}/voyage/aggregations/`,
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
