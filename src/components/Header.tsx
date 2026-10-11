import React, { useState, useRef, useEffect } from 'react';
import {
  Compass,
  RefreshCw,
  ShieldCheck,
  Plus,
  ChevronDown,
  LogOut,
  User,
} from 'lucide-react';
import { Website } from '../types/seo';
import type { AuthUser } from '../types/auth';

interface HeaderProps {
  websites: Website[];
  activeSite: Website;
  onSelectSite: (site: Website) => void;
  onPullRankings: () => void;
  isPullingRankings: boolean;
  onTriggerAudit: () => void;
  isAuditing: boolean;
  onOpenAddKeyword: () => void;
  onOpenAddSite: () => void;
  user?: AuthUser | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  websites,
  activeSite,
  onSelectSite,
  onPullRankings,
  isPullingRankings,
  onTriggerAudit,
  isAuditing,
  onOpenAddKeyword,
  onOpenAddSite,
  user,
  onLogout,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3 sm:px-4 lg:px-6 py-2.5 safe-top">
      <div className="flex flex-col gap-2.5 sm:gap-0 sm:flex-row sm:items-center sm:justify-between">
        {/* Row 1: brand + user */}
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Compass className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                  智词领航
                </h1>
                <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
                  SEO 中控
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  在线
                </span>
              </div>
              <p className="text-[10px] text-slate-500 hidden md:block truncate max-w-md">
                多站点 · SERP · GEO · 技术体检 · 竞品差距
              </p>
            </div>
          </div>

          {/* User chip (mobile-friendly) */}
          {user && (
            <div className="relative shrink-0" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-xl bg-slate-950 border border-slate-700 hover:border-slate-600 text-xs"
              >
                <span className="w-7 h-7 rounded-lg bg-indigo-600/30 text-indigo-300 flex items-center justify-center font-bold text-[11px]">
                  {user.avatarInitials}
                </span>
                <span className="hidden xs:inline sm:inline max-w-[72px] truncate text-slate-300">
                  {user.name}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50 py-1 text-xs overflow-hidden">
                  <div className="px-3 py-2 border-b border-slate-800">
                    <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      {user.name}
                    </div>
                    <div className="text-slate-500 font-mono mt-0.5 truncate">{user.email}</div>
                    <div className="text-indigo-400 mt-1">{user.role}</div>
                  </div>
                  {onLogout && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-rose-400 hover:bg-slate-800/80 text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      退出登录
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Row 2: site switcher + actions */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative flex-1 sm:flex-none min-w-0">
            <select
              value={activeSite.id}
              onChange={(e) => {
                if (e.target.value === 'NEW') {
                  onOpenAddSite();
                } else {
                  const found = websites.find((w) => w.id === e.target.value);
                  if (found) onSelectSite(found);
                }
              }}
              className="appearance-none w-full sm:w-auto bg-slate-950 border border-slate-700 hover:border-slate-600 text-xs text-slate-200 font-medium rounded-xl pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-inner sm:min-w-[200px] max-w-full"
            >
              {websites.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.domain})
                </option>
              ))}
              <option value="NEW">+ 接入新站点...</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="hidden lg:flex items-center gap-2.5 text-xs bg-slate-950/70 border border-slate-800 px-3 py-1.5 rounded-xl font-mono shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-sans">健康:</span>
              <span
                className={`font-bold ${
                  activeSite.healthScore >= 90
                    ? 'text-emerald-400'
                    : activeSite.healthScore >= 75
                      ? 'text-amber-400'
                      : 'text-rose-400'
                }`}
              >
                {activeSite.healthScore}
              </span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-sans">DR:</span>
              <span className="font-bold text-indigo-400">{activeSite.domainRating}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={onPullRankings}
              disabled={isPullingRankings}
              className="flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 sm:px-3 py-2 rounded-xl shadow-sm transition-all shadow-indigo-600/25 active:scale-95 disabled:opacity-60"
              title="拉取最新 SERP 排位"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPullingRankings ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">
                {isPullingRankings ? '抓取中…' : '刷新排位'}
              </span>
            </button>

            <button
              type="button"
              onClick={onTriggerAudit}
              disabled={isAuditing}
              className="hidden sm:flex items-center gap-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl border border-slate-700 transition-colors disabled:opacity-60"
              title="全站体检"
            >
              <ShieldCheck className={`w-3.5 h-3.5 text-emerald-400 ${isAuditing ? 'animate-pulse' : ''}`} />
              <span>{isAuditing ? '体检中…' : '全站体检'}</span>
            </button>

            <button
              type="button"
              onClick={onOpenAddKeyword}
              className="flex items-center gap-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-2 rounded-xl border border-slate-700 transition-colors"
              title="添加监控词"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline">添加监控词</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
