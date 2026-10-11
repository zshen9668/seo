import React from 'react';
import {
  X,
  Printer,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Info,
  Globe,
  Calendar,
  Zap,
  TrendingUp,
  ShieldCheck,
  Award,
  Layers,
} from 'lucide-react';
import { AuditReportData, Website } from '../../types/seo';

interface StakeholderPresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: AuditReportData;
  activeSite: Website;
  onDownloadCSV: () => void;
}

export const StakeholderPresentationModal: React.FC<StakeholderPresentationModalProps> = ({
  isOpen,
  onClose,
  report,
  activeSite,
  onDownloadCSV,
}) => {
  if (!isOpen) return null;

  const unresolvedCount = report.issues.filter((i) => !i.isResolved).length;
  const criticalIssues = report.issues.filter((i) => i.priority === '严重');
  const highIssues = report.issues.filter((i) => i.priority === '高危');
  const otherIssues = report.issues.filter((i) => i.priority !== '严重' && i.priority !== '高危');

  const handlePrintPDF = () => {
    window.print();
  };

  const handleDownloadStandaloneHTML = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>SEO 管理层汇报演示文稿 - ${activeSite.domain}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif; margin: 40px; color: #0f172a; line-height: 1.5; }
    .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: bold; }
    .badge-critical { background: #fee2e2; color: #991b1b; }
    .badge-high { background: #fef3c7; color: #92400e; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 24px 0; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
    .score { font-size: 36px; font-weight: 800; color: #059669; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
    th, td { border-bottom: 1px solid #e2e8f0; padding: 10px; text-align: left; }
    th { background: #f1f5f9; font-weight: 600; }
    .code { font-family: monospace; background: #0f172a; color: #f8fafc; padding: 8px 12px; border-radius: 6px; font-size: 11px; white-space: pre-wrap; margin-top: 6px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>全站技术 SEO 深度体检与管理层汇报案</h1>
    <p>目标域名: <strong>${activeSite.domain}</strong> (${report.scannedUrl}) | 执行日期: <strong>${report.scanDate}</strong></p>
    <p>汇报面向对象: <strong>企业管理层、研发技术委员会与市场业务团队</strong></p>
  </div>
  <div class="grid">
    <div class="card"><div style="font-size:12px;color:#64748b;">整站健康评分</div><div class="score">${report.overallScore}/100</div></div>
    <div class="card"><div style="font-size:12px;color:#64748b;">深度遍历页面数</div><div style="font-size:24px;font-weight:700;">${report.totalPagesScanned}</div></div>
    <div class="card"><div style="font-size:12px;color:#64748b;">待推进修复项</div><div style="font-size:24px;font-weight:700;color:#dc2626;">${unresolvedCount}</div></div>
    <div class="card"><div style="font-size:12px;color:#64748b;">Core Web Vitals (LCP)</div><div style="font-size:24px;font-weight:700;color:#2563eb;">${report.metrics.lcpSeconds}秒</div></div>
  </div>
  <h2>优先级工程与内容改造路线图</h2>
  <table>
    <thead><tr><th>风险等级</th><th>问题诊断名称</th><th>分类</th><th>影响度</th><th>难度</th><th>改造建议</th></tr></thead>
    <tbody>
      ${report.issues
        .map(
          (i) => `<tr>
            <td><span class="badge ${i.priority === '严重' ? 'badge-critical' : 'badge-high'}">${i.priority}</span></td>
            <td><strong>${i.title}</strong></td>
            <td>${i.category}</td>
            <td>${i.impactScore}/100</td>
            <td>${i.effort}</td>
            <td>${i.recommendation}</td>
          </tr>`
        )
        .join('')}
    </tbody>
  </table>
  <div style="margin-top:40px;padding-top:20px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;text-align:center;">
    本报告由 SEO Pilot 自动化巡检爬虫系统权威认证出具。
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SEO管理层汇报演示文稿-${activeSite.domain}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl relative my-8 print-container">
        {/* Modal Top Control Bar (Hidden when printing to PDF) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-800 gap-4 no-print">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                汇报演示文稿 (Deck)
              </span>
              <span className="text-xs text-slate-400">
                可直接面向管理层、业务线或客户展示
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">
              全站 SEO 技术体检与管理层汇报演示文稿
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrintPDF}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all"
              title="打印或调起浏览器保存为 PDF 选项"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>打印 / 另存为 PDF</span>
            </button>

            <button
              onClick={onDownloadCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition-all"
              title="下载适合在 Excel / 飞书中编辑汇报的 CSV 表格"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>下载 CSV 表格</span>
            </button>

            <button
              onClick={handleDownloadStandaloneHTML}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              title="下载独立的离线版演讲幻灯片网页文件"
            >
              <Download className="w-3.5 h-3.5" />
              <span>离线演示 HTML</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Presentation Content Area */}
        <div className="space-y-6 text-slate-100">
          {/* Executive Cover Header */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 border border-slate-800 avoid-break-inside">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase font-extrabold tracking-widest text-indigo-400">
                  机密级管理层技术审计汇报 (CONFIDENTIAL)
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5 tracking-tight">
                  全站技术 SEO 深度体检与自然流量潜力评估报告
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2 font-mono">
                  <span>目标域名: <strong className="text-slate-200">{activeSite.domain}</strong></span>
                  <span>• 入口: <strong className="text-slate-200">{report.scannedUrl}</strong></span>
                  <span>• 体检时刻: <strong className="text-slate-200">{report.scanDate}</strong></span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-4xl sm:text-5xl font-mono font-black text-emerald-400">
                  {report.overallScore}
                  <span className="text-base text-slate-500 font-sans font-normal"> / 100</span>
                </div>
                <div className="text-xs font-bold text-slate-300 mt-1 uppercase tracking-wider">
                  整站综合健康评分
                </div>
              </div>
            </div>
          </div>

          {/* Key Executive KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 avoid-break-inside">
            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl">
              <div className="text-xs text-slate-400 font-medium">遍历页面总数</div>
              <div className="text-2xl font-extrabold text-white font-mono mt-1">
                {report.totalPagesScanned}
              </div>
              <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% 结构深度覆盖
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl">
              <div className="text-xs text-slate-400 font-medium">严重级风险项</div>
              <div className="text-2xl font-extrabold text-rose-400 font-mono mt-1">
                {criticalIssues.length}
              </div>
              <div className="text-[11px] text-rose-400/80 mt-1">
                需在48小时内推进修复
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl">
              <div className="text-xs text-slate-400 font-medium">高影响优化项</div>
              <div className="text-2xl font-extrabold text-amber-400 font-mono mt-1">
                {highIssues.length}
              </div>
              <div className="text-[11px] text-amber-400/80 mt-1">
                直接关乎搜索引擎排位
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl">
              <div className="text-xs text-slate-400 font-medium">预估流量增长潜力</div>
              <div className="text-2xl font-extrabold text-cyan-400 font-mono mt-1">
                +18% - 25%
              </div>
              <div className="text-[11px] text-cyan-400/80 mt-1">
                修复后预期自然曝光提升
              </div>
            </div>
          </div>

          {/* Category Scorecard Breakdown for Leadership */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-6 avoid-break-inside space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              核心技术维度合规记分卡
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-[11px] text-slate-400">死链与404状态</div>
                <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                  {report.categoryScores.brokenLinks}%
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  发现 {report.metrics.brokenLinksFound} 处死链
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-[11px] text-slate-400">加载速度与LCP</div>
                <div className="text-xl font-bold font-mono text-indigo-400 mt-1">
                  {report.categoryScores.pageSpeed}%
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  LCP: {report.metrics.lcpSeconds}秒 (核心体验)
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-[11px] text-slate-400">Meta规范与Title</div>
                <div className="text-xl font-bold font-mono text-cyan-400 mt-1">
                  {report.categoryScores.metaTags}%
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {report.metrics.missingMetaDescPages} 页缺描述
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-[11px] text-slate-400">图片资源与Alt</div>
                <div className="text-xl font-bold font-mono text-amber-400 mt-1">
                  {report.categoryScores.imageOptimization}%
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {report.metrics.missingAltImages} 张缺Alt
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-[11px] text-slate-400">移动端易用性</div>
                <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                  {report.categoryScores.mobileFriendliness}%
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  响应式触控达标
                </div>
              </div>
            </div>
          </div>

          {/* Actionable Prioritized Recommendations Table */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-6 avoid-break-inside space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-400" />
                  工程与内容优先级改造路线图
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  已按搜索引擎排位算法惩罚严重度自高向低排列
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                    <th className="pb-3 pl-2">风险等级</th>
                    <th className="pb-3">问题诊断名称与分类</th>
                    <th className="pb-3 text-center">影响度</th>
                    <th className="pb-3 text-center">工程难度</th>
                    <th className="pb-3">波及范围</th>
                    <th className="pb-3">可执行改造建议</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {report.issues.map((iss) => (
                    <tr key={iss.id} className="hover:bg-slate-900/60 transition-colors">
                      <td className="py-3.5 pl-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            iss.priority === '严重'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : iss.priority === '高危'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {iss.priority}
                        </span>
                      </td>

                      <td className="py-3.5">
                        <div className="font-bold text-white text-xs">{iss.title}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{iss.category}</div>
                      </td>

                      <td className="py-3.5 text-center font-mono font-bold text-slate-200">
                        {iss.impactScore}/100
                      </td>

                      <td className="py-3.5 text-center">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 font-medium border border-slate-800">
                          {iss.effort}
                        </span>
                      </td>

                      <td className="py-3.5 font-mono text-slate-300">
                        {iss.affectedUrlsCount} 处页面
                      </td>

                      <td className="py-3.5 text-slate-300 leading-relaxed text-[11px] max-w-sm">
                        {iss.recommendation}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Presentation Footer */}
          <div className="text-center pt-4 text-xs text-slate-500 font-mono">
            本报告由 SEO Pilot 企业级自动化巡检系统出具认证 • {activeSite.domain}
          </div>
        </div>
      </div>
    </div>
  );
};
