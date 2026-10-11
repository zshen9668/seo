import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  RefreshCw,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Award,
  Target,
  Sparkles,
  Download,
  ExternalLink,
  Plus,
  SlidersHorizontal,
  CheckCircle2,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { TrackedKeyword, Website } from '../types/seo';

interface KeywordPerformanceViewProps {
  keywords: TrackedKeyword[];
  activeSite: Website;
  onPullRankings: () => void;
  isPullingRankings: boolean;
  onOpenAddKeyword: () => void;
  onDeleteKeyword?: (id: string) => void;
}

export const KeywordPerformanceView: React.FC<KeywordPerformanceViewProps> = ({
  keywords,
  activeSite,
  onPullRankings,
  isPullingRankings,
  onOpenAddKeyword,
  onDeleteKeyword,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEngine, setSelectedEngine] = useState<string>('all');
  const [selectedIntent, setSelectedIntent] = useState<string>('all');
  const [rankBracket, setRankBracket] = useState<string>('all');
  const [invertYAxis, setInvertYAxis] = useState<boolean>(true); // SEO rank #1 at top

  // Filter keywords belonging to current site
  const siteKeywords = useMemo(() => {
    return keywords.filter((k) => k.siteId === activeSite.id);
  }, [keywords, activeSite.id]);

  // Which keywords are currently rendered on the Recharts line chart
  const [selectedForChart, setSelectedForChart] = useState<string[]>(() => {
    return siteKeywords.slice(0, 4).map((k) => k.id);
  });

  // When active site changes, make sure selectedForChart contains active site keywords
  React.useEffect(() => {
    setSelectedForChart(siteKeywords.slice(0, 4).map((k) => k.id));
  }, [siteKeywords]);

  const toggleChartKeyword = (id: string) => {
    setSelectedForChart((prev) =>
      prev.includes(id) ? prev.filter((kId) => kId !== id) : [...prev, id]
    );
  };

  // Filtered list for the table
  const filteredKeywords = useMemo(() => {
    return siteKeywords.filter((kw) => {
      const matchesSearch =
        kw.keyword.toLowerCase().includes(searchQuery.toLowerCase()) ||
        kw.targetUrl.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesEngine = selectedEngine === 'all' || kw.searchEngine === selectedEngine;
      const matchesIntent = selectedIntent === 'all' || kw.intent === selectedIntent;
      const matchesBracket =
        rankBracket === 'all' ||
        (rankBracket === 'top3' && kw.currentRank <= 3) ||
        (rankBracket === 'top10' && kw.currentRank <= 10) ||
        (rankBracket === 'striking' && kw.currentRank >= 11 && kw.currentRank <= 20) ||
        (rankBracket === '21plus' && kw.currentRank > 20);

      return matchesSearch && matchesEngine && matchesIntent && matchesBracket;
    });
  }, [siteKeywords, searchQuery, selectedEngine, selectedIntent, rankBracket]);

  // Transform historical date series for Recharts
  const chartDates = ['09-15', '09-20', '09-25', '09-30', '10-05', '10-10'];

  const lineChartData = useMemo(() => {
    return chartDates.map((date) => {
      const dataPoint: Record<string, any> = { date };
      siteKeywords.forEach((kw) => {
        if (selectedForChart.includes(kw.id)) {
          const match = kw.history.find((h) => h.date === date);
          dataPoint[kw.keyword] = match ? match.rank : kw.currentRank;
        }
      });
      return dataPoint;
    });
  }, [chartDates, siteKeywords, selectedForChart]);

  // Chart line colors
  const lineColors = [
    '#6366f1', // Indigo
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#06b6d4', // Cyan
    '#ec4899', // Pink
    '#8b5cf6', // Violet
  ];

  // Metrics
  const top3Count = siteKeywords.filter((k) => k.currentRank <= 3).length;
  const top10Count = siteKeywords.filter((k) => k.currentRank <= 10).length;
  const strikingCount = siteKeywords.filter(
    (k) => k.currentRank >= 11 && k.currentRank <= 20
  ).length;
  const avgRank = siteKeywords.length
    ? (
        siteKeywords.reduce((acc, k) => acc + k.currentRank, 0) / siteKeywords.length
      ).toFixed(1)
    : '0';

  const totalVolume = siteKeywords.reduce((acc, k) => acc + k.searchVolume, 0);

  const handleExportCSV = () => {
    const headers = '关键词,当前排名,上期排名,排名变动,搜索引擎,月搜索量,KD难度,预估CPC,搜索意图,目标页面URL\n';
    const rows = filteredKeywords
      .map(
        (k) =>
          `"${k.keyword}",${k.currentRank},${k.previousRank},${k.rankChange},"${k.searchEngine}",${k.searchVolume},${k.difficulty},${k.cpc},"${k.intent}","${k.targetUrl}"`
      )
      .join('\n');
    const blob = new Blob(['\uFEFF' + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeSite.domain}-关键词排名明细-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            关键词表现 & SERP 排名雷达监控
          </h2>
          <p className="text-xs text-slate-400">
            全天候追踪谷歌、必应、百度搜索结果排名位移，基于 Recharts 折线图进行多时间节点走势对比
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onPullRankings}
            disabled={isPullingRankings}
            className="flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-xl shadow-sm transition-all shadow-indigo-600/25 disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPullingRankings ? 'animate-spin' : ''}`} />
            <span>{isPullingRankings ? '正在抓取SERP数据...' : '拉取最新排位'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>导出 CSV</span>
          </button>

          <button
            onClick={onOpenAddKeyword}
            className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl shadow-sm transition-colors shadow-emerald-600/25"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>添加监控词</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 font-medium">监控词库总量</div>
          <div className="text-2xl font-extrabold text-white font-mono mt-1">
            {siteKeywords.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-mono">
            <span>总月搜: {totalVolume.toLocaleString()} 次</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 font-medium">TOP 3 黄金位</div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono mt-1">
            {top3Count}
            <span className="text-xs text-slate-500 font-normal ml-1">
              ({Math.round((top3Count / (siteKeywords.length || 1)) * 100)}%)
            </span>
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-0.5">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>极高自然点击率 (CTR)</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 font-medium">TOP 10 首页排位</div>
          <div className="text-2xl font-extrabold text-indigo-400 font-mono mt-1">
            {top10Count}
          </div>
          <div className="text-[11px] text-indigo-300 mt-1">
            占词库 {Math.round((top10Count / (siteKeywords.length || 1)) * 100)}% 稳居第一页
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 font-medium">冲刺潜力词 (11-20名)</div>
          <div className="text-2xl font-extrabold text-amber-400 font-mono mt-1">
            {strikingCount}
          </div>
          <div className="text-[11px] text-amber-400/80 mt-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> 最快突破带来增量
          </div>
        </div>

        <div className="col-span-2 lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 font-medium">平均排名位次</div>
          <div className="text-2xl font-extrabold text-cyan-400 font-mono mt-1">
            第 #{avgRank} 名
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            本月净晋升 +18 个位次
          </div>
        </div>
      </div>

      {/* Main Feature: Recharts Line Chart Ranking History */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">
                SERP 历史排位走势轨迹 (基于 Recharts 折线图)
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                多节点时间序列
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              点击下方标签可切换对比曲线。排名数值越小（越接近 #1），代表在搜索引擎结果中位置越高。
            </p>
          </div>

          {/* Chart Controls */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700">
              <input
                type="checkbox"
                checked={invertYAxis}
                onChange={(e) => setInvertYAxis(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
              />
              <span className="font-medium">反转 Y 轴 (第 1 名置顶 - SEO专业标准)</span>
            </label>
          </div>
        </div>

        {/* Selected Keyword Chips to Toggle on Recharts */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs text-slate-400 font-semibold mr-1">已激活图表词:</span>
          {siteKeywords.map((kw, idx) => {
            const isSelected = selectedForChart.includes(kw.id);
            const color = lineColors[idx % lineColors.length];
            return (
              <button
                key={kw.id}
                onClick={() => toggleChartKeyword(kw.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                    : 'bg-slate-950/60 text-slate-500 border border-slate-800/80 hover:text-slate-300'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: isSelected ? color : '#475569' }}
                />
                <span className="truncate max-w-[140px]">{kw.keyword}</span>
                <span className="text-[10px] font-mono text-slate-400 font-bold">
                  #{kw.currentRank}
                </span>
              </button>
            );
          })}
        </div>

        {/* Recharts Container */}
        <div className="w-full h-72 sm:h-80 pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={lineChartData}
              margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickLine={{ stroke: '#334155' }}
              />
              <YAxis
                stroke="#64748b"
                domain={invertYAxis ? [20, 1] : [1, 20]}
                reversed={invertYAxis}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickLine={{ stroke: '#334155' }}
                tickFormatter={(val) => `#${val}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  color: '#f8fafc',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                }}
                formatter={(value: any, name: any) => [
                  `第 #${value} 名`,
                  String(name),
                ]}
                labelFormatter={(label) => `日期: 2026-${label}`}
              />
              <Legend
                wrapperStyle={{
                  paddingTop: '16px',
                  fontSize: '11px',
                }}
              />
              {siteKeywords
                .filter((kw) => selectedForChart.includes(kw.id))
                .map((kw, idx) => {
                  const color = lineColors[idx % lineColors.length];
                  return (
                    <Line
                      key={kw.id}
                      type="monotone"
                      dataKey={kw.keyword}
                      stroke={color}
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#0f172a', stroke: color, strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: color, stroke: '#ffffff', strokeWidth: 2 }}
                    />
                  );
                })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filter Toolbar for Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Engine filter */}
          <select
            value={selectedEngine}
            onChange={(e) => setSelectedEngine(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 font-medium cursor-pointer"
          >
            <option value="all">全部搜索引擎</option>
            <option value="Google">谷歌 (Google SERP)</option>
            <option value="Bing">必应 (Bing)</option>
            <option value="Baidu">百度 (Baidu)</option>
          </select>

          {/* Intent filter */}
          <select
            value={selectedIntent}
            onChange={(e) => setSelectedIntent(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 font-medium cursor-pointer"
          >
            <option value="all">全部搜索意图</option>
            <option value="商业调研">商业调研</option>
            <option value="交易购买">交易购买</option>
            <option value="信息查询">信息查询</option>
            <option value="品牌导航">品牌导航</option>
          </select>

          {/* Rank Bracket filter */}
          <select
            value={rankBracket}
            onChange={(e) => setRankBracket(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 font-medium cursor-pointer"
          >
            <option value="all">全部排位区间</option>
            <option value="top3">TOP 1 - 3 (黄金流量位)</option>
            <option value="top10">TOP 4 - 10 (首页常驻)</option>
            <option value="striking">冲刺突破 (11 - 20名)</option>
            <option value="21plus">20名之后</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="筛选关键词或目标落地页..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Keywords Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="pb-3 pl-2">监控关键词</th>
                <th className="pb-3 text-center">引擎</th>
                <th className="pb-3 text-center">当前排名</th>
                <th className="pb-3 text-center">升降走势</th>
                <th className="pb-3">月搜索量</th>
                <th className="pb-3">竞争难度 (KD)</th>
                <th className="pb-3">预估 CPC</th>
                <th className="pb-3">搜索意图</th>
                <th className="pb-3">SERP 富媒体特征</th>
                <th className="pb-3">目标落地页</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredKeywords.map((kw) => {
                const isRose = kw.rankChange > 0;
                const isFell = kw.rankChange < 0;

                return (
                  <tr key={kw.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="py-3.5 pl-2">
                      <div className="font-bold text-slate-100 flex items-center gap-2">
                        <span>{kw.keyword}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        更新于: {kw.updatedAt}
                      </div>
                    </td>

                    <td className="py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          kw.searchEngine === 'Google'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : kw.searchEngine === 'Bing'
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}
                      >
                        {kw.searchEngine}
                      </span>
                    </td>

                    <td className="py-3 text-center font-mono">
                      <span
                        className={`text-sm font-extrabold px-2.5 py-1 rounded-lg ${
                          kw.currentRank <= 3
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                            : kw.currentRank <= 10
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        #{kw.currentRank}
                      </span>
                    </td>

                    <td className="py-3 text-center">
                      {isRose ? (
                        <span className="inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          <span>上升 {kw.rankChange} 位</span>
                        </span>
                      ) : isFell ? (
                        <span className="inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <ArrowDownRight className="w-3.5 h-3.5" />
                          <span>下降 {Math.abs(kw.rankChange)} 位</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-xs font-medium text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                          <Minus className="w-3 h-3" />
                          <span>持平</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 font-mono text-slate-200">
                      {kw.searchVolume.toLocaleString()}
                    </td>

                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-14 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              kw.difficulty > 70
                                ? 'bg-rose-500'
                                : kw.difficulty > 45
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${kw.difficulty}%` }}
                          />
                        </div>
                        <span className="font-mono text-[10px] text-slate-400 font-bold">
                          {kw.difficulty}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 font-mono text-amber-300">
                      ${kw.cpc.toFixed(2)}
                    </td>

                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          kw.intent === '交易购买'
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                            : kw.intent === '商业调研'
                            ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {kw.intent}
                      </span>
                    </td>

                    <td className="py-3">
                      <div className="flex flex-wrap gap-1">
                        {kw.serpFeatures.map((feat, fidx) => (
                          <span
                            key={fidx}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 font-sans"
                          >
                            {feat}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3">
                      <a
                        href={kw.targetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-mono text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 truncate max-w-[180px]"
                        title={kw.targetUrl}
                      >
                        <span className="truncate">{kw.targetUrl.replace(/^https?:\/\/[^/]+/, '') || '/'}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
