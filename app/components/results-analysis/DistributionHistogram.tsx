import React, { FC } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';

interface HistogramDataPoint {
  bin: string;
  control: number;
  variant: number;
  binStart?: number;
  binEnd?: number;
}

interface DistributionHistogramProps {
  data: HistogramDataPoint[];
  width?: number | string;
  height?: number | string;
  controlColor?: string;
  variantColor?: string;
}

const DistributionHistogram: FC<DistributionHistogramProps> = ({
  data,
  width = '100%',
  height = 400,
  controlColor = "#8884d8",
  variantColor = "#82ca9d"
}) => {
  // Format bin labels more compactly for better display
  const formattedData = data?.map(item => {
    // If we have binStart and binEnd, use them to create a cleaner label
    if (item.binStart !== undefined && item.binEnd !== undefined) {
      const start = item.binStart.toFixed(0);
      const end = item.binEnd.toFixed(0);
      return {
        ...item,
        displayBin: `${start}-${end}€`,
        originalBin: item.bin // Keep the original for tooltip
      };
    }
    // Otherwise just use the original bin
    return {
      ...item,
      displayBin: item.bin,
      originalBin: item.bin
    };
  });

  // Custom tooltip to show details
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const binIndex = formattedData.findIndex(d => d.displayBin === label);
      const dataPoint = binIndex >= 0 ? formattedData[binIndex] : null;
      const binRange = dataPoint?.originalBin || label;
        
      return (
        <div className="bg-white/95 backdrop-blur-sm p-3 border border-gray-100 shadow-md rounded-md text-sm">
          <div className="font-bold pb-1 mb-1.5 border-b">
            {binRange}
          </div>
          
          <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 items-center">
            {payload.map((entry: any, index: number) => (
              <React.Fragment key={`tooltip-${index}`}>
                <div className="flex items-center">
                  <div 
                    className="w-2.5 h-2.5 mr-1.5 rounded-sm" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-xs text-gray-600">{entry.name}:</span>
                </div>
                <div className="text-right font-medium">
                  {entry.value} orders
                </div>
              </React.Fragment>
            ))}
            
            {payload.length === 2 && (
              <>
                <div className="text-xs text-gray-500 pt-1 mt-1 border-t">Difference:</div>
                <div className="text-right font-medium pt-1 mt-1 border-t">
                  {(payload[1].value - payload[0].value > 0 ? '+' : '')}{payload[1].value - payload[0].value} orders
                  {' '}({Math.abs(payload[1].value - payload[0].value) / payload[0].value * 100 > 0.1 
                      ? (payload[1].value > payload[0].value ? '+' : '-') + 
                        (Math.abs(payload[1].value - payload[0].value) / Math.max(0.1, payload[0].value) * 100).toFixed(1) + '%' 
                      : '0%'})
                </div>
              </>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate the max value for better Y-axis display
  const maxValue = Math.max(
    ...formattedData?.flatMap(d => [d.control, d.variant]) || [10],
    10 // Minimum value to ensure the chart doesn't collapse
  );

  // Debug
  console.log("Histogram Data:", data?.length);
  console.log("Formatted Data:", formattedData?.length);

  return (
    <div className="w-full">
      {formattedData && formattedData.length > 0 ? (
        <>
          <ResponsiveContainer width={width} height={height}>
            <BarChart 
              data={formattedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              barGap={3} // Smaller gap between control and variant bars
              barCategoryGap="20%" // More space between category groups
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis 
                dataKey="displayBin" 
                label={{ 
                  value: 'Order Value Range (€)', 
                  position: 'insideBottom', 
                  offset: -10,
                  style: { fill: '#666' }
                }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={{ stroke: '#e5e7eb' }}
                tick={{ fontSize: 10, fill: '#666' }}
                angle={-20}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                domain={[0, maxValue * 1.1]}
                label={{ 
                  value: 'Number of Orders', 
                  angle: -90, 
                  position: 'insideLeft', 
                  offset: 0,
                  style: { fill: '#666' }
                }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={{ stroke: '#e5e7eb' }}
                tick={{ fill: '#666' }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ opacity: 0.15 }} />
              <Legend wrapperStyle={{ paddingTop: 10 }} />
              
              <Bar 
                dataKey="control" 
                name="Control" 
                fill={controlColor} 
                opacity={0.85}
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              >
                {/* Add subtle border to bars */}
                {formattedData.map((entry, index) => (
                  <Cell 
                    key={`cell-control-${index}`} 
                    stroke={controlColor} 
                    strokeWidth={1} 
                  />
                ))}
              </Bar>
              <Bar 
                dataKey="variant" 
                name="Variant" 
                fill={variantColor} 
                opacity={0.85}
                radius={[4, 4, 0, 0]} 
                maxBarSize={40}
              >
                {/* Add subtle border to bars */}
                {formattedData.map((entry, index) => (
                  <Cell 
                    key={`cell-variant-${index}`} 
                    stroke={variantColor} 
                    strokeWidth={1} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          
          <div className="mt-2 text-xs text-gray-500 text-center px-6">
            <p>This chart shows the distribution of orders by value range for both control and variant groups.</p>
            <p>Higher bars indicate more orders in that price range.</p>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-[400px] bg-gray-50 border border-gray-200 rounded-md">
          <p className="text-gray-500">No data available for histogram visualization</p>
        </div>
      )}
    </div>
  );
};

export default DistributionHistogram; 