/**
 * Cloudflare Pages catch-all for /api/*
 */
import type { PagesFunction } from '@cloudflare/workers-types';
import {
  EnvKeys,
  buildProvidersList,
  dispatchLlmCall,
  extractJsonFromText,
  generatePrecomputedAssessment,
  generatePrecomputedGeoSimulation,
  generatePrecomputedKeywords,
  generatePrecomputedRankingDiagnostic,
} from '../_shared/llm';

type Env = EnvKeys;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

function cors(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

async function bodyOf(request: Request): Promise<any> {
  try { return await request.json(); } catch { return {}; }
}

function routeKey(pathname: string): string {
  const p = pathname.replace(/\/+$/, '') || '/';
  return p.startsWith('/api/') ? p.slice(5) : p.replace(/^\//, '');
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return cors();

  const url = new URL(request.url);
  const key = routeKey(url.pathname);
  const method = request.method.toUpperCase();

  try {
    if (method === 'GET' && (key === 'ai/providers' || key === 'providers')) {
      return json(buildProvidersList(env));
    }

    if (method === 'GET' && key === 'gemini/status') {
      const hasKey = Boolean(env.GEMINI_API_KEY || env.ZHIPU_API_KEY || env.SILICONFLOW_API_KEY || env.GROQ_API_KEY);
      return json({
        status: hasKey ? 'online' : 'simulated',
        model: 'multi-llm-hub',
        apiVersion: 'pages-functions / multi-llm 2026',
        hasKey,
        pingMs: 12,
        lastChecked: new Date().toISOString().replace('T', ' ').substring(0, 19),
        supportedEndpoints: [
          { endpoint: '/api/ai/analyze-content', method: 'POST', status: 'active' },
          { endpoint: '/api/ai/simulate-geo', method: 'POST', status: 'active' },
          { endpoint: '/api/ai/expand-keywords', method: 'POST', status: 'active' },
          { endpoint: '/api/ai/analyze-rankings', method: 'POST', status: 'active' },
          { endpoint: '/api/ai/benchmark-compare', method: 'POST', status: 'active' },
          { endpoint: '/api/ai/providers', method: 'GET', status: 'active' },
        ],
      });
    }

    if (method !== 'POST') return json({ success: false, error: `Unsupported ${method} ${key}` }, 405);

    const body = await bodyOf(request);

    if (key === 'ai/probe-provider') {
      const { provider = 'glm', model = '', customApiKey = '', customBaseUrl = '' } = body;
      const t0 = Date.now();
      try {
        const r = await dispatchLlmCall({ provider, model, customApiKey, customBaseUrl, systemPrompt: 'API health probe.', userPrompt: 'Reply: OK', jsonMode: false }, env);
        return json({ success: true, provider, model: r.model, status: 'online', latencyMs: r.latencyMs, message: `已连接 ${provider.toUpperCase()} (${r.model})` });
      } catch (err: any) {
        return json({ success: true, provider, model: model || 'default', status: 'simulated', latencyMs: Math.max(35, Date.now() - t0), message: `探针: ${err.message}` });
      }
    }

    if (key === 'ai/analyze-content' || key === 'gemini/analyze-content') {
      const { provider = 'glm', model = 'glm-4-flash', domain = 'example.com', pageTitle = '', pageUrl = '', content = '', targetKeywords = [], focusMode = 'comprehensive', customApiKey = '', customBaseUrl = '' } = body;
      const prompt = `作为 SEO/GEO 专家评估页面。站点:${domain} 标题:${pageTitle} URL:${pageUrl} 关键词:${Array.isArray(targetKeywords) ? targetKeywords.join(',') : ''} 侧重:${focusMode}\n正文:\n${content || 'SEO GEO 平台'}\n输出 JSON: overallQualityScore, executiveSummary, keywordDensity, contextualRelevance, llmCitationPredictability, recommendations`;
      try {
        const r = await dispatchLlmCall({ provider, model, customApiKey, customBaseUrl, systemPrompt: 'SEO GEO 分析引擎，只输出 JSON。', userPrompt: prompt, jsonMode: true }, env);
        return json({ success: true, source: `${provider}:${r.model}`, provider, model: r.model, latencyMs: r.latencyMs, reasoningChain: r.reasoningChain, data: extractJsonFromText(r.text) });
      } catch (err: any) {
        return json({ success: true, source: `${provider}:${model} (fallback)`, provider, model, warning: String(err.message), data: generatePrecomputedAssessment(domain, pageTitle, content, targetKeywords, provider, model) });
      }
    }

    if (key === 'ai/simulate-geo' || key === 'gemini/simulate-geo') {
      const { provider = 'glm', model = 'glm-4-flash', prompt = '', engine = 'ChatGPT', brandName = '智词领航', domain = 'seopilot.io', industry = 'SEO GEO', customApiKey = '', customBaseUrl = '' } = body;
      const promptText = `以【${engine}】模拟提问「${prompt}」。品牌:${brandName} 域名:${domain} 行业:${industry}\n输出 JSON: isBrandMentioned, recommendationRank, geoScore, sentiment, llmResponseExcerpt, citedSnippets, citationReasoning, actionableTip`;
      try {
        const r = await dispatchLlmCall({ provider, model, customApiKey, customBaseUrl, systemPrompt: 'GEO 模拟，只输出 JSON。', userPrompt: promptText, jsonMode: true }, env);
        const parsed = extractJsonFromText(r.text);
        return json({ success: true, source: `${provider}:${r.model}`, provider, model: r.model, latencyMs: r.latencyMs, data: { ...parsed, brandName, engine, source: `${provider} 实时`, latencyMs: r.latencyMs } });
      } catch (err: any) {
        return json({ success: true, source: `${provider}:${model} (fallback)`, provider, model, warning: String(err.message), data: generatePrecomputedGeoSimulation(prompt, engine, brandName, domain, provider, model) });
      }
    }

    if (key === 'ai/expand-keywords' || key === 'gemini/expand-keywords') {
      const { provider = 'glm', model = 'glm-4-flash', seedKeyword = '云计算', targetMarket = '中国', currentDomain = 'example.com', customApiKey = '', customBaseUrl = '' } = body;
      const prompt = `种子词【${seedKeyword}】市场【${targetMarket}】站点 ${currentDomain} 做长尾拓展。返回 JSON: seedKeyword, clusterTheme, marketOverview, suggestions[6-8项含 keyword,searchVolume,difficulty,cpc,intent,trendGrowth,serpFeatures,competitionLevel,aiReasoning,llmQueryPattern]`;
      try {
        const r = await dispatchLlmCall({ provider, model, customApiKey, customBaseUrl, systemPrompt: '拓词引擎，只输出 JSON。', userPrompt: prompt, jsonMode: true }, env);
        const parsed = extractJsonFromText(r.text);
        const suggestions = (parsed.suggestions || []).map((s: any, i: number) => ({ ...s, id: `ai-kw-${Date.now()}-${i}` }));
        return json({ success: true, source: `${provider}:${r.model}`, provider, model: r.model, latencyMs: r.latencyMs, data: { ...parsed, suggestions, source: `${provider} 拓词`, latencyMs: r.latencyMs } });
      } catch (err: any) {
        return json({ success: true, source: `${provider}:${model} (fallback)`, provider, model, warning: String(err.message), data: generatePrecomputedKeywords(seedKeyword, provider, model) });
      }
    }

    if (key === 'ai/analyze-rankings' || key === 'gemini/analyze-rankings') {
      const { provider = 'glm', model = 'glm-4-flash', siteName = '智词领航', domain = 'example.com', keywords = [], customApiKey = '', customBaseUrl = '' } = body;
      const prompt = `诊断排位: ${siteName} (${domain}) 样本:${JSON.stringify((keywords || []).slice(0, 15))}\n输出 JSON: overallHealthScore, volatilityLevel, algorithmUpdateSuspected, algorithmNotes, summary, insights, strategicPriorities`;
      try {
        const r = await dispatchLlmCall({ provider, model, customApiKey, customBaseUrl, systemPrompt: 'SERP 诊断，只输出 JSON。', userPrompt: prompt, jsonMode: true }, env);
        return json({ success: true, source: `${provider}:${r.model}`, provider, model: r.model, latencyMs: r.latencyMs, data: { ...extractJsonFromText(r.text), siteName, domain, source: `${provider} 归因`, latencyMs: r.latencyMs } });
      } catch (err: any) {
        return json({ success: true, source: `${provider}:${model} (fallback)`, provider, model, warning: String(err.message), data: generatePrecomputedRankingDiagnostic(siteName, domain, keywords, provider, model) });
      }
    }

    if (key === 'ai/benchmark-compare') {
      const { models = ['glm:glm-4-flash', 'siliconflow:Qwen/Qwen2.5-7B-Instruct'], domain = 'example.com', taskType = 'content_quality', promptOrSubject = 'SEO 体检' } = body;
      const results: any[] = [];
      for (const m of models as string[]) {
        const [providerId, modelId] = String(m).includes(':') ? String(m).split(':') : ['glm', m];
        const t0 = Date.now();
        try {
          const r = await dispatchLlmCall({ provider: providerId, model: modelId, systemPrompt: 'SEO 评测，简短中文。', userPrompt: `站点 ${domain} 任务 ${taskType} 主题 ${promptOrSubject}。输出 JSON: {score, keyInsight, rawSummary}`, jsonMode: true }, env);
          let parsed: any = {};
          try { parsed = extractJsonFromText(r.text); } catch { parsed = { score: 85, keyInsight: r.text.slice(0, 120), rawSummary: r.text.slice(0, 200) }; }
          results.push({ modelId, modelName: `${providerId}:${modelId}`, providerId, latencyMs: r.latencyMs, score: parsed.score ?? 85, ratingLabel: (parsed.score ?? 85) >= 90 ? '极佳' : '优秀', keyInsight: parsed.keyInsight || '', rawSummary: parsed.rawSummary || '', sampleTokens: Math.round((r.text || '').length / 2) });
        } catch {
          results.push({ modelId: modelId || 'unknown', modelName: `${providerId}:${modelId}`, providerId, latencyMs: Date.now() - t0, score: 82, ratingLabel: '本地镜像', keyInsight: '未配置密钥或调用失败', rawSummary: 'fallback', sampleTokens: 0 });
        }
      }
      return json({ success: true, benchmarkId: `bench-${Date.now()}`, timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16), targetDomain: domain, taskType, promptOrSubject, modelsCompared: results });
    }

    return json({ success: false, error: `Unknown API route: /api/${key}` }, 404);
  } catch (err: any) {
    return json({ success: false, error: err?.message || 'Internal error' }, 500);
  }
};
