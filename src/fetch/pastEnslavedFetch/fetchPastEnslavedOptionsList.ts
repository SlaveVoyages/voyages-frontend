import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

import { AUTHTOKEN, BASEURL } from '@/share/AUTH_BASEURL';
import { TableListPropsRequest } from '@/share/InterfaceTypes';

export const fetchEnslavedOptionsList = createAsyncThunk(
  'enslavedOptions/fetchEnslavedOptionsList',
  async (dataSend?: TableListPropsRequest) => {
    try {
      const response = await axios.post(`${BASEURL}/past/enslaved/`, dataSend, {
        headers: {
          Authorization: AUTHTOKEN,
          'Content-Type': 'application/json',
        },
      });
      return response;
    } catch (error) {
      throw new Error('Failed to fetchEnslavedOptionsList data');
    }
  },
);
