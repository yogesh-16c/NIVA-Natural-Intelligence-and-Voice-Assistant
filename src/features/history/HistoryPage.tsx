import React, { useState, useEffect } from 'react';
import {
  Mic,
  MessageSquare,
  Compass,
  Zap,
  Search,
  Clock,
  Trash2,
  ChevronRight,
  ExternalLink,
  X,
  AlertCircle,
  Loader2,
  ArrowUpDown,
  BookOpen,
  Calendar,
  Filter
} from 'lucide-react';
import { historyService } from '../../services/history/historyService';
import { HistoryItem, HistorySessionType } from '../../types/assistant';
import { BackButton } from '../../components/ui/BackButton';
import { useRouter } from '../../app/router';

export const HistoryPage: React.FC = () => {
  const { navigate } = useRouter();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<HistorySessionType | 'all'>('all');
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await historyService.getHistoryItems();
      setItems(data);
    } catch (err: any) {
      setError('Failed to load session history. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesType = selectedType === 'all' || item.type === selectedType;
    if (!matchesType) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return item.title.toLowerCase().includes(q) || item.preview.toLowerCase().includes(q);
  });

  const handleDeleteItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await historyService.deleteHistoryItem(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (selectedItem?.id === id) {
      setSelectedItem(null);
    }
  };

  const handleClearAll = async () => {
    if (!isClearing) {
      setIsClearing(true);
      return;
    }
    await historyService.clearAllHistory();
    setItems([]);
    setSelectedItem(null);
    setIsClearing(false);
  };

  const getTypeIcon = (type: HistorySessionType) => {
    switch (type) {
      case 'voice':
        return <Mic className="w-4 h-4 text-emerald-600" />;
      case 'text':
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case 'research':
        return <Compass className="w-4 h-4 text-indigo-600" />;
      case 'action':
        return <Zap className="w-4 h-4 text-amber-600" />;
      default:
        return <Clock className="w-4 h-4 text-stone-500" />;
    }
  };

  const getTypeBadge = (type: HistorySessionType) => {
    switch (type) {
      case 'voice':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'text':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'research':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'action':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  const formatTimestamp = (ts: number) => {
    const date = new Date(ts);
    const now = Date.now();
    const diffMin = Math.round((now - ts) / (1000 * 60));

    if (diffMin < 60) {
      return `${Math.max(1, diffMin)}m ago`;
    }
    const diffHours = Math.round(diffMin / 60);
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex-1 flex flex-col max-w-5xl w-full mx-auto p-4 sm:p-6 md:p-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BackButton label="Workspace" to="/app" />
            <span className="text-stone-300">/</span>
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Workspaces
            </span>
          </div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
            Session History
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Review previous voice streams, chat transcripts, research syntheses, and action sessions.
          </p>
        </div>

        {items.length > 0 && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isClearing && (
              <button
                type="button"
                onClick={() => setIsClearing(false)}
                className="px-2.5 py-1.5 text-xs text-stone-500 hover:text-stone-800"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={handleClearAll}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
                isClearing
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-rose-700 hover:bg-rose-50 border border-stone-200'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isClearing ? 'Click to confirm clear' : 'Clear History'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="my-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sessions by topic or content..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/30 shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'voice', label: 'Voice' },
              { id: 'text', label: 'Chat' },
              { id: 'research', label: 'Research' },
              { id: 'action', label: 'Actions' }
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedType(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                selectedType === tab.id
                  ? 'bg-stone-900 text-white font-semibold shadow-xs'
                  : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content State Handling */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-16 text-stone-400">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mb-2" />
          <p className="text-xs font-medium">Loading session history…</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-center my-6">
          <AlertCircle className="w-6 h-6 text-rose-600 mx-auto mb-2" />
          <p className="text-xs font-semibold text-rose-800">{error}</p>
          <button
            type="button"
            onClick={loadHistory}
            className="mt-3 px-3.5 py-1.5 bg-white text-rose-700 border border-rose-300 rounded-lg text-xs font-semibold hover:bg-rose-50 cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-stone-200/80 shadow-2xs my-4">
          <div className="w-12 h-12 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-center text-stone-400 mb-3">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-stone-900">
            {searchQuery ? 'No matching sessions found' : 'No history recorded yet'}
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mt-1">
            {searchQuery
              ? `No sessions matched "${searchQuery}". Try a different keyword or reset filters.`
              : 'Conversations with NIVA via voice, chat, research, or tools will automatically appear here.'}
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedType('all');
              }}
              className="mt-4 px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="group bg-white hover:bg-stone-50/70 border border-stone-200/90 rounded-2xl p-4 sm:p-5 transition-all shadow-2xs hover:shadow-xs cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center justify-center shrink-0 mt-0.5 group-hover:border-stone-300 transition-colors">
                  {getTypeIcon(item.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-stone-900 truncate">
                      {item.title}
                    </h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${getTypeBadge(
                        item.type
                      )}`}
                    >
                      {item.type}
                    </span>
                    {item.durationSeconds && (
                      <span className="text-[11px] text-stone-400 font-mono">
                        {Math.floor(item.durationSeconds / 60)}m {item.durationSeconds % 60}s
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                    {item.preview}
                  </p>
                </div>
              </div>

              {/* Action column */}
              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                <span className="text-[11px] text-stone-400 font-medium">
                  {formatTimestamp(item.timestamp)}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => handleDeleteItem(e, item.id)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="px-3 py-1.5 bg-stone-100 group-hover:bg-stone-200/80 rounded-lg text-xs font-semibold text-stone-700 flex items-center gap-1 transition-colors">
                    <span>Review</span>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Session Review Modal / Drawer */}
      {selectedItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/25 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="w-full max-w-2xl bg-white rounded-2xl border border-stone-200 shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center">
                  {getTypeIcon(selectedItem.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-stone-900">
                      {selectedItem.title}
                    </h2>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${getTypeBadge(
                        selectedItem.type
                      )}`}
                    >
                      {selectedItem.type}
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-400">
                    Recorded {new Date(selectedItem.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80">
                <h4 className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                  Session Overview
                </h4>
                <p className="text-stone-700 leading-relaxed">
                  {selectedItem.preview}
                </p>
              </div>

              {/* If Voice or Chat messages exist */}
              {selectedItem.messages && selectedItem.messages.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-stone-900">
                    Transcript Timeline ({selectedItem.messages.length} messages)
                  </h4>
                  <div className="space-y-2.5">
                    {selectedItem.messages.map((m) => (
                      <div
                        key={m.id}
                        className={`p-3 rounded-xl border ${
                          m.role === 'assistant'
                            ? 'bg-white border-stone-200 text-stone-800'
                            : 'bg-stone-100/70 border-stone-200/60 text-stone-900 font-medium'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1 text-[10px] text-stone-400">
                          <span className="font-semibold uppercase tracking-wider">
                            {m.role === 'assistant' ? 'NIVA Assistant' : 'User'}
                          </span>
                          <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* If Research result exists */}
              {selectedItem.researchResult && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-stone-900">
                    Research Synthesis
                  </h4>
                  <div className="p-4 rounded-xl bg-white border border-stone-200 space-y-3">
                    <p className="text-stone-800 leading-relaxed font-normal">
                      {selectedItem.researchResult.summary}
                    </p>

                    {selectedItem.researchResult.keyFindings?.length > 0 && (
                      <div className="pt-2 border-t border-stone-100">
                        <span className="text-[11px] font-bold text-stone-900 block mb-2">
                          Key Technical Findings
                        </span>
                        <ul className="space-y-1.5 text-stone-600">
                          {selectedItem.researchResult.keyFindings.map((finding, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-indigo-600 font-bold">•</span>
                              <span>{finding}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedItem.researchResult.sources?.length > 0 && (
                      <div className="pt-2 border-t border-stone-100">
                        <span className="text-[11px] font-bold text-stone-900 block mb-2">
                          Referenced Sources ({selectedItem.researchResult.sources.length})
                        </span>
                        <div className="space-y-2">
                          {selectedItem.researchResult.sources.map((source) => (
                            <a
                              key={source.id}
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2.5 rounded-lg border border-stone-200/80 hover:border-stone-300 hover:bg-stone-50 flex items-center justify-between transition-colors block text-stone-700"
                            >
                              <div className="min-w-0 pr-2">
                                <span className="font-semibold text-stone-900 block truncate">
                                  {source.title}
                                </span>
                                <span className="text-[11px] text-stone-400 font-mono">
                                  {source.domain}
                                </span>
                              </div>
                              <ExternalLink className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* If Tool Execution exists */}
              {selectedItem.toolExecution && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold text-stone-900">
                    Action Execution Details
                  </h4>
                  <div className="p-3.5 rounded-xl bg-white border border-stone-200 space-y-2 font-mono text-[11px]">
                    <div>
                      <span className="text-stone-400">Action Type: </span>
                      <span className="text-stone-900">{selectedItem.toolExecution.type}</span>
                    </div>
                    <div>
                      <span className="text-stone-400">Status: </span>
                      <span className="text-emerald-600 font-semibold">{selectedItem.toolExecution.status}</span>
                    </div>
                    <div>
                      <span className="text-stone-400">Input: </span>
                      <span className="text-stone-800">{JSON.stringify(selectedItem.toolExecution.input)}</span>
                    </div>
                    {selectedItem.toolExecution.output && (
                      <div>
                        <span className="text-stone-400">Output: </span>
                        <span className="text-stone-800">{JSON.stringify(selectedItem.toolExecution.output)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-stone-100 flex items-center justify-between bg-stone-50/50">
              <button
                type="button"
                onClick={(e) => handleDeleteItem(e, selectedItem.id)}
                className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete this session</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-stone-900 hover:bg-stone-800 text-white rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
