import { FC, useEffect, useState } from 'react';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ZAxis,
  Legend
} from 'recharts';

interface DataPoint {
  orderValue: number;
  frequency: number;
  name: string;
  color?: string;
}

interface ScatterPlotProps {
  data: DataPoint[];
  width?: number | string;
  height?: number | string;
}

const ScatterPlot: FC<ScatterPlotProps> = ({
  data,
  width = '100%',
  height = 400
}) => {
  const [filteredData, setFilteredData] = useState<DataPoint[]>([]);
  
  // Filter and process data when component mounts or data changes
  useEffect(() => {
    if (!data || data.length === 0) return;
    
    // Filter out extreme outliers for better visualization
    // Get the 99th percentile of order values
    const orderValues = data.map(d => d.orderValue).sort((a, b) => a - b);
    const p99Index = Math.floor(orderValues.length * 0.99);
    const maxOrderValue = p99Index > 0 ? orderValues[p99Index] : Math.max(...orderValues);
    
    // Limit to reasonable values to improve chart readability
    const filtered = data.filter(d => d.orderValue <= maxOrderValue * 1.2);
    
    // Ensure we don't filter too much data
    const finalData = filtered.length < data.length * 0.8 ? data : filtered;
    
    setFilteredData(finalData);
  }, [data]);

  // Group data by name to separate control and variant
  const controlData = filteredData.filter(item => item.name === 'Control' || item.name === 'Contrôle');
  const variantData = filteredData.filter(item => item.name === 'Variant' || item.name === 'Variante');
  
  // Colors
  const controlColor = controlData[0]?.color || "#8884d8";
  const variantColor = variantData[0]?.color || "#82ca9d";

  // Custom tooltip to show details
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-sm p-3 border border-gray-100 shadow-md rounded-md text-sm">
          <div className="font-bold pb-1 mb-1.5 border-b flex items-center" style={{ color: dataPoint.color }}>
            <div className="w-2.5 h-2.5 mr-1.5 rounded-sm" style={{ backgroundColor: dataPoint.color }}/>
            {dataPoint.name === 'Control' || dataPoint.name === 'Contrôle' ? 'Control' : 
             dataPoint.name === 'Variant' || dataPoint.name === 'Variante' ? 'Variant' : dataPoint.name}
          </div>
          
          <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 items-center">
            <div className="text-xs text-gray-500">Order Value:</div>
            <div className="text-right font-medium">{dataPoint.orderValue.toFixed(2)}€</div>
            
            <div className="text-xs text-gray-500">Frequency:</div>
            <div className="text-right font-medium">{dataPoint.frequency} orders</div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate domains for better axis display
  const maxFrequency = Math.max(
    ...filteredData.map(d => d.frequency),
    10 // Minimum value to ensure the chart doesn't collapse
  );
  
  const minOrderValue = Math.min(...filteredData.map(d => d.orderValue), 0);
  const maxOrderValue = Math.max(...filteredData.map(d => d.orderValue), 100);

  // Debug
  console.log("Scatter Plot Data:", data?.length);
  console.log("Filtered Data:", filteredData?.length);
  console.log("Control Data:", controlData?.length);
  console.log("Variant Data:", variantData?.length);

  return (
    <div className="w-full">
      {filteredData && filteredData.length > 0 ? (
        <>
          <ResponsiveContainer width={width} height={height}>
            <ScatterChart
              margin={{ top: 20, right: 30, bottom: 30, left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis 
                type="number" 
                dataKey="orderValue" 
                name="Order Value" 
                unit="€" 
                domain={[minOrderValue * 0.95, maxOrderValue * 1.05]}
                label={{ 
                  value: 'Order Value (€)', 
                  position: 'insideBottom', 
                  offset: -10,
                  style: { fill: '#666' }
                }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={{ stroke: '#e5e7eb' }}
                tick={{ fill: '#666' }}
              />
              <YAxis 
                type="number" 
                dataKey="frequency" 
                name="Frequency" 
                domain={[0, maxFrequency * 1.1]}
                label={{ 
                  value: 'Frequency (orders)', 
                  angle: -90, 
                  position: 'insideLeft', 
                  offset: 0,
                  style: { fill: '#666' }
                }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={{ stroke: '#e5e7eb' }}
                tick={{ fill: '#666' }}
              />
              <ZAxis range={[60, 400]} /> {/* Increased point size range */}
              <Tooltip content={<CustomTooltip />} cursor={{ opacity: 0.2 }} />
              <Legend />
              
              {controlData.length > 0 && (
                <Scatter 
                  name="Control" 
                  data={controlData} 
                  fill={controlColor}
                  stroke={controlColor}
                  strokeWidth={1}
                  fillOpacity={0.7}
                  shape="circle" 
                />
              )}
              
              {variantData.length > 0 && (
                <Scatter 
                  name="Variant" 
                  data={variantData} 
                  fill={variantColor}
                  stroke={variantColor}
                  strokeWidth={1}
                  fillOpacity={0.7}
                  shape="circle" 
                />
              )}
            </ScatterChart>
          </ResponsiveContainer>
          
          <div className="mt-2 text-xs text-gray-500 text-center px-6">
            <p>This chart shows the relationship between order value (X-axis) and frequency (Y-axis).</p>
            <p>Each point represents the number of orders for a specific order value.</p>
            <p>Larger points represent more significant data points.</p>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-[400px] bg-gray-50 border border-gray-200 rounded-md">
          <p className="text-gray-500">No data available for scatter plot visualization</p>
        </div>
      )}
    </div>
  );
};

export default ScatterPlot; 