import React, { useState } from 'react';
import { useAssistant } from '../../context/AssistantContext';
import { activityStore } from '../../services/activity/activityStore';
import { BackButton } from '../../components/ui/BackButton';
import {
  Activity,
  Globe,
  Calculator,
  ExternalLink,
  Monitor,
  MessageSquare,
  CheckCircle,
  Trash2,
  Clock,
  Search,
  Filter,
  Check,
  AlertTriangle
} from 'lucide-react';
import { ActivityItem } from '../../types/assistant';

export const ActivityPage: React.FC = () => {
  const { activities, refreshActivities } = useAssistant();
  const [filterType, setFilterType] = useState<string>('all');

  const filtered = activities.filter((act) => {
    if (filterType === 'all') return true;
    return act.type === filterType;
  });

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'web_research':
        return <Search className="w-4 h-4 text-indigo-600" />;
      case 'tool_execution':
        return <Calculator className="w-4 h-4 text-emerald-600" />;
      case 'browser_action':
        return <ExternalLink className="w-4 h-4 text-stone-700" />;
      case 'screen_analysis':
        return <Monitor className="w-4 h-4 text-purple-600" />;
      case 'conversation':
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      default:
        return <Activity className="w-4 h-4 text-stone-500" />;
    }
  };

  const [isClearing, setIsClearing] = useState(false);

  const handleClear = () => {
    if (!isClearing) {
      setIsClearing(true);
      return;
    }
    activityStore.clear();
    refreshActivities();
    setIsClearing(false);
  };

  const filterButtons = [
    { id: 'all', label: 'All Activities' },
    { id: 'conversation', label: 'Conversations' },
    { id: 'web_research', label: 'Searches' },
    { id: 'tool_execution', label: 'Tool Execution' },
    { id: 'browser_action', label: 'Browser Actions' },
    { id: 'screen_analysis', label: 'Screen Analysis' }
  ];

  return (
    <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BackButton label="Workspace" to="/app" />
            <span className="text-stone-300">/</span>
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Timeline
            </span>
          </div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
            Activity Timeline
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-stone-500">
            Lightweight operational timeline of conversations, searches, tool executions, and browser actions.
          </p>
        </div>

        {activities.length > 0 && (
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
              onClick={handleClear}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
                isClearing
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-rose-700 hover:bg-rose-50 border border-stone-200'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isClearing ? 'Click to confirm clear' : 'Clear Activities'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="my-5 flex items-center gap-1.5 overflow-x-auto pb-1">
        {filterButtons.map((btn) => (
          <button
            key={btn.id}
            type="button"
            onClick={() => setFilterType(btn.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              filterType === btn.id
                ? 'bg-stone-900 text-white font-semibold shadow-xs'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200/80'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Timeline List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-stone-200/80 shadow-2xs my-4">
            <div className="w-12 h-12 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-center text-stone-400 mx-auto mb-3">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-stone-900">
              No matching activity events
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
              Events will be logged as NIVA carries out conversations, searches, and authorized actions.
            </p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="p-4 sm:p-5 bg-white border border-stone-200/90 rounded-2xl shadow-2xs hover:shadow-xs transition-all flex items-start gap-4"
            >
              <div className="w-9 h-9 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center justify-center shrink-0 mt-0.5">
                {getActivityIcon(item.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-stone-900">
                      {item.title}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200 capitalize">
                      {item.type.replace('_', ' ')}
                    </span>
                  </div>

                  <span className="text-[11px] text-stone-400 font-medium shrink-0">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-xs text-stone-600 leading-relaxed">
                  {item.description}
                </p>

                {item.details && Object.keys(item.details).length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-stone-100 flex flex-wrap gap-2 text-[11px] text-stone-500 font-mono">
                    {Object.entries(item.details).map(([key, value]) => (
                      <span
                        key={key}
                        className="px-2 py-0.5 rounded bg-stone-50 border border-stone-200/60"
                      >
                        {key}: <strong className="text-stone-800">{String(value)}</strong>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
