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
  ReferenceLine,
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
  X,
  AlertCircle,
  Bot,
  Calendar,
  Activity,
  Eye,
  EyeOff,
  BarChart2,
  Check,
} from 'lucide-react';
import { TrackedKeyword, Website, AiRankingDiagnosticResult } from '../types/seo';
import {
  getLastNDates,
  normalizeKeywordHistoryForDates,
  ChartTimeRange,
} from '../utils/seoChartUtils';

interface KeywordPerformanceViewProps {
  keywords: TrackedKeyword[];
  activeSite: Website;
  onPullRankings: () => void;
  isPullingRankings: boolean;
  onOpenAddKeyword: () => void;
  onDeleteKeyword?: (id: string) => void;
}

// Chart line color palette (vibrant, accessible, modern SEO analytics aesthetic)
const LINE_COLORS = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#14b8a6', // Teal
  '#f97316', // Orange
];

/**
 * Custom Tooltip for Recharts showing 30-day rankings,
 * daily deltas, and rank status badges.
 */
const CustomRankingTooltip = ({
  active,
  payload,
  label,
  allData,
}: any) => {
  if (!active || !payload || !payload.length) return null;

  // Find previous day's data point to calculate 1-day SERP delta
  const currentIndex = allData ? allData.findIndex((d: any) => d.date === label) : -1;
  const prevData = currentIndex > 0 && allData ? allData[currentIndex - 1] : null;

  // Sort payload by rank ascending (best rank #1 at the top)
  const sortedPayload = [...payload].sort((a: any, b: any) => {
    const rankA = typeof a.value === 'number' ? a.value : 999;
    const rankB = typeof b.value === 'number' ? b.value : 999;
    return rankA - rankB;
  });

  return (
    <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3.5 shadow-2xl text-xs text-slate-100 max-w-xs space-y-2.5 z-50">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5 font-semibold text-slate-200">
          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
          <span>2026年{label?.replace('-', '月')}日</span>
        </div>
        <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
          SERP 排位采样
        </span>
      </div>

      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
        {sortedPayload.map((entry: any) => {
          const rank = entry.value;
          const kwName = entry.name;
          const color = entry.color || entry.stroke;

          // Calculate daily change vs previous day
          let deltaComp = null;
          if (prevData && prevData[kwName] !== undefined) {
            const prevRank = prevData[kwName];
            const change = prevRank - rank; // positive = improved
            if (change > 0) {
              deltaComp = (
                <span className="text-[10px] text-emerald-400 flex items-center font-mono font-bold">
                  <ArrowUpRight className="w-3 h-3" />+{change}
                </span>
              );
            } else if (change < 0) {
              deltaComp = (
                <span className="text-[10px] text-rose-400 flex items-center font-mono font-bold">
                  <ArrowDownRight className="w-3 h-3" />
                  {change}
                </span>
              );
            } else {
              deltaComp = (
                <span className="text-[10px] text-slate-500 font-mono">—</span>
              );
            }
          }

          return (
            <div
              key={kwName}
              className="flex items-center justify-between gap-3 p-1.5 rounded-lg bg-slate-950/60 border border-slate-800/60"
            >
              <div className="flex items-center gap-1.5 truncate max-w-[170px]">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: color }}
                />
                <span className="truncate text-slate-200 font-medium">{kwName}</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span
                  className={`font-mono font-bold px-1.5 py-0.5 rounded text-[11px] ${
                    rank <= 3
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : rank <= 10
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  #{rank}
                </span>
                {deltaComp}
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-[10px] text-slate-400 text-center pt-1 border-t border-slate-800/60 flex items-center justify-center gap-1">
        <Target className="w-3 h-3 text-indigo-400" />
        <span>数值越小(#1)排名越靠前</span>
      </div>
    </div>
  );
};

export const KeywordPerformanceView: React.FC<KeywordPerformanceViewProps> = ({
  keywords,
  activeSite,
  onPullRankings,
  isPullingRankings,
  onOpenAddKeyword,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEngine, setSelectedEngine] = useState<string>('all');
  const [selectedIntent, setSelectedIntent] = useState<string>('all');
  const [rankBracket, setRankBracket] = useState<string>('all');

  // Chart configuration state
  const [timeRange, setTimeRange] = useState<ChartTimeRange>('30d');
  const [invertYAxis, setInvertYAxis] = useState<boolean>(true); // SEO standard: #1 on top
  const [showThresholdLines, setShowThresholdLines] = useState<boolean>(true);
  const [spotlightKeywordId, setSpotlightKeywordId] = useState<string | null>(null);

  // AI Ranking Diagnostic modal state
  const [isDiagnosticModalOpen, setIsDiagnosticModalOpen] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<AiRankingDiagnosticResult | null>(null);
  const [isLoadingDiagnostic, setIsLoadingDiagnostic] = useState(false);

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
    setSpotlightKeywordId(null);
  }, [siteKeywords]);

  const toggleChartKeyword = (id: string) => {
    setSelectedForChart((prev) =>
      prev.includes(id) ? prev.filter((kId) => kId !== id) : [...prev, id]
    );
  };

  const handleSpotlight = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (spotlightKeywordId === id) {
      setSpotlightKeywordId(null);
    } else {
      if (!selectedForChart.includes(id)) {
        setSelectedForChart((prev) => [...prev, id]);
      }
      setSpotlightKeywordId(id);
    }
  };

  // Date array based on selected time range (7d, 14d, or 30d)
  const activeDates = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '14d' ? 14 : 30;
    return getLastNDates(days);
  }, [timeRange]);

  // Normalize/interpolate keywords over the date range
  const normalizedKeywords = useMemo(() => {
    return siteKeywords.map((kw) => {
      const dateRankMap = normalizeKeywordHistoryForDates(
        kw.history,
        kw.currentRank,
        activeDates,
        kw.id
      );
      return {
        ...kw,
        dateRankMap,
      };
    });
  }, [siteKeywords, activeDates]);

  // Transform historical date series for Recharts
  const lineChartData = useMemo(() => {
    return activeDates.map((date) => {
      const dataPoint: Record<string, any> = { date };
      normalizedKeywords.forEach((kw) => {
        if (selectedForChart.includes(kw.id)) {
          dataPoint[kw.keyword] = kw.dateRankMap[date] ?? kw.currentRank;
        }
      });
      return dataPoint;
    });
  }, [activeDates, normalizedKeywords, selectedForChart]);

  // Calculate dynamic statistics for the selected keywords over this time range
  const chartPerformanceStats = useMemo(() => {
    const activeKws = normalizedKeywords.filter((k) => selectedForChart.includes(k.id));
    if (activeKws.length === 0) {
      return {
        peakRank: 1,
        avgRank: '0.0',
        netDisplacement: 0,
        top10Rate: '0%',
        maxRankVal: 20,
      };
    }

    let allRanks: number[] = [];
    let initialSum = 0;
    let finalSum = 0;

    activeKws.forEach((kw) => {
      const firstDate = activeDates[0];
      const lastDate = activeDates[activeDates.length - 1];
      const startRank = kw.dateRankMap[firstDate] ?? kw.currentRank;
      const endRank = kw.dateRankMap[lastDate] ?? kw.currentRank;

      initialSum += startRank;
      finalSum += endRank;

      activeDates.forEach((d) => {
        const val = kw.dateRankMap[d] ?? kw.currentRank;
        allRanks.push(val);
      });
    });

    const peak = Math.min(...allRanks);
    const worst = Math.max(...allRanks);
    const avg = (allRanks.reduce((a, b) => a + b, 0) / allRanks.length).toFixed(1);
    const net = initialSum - finalSum; // positive = net rank rose
    const top10Count = allRanks.filter((r) => r <= 10).length;
    const top10Rate = `${Math.round((top10Count / allRanks.length) * 100)}%`;

    return {
      peakRank: peak,
      avgRank: avg,
      netDisplacement: net,
      top10Rate,
      maxRankVal: Math.max(20, Math.ceil((worst + 2) / 5) * 5),
    };
  }, [normalizedKeywords, selectedForChart, activeDates]);

  // Preset quick selection handlers
  const handleSelectAllKeywords = () => {
    setSelectedForChart(siteKeywords.map((k) => k.id));
    setSpotlightKeywordId(null);
  };

  const handleSelectTop3Only = () => {
    const top3Ids = siteKeywords.filter((k) => k.currentRank <= 3).map((k) => k.id);
    setSelectedForChart(top3Ids.length > 0 ? top3Ids : siteKeywords.slice(0, 3).map((k) => k.id));
    setSpotlightKeywordId(null);
  };

  const handleSelectTop10Only = () => {
    const top10Ids = siteKeywords.filter((k) => k.currentRank <= 10).map((k) => k.id);
    setSelectedForChart(top10Ids.length > 0 ? top10Ids : siteKeywords.slice(0, 4).map((k) => k.id));
    setSpotlightKeywordId(null);
  };

  const handleSelectVolatileOnly = () => {
    const volatileIds = siteKeywords.filter((k) => k.rankChange !== 0).map((k) => k.id);
    setSelectedForChart(volatileIds.length > 0 ? volatileIds : siteKeywords.slice(0, 4).map((k) => k.id));
    setSpotlightKeywordId(null);
  };

  const handleResetDefaultSelection = () => {
    setSelectedForChart(siteKeywords.slice(0, 4).map((k) => k.id));
    setSpotlightKeywordId(null);
  };

  // Run AI Ranking Diagnostic via Gemini
  const handleRunAiRankingDiagnostic = async () => {
    setIsLoadingDiagnostic(true);
    setIsDiagnosticModalOpen(true);
    try {
      const res = await fetch('/api/gemini/analyze-rankings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteName: activeSite.name,
          domain: activeSite.domain,
          keywords: siteKeywords.slice(0, 15),
        }),
      });
      const data = await res.json();
      setDiagnosticResult(data.data);
    } catch {
      // fallback handled gracefully
    } finally {
      setIsLoadingDiagnostic(false);
    }
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
    const headers =
      '关键词,当前排名,上期排名,排名变动,搜索引擎,月搜索量,KD难度,预估CPC,搜索意图,目标页面URL\n';
    const rows = filteredKeywords
      .map(
        (k) =>
          `"${k.keyword}",${k.currentRank},${k.previousRank},${k.rankChange},"${k.searchEngine}",${k.searchVolume},${k.difficulty},${k.cpc},"${k.intent}","${k.targetUrl}"`
      )
      .join('\n');
    const blob = new Blob(['\uFEFF' + headers + rows], {
      type: 'text/csv;charset=utf-8;',
    });
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
            全天候追踪谷歌、必应、百度搜索结果排名位移，基于 Recharts 折线图可视化过去 30 天走势
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRunAiRankingDiagnostic}
            disabled={isLoadingDiagnostic}
            className="flex items-center gap-1.5 text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-3.5 py-2 rounded-xl shadow-sm transition-all shadow-purple-600/25"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isLoadingDiagnostic ? 'animate-spin' : ''}`} />
            <span>AI 排位异动诊断</span>
          </button>

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

      {/* Main Feature: Recharts Line Chart for Keyword Rank History (Last 30 Days) */}
      <div
        id="keyword-30d-chart"
        className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl relative overflow-hidden"
      >
        {/* Subtle background ambient glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Target className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm sm:text-base font-bold text-white">
                SERP 历史排位走势轨迹 (Recharts 折线图)
              </h3>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                {timeRange === '30d' ? '近 30 天连续时序' : timeRange === '14d' ? '近 14 天时序' : '近 7 天时序'}
              </span>
              {spotlightKeywordId && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1 font-medium">
                  <Eye className="w-3 h-3" /> 单词高亮中
                  <button
                    onClick={() => setSpotlightKeywordId(null)}
                    className="hover:text-white ml-1 text-slate-400"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              点击下方关键词胶囊可切换对比曲线，点击眼睛图标可聚焦单独走势。排名数值越小（越接近 #1），代表搜索引擎排名越高。
            </p>
          </div>

          {/* Time Range Selector & View Options */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 30-day time range buttons */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setTimeRange('30d')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  timeRange === '30d'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                过去 30 天
              </button>
              <button
                onClick={() => setTimeRange('14d')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  timeRange === '14d'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                14 天
              </button>
              <button
                onClick={() => setTimeRange('7d')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  timeRange === '7d'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                7 天
              </button>
            </div>

            {/* Threshold Line Toggle */}
            <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700">
              <input
                type="checkbox"
                checked={showThresholdLines}
                onChange={(e) => setShowThresholdLines(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
              />
              <span className="font-medium">基准线 (Top 3 / Top 10)</span>
            </label>

            {/* Invert Y Axis Toggle */}
            <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700">
              <input
                type="checkbox"
                checked={invertYAxis}
                onChange={(e) => setInvertYAxis(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
              />
              <span className="font-medium">反转 Y 轴 (#1 置顶)</span>
            </label>
          </div>
        </div>

        {/* 30-Day Period Performance Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">周期内历史最高位</div>
              <div className="text-base font-extrabold text-amber-300 font-mono">
                第 #{chartPerformanceStats.peakRank} 名
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">周期综合平均排位</div>
              <div className="text-base font-extrabold text-indigo-300 font-mono">
                第 #{chartPerformanceStats.avgRank} 名
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">30天净位移变动</div>
              <div
                className={`text-base font-extrabold font-mono flex items-center gap-1 ${
                  chartPerformanceStats.netDisplacement >= 0
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}
              >
                {chartPerformanceStats.netDisplacement >= 0 ? '+' : ''}
                {chartPerformanceStats.netDisplacement} 位次
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">TOP 10 首页留存天数率</div>
              <div className="text-base font-extrabold text-cyan-300 font-mono">
                {chartPerformanceStats.top10Rate}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Presets & Selected Keyword Chips */}
        <div className="space-y-2 pt-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="font-semibold text-slate-300">图表激活监控词</span>
              <span className="text-[11px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.2 rounded border border-indigo-500/20">
                ({selectedForChart.length}/{siteKeywords.length})
              </span>
            </div>

            {/* Quick preset buttons */}
            <div className="flex flex-wrap items-center gap-1 text-[11px]">
              <button
                onClick={handleSelectAllKeywords}
                className="px-2 py-0.5 rounded bg-slate-950 text-slate-400 hover:text-white border border-slate-800 transition-colors"
              >
                全选词
              </button>
              <button
                onClick={handleSelectTop3Only}
                className="px-2 py-0.5 rounded bg-slate-950 text-emerald-400 hover:bg-emerald-950/40 border border-slate-800 transition-colors"
              >
                仅看 TOP 3
              </button>
              <button
                onClick={handleSelectTop10Only}
                className="px-2 py-0.5 rounded bg-slate-950 text-indigo-300 hover:bg-indigo-950/40 border border-slate-800 transition-colors"
              >
                仅看 TOP 10
              </button>
              <button
                onClick={handleSelectVolatileOnly}
                className="px-2 py-0.5 rounded bg-slate-950 text-amber-300 hover:bg-amber-950/40 border border-slate-800 transition-colors"
              >
                异动词
              </button>
              <button
                onClick={handleResetDefaultSelection}
                className="px-2 py-0.5 rounded bg-slate-950 text-slate-400 hover:text-white border border-slate-800 transition-colors"
              >
                重置推荐
              </button>
            </div>
          </div>

          {/* Keyword Selection Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {siteKeywords.map((kw, idx) => {
              const isSelected = selectedForChart.includes(kw.id);
              const isSpotlight = spotlightKeywordId === kw.id;
              const color = LINE_COLORS[idx % LINE_COLORS.length];

              return (
                <div
                  key={kw.id}
                  className={`group flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? isSpotlight
                        ? 'bg-indigo-950/80 text-white border-2 border-indigo-500 shadow-md shadow-indigo-500/20'
                        : 'bg-slate-800/90 text-white border border-slate-700 shadow-sm'
                      : 'bg-slate-950/60 text-slate-500 border border-slate-800/80 hover:text-slate-300'
                  }`}
                  onClick={() => toggleChartKeyword(kw.id)}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm transition-transform group-hover:scale-110"
                    style={{ backgroundColor: isSelected ? color : '#475569' }}
                  />
                  <span className="truncate max-w-[140px] sm:max-w-[180px]">
                    {kw.keyword}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-1 rounded ${
                      kw.currentRank <= 3
                        ? 'bg-amber-500/20 text-amber-300'
                        : kw.currentRank <= 10
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'text-slate-400'
                    }`}
                  >
                    #{kw.currentRank}
                  </span>

                  {/* Spotlight single keyword button */}
                  {isSelected && (
                    <button
                      onClick={(e) => handleSpotlight(kw.id, e)}
                      title={isSpotlight ? '取消单独高亮' : '单独高亮此折线'}
                      className={`p-1 rounded-md transition-colors ${
                        isSpotlight
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Recharts Line Chart Container */}
        <div className="w-full h-80 sm:h-96 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={lineChartData}
              margin={{ top: 18, right: 24, left: -6, bottom: 6 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

              <XAxis
                dataKey="date"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickLine={{ stroke: '#334155' }}
                interval={timeRange === '30d' ? 2 : timeRange === '14d' ? 1 : 0}
                tickFormatter={(val) => val}
              />

              <YAxis
                stroke="#64748b"
                domain={
                  invertYAxis
                    ? [chartPerformanceStats.maxRankVal, 1]
                    : [1, chartPerformanceStats.maxRankVal]
                }
                reversed={invertYAxis}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickLine={{ stroke: '#334155' }}
                tickFormatter={(val) => `#${val}`}
                allowDecimals={false}
              />

              {/* Threshold benchmark lines (SEO Standards) */}
              {showThresholdLines && (
                <>
                  <ReferenceLine
                    y={3}
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: '★ TOP 3 黄金转化位',
                      fill: '#10b981',
                      position: 'insideTopLeft',
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  />
                  <ReferenceLine
                    y={10}
                    stroke="#6366f1"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: '⚡ TOP 10 搜索首页分水岭',
                      fill: '#818cf8',
                      position: 'insideTopLeft',
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  />
                </>
              )}

              <Tooltip
                content={
                  <CustomRankingTooltip allData={lineChartData} />
                }
              />

              <Legend
                wrapperStyle={{
                  paddingTop: '16px',
                  fontSize: '11px',
                }}
                onClick={(e: any) => {
                  const kwMatch = siteKeywords.find((k) => k.keyword === e.dataKey);
                  if (kwMatch) {
                    toggleChartKeyword(kwMatch.id);
                  }
                }}
              />

              {/* Render dynamic Lines for each active keyword */}
              {siteKeywords
                .filter((kw) => selectedForChart.includes(kw.id))
                .map((kw, idx) => {
                  const color = LINE_COLORS[idx % LINE_COLORS.length];
                  const isSpotlight = spotlightKeywordId === kw.id;
                  const hasSpotlight = spotlightKeywordId !== null;

                  // If another keyword is spotlighted, fade this line
                  const strokeOpacity = hasSpotlight ? (isSpotlight ? 1 : 0.15) : 1;
                  const strokeWidth = isSpotlight ? 3.5 : 2.5;

                  return (
                    <Line
                      key={kw.id}
                      type="monotone"
                      dataKey={kw.keyword}
                      stroke={color}
                      strokeWidth={strokeWidth}
                      strokeOpacity={strokeOpacity}
                      connectNulls={true}
                      dot={
                        isSpotlight
                          ? { r: 3.5, fill: color, stroke: '#ffffff', strokeWidth: 1.5 }
                          : timeRange === '30d'
                          ? false // cleaner aesthetic for 30 daily dense points
                          : { r: 2.5, fill: '#0f172a', stroke: color, strokeWidth: 1.5 }
                      }
                      activeDot={{
                        r: 6,
                        fill: color,
                        stroke: '#ffffff',
                        strokeWidth: 2,
                        filter: 'drop-shadow(0px 0px 6px rgba(99,102,241,0.6))',
                      }}
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
            <option value="top3">TOP 3 黄金位</option>
            <option value="top10">TOP 10 搜索首页</option>
            <option value="striking">11-20名 冲刺潜力</option>
            <option value="21plus">21名及以后</option>
          </select>
        </div>

        {/* Keyword Search Input */}
        <div className="relative w-full md:w-64">
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

      {/* Keywords Table with 30-Day Line Chart Spotlight Actions */}
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
                <th className="pb-3 text-right pr-2">30天图表</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredKeywords.map((kw) => {
                const isRose = kw.rankChange > 0;
                const isFell = kw.rankChange < 0;
                const isChartSelected = selectedForChart.includes(kw.id);
                const isSpotlight = spotlightKeywordId === kw.id;

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

                    {/* Quick 30-Day Line Chart Spotlight Action */}
                    <td className="py-3 text-right pr-2">
                      <button
                        onClick={() => {
                          if (!selectedForChart.includes(kw.id)) {
                            setSelectedForChart((prev) => [...prev, kw.id]);
                          }
                          setSpotlightKeywordId(kw.id);
                          document
                            .getElementById('keyword-30d-chart')
                            ?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                          isSpotlight
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : isChartSelected
                            ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/25'
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                        }`}
                        title="在 Recharts 折线图中高亮查看 30 天排位轨迹"
                      >
                        <BarChart2 className="w-3 h-3" />
                        <span>{isSpotlight ? '高亮中' : '30天走势'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Ranking Diagnostic Modal */}
      {isDiagnosticModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Sparkles className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    AI 排位波动多维归因诊断报告
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                      Gemini 3.8 Flash
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    深度解析 {activeSite.name} ({activeSite.domain}) 近期 SERP 排名浮动
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDiagnosticModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isLoadingDiagnostic ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                <p className="text-xs text-slate-400">
                  Gemini 正在进行全网排位异动多维归因分析，请稍候...
                </p>
              </div>
            ) : diagnosticResult ? (
              <div className="space-y-4">
                {/* Executive Summary */}
                <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4">
                  <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
                    <Bot className="w-3.5 h-3.5 text-indigo-400" />
                    <span>核心排位诊断摘要</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {diagnosticResult.summary}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60 text-[11px]">
                    <span className="text-slate-400">大盘波动等级:</span>
                    <span
                      className={`font-semibold px-2 py-0.5 rounded ${
                        diagnosticResult.volatilityLevel === '高频波动'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : diagnosticResult.volatilityLevel === '温和调整'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {diagnosticResult.volatilityLevel}
                    </span>

                    {diagnosticResult.algorithmUpdateSuspected && (
                      <span className="bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        疑似搜索引擎核心算法调整
                      </span>
                    )}
                  </div>
                </div>

                {/* Strategic priorities */}
                {diagnosticResult.strategicPriorities &&
                  diagnosticResult.strategicPriorities.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>AI 推荐战略行动优先级</span>
                      </div>
                      <div className="space-y-1">
                        {diagnosticResult.strategicPriorities.map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-slate-950/50 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300 flex items-start gap-2"
                          >
                            <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-mono shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Keyword Analysis items */}
                {diagnosticResult.insights &&
                  diagnosticResult.insights.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-white">重点关键词个例深度剖析</div>
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {diagnosticResult.insights.map((kd, idx) => (
                          <div
                            key={idx}
                            className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-200">{kd.keyword}</span>
                              <div className="flex items-center gap-2 font-mono text-[11px]">
                                <span className="text-slate-400">
                                  #{kd.previousRank} → #{kd.currentRank}
                                </span>
                                <span
                                  className={`px-1.5 py-0.2 rounded font-semibold ${
                                    kd.rankChange > 0
                                      ? 'text-emerald-400 bg-emerald-500/10'
                                      : kd.rankChange < 0
                                      ? 'text-rose-400 bg-rose-500/10'
                                      : 'text-slate-400 bg-slate-800'
                                  }`}
                                >
                                  {kd.rankChange > 0 ? `+${kd.rankChange}` : kd.rankChange}
                                </span>
                              </div>
                            </div>
                            <p className="text-[11px] text-slate-400">
                              <strong className="text-slate-300">归因分析:</strong> {kd.causeDiagnosis}
                            </p>
                            <p className="text-[11px] text-indigo-300">
                              <strong className="text-indigo-200">优化举措:</strong>{' '}
                              {kd.actionRecommendation}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            ) : null}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsDiagnosticModalOpen(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-4 py-2 rounded-xl transition-colors font-medium"
              >
                关闭报告
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
