export interface User {
  id: string;
  email: string;
  userName: string;
  firstName?: string;
  lastName?: string;
  institution?: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface AuthState {
  user: User | null;
  session: any | null;
  loading: boolean;
  error: string | null;
}
