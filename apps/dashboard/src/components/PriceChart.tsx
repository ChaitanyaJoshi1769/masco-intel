import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface Product {
  id: string;
  title: string;
  price: number;
  retailer: string;
}

export const PriceChart: React.FC<{ products: Product[] }> = ({ products }) => {
  // Group products by retailer and calculate averages
  const retailerData = products.reduce(
    (acc, product) => {
      const retailer = product.retailer || 'Unknown';
      if (!acc[retailer]) {
        acc[retailer] = { name: retailer, prices: [], count: 0 };
      }
      acc[retailer].prices.push(product.price);
      acc[retailer].count += 1;
      return acc;
    },
    {} as Record<string, any>
  );

  const chartData = Object.values(retailerData).map((data: any) => ({
    retailer: data.name,
    average: (data.prices.reduce((a: number, b: number) => a + b, 0) / data.prices.length).toFixed(2),
    count: data.count,
  }));

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
      <h2 className="text-xl font-bold text-white mb-4">Price by Retailer</h2>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="retailer" stroke="#cbd5e1" />
            <YAxis stroke="#cbd5e1" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="average"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6' }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-slate-400">No data available</p>
      )}
    </div>
  );
};
