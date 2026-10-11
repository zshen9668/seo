import { useState, useCallback, useEffect } from 'react';
import type { AuthSession, AuthUser, LoginResponse } from '../types/auth';

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

/** 本地演示账号（后端未配置时也可登录；生产请改环境变量） */
const DEMO_EMAIL = 'admin@seopilot.local';
const DEMO_PASSWORD = 'admin123';

function localDemoLogin(email: string, password: string): LoginResponse {
  const ok =
    email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD;
  if (!ok) {
    return { success: false, error: '邮箱或密码错误（演示账号见登录页提示）' };
  }
  const user: AuthUser = {
    id: 'u-demo-admin',
    email: DEMO_EMAIL,
    name: '管理员',
    role: 'admin',
    avatarInitials: '管',
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

  useEffect(() => {
    const s = readSession();
    setSession(s);
    setBootstrapping(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
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
      // 离线 / API 未就绪 → 本地演示登录
    }
    const local = localDemoLogin(email, password);
    if (local.success && local.session) {
      writeSession(local.session);
      setSession(local.session);
      return { ok: true as const };
    }
    return { ok: false as const, error: local.error || '登录失败' };
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
    login,
    logout,
  };
}
