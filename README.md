# SEO Pilot · 智词领航

企业级**多站点 SEO / GEO 矩阵中控台**。集中管理站点矩阵、SERP 排名雷达、自动化技术体检、关键词拓展，并接入多款大模型做内容质量与生成式引擎优化（GEO）分析。

> 前端 React + Vite；本地开发用 Express；生产可部署到 **Cloudflare Pages 免费额度**（静态资源 + Pages Functions）。

---

## 功能一览

| 模块 | 说明 |
|------|------|
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
- **生产边缘**：Cloudflare Pages Functions（`functions/`，纯 `fetch`，无 Node 长驻进程）
- **数据**：前端 Mock + `localStorage`；AI 能力走服务端 `/api/ai/*`

---

## 快速开始（本地）

```bash
# 克隆
git clone https://github.com/zshen9668/seo.git
cd seo

# 安装依赖（npm / bun / pnpm 均可）
npm install

# 环境变量（密钥由你自己填写，不要提交 .env）
cp .env.example .env

# 开发（Express + Vite 中间件，默认 http://0.0.0.0:3000）
npm run dev

# 仅类型检查
npm run lint

# 生产构建前端静态资源 → dist/
npm run build
```

### 环境变量

完整列表见 [`.env.example`](./.env.example)。**至少配置一个免费层 Key 即可启用真实大模型调用**：

| 变量 | 说明 |
|------|------|
| `ZHIPU_API_KEY` | 智谱，**GLM-4-Flash 长期免费**（推荐） |
| `SILICONFLOW_API_KEY` | 硅基流动，小模型永久免费 + 新用户额度 |
| `GEMINI_API_KEY` | Google AI Studio 免费档 |
| `GROQ_API_KEY` | Groq 永久免费层（有速率限制） |
| `DEEPSEEK_API_KEY` 等 | 可选按量厂商，见 `.env.example` |
| `CUSTOM_LLM_BASE_URL` / `CUSTOM_LLM_API_KEY` | Ollama、OpenRouter 等 OpenAI 兼容端点 |

> **切勿将真实 Key 写入代码或提交到 Git。** Cloudflare 部署时在控制台「Environment variables」中配置即可。

---

## 部署到 Cloudflare Pages（免费额度）

详细步骤见 **[DEPLOY-CF.md](./DEPLOY-CF.md)**。摘要：

1. Cloudflare Dashboard → **Workers & Pages** → 连接本 GitHub 仓库  
2. 构建配置：

   | 配置项 | 值 |
   |--------|-----|
   | Build command | `npm run build` |
   | Build output directory | `dist` |

3. 在 **Settings → Environment variables** 自行添加你的 Key（如 `ZHIPU_API_KEY`）  
4. 保存并部署  

- 静态资源：无限流量  
- Functions：共享 Workers 免费档（约 10 万请求/天）  
- SPA 回退：`public/_redirects`  

边缘 API 实现：

```text
functions/
  _shared/llm.ts      # 多大模型分发（fetch）
  api/[[path]].ts     # /api/* 统一路由
```

与本地 Express 的 `/api/ai/*`、`/api/gemini/*` 路径兼容。

---

## 大模型与默认策略

| Provider ID | 厂商 | 典型默认模型 | 备注 |
|-------------|------|--------------|------|
| `glm` | 智谱 | `glm-4-flash` | 免费层优先 |
| `siliconflow` | 硅基流动 | `Qwen/Qwen2.5-7B-Instruct` | 免费 / 赠额 |
| `gemini` | Google | `gemini-2.0-flash` | AI Studio 免费档 |
| `groq` | Groq | `llama-3.3-70b-versatile` | 免费层限速 |
| `deepseek` | DeepSeek | `deepseek-chat` | 按量 |
| `openai` | OpenAI | `gpt-4o-mini` | 按量 |
| `claude` | Anthropic | `claude-3-5-haiku-latest` | 按量 |
| `qwen` | 通义千问 | `qwen-plus` | DashScope |
| `kimi` | Moonshot | `moonshot-v1-8k` | 按量 |
| `custom` | 自定义 | — | OpenAI 兼容 |

**默认选用顺序（边缘 Functions）**：已配置的 智谱 → 硅基流动 → Gemini → Groq；均未配置则使用本地 fallback。

申请入口（自行注册）：

- 智谱：https://open.bigmodel.cn  
- 硅基流动：https://cloud.siliconflow.cn  
- Gemini：https://aistudio.google.com  
- Groq：https://console.groq.com  

---

## 主要 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/ai/providers` | 服务商与模型列表、连接状态 |
| POST | `/api/ai/probe-provider` | 探测某厂商是否可用 |
| POST | `/api/ai/analyze-content` | 页面内容质量 / GEO 评估 |
| POST | `/api/ai/simulate-geo` | 大模型品牌采纳模拟 |
| POST | `/api/ai/expand-keywords` | 语义拓词 |
| POST | `/api/ai/analyze-rankings` | 排位异动诊断 |
| POST | `/api/ai/benchmark-compare` | 多模型横向对比 |
| GET | `/api/gemini/status` | 兼容状态探针 |

部分路径另有 `/api/gemini/*` 别名，便于旧前端调用。

---

## 目录结构

```text
.
├── functions/                 # Cloudflare Pages Functions（生产 AI API）
│   ├── _shared/llm.ts
│   └── api/[[path]].ts
├── public/_redirects          # SPA 回退（CF Pages）
├── src/
│   ├── App.tsx                # 主布局与状态
│   ├── components/            # 各业务视图与弹窗
│   ├── data/mockData.ts       # 演示数据
│   ├── types/seo.ts           # 类型定义
│   └── utils/
├── server.ts                  # 本地 Express（开发 / 自建 Node 部署）
├── index.html
├── package.json
├── vite.config.ts
├── .env.example
├── DEPLOY-CF.md
└── README.md
```

---

## 脚本说明

| 命令 | 说明 |
|------|------|
| `npm run dev` | 本地开发（Express + Vite middleware） |
| `npm run build` | 构建前端到 `dist/`（CF / 静态托管用） |
| `npm run start` | 生产模式启动 Express（需先 `build`，并设置 `NODE_ENV=production`） |
| `npm run preview` | Vite 预览静态构建 |
| `npm run lint` | TypeScript 检查 |

---

## 注意事项

1. **密钥**：只放在本地 `.env` 或 Cloudflare 环境变量中，不要提交仓库。  
2. **双运行时**：本地开发走 `server.ts`；CF 生产走 `functions/`。API 路径对齐，密钥变量名一致。  
3. **无 Key 演示**：所有 AI 接口失败时会返回高保真本地结果，便于纯前端体验。  
4. **费用**：CF 静态与 Functions 免费档通常够个人使用；大模型费用以各厂商账单为准（优先用免费层即可）。  

---

## License

Private / 按仓库设置。若需开源许可，请自行补充 `LICENSE` 文件。
