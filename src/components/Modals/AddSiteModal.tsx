import React, { useState } from 'react';
import { X, Globe, Plus } from 'lucide-react';
import { Website } from '../../types/seo';

interface AddSiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSite: (site: Website) => void;
}

export const AddSiteModal: React.FC<AddSiteModalProps> = ({ isOpen, onClose, onAddSite }) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [category, setCategory] = useState<Website['category']>('SaaS云平台');
  const [frequency, setFrequency] = useState<Website['scheduledAuditFrequency']>('weekly');
  const [competitorsText, setCompetitorsText] = useState('rival-a.com, rival-b.com');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !domain.trim()) return;

    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');

    const newSite: Website = {
      id: `site-${Date.now()}`,
      name: name.trim(),
      domain: cleanDomain,
      category,
      status: 'healthy',
      healthScore: Math.floor(Math.random() * 10) + 85,
      domainRating: Math.floor(Math.random() * 25) + 35,
      monthlyOrganicVisits: Math.floor(Math.random() * 50000) + 10000,
      monthlyVisitsGrowth: 15.2,
      totalTrackedKeywords: 12,
      top3Keywords: 3,
      top10Keywords: 8,
      totalIndexedPages: 350,
      lastAuditDate: '刚刚',
      scheduledAuditFrequency: frequency,
      competitors: competitorsText
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean),
    };

    onAddSite(newSite);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">接入新网站至 SEO Pilot</h3>
            <p className="text-xs text-slate-400">
              开启自动化巡检、全网排位捕获及竞品差距透视
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">站点名称</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如: 云跃 SaaS 国际版"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">域名 (无需前缀)</label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="例如: cloudscale.io"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">站点业务属性</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
              >
                <option value="SaaS云平台">SaaS云平台</option>
                <option value="跨境电商">跨境电商</option>
                <option value="技术博客/资讯">技术博客/资讯</option>
                <option value="企业官网门户">企业官网门户</option>
                <option value="垂直矩阵站">垂直矩阵站</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">自动化体检频次</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
              >
                <option value="daily">每日自动巡检</option>
                <option value="weekly">每周定时巡检</option>
                <option value="monthly">每月定期体检</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">
              对标竞品域名 (逗号分隔)
            </label>
            <input
              type="text"
              value={competitorsText}
              onChange={(e) => setCompetitorsText(e.target.value)}
              placeholder="例如: datadog.com, dynatrace.com"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30"
            >
              接入并开启监测
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
