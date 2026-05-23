import store from '@/redux/store';
import { AUTHTOKEN } from '@/share/AUTH_BASEURL';

/**
 * Gets the appropriate Authorization header based on current auth state
 * @returns Authorization header string
 */
export const getAuthHeader = (): string => {
  const state = store.getState();
  const token = state.getAuthUserSlice?.user?.accessToken;

  if (token) {
    return `Bearer ${token}`;
  }

  // Fallback to legacy token if no Supabase token is available
  return AUTHTOKEN;
};

/**
 * Gets headers object with Authorization header
 * @param additionalHeaders Additional headers to include
 * @returns Headers object
 */
export const getAuthHeaders = (
  additionalHeaders: Record<string, string> = {},
): Record<string, string> => {
  return {
    Authorization: getAuthHeader(),
    ...additionalHeaders,
  };
};
