import React, { useState, useMemo, useCallback, Suspense, lazy } from 'react';
import {
  INITIAL_WEBSITES,
  INITIAL_TRACKED_KEYWORDS,
  INITIAL_AUDIT_REPORT,
  INITIAL_COMPETITOR_OVERLAP,
  INITIAL_AUTO_ARCHIVE_CONFIG,
} from './data/mockData';
import {
  Website,
  TrackedKeyword,
  AuditReportData,
  AutoArchiveConfig,
} from './types/seo';
import type { AppTab } from './types/app';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { GlobalSearchBar } from './components/GlobalSearchBar';
import { generateRealistic30DayHistory } from './utils/seoChartUtils';
import { AddKeywordModal } from './components/Modals/AddKeywordModal';
import { AddSiteModal } from './components/Modals/AddSiteModal';
import { useLocalStorageState } from './hooks/useLocalStorageState';
import { TrendingUp, ShieldCheck, Search, Globe, Sparkles, Cpu } from 'lucide-react';

const KeywordPerformanceView = lazy(() =>
  import('./components/KeywordPerformanceView').then((m) => ({ default: m.KeywordPerformanceView })),
);
const AutomatedAuditView = lazy(() =>
  import('./components/AutomatedAuditView').then((m) => ({ default: m.AutomatedAuditView })),
);
const KeywordResearchView = lazy(() =>
  import('./components/KeywordResearchView').then((m) => ({ default: m.KeywordResearchView })),
);
const MultiSiteMatrixView = lazy(() =>
  import('./components/MultiSiteMatrixView').then((m) => ({ default: m.MultiSiteMatrixView })),
);
const GeoControlView = lazy(() =>
  import('./components/GeoControlView').then((m) => ({ default: m.GeoControlView })),
);
const AiApiHubView = lazy(() =>
  import('./components/AiApiHubView').then((m) => ({ default: m.AiApiHubView })),
);

function ViewFallback() {
  return (
    <div className="flex items-center justify-center min-h-[40vh] text-slate-400 text-sm gap-3">
      <div className="w-5 h-5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
      <span>模块加载中…</span>
    </div>
  );
}

const MOBILE_NAV: { id: AppTab; label: string; icon: typeof TrendingUp; activeClass: string }[] = [
  { id: 'rankings', label: '排名雷达', icon: TrendingUp, activeClass: 'text-indigo-400 font-bold' },
  { id: 'geo', label: 'GEO中控', icon: Sparkles, activeClass: 'text-purple-400 font-bold' },
  { id: 'audit', label: '全站体检', icon: ShieldCheck, activeClass: 'text-indigo-400 font-bold' },
  { id: 'ai_hub', label: 'AI接入', icon: Cpu, activeClass: 'text-emerald-400 font-bold' },
  { id: 'research', label: '拓词挖掘', icon: Search, activeClass: 'text-indigo-400 font-bold' },
  { id: 'sites', label: '多站中控', icon: Globe, activeClass: 'text-indigo-400 font-bold' },
];

export default function App() {
  const [websites, setWebsites] = useLocalStorageState<Website[]>('seopilot_websites', INITIAL_WEBSITES);
  const [keywords, setKeywords] = useLocalStorageState<TrackedKeyword[]>(
    'seopilot_keywords',
    INITIAL_TRACKED_KEYWORDS,
  );
  const [auditReport, setAuditReport] = useLocalStorageState<AuditReportData>(
    'seopilot_audit_report',
    INITIAL_AUDIT_REPORT,
  );
  const [autoArchiveConfig, setAutoArchiveConfig] = useLocalStorageState<AutoArchiveConfig>(
    'seopilot_auto_archive_config',
    INITIAL_AUTO_ARCHIVE_CONFIG,
  );

  const [activeSite, setActiveSite] = useState<Website>(() => websites[0] || INITIAL_WEBSITES[0]);
  const [currentTab, setCurrentTab] = useState<AppTab>('rankings');
  const [isPullingRankings, setIsPullingRankings] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isAddKeywordModalOpen, setIsAddKeywordModalOpen] = useState(false);
  const [isAddSiteModalOpen, setIsAddSiteModalOpen] = useState(false);

  const selectSite = useCallback(
    (site: Website) => {
      setActiveSite(site);
      setAuditReport((prev) => ({
        ...prev,
        siteId: site.id,
        scannedUrl: `https://${site.domain}`,
      }));
    },
    [setAuditReport],
  );

  const handlePullRankings = useCallback(() => {
    setIsPullingRankings(true);
    window.setTimeout(() => {
      setIsPullingRankings(false);
      setKeywords((prev) =>
        prev.map((kw) => {
          if (kw.siteId !== activeSite.id) return kw;
          const shift = Math.floor(Math.random() * 3) - 1;
          const newRank = Math.max(1, kw.currentRank - shift);
          const rankChange = kw.currentRank - newRank;
          const lastDate = kw.history.length > 0 ? kw.history[kw.history.length - 1].date : '10-11';
          const updatedHistory =
            kw.history.length > 0
              ? [...kw.history.slice(0, -1), { date: lastDate, rank: newRank }]
              : generateRealistic30DayHistory(newRank, kw.currentRank, kw.id);
          return {
            ...kw,
            previousRank: kw.currentRank,
            currentRank: newRank,
            rankChange,
            updatedAt: '刚刚',
            history: updatedHistory,
          };
        }),
      );
    }, 1200);
  }, [activeSite.id, setKeywords]);

  const handleRunAudit = useCallback(() => {
    setIsAuditing(true);
    window.setTimeout(() => {
      setIsAuditing(false);
      setAuditReport((prev) => {
        const newScore = Math.min(
          100,
          Math.max(70, prev.overallScore + Math.floor(Math.random() * 5) - 1),
        );
        return {
          ...prev,
          scanDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
          overallScore: newScore,
          totalPagesScanned: prev.totalPagesScanned + Math.floor(Math.random() * 20),
        };
      });
    }, 1800);
  }, [setAuditReport]);

  const handleToggleIssueResolved = useCallback(
    (issueId: string) => {
      setAuditReport((prev) => ({
        ...prev,
        issues: prev.issues.map((iss) => {
          if (iss.id !== issueId) return iss;
          const nextResolved = !iss.isResolved;
          return {
            ...iss,
            isResolved: nextResolved,
            resolvedAt: nextResolved ? new Date().toISOString().substring(0, 10) : undefined,
            resolvedDaysAgo: nextResolved ? 0 : undefined,
            isArchived: nextResolved ? iss.isArchived : false,
          };
        }),
      }));
    },
    [setAuditReport],
  );

  const handleArchiveIssue = useCallback(
    (issueId: string) => {
      setAuditReport((prev) => ({
        ...prev,
        issues: prev.issues.map((iss) =>
          iss.id === issueId
            ? {
                ...iss,
                isArchived: true,
                archivedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
              }
            : iss,
        ),
      }));
    },
    [setAuditReport],
  );

  const handleArchiveMultiple = useCallback(
    (issueIds: string[]) => {
      const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
      const idSet = new Set(issueIds);
      setAuditReport((prev) => ({
        ...prev,
        issues: prev.issues.map((iss) =>
          idSet.has(iss.id) ? { ...iss, isArchived: true, archivedAt: now } : iss,
        ),
      }));
    },
    [setAuditReport],
  );

  const handleRestoreIssue = useCallback(
    (issueId: string) => {
      setAuditReport((prev) => ({
        ...prev,
        issues: prev.issues.map((iss) =>
          iss.id === issueId ? { ...iss, isArchived: false, archivedAt: undefined } : iss,
        ),
      }));
    },
    [setAuditReport],
  );

  const handleRestoreAllArchived = useCallback(() => {
    setAuditReport((prev) => ({
      ...prev,
      issues: prev.issues.map((iss) =>
        iss.isArchived ? { ...iss, isArchived: false, archivedAt: undefined } : iss,
      ),
    }));
  }, [setAuditReport]);

  const handlePurgeArchived = useCallback(() => {
    setAuditReport((prev) => ({
      ...prev,
      issues: prev.issues.filter((iss) => !iss.isArchived),
    }));
  }, [setAuditReport]);

  const handleUpdateScheduleFrequency = useCallback(
    (freq: 'daily' | 'weekly' | 'monthly') => {
      setActiveSite((prev) => ({ ...prev, scheduledAuditFrequency: freq }));
      setWebsites((prev) =>
        prev.map((w) => (w.id === activeSite.id ? { ...w, scheduledAuditFrequency: freq } : w)),
      );
    },
    [activeSite.id, setWebsites],
  );

  const handleAddKeyword = useCallback(
    (newKwData: Omit<TrackedKeyword, 'id' | 'updatedAt' | 'history'>) => {
      const initialRank = newKwData.currentRank;
      const history = generateRealistic30DayHistory(
        initialRank,
        newKwData.previousRank || initialRank + 3,
        newKwData.keyword,
      );
      const newKeyword: TrackedKeyword = {
        ...newKwData,
        id: `kw-${Date.now()}`,
        updatedAt: '刚刚',
        history,
      };
      setKeywords((prev) => [newKeyword, ...prev]);
      setActiveSite((prev) => ({
        ...prev,
        totalTrackedKeywords: prev.totalTrackedKeywords + 1,
      }));
      setWebsites((prev) =>
        prev.map((w) =>
          w.id === activeSite.id
            ? { ...w, totalTrackedKeywords: w.totalTrackedKeywords + 1 }
            : w,
        ),
      );
    },
    [activeSite.id, setKeywords, setWebsites],
  );

  const handleAddSite = useCallback(
    (newSite: Website) => {
      setWebsites((prev) => [newSite, ...prev]);
      setActiveSite(newSite);
    },
    [setWebsites],
  );

  const unresolvedCount = useMemo(
    () => auditReport.issues.filter((i) => !i.isResolved && !i.isArchived).length,
    [auditReport.issues],
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      <Header
        websites={websites}
        activeSite={activeSite}
        onSelectSite={selectSite}
        onPullRankings={handlePullRankings}
        isPullingRankings={isPullingRankings}
        onTriggerAudit={handleRunAudit}
        isAuditing={isAuditing}
        onOpenAddKeyword={() => setIsAddKeywordModalOpen(true)}
        onOpenAddSite={() => setIsAddSiteModalOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          activeSite={activeSite}
          unresolvedIssuesCount={unresolvedCount}
        />

        <main className="flex-1 overflow-y-auto p-4 lg:p-7 pb-20 md:pb-8">
          <div className="max-w-7xl mx-auto">
            <GlobalSearchBar
              websites={websites}
              keywords={keywords}
              auditIssues={auditReport.issues}
              competitorGaps={INITIAL_COMPETITOR_OVERLAP}
              onSelectSite={selectSite}
              onNavigateTab={setCurrentTab}
            />

            <Suspense fallback={<ViewFallback />}>
              {currentTab === 'rankings' && (
                <KeywordPerformanceView
                  keywords={keywords}
                  activeSite={activeSite}
                  onPullRankings={handlePullRankings}
                  isPullingRankings={isPullingRankings}
                  onOpenAddKeyword={() => setIsAddKeywordModalOpen(true)}
                />
              )}

              {currentTab === 'geo' && <GeoControlView activeSite={activeSite} />}

              {currentTab === 'audit' && (
                <AutomatedAuditView
                  report={auditReport}
                  activeSite={activeSite}
                  onRunAudit={handleRunAudit}
                  isAuditing={isAuditing}
                  onToggleIssueResolved={handleToggleIssueResolved}
                  onUpdateScheduleFrequency={handleUpdateScheduleFrequency}
                  autoArchiveConfig={autoArchiveConfig}
                  onUpdateAutoArchiveConfig={setAutoArchiveConfig}
                  onArchiveIssue={handleArchiveIssue}
                  onArchiveMultiple={handleArchiveMultiple}
                  onRestoreIssue={handleRestoreIssue}
                  onRestoreAllArchived={handleRestoreAllArchived}
                  onPurgeArchived={handlePurgeArchived}
                />
              )}

              {currentTab === 'research' && (
                <KeywordResearchView activeSite={activeSite} onAddTrackedKeyword={handleAddKeyword} />
              )}

              {currentTab === 'sites' && (
                <MultiSiteMatrixView
                  websites={websites}
                  onSelectSite={setActiveSite}
                  onOpenAddSite={() => setIsAddSiteModalOpen(true)}
                  onSelectTab={setCurrentTab}
                />
              )}

              {currentTab === 'ai_hub' && (
                <AiApiHubView
                  activeSite={activeSite}
                  keywords={keywords}
                  onNavigateTab={setCurrentTab}
                />
              )}
            </Suspense>
          </div>
        </main>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-2 flex items-center justify-around">
        {MOBILE_NAV.map(({ id, label, icon: Icon, activeClass }) => (
          <button
            key={id}
            type="button"
            onClick={() => setCurrentTab(id)}
            className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
              currentTab === id ? activeClass : 'text-slate-400'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <AddKeywordModal
        isOpen={isAddKeywordModalOpen}
        onClose={() => setIsAddKeywordModalOpen(false)}
        activeSite={activeSite}
        onAddKeyword={handleAddKeyword}
      />

      <AddSiteModal
        isOpen={isAddSiteModalOpen}
        onClose={() => setIsAddSiteModalOpen(false)}
        onAddSite={handleAddSite}
      />
    </div>
  );
}
