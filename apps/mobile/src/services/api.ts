import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.client.interceptors.request.use(async (config) => {
      const token = await AsyncStorage.getItem('@masco/auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Unauthorized - clear token and redirect to login
          await AsyncStorage.removeItem('@masco/auth_token');
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.client.post('/auth/login', { email, password });
  }

  async register(email: string, password: string, name: string) {
    return this.client.post('/auth/register', { email, password, name });
  }

  // Product endpoints
  async getProducts(page = 1, limit = 20) {
    return this.client.get('/products', { params: { page, limit } });
  }

  async getProduct(id: string) {
    return this.client.get(`/products/${id}`);
  }

  async searchProducts(query: string) {
    return this.client.get('/search/fulltext', { params: { query } });
  }

  async getProductsByType(type: string) {
    return this.client.get('/products/type/:type'.replace(':type', type));
  }

  // Saved products
  async getSavedProducts() {
    return this.client.get('/saved-products');
  }

  async saveProduct(productId: string, notes?: string) {
    return this.client.post('/saved-products', { productId, notes });
  }

  async unsaveProduct(productId: string) {
    return this.client.delete(`/saved-products/${productId}`);
  }

  // Comparisons
  async compareProducts(ids: string[]) {
    return this.client.post('/comparison/compare', { productIds: ids });
  }

  // Recommendations
  async getRecommendations(productId: string) {
    return this.client.get(`/recommendations/similar/${productId}`);
  }

  async getPersonalizedRecommendations() {
    return this.client.get('/recommendations/personalized');
  }

  // Price Alerts
  async getPriceAlerts() {
    return this.client.get('/price-alerts');
  }

  async createPriceAlert(productId: string, targetPrice: number) {
    return this.client.post('/price-alerts', { productId, targetPrice });
  }

  async deletePriceAlert(alertId: string) {
    return this.client.delete(`/price-alerts/${alertId}`);
  }

  // Market Intelligence
  async getMarketTrends() {
    return this.client.get('/market-intelligence/brands');
  }

  async getPriceTrends(productId: string, days = 90) {
    return this.client.get(`/market-intelligence/price-trends/${productId}`, {
      params: { days },
    });
  }

  // Dashboard
  async getDashboardMetrics() {
    return this.client.get('/dashboard/metrics/realtime');
  }

  async getDashboardAlerts() {
    return this.client.get('/dashboard/alerts');
  }

  // Videos
  async getProductVideos(productId: string) {
    return this.client.get(`/videos/product/${productId}`);
  }

  // Quality Analysis
  async getQualityAnalysis(productId: string) {
    return this.client.get(`/quality/${productId}`);
  }

  // Price Optimization
  async getPriceOptimization(productId: string) {
    return this.client.get(`/price-optimization/margins/${productId}`);
  }
}

export const apiClient = new APIClient();
