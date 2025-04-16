import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

interface HistogramProps {
  data: Array<Record<string, any>>;
  xKey: string;
  yKey: string;
  groupKey: string;
  colors: Record<string, string>;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 p-3 rounded shadow-md">
        <p className="font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }

  return null;
};

export const Histogram: React.FC<HistogramProps> = ({
  data,
  xKey,
  yKey,
  groupKey,
  colors,
  xAxisLabel = "Value",
  yAxisLabel = "Count"
}) => {
  // Get unique groups for creating bars
  const groups = Array.from(new Set(data.map(item => item[groupKey])));
  
  // Group data by bin for grouped bar chart
  const groupedData = data.reduce((acc: any[], curr) => {
    const bin = curr[xKey];
    const existingBin = acc.find(item => item[xKey] === bin);
    
    if (existingBin) {
      existingBin[curr[groupKey]] = curr[yKey];
    } else {
      const newBin: Record<string, any> = { [xKey]: bin };
      newBin[curr[groupKey]] = curr[yKey];
      acc.push(newBin);
    }
    
    return acc;
  }, []);
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={groupedData}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 50
        }}
      >
        <CartesianGrid strokeDasharray="3 3" opacity={0.7} />
        <XAxis 
          dataKey={xKey} 
          angle={-30} 
          textAnchor="end" 
          height={60}
          label={{ value: xAxisLabel, position: 'insideBottom', offset: -10 }}
        />
        <YAxis 
          label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }} 
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        
        {groups.map((group, index) => (
          <Bar
            key={`group-${index}`}
            dataKey={group as string}
            name={group as string}
            fill={colors[group as string] || `#${Math.floor(Math.random()*16777215).toString(16)}`}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}; 