import React from "react";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Rectangle,
  Legend,
  RectangleProps
} from "recharts";

interface BoxPlotData {
  name: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
}

interface BoxPlotProps {
  data: BoxPlotData[];
  yAxisLabel?: string;
  controlColor?: string;
  variationColor?: string;
}

// Définition des props pour CustomTooltip
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: BoxPlotData }>;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    return (
      <div className="bg-white border border-gray-200 p-3 rounded shadow-md">
        <p className="font-medium">{data.name}</p>
        <p>Min: {data.min.toFixed(2)}%</p>
        <p>Q1: {data.q1.toFixed(2)}%</p>
        <p>Median: {data.median.toFixed(2)}%</p>
        <p>Q3: {data.q3.toFixed(2)}%</p>
        <p>Max: {data.max.toFixed(2)}%</p>
      </div>
    );
  }

  return null;
};

// Définition des props pour CustomBox
interface CustomBoxProps extends RectangleProps {
  datum: BoxPlotData;
  color: string;
}

const CustomBox = (props: CustomBoxProps) => {
  const { x, y, width, height, datum, color } = props;
  
  // Calcul des positions (identique)
  const boxWidth = width! * 0.6;
  const halfBoxWidth = boxWidth / 2;
  const centerX = x! + width! / 2;
  
  const minY = y! + height! * (1 - datum.min / 100);
  const q1Y = y! + height! * (1 - datum.q1 / 100);
  const medianY = y! + height! * (1 - datum.median / 100);
  const q3Y = y! + height! * (1 - datum.q3 / 100);
  const maxY = y! + height! * (1 - datum.max / 100);
  
  return (
    <g>
      {/* Whiskers */}
      <line x1={centerX} y1={minY} x2={centerX} y2={q1Y} stroke={color} strokeWidth={1.5} />
      <line x1={centerX} y1={q3Y} x2={centerX} y2={maxY} stroke={color} strokeWidth={1.5} />
      
      {/* Lignes horizontales */}
      <line x1={centerX - halfBoxWidth} y1={minY} x2={centerX + halfBoxWidth} y2={minY} stroke={color} strokeWidth={1.5} />
      <line x1={centerX - halfBoxWidth} y1={maxY} x2={centerX + halfBoxWidth} y2={maxY} stroke={color} strokeWidth={1.5} />
      
      {/* Boîte IQR */}
      <rect
        x={centerX - halfBoxWidth}
        y={q3Y}
        width={boxWidth}
        height={q1Y - q3Y}
        fill={color}
        fillOpacity={0.3}
        stroke={color}
        strokeWidth={1.5}
      />
      
      {/* Médiane */}
      <line
        x1={centerX - halfBoxWidth}
        y1={medianY}
        x2={centerX + halfBoxWidth}
        y2={medianY}
        stroke={color}
        strokeWidth={2}
      />
    </g>
  );
};

export const BoxPlot: React.FC<BoxPlotProps> = ({
  data,
  yAxisLabel = "Value",
  controlColor = "#8884d8",
  variationColor = "#82ca9d"
}) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 30
        }}
      >
        <CartesianGrid strokeDasharray="3 3" opacity={0.7} />
        <XAxis dataKey="name" />
        <YAxis 
          label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }} 
          domain={[0, 'dataMax + 5']}
          unit="%"
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        
        {data.map((entry, index) => (
          <Bar
            key={`boxplot-${index}`}
            dataKey="median"
            fill="transparent"
            stroke="transparent"
            shape={(props: RectangleProps) => (
              <CustomBox
                {...props}
                datum={entry}
                color={index === 0 ? controlColor : variationColor}
              />
            )}
          />
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  );
};
