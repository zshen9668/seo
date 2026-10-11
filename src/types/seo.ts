export interface Website {
  id: string;
  name: string;
  domain: string;
  category: 'SaaS云平台' | '跨境电商' | '技术博客/资讯' | '企业官网门户' | '垂直矩阵站';
  status: 'healthy' | 'warning' | 'critical';
  healthScore: number;
  domainRating: number; // 0-100 DR
  monthlyOrganicVisits: number;
  monthlyVisitsGrowth: number;
  totalTrackedKeywords: number;
  top3Keywords: number;
  top10Keywords: number;
  totalIndexedPages: number;
  lastAuditDate: string;
  scheduledAuditFrequency: 'daily' | 'weekly' | 'monthly';
  competitors: string[];
}

export interface HistoricalRankPoint {
  date: string;
  [keywordId: string]: number | string; // rank number (1-100)
}

export interface TrackedKeyword {
  id: string;
  siteId: string;
  keyword: string;
  searchEngine: 'Google' | 'Bing' | 'Baidu';
  currentRank: number; // 1-100
  previousRank: number;
  rankChange: number; // positive = rose (improved rank)
  searchVolume: number;
  difficulty: number; // 0-100 KD
  cpc: number;
  intent: '商业调研' | '交易购买' | '信息查询' | '品牌导航';
  serpFeatures: string[];
  targetUrl: string;
  updatedAt: string;
  history: { date: string; rank: number }[];
}

export type AuditPriority = '严重' | '高危' | '中度' | '低危';
export type AuditCategory =
  | '死链与404'
  | '页面速度与性能'
  | 'Meta与内容规范'
  | '图片与Alt优化'
  | '移动端与自适应'
  | '收录与技术架构';

export interface AuditIssue {
  id: string;
  title: string;
  category: AuditCategory;
  priority: AuditPriority;
  impactScore: number; // 1-100
  effort: '快速修复' | '中度工程' | '复杂架构';
  affectedUrlsCount: number;
  sampleUrls: string[];
  description: string;
  recommendation: string;
  codeSnippet?: string;
  isResolved: boolean;
  resolvedAt?: string; // 修复时间 e.g. '2026-08-28'
  resolvedDaysAgo?: number; // 距今修复已过去的天数
  isArchived?: boolean; // 是否已移入离线存档
  archivedAt?: string; // 归档时间
}

export interface AutoArchiveConfig {
  enabled: boolean;
  daysThreshold: number; // 默认 30 天
  frequency: 'realtime' | 'daily' | 'weekly';
  autoCompressHistory: boolean;
}

export interface AuditReportData {
  id: string;
  siteId: string;
  scannedUrl: string;
  scanDate: string;
  overallScore: number;
  previousScore: number;
  totalPagesScanned: number;
  passedChecksCount: number;
  issuesCount: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  categoryScores: {
    brokenLinks: number;
    pageSpeed: number;
    metaTags: number;
    imageOptimization: number;
    mobileFriendliness: number;
    indexing: number;
  };
  metrics: {
    avgLoadTimeSeconds: number;
    lcpSeconds: number;
    clsScore: number;
    brokenLinksFound: number;
    missingMetaDescPages: number;
    missingAltImages: number;
    mobileFriendlyScore: number;
  };
  issues: AuditIssue[];
}

export interface KeywordSuggestion {
  id: string;
  keyword: string;
  searchVolume: number;
  difficulty: number; // 0-100
  cpc: number;
  intent: '商业调研' | '交易购买' | '信息查询' | '品牌导航';
  trendGrowth: number; // % change
  serpFeatures: string[];
  competitionLevel: '低' | '中' | '高';
}

export interface CompetitorKeywordOverlap {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  cpc: number;
  ourRank: number | null; // null if unranked
  competitorRank: number;
  competitorDomain: string;
  gapOpportunity: '重大差距' | '势均力敌' | '我方领先' | '快速突破';
}

export interface CompetitorProfile {
  domain: string;
  domainRating: number;
  estimatedVisits: number;
  organicKeywords: number;
  overlapKeywordsCount: number;
  missedOpportunitiesCount: number;
}

// ================= GEO 中控功能核心数据结构 =================
export interface AiEngineMetric {
  engine: 'ChatGPT' | 'Perplexity' | 'Google Gemini' | 'Claude' | '百度文心AI';
  citationRate: number; // 引用推荐率 %
  mentionCount: number; // 月度被引用/推荐次数
  sentimentScore: number; // 正面好评率 %
  topCitedUrls: string[];
  status: 'highly_recommended' | 'moderate' | 'needs_boost';
  marketShare: string;
}

export interface AiBotStatus {
  botName: string;
  company: string;
  userAgent: string;
  isAllowed: boolean;
  crawlsLast24h: number;
  lastCrawledAt: string;
  impactNote: string;
  policy: 'allow' | 'disallow' | 'conditional';
}

export interface GeoRegionRanking {
  regionCode: string; // US, CN, UK, DE, JP, SG
  regionName: string; // 美国, 中国, 英国, 德国, 日本, 新加坡
  flagEmoji: string;
  rank: number;
  searchEngine: string;
  searchVolume: number;
  serpFeatures: string[];
  latencyMs: number;
  marketTrafficShare: number; // %
}

export interface GeoKeywordItem {
  id: string;
  keyword: string;
  category: string;
  regionalRanks: GeoRegionRanking[];
}

export interface PromptSimulationTest {
  id: string;
  userPrompt: string;
  engine: string;
  isBrandMentioned: boolean;
  recommendationRank: number | null; // e.g. #1
  citedSnippets: string[];
  geoScore: number; // 0-100 GEO指数
  actionableTip: string;
  testTime: string;
}

export interface HreflangCheckItem {
  id: string;
  url: string;
  targetLang: string;
  region: string;
  hasSelfRef: boolean;
  hasReturnTag: boolean;
  status: 'pass' | 'warning' | 'error';
  issueDesc?: string;
}

export interface EdgePopNode {
  city: string;
  country: string;
  latencyMs: number;
  ttfbMs: number;
  status: 'optimal' | 'warning' | 'degraded';
  cdnProvider: string;
}

// ================= AI驱动内容质量分析 (Gemini API 增强) =================
export interface AiKeywordDensityItem {
  keyword: string;
  frequency: number;
  densityPercentage: number;
  status: '适中' | '偏低' | '偏高';
  suggestion: string;
}

export interface AiKeywordDensityAnalysis {
  score: number;
  status: string;
  analysis: string;
  targetKeywords: AiKeywordDensityItem[];
}

export interface AiContextualRelevanceAnalysis {
  score: number;
  topicalDepth: string;
  analysis: string;
  coveredEntities: string[];
  missingEntities: string[];
}

export interface AiCitationFactor {
  factorName: string;
  score: number;
  verdict: string;
  description: string;
}

export interface AiModelCitationRate {
  modelName: string;
  predictedRate: number;
  advantage: string;
}

export interface AiCitationPredictabilityAnalysis {
  score: number;
  predictionLevel: '极高' | '良好' | '中等' | '偏低';
  analysis: string;
  factors: AiCitationFactor[];
  modelCitationRates: AiModelCitationRate[];
}

export interface AiContentRecommendation {
  id: string;
  priority: '高' | '中' | '低';
  category: '关键词优化' | '语境深度' | 'GEO引用改造' | '结构化信息';
  title: string;
  issueDetail: string;
  actionableGuidance: string;
  codeOrContentSnippet?: string;
}

export interface AiContentQualityAnalysisResult {
  overallQualityScore: number;
  executiveSummary: string;
  keywordDensity: AiKeywordDensityAnalysis;
  contextualRelevance: AiContextualRelevanceAnalysis;
  llmCitationPredictability: AiCitationPredictabilityAnalysis;
  recommendations: AiContentRecommendation[];
}

