import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const ContractorIntelligence: React.FC = () => {
  const data = [
    { failureRate: 0.08, longevity: 10, size: 30, brand: 'Delta' },
    { failureRate: 0.02, longevity: 20, size: 50, brand: 'Brizo' },
    { failureRate: 0.03, longevity: 18, size: 45, brand: 'Hansgrohe' },
    { failureRate: 0.05, longevity: 12, size: 35, brand: 'Moen' },
    { failureRate: 0.04, longevity: 15, size: 40, brand: 'Kohler' },
  ];

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
      <h2 className="text-xl font-bold text-white mb-4">Contractor Intelligence</h2>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="failureRate"
            name="Failure Rate"
            stroke="#cbd5e1"
            label={{ value: 'Failure Rate', offset: 10, fill: '#cbd5e1' }}
          />
          <YAxis
            dataKey="longevity"
            name="Longevity (Years)"
            stroke="#cbd5e1"
            label={{ value: 'Longevity (Years)', angle: -90, position: 'insideLeft', fill: '#cbd5e1' }}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
            labelStyle={{ color: '#e2e8f0' }}
            cursor={{ strokeDasharray: '3 3' }}
          />
          <Scatter name="Brands" data={data} fill="#f59e0b" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};
