import React, { FC, useEffect, useState } from 'react';
import { BarChart2, Table, AreaChart } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface BoxPlotDataPoint {
  name: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  mean?: number;
  color?: string;
}

interface RevenueBoxPlotProps {
  data: BoxPlotDataPoint[];
  height?: number;
}

const RevenueBoxPlot: FC<RevenueBoxPlotProps> = ({ data, height = 400 }) => {
  // State for view mode and chart type
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const [chartType, setChartType] = useState<'boxplot' | 'curve'>('boxplot');

  // Log data for debugging
  useEffect(() => {
    console.log("RevenueBoxPlot - Data:", data);
  }, [data]);

  // Ensure we have data
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] bg-gray-50 border border-gray-200 rounded-md">
        <p className="text-gray-500">No data available for box plot visualization</p>
      </div>
    );
  }

  // Format numbers as currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Format percentage with sign
  const formatPercentWithSign = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Find control and variant data
  const controlData = data.find(d => d.name === 'Control');
  const variantData = data.find(d => d.name === 'Variant');

  // If we don't have both control and variant data, show error
  if (!controlData || !variantData) {
    console.error("Missing control or variant data for box plot");
    return (
      <div className="flex items-center justify-center h-[400px] bg-gray-50 border border-gray-200 rounded-md">
        <p className="text-gray-500">Incomplete data for box plot visualization</p>
      </div>
    );
  }

  // Calculate the range of values for scaling
  const allValues = [
    controlData.min, controlData.q1, controlData.median, controlData.q3, controlData.max,
    variantData.min, variantData.q1, variantData.median, variantData.q3, variantData.max
  ];
  if (controlData.mean !== undefined) allValues.push(controlData.mean);
  if (variantData.mean !== undefined) allValues.push(variantData.mean);

  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  
  // Add padding to the range (10%)
  const padding = (maxValue - minValue) * 0.1;
  const yMin = Math.max(0, minValue - padding); // Ensure we never go below 0
  const yMax = maxValue + padding;

  // Calculate differences for table view
  const minDiff = variantData.min - controlData.min;
  const minPct = (minDiff / Math.max(0.1, controlData.min) * 100);
  
  const q1Diff = variantData.q1 - controlData.q1;
  const q1Pct = (q1Diff / Math.max(0.1, controlData.q1) * 100);
  
  const medianDiff = variantData.median - controlData.median;
  const medianPct = (medianDiff / Math.max(0.1, controlData.median) * 100);
  
  const meanDiff = variantData.mean !== undefined && controlData.mean !== undefined 
    ? variantData.mean - controlData.mean 
    : undefined;
  const meanPct = meanDiff !== undefined && controlData.mean !== undefined
    ? (meanDiff / Math.max(0.1, controlData.mean) * 100)
    : undefined;
  
  const q3Diff = variantData.q3 - controlData.q3;
  const q3Pct = (q3Diff / Math.max(0.1, controlData.q3) * 100);
  
  const maxDiff = variantData.max - controlData.max;
  const maxPct = (maxDiff / Math.max(0.1, controlData.max) * 100);
  
  const iqrControl = controlData.q3 - controlData.q1;
  const iqrVariant = variantData.q3 - variantData.q1;
  const iqrDiff = iqrVariant - iqrControl;
  const iqrPct = (iqrDiff / Math.max(0.1, iqrControl) * 100);

  // Table view of data
  const TableView = () => (
    <div className="overflow-x-auto w-full">
      <table className="w-full border-collapse min-w-[600px]">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-4 py-2 text-left border border-gray-200">Metric</th>
            <th className="px-4 py-2 text-right border border-gray-200">Control</th>
            <th className="px-4 py-2 text-right border border-gray-200">Variant</th>
            <th className="px-4 py-2 text-right border border-gray-200">Difference</th>
            <th className="px-4 py-2 text-right border border-gray-200">Change</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="px-4 py-2 border border-gray-200 font-medium">Minimum</td>
            <td className="px-4 py-2 text-right border border-gray-200">{formatCurrency(controlData.min)}</td>
            <td className="px-4 py-2 text-right border border-gray-200">{formatCurrency(variantData.min)}</td>
            <td className="px-4 py-2 text-right border border-gray-200">
              {minDiff >= 0 ? '+' : ''}{formatCurrency(minDiff)}
            </td>
            <td className={`px-4 py-2 text-right border border-gray-200 ${minDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercentWithSign(minPct)}
            </td>
          </tr>
          
          <tr>
            <td className="px-4 py-2 border border-gray-200 font-medium">1st Quartile (Q1)</td>
            <td className="px-4 py-2 text-right border border-gray-200">{formatCurrency(controlData.q1)}</td>
            <td className="px-4 py-2 text-right border border-gray-200">{formatCurrency(variantData.q1)}</td>
            <td className="px-4 py-2 text-right border border-gray-200">
              {q1Diff >= 0 ? '+' : ''}{formatCurrency(q1Diff)}
            </td>
            <td className={`px-4 py-2 text-right border border-gray-200 ${q1Diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercentWithSign(q1Pct)}
            </td>
          </tr>
          
          <tr className="bg-gray-50">
            <td className="px-4 py-2 border border-gray-200 font-bold">Median</td>
            <td className="px-4 py-2 text-right border border-gray-200 font-medium">{formatCurrency(controlData.median)}</td>
            <td className="px-4 py-2 text-right border border-gray-200 font-medium">{formatCurrency(variantData.median)}</td>
            <td className="px-4 py-2 text-right border border-gray-200 font-medium">
              {medianDiff >= 0 ? '+' : ''}{formatCurrency(medianDiff)}
            </td>
            <td className={`px-4 py-2 text-right border border-gray-200 font-medium ${medianDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercentWithSign(medianPct)}
            </td>
          </tr>
          
          {controlData.mean !== undefined && variantData.mean !== undefined && meanDiff !== undefined && meanPct !== undefined && (
            <tr>
              <td className="px-4 py-2 border border-gray-200 font-medium">Mean</td>
              <td className="px-4 py-2 text-right border border-gray-200">{formatCurrency(controlData.mean)}</td>
              <td className="px-4 py-2 text-right border border-gray-200">{formatCurrency(variantData.mean)}</td>
              <td className="px-4 py-2 text-right border border-gray-200">
                {meanDiff >= 0 ? '+' : ''}{formatCurrency(meanDiff)}
              </td>
              <td className={`px-4 py-2 text-right border border-gray-200 ${meanDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentWithSign(meanPct)}
              </td>
            </tr>
          )}
          
          <tr>
            <td className="px-4 py-2 border border-gray-200 font-medium">3rd Quartile (Q3)</td>
            <td className="px-4 py-2 text-right border border-gray-200">{formatCurrency(controlData.q3)}</td>
            <td className="px-4 py-2 text-right border border-gray-200">{formatCurrency(variantData.q3)}</td>
            <td className="px-4 py-2 text-right border border-gray-200">
              {q3Diff >= 0 ? '+' : ''}{formatCurrency(q3Diff)}
            </td>
            <td className={`px-4 py-2 text-right border border-gray-200 ${q3Diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercentWithSign(q3Pct)}
            </td>
          </tr>
          
          <tr>
            <td className="px-4 py-2 border border-gray-200 font-medium">Maximum</td>
            <td className="px-4 py-2 text-right border border-gray-200">{formatCurrency(controlData.max)}</td>
            <td className="px-4 py-2 text-right border border-gray-200">{formatCurrency(variantData.max)}</td>
            <td className="px-4 py-2 text-right border border-gray-200">
              {maxDiff >= 0 ? '+' : ''}{formatCurrency(maxDiff)}
            </td>
            <td className={`px-4 py-2 text-right border border-gray-200 ${maxDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercentWithSign(maxPct)}
            </td>
          </tr>
          
          <tr className="bg-gray-50">
            <td className="px-4 py-2 border border-gray-200 font-medium">IQR (Q3-Q1)</td>
            <td className="px-4 py-2 text-right border border-gray-200">{formatCurrency(iqrControl)}</td>
            <td className="px-4 py-2 text-right border border-gray-200">{formatCurrency(iqrVariant)}</td>
            <td className="px-4 py-2 text-right border border-gray-200">
              {iqrDiff >= 0 ? '+' : ''}{formatCurrency(iqrDiff)}
            </td>
            <td className={`px-4 py-2 text-right border border-gray-200 ${iqrDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercentWithSign(iqrPct)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  // BoxPlot chart
  const BoxPlotChart = () => (
    <div className="relative h-[350px] flex items-stretch">
      {/* Y-axis with labels */}
      <div className="w-16 relative flex flex-col justify-between">
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const value = yMin + (yMax - yMin) * (1 - ratio);
          return (
            <div key={`grid-${i}`} className="absolute w-full" style={{ top: `${ratio * 100}%` }}>
              <div className="text-xs text-gray-500 w-full text-right pr-2">
                {Math.round(value).toLocaleString()} €
              </div>
              <div className="border-t border-gray-100 w-full absolute left-16 right-0"></div>
            </div>
          );
        })}
      </div>

      {/* Box plots area */}
      <div className="flex-1 flex justify-around items-stretch pl-8">
        {/* Control */}
        <div className="relative flex flex-col items-center justify-center">
          <div className="h-full relative flex items-center justify-center" style={{ width: '100px' }}>
            {/* Tooltip on hover with detailed stats */}
            <div className="group absolute top-0 bottom-0 left-0 right-0 z-10 cursor-help">
              <div className="absolute opacity-0 group-hover:opacity-100 top-1/2 left-full ml-2 -translate-y-1/2 p-2 bg-white border border-gray-200 rounded shadow-lg w-48 z-20 transition-opacity">
                <div className="text-sm font-medium mb-1 border-b pb-1 text-[#8884d8]">Control</div>
                <div className="grid grid-cols-2 gap-y-1 text-xs">
                  <div className="text-gray-500">Min:</div>
                  <div className="text-right">{formatCurrency(controlData.min)}</div>
                  
                  <div className="text-gray-500">Q1:</div>
                  <div className="text-right">{formatCurrency(controlData.q1)}</div>
                  
                  <div className="text-gray-500 font-medium">Median:</div>
                  <div className="text-right font-medium">{formatCurrency(controlData.median)}</div>
                  
                  {controlData.mean !== undefined && (
                    <>
                      <div className="text-gray-500">Mean:</div>
                      <div className="text-right">{formatCurrency(controlData.mean)}</div>
                    </>
                  )}
                  
                  <div className="text-gray-500">Q3:</div>
                  <div className="text-right">{formatCurrency(controlData.q3)}</div>
                  
                  <div className="text-gray-500">Max:</div>
                  <div className="text-right">{formatCurrency(controlData.max)}</div>
                  
                  <div className="text-gray-500 pt-1 mt-1 border-t">IQR:</div>
                  <div className="text-right pt-1 mt-1 border-t">{formatCurrency(controlData.q3 - controlData.q1)}</div>
                </div>
              </div>
            </div>
            
            {chartType === 'boxplot' ? (
              <>
                {/* Vertical line from min to max */}
                <div className="absolute top-0 bottom-0 w-0.5 bg-[#8884d8]" 
                    style={{ left: '50%', transform: 'translateX(-50%)' }}></div>
                
                {/* Min cap */}
                <div className="absolute w-8 h-0.5 bg-[#8884d8]" 
                    style={{ 
                      top: `${((yMax - controlData.min) / (yMax - yMin)) * 100}%`,
                      left: '50%',
                      transform: 'translateX(-50%)'
                    }}></div>
                
                {/* Max cap */}
                <div className="absolute w-8 h-0.5 bg-[#8884d8]" 
                    style={{ 
                      top: `${((yMax - controlData.max) / (yMax - yMin)) * 100}%`,
                      left: '50%',
                      transform: 'translateX(-50%)'
                    }}></div>
                
                {/* Box (Q1-Q3) */}
                <div className="absolute bg-[#8884d8] bg-opacity-50 border border-[#8884d8]" 
                    style={{ 
                      top: `${((yMax - controlData.q3) / (yMax - yMin)) * 100}%`,
                      height: `${((controlData.q3 - controlData.q1) / (yMax - yMin)) * 100}%`,
                      width: '40px',
                      left: '50%',
                      transform: 'translateX(-50%)'
                    }}></div>
                
                {/* Median line */}
                <div className="absolute w-40 h-1 bg-white border border-[#8884d8] z-10" 
                    style={{ 
                      top: `${((yMax - controlData.median) / (yMax - yMin)) * 100}%`,
                      left: '50%',
                      transform: 'translateX(-50%)'
                    }}></div>
                    
                {/* Mean point (if available) */}
                {controlData.mean !== undefined && (
                  <div className="absolute w-2 h-2 rounded-full bg-[#8884d8] z-10" 
                    style={{ 
                      top: `${((yMax - controlData.mean) / (yMax - yMin)) * 100}%`,
                      left: '50%',
                      transform: 'translateX(-50%)'
                    }}></div>
                )}
              </>
            ) : (
              // Normal distribution curve
              <svg 
                className="absolute inset-0"
                viewBox="0 0 100 350"
                preserveAspectRatio="none"
              >
                <path
                  d={`M 0,350 
                      C 10,350 20,${350 - ((350 * 0.05))} 30,${350 - ((350 * 0.15))}
                      S 40,${350 - ((350 * 0.75))} 50,${350 - ((350 * 0.95))}
                      S 60,${350 - ((350 * 0.75))} 70,${350 - ((350 * 0.15))}
                      S 90,350 100,350 Z`}
                  fill="#8884d8"
                  fillOpacity="0.2"
                  stroke="#8884d8"
                  strokeWidth="1"
                />
                {/* Vertical lines for quartiles */}
                <line
                  x1="20" y1="350"
                  x2="20" y2={350 - ((350 * 0.15))}
                  stroke="#8884d8"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
                <line
                  x1="80" y1="350"
                  x2="80" y2={350 - ((350 * 0.15))}
                  stroke="#8884d8"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
                {/* Median line */}
                <line
                  x1="50" y1="350"
                  x2="50" y2={350 - ((350 * 0.95))}
                  stroke="#8884d8"
                  strokeWidth="2"
                />
                {/* Labels */}
                <text
                  x="20" y="20"
                  textAnchor="middle"
                  fill="#8884d8"
                  fontSize="8"
                >
                  Q1
                </text>
                <text
                  x="50" y="10"
                  textAnchor="middle"
                  fill="#8884d8"
                  fontSize="8"
                >
                  Median
                </text>
                <text
                  x="80" y="20"
                  textAnchor="middle"
                  fill="#8884d8"
                  fontSize="8"
                >
                  Q3
                </text>
                {/* IQR Bracket */}
                <path
                  d={`M 20,30 L 20,35 L 80,35 L 80,30`}
                  fill="none"
                  stroke="#8884d8"
                  strokeWidth="1"
                />
                <text
                  x="50" y="45"
                  textAnchor="middle"
                  fill="#8884d8"
                  fontSize="8"
                >
                  IQR
                </text>
              </svg>
            )}
                 
            {/* Label at the bottom */}
            <div className="absolute bottom-[-25px] text-xs font-medium">Control</div>
          </div>
        </div>
        
        {/* Variant */}
        <div className="relative flex flex-col items-center justify-center">
          <div className="h-full relative flex items-center justify-center" style={{ width: '100px' }}>
            {/* Tooltip on hover with detailed stats */}
            <div className="group absolute top-0 bottom-0 left-0 right-0 z-10 cursor-help">
              <div className="absolute opacity-0 group-hover:opacity-100 top-1/2 left-full ml-2 -translate-y-1/2 p-2 bg-white border border-gray-200 rounded shadow-lg w-48 z-20 transition-opacity">
                <div className="text-sm font-medium mb-1 border-b pb-1 text-[#82ca9d]">Variant</div>
                <div className="grid grid-cols-2 gap-y-1 text-xs">
                  <div className="text-gray-500">Min:</div>
                  <div className="text-right">{formatCurrency(variantData.min)}</div>
                  
                  <div className="text-gray-500">Q1:</div>
                  <div className="text-right">{formatCurrency(variantData.q1)}</div>
                  
                  <div className="text-gray-500 font-medium">Median:</div>
                  <div className="text-right font-medium">{formatCurrency(variantData.median)}</div>
                  
                  {variantData.mean !== undefined && (
                    <>
                      <div className="text-gray-500">Mean:</div>
                      <div className="text-right">{formatCurrency(variantData.mean)}</div>
                    </>
                  )}
                  
                  <div className="text-gray-500">Q3:</div>
                  <div className="text-right">{formatCurrency(variantData.q3)}</div>
                  
                  <div className="text-gray-500">Max:</div>
                  <div className="text-right">{formatCurrency(variantData.max)}</div>
                  
                  <div className="text-gray-500 pt-1 mt-1 border-t">IQR:</div>
                  <div className="text-right pt-1 mt-1 border-t">{formatCurrency(variantData.q3 - variantData.q1)}</div>
                </div>
              </div>
            </div>
            
            {chartType === 'boxplot' ? (
              <>
                {/* Vertical line from min to max */}
                <div className="absolute top-0 bottom-0 w-0.5 bg-[#82ca9d]" 
                    style={{ left: '50%', transform: 'translateX(-50%)' }}></div>
                
                {/* Min cap */}
                <div className="absolute w-8 h-0.5 bg-[#82ca9d]" 
                    style={{ 
                      top: `${((yMax - variantData.min) / (yMax - yMin)) * 100}%`,
                      left: '50%',
                      transform: 'translateX(-50%)'
                    }}></div>
                
                {/* Max cap */}
                <div className="absolute w-8 h-0.5 bg-[#82ca9d]" 
                    style={{ 
                      top: `${((yMax - variantData.max) / (yMax - yMin)) * 100}%`,
                      left: '50%',
                      transform: 'translateX(-50%)'
                    }}></div>
                
                {/* Box (Q1-Q3) */}
                <div className="absolute bg-[#82ca9d] bg-opacity-50 border border-[#82ca9d]" 
                    style={{ 
                      top: `${((yMax - variantData.q3) / (yMax - yMin)) * 100}%`,
                      height: `${((variantData.q3 - variantData.q1) / (yMax - yMin)) * 100}%`,
                      width: '40px',
                      left: '50%',
                      transform: 'translateX(-50%)'
                    }}></div>
                
                {/* Median line */}
                <div className="absolute w-40 h-1 bg-white border border-[#82ca9d] z-10" 
                    style={{ 
                      top: `${((yMax - variantData.median) / (yMax - yMin)) * 100}%`,
                      left: '50%',
                      transform: 'translateX(-50%)'
                    }}></div>
                    
                {/* Mean point (if available) */}
                {variantData.mean !== undefined && (
                  <div className="absolute w-2 h-2 rounded-full bg-[#82ca9d] z-10" 
                    style={{ 
                      top: `${((yMax - variantData.mean) / (yMax - yMin)) * 100}%`,
                      left: '50%',
                      transform: 'translateX(-50%)'
                    }}></div>
                )}
              </>
            ) : (
              // Normal distribution curve
              <svg 
                className="absolute inset-0"
                viewBox="0 0 100 350"
                preserveAspectRatio="none"
              >
                <path
                  d={`M 0,350 
                      C 10,350 20,${350 - ((350 * 0.05))} 30,${350 - ((350 * 0.15))}
                      S 40,${350 - ((350 * 0.75))} 50,${350 - ((350 * 0.95))}
                      S 60,${350 - ((350 * 0.75))} 70,${350 - ((350 * 0.15))}
                      S 90,350 100,350 Z`}
                  fill="#82ca9d"
                  fillOpacity="0.2"
                  stroke="#82ca9d"
                  strokeWidth="1"
                />
                {/* Vertical lines for quartiles */}
                <line
                  x1="20" y1="350"
                  x2="20" y2={350 - ((350 * 0.15))}
                  stroke="#82ca9d"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
                <line
                  x1="80" y1="350"
                  x2="80" y2={350 - ((350 * 0.15))}
                  stroke="#82ca9d"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
                {/* Median line */}
                <line
                  x1="50" y1="350"
                  x2="50" y2={350 - ((350 * 0.95))}
                  stroke="#82ca9d"
                  strokeWidth="2"
                />
                {/* Labels */}
                <text
                  x="20" y="20"
                  textAnchor="middle"
                  fill="#82ca9d"
                  fontSize="8"
                >
                  Q1
                </text>
                <text
                  x="50" y="10"
                  textAnchor="middle"
                  fill="#82ca9d"
                  fontSize="8"
                >
                  Median
                </text>
                <text
                  x="80" y="20"
                  textAnchor="middle"
                  fill="#82ca9d"
                  fontSize="8"
                >
                  Q3
                </text>
                {/* IQR Bracket */}
                <path
                  d={`M 20,30 L 20,35 L 80,35 L 80,30`}
                  fill="none"
                  stroke="#82ca9d"
                  strokeWidth="1"
                />
                <text
                  x="50" y="45"
                  textAnchor="middle"
                  fill="#82ca9d"
                  fontSize="8"
                >
                  IQR
                </text>
              </svg>
            )}
                 
            {/* Label at the bottom */}
            <div className="absolute bottom-[-25px] text-xs font-medium">Variant</div>
          </div>
        </div>
      </div>
    </div>
  );

  // Toggle between chart and table views
  const toggleView = () => {
    setViewMode(viewMode === 'chart' ? 'table' : 'chart');
  };

  // Toggle between boxplot and curve display
  const toggleChartType = () => {
    setChartType(chartType === 'boxplot' ? 'curve' : 'boxplot');
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center space-x-2">
          <Label htmlFor="chart-type" className="text-xs text-gray-500">
            {chartType === 'boxplot' ? 'Box Plot' : 'Distribution Curve'}
          </Label>
          <Switch
            id="chart-type"
            checked={chartType === 'curve'}
            onCheckedChange={toggleChartType}
          />
        </div>
        <button 
          onClick={toggleView}
          className="flex items-center text-xs bg-gray-100 hover:bg-gray-200 rounded px-2 py-1 text-gray-700"
        >
          {viewMode === 'chart' ? (
            <>
              <Table className="h-3 w-3 mr-1" />
              <span>View as Table</span>
            </>
          ) : (
            <>
              <BarChart2 className="h-3 w-3 mr-1" />
              <span>View as Chart</span>
            </>
          )}
        </button>
      </div>
      
      {viewMode === 'chart' ? <BoxPlotChart /> : <TableView />}
    </div>
  );
};

export default RevenueBoxPlot; 