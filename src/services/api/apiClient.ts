export interface ChatRequest {
  message: string;
  conversationId?: string | null;
  language?: string | null;
}

export interface ChatResponse {
  response: string;
  conversationId: string;
  metadata?: Record<string, any>;
}

export interface LiveTokenRequest {
  sessionId?: string | null;
  model?: string | null;
}

export interface LiveTokenResponse {
  token: string;
  expiresAt?: string | null;
  model: string;
  sessionId?: string | null;
  provider: 'google-gemini';
}

export interface ToolExecutionRequest {
  tool: string;
  arguments?: Record<string, any>;
}

export interface ToolExecutionResponse {
  success: boolean;
  tool: string;
  result: Record<string, any>;
}

export interface AuthPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
}

export interface AuthUserResponse {
  id: string;
  name: string;
  email: string;
  createdAt?: number | null;
}

export interface AuthTokenResponse extends AuthUserResponse {
  accessToken: string;
  tokenType: string;
}

const DEFAULT_API_BASE_URL = import.meta.env.DEV
  ? 'http://localhost:8000/api'
  : '';

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ||
  DEFAULT_API_BASE_URL;
const AUTH_TOKEN_KEY = 'niva_auth_token';
const USER_SESSION_KEY = 'niva_user_session';

const clearAuthState = () => {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_SESSION_KEY);
  } catch {
    // no-op in restricted/browser-only contexts
  }
  window.dispatchEvent(new CustomEvent('niva-auth-changed', { detail: null }));
};

class ApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private getStoredToken(): string | null {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      return token ? token.trim() : null;
    } catch {
      return null;
    }
  }

  private async request<T>(path: string, init: RequestInit = {}, body?: unknown): Promise<T> {
    const headers = new Headers(init.headers ?? {});
    const isAuthEndpoint = path === '/auth/login' || path === '/auth/signup' || path === '/auth/me';
    const token = !isAuthEndpoint ? this.getStoredToken() : null;

    if (body !== undefined && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers,
      body: body !== undefined ? JSON.stringify(body) : init.body ?? undefined,
    });

    if (!response.ok) {
      let errorDetail: any = undefined;
      try {
        errorDetail = await response.json();
      } catch {
        // ignore malformed error bodies; keep a generic message below
      }

      if (response.status === 401 && !isAuthEndpoint) {
        clearAuthState();
      }

      const message = errorDetail?.error?.message || errorDetail?.detail?.message || errorDetail?.message || `Request failed with status ${response.status}`;
      const error = new Error(message) as Error & {
        status?: number;
        code?: string;
      };

      error.status = response.status;
      error.code = errorDetail?.error?.code || errorDetail?.detail?.code || errorDetail?.code;
      throw error;
    }

    return response.json() as Promise<T>;
  }

  async getHealth(): Promise<{ status: string; service: string; gemini_configured: boolean; model: string }> {
    return this.request('/health');
  }

  async getStatus(): Promise<{
    app_name: string;
    environment: string;
    backend_url: string;
    frontend_origins: string[];
    gemini_configured: boolean;
    model: string;
    live_model: string;
  }> {
    return this.request('/status');
  }

  async login(payload: AuthPayload): Promise<AuthTokenResponse> {
    return this.request('/auth/login', { method: 'POST' }, payload);
  }

  async signup(payload: SignupPayload): Promise<AuthTokenResponse> {
    return this.request('/auth/signup', { method: 'POST' }, payload);
  }

  async getCurrentUser(): Promise<AuthUserResponse> {
    return this.request('/auth/me');
  }

  async chat(payload: ChatRequest): Promise<ChatResponse> {
    return this.request('/chat', { method: 'POST' }, payload);
  }

  async requestLiveToken(payload: LiveTokenRequest = {}): Promise<LiveTokenResponse> {
    return this.request('/live/token', { method: 'POST' }, payload);
  }

  async executeTool(payload: ToolExecutionRequest): Promise<ToolExecutionResponse> {
    return this.request('/tools/execute', { method: 'POST' }, payload);
  }
}

export const apiClient = new ApiClient();
