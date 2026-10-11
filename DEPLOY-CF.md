# Cloudflare Pages 免费部署指南

本项目支持 **Cloudflare Pages + Pages Functions** 免费额度：

- 静态站点流量：免费档基本够用  
- Functions：约 **10 万次请求/天**（Workers 免费档共享）  
- 无需 Node 服务器，`functions/` 在边缘运行  

---

## 1. 控制台连接 GitHub（推荐）

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → Connect to Git  
2. 选择仓库 `zshen9668/seo`（或你的 fork）  
3. 构建配置：

| 配置项 | 值 |
|--------|-----|
| Framework preset | Vite 或 None |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` |
| Node version | `20` 或 `22`（Environment variables 里可设 `NODE_VERSION=22`） |

4. **Save and Deploy**。首次可先不配 Key，用演示数据验证站点。

---

## 2. 环境变量一览（必读）

路径：**Pages 项目 → Settings → Environment variables**  
建议 **Production** 与 **Preview** 都配置。  
密钥类请勾选 **Encrypt**（Secret）。

### 2.1 站点与登录

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `APP_URL` | OAuth 时必填 | 对外完整地址，如 `https://seo-pilot.pages.dev`（无末尾 `/`） |
| `AUTH_DEMO_EMAIL` | 否 | 默认 `admin@seopilot.local` |
| `AUTH_DEMO_PASSWORD` | 否 | 默认 `admin123`，**生产务必修改** |
| `GITHUB_CLIENT_ID` | OAuth 选配 | GitHub OAuth App Client ID |
| `GITHUB_CLIENT_SECRET` | OAuth 选配 | GitHub Client Secret |
| `GOOGLE_CLIENT_ID` | OAuth 选配 | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | OAuth 选配 | Google Client Secret |

**OAuth 回调地址（在第三方控制台填写）：**

```text
{APP_URL}/api/auth/oauth/callback/github
{APP_URL}/api/auth/oauth/callback/google
```

### 2.2 大模型（免费层优先，至少配一个）

| 变量名 | 说明 |
|--------|------|
| `ZHIPU_API_KEY` | 智谱，**GLM-4-Flash 长期免费**（推荐） |
| `SILICONFLOW_API_KEY` | 硅基流动，小模型永久免费 |
| `GEMINI_API_KEY` | Google AI Studio 免费档 |
| `GROQ_API_KEY` | Groq 永久免费层（有速率限制） |

### 2.3 可选付费 / 其它

| 变量名 | 说明 |
|--------|------|
| `DEEPSEEK_API_KEY` / `DEEPSEEK_BASE_URL` | DeepSeek 官方 |
| `OPENAI_API_KEY` / `OPENAI_BASE_URL` | OpenAI |
| `ANTHROPIC_API_KEY` | Claude |
| `DASHSCOPE_API_KEY` | 通义千问 |
| `MOONSHOT_API_KEY` | Kimi |
| `CUSTOM_LLM_BASE_URL` / `CUSTOM_LLM_API_KEY` | 自定义 OpenAI 兼容端点 |

默认模型优先级：智谱 Flash → 硅基流动 → Gemini → Groq → DeepSeek。

未配置任何 LLM Key 时，API 仍返回 **fallback 模拟数据**，页面可正常演示。

---

## 3. 用 Wrangler CLI 配置密钥

```bash
npm install
npm run build

# 登录 Cloudflare
npx wrangler login

# 部署（项目名与 wrangler.toml 中 name 一致）
npm run pages:deploy

# 写入密钥（按需）
npx wrangler pages secret put ZHIPU_API_KEY --project-name=seo-pilot
npx wrangler pages secret put SILICONFLOW_API_KEY --project-name=seo-pilot
npx wrangler pages secret put APP_URL --project-name=seo-pilot
npx wrangler pages secret put AUTH_DEMO_PASSWORD --project-name=seo-pilot
npx wrangler pages secret put GITHUB_CLIENT_ID --project-name=seo-pilot
npx wrangler pages secret put GITHUB_CLIENT_SECRET --project-name=seo-pilot
```

本地模拟边缘 Functions：

```bash
cp .dev.vars.example .dev.vars   # 填入本地密钥
npm run build
npm run pages:dev                # 默认 http://localhost:8788
```

---

## 4. 免费厂商申请

1. **智谱**：https://open.bigmodel.cn → API Key → 模型 `glm-4-flash`  
2. **硅基流动**：https://cloud.siliconflow.cn  
3. **Gemini**：https://aistudio.google.com  
4. **Groq**：https://console.groq.com  

---

## 5. 目录与路由

```text
functions/
  _shared/auth.ts      # 登录 + OAuth
  _shared/llm.ts       # 多大模型（纯 fetch）
  api/[[path]].ts      # /api/* 统一入口
public/_redirects      # SPA 回退（Functions 优先匹配 /api）
wrangler.toml          # Pages 项目名与输出目录
```

主要 API：

| 路径 | 说明 |
|------|------|
| `POST /api/auth/login` | 邮箱登录 |
| `GET  /api/auth/providers` | 已启用的登录方式 |
| `GET  /api/auth/oauth/github` | GitHub OAuth 跳转 |
| `GET  /api/auth/oauth/google` | Google OAuth 跳转 |
| `GET  /api/ai/providers` | LLM 提供商列表 |
| `POST /api/ai/*` | 内容分析 / GEO / 拓词 / 排位等 |

---

## 6. 注意

- **不要**把 API Key、OAuth Secret 提交进 Git  
- `.env`、`.dev.vars` 已在 `.gitignore`  
- 生产请修改 `AUTH_DEMO_PASSWORD`  
- OAuth 必须配置正确的 `APP_URL` 与第三方回调 URL  
- `_redirects` 的 `/* → index.html` 不会覆盖已匹配的 Pages Functions  
