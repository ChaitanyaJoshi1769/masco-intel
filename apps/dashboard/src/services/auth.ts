import { apiClient } from './api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

class AuthService {
  private currentUser: User | null = null;
  private tokens: AuthTokens | null = null;
  private listeners: Set<(user: User | null) => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const storedTokens = localStorage.getItem('auth_tokens');
      const storedUser = localStorage.getItem('current_user');

      if (storedTokens) {
        this.tokens = JSON.parse(storedTokens);
      }
      if (storedUser) {
        this.currentUser = JSON.parse(storedUser);
      }
    } catch (error) {
      console.error('Failed to load auth from storage:', error);
      this.clearStorage();
    }
  }

  private saveToStorage(): void {
    try {
      if (this.tokens) {
        localStorage.setItem('auth_tokens', JSON.stringify(this.tokens));
      }
      if (this.currentUser) {
        localStorage.setItem('current_user', JSON.stringify(this.currentUser));
      }
    } catch (error) {
      console.error('Failed to save auth to storage:', error);
    }
  }

  private clearStorage(): void {
    localStorage.removeItem('auth_tokens');
    localStorage.removeItem('current_user');
    this.tokens = null;
    this.currentUser = null;
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.currentUser));
  }

  async login(email: string, password: string): Promise<User> {
    try {
      const response = await apiClient.post<{
        user: User;
        access_token: string;
        refresh_token?: string;
      }>('/api/auth/login', { email, password });

      this.tokens = {
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
      };
      this.currentUser = response.user;
      this.saveToStorage();
      this.notifyListeners();

      return this.currentUser;
    } catch (error) {
      this.clearStorage();
      throw error;
    }
  }

  async register(
    email: string,
    password: string,
    name: string
  ): Promise<User> {
    try {
      const response = await apiClient.post<{
        user: User;
        access_token: string;
        refresh_token?: string;
      }>('/api/auth/register', { email, password, name });

      this.tokens = {
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
      };
      this.currentUser = response.user;
      this.saveToStorage();
      this.notifyListeners();

      return this.currentUser;
    } catch (error) {
      this.clearStorage();
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      if (this.tokens?.accessToken) {
        await apiClient.post('/api/auth/logout', {
          token: this.tokens.accessToken,
        });
      }
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      this.clearStorage();
      this.notifyListeners();
    }
  }

  async refreshToken(): Promise<string> {
    if (!this.tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await apiClient.post<{ access_token: string }>(
        '/api/auth/refresh',
        { refresh_token: this.tokens.refreshToken }
      );

      this.tokens.accessToken = response.access_token;
      this.saveToStorage();

      return this.tokens.accessToken;
    } catch (error) {
      this.clearStorage();
      this.notifyListeners();
      throw error;
    }
  }

  async getMe(): Promise<User> {
    const response = await apiClient.get<User>('/api/auth/me', {
      headers: this.getAuthHeaders(),
    });

    this.currentUser = response;
    this.saveToStorage();
    this.notifyListeners();

    return response;
  }

  getAuthHeaders(): Record<string, string> {
    if (!this.tokens?.accessToken) {
      return {};
    }

    return {
      Authorization: `Bearer ${this.tokens.accessToken}`,
    };
  }

  getAccessToken(): string | null {
    return this.tokens?.accessToken || null;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null && this.tokens?.accessToken !== null;
  }

  subscribe(listener: (user: User | null) => void): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const authService = new AuthService();

export default authService;
