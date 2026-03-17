'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export interface HorizontalBarData {
  label: string;
  value: number;
  color?: string;
}

export interface HorizontalBarChartProps {
  data: HorizontalBarData[];
  height?: number;
  barColor?: string;
  className?: string;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: HorizontalBarData; value: number }> }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 shadow-lg">
        <p className="text-xs font-medium text-gray-900 dark:text-white">
          {payload[0].payload.label}: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
}

export function HorizontalBarChart({
  data,
  height = 200,
  barColor = '#2563eb',
  className = '',
}: HorizontalBarChartProps) {
  if (!data.length || data.every(d => d.value === 0)) {
    return (
      <div className={`flex items-center justify-center text-sm text-gray-400 dark:text-gray-500 ${className}`} style={{ height }}>
        No data available
      </div>
    );
  }

  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 0 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="label"
            width={90}
            tick={{ fontSize: 12, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
          <Bar
            dataKey="value"
            radius={[0, 4, 4, 0]}
            barSize={20}
            background={{ fill: 'rgba(156,163,175,0.1)', radius: 4 }}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || barColor} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
