import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  Users,
  Target,
  ArrowUpRight,
  Plus,
  Check,
  TrendingUp,
  Download,
  ExternalLink,
  ShieldAlert,
  Flame,
  Award,
  BarChart2,
  Sliders,
} from 'lucide-react';
import {
  KeywordSuggestion,
  CompetitorKeywordOverlap,
  CompetitorProfile,
  Website,
  TrackedKeyword,
} from '../types/seo';
import { MOCK_SEED_SUGGESTIONS, INITIAL_COMPETITOR_OVERLAP, INITIAL_COMPETITORS } from '../data/mockData';

interface KeywordResearchViewProps {
  activeSite: Website;
  onAddTrackedKeyword: (kw: Omit<TrackedKeyword, 'id' | 'updatedAt' | 'history'>) => void;
}

export const KeywordResearchView: React.FC<KeywordResearchViewProps> = ({
  activeSite,
  onAddTrackedKeyword,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'research' | 'competitors'>('research');

  // Seed search state
  const [seedKeyword, setSeedKeyword] = useState('云计算');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<KeywordSuggestion[]>(
    MOCK_SEED_SUGGESTIONS['云计算'] || []
  );
  const [addedKeywordIds, setAddedKeywordIds] = useState<string[]>([]);

  const [competitors, setCompetitors] = useState<CompetitorProfile[]>(INITIAL_COMPETITORS);
  const [selectedCompetitor, setSelectedCompetitor] = useState<string>('datadog.com');
  const [gapFilter, setGapFilter] = useState<string>('all');
  const [newCompetitorDomain, setNewCompetitorDomain] = useState('');
  const [interceptedKeywords, setInterceptedKeywords] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedLlmKey, setSelectedLlmKey] = useState<string>('qwen:qwen-max');

  // Handle seed keyword exploration with Multi-LLM API
  const handleSearchSeed = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!seedKeyword.trim()) return;

    setIsSearching(true);
    const [provider, model] = selectedLlmKey.split(':');

    try {
      const response = await fetch('/api/ai/expand-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          model,
          seedKeyword: seedKeyword.trim(),
          targetMarket: '中国 (zh-CN)',
          currentDomain: activeSite.domain,
        }),
      });

      const resJson = await response.json();
      if (resJson.data?.suggestions && resJson.data.suggestions.length > 0) {
        setSuggestions(resJson.data.suggestions);
        setToastMessage(`已由 ${provider.toUpperCase()} (${model}) 完成“${seedKeyword.trim()}”长尾语义图谱拓词！`);
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        throw new Error('未返回有效拓词');
      }
    } catch {
      const term = seedKeyword.trim().toLowerCase();
      if (MOCK_SEED_SUGGESTIONS[term]) {
        setSuggestions(MOCK_SEED_SUGGESTIONS[term]);
      } else {
        setSuggestions([
          {
            id: `sug-${Date.now()}-1`,
            keyword: `最佳 ${term} 企业级解决方案服务商深度评测`,
            searchVolume: 19500,
            difficulty: 64,
            cpc: 28.5,
            intent: '商业调研',
            trendGrowth: 32.4,
            serpFeatures: ['精选摘要', '评测卡片'],
            competitionLevel: '高',
          },
          {
            id: `sug-${Date.now()}-2`,
            keyword: `如何针对 ${term} 进行生产环境深度调优与避坑`,
            searchVolume: 14200,
            difficulty: 43,
            cpc: 12.0,
            intent: '信息查询',
            trendGrowth: 41.2,
            serpFeatures: ['常见问答', '技术专栏'],
            competitionLevel: '中',
          },
          {
            id: `sug-${Date.now()}-3`,
            keyword: `${term} 费用计算器与主流版本价格透明对比`,
            searchVolume: 8900,
            difficulty: 51,
            cpc: 34.2,
            intent: '交易购买',
            trendGrowth: 19.8,
            serpFeatures: ['对比表格'],
            competitionLevel: '中',
          },
          {
            id: `sug-${Date.now()}-4`,
            keyword: `开源 ${term} 替代方案开发实践与架构`,
            searchVolume: 22600,
            difficulty: 38,
            cpc: 9.8,
            intent: '信息查询',
            trendGrowth: 46.5,
            serpFeatures: ['精选摘要', '代码列表'],
            competitionLevel: '低',
          },
        ]);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddSuggestionToTrack = (sug: KeywordSuggestion) => {
    onAddTrackedKeyword({
      siteId: activeSite.id,
      keyword: sug.keyword,
      searchEngine: 'Google',
      currentRank: Math.floor(Math.random() * 25) + 6,
      previousRank: Math.floor(Math.random() * 30) + 10,
      rankChange: 3,
      searchVolume: sug.searchVolume,
      difficulty: sug.difficulty,
      cpc: sug.cpc,
      intent: sug.intent,
      serpFeatures: sug.serpFeatures,
      targetUrl: `https://${activeSite.domain}/${sug.keyword.replace(/\s+/g, '-')}`,
    });

    setAddedKeywordIds((prev) => [...prev, sug.id]);
  };

  // Competitor overlap items
  const filteredOverlap = INITIAL_COMPETITOR_OVERLAP.filter((item) => {
    const matchesCompetitor =
      selectedCompetitor === 'all' || item.competitorDomain === selectedCompetitor;
    const matchesGap =
      gapFilter === 'all' ||
      (gapFilter === 'gap' && (item.gapOpportunity === '重大差距' || item.gapOpportunity === '快速突破')) ||
      (gapFilter === 'winning' && item.gapOpportunity === '我方领先');
    return matchesCompetitor && matchesGap;
  });

  const handleAddCompetitor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompetitorDomain.trim()) return;

    const domain = newCompetitorDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const newComp: CompetitorProfile = {
      domain,
      domainRating: Math.floor(Math.random() * 30) + 60,
      estimatedVisits: Math.floor(Math.random() * 1000000) + 500000,
      organicKeywords: Math.floor(Math.random() * 40000) + 15000,
      overlapKeywordsCount: 140,
      missedOpportunitiesCount: 88,
    };

    setCompetitors((prev) => [newComp, ...prev]);
    setSelectedCompetitor(domain);
    setNewCompetitorDomain('');
  };

  const activeCompetitorProfile = competitors.find((c) => c.domain === selectedCompetitor);

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-cyan-400" />
            关键词拓展挖掘 & 竞品情报透视
          </h2>
          <p className="text-xs text-slate-400">
            输入种子核心词拓展高商业意图词、搜索量、竞争度(KD)及预估CPC，深度分析竞争对手排位差距与蓝海机会
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('research')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-colors ${
              activeSubTab === 'research'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>种子词智能拓展</span>
          </button>
          <button
            onClick={() => setActiveSubTab('competitors')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-colors ${
              activeSubTab === 'competitors'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>竞品关键词差距透视</span>
          </button>
        </div>
      </div>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between text-xs text-emerald-300 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white text-xs px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Subtab 1: Seed Keyword Research */}
      {activeSubTab === 'research' && (
        <div className="space-y-6">
          {/* Seed Input Bar */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
            <form onSubmit={handleSearchSeed} className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={seedKeyword}
                  onChange={(e) => setSeedKeyword(e.target.value)}
                  placeholder="输入种子关键词 (如: 云计算、SEO优化、容器架构、数据观测、跨境独立站)..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={selectedLlmKey}
                  onChange={(e) => setSelectedLlmKey(e.target.value)}
                  className="bg-slate-950 border border-cyan-500/40 text-xs text-cyan-200 rounded-2xl px-3 py-3 focus:outline-none font-medium"
                  title="选择拓词基座大模型"
                >
                  <option value="qwen:qwen-max">通义千问 Qwen-Max (推荐·中文商业最优)</option>
                  <option value="gemini:gemini-3.8-flash">Google Gemini 3.8 Flash (极速拓展)</option>
                  <option value="deepseek:deepseek-chat">DeepSeek-V3 (满血通用版)</option>
                  <option value="openai:gpt-4o">OpenAI GPT-4o (商业采购意图)</option>
                  <option value="claude:claude-3-7-sonnet-latest">Claude 3.7 Sonnet (长尾严谨)</option>
                </select>

                <button
                  type="submit"
                  disabled={isSearching}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold px-6 py-3 rounded-2xl text-xs sm:text-sm transition-all shadow-md shadow-cyan-600/20 disabled:opacity-50 shrink-0"
                >
                  <Sparkles className={`w-4 h-4 ${isSearching ? 'animate-spin' : ''}`} />
                  <span>{isSearching ? '大模型拓词中...' : '智能拓展长尾词'}</span>
                </button>
              </div>
            </form>

            {/* Quick Seed Tags */}
            <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
              <span className="text-slate-400 font-semibold text-[11px]">常用种子主题:</span>
              {['云计算', 'seo', 'kubernetes', '可观测性', '跨境电商', '链路追踪'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setSeedKeyword(tag);
                    if (MOCK_SEED_SUGGESTIONS[tag]) {
                      setSuggestions(MOCK_SEED_SUGGESTIONS[tag]);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors ${
                    seedKeyword === tag
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30 font-bold'
                      : 'bg-slate-950/70 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Suggestions Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  针对 &ldquo;{seedKeyword}&rdquo; 的拓展建议
                </h3>
                <p className="text-xs text-slate-400">
                  找到 {suggestions.length} 个高转化商业搜索词，包含预估搜索量、优化难度(KD)与点击成本(CPC)
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                    <th className="pb-3 pl-2">拓展关键词</th>
                    <th className="pb-3">月搜索量</th>
                    <th className="pb-3">优化难度 (KD)</th>
                    <th className="pb-3">预估 CPC</th>
                    <th className="pb-3">搜索意图</th>
                    <th className="pb-3">30天增幅</th>
                    <th className="pb-3">SERP 展现特征</th>
                    <th className="pb-3 text-right pr-2">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {suggestions.map((sug) => {
                    const isAdded = addedKeywordIds.includes(sug.id);

                    return (
                      <tr key={sug.id} className="hover:bg-slate-800/40 transition-colors group">
                        <td className="py-3.5 pl-2 font-bold text-slate-100">
                          {sug.keyword}
                        </td>

                        <td className="py-3 font-mono text-slate-200">
                          {sug.searchVolume.toLocaleString()} 次/月
                        </td>

                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  sug.difficulty > 70
                                    ? 'bg-rose-500'
                                    : sug.difficulty > 45
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                                style={{ width: `${sug.difficulty}%` }}
                              />
                            </div>
                            <span className="font-mono text-[10px] text-slate-400 font-bold">
                              {sug.difficulty} ({sug.competitionLevel})
                            </span>
                          </div>
                        </td>

                        <td className="py-3 font-mono text-amber-300">
                          ${sug.cpc.toFixed(2)}
                        </td>

                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              sug.intent === '商业调研'
                                ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20'
                                : sug.intent === '交易购买'
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {sug.intent}
                          </span>
                        </td>

                        <td className="py-3 font-mono text-emerald-400">
                          +{sug.trendGrowth}%
                        </td>

                        <td className="py-3">
                          <div className="flex flex-wrap gap-1">
                            {sug.serpFeatures.map((feat, fidx) => (
                              <span
                                key={fidx}
                                className="text-[9px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800"
                              >
                                {feat}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="py-3 text-right pr-2">
                          <button
                            onClick={() => handleAddSuggestionToTrack(sug)}
                            disabled={isAdded}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ml-auto ${
                              isAdded
                                ? 'bg-emerald-500/20 text-emerald-300 cursor-default'
                                : 'bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/30'
                            }`}
                          >
                            {isAdded ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>已加入监控</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" />
                                <span>+ 加入监控</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 2: Competitor Keyword Gap Analysis */}
      {activeSubTab === 'competitors' && (
        <div className="space-y-6">
          {/* Competitor Select & Summary Cards */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  竞争对手域名深度对标透视
                </h3>
                <p className="text-xs text-slate-400">
                  选择对标竞品域名，深度分析对方排位词库，挖掘未布局的高价值内容流量差距
                </p>
              </div>

              {/* Add Competitor input */}
              <form onSubmit={handleAddCompetitor} className="flex items-center gap-2">
                <input
                  type="text"
                  value={newCompetitorDomain}
                  onChange={(e) => setNewCompetitorDomain(e.target.value)}
                  placeholder="添加竞品域名 (如: semrush.com)..."
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  + 添加竞品
                </button>
              </form>
            </div>

            {/* Competitor Profile Selector Tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {competitors.map((comp) => {
                const isSelected = selectedCompetitor === comp.domain;

                return (
                  <button
                    key={comp.domain}
                    onClick={() => setSelectedCompetitor(comp.domain)}
                    className={`p-4 rounded-2xl text-left border transition-all ${
                      isSelected
                        ? 'bg-slate-950 border-cyan-500 ring-1 ring-cyan-500/50 shadow-lg'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{comp.domain}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        DR {comp.domainRating}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3 text-xs font-mono">
                      <div>
                        <div className="text-[10px] text-slate-500 font-sans">自然搜索流量</div>
                        <div className="text-slate-200 font-bold">
                          {(comp.estimatedVisits / 1000000).toFixed(1)}M/月
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-sans">覆盖排位词数</div>
                        <div className="text-cyan-400 font-bold">
                          {(comp.organicKeywords / 1000).toFixed(0)}k 个
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Competitor Keyword Gap Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-rose-400" />
                  竞品高排位词 vs 我方当前位置
                </h3>
                <p className="text-xs text-slate-400">
                  &ldquo;重大差距&rdquo; 代表对手已抢占前5名位置，而我方页面尚未被索引或未排入前50名。
                </p>
              </div>

              {/* Gap filter */}
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => setGapFilter('all')}
                  className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
                    gapFilter === 'all'
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  全部重叠词 ({filteredOverlap.length})
                </button>
                <button
                  onClick={() => setGapFilter('gap')}
                  className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
                    gapFilter === 'gap'
                      ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30'
                      : 'bg-slate-950 text-slate-400 hover:text-rose-300'
                  }`}
                >
                  未布局内容差距 (重大机会)
                </button>
                <button
                  onClick={() => setGapFilter('winning')}
                  className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
                    gapFilter === 'winning'
                      ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                      : 'bg-slate-950 text-slate-400 hover:text-emerald-300'
                  }`}
                >
                  我方领先词
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                    <th className="pb-3 pl-2">竞品排位词</th>
                    <th className="pb-3 text-center">竞品排名</th>
                    <th className="pb-3 text-center">我方排名</th>
                    <th className="pb-3">月搜索量</th>
                    <th className="pb-3">难度 (KD)</th>
                    <th className="pb-3">预估 CPC</th>
                    <th className="pb-3">机会属性</th>
                    <th className="pb-3 text-right pr-2">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredOverlap.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors group">
                      <td className="py-3.5 pl-2 font-bold text-slate-100">
                        {item.keyword}
                      </td>

                      <td className="py-3 text-center font-mono">
                        <span className="font-extrabold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">
                          #{item.competitorRank}
                        </span>
                      </td>

                      <td className="py-3 text-center font-mono">
                        {item.ourRank ? (
                          <span className="font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                            #{item.ourRank}
                          </span>
                        ) : (
                          <span className="text-slate-500 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                            未上榜
                          </span>
                        )}
                      </td>

                      <td className="py-3 font-mono text-slate-200">
                        {item.searchVolume.toLocaleString()}
                      </td>

                      <td className="py-3 font-mono text-slate-300">
                        {item.difficulty} KD
                      </td>

                      <td className="py-3 font-mono text-amber-300">
                        ${item.cpc.toFixed(2)}
                      </td>

                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.gapOpportunity === '重大差距'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : item.gapOpportunity === '快速突破'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : item.gapOpportunity === '我方领先'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          }`}
                        >
                          {item.gapOpportunity}
                        </span>
                      </td>

                      <td className="py-3 text-right pr-2">
                        {interceptedKeywords.includes(item.keyword) ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
                            <Check className="w-3.5 h-3.5" />
                            <span>已截流监控</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              onAddTrackedKeyword({
                                siteId: activeSite.id,
                                keyword: item.keyword,
                                searchEngine: 'Google',
                                currentRank: item.ourRank || 35,
                                previousRank: (item.ourRank || 35) + 3,
                                rankChange: 2,
                                searchVolume: item.searchVolume,
                                difficulty: item.difficulty,
                                cpc: item.cpc,
                                intent: '商业调研',
                                serpFeatures: ['精选摘要'],
                                targetUrl: `https://${activeSite.domain}/${item.keyword.replace(/\s+/g, '-')}`,
                              });
                              setInterceptedKeywords((prev) => [...prev, item.keyword]);
                              setToastMessage(`已将竞品差距词 "${item.keyword}" 纳入监控雷达！`);
                              setTimeout(() => setToastMessage(null), 3000);
                            }}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 transition-colors inline-flex items-center gap-1 active:scale-95"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>截流该词</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
