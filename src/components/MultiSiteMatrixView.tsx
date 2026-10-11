import React from 'react';
import {
  Globe,
  Plus,
  ShieldCheck,
  TrendingUp,
  ExternalLink,
  Layers,
  Clock,
  ArrowUpRight,
  Search,
} from 'lucide-react';
import { Website } from '../types/seo';

interface MultiSiteMatrixViewProps {
  websites: Website[];
  onSelectSite: (site: Website) => void;
  onOpenAddSite: () => void;
  onSelectTab: (tab: 'rankings' | 'audit' | 'research' | 'geo') => void;
}

export const MultiSiteMatrixView: React.FC<MultiSiteMatrixViewProps> = ({
  websites,
  onSelectSite,
  onOpenAddSite,
  onSelectTab,
}) => {
  const totalVisits = websites.reduce((acc, w) => acc + w.monthlyOrganicVisits, 0);
  const totalKeywords = websites.reduce((acc, w) => acc + w.totalTrackedKeywords, 0);
  const avgHealth = Math.round(
    websites.reduce((acc, w) => acc + w.healthScore, 0) / (websites.length || 1)
  );

  const freqMap: Record<string, string> = {
    daily: '每日巡检',
    weekly: '每周巡检',
    monthly: '每月巡检',
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-400" />
            多站点站群矩阵集中化中控
          </h2>
          <p className="text-xs text-slate-400">
            集中化监控与扩展旗下所有独立站、主站与垂直矩阵站群的自然流量资产
          </p>
        </div>

        <button
          onClick={onOpenAddSite}
          className="flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-xl shadow-sm transition-colors shadow-indigo-600/25"
        >
          <Plus className="w-4 h-4" />
          <span>接入新站点</span>
        </button>
      </div>

      {/* Aggregate Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5">
          <div className="text-xs text-slate-400">站群月度自然搜索总流量</div>
          <div className="text-2xl font-extrabold text-white font-mono mt-1">
            {totalVisits.toLocaleString()}
            <span className="text-xs text-slate-400 font-sans ml-1">UV/月</span>
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 font-semibold">
            环比增长 +14.8%
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5">
          <div className="text-xs text-slate-400">全矩阵监控词库规模</div>
          <div className="text-2xl font-extrabold text-cyan-400 font-mono mt-1">
            {totalKeywords}
            <span className="text-xs text-slate-400 font-sans ml-1">个词条</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            覆盖 {websites.length} 个独立生产环境域名
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5">
          <div className="text-xs text-slate-400">矩阵平均SEO健康评分</div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono mt-1">
            {avgHealth}
            <span className="text-xs text-slate-400 font-sans ml-1">/ 100 分</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            自动化爬虫探针正常运行
          </div>
        </div>
      </div>

      {/* Website Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {websites.map((site) => (
          <div
            key={site.id}
            className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 transition-all duration-200 flex flex-col justify-between space-y-4"
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-base">{site.name}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium border border-slate-700">
                      {site.category}
                    </span>
                  </div>
                  <a
                    href={`https://${site.domain}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-1"
                  >
                    <span>{site.domain}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="text-right">
                  <span
                    className={`text-xs font-mono font-bold px-2.5 py-1 rounded-xl ${
                      site.healthScore >= 90
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : site.healthScore >= 75
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {site.healthScore} / 100 分
                  </span>
                  <div className="text-[10px] text-slate-500 mt-1 font-mono">
                    域名权重 DR {site.domainRating}
                  </div>
                </div>
              </div>

              {/* Metrics 4-grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 text-xs font-mono">
                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
                  <div className="text-[10px] text-slate-500 font-sans">月自然搜索流量</div>
                  <div className="font-bold text-slate-200 mt-0.5">
                    {site.monthlyOrganicVisits.toLocaleString()}
                  </div>
                </div>

                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
                  <div className="text-[10px] text-slate-500 font-sans">监控关键词数</div>
                  <div className="font-bold text-cyan-400 mt-0.5">
                    {site.totalTrackedKeywords}
                  </div>
                </div>

                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
                  <div className="text-[10px] text-slate-500 font-sans">TOP 3 核心位</div>
                  <div className="font-bold text-emerald-400 mt-0.5">
                    {site.top3Keywords}
                  </div>
                </div>

                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
                  <div className="text-[10px] text-slate-500 font-sans">全网收录页数</div>
                  <div className="font-bold text-slate-300 mt-0.5">
                    {site.totalIndexedPages}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
              <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3" />
                <span>巡检: {freqMap[site.scheduledAuditFrequency] || '每周巡检'}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onSelectSite(site);
                    onSelectTab('rankings');
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white transition-colors"
                >
                  排位雷达
                </button>

                <button
                  onClick={() => {
                    onSelectSite(site);
                    onSelectTab('geo');
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white transition-colors"
                >
                  GEO中控
                </button>

                <button
                  onClick={() => {
                    onSelectSite(site);
                    onSelectTab('audit');
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                >
                  SEO体检
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
