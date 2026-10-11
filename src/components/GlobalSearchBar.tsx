import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  X,
  TrendingUp,
  ShieldCheck,
  Globe,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Website, TrackedKeyword, AuditIssue, CompetitorKeywordOverlap } from '../types/seo';
import type { AppTab } from '../types/app';

interface GlobalSearchBarProps {
  websites: Website[];
  keywords: TrackedKeyword[];
  auditIssues: AuditIssue[];
  competitorGaps: CompetitorKeywordOverlap[];
  onSelectSite: (site: Website) => void;
  onNavigateTab: (tab: AppTab) => void;
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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        const input = containerRef.current?.querySelector('input');
        input?.focus();
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const cleanQuery = query.trim().toLowerCase();

  const matchedKeywords = cleanQuery
    ? keywords.filter(
        (k) =>
          k.keyword.toLowerCase().includes(cleanQuery) ||
          k.targetUrl.toLowerCase().includes(cleanQuery),
      )
    : [];

  const matchedIssues = cleanQuery
    ? auditIssues.filter(
        (i) =>
          i.title.toLowerCase().includes(cleanQuery) ||
          i.category.toLowerCase().includes(cleanQuery) ||
          i.description.toLowerCase().includes(cleanQuery),
      )
    : [];

  const matchedWebsites = cleanQuery
    ? websites.filter(
        (w) =>
          w.name.toLowerCase().includes(cleanQuery) || w.domain.toLowerCase().includes(cleanQuery),
      )
    : [];

  const isGeoMatched = Boolean(
    cleanQuery &&
      ['geo', 'ai', 'chatgpt', 'perplexity', 'gemini', 'claude', '大模型', '生成式', '爬虫', 'hreflang', '地域', '全球', 'gpt', '文心'].some(
        (k) => cleanQuery.includes(k),
      ),
  );

  const hasResults =
    matchedKeywords.length > 0 ||
    matchedIssues.length > 0 ||
    matchedWebsites.length > 0 ||
    isGeoMatched;

  return (
    <div ref={containerRef} className="relative w-full z-30 mb-4 sm:mb-6">
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="search"
          enterKeyHint="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="搜索关键词、体检项、站点…"
          className="w-full bg-slate-900/90 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-2xl pl-10 sm:pl-11 pr-16 sm:pr-24 py-2.5 sm:py-3 text-xs sm:text-sm text-white placeholder-slate-500 shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
        />

        <div className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-white"
              aria-label="清空"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800 text-slate-400 border border-slate-700 pointer-events-none">
            ⌘K
          </kbd>
        </div>
      </div>

      {isOpen && cleanQuery && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900 border border-slate-800 rounded-2xl p-2.5 sm:p-3 shadow-2xl max-h-[min(24rem,70vh)] overflow-y-auto space-y-3 z-50">
          {!hasResults ? (
            <div className="p-4 sm:p-6 text-center text-xs text-slate-400">
              未找到匹配「{query}」的项目
            </div>
          ) : (
            <>
              {matchedKeywords.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5">
                    <TrendingUp className="w-3 h-3 text-indigo-400" />
                    监控关键词 ({matchedKeywords.length})
                  </div>
                  <div className="space-y-1">
                    {matchedKeywords.slice(0, 5).map((kw) => (
                      <button
                        key={kw.id}
                        type="button"
                        onClick={() => {
                          onNavigateTab('rankings');
                          onSelectKeywordSearch?.(kw.keyword);
                          setIsOpen(false);
                        }}
                        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left hover:bg-slate-800/80 transition-colors group text-xs"
                      >
                        <span className="font-semibold text-slate-200 truncate">{kw.keyword}</span>
                        <span className="font-mono text-amber-400 shrink-0">#{kw.currentRank}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {matchedIssues.length > 0 && (
                <div className="pt-2 border-t border-slate-800/60">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    体检项 ({matchedIssues.length})
                  </div>
                  <div className="space-y-1">
                    {matchedIssues.slice(0, 4).map((iss) => (
                      <button
                        key={iss.id}
                        type="button"
                        onClick={() => {
                          onNavigateTab('audit');
                          setIsOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left hover:bg-slate-800/80 text-xs"
                      >
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-slate-800 text-slate-400 shrink-0">
                          {iss.priority}
                        </span>
                        <span className="font-semibold text-slate-200 truncate">{iss.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {matchedWebsites.length > 0 && (
                <div className="pt-2 border-t border-slate-800/60">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5">
                    <Globe className="w-3 h-3 text-cyan-400" />
                    站点 ({matchedWebsites.length})
                  </div>
                  <div className="space-y-1">
                    {matchedWebsites.map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => {
                          onSelectSite(w);
                          onNavigateTab('rankings');
                          setIsOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-slate-800/80 text-xs"
                      >
                        <span className="font-semibold text-slate-200 truncate">{w.name}</span>
                        <span className="text-emerald-400 font-mono shrink-0">{w.healthScore}分</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isGeoMatched && (
                <div className="pt-2 border-t border-slate-800/60">
                  <button
                    type="button"
                    onClick={() => {
                      onNavigateTab('geo');
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left bg-purple-950/30 hover:bg-purple-900/40 border border-purple-500/30 text-xs"
                  >
                    <span className="flex items-center gap-1.5 font-bold text-white">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      打开 GEO 智能中控
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-purple-300" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
