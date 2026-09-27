import { apiClient } from '../api/apiClient';
import { User } from '../../types/assistant';

const STORAGE_KEY = 'niva_user_session';
const TOKEN_KEY = 'niva_auth_token';

const toUser = (payload: { id: string; name: string; email: string; createdAt?: number | null }): User => ({
  id: payload.id,
  name: payload.name,
  email: payload.email,
  createdAt: payload.createdAt ?? Date.now(),
});

export const authService = {
  getToken(): string | null {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      return token ? token.trim() : null;
    } catch {
      return null;
    }
  },

  getUser(): User | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) as User : null;
    } catch {
      return null;
    }
  },

  async restoreSession(): Promise<User | null> {
    const token = this.getToken();
    if (!token) {
      this.logout();
      return null;
    }

    try {
      const currentUser = await apiClient.getCurrentUser();
      const user = toUser(currentUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      window.dispatchEvent(new CustomEvent('niva-auth-changed', { detail: user }));
      return user;
    } catch {
      this.logout();
      return null;
    }
  },

  async login(email: string, password: string): Promise<User> {
    if (!email || !email.includes('@')) {
      throw new Error('Please enter a valid work or personal email address.');
    }

    const response = await apiClient.login({ email, password });
    const user = toUser(response);
    localStorage.setItem(TOKEN_KEY, response.accessToken);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    window.dispatchEvent(new CustomEvent('niva-auth-changed', { detail: user }));
    return user;
  },

  async signup(name: string, email: string, password: string, confirmPassword: string): Promise<User> {
    if (!name.trim()) {
      throw new Error('Please enter your full name.');
    }
    if (!email || !email.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }
    if (password !== confirmPassword) {
      throw new Error('Passwords do not match.');
    }

    const response = await apiClient.signup({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
    });

    const user = toUser(response);
    localStorage.setItem(TOKEN_KEY, response.accessToken);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    window.dispatchEvent(new CustomEvent('niva-auth-changed', { detail: user }));
    return user;
  },

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('niva-auth-changed', { detail: null }));
  },

  updateProfile(name: string): User | null {
    const current = this.getUser();
    if (!current) return null;
    const updated = { ...current, name };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('niva-auth-changed', { detail: updated }));
    return updated;
  }
};
