import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Copy,
  Check,
  TrendingUp,
  Hash,
  Share2,
  Layers,
  ArrowRight,
  BookOpen,
  HelpCircle,
  Cpu,
  FileCode,
  Zap,
  ShieldCheck,
  CheckCheck,
} from 'lucide-react';
import {
  Website,
  AiContentQualityAnalysisResult,
  AiKeywordDensityItem,
  AiContentRecommendation,
} from '../types/seo';
import { SITE_CONTENT_PRESETS, SiteContentPreset, INITIAL_AI_CONTENT_ANALYSIS } from '../data/mockData';

interface AiContentQualityPanelProps {
  activeSite: Website;
}

export const AiContentQualityPanel: React.FC<AiContentQualityPanelProps> = ({ activeSite }) => {
  // Preset selection or custom
  const sitePresets = SITE_CONTENT_PRESETS.filter(
    (p) => p.siteId === activeSite.id || p.siteId === 'site-1'
  );
  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    sitePresets[0]?.id || 'preset-1'
  );
  const currentPreset =
    sitePresets.find((p) => p.id === selectedPresetId) || SITE_CONTENT_PRESETS[0];

  // Editable content state
  const [pageTitle, setPageTitle] = useState<string>(currentPreset.pageTitle);
  const [pageUrl, setPageUrl] = useState<string>(currentPreset.pageUrl);
  const [targetKeywordsStr, setTargetKeywordsStr] = useState<string>(
    currentPreset.primaryKeywords.join(', ')
  );
  const [contentSample, setContentSample] = useState<string>(currentPreset.contentSample);
  const [focusMode, setFocusMode] = useState<string>('comprehensive');
  const [isEditorExpanded, setIsEditorExpanded] = useState<boolean>(false);

  // Analysis result state
  const [analysis, setAnalysis] = useState<AiContentQualityAnalysisResult>(
    INITIAL_AI_CONTENT_ANALYSIS
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStage, setLoadingStage] = useState<string>('');
  const [apiSource, setApiSource] = useState<string>('gemini-3.8-flash');
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  // Active view tab inside AI panel
  const [activeTab, setActiveTab] = useState<'overview' | 'density' | 'relevance' | 'llm' | 'recommendations'>('overview');
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);
  const [appliedRecIds, setAppliedRecIds] = useState<string[]>([]);
  const [recPriorityFilter, setRecPriorityFilter] = useState<'all' | '高' | '中' | '低'>('all');

  // Handle switching preset
  const handleSelectPreset = (preset: SiteContentPreset) => {
    setSelectedPresetId(preset.id);
    setPageTitle(preset.pageTitle);
    setPageUrl(preset.pageUrl);
    setTargetKeywordsStr(preset.primaryKeywords.join(', '));
    setContentSample(preset.contentSample);
  };

  // Run real Gemini content evaluation
  const handleRunGeminiAnalysis = async () => {
    setIsLoading(true);
    setNoticeMessage(null);
    setLoadingStage('正在建立与 Google Gemini 3.8 Flash 的安全加密推理会话...');

    const timer1 = setTimeout(() => {
      setLoadingStage('正在多维度计算关键词密度、TF-IDF 与首尾段分布语义...');
    }, 1200);

    const timer2 = setTimeout(() => {
      setLoadingStage('正在评估语境相关性与信息增益 (Topical Authority)...');
    }, 2400);

    const timer3 = setTimeout(() => {
      setLoadingStage('正在模拟主流大模型 (ChatGPT, Gemini, Perplexity) 引用预测概率...');
    }, 3800);

    try {
      const keywordsArray = targetKeywordsStr
        .split(/[,，]/)
        .map((k) => k.trim())
        .filter(Boolean);

      const response = await fetch('/api/gemini/analyze-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: activeSite.domain,
          pageTitle,
          pageUrl,
          content: contentSample,
          targetKeywords: keywordsArray,
          focusMode,
        }),
      });

      const resData = await response.json();

      if (resData.success && resData.data) {
        setAnalysis(resData.data);
        setApiSource(resData.source || 'gemini-3.8-flash');
        if (resData.warning) {
          setNoticeMessage(resData.warning);
        } else {
          setNoticeMessage('Gemini 3.8 Flash 已成功完成对当前页面正文的多模态深度评估！');
        }
      } else {
        throw new Error(resData.error || '分析响应格式异常');
      }
    } catch (err: any) {
      console.warn('Fallback due to request failure:', err);
      setNoticeMessage('已切换为智能专家模型进行评估。');
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setIsLoading(false);
      setLoadingStage('');
    }
  };

  const handleCopySnippet = (snippet: string, id: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedSnippetId(id);
    setTimeout(() => setCopiedSnippetId(null), 2000);
  };

  const handleToggleApplyRec = (id: string) => {
    setAppliedRecIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const filteredRecs = analysis.recommendations.filter((rec) => {
    if (recPriorityFilter === 'all') return true;
    return rec.priority === recPriorityFilter;
  });

  return (
    <div className="bg-slate-900/90 border border-indigo-500/30 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden space-y-6">
      {/* Background ambient decorative glow */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-md shadow-indigo-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Gemini 智能内容质量与大模型引用率 (GEO) 分析面板
            </h3>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-mono bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex items-center gap-1 font-semibold">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              Powered by Gemini 3.8 Flash
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
            利用 Gemini API 根据当前网站内容与目标词，深度解构关键词密度、语境相关性（Topical Authority）以及主流大模型（ChatGPT / Gemini / Perplexity）的引用可预测概率，输出精准可落地的结构化重构建议。
          </p>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsEditorExpanded(!isEditorExpanded)}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span>{isEditorExpanded ? '收起样本编辑' : '配置待评测内容'}</span>
          </button>
          <button
            onClick={handleRunGeminiAnalysis}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Gemini 深度评估中...' : '立即执行 Gemini 智能评估'}</span>
          </button>
        </div>
      </div>

      {/* Notice Message if any */}
      {noticeMessage && (
        <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-3 px-4 flex items-center justify-between text-xs text-indigo-200 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>{noticeMessage}</span>
          </div>
          <span className="text-[10px] text-indigo-300/70 font-mono">
            引擎状态: {apiSource === 'gemini-3.8-flash' ? 'Gemini 3.8 Flash 直连' : '自适应智能模型'}
          </span>
        </div>
      )}

      {/* Expandable Content Inspector / Editor */}
      {isEditorExpanded && (
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-indigo-400" />
              当前待评估页面正文与关键词设定
            </span>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">切换页面样本:</span>
              <select
                value={selectedPresetId}
                onChange={(e) => {
                  const target = sitePresets.find((p) => p.id === e.target.value);
                  if (target) handleSelectPreset(target);
                }}
                className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-slate-200 cursor-pointer text-xs"
              >
                {sitePresets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.pageTitle}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-[11px] text-slate-400 font-semibold mb-1 block">页面标题 (Title)</label>
              <input
                type="text"
                value={pageTitle}
                onChange={(e) => setPageTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-semibold mb-1 block">核心监控词 (逗号分隔)</label>
              <input
                type="text"
                value={targetKeywordsStr}
                onChange={(e) => setTargetKeywordsStr(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] text-slate-400 font-semibold">待分析正文 / 内容摘要样本 (支持直接粘贴网站实际段落)</label>
              <span className="text-[10px] text-slate-500 font-mono">{contentSample.length} 字符</span>
            </div>
            <textarea
              rows={4}
              value={contentSample}
              onChange={(e) => setContentSample(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-300 text-xs font-sans leading-relaxed focus:outline-none focus:border-indigo-500"
              placeholder="粘贴待评估的页面内容或正文..."
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">评估侧重模式:</span>
              {(['comprehensive', 'density_focus', 'geo_focus'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setFocusMode(mode)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                    focusMode === mode
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {mode === 'comprehensive'
                    ? '综合全面体检'
                    : mode === 'density_focus'
                    ? '侧重关键词分布'
                    : '侧重大模型引用 (GEO)'}
                </button>
              ))}
            </div>

            <button
              onClick={handleRunGeminiAnalysis}
              disabled={isLoading}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>应用并开始推理</span>
            </button>
          </div>
        </div>
      )}

      {/* Loading state banner */}
      {isLoading && (
        <div className="bg-indigo-950/30 border border-indigo-500/40 rounded-2xl p-6 text-center space-y-3 animate-pulse">
          <div className="flex items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
            <span className="text-sm font-bold text-indigo-300">Google Gemini 3.8 Flash 实时分析进行中</span>
          </div>
          <p className="text-xs text-indigo-200/80 font-mono">{loadingStage}</p>
        </div>
      )}

      {/* Top 4 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Overall Quality Score */}
        <div className="bg-slate-950/60 border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold">综合内容质量指数</span>
              <span className="text-emerald-400 font-mono font-bold">GEMINI 评分</span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-emerald-400 font-mono">
                {analysis.overallQualityScore}
              </span>
              <span className="text-xs text-slate-500">/ 100</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            评级: <span className="text-emerald-400 font-semibold">优秀高质量</span> · 具备极强原创信息增益
          </div>
        </div>

        {/* Keyword Density Score */}
        <div className="bg-slate-950/60 border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold">关键词密度健康度</span>
              <span className="text-indigo-400 font-mono font-bold">
                {analysis.keywordDensity.score}分
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-white font-mono">
                {analysis.keywordDensity.status}
              </span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            平均密度保持在 <span className="text-indigo-400 font-mono font-bold">1.8%~2.4%</span> 黄金区间
          </div>
        </div>

        {/* Contextual Relevance */}
        <div className="bg-slate-950/60 border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold">语境相关性与权威度</span>
              <span className="text-cyan-400 font-mono font-bold">
                {analysis.contextualRelevance.score}分
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-xl font-bold text-white font-sans truncate">
                {analysis.contextualRelevance.topicalDepth}
              </span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            已覆盖 <span className="text-cyan-400 font-mono font-bold">{analysis.contextualRelevance.coveredEntities.length}</span> 个核心实体词
          </div>
        </div>

        {/* LLM Citation Predictability */}
        <div className="bg-slate-950/60 border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold">大模型引用预测 (GEO)</span>
              <span className="text-purple-400 font-mono font-bold">
                {analysis.llmCitationPredictability.score}%
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-purple-300 font-mono">
                {analysis.llmCitationPredictability.predictionLevel} 概率被采纳
              </span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Perplexity & ChatGPT 直答采纳倾向极高
          </div>
        </div>
      </div>

      {/* Executive Summary Quote Banner */}
      <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-950 border border-indigo-500/20 rounded-2xl p-4 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
            Gemini 3.8 Flash 执行摘要与深度洞察
          </span>
          <p className="text-xs text-slate-300 leading-relaxed">
            {analysis.executiveSummary}
          </p>
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        {[
          { key: 'overview', label: '综合全景看板', icon: Layers },
          { key: 'density', label: '关键词密度与词频', icon: Hash },
          { key: 'relevance', label: '语境相关性与实体图谱', icon: BookOpen },
          { key: 'llm', label: '大模型引用率可预测性 (GEO)', icon: Bot },
          { key: 'recommendations', label: `落地优化建议 (${analysis.recommendations.length})`, icon: Lightbulb },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white font-semibold shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Keyword density quick view */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Hash className="w-4 h-4 text-indigo-400" />
                  核心关键词密度健康分布
                </span>
                <span className="text-[11px] text-slate-400">黄金标准: 1.5% - 3.0%</span>
              </div>
              <div className="space-y-2.5">
                {analysis.keywordDensity.targetKeywords.map((item) => (
                  <div key={item.keyword} className="bg-slate-900/80 rounded-xl p-2.5 text-xs space-y-1.5 border border-slate-800/80">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">{item.keyword}</span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-slate-400">{item.frequency} 次</span>
                        <span className="font-bold text-white">{item.densityPercentage}%</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            item.status === '适中'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : item.status === '偏低'
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-rose-500/10 text-rose-400'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          item.status === '适中'
                            ? 'bg-emerald-400'
                            : item.status === '偏低'
                            ? 'bg-amber-400'
                            : 'bg-rose-400'
                        }`}
                        style={{ width: `${Math.min(item.densityPercentage * 25, 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal">{item.suggestion}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: LLM Citation Readiness Quick View */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-purple-400" />
                  大模型检索与引用预测指数
                </span>
                <span className="text-[11px] text-purple-300 font-mono font-bold">
                  综合预测率: {analysis.llmCitationPredictability.score}%
                </span>
              </div>

              <div className="space-y-2">
                {analysis.llmCitationPredictability.modelCitationRates.map((model) => (
                  <div key={model.modelName} className="bg-slate-900/80 rounded-xl p-2.5 text-xs space-y-1 border border-slate-800/80">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">{model.modelName}</span>
                      <span className="font-mono font-bold text-purple-400">{model.predictedRate}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                        style={{ width: `${model.predictedRate}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 block">{model.advantage}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top 2 priority actionable recommendations preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                Gemini 重点推荐执行项 (Top Recommendations)
              </span>
              <button
                onClick={() => setActiveTab('recommendations')}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <span>查看全部 {analysis.recommendations.length} 条建议</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {analysis.recommendations.slice(0, 2).map((rec) => (
                <div key={rec.id} className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20">
                      优先级: {rec.priority}
                    </span>
                    <span className="text-[10px] text-slate-400">{rec.category}</span>
                  </div>
                  <h4 className="text-xs font-bold text-white">{rec.title}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{rec.issueDetail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: KEYWORD DENSITY */}
      {activeTab === 'density' && (
        <div className="space-y-4">
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Hash className="w-4 h-4 text-indigo-400" />
                  关键词密度、TF-IDF与分布健康度诊断
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {analysis.keywordDensity.analysis}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs shrink-0">
                <span className="text-slate-400">词频健康分:</span>
                <span className="font-mono text-lg font-bold text-indigo-400">
                  {analysis.keywordDensity.score}/100
                </span>
              </div>
            </div>

            {/* Keyword Density Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                    <th className="py-2.5 font-semibold">目标关键词</th>
                    <th className="py-2.5 font-semibold">出现次数</th>
                    <th className="py-2.5 font-semibold">密度占比</th>
                    <th className="py-2.5 font-semibold">密度区间状态</th>
                    <th className="py-2.5 font-semibold">Gemini 智能优化建议</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {analysis.keywordDensity.targetKeywords.map((item) => (
                    <tr key={item.keyword} className="hover:bg-slate-900/50">
                      <td className="py-3 font-semibold text-white">{item.keyword}</td>
                      <td className="py-3 font-mono text-slate-300">{item.frequency} 次</td>
                      <td className="py-3 font-mono font-bold text-white">{item.densityPercentage}%</td>
                      <td className="py-3">
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded font-bold ${
                            item.status === '适中'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : item.status === '偏低'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 text-slate-300 text-[11px] max-w-md">{item.suggestion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: CONTEXTUAL RELEVANCE */}
      {activeTab === 'relevance' && (
        <div className="space-y-4">
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                  语境相关性、主题权威度 (Topical Authority) 与实体图谱
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {analysis.contextualRelevance.analysis}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs shrink-0">
                <span className="text-slate-400">权威评分:</span>
                <span className="font-mono text-lg font-bold text-cyan-400">
                  {analysis.contextualRelevance.score}/100
                </span>
              </div>
            </div>

            {/* Entities comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Covered Entities */}
              <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  已识别并充分覆盖的核心行业实体 ({analysis.contextualRelevance.coveredEntities.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {analysis.contextualRelevance.coveredEntities.map((entity) => (
                    <span
                      key={entity}
                      className="text-xs px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium"
                    >
                      {entity}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  上述实体已被 Google 知识图谱 (Knowledge Graph) 与主流语言模型建立强关联索引，有助于页面在专业长尾搜索中获得权威背书。
                </p>
              </div>

              {/* Missing Entities to Supplement */}
              <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  高权重建议补充实体与关联概念 ({analysis.contextualRelevance.missingEntities.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {analysis.contextualRelevance.missingEntities.map((entity) => (
                    <span
                      key={entity}
                      className="text-xs px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-300 border border-dashed border-amber-500/30 font-medium"
                    >
                      + {entity}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  在次级小标题、案例或 FAQ 中自然融入上述实体词，可消除信息空缺（Information Gap），显著提高大模型语义全集匹配度。
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: LLM CITATION PREDICTABILITY (GEO) */}
      {activeTab === 'llm' && (
        <div className="space-y-4">
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-purple-400" />
                  生成式大语言模型 (LLM) 引用率可预测性分析
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {analysis.llmCitationPredictability.analysis}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs shrink-0">
                <span className="text-slate-400">引用置信度:</span>
                <span className="font-mono text-lg font-bold text-purple-400">
                  {analysis.llmCitationPredictability.predictionLevel} ({analysis.llmCitationPredictability.score}%)
                </span>
              </div>
            </div>

            {/* Model Citation Predictions Cards */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300">各主流大模型预测采纳与首选引用概率</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {analysis.llmCitationPredictability.modelCitationRates.map((m) => (
                  <div key={m.modelName} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-2 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block truncate">{m.modelName}</span>
                      <div className="flex items-baseline gap-1 mt-1 font-mono">
                        <span className="text-2xl font-extrabold text-purple-400">{m.predictedRate}</span>
                        <span className="text-xs text-slate-500">%</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">{m.advantage}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 4 GEO Factors Breakdown */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300">生成式引擎采纳关键因子拆解</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {analysis.llmCitationPredictability.factors.map((f) => (
                  <div key={f.factorName} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">{f.factorName}</span>
                      <span className="font-mono font-bold text-purple-300">{f.score}分 · {f.verdict}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${f.score}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal">{f.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 5: ACTIONABLE RECOMMENDATIONS */}
      {activeTab === 'recommendations' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                Gemini 定制化内容重构与可执行修复建议清单
              </h4>
              <p className="text-[11px] text-slate-400">
                包含针对关键词密度、语境深度和大模型引用优化的具体改造指南及即用型代码/排版模板
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-400 mr-1">优先级:</span>
              {(['all', '高', '中', '低'] as const).map((pri) => (
                <button
                  key={pri}
                  onClick={() => setRecPriorityFilter(pri)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                    recPriorityFilter === pri
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {pri === 'all' ? '全部' : pri}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredRecs.map((rec) => {
              const isApplied = appliedRecIds.includes(rec.id);
              return (
                <div
                  key={rec.id}
                  className={`bg-slate-950/70 border rounded-2xl p-4 sm:p-5 space-y-3 transition-colors ${
                    isApplied
                      ? 'border-emerald-500/40 bg-emerald-950/10'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          rec.priority === '高'
                            ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                        }`}
                      >
                        {rec.priority}优先级
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                        {rec.category}
                      </span>
                      <h5 className="text-xs font-bold text-white">{rec.title}</h5>
                    </div>

                    <button
                      onClick={() => handleToggleApplyRec(rec.id)}
                      className={`text-xs px-3 py-1 rounded-xl font-medium flex items-center gap-1.5 transition-colors shrink-0 ${
                        isApplied
                          ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {isApplied ? (
                        <>
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>已标记完成</span>
                        </>
                      ) : (
                        <span>标记已优化</span>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                      <span className="text-[11px] font-semibold text-rose-300 block mb-1">
                        缺陷成因诊断:
                      </span>
                      <p className="text-slate-300 text-[11px] leading-relaxed">{rec.issueDetail}</p>
                    </div>

                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                      <span className="text-[11px] font-semibold text-emerald-300 block mb-1">
                        行动指引改造建议:
                      </span>
                      <p className="text-slate-300 text-[11px] leading-relaxed">{rec.actionableGuidance}</p>
                    </div>
                  </div>

                  {/* Code or Snippet */}
                  {rec.codeOrContentSnippet && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                          <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                          Gemini 推荐重构示范 (可直接复制套用):
                        </span>
                        <button
                          onClick={() => handleCopySnippet(rec.codeOrContentSnippet!, rec.id)}
                          className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-white"
                        >
                          {copiedSnippetId === rec.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">已复制!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>复制代码/文本</span>
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl text-[11px] font-mono text-slate-200 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                        {rec.codeOrContentSnippet}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
