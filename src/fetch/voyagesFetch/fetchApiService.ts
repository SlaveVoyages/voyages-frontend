import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { AUTHTOKEN, BASEURL } from '../../share/AUTH_BASEURL';
import { Options } from '@vitejs/plugin-react-refresh';
import { RootState } from '@/redux/store';

export const voyagesApi = createApi({
  reducerPath: 'voyagesApi',
  baseQuery: fetchBaseQuery({
    baseUrl: BASEURL,
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const token = state.getAuthUserSlice.user?.accessToken;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      } else {
        // Fallback to legacy token if no Supabase token is available
        headers.set('Authorization', AUTHTOKEN);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getOptions: builder.query({
      query: () => ({
        url: '/common/schemas/?schema_name=Voyage&hierarchical=False/',
        method: 'GET',
      }),
      transformResponse: (response: Options) => {
        return response;
      },
    }),
  }),
});

export const { useGetOptionsQuery } = voyagesApi;
