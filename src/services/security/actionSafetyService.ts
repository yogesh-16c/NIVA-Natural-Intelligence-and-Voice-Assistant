import { ActionSafetyConfig } from '../../types/assistant';

const STORAGE_KEY = 'niva_action_safety_config_v1';

export interface ActionLogItem {
  id: string;
  actionType: string;
  target: string;
  decision: 'allowed' | 'cancelled' | 'auto_allowed';
  timestamp: number;
  reason?: string;
}

const DEFAULT_ALLOWED_DOMAINS = [
  'google.com',
  'youtube.com',
  'github.com',
  'gemini.google.com',
  'gmail.com',
  'linkedin.com',
  'facebook.com',
  'instagram.com',
  'x.com',
  'reddit.com',
  'amazon.com',
  'netflix.com',
  'chatgpt.com',
  'react.dev',
  'stackoverflow.com',
];

const DEFAULT_CONFIG: ActionSafetyConfig = {
  confirmBrowserNavigation: true,
  allowedDomains: DEFAULT_ALLOWED_DOMAINS,
  requireConfirmationForExternalUrls: true,
  sanitizeInputs: true
};

class ActionSafetyService {
  private config: ActionSafetyConfig;
  private actionLogs: ActionLogItem[] = [];
  private listeners: Set<(config: ActionSafetyConfig) => void> = new Set();

  constructor() {
    this.config = this.loadConfig();
    this.actionLogs = this.loadLogs();
  }

  private loadConfig(): ActionSafetyConfig {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
      }
    } catch {
      // Fallback
    }
    return DEFAULT_CONFIG;
  }

  private saveConfig() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
      this.listeners.forEach((l) => l(this.config));
    } catch (e) {
      console.warn('Unable to persist action safety config', e);
    }
  }

  private loadLogs(): ActionLogItem[] {
    try {
      const stored = localStorage.getItem('niva_action_safety_logs');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback
    }
    return [
      {
        id: 'log_01',
        actionType: 'browser_navigation',
        target: 'https://react.dev',
        decision: 'allowed',
        timestamp: Date.now() - 1000 * 60 * 45,
        reason: 'User approved navigation prompt'
      },
      {
        id: 'log_02',
        actionType: 'browser_navigation',
        target: 'https://github.com',
        decision: 'auto_allowed',
        timestamp: Date.now() - 1000 * 60 * 180,
        reason: 'Domain in verified allowlist'
      }
    ];
  }

  private saveLogs() {
    try {
      localStorage.setItem('niva_action_safety_logs', JSON.stringify(this.actionLogs.slice(0, 30)));
    } catch {
      // Fallback
    }
  }

  public getConfig(): ActionSafetyConfig {
    return { ...this.config };
  }

  public subscribe(listener: (config: ActionSafetyConfig) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public updateConfig(partial: Partial<ActionSafetyConfig>) {
    this.config = { ...this.config, ...partial };
    this.saveConfig();
  }

  public normalizeUrl(urlOrDomain: string): URL | null {
    if (!urlOrDomain || typeof urlOrDomain !== 'string') {
      return null;
    }

    try {
      const trimmed = urlOrDomain.trim();
      if (!trimmed) {
        return null;
      }
      const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
      const parsed = new URL(candidate);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  public isDomainAllowed(urlOrDomain: string): boolean {
    if (!urlOrDomain) return false;
    let hostname = urlOrDomain.trim().toLowerCase();
    try {
      if (hostname.includes('://')) {
        hostname = new URL(hostname).hostname;
      } else {
        hostname = hostname.split('/')[0].split('?')[0];
      }
    } catch {
      // If invalid url format, use raw input
    }
    hostname = hostname.replace(/^www\./, '');

    return this.config.allowedDomains.some((allowed) => {
      const cleanAllowed = allowed.toLowerCase().replace(/^www\./, '');
      return hostname === cleanAllowed || hostname.endsWith(`.${cleanAllowed}`);
    });
  }

  public openApprovedUrl(url: string, opts?: { sameTab?: boolean }): boolean {
    const parsed = this.normalizeUrl(url);
    if (!parsed) {
      return false;
    }

    if (!this.isDomainAllowed(parsed.href)) {
      return false;
    }

    const target = parsed.href;
    if (opts?.sameTab !== false) {
      window.location.assign(target);
      return true;
    }

    const opened = window.open(target, '_blank', 'noopener,noreferrer');
    if (opened) {
      return true;
    }
    window.location.assign(target);
    return true;
  }

  public addAllowedDomain(domain: string): boolean {
    const clean = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    if (!clean || this.config.allowedDomains.includes(clean)) return false;
    this.config.allowedDomains = [...this.config.allowedDomains, clean];
    this.saveConfig();
    return true;
  }

  public removeAllowedDomain(domain: string) {
    const clean = domain.trim().toLowerCase().replace(/^www\./, '');
    this.config.allowedDomains = this.config.allowedDomains.filter((d) => d.toLowerCase() !== clean);
    this.saveConfig();
  }

  public resetAllowedDomains() {
    this.config.allowedDomains = [...DEFAULT_ALLOWED_DOMAINS];
    this.saveConfig();
  }

  public logAction(item: Omit<ActionLogItem, 'id' | 'timestamp'>) {
    const entry: ActionLogItem = {
      ...item,
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now()
    };
    this.actionLogs = [entry, ...this.actionLogs];
    this.saveLogs();
  }

  public getRecentLogs(): ActionLogItem[] {
    return [...this.actionLogs];
  }

  public sanitizePrompt(input: string): string {
    if (!this.config.sanitizeInputs || !input) return input;
    // Client-side regex protection to scrub common inadvertent API keys or secret tokens
    return input
      .replace(/sk-[A-Za-z0-9]{20,}/g, '[REDACTED_API_KEY]')
      .replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_GOOGLE_KEY]')
      .replace(/ghp_[A-Za-z0-9]{36}/g, '[REDACTED_GITHUB_TOKEN]')
      .replace(/bearer\s+[A-Za-z0-9._~+/-]+=*/gi, 'Bearer [REDACTED_TOKEN]');
  }
}

export const actionSafetyService = new ActionSafetyService();
export const securityService = actionSafetyService; // Backwards-compatible alias for existing imports
