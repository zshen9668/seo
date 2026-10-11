import React, { useState, useEffect } from 'react';
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
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { GlobalSearchBar } from './components/GlobalSearchBar';
import { KeywordPerformanceView } from './components/KeywordPerformanceView';
import { AutomatedAuditView } from './components/AutomatedAuditView';
import { KeywordResearchView } from './components/KeywordResearchView';
import { MultiSiteMatrixView } from './components/MultiSiteMatrixView';
import { GeoControlView } from './components/GeoControlView';
import { AiApiHubView } from './components/AiApiHubView';
import { generateRealistic30DayHistory } from './utils/seoChartUtils';
import { AddKeywordModal } from './components/Modals/AddKeywordModal';
import { AddSiteModal } from './components/Modals/AddSiteModal';
import { TrendingUp, ShieldCheck, Search, Globe, Sparkles, Cpu } from 'lucide-react';

export default function App() {
  const [websites, setWebsites] = useState<Website[]>(() => {
    const saved = localStorage.getItem('seopilot_websites');
    return saved ? JSON.parse(saved) : INITIAL_WEBSITES;
  });

  const [activeSite, setActiveSite] = useState<Website>(() => {
    return websites[0] || INITIAL_WEBSITES[0];
  });

  const [keywords, setKeywords] = useState<TrackedKeyword[]>(() => {
    const saved = localStorage.getItem('seopilot_keywords');
    return saved ? JSON.parse(saved) : INITIAL_TRACKED_KEYWORDS;
  });

  const [auditReport, setAuditReport] = useState<AuditReportData>(() => {
    const saved = localStorage.getItem('seopilot_audit_report');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_REPORT;
  });

  // Navigation tab
  const [currentTab, setCurrentTab] = useState<
    'rankings' | 'geo' | 'audit' | 'research' | 'sites' | 'ai_hub'
  >('rankings');

  // Trigger states
  const [isPullingRankings, setIsPullingRankings] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);

  // Modals
  const [isAddKeywordModalOpen, setIsAddKeywordModalOpen] = useState(false);
  const [isAddSiteModalOpen, setIsAddSiteModalOpen] = useState(false);

  // Local storage persistence
  useEffect(() => {
    localStorage.setItem('seopilot_websites', JSON.stringify(websites));
  }, [websites]);

  useEffect(() => {
    localStorage.setItem('seopilot_keywords', JSON.stringify(keywords));
  }, [keywords]);

  useEffect(() => {
    localStorage.setItem('seopilot_audit_report', JSON.stringify(auditReport));
  }, [auditReport]);

  // Pull Rankings feature
  const handlePullRankings = () => {
    setIsPullingRankings(true);

    setTimeout(() => {
      setIsPullingRankings(false);
      // Randomly adjust rankings slightly to simulate fresh SERP crawl
      setKeywords((prev) =>
        prev.map((kw) => {
          if (kw.siteId !== activeSite.id) return kw;
          const shift = Math.floor(Math.random() * 3) - 1; // -1, 0, or +1
          const newRank = Math.max(1, kw.currentRank - shift);
          const rankChange = kw.currentRank - newRank;

          const lastDate = kw.history.length > 0 ? kw.history[kw.history.length - 1].date : '10-11';
          const updatedHistory = kw.history.length > 0
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
        })
      );
    }, 1200);
  };

  // Run on-demand automated crawler audit
  const handleRunAudit = () => {
    setIsAuditing(true);

    setTimeout(() => {
      setIsAuditing(false);
      setAuditReport((prev) => {
        const newScore = Math.min(100, Math.max(70, prev.overallScore + Math.floor(Math.random() * 5) - 1));
        return {
          ...prev,
          scanDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
          overallScore: newScore,
          totalPagesScanned: prev.totalPagesScanned + Math.floor(Math.random() * 20),
        };
      });
    }, 1800);
  };

  const [autoArchiveConfig, setAutoArchiveConfig] = useState<AutoArchiveConfig>(() => {
    const saved = localStorage.getItem('seopilot_auto_archive_config');
    return saved ? JSON.parse(saved) : INITIAL_AUTO_ARCHIVE_CONFIG;
  });

  useEffect(() => {
    localStorage.setItem('seopilot_auto_archive_config', JSON.stringify(autoArchiveConfig));
  }, [autoArchiveConfig]);

  // Toggle issue resolved status
  const handleToggleIssueResolved = (issueId: string) => {
    setAuditReport((prev) => ({
      ...prev,
      issues: prev.issues.map((iss) => {
        if (iss.id === issueId) {
          const nextResolved = !iss.isResolved;
          return {
            ...iss,
            isResolved: nextResolved,
            resolvedAt: nextResolved ? new Date().toISOString().substring(0, 10) : undefined,
            resolvedDaysAgo: nextResolved ? 0 : undefined,
            isArchived: nextResolved ? iss.isArchived : false,
          };
        }
        return iss;
      }),
    }));
  };

  const handleArchiveIssue = (issueId: string) => {
    setAuditReport((prev) => ({
      ...prev,
      issues: prev.issues.map((iss) =>
        iss.id === issueId
          ? {
              ...iss,
              isArchived: true,
              archivedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
            }
          : iss
      ),
    }));
  };

  const handleArchiveMultiple = (issueIds: string[]) => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    setAuditReport((prev) => ({
      ...prev,
      issues: prev.issues.map((iss) =>
        issueIds.includes(iss.id)
          ? {
              ...iss,
              isArchived: true,
              archivedAt: now,
            }
          : iss
      ),
    }));
  };

  const handleRestoreIssue = (issueId: string) => {
    setAuditReport((prev) => ({
      ...prev,
      issues: prev.issues.map((iss) =>
        iss.id === issueId
          ? {
              ...iss,
              isArchived: false,
              archivedAt: undefined,
            }
          : iss
      ),
    }));
  };

  const handleRestoreAllArchived = () => {
    setAuditReport((prev) => ({
      ...prev,
      issues: prev.issues.map((iss) =>
        iss.isArchived
          ? {
              ...iss,
              isArchived: false,
              archivedAt: undefined,
            }
          : iss
      ),
    }));
  };

  const handlePurgeArchived = () => {
    setAuditReport((prev) => ({
      ...prev,
      issues: prev.issues.filter((iss) => !iss.isArchived),
    }));
  };

  // Update schedule frequency
  const handleUpdateScheduleFrequency = (
    freq: 'daily' | 'weekly' | 'monthly'
  ) => {
    setActiveSite((prev) => ({ ...prev, scheduledAuditFrequency: freq }));
    setWebsites((prev) =>
      prev.map((w) =>
        w.id === activeSite.id ? { ...w, scheduledAuditFrequency: freq } : w
      )
    );
  };

  // Add new tracked keyword
  const handleAddKeyword = (
    newKwData: Omit<TrackedKeyword, 'id' | 'updatedAt' | 'history'>
  ) => {
    const initialRank = newKwData.currentRank;
    const history = generateRealistic30DayHistory(
      initialRank,
      newKwData.previousRank || initialRank + 3,
      newKwData.keyword
    );

    const newKeyword: TrackedKeyword = {
      ...newKwData,
      id: `kw-${Date.now()}`,
      updatedAt: '刚刚',
      history,
    };

    setKeywords((prev) => [newKeyword, ...prev]);

    // Update active website tracked keyword count
    setActiveSite((prev) => ({
      ...prev,
      totalTrackedKeywords: prev.totalTrackedKeywords + 1,
    }));
    setWebsites((prev) =>
      prev.map((w) =>
        w.id === activeSite.id
          ? { ...w, totalTrackedKeywords: w.totalTrackedKeywords + 1 }
          : w
      )
    );
  };

  // Add new website
  const handleAddSite = (newSite: Website) => {
    setWebsites((prev) => [newSite, ...prev]);
    setActiveSite(newSite);
  };

  const unresolvedCount = auditReport.issues.filter((i) => !i.isResolved).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Header */}
      <Header
        websites={websites}
        activeSite={activeSite}
        onSelectSite={(site) => {
          setActiveSite(site);
          setAuditReport((prev) => ({
            ...prev,
            siteId: site.id,
            scannedUrl: `https://${site.domain}`,
          }));
        }}
        onPullRankings={handlePullRankings}
        isPullingRankings={isPullingRankings}
        onTriggerAudit={handleRunAudit}
        isAuditing={isAuditing}
        onOpenAddKeyword={() => setIsAddKeywordModalOpen(true)}
        onOpenAddSite={() => setIsAddSiteModalOpen(true)}
      />

      {/* Main Layout Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          activeSite={activeSite}
          unresolvedIssuesCount={unresolvedCount}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-7 pb-20 md:pb-8">
          <div className="max-w-7xl mx-auto">
            {/* Global Search Bar (跨库全局检索) */}
            <GlobalSearchBar
              websites={websites}
              keywords={keywords}
              auditIssues={auditReport.issues}
              competitorGaps={INITIAL_COMPETITOR_OVERLAP}
              onSelectSite={(site) => {
                setActiveSite(site);
                setAuditReport((prev) => ({
                  ...prev,
                  siteId: site.id,
                  scannedUrl: `https://${site.domain}`,
                }));
              }}
              onNavigateTab={setCurrentTab}
            />

            {currentTab === 'rankings' && (
              <KeywordPerformanceView
                keywords={keywords}
                activeSite={activeSite}
                onPullRankings={handlePullRankings}
                isPullingRankings={isPullingRankings}
                onOpenAddKeyword={() => setIsAddKeywordModalOpen(true)}
              />
            )}

            {currentTab === 'geo' && (
              <GeoControlView activeSite={activeSite} />
            )}

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
              <KeywordResearchView
                activeSite={activeSite}
                onAddTrackedKeyword={handleAddKeyword}
              />
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
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-2 flex items-center justify-around">
        <button
          onClick={() => setCurrentTab('rankings')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
            currentTab === 'rankings' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>排名雷达</span>
        </button>

        <button
          onClick={() => setCurrentTab('geo')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
            currentTab === 'geo' ? 'text-purple-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>GEO中控</span>
        </button>

        <button
          onClick={() => setCurrentTab('audit')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
            currentTab === 'audit' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>全站体检</span>
        </button>

        <button
          onClick={() => setCurrentTab('ai_hub')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
            currentTab === 'ai_hub' ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>AI接入</span>
        </button>

        <button
          onClick={() => setCurrentTab('research')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
            currentTab === 'research' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>拓词挖掘</span>
        </button>

        <button
          onClick={() => setCurrentTab('sites')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
            currentTab === 'sites' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>多站中控</span>
        </button>
      </nav>

      {/* Modals */}
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
