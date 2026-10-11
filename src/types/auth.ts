export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  avatarInitials: string;
  provider?: 'demo' | 'github' | 'google';
  avatarUrl?: string;
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

export interface AuthProvidersStatus {
  github: boolean;
  google: boolean;
  demo: boolean;
}
