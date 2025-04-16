import { FC } from 'react';
import { 
  ComposedChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceArea,
  ResponsiveContainer,
  ReferenceLine,
  Rectangle
} from 'recharts';

interface BoxPlotDataPoint {
  name: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  color?: string;
}

interface BoxPlotProps {
  data: BoxPlotDataPoint[];
  width?: number | string;
  height?: number | string;
}

const BoxPlot: FC<BoxPlotProps> = ({
  data,
  width = '100%',
  height = 400,
}) => {
  // Custom Tooltip to display box plot information
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      
      // Calculate useful statistics
      const iqr = dataPoint.q3 - dataPoint.q1;
      const range = dataPoint.max - dataPoint.min;
      const percentageFormat = (value: number) => `${(value * 100).toFixed(2)}%`;
      
      return (
        <div className="bg-white p-4 border border-gray-200 shadow-lg rounded-md max-w-xs">
          <p className="font-bold text-lg border-b pb-1 mb-3" style={{ color: dataPoint.color || "#8884d8" }}>
            {dataPoint.name}
          </p>
          
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            <p className="font-medium">Minimum:</p>
            <p className="text-right font-semibold">{percentageFormat(dataPoint.min)}</p>
            
            <p className="font-medium">1st Quartile:</p>
            <p className="text-right font-semibold">{percentageFormat(dataPoint.q1)}</p>
            
            <p className="font-medium">Median:</p>
            <p className="text-right font-semibold">{percentageFormat(dataPoint.median)}</p>
            
            <p className="font-medium">3rd Quartile:</p>
            <p className="text-right font-semibold">{percentageFormat(dataPoint.q3)}</p>
            
            <p className="font-medium">Maximum:</p>
            <p className="text-right font-semibold">{percentageFormat(dataPoint.max)}</p>
            
            <p className="font-medium border-t pt-1 mt-1">IQR:</p>
            <p className="text-right font-semibold border-t pt-1 mt-1">{percentageFormat(iqr)}</p>
            
            <p className="font-medium">Range:</p>
            <p className="text-right font-semibold">{percentageFormat(range)}</p>
          </div>
          
          <div className="mt-3 pt-2 border-t text-xs text-gray-600">
            <p>Hover over different parts of the box plot to see details</p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Legend with improved visual design
  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex justify-center items-center gap-6 mt-2">
        {payload.map((entry: any, index: number) => (
          <div key={`legend-${index}`} className="flex items-center">
            <div 
              className="w-4 h-4 mr-2" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  // Create extended data with numeric indices for each group
  const extendedData = data.map((item, index) => ({
    ...item,
    index // Add a numeric index for each point
  }));

  return (
    <div className="w-full">
      <ResponsiveContainer width={width} height={height}>
        <ComposedChart
          data={extendedData}
          margin={{ top: 30, right: 40, left: 20, bottom: 30 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis 
            dataKey="name" 
            scale="band" 
            padding={{ left: 50, right: 50 }} 
            tick={{ fontSize: 14, fontWeight: 500 }}
          />
          <YAxis 
            label={{ value: 'Conversion Rate', angle: -90, position: 'insideLeft', offset: -5 }}
            tickFormatter={(value) => `${(value * 100).toFixed(1)}%`}
            domain={['dataMin - 0.02', 'dataMax + 0.02']}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
          
          {/* Boxes (IQR) */}
          {extendedData.map((entry, index) => (
            <ReferenceArea
              key={`box-${index}`}
              x1={index}
              x2={index}
              y1={entry.q1}
              y2={entry.q3}
              fill={entry.color || "#8884d8"}
              fillOpacity={0.6}
              stroke={entry.color || "#8884d8"}
              strokeWidth={1.5}
              strokeOpacity={0.8}
            />
          ))}
          
          {/* Min-Max whiskers */}
          {extendedData.map((entry, index) => (
            <Line
              key={`line-${index}`}
              dataKey="median"
              data={[
                { name: entry.name, index: index, median: entry.min },
                { name: entry.name, index: index, median: entry.max }
              ]}
              stroke={entry.color || "#8884d8"}
              strokeWidth={2}
              dot={false}
              activeDot={false}
              legendType="none"
            />
          ))}
          
          {/* Median lines */}
          {extendedData.map((entry, index) => (
            <ReferenceLine
              key={`median-${index}`}
              x={index}
              y={entry.median}
              stroke="#fff"
              strokeWidth={3}
              strokeDasharray="0"
            />
          ))}
          {extendedData.map((entry, index) => (
            <ReferenceLine
              key={`median-overlay-${index}`}
              x={index}
              y={entry.median}
              stroke={entry.color || "#8884d8"}
              strokeWidth={1.5}
              strokeDasharray="0"
            />
          ))}
          
          {/* Points for min and max (whisker ends) */}
          {extendedData.map((entry, index) => (
            <Line
              key={`min-max-points-${index}`}
              dataKey="value"
              data={[
                { name: entry.name, index: index, value: entry.min },
                { name: entry.name, index: index, value: entry.max }
              ]}
              stroke={entry.color || "#8884d8"}
              strokeWidth={0}
              dot={{ 
                stroke: entry.color || "#8884d8", 
                strokeWidth: 2, 
                r: 4, 
                fill: "white"
              }}
              activeDot={false}
              legendType="none"
            />
          ))}
          
          {/* Value labels for main statistics */}
          {extendedData.map((entry, index) => (
            <g key={`labels-${index}`}>
              <text
                x={index}
                y={entry.max}
                dy={-12}
                textAnchor="middle"
                fill={entry.color || "#8884d8"}
                fontSize={10}
                fontWeight="bold"
              >
                {(entry.max * 100).toFixed(1)}%
              </text>
              <text
                x={index}
                y={entry.median}
                dy={-10}
                dx={24}
                textAnchor="middle"
                fill="#555"
                fontSize={10}
                fontWeight="bold"
              >
                {(entry.median * 100).toFixed(1)}%
              </text>
              <text
                x={index}
                y={entry.min}
                dy={12}
                textAnchor="middle"
                fill={entry.color || "#8884d8"}
                fontSize={10}
                fontWeight="bold"
              >
                {(entry.min * 100).toFixed(1)}%
              </text>
            </g>
          ))}
        </ComposedChart>
      </ResponsiveContainer>
      
      <div className="mt-4 text-sm text-gray-600 text-center px-6">
        <p>The box represents the interquartile range (25th to 75th percentile). The line in the box represents the median.</p>
        <p>The whiskers extend to the minimum and maximum values.</p>
      </div>
    </div>
  );
};

export default BoxPlot; 