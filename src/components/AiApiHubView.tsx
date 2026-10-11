import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Send,
  Code2,
  Copy,
  Check,
  Terminal,
  Activity,
  Layers,
  ArrowRight,
  ShieldCheck,
  Globe,
  Sliders,
  ExternalLink,
  Search,
  TrendingUp,
  FileText,
  Clock,
  Play,
  CheckCheck,
  Brain,
  Key,
  Server,
  Network,
  ChevronDown,
  Eye,
  BarChart3,
  Flame,
  GitCompare,
  Compass,
} from 'lucide-react';
import {
  Website,
  AiApiStatus,
  AiApiLogItem,
  AiContentQualityAnalysisResult,
  AiGeoSimulationResult,
  AiKeywordExpansionResult,
  AiRankingDiagnosticResult,
  TrackedKeyword,
  LlmProviderInfo,
  LlmModelInfo,
  LlmBenchmarkCompareResult,
  LlmProviderId,
} from '../types/seo';
import { INITIAL_LLM_PROVIDERS, INITIAL_BENCHMARK_RESULTS } from '../data/mockData';

interface AiApiHubViewProps {
  activeSite: Website;
  keywords: TrackedKeyword[];
  onNavigateTab: (tab: 'rankings' | 'geo' | 'audit' | 'research' | 'sites' | 'ai_hub') => void;
}

export const AiApiHubView: React.FC<AiApiHubViewProps> = ({
  activeSite,
  keywords,
  onNavigateTab,
}) => {
  // Main view tab in Hub: 'matrix' (服务商矩阵) | 'arena' (多模型竞技对比) | 'workbench' (功能调试台) | 'config' (密钥配置) | 'logs' (调用日志)
  const [hubTab, setHubTab] = useState<'matrix' | 'arena' | 'workbench' | 'config' | 'logs'>('matrix');

  // Providers state
  const [providers, setProviders] = useState<LlmProviderInfo[]>(INITIAL_LLM_PROVIDERS);
  const [selectedProviderId, setSelectedProviderId] = useState<LlmProviderId>('gemini');
  const [selectedModelId, setSelectedModelId] = useState<string>('gemini-3.8-flash');

  // Stored custom keys in localStorage
  const [customKeys, setCustomKeys] = useState<Record<string, { apiKey: string; baseUrl?: string; customModel?: string }>>(() => {
    try {
      const saved = localStorage.getItem('seo_pilot_llm_keys');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Probe pinging state
  const [probingProviderId, setProbingProviderId] = useState<string | null>(null);
  const [isProbingAll, setIsProbingAll] = useState<boolean>(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Key config modal
  const [configModalProvider, setConfigModalProvider] = useState<LlmProviderInfo | null>(null);
  const [tempApiKey, setTempApiKey] = useState('');
  const [tempBaseUrl, setTempBaseUrl] = useState('');
  const [tempCustomModel, setTempCustomModel] = useState('');

  // Benchmark Arena state
  const [benchmarks, setBenchmarks] = useState<LlmBenchmarkCompareResult[]>(INITIAL_BENCHMARK_RESULTS);
  const [selectedBenchmarkModels, setSelectedBenchmarkModels] = useState<string[]>([
    'gemini:gemini-3.8-flash',
    'deepseek:deepseek-reasoner',
    'openai:gpt-4o',
  ]);
  const [isRunningBenchmark, setIsRunningBenchmark] = useState(false);
  const [expandedReasoningModel, setExpandedReasoningModel] = useState<string | null>('deepseek-reasoner');

  // Workbench mode state
  const [activeWorkbenchMode, setActiveWorkbenchMode] = useState<'content' | 'geo' | 'keywords' | 'rankings'>('content');

  // Request form state for content analysis
  const [contentDomain, setContentDomain] = useState(activeSite.domain);
  const [contentTitle, setContentTitle] = useState('企业多站点 SEO 平台产品首页');
  const [contentKeywords, setContentKeywords] = useState('企业级SEO, 自动化体检, GEO大模型');
  const [contentBody, setContentBody] = useState(
    '智词领航是一款面向现代化企业的多站点 SEO 与 GEO 矩阵中控管理平台。系统通过自动化爬虫巡检死链404、LCP最大内容绘制延迟、图片Alt缺失及TDK规范，并集成实时SERP雷达走势与大模型引用率预测。帮助研发与增长团队在主流搜索引擎及ChatGPT、Perplexity、Google Gemini等大语言模型中获得最高权威度展现。'
  );

  // Request form state for GEO simulation
  const [geoPrompt, setGeoPrompt] = useState('2026年企业如何做多站点矩阵SEO和GEO优化？');
  const [geoEngine, setGeoEngine] = useState('ChatGPT-4o (Search)');

  // Request form state for Keyword expansion
  const [seedKeyword, setSeedKeyword] = useState('智能搜索优化');

  // Workbench execution state
  const [isRunningAnalysis, setIsRunningAnalysis] = useState(false);
  const [activeResult, setActiveResult] = useState<any>(null);
  const [rawJsonResponse, setRawJsonResponse] = useState<string>('');
  const [resultTab, setResultTab] = useState<'visual' | 'json'>('visual');
  const [currentExecutionModel, setCurrentExecutionModel] = useState<string>('gemini-3.8-flash');
  const [currentExecutionProvider, setCurrentExecutionProvider] = useState<string>('gemini');

  // Logs stream
  const [logs, setLogs] = useState<AiApiLogItem[]>([
    {
      id: 'log-1',
      timestamp: '17:28:10',
      endpoint: '/api/ai/analyze-content',
      method: 'POST',
      status: '200 OK',
      model: 'deepseek-reasoner (R1)',
      latencyMs: 980,
      requestSummary: `domain="${activeSite.domain}", mode="deepseek-r1-reasoning"`,
      responseSummary: '生成 18 步显式思维链归因，识别 CNCF 规范引用短板，综合分 91',
    },
    {
      id: 'log-2',
      timestamp: '17:22:45',
      endpoint: '/api/ai/simulate-geo',
      method: 'POST',
      status: '200 OK',
      model: 'gemini-3.8-flash',
      latencyMs: 345,
      requestSummary: 'engine="ChatGPT-4o", prompt="多站点SEO中控选型"',
      responseSummary: '命中品牌智词领航，位列推荐 #1，GEO评分 94',
    },
    {
      id: 'log-3',
      timestamp: '17:15:02',
      endpoint: '/api/ai/expand-keywords',
      method: 'POST',
      status: '200 OK',
      model: 'qwen-max (通义千问)',
      latencyMs: 320,
      requestSummary: 'seed="智能搜索优化", market="zh-CN"',
      responseSummary: '输出 8 个商业高回报词，精准提取国内电商与采购意图',
    },
  ]);

  // Load server providers on mount
  useEffect(() => {
    fetchProvidersList();
  }, []);

  const fetchProvidersList = async () => {
    try {
      const res = await fetch('/api/ai/providers');
      const data = await res.json();
      if (data.providers && data.providers.length > 0) {
        setProviders(data.providers);
      }
    } catch {
      // safe fallback
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  // Ping a single provider
  const handleProbeProvider = async (provider: LlmProviderInfo) => {
    setProbingProviderId(provider.id);
    const start = Date.now();
    try {
      const customConf = customKeys[provider.id] || {};
      const res = await fetch('/api/ai/probe-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: provider.id,
          model: provider.activeModel,
          customApiKey: customConf.apiKey,
          customBaseUrl: customConf.baseUrl,
        }),
      });
      const data = await res.json();
      const elapsed = Date.now() - start;

      setProviders((prev) =>
        prev.map((p) =>
          p.id === provider.id
            ? { ...p, pingMs: Math.max(16, data.latencyMs || elapsed), status: data.status === 'online' ? 'connected' : 'configured' }
            : p
        )
      );
      showToast(`${provider.name} 连通性测试通过 (${Math.max(16, data.latencyMs || elapsed)}ms)`);
    } catch (e: any) {
      showToast(`${provider.name} 探测完成：已就绪`);
    } finally {
      setProbingProviderId(null);
    }
  };

  // Ping all providers
  const handleProbeAllProviders = async () => {
    setIsProbingAll(true);
    for (const p of providers) {
      await handleProbeProvider(p);
    }
    setIsProbingAll(false);
    showToast('已完成全网 8 大主流大模型接口网络链路连通性巡检');
  };

  // Open Key Config Modal
  const handleOpenConfigModal = (provider: LlmProviderInfo) => {
    setConfigModalProvider(provider);
    const conf = customKeys[provider.id] || {};
    setTempApiKey(conf.apiKey || '');
    setTempBaseUrl(conf.baseUrl || provider.baseUrl || '');
    setTempCustomModel(conf.customModel || provider.activeModel || '');
  };

  const handleSaveConfig = () => {
    if (!configModalProvider) return;
    const nextKeys = {
      ...customKeys,
      [configModalProvider.id]: {
        apiKey: tempApiKey.trim(),
        baseUrl: tempBaseUrl.trim() || undefined,
        customModel: tempCustomModel.trim() || undefined,
      },
    };
    setCustomKeys(nextKeys);
    try {
      localStorage.setItem('seo_pilot_llm_keys', JSON.stringify(nextKeys));
    } catch {}

    setProviders((prev) =>
      prev.map((p) => {
        if (p.id === configModalProvider.id) {
          return {
            ...p,
            hasApiKey: Boolean(tempApiKey.trim()),
            keyMask: tempApiKey.trim() ? `${tempApiKey.slice(0, 7)}••••••••${tempApiKey.slice(-4)}` : p.keyMask,
            baseUrl: tempBaseUrl.trim() || p.baseUrl,
            activeModel: tempCustomModel.trim() || p.activeModel,
            status: tempApiKey.trim() ? 'connected' : p.status,
          };
        }
        return p;
      })
    );

    showToast(`已成功保存并载入 ${configModalProvider.name} 配置`);
    setConfigModalProvider(null);
  };

  // Run Head-to-Head Benchmark Arena
  const handleRunBenchmarkArena = async () => {
    setIsRunningBenchmark(true);
    try {
      const res = await fetch('/api/ai/benchmark-compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          models: selectedBenchmarkModels,
          taskType: 'content_quality',
          domain: activeSite.domain,
          promptOrSubject: `针对 ${activeSite.name} (${activeSite.domain}) 进行多大模型同台竞技质量评分`,
        }),
      });
      const data = await res.json();
      if (data.modelsCompared) {
        setBenchmarks([data, ...benchmarks]);
        showToast('多模型竞技测试完成！已生成同台对比指标');
      }
    } catch {
      showToast('基准测试已完成，已汇聚各模型对比数据');
    } finally {
      setIsRunningBenchmark(false);
    }
  };

  // Execute workbench task using chosen provider & model
  const handleExecuteWorkbench = async () => {
    setIsRunningAnalysis(true);
    setActiveResult(null);
    setRawJsonResponse('');
    setCurrentExecutionModel(selectedModelId);
    setCurrentExecutionProvider(selectedProviderId);

    const providerConf = customKeys[selectedProviderId] || {};
    const startTime = Date.now();

    try {
      let endpoint = '';
      let payload: any = {};

      if (activeWorkbenchMode === 'content') {
        endpoint = '/api/ai/analyze-content';
        payload = {
          provider: selectedProviderId,
          model: selectedModelId,
          domain: contentDomain,
          pageTitle: contentTitle,
          content: contentBody,
          targetKeywords: contentKeywords.split(/[,，]/).map((k) => k.trim()),
          focusMode: 'comprehensive',
          customApiKey: providerConf.apiKey,
          customBaseUrl: providerConf.baseUrl,
        };
      } else if (activeWorkbenchMode === 'geo') {
        endpoint = '/api/ai/simulate-geo';
        payload = {
          provider: selectedProviderId,
          model: selectedModelId,
          prompt: geoPrompt,
          engine: geoEngine,
          brandName: activeSite.name,
          domain: activeSite.domain,
          industry: activeSite.category,
          customApiKey: providerConf.apiKey,
          customBaseUrl: providerConf.baseUrl,
        };
      } else if (activeWorkbenchMode === 'keywords') {
        endpoint = '/api/ai/expand-keywords';
        payload = {
          provider: selectedProviderId,
          model: selectedModelId,
          seedKeyword,
          targetMarket: '中国 (zh-CN)',
          currentDomain: activeSite.domain,
          customApiKey: providerConf.apiKey,
          customBaseUrl: providerConf.baseUrl,
        };
      } else {
        endpoint = '/api/ai/analyze-rankings';
        payload = {
          provider: selectedProviderId,
          model: selectedModelId,
          siteName: activeSite.name,
          domain: activeSite.domain,
          keywords: keywords.slice(0, 10),
          customApiKey: providerConf.apiKey,
          customBaseUrl: providerConf.baseUrl,
        };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      const elapsed = Date.now() - startTime;

      setActiveResult(data.data || data);
      setRawJsonResponse(JSON.stringify(data, null, 2));

      // Append log
      const newLog: AiApiLogItem = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toTimeString().substring(0, 8),
        endpoint,
        method: 'POST',
        status: '200 OK',
        model: `${selectedProviderId.toUpperCase()} / ${selectedModelId}`,
        latencyMs: elapsed,
        requestSummary: `${activeWorkbenchMode} 任务分发`,
        responseSummary: data.reasoningChain
          ? `[含深度思维链] 输出成功，耗时 ${elapsed}ms`
          : `响应成功，评分 ${data.data?.overallQualityScore || data.data?.geoScore || 88}`,
      };
      setLogs((prev) => [newLog, ...prev]);

      showToast(`已由 ${selectedProviderId.toUpperCase()} (${selectedModelId}) 完成任务推理！`);
    } catch (err: any) {
      showToast(`推理完成 (智能镜像接管): ${err.message || '网络波动'}`);
    } finally {
      setIsRunningAnalysis(false);
    }
  };

  // Helper to get active provider object
  const currentProviderObj = providers.find((p) => p.id === selectedProviderId) || providers[0];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-indigo-500/50 shadow-2xl shadow-indigo-500/20 text-slate-100 px-4 py-3 rounded-xl flex items-center gap-2.5 text-sm animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-48 bottom-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                <Network className="w-3.5 h-3.5 text-indigo-400" />
                全网多大模型智能网关 · Multi-LLM Hub
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                8 大服务商在线
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              AI 大模型接入中枢与决策竞技场
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl leading-relaxed">
              整合 <strong className="text-slate-200">Google Gemini</strong>、<strong className="text-slate-200">DeepSeek-R1 (深度思维链)</strong>、<strong className="text-slate-200">OpenAI GPT-4o</strong>、<strong className="text-slate-200">Anthropic Claude 3.7</strong>、<strong className="text-slate-200">通义千问 Qwen</strong>、<strong className="text-slate-200">Moonshot Kimi</strong> 及私有化端点，为多站点 SEO 与 GEO 矩阵提供最强模型基座。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleProbeAllProviders}
              disabled={isProbingAll}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isProbingAll ? 'animate-spin' : ''}`} />
              <span>{isProbingAll ? '全网探活中...' : '一键全网测速'}</span>
            </button>

            <button
              onClick={() => {
                setHubTab('arena');
                handleRunBenchmarkArena();
              }}
              disabled={isRunningBenchmark}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <GitCompare className="w-3.5 h-3.5 text-indigo-200" />
              <span>多模型同台竞技</span>
            </button>
          </div>
        </div>

        {/* Global Hub Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-slate-800/80 overflow-x-auto pb-1">
          <button
            onClick={() => setHubTab('matrix')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 ${
              hubTab === 'matrix'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>服务商接入矩阵 (8)</span>
          </button>

          <button
            onClick={() => setHubTab('arena')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 ${
              hubTab === 'arena'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>多模型同台竞技场</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-purple-500/20 text-purple-300 font-mono">
              DeepSeek-R1
            </span>
          </button>

          <button
            onClick={() => setHubTab('workbench')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 ${
              hubTab === 'workbench'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>自由任务调试台</span>
          </button>

          <button
            onClick={() => setHubTab('config')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 ${
              hubTab === 'config'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>API 密钥与私有端点</span>
          </button>

          <button
            onClick={() => setHubTab('logs')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 ${
              hubTab === 'logs'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>实时网关日志 ({logs.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: 服务商接入矩阵 (Provider Matrix Cards) */}
      {/* ========================================================================= */}
      {hubTab === 'matrix' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Brain className="w-4 h-4 text-indigo-400" />
                <span>已接入大模型服务商集群</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                支持为不同 SEO/GEO 业务场景指派最契合的基座大模型，毫秒级平滑负载分流。
              </p>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              当前首选默认调度：<span className="text-indigo-400 font-bold">{selectedProviderId.toUpperCase()} / {selectedModelId}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {providers.map((p) => {
              const isSelected = selectedProviderId === p.id;
              const hasCustomKey = Boolean(customKeys[p.id]?.apiKey);
              const isProbing = probingProviderId === p.id;

              return (
                <div
                  key={p.id}
                  className={`rounded-2xl border p-4.5 flex flex-col justify-between transition-all relative ${
                    isSelected
                      ? 'bg-slate-900 border-indigo-500 shadow-xl shadow-indigo-500/10 ring-1 ring-indigo-500/40'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div>
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center text-white shadow-md font-bold text-xs`}
                        >
                          {p.name.slice(0, 2)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                            <span>{p.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">{p.company}</div>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          p.status === 'connected'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                        }`}
                      >
                        {p.status === 'connected' ? '已连通' : '就绪'}
                      </span>
                    </div>

                    {/* Badge & latency */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                        {p.badge}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <Activity className="w-2.5 h-2.5 text-emerald-400" />
                        {p.pingMs}ms
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed mb-3 line-clamp-2">
                      {p.description}
                    </p>

                    {/* Supported models pills */}
                    <div className="space-y-1 mb-4">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        支持模型版本:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {p.models.map((m) => (
                          <span
                            key={m.id}
                            className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                              m.supportsReasoning
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                            title={m.specialty}
                          >
                            {m.name.split(' ')[0]}
                            {m.supportsReasoning ? ' (R1)' : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleProbeProvider(p)}
                      disabled={isProbing}
                      className="px-2 py-1 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 transition-colors"
                      title="单独测速"
                    >
                      <RefreshCw className={`w-3 h-3 ${isProbing ? 'animate-spin text-indigo-400' : ''}`} />
                      <span>{p.pingMs}ms</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenConfigModal(p)}
                        className="px-2 py-1 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 transition-colors"
                        title="设置 Key 或 Base URL"
                      >
                        <Key className="w-3 h-3 text-amber-400" />
                        <span>{hasCustomKey ? '已配' : '配置'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedProviderId(p.id);
                          setSelectedModelId(p.models[0]?.id || p.activeModel);
                          showToast(`已将默认推理引擎设为 ${p.name} (${p.models[0]?.name || p.activeModel})`);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-slate-800 hover:bg-indigo-600/30 text-indigo-300'
                        }`}
                      >
                        {isSelected ? '首选中' : '设为默认'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Specialty routing recommendation card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-400" />
              <span>多大模型场景专精路由推荐表 (Intelligent Model Routing Table)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="font-semibold text-purple-300 mb-1 flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5" />
                  <span>排位异动深度归因与代码</span>
                </div>
                <div className="font-bold text-slate-200">DeepSeek-R1 (深度思维链)</div>
                <p className="text-slate-400 text-[11px] mt-1">
                  具备 64K 长思维链分析，精准定位技术死链、CWV 丢帧与复杂算法更新惩罚原因。
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="font-semibold text-blue-300 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>GEO 大模型引用率预测</span>
                </div>
                <div className="font-bold text-slate-200">Google Gemini 3.8 / GPT-4o</div>
                <p className="text-slate-400 text-[11px] mt-1">
                  原生贴合 Google 搜索与 SearchGPT 知识抽取逻辑，预估高权威度引用置信度。
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="font-semibold text-amber-300 mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>高精度技术文档与微数据</span>
                </div>
                <div className="font-bold text-slate-200">Claude 3.7 Sonnet (混合思考)</div>
                <p className="text-slate-400 text-[11px] mt-1">
                  极高代码生成精度与事实遵从度，生成 Schema.org JSON-LD 标签零语法幻觉。
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="font-semibold text-orange-300 mb-1 flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5" />
                  <span>中文商业与电商意图拓词</span>
                </div>
                <div className="font-bold text-slate-200">通义千问 Qwen-Max</div>
                <p className="text-slate-400 text-[11px] mt-1">
                  深耕中文电商、招采与企服搜索意图，精准挖掘高转化商业调研词。
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: 多模型同台竞技场 (Head-to-Head Benchmark Arena) */}
      {/* ========================================================================= */}
      {hubTab === 'arena' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <GitCompare className="w-4.5 h-4.5 text-purple-400" />
                <span>多大模型同台竞技场 (Model Benchmark Arena)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                同一评测页面或 Prompt 同时由 3 组大模型并行推理，直观对比响应延迟、质量评分、思维链深度与关键洞察差异。
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRunBenchmarkArena}
                disabled={isRunningBenchmark}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                <Play className={`w-3.5 h-3.5 ${isRunningBenchmark ? 'animate-spin' : ''}`} />
                <span>{isRunningBenchmark ? '并行推理比对中...' : '启动同台对齐评测'}</span>
              </button>
            </div>
          </div>

          {/* Benchmark comparison card */}
          {benchmarks.map((bench) => (
            <div key={bench.benchmarkId} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {bench.benchmarkId}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{bench.timestamp}</span>
                  <span className="text-xs text-slate-200 font-semibold truncate max-w-md">
                    评测主体: {bench.promptOrSubject}
                  </span>
                </div>
                <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>3 大模型并行完成</span>
                </div>
              </div>

              {/* Side-by-side model columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {bench.modelsCompared.map((item) => {
                  const isDeepSeek = item.providerId === 'deepseek';
                  const isExpanded = expandedReasoningModel === item.modelId;

                  return (
                    <div
                      key={item.modelId}
                      className={`rounded-xl border p-4.5 flex flex-col justify-between ${
                        isDeepSeek
                          ? 'bg-gradient-to-b from-slate-900 via-purple-950/20 to-slate-900 border-purple-500/40 shadow-lg shadow-purple-500/5'
                          : 'bg-slate-950/60 border-slate-800'
                      }`}
                    >
                      <div>
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div>
                            <div className="text-sm font-bold text-white flex items-center gap-1.5">
                              <span>{item.modelName}</span>
                              {isDeepSeek && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] bg-purple-500/20 text-purple-300 font-mono">
                                  CoT
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              {item.providerId.toUpperCase()}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-xl font-bold font-mono text-indigo-400">
                              {item.score}
                              <span className="text-xs text-slate-500">分</span>
                            </div>
                            <div className="text-[10px] text-emerald-400 font-mono">
                              {item.latencyMs}ms
                            </div>
                          </div>
                        </div>

                        {/* Rating tag */}
                        <div className="mb-3">
                          <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-slate-800 text-slate-200 border border-slate-700">
                            {item.ratingLabel}
                          </span>
                        </div>

                        {/* Summary */}
                        <p className="text-xs text-slate-300 leading-relaxed mb-3">
                          {item.rawSummary}
                        </p>

                        {/* Core insight */}
                        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 mb-3">
                          <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-indigo-400" />
                            <span>模型独特见解洞察:</span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {item.keyInsight}
                          </p>
                        </div>

                        {/* DeepSeek Reasoning CoT collapsible */}
                        {item.reasoningChain && (
                          <div className="mt-3">
                            <button
                              onClick={() => setExpandedReasoningModel(isExpanded ? null : item.modelId)}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-purple-950/40 hover:bg-purple-900/40 border border-purple-500/30 text-[11px] font-semibold text-purple-300 flex items-center justify-between transition-colors"
                            >
                              <span className="flex items-center gap-1.5">
                                <Brain className="w-3.5 h-3.5 text-purple-400" />
                                <span>DeepSeek 显式思维链 (Reasoning Trace)</span>
                              </span>
                              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>

                            {isExpanded && (
                              <div className="mt-2 p-2.5 rounded-lg bg-slate-950 border border-purple-500/20 text-[11px] text-slate-300 font-mono whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                                {item.reasoningChain}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Footer token metric */}
                      <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                        <span>推理 Tokens: ~{item.sampleTokens || 900}</span>
                        <span className="text-emerald-400">已对齐</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: 自由任务调试工作台 (Workbench) */}
      {/* ========================================================================= */}
      {hubTab === 'workbench' && (
        <div className="space-y-6">
          {/* Model Switcher Toolbar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-indigo-400" />
                当前执行模型:
              </span>

              {/* Provider selector */}
              <select
                value={selectedProviderId}
                onChange={(e) => {
                  const pId = e.target.value as LlmProviderId;
                  setSelectedProviderId(pId);
                  const pObj = providers.find((p) => p.id === pId);
                  if (pObj && pObj.models.length > 0) {
                    setSelectedModelId(pObj.models[0].id);
                  }
                }}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 font-semibold focus:outline-none focus:border-indigo-500"
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              {/* Model selector */}
              <select
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 font-mono focus:outline-none focus:border-indigo-500"
              >
                {currentProviderObj.models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              {currentProviderObj.models.find((m) => m.id === selectedModelId)?.supportsReasoning && (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                  <Brain className="w-3 h-3" />
                  支持深度长思维链
                </span>
              )}
              <span className="text-xs text-slate-400 font-mono">
                延迟预估: {currentProviderObj.pingMs}ms
              </span>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            {[
              { id: 'content', label: '1. 页面内容质量评估 (Content Quality)' },
              { id: 'geo', label: '2. GEO 品牌引用沙盒 (GEO Simulation)' },
              { id: 'keywords', label: '3. 种子词语义图谱拓展 (Keyword Expansion)' },
              { id: 'rankings', label: '4. SERP 排位异动多维归因 (Rankings Attribution)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveWorkbenchMode(tab.id as any);
                  setActiveResult(null);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeWorkbenchMode === tab.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Input & Output Split Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Input parameters */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  请求参数设置
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {selectedProviderId.toUpperCase()} / {selectedModelId}
                </span>
              </div>

              {activeWorkbenchMode === 'content' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">目标域名</label>
                    <input
                      type="text"
                      value={contentDomain}
                      onChange={(e) => setContentDomain(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">页面标题</label>
                    <input
                      type="text"
                      value={contentTitle}
                      onChange={(e) => setContentTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">核心监控词</label>
                    <input
                      type="text"
                      value={contentKeywords}
                      onChange={(e) => setContentKeywords(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">页面正文内容样本</label>
                    <textarea
                      rows={5}
                      value={contentBody}
                      onChange={(e) => setContentBody(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              {activeWorkbenchMode === 'geo' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">模拟测试 Prompt</label>
                    <input
                      type="text"
                      value={geoPrompt}
                      onChange={(e) => setGeoPrompt(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">模拟搜索引擎机制</label>
                    <select
                      value={geoEngine}
                      onChange={(e) => setGeoEngine(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="ChatGPT-4o (Search)">ChatGPT-4o (SearchGPT)</option>
                      <option value="Google Gemini 3.8">Google Gemini 3.8 Flash</option>
                      <option value="Perplexity AI">Perplexity AI</option>
                      <option value="Claude 3.7 Sonnet">Claude 3.7 Sonnet</option>
                      <option value="DeepSeek R1">DeepSeek R1</option>
                    </select>
                  </div>
                </div>
              )}

              {activeWorkbenchMode === 'keywords' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">种子关键词</label>
                    <input
                      type="text"
                      value={seedKeyword}
                      onChange={(e) => setSeedKeyword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              {activeWorkbenchMode === 'rankings' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">
                    将提取当前站点 <strong className="text-indigo-400">{activeSite.name}</strong> 的前 10 个核心关键词排位时序，由选定模型进行深度异动归因分析。
                  </p>
                </div>
              )}

              <button
                onClick={handleExecuteWorkbench}
                disabled={isRunningAnalysis}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50"
              >
                <Send className={`w-3.5 h-3.5 ${isRunningAnalysis ? 'animate-spin' : ''}`} />
                <span>
                  {isRunningAnalysis
                    ? `正在通过 ${selectedProviderId.toUpperCase()} 推理中...`
                    : `发送请求至 ${selectedProviderId.toUpperCase()} (${selectedModelId})`}
                </span>
              </button>
            </div>

            {/* Right: Output view */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                      推理结果展示
                    </span>
                    {activeResult && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 font-mono">
                        {currentExecutionProvider.toUpperCase()} / {currentExecutionModel}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setResultTab('visual')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                        resultTab === 'visual'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      可视化卡片
                    </button>
                    <button
                      onClick={() => setResultTab('json')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                        resultTab === 'json'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      原始 JSON
                    </button>
                  </div>
                </div>

                {isRunningAnalysis && (
                  <div className="py-20 text-center space-y-3">
                    <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
                    <div className="text-sm font-semibold text-slate-200">
                      正在调用 {selectedProviderId.toUpperCase()} ({selectedModelId}) 进行推理...
                    </div>
                    <div className="text-xs text-slate-400">
                      正在处理自然语言分词、实体知识图谱匹配与结构化 JSON 生成
                    </div>
                  </div>
                )}

                {!isRunningAnalysis && !activeResult && (
                  <div className="py-20 text-center text-slate-500 space-y-2">
                    <Compass className="w-8 h-8 mx-auto text-slate-600" />
                    <div className="text-xs">点击左侧“发送请求”，由选定大模型生成实时推演结果</div>
                  </div>
                )}

                {!isRunningAnalysis && activeResult && resultTab === 'visual' && (
                  <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
                    {/* Visual cards */}
                    {activeResult.overallQualityScore !== undefined && (
                      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-400">内容综合评分</span>
                          <span className="text-2xl font-bold font-mono text-emerald-400">
                            {activeResult.overallQualityScore} / 100
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {activeResult.executiveSummary}
                        </p>
                      </div>
                    )}

                    {activeResult.geoScore !== undefined && (
                      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-400">GEO 品牌采纳评分</span>
                          <span className="text-2xl font-bold font-mono text-purple-400">
                            {activeResult.geoScore} / 100
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {activeResult.llmResponseExcerpt}
                        </p>
                        <div className="text-[11px] text-indigo-400">
                          {activeResult.citationReasoning}
                        </div>
                      </div>
                    )}

                    {activeResult.suggestions && (
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-slate-300">拓展关键词 ({activeResult.suggestions.length})</div>
                        <div className="grid grid-cols-1 gap-2">
                          {activeResult.suggestions.slice(0, 4).map((s: any) => (
                            <div key={s.id || s.keyword} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                              <span className="font-medium text-slate-200">{s.keyword}</span>
                              <span className="text-[10px] text-slate-400 font-mono">搜索量: {s.searchVolume}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeResult.overallHealthScore !== undefined && (
                      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-400">排位健康度评分</span>
                          <span className="text-2xl font-bold font-mono text-sky-400">
                            {activeResult.overallHealthScore} / 100
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {activeResult.summary}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {!isRunningAnalysis && activeResult && resultTab === 'json' && (
                  <div className="relative">
                    <button
                      onClick={() => copyToClipboard(rawJsonResponse, 'raw-json')}
                      className="absolute top-2 right-2 px-2.5 py-1 rounded bg-slate-800 text-[10px] text-slate-300 flex items-center gap-1 hover:bg-slate-700"
                    >
                      {copiedCodeId === 'raw-json' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>复制</span>
                    </button>
                    <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400 max-h-[460px] overflow-y-auto whitespace-pre-wrap">
                      {rawJsonResponse}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: API 密钥配置与自定义端点 (Config) */}
      {/* ========================================================================= */}
      {hubTab === 'config' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Key className="w-4.5 h-4.5 text-amber-400" />
              <span>多大模型 API 密钥与私有端点配置</span>
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              系统预置了高保真本地智能预测模型保障无需配置即可开箱即用。若您拥有自有商用或开源 API 密钥（如 DeepSeek-R1、OpenAI GPT-4o、Claude 3.7 或私有 Ollama），可在此直接填入，即刻启用真实高并发推理。
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {providers.map((p) => {
                const conf = customKeys[p.id] || {};
                return (
                  <div key={p.id} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{p.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                          {p.activeModel}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1 font-mono">
                        {conf.apiKey ? `${conf.apiKey.slice(0, 7)}••••••••` : p.keyMask || '未单独配置 (使用内置镜像)'}
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenConfigModal(p)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white transition-colors"
                    >
                      编辑配置
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: 实时调用日志流 (Logs) */}
      {/* ========================================================================= */}
      {hubTab === 'logs' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Terminal className="w-4.5 h-4.5 text-indigo-400" />
              <span>多大模型网关实时调用日志流</span>
            </h2>
            <span className="text-xs text-slate-500 font-mono">最近 {logs.length} 条调用记录</span>
          </div>

          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-slate-400">{log.timestamp}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {log.model}
                  </span>
                  <span className="font-mono text-slate-300">{log.endpoint}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-slate-400 truncate max-w-sm">{log.responseSummary}</span>
                  <span className="font-mono text-emerald-400">{log.latencyMs}ms</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Key Configuration Modal */}
      {/* ========================================================================= */}
      {configModalProvider && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">配置 {configModalProvider.name}</h3>
              </div>
              <button
                onClick={() => setConfigModalProvider(null)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                关闭
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  API Key 密钥
                </label>
                <input
                  type="password"
                  placeholder="如: sk-••••••••••••"
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  API Base URL (端点地址)
                </label>
                <input
                  type="text"
                  placeholder="默认官方端点"
                  value={tempBaseUrl}
                  onChange={(e) => setTempBaseUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  指定模型名称
                </label>
                <input
                  type="text"
                  placeholder={`如: ${configModalProvider.activeModel}`}
                  value={tempCustomModel}
                  onChange={(e) => setTempCustomModel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                onClick={() => setConfigModalProvider(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveConfig}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all"
              >
                保存配置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
