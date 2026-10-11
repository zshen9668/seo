import React from 'react';
import {
  Compass,
  Globe,
  RefreshCw,
  ShieldCheck,
  Plus,
  Activity,
  Layers,
  ChevronDown,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { Website } from '../types/seo';

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
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-6 py-2.5">
      <div className="flex items-center justify-between gap-4">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Compass className="w-5 h-5 text-indigo-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                智词领航
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  SEO 矩阵中控
                </span>
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                爬虫雷达在线
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden md:block">
              多站点策略管理 • SERP实时排名雷达 • 自动化技术体检 • 竞品差距透视
            </p>
          </div>
        </div>

        {/* Center: Website Switcher */}
        <div className="flex items-center gap-2">
          <div className="relative">
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
              className="appearance-none bg-slate-950 border border-slate-700 hover:border-slate-600 text-xs text-slate-200 font-medium rounded-xl pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-inner min-w-[210px]"
            >
              {websites.map((w) => (
                <option key={w.id} value={w.id}>
                  🌐 {w.name} ({w.domain})
                </option>
              ))}
              <option value="NEW">+ 接入新站点...</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Quick Site Health Pill */}
          <div className="hidden lg:flex items-center gap-2.5 text-xs bg-slate-950/70 border border-slate-800 px-3 py-1.5 rounded-xl font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-sans">健康度:</span>
              <span
                className={`font-bold ${
                  activeSite.healthScore >= 90
                    ? 'text-emerald-400'
                    : activeSite.healthScore >= 75
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {activeSite.healthScore}/100
              </span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-sans">域名DR:</span>
              <span className="font-bold text-indigo-400">{activeSite.domainRating}</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-sans">监控词数:</span>
              <span className="font-bold text-slate-200">{activeSite.totalTrackedKeywords}</span>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Pull Rankings Button */}
          <button
            onClick={onPullRankings}
            disabled={isPullingRankings}
            className="flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-xl shadow-sm transition-all shadow-indigo-600/25 active:scale-95 disabled:opacity-60"
            title="向各大搜索引擎拉取最新的SERP排名位移数据"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPullingRankings ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">
              {isPullingRankings ? '正在抓取SERP...' : '刷新排位'}
            </span>
          </button>

          {/* Trigger Audit Button */}
          <button
            onClick={onTriggerAudit}
            disabled={isAuditing}
            className="hidden sm:flex items-center gap-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl border border-slate-700 transition-colors disabled:opacity-60"
            title="立即启动全自动化爬虫深度体检"
          >
            <ShieldCheck className={`w-3.5 h-3.5 text-emerald-400 ${isAuditing ? 'animate-pulse' : ''}`} />
            <span>{isAuditing ? '正在体检...' : '全站体检'}</span>
          </button>

          {/* Track Keyword Button */}
          <button
            onClick={onOpenAddKeyword}
            className="flex items-center gap-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-2 rounded-xl border border-slate-700 transition-colors"
            title="添加需要监控的核心关键词"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">添加监控词</span>
          </button>
        </div>
      </div>
    </header>
  );
};
