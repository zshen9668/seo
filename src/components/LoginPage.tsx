import React, { useState, FormEvent } from 'react';
import {
  Compass,
  Lock,
  Mail,
  Smartphone,
  Monitor,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import type { AuthProvidersStatus } from '../types/auth';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  onOAuth?: (provider: 'github' | 'google') => void;
  oauthProviders?: AuthProvidersStatus;
  oauthError?: string | null;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLogin,
  onOAuth,
  oauthProviders = { github: false, google: false, demo: true },
  oauthError,
}) => {
  const [email, setEmail] = useState('admin@seopilot.local');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('请输入邮箱和密码');
      return;
    }
    setLoading(true);
    try {
      const result = await onLogin(email.trim(), password);
      if (!result.ok) setError(result.error || '登录失败');
    } catch {
      setError('网络异常，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const hasOauth = oauthProviders.github || oauthProviders.google;

  return (
    <div className="min-h-dvh min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/30">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Compass className="w-7 h-7 text-indigo-400" />
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">智词领航</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">SEO / GEO 矩阵中控 · 安全登录</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-500">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-900 border border-slate-800">
              <Smartphone className="w-3 h-3" /> 手机
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-900 border border-slate-800">
              <Monitor className="w-3 h-3" /> 电脑
            </span>
            <span className="text-slate-600">OAuth 已支持</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-md space-y-4">
          {/* OAuth */}
          {hasOauth && onOAuth && (
            <div className="space-y-2.5">
              {oauthProviders.github && (
                <button
                  type="button"
                  onClick={() => onOAuth('github')}
                  className="w-full flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-white font-semibold text-sm py-3 rounded-xl transition-all active:scale-[0.98]"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.28-.01-1.02-.02-2-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.3 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.62-5.49 5.92.43.37.81 1.1.81 2.22 0 1.61-.01 2.9-.01 3.3 0 .32.22.7.82.58A12 12 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  使用 GitHub 登录
                </button>
              )}
              {oauthProviders.google && (
                <button
                  type="button"
                  onClick={() => onOAuth('google')}
                  className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm py-3 rounded-xl transition-all active:scale-[0.98]"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden>
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  使用 Google 登录
                </button>
              )}
              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-slate-900 px-2 text-slate-500">或使用邮箱</span>
                </div>
              </div>
            </div>
          )}

          {!hasOauth && (
            <p className="text-[11px] text-slate-500 text-center leading-relaxed">
              未配置 OAuth 时显示邮箱登录。在环境变量中配置 GitHub / Google Client 后即可启用。
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5" htmlFor="login-email">
                工作邮箱
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="username"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl pl-10 pr-3 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  placeholder="you@company.com"
                />
              </div>
            </div>

            <div>
              <label
                className="block text-xs font-medium text-slate-400 mb-1.5"
                htmlFor="login-password"
              >
                密码
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="login-password"
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl pl-10 pr-11 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  placeholder="输入密码"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300"
                  aria-label={showPwd ? '隐藏密码' : '显示密码'}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {(error || oauthError) && (
              <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
                {error || oauthError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold text-sm py-3 rounded-xl shadow-lg shadow-indigo-600/25 transition-all active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  登录中…
                </>
              ) : (
                '进入中控台'
              )}
            </button>
          </form>

          <p className="text-[11px] text-slate-500 text-center leading-relaxed pt-1">
            演示账号：<span className="font-mono text-slate-400">admin@seopilot.local</span>
            <br />
            密码：<span className="font-mono text-slate-400">admin123</span>
            <br />
            <span className="text-slate-600">手机与电脑均可登录 · 会话约 7 天</span>
          </p>
        </div>
      </div>
    </div>
  );
};
