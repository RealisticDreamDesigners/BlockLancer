'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export interface DonutChartData {
  label: string;
  value: number;
  color: string;
}

export interface DonutChartProps {
  data: DonutChartData[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string | number;
  className?: string;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 shadow-lg">
        <p className="text-xs font-medium text-gray-900 dark:text-white">
          {payload[0].name}: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
}

export function DonutChart({
  data,
  size = 200,
  thickness = 40,
  centerLabel,
  centerValue,
  className = '',
}: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const displayValue = centerValue ?? total;

  if (total === 0) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <div
          className="rounded-full border-4 border-gray-200 dark:border-gray-700 flex items-center justify-center"
          style={{ width: size * 0.7, height: size * 0.7 }}
        >
          <span className="text-sm text-gray-400 dark:text-gray-500">No data</span>
        </div>
      </div>
    );
  }

  const innerRadius = (size / 2) - thickness;
  const outerRadius = size / 2 - 10;

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data.filter(d => d.value > 0)}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey="value"
            nameKey="label"
            stroke="none"
          >
            {data.filter(d => d.value > 0).map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">{displayValue}</span>
        {centerLabel && (
          <span className="text-xs text-gray-500 dark:text-gray-400">{centerLabel}</span>
        )}
      </div>
    </div>
  );
}
