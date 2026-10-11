import React, { useState, FormEvent } from 'react';
import { Compass, Lock, Mail, Smartphone, Monitor, Eye, EyeOff, Loader2 } from 'lucide-react';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
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

  return (
    <div className="min-h-dvh min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* background glow */}
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
            <span className="text-slate-600">均已适配</span>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-md space-y-4"
        >
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
            <label className="block text-xs font-medium text-slate-400 mb-1.5" htmlFor="login-password">
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

          {error && (
            <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
              {error}
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

          <p className="text-[11px] text-slate-500 text-center leading-relaxed pt-1">
            演示账号：<span className="font-mono text-slate-400">admin@seopilot.local</span>
            <br />
            密码：<span className="font-mono text-slate-400">admin123</span>
            <br />
            <span className="text-slate-600">手机与电脑浏览器均可登录，会话约 7 天</span>
          </p>
        </form>
      </div>
    </div>
  );
};
