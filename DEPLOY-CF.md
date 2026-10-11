# Cloudflare Pages 免费部署指南

本项目已支持 **Cloudflare Pages + Pages Functions** 免费额度部署（静态资源无限流量，Functions 共享 Workers 免费档约 10 万请求/天）。

## 1. 构建配置（CF 控制台）

| 配置项 | 值 |
|--------|-----|
| Framework preset | None 或 Vite |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` |

连接 GitHub 仓库后按上表填写即可。

## 2. 环境变量（Settings → Environment variables）

**免费层优先配置（至少配一个）：**

| 变量名 | 说明 |
|--------|------|
| `ZHIPU_API_KEY` | 智谱开放平台，**GLM-4-Flash 长期免费**（强烈推荐） |
| `SILICONFLOW_API_KEY` | 硅基流动，小模型永久免费 + 新用户额度 |
| `GEMINI_API_KEY` | Google AI Studio 免费档 |
| `GROQ_API_KEY` | Groq 永久免费层（有速率限制） |

可选：`DEEPSEEK_API_KEY`、`OPENAI_API_KEY`、`ANTHROPIC_API_KEY`、`DASHSCOPE_API_KEY`、`MOONSHOT_API_KEY`、`CUSTOM_LLM_BASE_URL` / `CUSTOM_LLM_API_KEY`。

Production 与 Preview 建议都配置。

## 3. 免费厂商申请入口

1. **智谱**：https://open.bigmodel.cn → API Key → `glm-4-flash`
2. **硅基流动**：https://cloud.siliconflow.cn → `SILICONFLOW_API_KEY`
3. **Gemini**：https://aistudio.google.com
4. **Groq**：https://console.groq.com

系统会自动把默认模型优先设为已配置的免费层（智谱 Flash → 硅基流动 → Gemini → Groq）。

## 4. 本地开发

```bash
npm install
cp .env.example .env
npm run dev
```

CF 边缘逻辑在 `functions/`，API 路径与本地 Express 一致（`/api/ai/*`）。

## 5. 目录说明

```
functions/
  _shared/llm.ts       # 多大模型路由（纯 fetch，Workers 兼容）
  api/[[path]].ts      # /api/* 统一入口
public/_redirects      # SPA 路由回退
```

## 6. 注意事项

- 不要把 API Key 提交进 Git
- 未配置任何 Key 时接口会走本地 fallback，页面仍可演示
