import React, { useState } from 'react';
import {
  Archive,
  ArchiveRestore,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Download,
  Trash2,
  Sliders,
  Zap,
  Info,
  X,
  RefreshCw,
  FileSpreadsheet,
  Check,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { AuditIssue, AutoArchiveConfig, Website } from '../../types/seo';

interface AutoArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AutoArchiveConfig;
  onUpdateConfig: (newConfig: AutoArchiveConfig) => void;
  issues: AuditIssue[];
  activeSite: Website;
  onArchiveIssue: (issueId: string) => void;
  onArchiveMultiple: (issueIds: string[]) => void;
  onRestoreIssue: (issueId: string) => void;
  onRestoreAllArchived: () => void;
  onPurgeArchived: () => void;
}

export const AutoArchiveModal: React.FC<AutoArchiveModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  issues,
  activeSite,
  onArchiveIssue,
  onArchiveMultiple,
  onRestoreIssue,
  onRestoreAllArchived,
  onPurgeArchived,
}) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'records'>('settings');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Archived issues
  const archivedIssues = issues.filter((i) => i.isArchived);

  // Issues eligible to be archived (resolved >= threshold days and not yet archived)
  const eligibleToArchive = issues.filter(
    (i) => i.isResolved && !i.isArchived && (i.resolvedDaysAgo ?? 0) >= config.daysThreshold
  );

  // Active resolved issues (resolved but not archived yet)
  const activeResolvedCount = issues.filter((i) => i.isResolved && !i.isArchived).length;

  const handleToggleAutoArchive = () => {
    const updated = { ...config, enabled: !config.enabled };
    onUpdateConfig(updated);
    showToast(
      updated.enabled
        ? `已开启自动归档：超过 ${updated.daysThreshold} 天的已修复记录将自动移至离线存档`
        : '已暂停自动归档'
    );
  };

  const handleSetThreshold = (days: number) => {
    const updated = { ...config, daysThreshold: days };
    onUpdateConfig(updated);
    showToast(`已将自动归档阈值设为 ${days} 天`);
  };

  const handleRunBatchArchive = () => {
    const idsToArchive = eligibleToArchive.map((i) => i.id);
    if (idsToArchive.length === 0) {
      showToast('当前没有符合归档条件（已修复超过 30 天）的记录');
      return;
    }
    onArchiveMultiple(idsToArchive);
    showToast(`成功将 ${idsToArchive.length} 条已修复超过 ${config.daysThreshold} 天的历史记录移至离线存档！`);
  };

  const handleExportArchivedCSV = () => {
    if (archivedIssues.length === 0) {
      showToast('当前离线存档库为空，暂无数据可导出');
      return;
    }

    const headers = [
      '存档编号',
      '风险等级',
      '问题分类',
      '问题诊断标题',
      '修复完成日期',
      '距修复已过天数',
      '移入离线存档时间',
      '影响URL数',
      '修复建议概要',
    ];

    const rows = archivedIssues.map((i) => [
      `"${i.id}"`,
      `"${i.priority}"`,
      `"${i.category}"`,
      `"${i.title.replace(/"/g, '""')}"`,
      `"${i.resolvedAt || '未记录'}"`,
      `"${i.resolvedDaysAgo || 0} 天"`,
      `"${i.archivedAt || '自动归档'}"`,
      i.affectedUrlsCount,
      `"${i.recommendation.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SEO离线历史归档包-${activeSite.domain}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('已导出离线归档 CSV 备份包');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  审计记录自动归档与离线存档管理
                </h3>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    config.enabled
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {config.enabled ? '自动归档: 开启' : '已暂停'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                自动将已修复超过 {config.daysThreshold} 天的已解决缺陷移至离线冷存储，保持活动面板整洁与渲染低负载
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toast Feedback */}
        {toastMessage && (
          <div className="mx-6 mt-4 p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center gap-2 text-xs text-emerald-300 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="px-6 pt-4 flex items-center gap-2 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>自动归档规则与性能策略</span>
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'records'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>离线历史存档库</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
              {archivedIssues.length} 项
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {activeTab === 'settings' ? (
            <div className="space-y-6">
              {/* Performance & Status Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-1">
                  <span className="text-slate-400 text-[11px] block">控制面板减负提速</span>
                  <div className="flex items-baseline gap-1 text-emerald-400 font-mono font-extrabold text-2xl">
                    +38%
                  </div>
                  <span className="text-[10px] text-slate-500 block">虚拟 DOM 节点精简收益</span>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-1">
                  <span className="text-slate-400 text-[11px] block">已归档历史冷数据</span>
                  <div className="flex items-baseline gap-1 text-indigo-400 font-mono font-extrabold text-2xl">
                    {archivedIssues.length} <span className="text-xs font-normal text-slate-500">条缺陷记录</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block">随时可无损导出或一键还原</span>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-1">
                  <span className="text-slate-400 text-[11px] block">活动中已修复记录</span>
                  <div className="flex items-baseline gap-1 text-cyan-400 font-mono font-extrabold text-2xl">
                    {activeResolvedCount} <span className="text-xs font-normal text-slate-500">条</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    其中 {eligibleToArchive.length} 条已满足超过 {config.daysThreshold} 天条件
                  </span>
                </div>
              </div>

              {/* Main Toggle Switch Card */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">
                      启用历史修复记录自动归档
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      推荐配置
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs max-w-xl leading-relaxed">
                    开启后，系统将自动监控【已修复】问题的时间戳。一旦距离修复日期超过设定阈值（默认 30 天），该记录将自动转移到离线存档库，避免大量陈旧已解决项占用活动工作台屏幕与内存。
                  </p>
                </div>

                <button
                  onClick={handleToggleAutoArchive}
                  className={`w-14 h-8 rounded-full transition-colors relative p-1 shrink-0 ${
                    config.enabled ? 'bg-indigo-600' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full bg-white transition-transform ${
                      config.enabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Threshold Selection */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-white block">
                      自动归档时间窗口阈值 (修复留存期限)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      只有当问题在“已修复”状态下保留满该天数后，才会被系统自动离线存档
                    </span>
                  </div>
                  <span className="font-mono text-indigo-400 font-bold text-xs bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-xl">
                    当前: 超过 {config.daysThreshold} 天
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { days: 30, label: '30 天 (标准推荐)', desc: '兼顾近期复盘与面板清爽' },
                    { days: 60, label: '60 天 (双月周期)', desc: '适合季度技术复盘周期' },
                    { days: 90, label: '90 天 (季度存档)', desc: '适合长周期稳定性跟踪' },
                    { days: 180, label: '180 天 (半年度)', desc: '长期保留大版本改造痕迹' },
                  ].map((item) => (
                    <button
                      key={item.days}
                      onClick={() => handleSetThreshold(item.days)}
                      className={`p-3 rounded-xl text-left border transition-all ${
                        config.daysThreshold === item.days
                          ? 'bg-indigo-600/20 border-indigo-500 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="font-bold text-xs text-white flex items-center justify-between">
                        <span>{item.label}</span>
                        {config.daysThreshold === item.days && (
                          <Check className="w-3.5 h-3.5 text-indigo-400" />
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Execution Frequency & Manual Action */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-white block">
                      自动归档巡检频次与即时清理
                    </span>
                    <span className="text-[11px] text-slate-400">
                      系统在后台巡检时自动执行清理规则，您也可以随时手动触发一次归档扫描
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl">
                    {(['realtime', 'daily', 'weekly'] as const).map((freq) => (
                      <button
                        key={freq}
                        onClick={() => onUpdateConfig({ ...config, frequency: freq })}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                          config.frequency === freq
                            ? 'bg-indigo-600 text-white font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {freq === 'realtime' ? '实时触发' : freq === 'daily' ? '每日凌晨' : '每周'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Eligible items notice & instant trigger button */}
                <div className="p-4 bg-indigo-950/30 border border-indigo-500/20 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
                    <div>
                      <span className="text-white font-semibold block">
                        当前有 {eligibleToArchive.length} 条已修复记录符合归档标准 (&gt; {config.daysThreshold} 天)
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {eligibleToArchive.length > 0
                          ? `包括: ${eligibleToArchive.map((i) => i.title).slice(0, 2).join('、')}等`
                          : '当前控制面板所有已修复项均处于 30 天观测期内，无需清理。'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleRunBatchArchive}
                    disabled={eligibleToArchive.length === 0}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold transition-colors shrink-0"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>一键将符合项移入离线存档</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Tab 2: Offline Archived Records */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Archive className="w-4 h-4 text-indigo-400" />
                    离线历史存档审计记录列表 ({archivedIssues.length} 项)
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    此处的记录已移出主控制面板以节省内存。数据在本地持久存储，可随时恢复至活动列表或导出备份。
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportArchivedCSV}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition-colors"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>导出 CSV 离线包</span>
                  </button>
                  {archivedIssues.length > 0 && (
                    <button
                      onClick={() => {
                        onRestoreAllArchived();
                        showToast('已全部还原至活动看板！');
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-medium transition-colors"
                    >
                      <ArchiveRestore className="w-3.5 h-3.5" />
                      <span>全部还原至活动看板</span>
                    </button>
                  )}
                </div>
              </div>

              {archivedIssues.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl space-y-2">
                  <Archive className="w-8 h-8 text-slate-600 mx-auto" />
                  <div className="text-slate-300 font-semibold">暂无离线存档记录</div>
                  <div className="text-slate-500 text-[11px]">
                    当有已解决的审计缺陷修复超过 {config.daysThreshold} 天时，系统将自动移至此处。
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {archivedIssues.map((issue) => (
                    <div
                      key={issue.id}
                      className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-800 text-slate-400">
                            {issue.priority}风险
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                            {issue.category}
                          </span>
                          <span className="text-white font-semibold">{issue.title}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                          <span>修复日期: <span className="font-mono text-slate-300">{issue.resolvedAt || '早前已修复'}</span></span>
                          <span>距今已过: <span className="font-mono text-indigo-400 font-bold">{issue.resolvedDaysAgo || 30}+ 天</span></span>
                          <span>影响页面数: <span className="font-mono text-slate-300">{issue.affectedUrlsCount}</span></span>
                          <span>归档状态: <span className="text-emerald-400">离线压缩存档</span></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            onRestoreIssue(issue.id);
                            showToast(`已将【${issue.title}】还原至活动控制面板`);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition-colors"
                        >
                          <ArchiveRestore className="w-3.5 h-3.5 text-indigo-400" />
                          <span>还原到活动看板</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-slate-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>自动归档仅针对已修复记录，绝不隐藏任何待修复的严重或高危技术缺陷。</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors self-end sm:self-auto"
          >
            完成并关闭
          </button>
        </div>
      </div>
    </div>
  );
};
