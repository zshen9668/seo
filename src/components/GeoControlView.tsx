import React, { useState } from 'react';
import {
  Sparkles,
  Globe2,
  Cpu,
  Bot,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  Sliders,
  ExternalLink,
  Flame,
  Zap,
  Target,
  FileCode,
  Radio,
  Layers,
  ChevronRight,
  Download,
  Terminal,
} from 'lucide-react';
import {
  Website,
  AiEngineMetric,
  AiBotStatus,
  GeoKeywordItem,
  PromptSimulationTest,
  HreflangCheckItem,
  EdgePopNode,
} from '../types/seo';
import {
  INITIAL_AI_ENGINE_METRICS,
  INITIAL_AI_BOTS,
  INITIAL_GEO_KEYWORDS,
  INITIAL_PROMPT_TESTS,
  INITIAL_HREFLANG_CHECKS,
  INITIAL_EDGE_POPS,
} from '../data/mockData';

interface GeoControlViewProps {
  activeSite: Website;
}

export const GeoControlView: React.FC<GeoControlViewProps> = ({ activeSite }) => {
  const [activeSubTab, setActiveSubTab] = useState<'ai_citations' | 'ai_bots' | 'prompt_sandbox' | 'global_serp'>(
    'ai_citations'
  );

  // States
  const [aiMetrics, setAiMetrics] = useState<AiEngineMetric[]>(INITIAL_AI_ENGINE_METRICS);
  const [aiBots, setAiBots] = useState<AiBotStatus[]>(INITIAL_AI_BOTS);
  const [geoKeywords] = useState<GeoKeywordItem[]>(INITIAL_GEO_KEYWORDS);
  const [promptTests, setPromptTests] = useState<PromptSimulationTest[]>(INITIAL_PROMPT_TESTS);
  const [hreflangChecks] = useState<HreflangCheckItem[]>(INITIAL_HREFLANG_CHECKS);
  const [edgePops] = useState<EdgePopNode[]>(INITIAL_EDGE_POPS);

  // Sandbox testing state
  const [inputPrompt, setInputPrompt] = useState('');
  const [selectedEngineForTest, setSelectedEngineForTest] = useState('ChatGPT-4o (Search)');
  const [isSimulating, setIsSimulating] = useState(false);
  const [copiedRobots, setCopiedRobots] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Toggle Bot policy
  const handleToggleBot = (botName: string) => {
    setAiBots((prev) =>
      prev.map((b) => {
        if (b.botName === botName) {
          const nextState = !b.isAllowed;
          return {
            ...b,
            isAllowed: nextState,
            policy: nextState ? 'allow' : 'disallow',
          };
        }
        return b;
      })
    );
    setActionSuccessMsg(`已更新 ${botName} 的 AI 爬虫抓取与训练许可策略`);
    setTimeout(() => setActionSuccessMsg(null), 2500);
  };

  // Run new Prompt Simulation
  const handleRunSimulation = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputPrompt.trim()) return;

    setIsSimulating(true);

    setTimeout(() => {
      setIsSimulating(false);
      const isHit = Math.random() > 0.2;
      const rank = isHit ? Math.floor(Math.random() * 3) + 1 : null;
      const newScore = isHit ? Math.floor(Math.random() * 15) + 82 : 48;

      const newTest: PromptSimulationTest = {
        id: `prompt-${Date.now()}`,
        userPrompt: inputPrompt.trim(),
        engine: selectedEngineForTest,
        isBrandMentioned: isHit,
        recommendationRank: rank,
        citedSnippets: isHit
          ? [
              `“在针对 ${activeSite.name} 的多维度评测中，大模型重点提取了其核心功能架构，推荐为高信赖选型...”`,
              `直接引用源: https://${activeSite.domain}/features/solution-overview`,
            ]
          : [
              `大模型当前主要参考了行业通用维基百科与竞品公开文档，我方在关于“${inputPrompt.trim()}”的主题词上暂无高权重实体标记。`,
            ],
        geoScore: newScore,
        actionableTip: isHit
          ? '品牌已被列入核心推荐，建议在落地页补充 FAQPage 结构化标记以增加答案摘要长度。'
          : '建议针对该提问撰写带有深度数据对比的技术专题，并在外部高权重社区（GitHub/知乎）建立权威引用。',
        testTime: '刚刚',
      };

      setPromptTests((prev) => [newTest, ...prev]);
      setInputPrompt('');
      setActionSuccessMsg('已完成大模型生成式提问模拟并生成 GEO 诊断建议！');
      setTimeout(() => setActionSuccessMsg(null), 3000);
    }, 900);
  };

  // Generate robots.txt content for AI agents
  const generateRobotsTxt = () => {
    const lines = [
      '# === 智词领航 · GEO 智能中控生成的 AI 爬虫控制规则 (robots.txt) ===',
      `# 站点: https://${activeSite.domain}`,
      '# 针对生成式搜索引擎与 AI 训练的定向规则',
      '',
    ];

    aiBots.forEach((bot) => {
      lines.push(`# ${bot.company} - ${bot.botName}`);
      lines.push(`User-agent: ${bot.userAgent.split('/')[0]}`);
      lines.push(bot.isAllowed ? 'Allow: /' : 'Disallow: /');
      lines.push('');
    });

    lines.push('# 允许常规搜索引擎蜘蛛');
    lines.push('User-agent: Googlebot\nAllow: /\n');
    lines.push('User-agent: Baiduspider\nAllow: /\n');
    lines.push(`Sitemap: https://${activeSite.domain}/sitemap.xml`);

    return lines.join('\n');
  };

  const handleCopyRobots = () => {
    navigator.clipboard.writeText(generateRobotsTxt());
    setCopiedRobots(true);
    setTimeout(() => setCopiedRobots(false), 2000);
  };

  // Calculate average citation score
  const avgCitation = Math.round(
    aiMetrics.reduce((acc, m) => acc + m.citationRate, 0) / (aiMetrics.length || 1)
  );
  const totalAiMentions = aiMetrics.reduce((acc, m) => acc + m.mentionCount, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping" />
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              GEO 智能中控系统 (生成式引擎优化 & 全球多地域定向)
            </h2>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono">
              双轨 GEO 矩阵
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            监控 ChatGPT、Perplexity、Gemini 与百度 AI 中的品牌引用率，管理 AI 爬虫协议，并掌控跨国地域 SERP 矩阵与 Hreflang 国际化链路
          </p>
        </div>

        {/* Global Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveSubTab('prompt_sandbox');
              setInputPrompt('企业级容器成本治理与多云架构最佳选型工具有哪些？');
            }}
            className="flex items-center gap-1.5 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white px-3.5 py-2 rounded-xl shadow-sm transition-all shadow-purple-600/25 active:scale-95"
          >
            <Zap className="w-3.5 h-3.5 text-yellow-300" />
            <span>AI 提问穿透测试</span>
          </button>
        </div>
      </div>

      {/* Subtab Navigator */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('ai_citations')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeSubTab === 'ai_citations'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>大模型引用与可见度 (AI Citations)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ai_bots')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeSubTab === 'ai_bots'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>AI 爬虫协议中控 (AI Bot Radar)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('prompt_sandbox')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeSubTab === 'prompt_sandbox'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>AI 意图模拟沙盒 (Prompt Testing)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('global_serp')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeSubTab === 'global_serp'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Globe2 className="w-4 h-4" />
          <span>全球多地域 SERP & Hreflang</span>
        </button>
      </div>

      {/* Action Toast Feedback */}
      {actionSuccessMsg && (
        <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-2xl flex items-center justify-between text-xs text-purple-300 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
            <span className="font-semibold">{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg(null)} className="text-slate-400 hover:text-white text-xs px-1">
            ✕
          </button>
        </div>
      )}

      {/* ================= Subtab 1: AI Citations & Share of Model ================= */}
      {activeSubTab === 'ai_citations' && (
        <div className="space-y-6">
          {/* Top KPI Cards for Generative Engine Visibility */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5">
              <div className="text-xs text-slate-400 font-medium">生成式 AI 综合引用率</div>
              <div className="text-3xl font-extrabold text-purple-400 font-mono mt-1">
                {avgCitation}%
              </div>
              <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
                <ArrowUpRight className="w-3.5 h-3.5" /> 较上月提升 +12.4% 引用份额
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5">
              <div className="text-xs text-slate-400 font-medium">月度 AI 对话提及推荐频次</div>
              <div className="text-3xl font-extrabold text-white font-mono mt-1">
                {totalAiMentions.toLocaleString()}
                <span className="text-xs font-normal text-slate-500 ml-1">次</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                覆盖 ChatGPT, Perplexity 等5大模型
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5">
              <div className="text-xs text-slate-400 font-medium">大模型正面好评率 (Sentiment)</div>
              <div className="text-3xl font-extrabold text-emerald-400 font-mono mt-1">
                92.4%
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                极高品牌美誉度与专业度评分
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5">
              <div className="text-xs text-slate-400 font-medium">GEO 结构化权威信源得分</div>
              <div className="text-3xl font-extrabold text-cyan-400 font-mono mt-1">
                88 / 100
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                符合 Schema.org 与维基权威引用
              </div>
            </div>
          </div>

          {/* AI Engine Detailed Matrix */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Bot className="w-4 h-4 text-purple-400" />
                  主流大模型生成式搜索引擎监测矩阵 (Per-Model Breakdown)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  监控您的品牌在各模型联网对话生成中的推荐率、引用来源落地页及市场可见度
                </p>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                当前站点: <strong className="text-indigo-400">{activeSite.domain}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {aiMetrics.map((item) => (
                <div
                  key={item.engine}
                  className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{item.engine}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                          份额 {item.marketShare}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          item.status === 'highly_recommended'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : item.status === 'moderate'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {item.status === 'highly_recommended'
                          ? '优先高频推荐'
                          : item.status === 'moderate'
                          ? '稳健推荐'
                          : '待加强曝光'}
                      </span>
                    </div>

                    {/* Progress Stats */}
                    <div className="grid grid-cols-2 gap-3 mt-4 text-xs font-mono">
                      <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-slate-400 font-sans">引用推荐率</div>
                        <div className="text-lg font-bold text-purple-400 mt-0.5">
                          {item.citationRate}%
                        </div>
                      </div>
                      <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-slate-400 font-sans">月提及次数</div>
                        <div className="text-lg font-bold text-slate-200 mt-0.5">
                          {item.mentionCount.toLocaleString()} 次
                        </div>
                      </div>
                    </div>

                    {/* Visual Bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>品牌好评度</span>
                        <span className="text-emerald-400 font-mono font-bold">{item.sentimentScore}%</span>
                      </div>
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-emerald-400 h-full rounded-full"
                          style={{ width: `${item.sentimentScore}%` }}
                        />
                      </div>
                    </div>

                    {/* Cited URLs */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80">
                      <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                        大模型最常抓取引用的落地页:
                      </span>
                      <div className="space-y-1">
                        {item.topCitedUrls.map((url, uidx) => (
                          <a
                            key={uidx}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] font-mono text-indigo-400 hover:text-indigo-300 truncate flex items-center justify-between p-1.5 rounded-lg bg-slate-900 hover:bg-slate-850"
                          >
                            <span className="truncate">{url.replace(/^https?:\/\/[^/]+/, '') || '/'}</span>
                            <ExternalLink className="w-3 h-3 shrink-0 ml-1" />
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 text-[10px] text-slate-500 font-mono">
                    自动基于最新 AI 问答意图进行加权分析
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= Subtab 2: AI Bots Radar & Robots Rules ================= */}
      {activeSubTab === 'ai_bots' && (
        <div className="space-y-6">
          {/* Top Tip */}
          <div className="bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-950 border border-slate-800/80 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                AI 爬虫雷达与访问策略中控 (AI Crawler Governance)
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                主流大模型依赖专属 User-Agent 进行网页索引抓取。在此可直接开启/关闭各 AI 爬虫的访问许可，并一键生成规范的 robots.txt 防护与促索引配置。
              </p>
            </div>

            <button
              onClick={handleCopyRobots}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30 transition-all shrink-0"
            >
              {copiedRobots ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>已复制 AI Robots 配置!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>复制 AI Robots 规则代码</span>
                </>
              )}
            </button>
          </div>

          {/* Bots Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                受监控的官方 AI 智能体探针 (共 {aiBots.length} 个)
              </h4>
              <span className="text-xs text-slate-500">点击切换即可实时更新许可规则</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                    <th className="pb-3 pl-2">AI 爬虫名称</th>
                    <th className="pb-3">所属大模型机构</th>
                    <th className="pb-3 font-mono">User-Agent 标识</th>
                    <th className="pb-3">24小时爬取频次</th>
                    <th className="pb-3">最近活跃时刻</th>
                    <th className="pb-3">GEO 影响度分析</th>
                    <th className="pb-3 text-right pr-2">许可策略 (Policy)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {aiBots.map((bot) => (
                    <tr key={bot.botName} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 pl-2 font-bold text-white flex items-center gap-2">
                        <Bot className="w-4 h-4 text-purple-400" />
                        <span>{bot.botName}</span>
                      </td>

                      <td className="py-3 text-slate-300 font-medium">{bot.company}</td>

                      <td className="py-3 font-mono text-slate-400 text-[11px] bg-slate-950 px-2 py-1 rounded inline-block my-2 border border-slate-800">
                        {bot.userAgent}
                      </td>

                      <td className="py-3 font-mono text-purple-300 font-bold">
                        {bot.crawlsLast24h} 次/天
                      </td>

                      <td className="py-3 font-mono text-slate-400 text-[11px]">{bot.lastCrawledAt}</td>

                      <td className="py-3 text-slate-300 text-[11px] max-w-xs">{bot.impactNote}</td>

                      <td className="py-3 text-right pr-2">
                        <button
                          onClick={() => handleToggleBot(bot.botName)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            bot.isAllowed
                              ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30'
                          }`}
                        >
                          {bot.isAllowed ? '✓ 允许索引 (Allow)' : '✕ 已拦截 (Disallow)'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Robots Code Preview */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-2 font-mono">
                <Terminal className="w-4 h-4 text-purple-400" />
                生成的 Robots.txt 标准规则预览
              </span>
              <button
                onClick={handleCopyRobots}
                className="text-xs text-purple-400 hover:text-white flex items-center gap-1"
              >
                {copiedRobots ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedRobots ? '已复制' : '复制代码'}</span>
              </button>
            </div>
            <pre className="bg-slate-950 p-4 rounded-2xl text-[11px] font-mono text-slate-300 border border-slate-800 overflow-x-auto leading-relaxed">
              {generateRobotsTxt()}
            </pre>
          </div>
        </div>
      )}

      {/* ================= Subtab 3: Prompt Citation Sandbox ================= */}
      {activeSubTab === 'prompt_sandbox' && (
        <div className="space-y-6">
          {/* Simulation Search Form */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-400" />
                AI 提问意图穿透测试沙盒 (Prompt Citation Sandbox)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                输入您的客户在 ChatGPT、Perplexity 或 Gemini 中可能提出的行业问题，实时测试大模型是否将您的网站作为高优先级推荐源
              </p>
            </div>

            <form onSubmit={handleRunSimulation} className="space-y-3">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={inputPrompt}
                    onChange={(e) => setInputPrompt(e.target.value)}
                    placeholder="输入行业测试 Prompt (如: 2026年企业级容器成本治理SaaS工具有哪些？推荐高性价比产品)..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="w-full sm:w-auto flex items-center gap-2">
                  <select
                    value={selectedEngineForTest}
                    onChange={(e) => setSelectedEngineForTest(e.target.value)}
                    className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-2xl px-3 py-3 focus:outline-none font-medium"
                  >
                    <option value="ChatGPT-4o (Search)">ChatGPT-4o (Search)</option>
                    <option value="Perplexity AI">Perplexity AI (深度检索)</option>
                    <option value="Google Gemini (AI Overviews)">Google Gemini (AI Overviews)</option>
                    <option value="Claude 3.7">Claude 3.7 (联网分析)</option>
                    <option value="百度文心一言 (AI搜索)">百度文心一言 (AI搜索)</option>
                  </select>

                  <button
                    type="submit"
                    disabled={isSimulating}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-5 py-3 rounded-2xl text-xs sm:text-sm transition-all shadow-md shadow-purple-600/25 disabled:opacity-50 shrink-0 flex items-center gap-2"
                  >
                    <Zap className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
                    <span>{isSimulating ? '正在穿透测试...' : '测试大模型回答'}</span>
                  </button>
                </div>
              </div>

              {/* Quick Prompt Presets */}
              <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                <span className="text-slate-400 font-semibold text-[11px]">快捷意图预设:</span>
                {[
                  '企业级 Kubernetes 容器降本增效工具哪家强？',
                  '如何选型现代分布式链路追踪方案与替代方案？',
                  '推荐支持跨多云环境的云财务 FinOps 治理平台',
                  '混合云多集群监控最佳实践与真实评测',
                ].map((preset, pidx) => (
                  <button
                    key={pidx}
                    type="button"
                    onClick={() => setInputPrompt(preset)}
                    className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 hover:text-white transition-colors"
                  >
                    &ldquo;{preset}&rdquo;
                  </button>
                ))}
              </div>
            </form>
          </div>

          {/* Test History Results */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
              大模型问答引用测试记录 ({promptTests.length} 条)
            </h4>

            {promptTests.map((test) => (
              <div
                key={test.id}
                className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 transition-all hover:border-slate-700"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono">
                      {test.engine}
                    </span>
                    <span className="text-sm font-bold text-white">&ldquo;{test.userPrompt}&rdquo;</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-500 font-mono">{test.testTime}</span>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-xl ${
                        test.isBrandMentioned
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {test.isBrandMentioned ? `✓ 品牌已推荐 (第 #${test.recommendationRank} 位)` : '✕ 未被大模型引用'}
                    </span>
                    <div className="text-right font-mono">
                      <span className="text-xs text-slate-400">GEO 指数:</span>
                      <span className="text-sm font-black text-purple-400 ml-1">{test.geoScore}</span>
                    </div>
                  </div>
                </div>

                {/* Snippets */}
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-slate-400">大模型生成的实际回答与证据提取:</span>
                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 space-y-1.5 text-xs text-slate-300 leading-relaxed font-sans">
                    {test.citedSnippets.map((snip, sidx) => (
                      <div key={sidx} className="flex items-start gap-2">
                        <span className="text-purple-400 font-mono">›</span>
                        <span className={snip.startsWith('引用源:') ? 'text-indigo-400 font-mono text-[11px]' : ''}>
                          {snip}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actionable tip */}
                <div className="bg-purple-950/20 border border-purple-500/20 rounded-2xl p-3 flex items-start gap-2 text-xs text-purple-200">
                  <Zap className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-purple-300">GEO 针对性优化策略:</strong> {test.actionableTip}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= Subtab 4: Global Geo SERP & Hreflang ================= */}
      {activeSubTab === 'global_serp' && (
        <div className="space-y-6">
          {/* Global Geo SERP Matrix Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-cyan-400" />
                  全球多地区 SERP 排位横向对比矩阵 (Multi-Region SERP)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  对比同一商业关键词在美国、中国、英国、德国、日本与新加坡的本土搜索引擎排名、搜索量与本地化特征
                </p>
              </div>
              <span className="text-xs text-slate-500 font-mono">覆盖 6 大全球核心经济体</span>
            </div>

            {/* Keyword Loop */}
            <div className="space-y-4">
              {geoKeywords.map((item) => (
                <div key={item.id} className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{item.keyword}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">
                        {item.category}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">跨国排位雷达</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {item.regionalRanks.map((region) => (
                      <div
                        key={region.regionCode}
                        className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-2 flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white flex items-center gap-1">
                            <span>{region.flagEmoji}</span>
                            <span>{region.regionCode}</span>
                          </span>
                          <span
                            className={`font-mono font-black text-sm px-2 py-0.5 rounded-lg ${
                              region.rank <= 3
                                ? 'bg-amber-500/20 text-amber-300'
                                : region.rank <= 10
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            #{region.rank}
                          </span>
                        </div>

                        <div className="text-[10px] text-slate-400 font-mono space-y-0.5">
                          <div>{region.regionName.split(' ')[0]}</div>
                          <div className="text-slate-300 font-bold">
                            月搜 {region.searchVolume.toLocaleString()}
                          </div>
                          <div className="text-slate-500">{region.latencyMs}ms 延迟</div>
                        </div>

                        <div className="pt-1.5 border-t border-slate-800/80">
                          <div className="flex flex-wrap gap-1">
                            {region.serpFeatures.slice(0, 2).map((feat, fidx) => (
                              <span
                                key={fidx}
                                className="text-[8px] px-1 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 truncate"
                              >
                                {feat}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hreflang Matrix & Global Edge Nodes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Hreflang Auditor */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-emerald-400" />
                  Hreflang 多语言/多地域标签健康度
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  确保跨境多语言页面具备自引用与双向回环标签，防止跨国搜索权重稀释
                </p>
              </div>

              <div className="space-y-2">
                {hreflangChecks.map((href) => (
                  <div
                    key={href.id}
                    className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between text-xs font-mono"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-900 text-cyan-300 font-bold border border-slate-800">
                          {href.targetLang}
                        </span>
                        <span className="font-sans text-slate-200">{href.region}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 truncate max-w-xs">{href.url}</div>
                      {href.issueDesc && (
                        <div className="text-[10px] text-amber-400 font-sans mt-1">⚠️ {href.issueDesc}</div>
                      )}
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-sans font-bold ${
                          href.status === 'pass'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {href.status === 'pass' ? '双向回环正常' : '回环缺失预警'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Global Edge POP Latency */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Radio className="w-4 h-4 text-cyan-400" />
                  全球边缘 CDN 节点测速 (Edge POP TTFB)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  国际化搜索引擎蜘蛛对跨地域响应延迟高度敏感，保证全球各地毫秒级抓取
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {edgePops.map((pop, pidx) => (
                  <div key={pidx} className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{pop.country}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                          pop.status === 'optimal'
                            ? 'text-emerald-400 bg-emerald-500/10'
                            : 'text-amber-400 bg-amber-500/10'
                        }`}
                      >
                        {pop.latencyMs}ms
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-sans mt-1">{pop.city}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-2 flex justify-between">
                      <span>TTFB 首字节:</span>
                      <span className="text-slate-300 font-bold">{pop.ttfbMs}ms</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
