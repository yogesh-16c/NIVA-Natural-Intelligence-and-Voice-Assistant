import { HistoryItem, HistorySessionType } from '../../types/assistant';

const STORAGE_KEY = 'niva_session_history_v1';

const INITIAL_HISTORY: HistoryItem[] = [];

class HistoryService {
  private load(): HistoryItem[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_HISTORY));
      return INITIAL_HISTORY;
    } catch {
      return INITIAL_HISTORY;
    }
  }

  private save(items: HistoryItem[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.warn('Unable to persist history items to localStorage', err);
    }
  }

  public async getHistoryItems(): Promise<HistoryItem[]> {
    // Return async to simulate real API pattern for clean backend transition
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.load());
      }, 100);
    });
  }

  public async getHistoryItemById(id: string): Promise<HistoryItem | null> {
    const items = this.load();
    const found = items.find((item) => item.id === id);
    return found || null;
  }

  public async addHistoryItem(
    item: Omit<HistoryItem, 'id' | 'timestamp'> & { id?: string; timestamp?: number }
  ): Promise<HistoryItem> {
    const newItem: HistoryItem = {
      ...item,
      id: item.id || `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: item.timestamp || Date.now()
    };
    const items = [newItem, ...this.load().filter((i) => i.id !== newItem.id)];
    this.save(items);
    return newItem;
  }

  public async deleteHistoryItem(id: string): Promise<boolean> {
    const items = this.load().filter((i) => i.id !== id);
    this.save(items);
    return true;
  }

  public async clearAllHistory(): Promise<void> {
    this.save([]);
  }

  public async searchAndFilter(query: string, typeFilter: HistorySessionType | 'all' = 'all'): Promise<HistoryItem[]> {
    const all = this.load();
    const q = query.trim().toLowerCase();
    return all.filter((item) => {
      const matchesType = typeFilter === 'all' || item.type === typeFilter;
      if (!matchesType) return false;
      if (!q) return true;
      const inTitle = item.title.toLowerCase().includes(q);
      const inPreview = item.preview.toLowerCase().includes(q);
      return inTitle || inPreview;
    });
  }
}

export const historyService = new HistoryService();
