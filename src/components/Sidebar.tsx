import React from 'react';
import {
  TrendingUp,
  ShieldCheck,
  Search,
  Globe,
  Radio,
  Clock,
  Layers,
  Sparkles,
  ChevronRight,
  Sliders,
  Cpu,
} from 'lucide-react';
import { Website } from '../types/seo';

interface SidebarProps {
  currentTab: 'rankings' | 'audit' | 'research' | 'sites' | 'geo' | 'ai_hub';
  onSelectTab: (tab: 'rankings' | 'audit' | 'research' | 'sites' | 'geo' | 'ai_hub') => void;
  activeSite: Website;
  unresolvedIssuesCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  activeSite,
  unresolvedIssuesCount,
}) => {
  const navItems = [
    {
      id: 'rankings' as const,
      label: '关键词排位雷达',
      sublabel: 'SERP 历史排位走势 (Recharts)',
      icon: TrendingUp,
      badge: `${activeSite.totalTrackedKeywords} 个词`,
      badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    },
    {
      id: 'geo' as const,
      label: 'GEO 智能中控',
      sublabel: 'AI引擎优化与全球地域定向',
      icon: Sparkles,
      badge: 'AI & 地域',
      badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    },
    {
      id: 'audit' as const,
      label: '自动化全站体检',
      sublabel: '技术缺陷与 Gemini 内容评估',
      icon: ShieldCheck,
      badge: `${unresolvedIssuesCount} 待修`,
      badgeColor:
        unresolvedIssuesCount > 0
          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    {
      id: 'research' as const,
      label: '关键词拓展挖掘',
      sublabel: '种子词拓词与竞品透视',
      icon: Search,
      badge: '竞品差距',
      badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    },
    {
      id: 'ai_hub' as const,
      label: 'AI API 分析接入',
      sublabel: 'Gemini 3.8 Flash 全链路中枢',
      icon: Cpu,
      badge: '在线 3.8',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    {
      id: 'sites' as const,
      label: '多站点矩阵中控',
      sublabel: '站群集中化管理',
      icon: Globe,
      badge: '全局中控',
      badgeColor: 'bg-slate-800 text-slate-300 border-slate-700',
    },
  ];

  const freqMap: Record<string, string> = {
    daily: '每日巡检',
    weekly: '每周巡检',
    monthly: '每月巡检',
  };

  return (
    <aside className="w-64 shrink-0 bg-slate-900/60 border-r border-slate-800 flex flex-col justify-between hidden md:flex">
      <div className="p-3 space-y-1.5">
        <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          核心功能模块
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs transition-all group ${
                isActive
                  ? 'bg-indigo-600/15 text-indigo-200 border border-indigo-500/30 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent font-medium'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="leading-tight text-slate-100">{item.label}</div>
                  <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                    {item.sublabel}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded border font-mono ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
                {isActive && <ChevronRight className="w-3 h-3 text-indigo-400" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Audit Scheduler Status Footer Widget */}
      <div className="p-3 m-3 rounded-2xl bg-slate-950/80 border border-slate-800/90 text-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 font-semibold text-slate-200">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>自动定时体检</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 font-bold">
            {freqMap[activeSite.scheduledAuditFrequency] || '每周巡检'}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          上次自动化巡检于 <span className="text-slate-300 font-mono">{activeSite.lastAuditDate}</span> 执行完成，监控雷达保持在线。
        </p>
        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span>当前站点:</span>
          <span className="text-indigo-400 truncate max-w-[110px]">{activeSite.domain}</span>
        </div>
      </div>
    </aside>
  );
};
