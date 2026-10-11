import React, { useState } from 'react';
import {
  ShieldCheck,
  RefreshCw,
  Clock,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Info,
  Calendar,
  Zap,
  Globe,
  Sliders,
  Code2,
  Download,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  Filter,
  Flame,
  ArrowRight,
  FileText,
  FileSpreadsheet,
  Printer,
  Sparkles,
  Archive,
  ArchiveRestore,
} from 'lucide-react';
import { AuditReportData, Website, AutoArchiveConfig, AuditIssue } from '../types/seo';
import { INITIAL_AUTO_ARCHIVE_CONFIG } from '../data/mockData';
import { StakeholderPresentationModal } from './Modals/StakeholderPresentationModal';
import { AiContentQualityPanel } from './AiContentQualityPanel';
import { AutoArchiveModal } from './Modals/AutoArchiveModal';

interface AutomatedAuditViewProps {
  report: AuditReportData;
  activeSite: Website;
  onRunAudit: () => void;
  isAuditing: boolean;
  onToggleIssueResolved: (issueId: string) => void;
  onUpdateScheduleFrequency: (freq: 'daily' | 'weekly' | 'monthly') => void;
  autoArchiveConfig?: AutoArchiveConfig;
  onUpdateAutoArchiveConfig?: (config: AutoArchiveConfig) => void;
  onArchiveIssue?: (issueId: string) => void;
  onArchiveMultiple?: (issueIds: string[]) => void;
  onRestoreIssue?: (issueId: string) => void;
  onRestoreAllArchived?: () => void;
  onPurgeArchived?: () => void;
}

export const AutomatedAuditView: React.FC<AutomatedAuditViewProps> = ({
  report,
  activeSite,
  onRunAudit,
  isAuditing,
  onToggleIssueResolved,
  onUpdateScheduleFrequency,
  autoArchiveConfig,
  onUpdateAutoArchiveConfig,
  onArchiveIssue,
  onArchiveMultiple,
  onRestoreIssue,
  onRestoreAllArchived,
  onPurgeArchived,
}) => {
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unresolved' | 'resolved' | 'archived'>('all');
  const [expandedIssueId, setExpandedIssueId] = useState<string | null>('iss-1');
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);

  // Auto-Archive configuration and modal state
  const [localArchiveConfig, setLocalArchiveConfig] = useState<AutoArchiveConfig>(
    autoArchiveConfig || INITIAL_AUTO_ARCHIVE_CONFIG
  );
  const currentArchiveConfig = autoArchiveConfig || localArchiveConfig;
  const handleUpdateConfig = onUpdateAutoArchiveConfig || setLocalArchiveConfig;
  const [isAutoArchiveModalOpen, setIsAutoArchiveModalOpen] = useState(false);
  const [archiveFeedback, setArchiveFeedback] = useState<string | null>(null);

  // Stakeholder PDF Presentation Modal
  const [isPresentationModalOpen, setIsPresentationModalOpen] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [viewSection, setViewSection] = useState<'all' | 'ai_content' | 'tech_issues'>('all');

  // Archived issues & eligible to archive
  const archivedIssues = report.issues.filter((i) => i.isArchived);
  const eligibleToArchive = report.issues.filter(
    (i) => i.isResolved && !i.isArchived && (i.resolvedDaysAgo ?? 0) >= currentArchiveConfig.daysThreshold
  );

  // Filtered issues
  const filteredIssues = report.issues.filter((issue) => {
    // If viewing archived list explicitly
    if (statusFilter === 'archived') {
      const matchesPriority = priorityFilter === 'all' || issue.priority === priorityFilter;
      const matchesCategory = categoryFilter === 'all' || issue.category === categoryFilter;
      return issue.isArchived && matchesPriority && matchesCategory;
    }

    // In active dashboard view, hide archived items
    if (issue.isArchived) return false;

    const matchesPriority = priorityFilter === 'all' || issue.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || issue.category === categoryFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'unresolved' && !issue.isResolved) ||
      (statusFilter === 'resolved' && issue.isResolved);
    return matchesPriority && matchesCategory && matchesStatus;
  });

  const unresolvedCount = report.issues.filter((i) => !i.isResolved && !i.isArchived).length;

  const handleCopyCode = (snippet: string, id: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedSnippetId(id);
    setTimeout(() => setCopiedSnippetId(null), 2000);
  };

  // CSV Export feature for Stakeholder Presentation
  const handleExportCSV = () => {
    const metaHeaders = [
      ['=== SEO PILOT 全站深度体检管理汇报案 (CSV 格式) ===', ''],
      ['目标网站域名', activeSite.domain],
      ['体检扫描入口', report.scannedUrl],
      ['体检执行时刻', report.scanDate],
      ['综合SEO健康评分', `${report.overallScore}/100`],
      ['累计抓取页面数', report.totalPagesScanned],
      ['待排查缺陷数', unresolvedCount],
      ['死链与404健康分', `${report.categoryScores.brokenLinks}/100`],
      ['加载速度与性能分', `${report.categoryScores.pageSpeed}/100`],
      ['Meta与内容规范分', `${report.categoryScores.metaTags}/100`],
      ['图片与Alt属性分', `${report.categoryScores.imageOptimization}/100`],
      ['移动端易用性评分', `${report.categoryScores.mobileFriendliness}/100`],
      ['Core Web Vitals LCP 最大内容绘制', `${report.metrics.lcpSeconds}秒`],
      ['Core Web Vitals CLS 累积布局偏移', report.metrics.clsScore],
      ['', ''],
      ['=== 优先级行动建议与技术修复清单 ===', ''],
    ];

    const issueHeaders = [
      '缺陷编号',
      '风险等级',
      '分类类别',
      '问题诊断名称',
      '影响度得分 (1-100)',
      '修复工程难度',
      '处置状态',
      '受影响URL数量',
      '受波及样本URL',
      '根因机制剖析',
      '可执行技术建议',
    ];

    const metaRows = metaHeaders.map((row) => `"${row[0]}","${row[1]}"`).join('\n');
    const headerRow = issueHeaders.map((h) => `"${h}"`).join(',');

    const issueRows = report.issues
      .map((i) => {
        const cleanUrls = i.sampleUrls.join(' | ').replace(/"/g, '""');
        const cleanDesc = i.description.replace(/"/g, '""');
        const cleanRec = i.recommendation.replace(/"/g, '""');
        const cleanTitle = i.title.replace(/"/g, '""');

        return `"${i.id}","${i.priority}","${i.category}","${cleanTitle}",${i.impactScore},"${i.effort}","${
          i.isResolved ? '已解决' : '待处理'
        }",${i.affectedUrlsCount},"${cleanUrls}","${cleanDesc}","${cleanRec}"`;
      })
      .join('\n');

    const csvContent = `${metaRows}\n\n${headerRow}\n${issueRows}`;

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SEO体检汇报表格-${activeSite.domain}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const freqLabels: Record<string, string> = {
    daily: '每日巡检',
    weekly: '每周巡检',
    monthly: '每月巡检',
  };

  return (
    <div className="space-y-6">
      {/* Header and Automated Schedule Controller */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            自动化全站 SEO 深度体检与诊断爬虫
          </h2>
          <p className="text-xs text-slate-400">
            全周期自动巡检死链404、页面加载延迟(LCP)、缺少TDK与元描述、图片缺失Alt属性及移动端触控易用性
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Periodic schedule frequency selector */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
            <Clock className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            <span className="text-slate-400 font-medium hidden md:inline">定时巡检:</span>
            {(['daily', 'weekly', 'monthly'] as const).map((freq) => (
              <button
                key={freq}
                onClick={() => onUpdateScheduleFrequency(freq)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  activeSite.scheduledAuditFrequency === freq
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {freqLabels[freq]}
              </button>
            ))}
          </div>

          <button
            onClick={onRunAudit}
            disabled={isAuditing}
            className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl shadow-sm transition-all shadow-emerald-600/25 disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
            <span>{isAuditing ? '爬虫正在体检...' : '立即启动体检'}</span>
          </button>

          {/* Auto-Archive Controller Button */}
          <button
            onClick={() => setIsAutoArchiveModalOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 px-3.5 py-2 rounded-xl border border-slate-700/80 transition-all shadow-sm"
            title="设置自动将修复超30天的历史记录移至离线存档，保持控制面板整洁与加载性能"
          >
            <Archive className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">自动归档</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                currentArchiveConfig.enabled
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {archivedIssues.length > 0 ? `${archivedIssues.length}已归档` : currentArchiveConfig.enabled ? '>30天' : '关'}
            </span>
          </button>

          {/* Export Dropdown (PDF & CSV presentation options) */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-xl border border-indigo-500/30 transition-all shadow-sm shadow-indigo-600/20"
              title="导出适合向业务与技术主管汇报的PDF演讲案或CSV数据表"
            >
              <Download className="w-3.5 h-3.5" />
              <span>导出汇报案</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl p-1.5 shadow-2xl z-30 animate-in fade-in space-y-1">
                <button
                  onClick={() => {
                    setIsPresentationModalOpen(true);
                    setShowExportMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-medium text-slate-200 hover:text-white hover:bg-indigo-600/20 transition-colors group"
                >
                  <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Printer className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-white">导出 PDF 演示文稿 (汇报案)</div>
                    <div className="text-[10px] text-slate-400">打印或保存为专业汇报幻灯片</div>
                  </div>
                </button>

                <button
                  onClick={handleExportCSV}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-medium text-slate-200 hover:text-white hover:bg-emerald-600/20 transition-colors group"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-white">导出 CSV 汇总表格 (Excel)</div>
                    <div className="text-[10px] text-slate-400">可直接导入飞书/Excel深度复盘</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live Auditing Animation Banner */}
      {isAuditing && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-3 text-xs text-emerald-300 animate-pulse">
          <div className="flex items-center gap-2.5">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
            <div>
              <div className="font-bold text-white">自动化爬虫正在扫描诊断 {activeSite.domain}...</div>
              <div className="text-[11px] text-emerald-300/80">
                正在校验 HTTP 404死链状态码、LCP核心体验速度、HTML Meta与TDK规范、图片尺寸与移动端视口适配。
              </div>
            </div>
          </div>
          <span className="font-mono text-emerald-400 font-bold">扫描中...</span>
        </div>
      )}

      {/* Stakeholder Quick Banner */}
      <div className="bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-950 border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white">汇报案快速就绪:</span>{' '}
            <span className="text-slate-300">
              已为决策层与工程团队整理出详尽的SEO健康评分、核心指标状态及优先级改造路线。
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsPresentationModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-sm transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>打开 PDF 演讲案</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>下载 CSV 表格</span>
          </button>
        </div>
      </div>

      {/* View Section Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/70 border border-slate-800 p-2 rounded-2xl">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setViewSection('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              viewSection === 'all'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            全景综合体检看板
          </button>
          <button
            onClick={() => setViewSection('ai_content')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              viewSection === 'ai_content'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-indigo-300 hover:text-white hover:bg-indigo-950/40 border border-indigo-500/30'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Gemini AI 内容质量与大模型引用 (GEO)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">3.8 Flash</span>
          </button>
          <button
            onClick={() => setViewSection('tech_issues')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              viewSection === 'tech_issues'
                ? 'bg-slate-800 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            5大技术缺陷排查清单 ({unresolvedCount})
          </button>
        </div>

        <div className="text-[11px] text-slate-400 hidden sm:block">
          当前分析站点: <span className="font-mono text-indigo-400 font-semibold">{activeSite.domain}</span>
        </div>
      </div>

      {/* AI-driven Content Quality Analysis Panel (Gemini API 增强) */}
      {(viewSection === 'all' || viewSection === 'ai_content') && (
        <AiContentQualityPanel activeSite={activeSite} />
      )}

      {/* Technical Checks & Overall Score (shown in 'all' and 'tech_issues') */}
      {(viewSection === 'all' || viewSection === 'tech_issues') && (
        <>
          {/* Overall Score & 5 Focus Area Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Overall Health Score Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              整站体检健康指数
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl font-extrabold text-emerald-400 font-mono">
                {report.overallScore}
              </span>
              <span className="text-xs text-slate-500">/ 100</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              本次共遍历扫描 <span className="font-mono text-white font-bold">{report.totalPagesScanned}</span> 个页面，覆盖 <span className="font-mono text-indigo-400">{report.scannedUrl}</span>。
            </p>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">环比上次体检:</span>
            <span className="font-mono text-emerald-400 font-bold">+8 分净提升</span>
          </div>
        </div>

        {/* 5 Core Required Checklist Categories in 3 Columns */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {/* 1. Broken Links */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold">死链与404</span>
                <span className="text-emerald-400 font-mono font-bold">
                  {report.categoryScores.brokenLinks}%
                </span>
              </div>
              <div className="text-xl font-bold font-mono text-white mt-2">
                {report.metrics.brokenLinksFound} <span className="text-xs font-normal text-slate-500">处死链</span>
              </div>
            </div>
            <div className="text-[10px] text-slate-400 mt-2">
              {report.metrics.brokenLinksFound > 0 ? (
                <span className="text-rose-400 font-semibold">发现 2 处站内 404</span>
              ) : (
                <span className="text-emerald-400 font-semibold">无死链阻塞</span>
              )}
            </div>
          </div>

          {/* 2. Page Load Speeds */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold">加载速度</span>
                <span className="text-indigo-400 font-mono font-bold">
                  {report.categoryScores.pageSpeed}%
                </span>
              </div>
              <div className="text-xl font-bold font-mono text-white mt-2">
                {report.metrics.avgLoadTimeSeconds}s <span className="text-xs font-normal text-slate-500">均值</span>
              </div>
            </div>
            <div className="text-[10px] text-slate-400 mt-2">
              LCP: <span className="text-amber-400 font-mono font-bold">{report.metrics.lcpSeconds}秒</span> (CWV)
            </div>
          </div>

          {/* 3. Meta Descriptions & Titles */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold">Meta描述与Title</span>
                <span className="text-cyan-400 font-mono font-bold">
                  {report.categoryScores.metaTags}%
                </span>
              </div>
              <div className="text-xl font-bold font-mono text-white mt-2">
                {report.metrics.missingMetaDescPages} <span className="text-xs font-normal text-slate-500">页缺失</span>
              </div>
            </div>
            <div className="text-[10px] text-slate-400 mt-2">
              <span className="text-amber-400 font-semibold">4 页面缺少元描述</span>
            </div>
          </div>

          {/* 4. Image Optimization */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold">图片与Alt优化</span>
                <span className="text-amber-400 font-mono font-bold">
                  {report.categoryScores.imageOptimization}%
                </span>
              </div>
              <div className="text-xl font-bold font-mono text-white mt-2">
                {report.metrics.missingAltImages} <span className="text-xs font-normal text-slate-500">张缺Alt</span>
              </div>
            </div>
            <div className="text-[10px] text-slate-400 mt-2">
              <span className="text-amber-400 font-semibold">核心插图缺失 Alt</span>
            </div>
          </div>

          {/* 5. Mobile-Friendliness */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold">移动端易用性</span>
                <span className="text-emerald-400 font-mono font-bold">
                  {report.categoryScores.mobileFriendliness}%
                </span>
              </div>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-2">
                {report.metrics.mobileFriendlyScore}% <span className="text-xs font-normal text-slate-500">达标</span>
              </div>
            </div>
            <div className="text-[10px] text-emerald-400 mt-2 font-semibold">
              响应式视口无横向滚动
            </div>
          </div>
        </div>
      </div>

      {/* Prioritized Actionable Recommendations Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-bold text-white">
                优先级可执行修复清单 (智能排序)
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-rose-500/10 text-rose-300 border border-rose-500/20 font-bold">
                {unresolvedCount} 项待排查
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              按搜索引擎降权风险与权重影响度自高向低排列，提供即用型配置代码
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Priority filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-200 cursor-pointer"
            >
              <option value="all">全部风险等级</option>
              <option value="严重">严重风险 (最高等级)</option>
              <option value="高危">高危风险</option>
              <option value="中度">中度优化</option>
              <option value="低危">低危关注</option>
            </select>

            {/* Category filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-200 cursor-pointer"
            >
              <option value="all">全部问题分类</option>
              <option value="死链与404">死链与404</option>
              <option value="页面速度与性能">页面加载速度 (LCP)</option>
              <option value="Meta与内容规范">Meta描述与Title规范</option>
              <option value="图片与Alt优化">图片与Alt替代文本</option>
              <option value="移动端与自适应">移动端触控与自适应</option>
            </select>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-200 cursor-pointer"
            >
              <option value="all">全部活动状态 (自动隐藏超30天归档)</option>
              <option value="unresolved">仅待排查项 ({unresolvedCount})</option>
              <option value="resolved">近期已解决 (活跃)</option>
              <option value="archived">离线历史存档 ({archivedIssues.length} 项)</option>
            </select>
          </div>
        </div>

        {/* Auto-Archive Notification & Quick Trigger Banner */}
        {eligibleToArchive.length > 0 && (
          <div className="p-3.5 bg-indigo-950/30 border border-indigo-500/25 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0">
                <Archive className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-white">自动归档提醒:</span>{' '}
                <span className="text-slate-300">
                  检测到 <span className="font-mono text-indigo-400 font-bold">{eligibleToArchive.length}</span> 条缺陷已修复超过 {currentArchiveConfig.daysThreshold} 天，系统可自动移至离线存档，保持控制面板轻量清爽。
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  const ids = eligibleToArchive.map((i) => i.id);
                  if (onArchiveMultiple) {
                    onArchiveMultiple(ids);
                  }
                  setArchiveFeedback(`已将 ${ids.length} 条已修复记录移入离线历史存档`);
                  setTimeout(() => setArchiveFeedback(null), 3000);
                }}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>立即一键归档 ({eligibleToArchive.length})</span>
              </button>
              <button
                onClick={() => setIsAutoArchiveModalOpen(true)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
              >
                规则设置
              </button>
            </div>
          </div>
        )}

        {archiveFeedback && (
          <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center gap-2 text-xs text-emerald-300 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{archiveFeedback}</span>
          </div>
        )}

        {/* Prioritized Recommendation Cards List */}
        <div className="space-y-3.5 pt-2">
          {filteredIssues.map((issue) => {
            const isExpanded = expandedIssueId === issue.id;

            return (
              <div
                key={issue.id}
                className={`rounded-2xl border transition-all ${
                  issue.isResolved
                    ? 'bg-slate-950/40 border-slate-800/60 opacity-75'
                    : issue.priority === '严重'
                    ? 'bg-rose-950/15 border-rose-500/40 shadow-sm shadow-rose-950/30'
                    : issue.priority === '高危'
                    ? 'bg-amber-950/15 border-amber-500/40'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header row */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {issue.isResolved ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : issue.priority === '严重' ? (
                        <AlertOctagon className="w-5 h-5 text-rose-400" />
                      ) : issue.priority === '高危' ? (
                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                      ) : (
                        <Info className="w-5 h-5 text-indigo-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-white text-sm">
                          {issue.title}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            issue.priority === '严重'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : issue.priority === '高危'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {issue.priority}风险
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">
                          {issue.category}
                        </span>
                        {issue.isArchived ? (
                          <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                            已离线存档 (&gt;{currentArchiveConfig.daysThreshold}天)
                          </span>
                        ) : issue.isResolved ? (
                          <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            已修复 ({issue.resolvedDaysAgo ?? 0} 天前)
                          </span>
                        ) : null}
                      </div>

                      <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                        {issue.description}
                      </p>
                    </div>
                  </div>

                  {/* Impact score, affected count & Action buttons */}
                  <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400">影响度权重</div>
                      <div className="text-sm font-extrabold text-white font-mono">
                        {issue.impactScore}
                        <span className="text-[10px] text-slate-500">/100</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onToggleIssueResolved(issue.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                        issue.isResolved
                          ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      {issue.isResolved ? '✓ 已修复' : '标为已解决'}
                    </button>

                    {issue.isArchived ? (
                      <button
                        onClick={() => {
                          if (onRestoreIssue) onRestoreIssue(issue.id);
                          setArchiveFeedback(`已将【${issue.title}】从离线存档还原至活动控制面板`);
                          setTimeout(() => setArchiveFeedback(null), 3000);
                        }}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 flex items-center gap-1 transition-colors"
                        title="从离线存档还原"
                      >
                        <ArchiveRestore className="w-3.5 h-3.5 text-indigo-400" />
                        <span>还原</span>
                      </button>
                    ) : issue.isResolved ? (
                      <button
                        onClick={() => {
                          if (onArchiveIssue) onArchiveIssue(issue.id);
                          setArchiveFeedback(`已将【${issue.title}】移入离线存档`);
                          setTimeout(() => setArchiveFeedback(null), 3000);
                        }}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 transition-colors"
                        title="立即移入离线历史存档"
                      >
                        <Archive className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="hidden sm:inline">归档</span>
                      </button>
                    ) : null}

                    <button
                      onClick={() =>
                        setExpandedIssueId(isExpanded ? null : issue.id)
                      }
                      className="px-2.5 py-1.5 rounded-xl text-xs text-indigo-400 hover:text-white bg-indigo-600/10 hover:bg-indigo-600 transition-colors font-medium"
                    >
                      {isExpanded ? '收起方案' : '查看修复方案'}
                    </button>
                  </div>
                </div>

                {/* Expanded Details: Actionable Recommendation & Code Snippet */}
                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-5 pt-3 border-t border-slate-800/80 space-y-3.5 bg-slate-950/60 rounded-b-2xl">
                    {/* Actionable recommendation */}
                    <div>
                      <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5" />
                        可操作性优化与修复建议:
                      </div>
                      <p className="text-xs text-slate-200 mt-1 leading-relaxed bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                        {issue.recommendation}
                      </p>
                    </div>

                    {/* Sample affected URLs */}
                    <div>
                      <div className="text-[11px] font-semibold text-slate-400 mb-1">
                        受波及 URL 样本 (共检测到 {issue.affectedUrlsCount} 处):
                      </div>
                      <div className="space-y-1">
                        {issue.sampleUrls.map((url, uidx) => (
                          <div
                            key={uidx}
                            className="text-[11px] font-mono text-indigo-400 bg-slate-900 p-2 rounded-lg border border-slate-800/80 truncate flex items-center justify-between"
                          >
                            <span className="truncate">{url}</span>
                            <a
                              href={url.split(' ')[0]}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-400 hover:text-white ml-2 shrink-0"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Ready-to-use Code Snippet Fix */}
                    {issue.codeSnippet && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                            <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                            即用型配置 / 模板修复代码:
                          </span>
                          <button
                            onClick={() => handleCopyCode(issue.codeSnippet!, issue.id)}
                            className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-white"
                          >
                            {copiedSnippetId === issue.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span>已复制!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>复制代码</span>
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="bg-slate-950 p-3 rounded-xl text-[11px] font-mono text-slate-300 border border-slate-800 overflow-x-auto leading-relaxed">
                          {issue.codeSnippet}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      </>
      )}

      {/* Stakeholder Presentation PDF/Print Deck Modal */}
      <StakeholderPresentationModal
        isOpen={isPresentationModalOpen}
        onClose={() => setIsPresentationModalOpen(false)}
        report={report}
        activeSite={activeSite}
        onDownloadCSV={handleExportCSV}
      />

      {/* Auto-Archive & Offline Storage Modal */}
      <AutoArchiveModal
        isOpen={isAutoArchiveModalOpen}
        onClose={() => setIsAutoArchiveModalOpen(false)}
        config={currentArchiveConfig}
        onUpdateConfig={handleUpdateConfig}
        issues={report.issues}
        activeSite={activeSite}
        onArchiveIssue={(id) => onArchiveIssue && onArchiveIssue(id)}
        onArchiveMultiple={(ids) => onArchiveMultiple && onArchiveMultiple(ids)}
        onRestoreIssue={(id) => onRestoreIssue && onRestoreIssue(id)}
        onRestoreAllArchived={() => onRestoreAllArchived && onRestoreAllArchived()}
        onPurgeArchived={() => onPurgeArchived && onPurgeArchived()}
      />
    </div>
  );
};
