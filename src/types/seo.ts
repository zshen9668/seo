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
