import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  X,
  TrendingUp,
  ShieldCheck,
  Globe,
  Users,
  ArrowRight,
  Flame,
  Award,
  Zap,
  Sparkles,
} from 'lucide-react';
import { Website, TrackedKeyword, AuditIssue, CompetitorKeywordOverlap } from '../types/seo';

interface GlobalSearchBarProps {
  websites: Website[];
  keywords: TrackedKeyword[];
  auditIssues: AuditIssue[];
  competitorGaps: CompetitorKeywordOverlap[];
  onSelectSite: (site: Website) => void;
  onNavigateTab: (tab: 'rankings' | 'audit' | 'research' | 'sites' | 'geo') => void;
  onSelectKeywordSearch?: (keywordText: string) => void;
}

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  websites,
  keywords,
  auditIssues,
  competitorGaps,
  onSelectSite,
  onNavigateTab,
  onSelectKeywordSearch,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        const input = containerRef.current?.querySelector('input');
        input?.focus();
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const cleanQuery = query.trim().toLowerCase();

  const matchedKeywords = cleanQuery
    ? keywords.filter(
        (k) =>
          k.keyword.toLowerCase().includes(cleanQuery) ||
          k.targetUrl.toLowerCase().includes(cleanQuery)
      )
    : [];

  const matchedIssues = cleanQuery
    ? auditIssues.filter(
        (i) =>
          i.title.toLowerCase().includes(cleanQuery) ||
          i.category.toLowerCase().includes(cleanQuery) ||
          i.description.toLowerCase().includes(cleanQuery)
      )
    : [];

  const matchedWebsites = cleanQuery
    ? websites.filter(
        (w) =>
          w.name.toLowerCase().includes(cleanQuery) ||
          w.domain.toLowerCase().includes(cleanQuery)
      )
    : [];

  const matchedGaps = cleanQuery
    ? competitorGaps.filter(
        (g) =>
          g.keyword.toLowerCase().includes(cleanQuery) ||
          g.competitorDomain.toLowerCase().includes(cleanQuery)
      )
    : [];

  const isGeoMatched = Boolean(
    cleanQuery &&
      ['geo', 'ai', 'chatgpt', 'perplexity', 'gemini', 'claude', '大模型', '生成式', '爬虫', 'hreflang', '地域', '全球', 'gpt', '文心'].some(
        (k) => cleanQuery.includes(k)
      )
  );

  const hasResults =
    matchedKeywords.length > 0 ||
    matchedIssues.length > 0 ||
    matchedWebsites.length > 0 ||
    matchedGaps.length > 0 ||
    isGeoMatched;

  return (
    <div ref={containerRef} className="relative w-full z-30 mb-6">
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="全局跨库搜索：监控词、GEO大模型引用、SEO体检缺陷、托管站点或竞品差距 (快捷键 ⌘K / Ctrl+K)..."
          className="w-full bg-slate-900/90 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-2xl pl-11 pr-24 py-3 text-xs sm:text-sm text-white placeholder-slate-500 shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="pointer-events-auto p-1 rounded-md text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Dropdown Results Box */}
      {isOpen && cleanQuery && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-2xl max-h-96 overflow-y-auto animate-in fade-in space-y-3 z-50">
          {!hasResults ? (
            <div className="p-6 text-center text-xs text-slate-400">
              未找到匹配 &ldquo;{query}&rdquo; 的项目，尝试搜索关键词如“成本”、“死链”、“LCP”或域名。
            </div>
          ) : (
            <>
              {/* Keywords Section */}
              {matchedKeywords.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <TrendingUp className="w-3 h-3 text-indigo-400" />
                      监控关键词 ({matchedKeywords.length})
                    </span>
                    <span className="text-slate-500 text-[9px]">点击跳转排位雷达</span>
                  </div>
                  <div className="space-y-1">
                    {matchedKeywords.slice(0, 5).map((kw) => (
                      <button
                        key={kw.id}
                        onClick={() => {
                          onNavigateTab('rankings');
                          if (onSelectKeywordSearch) onSelectKeywordSearch(kw.keyword);
                          setIsOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-slate-800/80 transition-colors group text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-200 group-hover:text-white">
                            {kw.keyword}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            {kw.searchEngine}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 font-mono">
                          <span className="text-amber-400 font-bold">第 #{kw.currentRank} 名</span>
                          <span className="text-slate-500 text-[11px]">
                            月搜 {kw.searchVolume.toLocaleString()}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Audit Issues Section */}
              {matchedIssues.length > 0 && (
                <div className="pt-2 border-t border-slate-800/60">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      SEO 诊断与体检项 ({matchedIssues.length})
                    </span>
                    <span className="text-slate-500 text-[9px]">点击查看修复方案</span>
                  </div>
                  <div className="space-y-1">
                    {matchedIssues.slice(0, 4).map((iss) => (
                      <button
                        key={iss.id}
                        onClick={() => {
                          onNavigateTab('audit');
                          setIsOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-slate-800/80 transition-colors group text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                              iss.priority === '严重'
                                ? 'bg-rose-500/20 text-rose-300'
                                : iss.priority === '高危'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {iss.priority}
                          </span>
                          <span className="font-semibold text-slate-200 group-hover:text-white truncate max-w-sm">
                            {iss.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400 text-[11px]">{iss.category}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Websites Section */}
              {matchedWebsites.length > 0 && (
                <div className="pt-2 border-t border-slate-800/60">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-3 h-3 text-cyan-400" />
                      托管站点矩阵 ({matchedWebsites.length})
                    </span>
                    <span className="text-slate-500 text-[9px]">点击切换站点</span>
                  </div>
                  <div className="space-y-1">
                    {matchedWebsites.map((w) => (
                      <button
                        key={w.id}
                        onClick={() => {
                          onSelectSite(w);
                          onNavigateTab('rankings');
                          setIsOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-slate-800/80 transition-colors group text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-200 group-hover:text-white">
                            {w.name}
                          </span>
                          <span className="font-mono text-indigo-400 text-[11px]">
                            ({w.domain})
                          </span>
                        </div>
                        <div className="flex items-center gap-3 font-mono">
                          <span className="text-emerald-400 font-bold">健康 {w.healthScore}分</span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* GEO Section */}
              {isGeoMatched && (
                <div className="pt-2 border-t border-slate-800/60">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-purple-400" />
                      GEO 生成式引擎优化 & 全球地域定向
                    </span>
                    <span className="text-slate-500 text-[9px]">直达 GEO 智能中控</span>
                  </div>
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        onNavigateTab('geo');
                        setIsOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left bg-purple-950/30 hover:bg-purple-900/40 border border-purple-500/30 transition-colors group text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white group-hover:text-purple-200">
                          打开 GEO 智能中控（大模型引用、AI爬虫与全球SERP）
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                          ChatGPT / Perplexity / Gemini
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-purple-300">
                        <span>查看大模型引用率</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
