/**
 * Cloudflare Pages catch-all for /api/*
 * Avoid importing @cloudflare/workers-types (not in package.json).
 */
import {
  buildProvidersList,
  clipText,
  dispatchLlmCall,
  extractJsonFromText,
  generatePrecomputedAssessment,
  generatePrecomputedGeoSimulation,
  generatePrecomputedKeywords,
  generatePrecomputedRankingDiagnostic,
  resolveDefaultProvider,
  type EnvKeys,
} from '../_shared/llm';

type PagesContext = {
  request: Request;
  env: EnvKeys;
  params: Record<string, string | string[]>;
  waitUntil: (p: Promise<unknown>) => void;
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
  data: Record<string, unknown>;
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': 'no-store',
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

async function bodyOf(request: Request): Promise<Record<string, any>> {
  try {
    const data = await request.json();
    return data && typeof data === 'object' ? (data as Record<string, any>) : {};
  } catch {
    return {};
  }
}

function routeKey(pathname: string): string {
  const p = pathname.replace(/\/+$/, '') || '/';
  return p.startsWith('/api/') ? p.slice(5) : p.replace(/^\//, '');
}

function pickProviderModel(body: Record<string, any>, env: EnvKeys) {
  const d = resolveDefaultProvider(env);
  return {
    provider: String(body.provider || d.provider),
    model: String(body.model || d.model),
    customApiKey: typeof body.customApiKey === 'string' ? body.customApiKey : '',
    customBaseUrl: typeof body.customBaseUrl === 'string' ? body.customBaseUrl : '',
  };
}

function safeParseModelJson(text: string): any {
  try {
    return extractJsonFromText(text);
  } catch {
    return null;
  }
}

export const onRequest = async (context: PagesContext): Promise<Response> => {
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
      const hasKey = Boolean(
        env.GEMINI_API_KEY || env.ZHIPU_API_KEY || env.SILICONFLOW_API_KEY || env.GROQ_API_KEY,
      );
      return json({
        status: hasKey ? 'online' : 'simulated',
        model: 'multi-llm-hub',
        apiVersion: 'pages-functions / multi-llm 2026',
        hasKey,
        pingMs: 12,
        lastChecked: new Date().toISOString().replace('T', ' ').substring(0, 19),
        defaults: resolveDefaultProvider(env),
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

    if (method !== 'POST') {
      return json({ success: false, error: `Unsupported ${method} ${key}` }, 405);
    }

    const body = await bodyOf(request);

    if (key === 'ai/probe-provider') {
      const { provider, model, customApiKey, customBaseUrl } = pickProviderModel(body, env);
      const t0 = Date.now();
      try {
        const r = await dispatchLlmCall(
          {
            provider,
            model,
            customApiKey,
            customBaseUrl,
            systemPrompt: 'API health probe.',
            userPrompt: 'Reply with exactly: OK',
            jsonMode: false,
          },
          env,
        );
        return json({
          success: true,
          provider,
          model: r.model,
          status: 'online',
          latencyMs: r.latencyMs,
          message: `已连接 ${provider.toUpperCase()} (${r.model})`,
        });
      } catch (err: any) {
        return json({
          success: true,
          provider,
          model: model || 'default',
          status: 'simulated',
          latencyMs: Math.max(35, Date.now() - t0),
          message: `探针: ${err?.message || '未配置凭据'}`,
        });
      }
    }

    if (key === 'ai/analyze-content' || key === 'gemini/analyze-content') {
      const { provider, model, customApiKey, customBaseUrl } = pickProviderModel(body, env);
      const domain = String(body.domain || 'example.com');
      const pageTitle = String(body.pageTitle || '');
      const pageUrl = String(body.pageUrl || '');
      const content = clipText(String(body.content || ''), 12000);
      const targetKeywords = Array.isArray(body.targetKeywords) ? body.targetKeywords : [];
      const focusMode = String(body.focusMode || 'comprehensive');

      const prompt = `作为 SEO/GEO 专家评估页面。站点:${domain} 标题:${pageTitle} URL:${pageUrl} 关键词:${targetKeywords.join(',')} 侧重:${focusMode}
正文:
${content || 'SEO GEO 平台'}
输出纯 JSON: overallQualityScore, executiveSummary, keywordDensity, contextualRelevance, llmCitationPredictability, recommendations`;

      try {
        const r = await dispatchLlmCall(
          {
            provider,
            model,
            customApiKey,
            customBaseUrl,
            systemPrompt: 'SEO GEO 分析引擎，只输出有效 JSON，不要 Markdown。',
            userPrompt: prompt,
            jsonMode: true,
          },
          env,
        );
        const parsed = safeParseModelJson(r.text);
        if (!parsed) throw new Error('JSON 解析失败');
        return json({
          success: true,
          source: `${provider}:${r.model}`,
          provider,
          model: r.model,
          latencyMs: r.latencyMs,
          reasoningChain: r.reasoningChain,
          data: parsed,
        });
      } catch (err: any) {
        return json({
          success: true,
          source: `${provider}:${model} (fallback)`,
          provider,
          model,
          warning: String(err?.message || err),
          data: generatePrecomputedAssessment(domain, pageTitle, content, targetKeywords, provider, model),
        });
      }
    }

    if (key === 'ai/simulate-geo' || key === 'gemini/simulate-geo') {
      const { provider, model, customApiKey, customBaseUrl } = pickProviderModel(body, env);
      const prompt = String(body.prompt || '');
      const engine = String(body.engine || 'ChatGPT');
      const brandName = String(body.brandName || '智词领航');
      const domain = String(body.domain || 'seopilot.io');
      const industry = String(body.industry || 'SEO GEO');

      const promptText = `以【${engine}】模拟提问「${clipText(prompt, 2000)}」。品牌:${brandName} 域名:${domain} 行业:${industry}
输出纯 JSON: isBrandMentioned, recommendationRank, geoScore, sentiment, llmResponseExcerpt, citedSnippets, citationReasoning, actionableTip`;

      try {
        const r = await dispatchLlmCall(
          {
            provider,
            model,
            customApiKey,
            customBaseUrl,
            systemPrompt: 'GEO 模拟，只输出有效 JSON。',
            userPrompt: promptText,
            jsonMode: true,
          },
          env,
        );
        const parsed = safeParseModelJson(r.text);
        if (!parsed) throw new Error('JSON 解析失败');
        return json({
          success: true,
          source: `${provider}:${r.model}`,
          provider,
          model: r.model,
          latencyMs: r.latencyMs,
          data: {
            ...parsed,
            brandName,
            engine,
            source: `${provider} 实时`,
            latencyMs: r.latencyMs,
          },
        });
      } catch (err: any) {
        return json({
          success: true,
          source: `${provider}:${model} (fallback)`,
          provider,
          model,
          warning: String(err?.message || err),
          data: generatePrecomputedGeoSimulation(prompt, engine, brandName, domain, provider, model),
        });
      }
    }

    if (key === 'ai/expand-keywords' || key === 'gemini/expand-keywords') {
      const { provider, model, customApiKey, customBaseUrl } = pickProviderModel(body, env);
      const seedKeyword = String(body.seedKeyword || '云计算');
      const targetMarket = String(body.targetMarket || '中国');
      const currentDomain = String(body.currentDomain || 'example.com');

      const prompt = `种子词【${seedKeyword}】市场【${targetMarket}】站点 ${currentDomain} 做长尾拓展。返回纯 JSON: seedKeyword, clusterTheme, marketOverview, suggestions（6-8项，含 keyword,searchVolume,difficulty,cpc,intent,trendGrowth,serpFeatures,competitionLevel,aiReasoning,llmQueryPattern）`;

      try {
        const r = await dispatchLlmCall(
          {
            provider,
            model,
            customApiKey,
            customBaseUrl,
            systemPrompt: '拓词引擎，只输出有效 JSON。',
            userPrompt: prompt,
            jsonMode: true,
          },
          env,
        );
        const parsed = safeParseModelJson(r.text);
        if (!parsed) throw new Error('JSON 解析失败');
        const suggestions = (parsed.suggestions || []).map((s: any, i: number) => ({
          ...s,
          id: s.id || `ai-kw-${Date.now()}-${i}`,
        }));
        return json({
          success: true,
          source: `${provider}:${r.model}`,
          provider,
          model: r.model,
          latencyMs: r.latencyMs,
          data: {
            ...parsed,
            suggestions,
            source: `${provider} 拓词`,
            latencyMs: r.latencyMs,
          },
        });
      } catch (err: any) {
        return json({
          success: true,
          source: `${provider}:${model} (fallback)`,
          provider,
          model,
          warning: String(err?.message || err),
          data: generatePrecomputedKeywords(seedKeyword, provider, model),
        });
      }
    }

    if (key === 'ai/analyze-rankings' || key === 'gemini/analyze-rankings') {
      const { provider, model, customApiKey, customBaseUrl } = pickProviderModel(body, env);
      const siteName = String(body.siteName || '智词领航');
      const domain = String(body.domain || 'example.com');
      const keywords = Array.isArray(body.keywords) ? body.keywords.slice(0, 15) : [];

      const prompt = `诊断排位: ${siteName} (${domain}) 样本:${JSON.stringify(keywords)}
输出纯 JSON: overallHealthScore, volatilityLevel, algorithmUpdateSuspected, algorithmNotes, summary, insights, strategicPriorities`;

      try {
        const r = await dispatchLlmCall(
          {
            provider,
            model,
            customApiKey,
            customBaseUrl,
            systemPrompt: 'SERP 诊断，只输出有效 JSON。',
            userPrompt: prompt,
            jsonMode: true,
          },
          env,
        );
        const parsed = safeParseModelJson(r.text);
        if (!parsed) throw new Error('JSON 解析失败');
        return json({
          success: true,
          source: `${provider}:${r.model}`,
          provider,
          model: r.model,
          latencyMs: r.latencyMs,
          data: {
            ...parsed,
            siteName,
            domain,
            source: `${provider} 归因`,
            latencyMs: r.latencyMs,
          },
        });
      } catch (err: any) {
        return json({
          success: true,
          source: `${provider}:${model} (fallback)`,
          provider,
          model,
          warning: String(err?.message || err),
          data: generatePrecomputedRankingDiagnostic(siteName, domain, keywords, provider, model),
        });
      }
    }

    if (key === 'ai/benchmark-compare') {
      const models: string[] = Array.isArray(body.models)
        ? body.models.slice(0, 4)
        : ['glm:glm-4-flash', 'siliconflow:Qwen/Qwen2.5-7B-Instruct'];
      const domain = String(body.domain || 'example.com');
      const taskType = String(body.taskType || 'content_quality');
      const promptOrSubject = String(body.promptOrSubject || 'SEO 体检');

      const results = await Promise.all(
        models.map(async (m) => {
          const raw = String(m);
          const [providerId, ...rest] = raw.includes(':') ? raw.split(':') : ['glm', raw];
          const modelId = rest.join(':') || 'glm-4-flash';
          const t0 = Date.now();
          try {
            const r = await dispatchLlmCall(
              {
                provider: providerId,
                model: modelId,
                systemPrompt: 'SEO 评测，简短中文，只输出 JSON。',
                userPrompt: `站点 ${domain} 任务 ${taskType} 主题 ${promptOrSubject}。输出 JSON: {score, keyInsight, rawSummary}`,
                jsonMode: true,
              },
              env,
            );
            const parsed = safeParseModelJson(r.text) || {
              score: 85,
              keyInsight: (r.text || '').slice(0, 120),
              rawSummary: (r.text || '').slice(0, 200),
            };
            return {
              modelId,
              modelName: `${providerId}:${modelId}`,
              providerId,
              latencyMs: r.latencyMs,
              score: parsed.score ?? 85,
              ratingLabel: (parsed.score ?? 85) >= 90 ? '极佳' : '优秀',
              keyInsight: parsed.keyInsight || '',
              rawSummary: parsed.rawSummary || '',
              sampleTokens: Math.round((r.text || '').length / 2),
            };
          } catch {
            return {
              modelId,
              modelName: `${providerId}:${modelId}`,
              providerId,
              latencyMs: Date.now() - t0,
              score: 82,
              ratingLabel: '本地镜像',
              keyInsight: '未配置密钥或调用失败',
              rawSummary: 'fallback',
              sampleTokens: 0,
            };
          }
        }),
      );

      return json({
        success: true,
        benchmarkId: `bench-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        targetDomain: domain,
        taskType,
        promptOrSubject,
        modelsCompared: results,
      });
    }

    return json({ success: false, error: `Unknown API route: /api/${key}` }, 404);
  } catch (err: any) {
    return json({ success: false, error: err?.message || 'Internal error' }, 500);
  }
};
