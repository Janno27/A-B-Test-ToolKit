import { FC } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

interface HistogramDataPoint {
  bin: string;
  control: number;
  variant: number;
}

interface ComparativeHistogramProps {
  data: HistogramDataPoint[];
  width?: number | string;
  height?: number | string;
  title?: string;
  controlColor?: string;
  variantColor?: string;
  controlLabel?: string;
  variantLabel?: string;
}

const ComparativeHistogram: FC<ComparativeHistogramProps> = ({
  data,
  width = '100%',
  height = 400,
  title,
  controlColor = "#8884d8",
  variantColor = "#82ca9d",
  controlLabel = "Contrôle",
  variantLabel = "Variant"
}) => {
  // Custom Tooltip pour afficher les informations de l'histogramme
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 shadow-md rounded-md">
          <p className="font-bold">{`Bin: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`value-${index}`} style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value.toFixed(2)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-medium mb-2">{title}</h3>}
      <ResponsiveContainer width={width} height={height}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="bin" />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            dataKey="control" 
            name={controlLabel} 
            fill={controlColor} 
            opacity={0.8}
          />
          <Bar 
            dataKey="variant" 
            name={variantLabel} 
            fill={variantColor} 
            opacity={0.8}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ComparativeHistogram; 