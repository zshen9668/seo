# SEO Pilot · 智词领航

企业级**多站点 SEO / GEO 矩阵中控台**。集中管理站点矩阵、SERP 排名雷达、自动化技术体检、关键词拓展，并接入多款大模型做内容质量与生成式引擎优化（GEO）分析。

> 前端 React + Vite；本地开发用 Express；生产可部署到 **Cloudflare Pages 免费额度**（静态资源 + Pages Functions）。支持**手机/电脑**登录（演示账号 + GitHub / Google OAuth）。

---

## 功能一览

| 模块 | 说明 |
|------|------|
| **登录** | 邮箱演示账号 · GitHub / Google OAuth · 会话约 7 天 |
| **关键词排位雷达** | 多搜索引擎排名跟踪、历史走势（Recharts） |
| **自动化全站体检** | 死链、性能、Meta、图片 Alt、移动端、收录等问题清单 |
| **关键词拓展挖掘** | 种子词拓词、意图分类、竞品差距 |
| **多站点矩阵中控** | 多站切换、健康分 / DR / 流量概览 |
| **GEO 中控** | 大模型引用率模拟、品牌采纳沙盒 |
| **AI 内容质量面板** | 关键词密度、语境权威度、LLM 引用预测、改造建议 |
| **多模型 API 中枢** | 智谱 / 硅基流动 / Gemini / Groq / DeepSeek / OpenAI / Claude / 通义 / Kimi 等 |

未配置任何 API Key 时，界面仍可用本地 Mock / fallback 数据演示。

---

## 技术栈

- **前端**：React 19、TypeScript、Vite 8、Tailwind CSS 4、Recharts、Lucide
- **本地服务**：Express 5 + `tsx`（`server.ts`）
- **生产边缘**：Cloudflare Pages Functions（`functions/`，纯 `fetch`）
- **数据**：前端 Mock + `localStorage`；AI 能力走服务端 `/api/ai/*`

---

## 快速开始（本地）

```bash
git clone https://github.com/zshen9668/seo.git
cd seo
npm install
cp .env.example .env
npm run dev
```

默认打开开发服务后进入登录页。演示账号：

```text
admin@seopilot.local
admin123
```

### 环境变量

完整列表见 [`.env.example`](./.env.example)。**至少配置一个免费层 Key 即可启用真实大模型调用**：

| 变量 | 说明 |
|------|------|
| `ZHIPU_API_KEY` | 智谱，**GLM-4-Flash 长期免费**（推荐） |
| `SILICONFLOW_API_KEY` | 硅基流动 |
| `GEMINI_API_KEY` | Google AI Studio |
| `GROQ_API_KEY` | Groq 免费层 |
| `APP_URL` | 站点对外 URL（OAuth 必填） |
| `GITHUB_*` / `GOOGLE_*` | OAuth Client（可选） |
| `AUTH_DEMO_*` | 演示邮箱密码（生产请修改） |

> **切勿将真实 Key 写入代码或提交到 Git。** Cloudflare 在控制台 Environment variables 中配置。

---

## 部署到 Cloudflare Pages（免费额度）

详细步骤与**环境变量清单**见 **[DEPLOY-CF.md](./DEPLOY-CF.md)**。

### 控制台方式

1. Workers & Pages → 连接本 GitHub 仓库  
2. Build command: `npm run build` · Output: `dist`  
3. Settings → Environment variables 添加 Key（见下表）  
4. Deploy  

### CLI 方式

```bash
npm install
npm run pages:deploy          # 需先 wrangler login
# 写入密钥示例：
npx wrangler pages secret put ZHIPU_API_KEY --project-name=seo-pilot
npx wrangler pages secret put APP_URL --project-name=seo-pilot
```

本地模拟边缘环境：

```bash
cp .dev.vars.example .dev.vars
npm run pages:dev             # http://localhost:8788
```

### 生产环境变量（摘要）

| 类别 | 变量 |
|------|------|
| 登录 | `APP_URL`, `AUTH_DEMO_EMAIL`, `AUTH_DEMO_PASSWORD` |
| OAuth | `GITHUB_CLIENT_ID/SECRET`, `GOOGLE_CLIENT_ID/SECRET` |
| 免费 LLM | `ZHIPU_API_KEY`, `SILICONFLOW_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY` |

OAuth 回调：

```text
{APP_URL}/api/auth/oauth/callback/github
{APP_URL}/api/auth/oauth/callback/google
```

---

## 大模型默认策略

**选用顺序**：已配置的 智谱 → 硅基流动 → Gemini → Groq；均未配置则 fallback 演示数据。

| Provider | 默认模型 | 备注 |
|----------|----------|------|
| `glm` | `glm-4-flash` | 免费优先 |
| `siliconflow` | `Qwen/Qwen2.5-7B-Instruct` | 免费 / 赠额 |
| `gemini` | `gemini-2.0-flash` | AI Studio |
| `groq` | `llama-3.3-70b-versatile` | 限速 |

---

## 主要 API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 邮箱登录 |
| GET | `/api/auth/providers` | 登录方式是否启用 |
| GET | `/api/auth/oauth/github` | GitHub OAuth |
| GET | `/api/auth/oauth/google` | Google OAuth |
| GET | `/api/ai/providers` | LLM 列表 |
| POST | `/api/ai/analyze-content` 等 | 分析 / GEO / 拓词 / 排位 / 对比 |

---

## 目录结构

```text
.
├── functions/                 # Cloudflare Pages Functions
│   ├── _shared/auth.ts        # 登录 + OAuth
│   ├── _shared/llm.ts
│   └── api/[[path]].ts
├── public/_redirects          # SPA 回退
├── public/_headers            # 安全 / 缓存头
├── wrangler.toml              # Pages 项目配置
├── src/
│   ├── components/LoginPage.tsx
│   ├── hooks/useAuth.ts
│   └── ...
├── server.ts                  # 本地 Express
├── .env.example
├── .dev.vars.example
├── DEPLOY-CF.md
└── README.md
```

---

## 脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 本地 Express + Vite |
| `npm run build` | 构建到 `dist/` |
| `npm run pages:dev` | 本地 Pages + Functions |
| `npm run pages:deploy` | 部署到 CF Pages 项目 `seo-pilot` |
| `npm run lint` | TypeScript 检查 |

---

## 注意事项

1. 密钥只放在 `.env` / `.dev.vars` 或 Cloudflare 环境变量中。  
2. 本地开发走 `server.ts`；CF 生产走 `functions/`（路径对齐）。  
3. 生产请修改默认演示密码；启用 OAuth 时务必设置 `APP_URL`。  
4. 未配置 LLM Key 时仍可完整演示界面。  
