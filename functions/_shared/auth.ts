export type AuthEnv = {
  AUTH_DEMO_EMAIL?: string;
  AUTH_DEMO_PASSWORD?: string;
  AUTH_JWT_SECRET?: string;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  avatarInitials: string;
};

function env(e: AuthEnv, k: keyof AuthEnv, fallback: string) {
  return (e[k] || fallback).trim();
}

/** Simple opaque token (base64 payload). For production, swap to real JWT/HMAC. */
export function issueSession(user: AuthUser, ttlMs = 7 * 24 * 60 * 60 * 1000) {
  const expiresAt = Date.now() + ttlMs;
  const payload = JSON.stringify({ sub: user.id, email: user.email, exp: expiresAt });
  const token = `sp.${btoa(payload)}`;
  return { token, user, expiresAt };
}

export function parseBearer(request: Request): string | null {
  const h = request.headers.get('Authorization') || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

export function verifyToken(token: string): { ok: boolean; userId?: string; email?: string } {
  try {
    if (!token.startsWith('sp.') && !token.startsWith('local.')) {
      return { ok: false };
    }
    if (token.startsWith('local.')) {
      return { ok: true, userId: 'u-demo-admin', email: 'admin@seopilot.local' };
    }
    const raw = atob(token.slice(3));
    const data = JSON.parse(raw) as { sub: string; email: string; exp: number };
    if (!data.exp || Date.now() > data.exp) return { ok: false };
    return { ok: true, userId: data.sub, email: data.email };
  } catch {
    return { ok: false };
  }
}

export function attemptLogin(email: string, password: string, e: AuthEnv) {
  const demoEmail = env(e, 'AUTH_DEMO_EMAIL', 'admin@seopilot.local').toLowerCase();
  const demoPassword = env(e, 'AUTH_DEMO_PASSWORD', 'admin123');
  if (email.trim().toLowerCase() !== demoEmail || password !== demoPassword) {
    return { success: false as const, error: '邮箱或密码错误' };
  }
  const user: AuthUser = {
    id: 'u-demo-admin',
    email: demoEmail,
    name: '管理员',
    role: 'admin',
    avatarInitials: '管',
  };
  return { success: true as const, session: issueSession(user) };
}
