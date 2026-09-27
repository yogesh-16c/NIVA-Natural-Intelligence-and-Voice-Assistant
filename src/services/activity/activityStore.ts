import { ActivityItem } from '../../types/assistant';

const STORAGE_KEY = 'niva_activity_log';

const INITIAL_ACTIVITIES: ActivityItem[] = [];

export const activityStore = {
  getActivities(): ActivityItem[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ACTIVITIES));
      return INITIAL_ACTIVITIES;
    } catch {
      return INITIAL_ACTIVITIES;
    }
  },

  addActivity(item: Omit<ActivityItem, 'id' | 'timestamp'>): ActivityItem {
    const fullItem: ActivityItem = {
      ...item,
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now()
    };
    const current = this.getActivities();
    const updated = [fullItem, ...current].slice(0, 50); // retain last 50 activities
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('niva-activity-added', { detail: fullItem }));
    return fullItem;
  },

  clear(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    window.dispatchEvent(new CustomEvent('niva-activity-added'));
  }
};
