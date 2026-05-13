import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  brand: string;
  productType: string;
  finish: string;
  imageUrl?: string;
  specifications?: Record<string, any>;
  quality?: {
    score: number;
    serviceability: number;
    contractor: number;
  };
}

export interface SavedProduct extends Product {
  savedAt: string;
  notes?: string;
}

interface ProductStore {
  // Products
  products: Product[];
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;

  // Saved Products
  savedProducts: SavedProduct[];
  setSavedProducts: (products: SavedProduct[]) => void;
  saveProduct: (product: Product, notes?: string) => Promise<void>;
  unsaveProduct: (productId: string) => Promise<void>;
  updateProductNote: (productId: string, notes: string) => Promise<void>;

  // Filters & Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedFilters: Record<string, any>;
  setFilters: (filters: Record<string, any>) => void;

  // Loading
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Initialization
  loadSavedProducts: () => Promise<void>;
}

const SAVED_PRODUCTS_KEY = '@masco/saved_products';

export const useProductStore = create<ProductStore>((set, get) => ({
  // Products
  products: [],
  setProducts: (products) => set({ products }),
  addProduct: (product) => {
    const { products } = get();
    set({ products: [...products, product] });
  },

  // Saved Products
  savedProducts: [],
  setSavedProducts: (products) => set({ savedProducts: products }),

  saveProduct: async (product, notes) => {
    const { savedProducts } = get();
    const newSavedProduct: SavedProduct = {
      ...product,
      savedAt: new Date().toISOString(),
      notes,
    };
    const updated = [...savedProducts, newSavedProduct];
    set({ savedProducts: updated });
    await AsyncStorage.setItem(SAVED_PRODUCTS_KEY, JSON.stringify(updated));
  },

  unsaveProduct: async (productId) => {
    const { savedProducts } = get();
    const updated = savedProducts.filter((p) => p.id !== productId);
    set({ savedProducts: updated });
    await AsyncStorage.setItem(SAVED_PRODUCTS_KEY, JSON.stringify(updated));
  },

  updateProductNote: async (productId, notes) => {
    const { savedProducts } = get();
    const updated = savedProducts.map((p) =>
      p.id === productId ? { ...p, notes } : p
    );
    set({ savedProducts: updated });
    await AsyncStorage.setItem(SAVED_PRODUCTS_KEY, JSON.stringify(updated));
  },

  // Filters
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  selectedFilters: {},
  setFilters: (filters) => set({ selectedFilters: filters }),

  // Loading
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  // Initialization
  loadSavedProducts: async () => {
    try {
      const stored = await AsyncStorage.getItem(SAVED_PRODUCTS_KEY);
      if (stored) {
        set({ savedProducts: JSON.parse(stored) });
      }
    } catch (error) {
      console.error('Failed to load saved products:', error);
    }
  },
}));
