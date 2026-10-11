import { useState, useCallback, useEffect } from 'react';
import type { AuthSession, AuthUser, AuthProvidersStatus, LoginResponse } from '../types/auth';

const STORAGE_KEY = 'seopilot_auth_session';

function readSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as AuthSession;
    if (!s?.token || !s?.user || !s?.expiresAt) return null;
    if (Date.now() > s.expiresAt) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

function writeSession(session: AuthSession | null) {
  try {
    if (!session) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    /* private mode */
  }
}

function b64decodeUtf8(b64: string): string {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

/** Parse OAuth redirect: /?oauth_session=... or /?oauth_error=... */
function consumeOAuthQuery(): { session?: AuthSession; error?: string } {
  try {
    const params = new URLSearchParams(window.location.search);
    const err = params.get('oauth_error');
    const raw = params.get('oauth_session');
    if (!err && !raw) return {};

    // Clean URL without losing path
    const clean = window.location.pathname + window.location.hash;
    window.history.replaceState({}, '', clean || '/');

    if (err) return { error: err };
    if (raw) {
      const session = JSON.parse(b64decodeUtf8(decodeURIComponent(raw))) as AuthSession;
      if (session?.token && session?.user && session?.expiresAt) return { session };
    }
  } catch {
    return { error: 'OAuth 会话解析失败' };
  }
  return {};
}

const DEMO_EMAIL = 'admin@seopilot.local';
const DEMO_PASSWORD = 'admin123';

function localDemoLogin(email: string, password: string): LoginResponse {
  const ok = email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD;
  if (!ok) {
    return { success: false, error: '邮箱或密码错误（演示账号见登录页提示）' };
  }
  const user: AuthUser = {
    id: 'u-demo-admin',
    email: DEMO_EMAIL,
    name: '管理员',
    role: 'admin',
    avatarInitials: '管',
    provider: 'demo',
  };
  const session: AuthSession = {
    token: `local.${btoa(`${user.id}.${Date.now()}`)}`,
    user,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };
  return { success: true, session };
}

export function useAuth() {
  const [session, setSession] = useState<AuthSession | null>(() => readSession());
  const [bootstrapping, setBootstrapping] = useState(true);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [oauthProviders, setOauthProviders] = useState<AuthProvidersStatus>({
    github: false,
    google: false,
    demo: true,
  });

  useEffect(() => {
    const fromOauth = consumeOAuthQuery();
    if (fromOauth.session) {
      writeSession(fromOauth.session);
      setSession(fromOauth.session);
    } else if (fromOauth.error) {
      setOauthError(fromOauth.error);
      setSession(readSession());
    } else {
      setSession(readSession());
    }
    setBootstrapping(false);

    // Probe which OAuth providers are configured on the server
    fetch('/api/auth/providers')
      .then((r) => r.json())
      .then((data) => {
        if (data?.providers) setOauthProviders(data.providers);
      })
      .catch(() => {
        /* local-only */
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setOauthError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const data = (await res.json()) as LoginResponse;
        if (data.success && data.session) {
          writeSession(data.session);
          setSession(data.session);
          return { ok: true as const };
        }
        if (data.error) return { ok: false as const, error: data.error };
      }
    } catch {
      // offline → local demo
    }
    const local = localDemoLogin(email, password);
    if (local.success && local.session) {
      writeSession(local.session);
      setSession(local.session);
      return { ok: true as const };
    }
    return { ok: false as const, error: local.error || '登录失败' };
  }, []);

  /** Full-page redirect to OAuth provider (works on mobile & desktop). */
  const loginWithOAuth = useCallback((provider: 'github' | 'google') => {
    setOauthError(null);
    window.location.href = `/api/auth/oauth/${provider}`;
  }, []);

  const logout = useCallback(async () => {
    const token = session?.token;
    writeSession(null);
    setSession(null);
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
      } catch {
        /* ignore */
      }
    }
  }, [session?.token]);

  return {
    user: session?.user ?? null,
    token: session?.token ?? null,
    isAuthenticated: Boolean(session?.token),
    bootstrapping,
    oauthError,
    oauthProviders,
    login,
    loginWithOAuth,
    logout,
    clearOauthError: () => setOauthError(null),
  };
}
