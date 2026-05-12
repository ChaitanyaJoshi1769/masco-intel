import React, { useMemo } from 'react';

interface Product {
  id: string;
  title: string;
  price: number;
  retailer: string;
}

export const ProductStats: React.FC<{ products: Product[] }> = ({ products }) => {
  const stats = useMemo(() => {
    if (!products.length) {
      return {
        totalProducts: 0,
        avgPrice: 0,
        minPrice: 0,
        maxPrice: 0,
        retailers: 0,
      };
    }

    const prices = products.map((p) => p.price);
    const retailers = new Set(products.map((p) => p.retailer));

    return {
      totalProducts: products.length,
      avgPrice: (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2),
      minPrice: Math.min(...prices).toFixed(2),
      maxPrice: Math.max(...prices).toFixed(2),
      retailers: retailers.size,
    };
  }, [products]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <StatCard label="Total Products" value={stats.totalProducts} icon="📦" />
      <StatCard label="Avg Price" value={`$${stats.avgPrice}`} icon="💰" />
      <StatCard label="Min Price" value={`$${stats.minPrice}`} icon="📉" />
      <StatCard label="Max Price" value={`$${stats.maxPrice}`} icon="📈" />
      <StatCard label="Retailers" value={stats.retailers} icon="🏪" />
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: any; icon: string }> = ({ label, value, icon }) => (
  <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 hover:border-slate-600 transition-colors">
    <p className="text-slate-400 text-sm mb-2">{icon} {label}</p>
    <p className="text-3xl font-bold text-white">{value}</p>
  </div>
);
