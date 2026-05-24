import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

import { BlogDataPropsRequest } from '@/share/InterfaceTypesBlog';

import { AUTHTOKEN, BASEURL } from '../../share/AUTH_BASEURL';

export const fetchBlogData = createAsyncThunk(
  'BlogData/fetchBlogData',
  async (dataSend?: BlogDataPropsRequest) => {
    try {
      const response = await axios.post(`${BASEURL}/blog/`, dataSend, {
        headers: {
          Authorization: AUTHTOKEN,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch fetchBlogData data');
    }
  },
);
