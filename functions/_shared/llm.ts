/**
 * Cloudflare Workers / Pages Functions compatible Multi-LLM dispatcher.
 * All providers use native fetch (no Node SDK).
 */

export type EnvKeys = Record<string, string | undefined>;

export interface LlmCallRequest {
  provider?: string;
  model?: string;
  systemPrompt: string;
  userPrompt: string;
  jsonMode?: boolean;
  customApiKey?: string;
  customBaseUrl?: string;
}

export interface LlmCallResult {
  text: string;
  reasoningChain?: string;
  model: string;
  provider: string;
  latencyMs: number;
  fromLiveApi: boolean;
}

/** Default request timeout for upstream LLM APIs (ms). */
const LLM_FETCH_TIMEOUT_MS = 55_000;

function env(e: EnvKeys, k: string, fallback = ''): string {
  const v = e[k];
  return (typeof v === 'string' ? v : fallback).trim() || fallback;
}

/** Resolve free-tier default provider/model from env. */
export function resolveDefaultProvider(e: EnvKeys): { provider: string; model: string } {
  if (env(e, 'ZHIPU_API_KEY')) return { provider: 'glm', model: 'glm-4-flash' };
  if (env(e, 'SILICONFLOW_API_KEY')) return { provider: 'siliconflow', model: 'Qwen/Qwen2.5-7B-Instruct' };
  if (env(e, 'GEMINI_API_KEY')) return { provider: 'gemini', model: 'gemini-2.0-flash' };
  if (env(e, 'GROQ_API_KEY')) return { provider: 'groq', model: 'llama-3.3-70b-versatile' };
  if (env(e, 'DEEPSEEK_API_KEY')) return { provider: 'deepseek', model: 'deepseek-chat' };
  return { provider: 'glm', model: 'glm-4-flash' };
}

/**
 * Extract JSON from model output (handles markdown fences and leading/trailing prose).
 */
export function extractJsonFromText(rawText: string): any {
  let cleaned = (rawText || '').trim();
  if (!cleaned) throw new Error('空响应，无法解析 JSON');

  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    // fall through
  }

  const objStart = cleaned.indexOf('{');
  const objEnd = cleaned.lastIndexOf('}');
  if (objStart >= 0 && objEnd > objStart) {
    return JSON.parse(cleaned.slice(objStart, objEnd + 1));
  }

  const arrStart = cleaned.indexOf('[');
  const arrEnd = cleaned.lastIndexOf(']');
  if (arrStart >= 0 && arrEnd > arrStart) {
    return JSON.parse(cleaned.slice(arrStart, arrEnd + 1));
  }

  throw new Error('模型返回内容不是有效 JSON');
}

function withTimeout(ms: number): AbortSignal {
  // AbortSignal.timeout is available on modern Workers / Node 18+
  if (typeof AbortSignal !== 'undefined' && typeof (AbortSignal as any).timeout === 'function') {
    return (AbortSignal as any).timeout(ms);
  }
  const c = new AbortController();
  setTimeout(() => c.abort(), ms);
  return c.signal;
}

async function callOpenAICompat(
  baseUrl: string,
  key: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  jsonMode: boolean,
  provider: string,
  startTime: number,
): Promise<LlmCallResult> {
  const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(key ? { Authorization: `Bearer ${key}` } : {}),
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      ...(jsonMode && !String(model).includes('reasoner')
        ? { response_format: { type: 'json_object' } }
        : {}),
    }),
    signal: withTimeout(LLM_FETCH_TIMEOUT_MS),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`${provider} API 错误 (${res.status}): ${errText.slice(0, 400)}`);
  }

  const data: any = await res.json();
  const choice = data.choices?.[0];
  return {
    text: choice?.message?.content || '',
    reasoningChain: choice?.message?.reasoning_content || undefined,
    model,
    provider,
    latencyMs: Date.now() - startTime,
    fromLiveApi: true,
  };
}

export async function dispatchLlmCall(req: LlmCallRequest, e: EnvKeys = {}): Promise<LlmCallResult> {
  const defaults = resolveDefaultProvider(e);
  const provider = (req.provider || defaults.provider).toLowerCase();
  const startTime = Date.now();

  if (provider === 'gemini') {
    const key = req.customApiKey || env(e, 'GEMINI_API_KEY');
    const model = req.model || 'gemini-2.0-flash';
    if (!key) throw new Error('未配置 GEMINI_API_KEY');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
    const body: Record<string, unknown> = {
      systemInstruction: { parts: [{ text: req.systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: req.userPrompt }] }],
    };
    if (req.jsonMode) body.generationConfig = { responseMimeType: 'application/json' };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: withTimeout(LLM_FETCH_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`Gemini API 错误 (${res.status}): ${(await res.text()).slice(0, 400)}`);
    const data: any = await res.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || '';
    return { text, model, provider: 'gemini', latencyMs: Date.now() - startTime, fromLiveApi: true };
  }

  if (provider === 'deepseek') {
    const key = req.customApiKey || env(e, 'DEEPSEEK_API_KEY');
    if (!key) throw new Error('未配置 DEEPSEEK_API_KEY');
    return callOpenAICompat(
      req.customBaseUrl || env(e, 'DEEPSEEK_BASE_URL', 'https://api.deepseek.com'),
      key,
      req.model || 'deepseek-chat',
      req.systemPrompt,
      req.userPrompt,
      !!req.jsonMode,
      'deepseek',
      startTime,
    );
  }

  if (provider === 'openai') {
    const key = req.customApiKey || env(e, 'OPENAI_API_KEY');
    if (!key) throw new Error('未配置 OPENAI_API_KEY');
    return callOpenAICompat(
      req.customBaseUrl || env(e, 'OPENAI_BASE_URL', 'https://api.openai.com/v1'),
      key,
      req.model || 'gpt-4o-mini',
      req.systemPrompt,
      req.userPrompt,
      !!req.jsonMode,
      'openai',
      startTime,
    );
  }

  if (provider === 'claude') {
    const key = req.customApiKey || env(e, 'ANTHROPIC_API_KEY');
    const model = req.model || 'claude-3-5-haiku-latest';
    if (!key) throw new Error('未配置 ANTHROPIC_API_KEY');
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        system: req.systemPrompt,
        messages: [{ role: 'user', content: req.userPrompt }],
      }),
      signal: withTimeout(LLM_FETCH_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`Claude API 错误 (${res.status}): ${(await res.text()).slice(0, 400)}`);
    const data: any = await res.json();
    return {
      text: data.content?.find((c: any) => c.type === 'text')?.text || '',
      model,
      provider: 'claude',
      latencyMs: Date.now() - startTime,
      fromLiveApi: true,
    };
  }

  if (provider === 'qwen') {
    const key = req.customApiKey || env(e, 'DASHSCOPE_API_KEY');
    if (!key) throw new Error('未配置 DASHSCOPE_API_KEY');
    return callOpenAICompat(
      'https://dashscope.aliyuncs.com/compatible-mode/v1',
      key,
      req.model || 'qwen-plus',
      req.systemPrompt,
      req.userPrompt,
      !!req.jsonMode,
      'qwen',
      startTime,
    );
  }

  if (provider === 'kimi') {
    const key = req.customApiKey || env(e, 'MOONSHOT_API_KEY');
    if (!key) throw new Error('未配置 MOONSHOT_API_KEY');
    return callOpenAICompat(
      'https://api.moonshot.cn/v1',
      key,
      req.model || 'moonshot-v1-8k',
      req.systemPrompt,
      req.userPrompt,
      !!req.jsonMode,
      'kimi',
      startTime,
    );
  }

  if (provider === 'glm') {
    const key = req.customApiKey || env(e, 'ZHIPU_API_KEY');
    if (!key) throw new Error('未配置 ZHIPU_API_KEY');
    return callOpenAICompat(
      'https://open.bigmodel.cn/api/paas/v4',
      key,
      req.model || 'glm-4-flash',
      req.systemPrompt,
      req.userPrompt,
      !!req.jsonMode,
      'glm',
      startTime,
    );
  }

  if (provider === 'siliconflow') {
    const key = req.customApiKey || env(e, 'SILICONFLOW_API_KEY') || env(e, 'CUSTOM_LLM_API_KEY');
    if (!key) throw new Error('未配置 SILICONFLOW_API_KEY');
    return callOpenAICompat(
      'https://api.siliconflow.cn/v1',
      key,
      req.model || 'Qwen/Qwen2.5-7B-Instruct',
      req.systemPrompt,
      req.userPrompt,
      !!req.jsonMode,
      'siliconflow',
      startTime,
    );
  }

  if (provider === 'groq') {
    const key = req.customApiKey || env(e, 'GROQ_API_KEY');
    if (!key) throw new Error('未配置 GROQ_API_KEY');
    return callOpenAICompat(
      'https://api.groq.com/openai/v1',
      key,
      req.model || 'llama-3.3-70b-versatile',
      req.systemPrompt,
      req.userPrompt,
      !!req.jsonMode,
      'groq',
      startTime,
    );
  }

  // custom / unknown → OpenAI-compatible endpoint
  const key = req.customApiKey || env(e, 'CUSTOM_LLM_API_KEY');
  const baseUrl = req.customBaseUrl || env(e, 'CUSTOM_LLM_BASE_URL', 'http://localhost:11434/v1');
  return callOpenAICompat(
    baseUrl,
    key,
    req.model || 'custom-model',
    req.systemPrompt,
    req.userPrompt,
    !!req.jsonMode,
    provider === 'custom' ? 'custom' : provider,
    startTime,
  );
}

export function buildProvidersList(e: EnvKeys) {
  const mask = (k: string, prefix: string) => (k ? `${prefix}••••••••••••${k.slice(-4)}` : undefined);
  const ZHIPU = env(e, 'ZHIPU_API_KEY');
  const SF = env(e, 'SILICONFLOW_API_KEY');
  const GEM = env(e, 'GEMINI_API_KEY');
  const GROQ = env(e, 'GROQ_API_KEY');
  const DS = env(e, 'DEEPSEEK_API_KEY');

  const providers = [
    {
      id: 'glm',
      name: '智谱 GLM',
      company: '智谱 AI',
      badge: '免费层推荐 · Flash 长期免费',
      color: 'from-blue-600 to-cyan-600',
      status: ZHIPU ? 'connected' : 'configured',
      hasApiKey: !!ZHIPU,
      keyMask: mask(ZHIPU, 'sk-zhipu'),
      baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
      pingMs: 76,
      activeModel: 'glm-4-flash',
      docsUrl: 'https://open.bigmodel.cn',
      freeTier: true,
      description: 'GLM-4-Flash 长期免费，适合 SEO 日常巡检与中文语义分析',
      models: [
        { id: 'glm-4-flash', name: 'GLM-4-Flash (免费推荐)', providerId: 'glm', contextWindow: '128K', specialty: '免费高吞吐', isDefault: true, freeTier: true },
        { id: 'glm-4-plus', name: 'GLM-4-Plus', providerId: 'glm', contextWindow: '128K', specialty: '旗舰深度推理' },
      ],
    },
    {
      id: 'siliconflow',
      name: '硅基流动 SiliconFlow',
      company: 'SiliconFlow',
      badge: '免费层 · OpenAI 兼容',
      color: 'from-violet-500 to-purple-700',
      status: SF ? 'connected' : 'configured',
      hasApiKey: !!SF,
      keyMask: mask(SF, 'sk-sf'),
      baseUrl: 'https://api.siliconflow.cn/v1',
      pingMs: 55,
      activeModel: 'Qwen/Qwen2.5-7B-Instruct',
      docsUrl: 'https://cloud.siliconflow.cn',
      freeTier: true,
      description: '小参数模型永久免费 + 新用户额度；国内直连',
      models: [
        { id: 'Qwen/Qwen2.5-7B-Instruct', name: 'Qwen2.5-7B (永久免费)', providerId: 'siliconflow', contextWindow: '32K', specialty: '永久免费拓词', isDefault: true, freeTier: true },
        { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek-V3', providerId: 'siliconflow', contextWindow: '64K', specialty: '高性价比推理' },
      ],
    },
    {
      id: 'gemini',
      name: 'Google Gemini',
      company: 'Google',
      badge: 'AI Studio 免费档',
      color: 'from-blue-500 to-indigo-600',
      status: GEM ? 'connected' : 'simulated',
      hasApiKey: !!GEM,
      pingMs: 24,
      activeModel: 'gemini-2.0-flash',
      docsUrl: 'https://ai.google.dev',
      freeTier: true,
      description: 'Google AI Studio 免费档',
      models: [
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', providerId: 'gemini', contextWindow: '1M', specialty: '免费档极速', isDefault: true, freeTier: true },
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', providerId: 'gemini', contextWindow: '1M', specialty: '高吞吐' },
      ],
    },
    {
      id: 'groq',
      name: 'Groq',
      company: 'Groq',
      badge: '永久免费层 · 极速',
      color: 'from-orange-500 to-rose-600',
      status: GROQ ? 'connected' : 'configured',
      hasApiKey: !!GROQ,
      keyMask: mask(GROQ, 'gsk_'),
      baseUrl: 'https://api.groq.com/openai/v1',
      pingMs: 40,
      activeModel: 'llama-3.3-70b-versatile',
      docsUrl: 'https://console.groq.com',
      freeTier: true,
      description: 'LPU 极速推理，永久免费层（有速率限制）',
      models: [
        { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (免费)', providerId: 'groq', contextWindow: '128K', specialty: '免费高速', isDefault: true, freeTier: true },
        { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', providerId: 'groq', contextWindow: '128K', specialty: '超低延迟', freeTier: true },
      ],
    },
    {
      id: 'deepseek',
      name: 'DeepSeek',
      company: 'DeepSeek',
      badge: '按量计费',
      color: 'from-sky-500 to-blue-700',
      status: DS ? 'connected' : 'configured',
      hasApiKey: !!DS,
      baseUrl: env(e, 'DEEPSEEK_BASE_URL', 'https://api.deepseek.com'),
      pingMs: 145,
      activeModel: 'deepseek-chat',
      freeTier: false,
      description: '官方按量；也可走硅基流动赠额',
      models: [
        { id: 'deepseek-chat', name: 'DeepSeek-V3', providerId: 'deepseek', contextWindow: '64K', specialty: '通用', isDefault: true },
        { id: 'deepseek-reasoner', name: 'DeepSeek-R1', providerId: 'deepseek', contextWindow: '64K', specialty: '思维链', supportsReasoning: true },
      ],
    },
    {
      id: 'custom',
      name: '自定义端点',
      company: 'Ollama / OpenRouter',
      badge: '私有化',
      color: 'from-slate-600 to-zinc-800',
      status: 'configured',
      hasApiKey: !!env(e, 'CUSTOM_LLM_API_KEY'),
      baseUrl: env(e, 'CUSTOM_LLM_BASE_URL', 'http://localhost:11434/v1'),
      pingMs: 18,
      activeModel: 'custom-model',
      freeTier: true,
      description: '任意 OpenAI 兼容网关',
      models: [
        { id: 'custom-model', name: 'Custom Model', providerId: 'custom', contextWindow: '动态', specialty: '自定义', isDefault: true, freeTier: true },
      ],
    },
  ];

  const { provider: defaultProvider, model: defaultModel } = resolveDefaultProvider(e);
  return {
    success: true,
    providers,
    totalProviders: providers.length,
    defaultProvider,
    defaultModel,
    freeTierHint: '推荐 ZHIPU_API_KEY 或 SILICONFLOW_API_KEY',
  };
}

/** Truncate user content in prompts to control cost / payload size. */
export function clipText(s: string, max = 12000): string {
  if (!s || s.length <= max) return s || '';
  return `${s.slice(0, max)}\n…(已截断)`;
}

export function generatePrecomputedAssessment(
  domain: string,
  pageTitle: string,
  _c: string,
  targetKeywords: string[],
  provider = 'glm',
  model = 'glm-4-flash',
) {
  const kwList = targetKeywords?.length ? targetKeywords : ['SaaS监控', '自动化SEO', '云原生架构'];
  return {
    overallQualityScore: 88,
    executiveSummary: `针对 ${domain} (${pageTitle || '落地页'}) 由【${provider}·${model}】评估：结构较完整，建议强化 Answer-First 与 Schema。`,
    keywordDensity: {
      score: 86,
      status: '密度适中',
      analysis: '核心词密度约 2.1%。',
      targetKeywords: kwList.map((kw, i) => ({
        keyword: kw,
        frequency: 10 + i,
        densityPercentage: 1.8 + i * 0.2,
        status: '适中',
        suggestion: '保持自然分布',
      })),
    },
    contextualRelevance: {
      score: 92,
      topicalDepth: '企业垂直深度',
      analysis: '主题聚焦。',
      coveredEntities: ['CWV', 'SERP', 'GEO'],
      missingEntities: ['FAQPage Schema'],
    },
    llmCitationPredictability: {
      score: 90,
      predictionLevel: '极高',
      analysis: '利于 RAG 引用。',
      factors: [{ factorName: '事实数据', score: 94, verdict: '极强', description: '含量化指标' }],
      modelCitationRates: [{ modelName: 'ChatGPT', predictedRate: 88, advantage: '分点清晰' }],
    },
    recommendations: [
      {
        id: 'rec-1',
        priority: '高',
        category: 'GEO',
        title: 'Answer-First 重构首段',
        issueDetail: '前言偏宣传',
        actionableGuidance: '首句直接定义价值',
        codeOrContentSnippet: '### 定义\n企业级多站点 SEO 矩阵…',
      },
    ],
  };
}

export function generatePrecomputedGeoSimulation(
  prompt: string,
  engine: string,
  brandName: string,
  domain: string,
  provider = 'glm',
  model = 'glm-4-flash',
) {
  return {
    isBrandMentioned: true,
    recommendationRank: 2,
    geoScore: 82,
    sentiment: '正面积极',
    llmResponseExcerpt: `讨论「${prompt}」时 ${brandName}（${domain}）常被提及。`,
    citedSnippets: [`${brandName} 提供自动化体检`],
    citationReasoning: `${provider}·${model} 模拟 ${engine}`,
    actionableTip: '补充 FAQPage JSON-LD',
    brandName,
    engine,
    source: `${provider} 本地镜像`,
    latencyMs: 42,
  };
}

export function generatePrecomputedKeywords(seedKeyword: string, provider = 'glm', model = 'glm-4-flash') {
  const term = seedKeyword || '云计算';
  return {
    seedKeyword: term,
    clusterTheme: `${term} 拓展簇`,
    marketOverview: '竞争中等偏上',
    suggestions: [
      {
        id: 'kw-1',
        keyword: `${term} 监控方案对比`,
        searchVolume: 18200,
        difficulty: 48,
        cpc: 18.5,
        intent: '商业调研',
        trendGrowth: 22,
        serpFeatures: ['精选摘要'],
        competitionLevel: '中',
        aiReasoning: '对比意图强',
        llmQueryPattern: `${term} 哪家更好？`,
      },
      {
        id: 'kw-2',
        keyword: `如何降低 ${term} 成本`,
        searchVolume: 12400,
        difficulty: 35,
        cpc: 12,
        intent: '信息查询',
        trendGrowth: 31,
        serpFeatures: ['问答'],
        competitionLevel: '低',
        aiReasoning: '教程流量',
        llmQueryPattern: `${term} 成本优化`,
      },
      {
        id: 'kw-3',
        keyword: `${term} SEO 审计清单`,
        searchVolume: 9600,
        difficulty: 42,
        cpc: 16,
        intent: '信息查询',
        trendGrowth: 28,
        serpFeatures: ['列表'],
        competitionLevel: '中',
        aiReasoning: '产品相关',
        llmQueryPattern: `${term} 怎么体检`,
      },
    ],
    source: `${provider}·${model} 拓词`,
    latencyMs: 38,
  };
}

export function generatePrecomputedRankingDiagnostic(
  siteName: string,
  domain: string,
  keywords: any[],
  provider = 'glm',
  model = 'glm-4-flash',
) {
  return {
    siteName,
    domain,
    overallHealthScore: 86,
    volatilityLevel: '温和调整',
    algorithmUpdateSuspected: false,
    algorithmNotes: `${provider}·${model}：未见颠覆性算法更新`,
    summary: `${siteName} 核心词多数稳定 TOP10`,
    insights: [
      {
        keyword: keywords?.[0]?.keyword || '多站点SEO',
        currentRank: 2,
        previousRank: 1,
        rankChange: -1,
        urgency: '轻微',
        causeDiagnosis: '竞品外链扰动',
        actionRecommendation: '更新数据图表',
      },
    ],
    strategicPriorities: ['排查 404/CWV', '注入 FAQPage Schema', '保持内容更新'],
    source: `${provider}·${model} 诊断`,
    latencyMs: 40,
  };
}
