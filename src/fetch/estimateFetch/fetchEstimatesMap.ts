import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

import { MapPropsRequest } from '@/share/InterfaceTypes';

import { AUTHTOKEN, BASEURL } from '../../share/AUTH_BASEURL';

export const fetchEstimatesMap = createAsyncThunk(
  'estimatesmap/fetchEstimatesMap',
  async (dataSend?: MapPropsRequest) => {
    try {
      const response = await axios.post(
        `${BASEURL}/assessment/aggroutes/`,
        dataSend,
        {
          headers: {
            Authorization: AUTHTOKEN,
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch fetchEstimatesMap data');
    }
  },
);
