export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  avatarInitials: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
  expiresAt: number; // unix ms
}

export interface LoginResponse {
  success: boolean;
  session?: AuthSession;
  error?: string;
}
