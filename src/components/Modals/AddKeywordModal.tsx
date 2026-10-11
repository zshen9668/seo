import React, { useState } from 'react';
import { X, Plus, TrendingUp, Search } from 'lucide-react';
import { TrackedKeyword, Website } from '../../types/seo';

interface AddKeywordModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSite: Website;
  onAddKeyword: (kw: Omit<TrackedKeyword, 'id' | 'updatedAt' | 'history'>) => void;
}

export const AddKeywordModal: React.FC<AddKeywordModalProps> = ({
  isOpen,
  onClose,
  activeSite,
  onAddKeyword,
}) => {
  if (!isOpen) return null;

  const [keyword, setKeyword] = useState('');
  const [searchEngine, setSearchEngine] = useState<'Google' | 'Bing' | 'Baidu'>('Google');
  const [initialRank, setInitialRank] = useState('8');
  const [searchVolume, setSearchVolume] = useState('12500');
  const [difficulty, setDifficulty] = useState('55');
  const [cpc, setCpc] = useState('18.5');
  const [intent, setIntent] = useState<TrackedKeyword['intent']>('商业调研');
  const [targetUrl, setTargetUrl] = useState(`https://${activeSite.domain}/solution`);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    onAddKeyword({
      siteId: activeSite.id,
      keyword: keyword.trim(),
      searchEngine,
      currentRank: parseInt(initialRank) || 12,
      previousRank: (parseInt(initialRank) || 12) + 3,
      rankChange: 3,
      searchVolume: parseInt(searchVolume) || 5000,
      difficulty: parseInt(difficulty) || 50,
      cpc: parseFloat(cpc) || 10,
      intent,
      serpFeatures: ['精选摘要', '相关问答'],
      targetUrl: targetUrl.trim(),
    });

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
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">添加新监控关键词</h3>
            <p className="text-xs text-slate-400">
              归属目标域名: <span className="font-mono text-indigo-400">{activeSite.domain}</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">目标关键词</label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="例如: 企业级云原生架构实施与多集群治理"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">目标搜索引擎</label>
              <select
                value={searchEngine}
                onChange={(e) => setSearchEngine(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
              >
                <option value="Google">谷歌 (Google SERP)</option>
                <option value="Bing">必应 (Bing Search)</option>
                <option value="Baidu">百度 (Baidu)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">搜索意图分类</label>
              <select
                value={intent}
                onChange={(e) => setIntent(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
              >
                <option value="商业调研">商业调研</option>
                <option value="交易购买">交易购买</option>
                <option value="信息查询">信息查询</option>
                <option value="品牌导航">品牌导航</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">当前排名位</label>
              <input
                type="number"
                value={initialRank}
                onChange={(e) => setInitialRank(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">预估月搜索量</label>
              <input
                type="number"
                value={searchVolume}
                onChange={(e) => setSearchVolume(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">预估 CPC ($)</label>
              <input
                type="number"
                step="0.1"
                value={cpc}
                onChange={(e) => setCpc(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">目标落地页 URL</label>
            <input
              type="url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
              required
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
              开始监控
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
