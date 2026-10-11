export type AuthEnv = {
  AUTH_DEMO_EMAIL?: string;
  AUTH_DEMO_PASSWORD?: string;
  AUTH_JWT_SECRET?: string;
  APP_URL?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  avatarInitials: string;
  provider?: 'demo' | 'github' | 'google';
  avatarUrl?: string;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
  expiresAt: number;
};

function env(e: AuthEnv, k: keyof AuthEnv, fallback = ''): string {
  return String(e[k] || fallback).trim();
}

/** UTF-8 safe base64 */
export function b64encode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

export function b64decode(b64: string): string {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function issueSession(user: AuthUser, ttlMs = 7 * 24 * 60 * 60 * 1000): AuthSession {
  const expiresAt = Date.now() + ttlMs;
  const payload = JSON.stringify({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    provider: user.provider || 'demo',
    avatarUrl: user.avatarUrl || '',
    exp: expiresAt,
  });
  const token = `sp.${b64encode(payload)}`;
  return { token, user, expiresAt };
}

export function parseBearer(request: Request): string | null {
  const h = request.headers.get('Authorization') || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

export function verifyToken(token: string): {
  ok: boolean;
  user?: AuthUser;
} {
  try {
    if (token.startsWith('local.')) {
      return {
        ok: true,
        user: {
          id: 'u-demo-admin',
          email: 'admin@seopilot.local',
          name: '管理员',
          role: 'admin',
          avatarInitials: '管',
          provider: 'demo',
        },
      };
    }
    if (!token.startsWith('sp.')) return { ok: false };
    const raw = b64decode(token.slice(3));
    const data = JSON.parse(raw) as {
      sub: string;
      email: string;
      name?: string;
      role?: AuthUser['role'];
      provider?: AuthUser['provider'];
      avatarUrl?: string;
      exp: number;
    };
    if (!data.exp || Date.now() > data.exp) return { ok: false };
    const name = data.name || data.email?.split('@')[0] || '用户';
    return {
      ok: true,
      user: {
        id: data.sub,
        email: data.email,
        name,
        role: data.role || 'admin',
        avatarInitials: name.slice(0, 1).toUpperCase() || 'U',
        provider: data.provider || 'demo',
        avatarUrl: data.avatarUrl || undefined,
      },
    };
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
    provider: 'demo',
  };
  return { success: true as const, session: issueSession(user) };
}

export function listOAuthProviders(e: AuthEnv) {
  return {
    github: Boolean(env(e, 'GITHUB_CLIENT_ID') && env(e, 'GITHUB_CLIENT_SECRET')),
    google: Boolean(env(e, 'GOOGLE_CLIENT_ID') && env(e, 'GOOGLE_CLIENT_SECRET')),
    demo: true,
  };
}

export function getAppOrigin(request: Request, e: AuthEnv): string {
  const configured = env(e, 'APP_URL');
  if (configured) return configured.replace(/\/$/, '');
  const url = new URL(request.url);
  return url.origin;
}

export function createOAuthState(): string {
  const payload = JSON.stringify({ t: Date.now(), n: Math.random().toString(36).slice(2) });
  return b64encode(payload);
}

export function validateOAuthState(state: string, maxAgeMs = 15 * 60 * 1000): boolean {
  try {
    const data = JSON.parse(b64decode(state)) as { t: number };
    return Boolean(data.t && Date.now() - data.t < maxAgeMs);
  } catch {
    return false;
  }
}

export function githubAuthorizeUrl(e: AuthEnv, origin: string, state: string): string | null {
  const clientId = env(e, 'GITHUB_CLIENT_ID');
  if (!clientId) return null;
  const redirectUri = `${origin}/api/auth/oauth/callback/github`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'read:user user:email',
    state,
  });
  return `https://github.com/login/oauth/authorize?${params}`;
}

export function googleAuthorizeUrl(e: AuthEnv, origin: string, state: string): string | null {
  const clientId = env(e, 'GOOGLE_CLIENT_ID');
  if (!clientId) return null;
  const redirectUri = `${origin}/api/auth/oauth/callback/google`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

function initialsFrom(name: string, email: string): string {
  const n = (name || email || 'U').trim();
  return n.slice(0, 1).toUpperCase() || 'U';
}

export async function exchangeGithubCode(
  code: string,
  e: AuthEnv,
  origin: string,
): Promise<AuthSession> {
  const clientId = env(e, 'GITHUB_CLIENT_ID');
  const clientSecret = env(e, 'GITHUB_CLIENT_SECRET');
  const redirectUri = `${origin}/api/auth/oauth/callback/github`;

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });
  if (!tokenRes.ok) throw new Error(`GitHub token 交换失败 (${tokenRes.status})`);
  const tokenData: any = await tokenRes.json();
  if (!tokenData.access_token) throw new Error(tokenData.error_description || 'GitHub 未返回 access_token');

  const userRes = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'SEO-Pilot-OAuth',
    },
  });
  if (!userRes.ok) throw new Error('获取 GitHub 用户信息失败');
  const gh: any = await userRes.json();

  let email = gh.email as string | null;
  if (!email) {
    const emailsRes = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'SEO-Pilot-OAuth',
      },
    });
    if (emailsRes.ok) {
      const emails: any[] = await emailsRes.json();
      const primary = emails.find((x) => x.primary && x.verified) || emails.find((x) => x.verified) || emails[0];
      email = primary?.email || null;
    }
  }

  const name = gh.name || gh.login || 'GitHub User';
  const user: AuthUser = {
    id: `github:${gh.id}`,
    email: email || `${gh.login}@users.noreply.github.com`,
    name,
    role: 'admin',
    avatarInitials: initialsFrom(name, email || gh.login),
    provider: 'github',
    avatarUrl: gh.avatar_url || undefined,
  };
  return issueSession(user);
}

export async function exchangeGoogleCode(
  code: string,
  e: AuthEnv,
  origin: string,
): Promise<AuthSession> {
  const clientId = env(e, 'GOOGLE_CLIENT_ID');
  const clientSecret = env(e, 'GOOGLE_CLIENT_SECRET');
  const redirectUri = `${origin}/api/auth/oauth/callback/google`;

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    throw new Error(`Google token 交换失败: ${errText.slice(0, 200)}`);
  }
  const tokenData: any = await tokenRes.json();
  if (!tokenData.access_token) throw new Error('Google 未返回 access_token');

  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  if (!userRes.ok) throw new Error('获取 Google 用户信息失败');
  const gu: any = await userRes.json();

  const name = gu.name || gu.email || 'Google User';
  const user: AuthUser = {
    id: `google:${gu.id}`,
    email: gu.email || `${gu.id}@google.local`,
    name,
    role: 'admin',
    avatarInitials: initialsFrom(name, gu.email || ''),
    provider: 'google',
    avatarUrl: gu.picture || undefined,
  };
  return issueSession(user);
}

/** Redirect browser to app with session embedded (SPA picks it up). */
export function redirectWithSession(origin: string, session: AuthSession): Response {
  const payload = b64encode(JSON.stringify(session));
  const url = `${origin}/?oauth_session=${encodeURIComponent(payload)}`;
  return Response.redirect(url, 302);
}

export function redirectWithError(origin: string, message: string): Response {
  const url = `${origin}/?oauth_error=${encodeURIComponent(message)}`;
  return Response.redirect(url, 302);
}
