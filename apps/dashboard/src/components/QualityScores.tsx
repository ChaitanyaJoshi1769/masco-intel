import React from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

export const QualityScores: React.FC = () => {
  const data = [
    { aspect: 'Quality', value: 72 },
    { aspect: 'Serviceability', value: 75 },
    { aspect: 'Longevity', value: 68 },
    { aspect: 'Repairability', value: 70 },
    { aspect: 'Contractor Ready', value: 70 },
  ];

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
      <h2 className="text-xl font-bold text-white mb-4">Quality Assessment</h2>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={data}>
          <PolarGrid stroke="#475569" />
          <PolarAngleAxis dataKey="aspect" stroke="#cbd5e1" />
          <PolarRadiusAxis stroke="#475569" />
          <Radar
            name="Score"
            dataKey="value"
            stroke="#8b5cf6"
            fill="#8b5cf6"
            fillOpacity={0.6}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
