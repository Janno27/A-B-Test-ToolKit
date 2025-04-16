import { FC } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Label
} from 'recharts';

interface BarChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

interface HorizontalBarChartProps {
  data: BarChartDataPoint[];
  width?: number | string;
  height?: number | string;
  title?: string;
  defaultColor?: string;
  referenceLine?: number;
  referenceLineLabel?: string;
}

const HorizontalBarChart: FC<HorizontalBarChartProps> = ({
  data,
  width = '100%',
  height = 400,
  title,
  defaultColor = "#8884d8",
  referenceLine,
  referenceLineLabel = "Reference"
}) => {
  // Sort data by name to ensure consistent order (Control first, then Variant)
  const sortedData = [...data].sort((a, b) => a.name.localeCompare(b.name));

  // Calculate uplift percentage if we have both control and variant
  let uplift = 0;
  let upliftPercentage = "0%";
  
  if (data.length >= 2) {
    const controlValue = data.find(d => d.name === "Control")?.value || 0;
    const variantValue = data.find(d => d.name === "Variant")?.value || 0;
    
    if (controlValue > 0) {
      uplift = ((variantValue - controlValue) / controlValue) * 100;
      upliftPercentage = `${uplift > 0 ? '+' : ''}${uplift.toFixed(2)}%`;
    }
  }

  // Custom Tooltip to display information
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const isControl = label === "Control";
      
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
          <p className="font-bold text-lg border-b pb-1 mb-2">{label}</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            <p className="font-medium">Conversion Rate:</p>
            <p className="text-right">{(payload[0].value * 100).toFixed(2)}%</p>
            
            {!isControl && (
              <>
                <p className="font-medium">Uplift:</p>
                <p className="text-right" style={{ color: uplift >= 0 ? 'green' : 'red' }}>
                  {upliftPercentage}
                </p>
              </>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Bar renderer with dynamic colors
  const CustomBar = (props: any) => {
    const { x, y, width, height, fill, dataKey, payload } = props;
    const color = payload.color || defaultColor;
    
    return <rect x={x} y={y} width={width} height={height} fill={color} />;
  };

  return (
    <div className="w-full">
      <ResponsiveContainer width={width} height={height}>
        <BarChart
          data={sortedData}
          layout="vertical"
          margin={{ top: 20, right: 50, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis 
            type="number" 
            tickFormatter={(value) => `${(value * 100).toFixed(1)}%`}
            domain={[0, 'dataMax * 1.2']}
            label={{ value: 'Conversion Rate', position: 'insideBottom', offset: -10 }}
          />
          <YAxis 
            dataKey="name" 
            type="category" 
            scale="band" 
            tick={{ fontSize: 14, fontWeight: 500 }} 
            width={100}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {referenceLine !== undefined && (
            <ReferenceLine 
              x={referenceLine} 
              stroke="#ff7300" 
              strokeDasharray="3 3" 
            >
              <Label value={referenceLineLabel} position="top" fill="#ff7300" />
            </ReferenceLine>
          )}
          
          <Bar 
            dataKey="value" 
            shape={<CustomBar />}
            barSize={40}
            label={{
              position: 'right',
              formatter: (value: number) => `${(value * 100).toFixed(2)}%`,
              fill: '#000',
              fontSize: 12,
              fontWeight: 'bold'
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HorizontalBarChart; 