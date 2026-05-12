import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Product {
  id: string;
  title: string;
  price: number;
  brand: string;
  retailer: string;
}

export const PriceComparison: React.FC<{ products: Product[] }> = ({ products }) => {
  // Group by brand
  const brandData = products.slice(0, 10).map((product) => ({
    name: product.brand,
    price: product.price,
    retailer: product.retailer,
  }));

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
      <h2 className="text-xl font-bold text-white mb-4">Price by Brand (Top 10)</h2>
      {brandData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={brandData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#cbd5e1" angle={-45} textAnchor="end" height={80} />
            <YAxis stroke="#cbd5e1" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Legend />
            <Bar dataKey="price" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-slate-400">No data available</p>
      )}
    </div>
  );
};
