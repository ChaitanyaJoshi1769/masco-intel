import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { PriceChart } from './components/PriceChart';
import { ProductStats } from './components/ProductStats';
import { PriceComparison } from './components/PriceComparison';
import { QualityScores } from './components/QualityScores';
import { ContractorIntelligence } from './components/ContractorIntelligence';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch various analytics data
        const [priceRes, productsRes] = await Promise.all([
          axios.get(`${API_URL}/api/pricing/stats`).catch(() => ({ data: null })),
          axios.get(`${API_URL}/api/products/search?q=faucet&limit=100`).catch(() => ({ data: { data: [] } })),
        ]);

        setStats({
          prices: priceRes.data,
          products: productsRes.data?.data || [],
        });
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Masco Intel Analytics</h1>
          <p className="text-slate-400">Real-time pricing intelligence & market analysis</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-400">Loading analytics...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Grid */}
            <ProductStats products={stats?.products || []} />

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PriceChart products={stats?.products || []} />
              <PriceComparison products={stats?.products || []} />
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <QualityScores products={stats?.products || []} />
              <ContractorIntelligence products={stats?.products || []} />
            </div>

            {/* Market Summary */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
              <h2 className="text-xl font-bold text-white mb-4">Market Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-slate-400 text-sm">Avg Price</p>
                  <p className="text-2xl font-bold text-green-400">$156.42</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Price Range</p>
                  <p className="text-2xl font-bold text-blue-400">$45-$899</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Products Tracked</p>
                  <p className="text-2xl font-bold text-purple-400">{stats?.products?.length || 0}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Data Points</p>
                  <p className="text-2xl font-bold text-orange-400">1000+</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
