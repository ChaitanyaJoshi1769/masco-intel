const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface RequestOptions extends RequestInit {
  timeout?: number;
}

class APIClient {
  private baseURL: string;
  private defaultTimeout = 30000;

  constructor(baseURL: string = API_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const { timeout = this.defaultTimeout, ...fetchOptions } = options;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      throw error;
    }
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    });
  }

  async post<T>(
    endpoint: string,
    body?: any,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(
    endpoint: string,
    body?: any,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }
}

export const apiClient = new APIClient();

// API Methods organized by domain
export const dashboardAPI = {
  getOverview: () => apiClient.get('/api/analytics/dashboard/overview'),
  getMetrics: () => apiClient.get('/api/analytics/dashboard/metrics'),
  getTrends: () => apiClient.get('/api/analytics/dashboard/trends'),
};

export const productsAPI = {
  search: (query: string, limit: number = 20) =>
    apiClient.get(`/api/products/search?q=${query}&limit=${limit}`),
  getById: (id: string) => apiClient.get(`/api/products/${id}`),
  getPricing: (productId: string) =>
    apiClient.get(`/api/pricing/${productId}`),
  getComparison: (productId: string) =>
    apiClient.get(`/api/comparison/${productId}`),
};

export const marketplaceAPI = {
  getContractors: () => apiClient.get('/api/marketplace/profiles'),
  getServices: () => apiClient.get('/api/marketplace/services'),
  getOrders: () => apiClient.get('/api/marketplace/orders'),
  createOrder: (data: any) => apiClient.post('/api/marketplace/orders', data),
};

export const communityAPI = {
  getThreads: (category?: string) =>
    apiClient.get(`/api/forum/threads${category ? `?category=${category}` : ''}`),
  getThread: (id: string) => apiClient.get(`/api/forum/threads/${id}`),
  postReply: (threadId: string, content: string) =>
    apiClient.post(`/api/forum/threads/${threadId}/replies`, { content }),
};

export const subscriptionAPI = {
  getPlans: () => apiClient.get('/api/subscriptions/plans'),
  getCurrent: () => apiClient.get('/api/subscriptions/current'),
  getUsage: () => apiClient.get('/api/subscriptions/usage'),
  upgrade: (planId: string) =>
    apiClient.post('/api/subscriptions/upgrade', { planId }),
};

export const analyticsAPI = {
  getMetrics: () => apiClient.get('/api/analytics/metrics'),
  getTrends: (range: string = '30d') =>
    apiClient.get(`/api/analytics/trends?range=${range}`),
  export: (format: 'csv' | 'json') =>
    apiClient.get(`/api/analytics/export?format=${format}`),
};

export const chatbotAPI = {
  createConversation: () => apiClient.post('/api/chatbot/conversations'),
  getConversation: (id: string) =>
    apiClient.get(`/api/chatbot/conversations/${id}`),
  sendMessage: (conversationId: string, content: string) =>
    apiClient.post(`/api/chatbot/conversations/${conversationId}/messages`, {
      content,
    }),
  markHelpful: (messageId: string, helpful: boolean) =>
    apiClient.post(`/api/chatbot/messages/${messageId}/helpful`, { helpful }),
};

export default apiClient;
