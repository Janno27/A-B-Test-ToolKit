import React, { FC, useEffect, useState } from 'react';
import { BarChart2, Table, ChevronRight } from 'lucide-react';

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

interface AovBoxPlotProps {
  data: BoxPlotDataPoint[];
  width?: number | string;
  height?: number | string;
}

const AovBoxPlot: FC<AovBoxPlotProps> = ({
  data,
  width = '100%',
  height = 400,
}) => {
  // State for view mode
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  // Log data for debugging
  useEffect(() => {
    console.log("AovBoxPlot - Data:", data);
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

  // Format percentage
  const formatPercent = (value: number) => {
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

  // Calculate some statistics for annotation
  const medianDiff = variantData.median - controlData.median;
  const medianPct = (medianDiff / Math.max(0.1, controlData.median) * 100);
  const diffText = `Variant median is ${Math.abs(medianDiff).toFixed(2)}€ ${medianDiff >= 0 ? 'higher' : 'lower'} (${medianDiff >= 0 ? '+' : ''}${medianPct.toFixed(1)}%)`;

  // Calculate differences
  const minDiff = variantData.min - controlData.min;
  const minPct = (minDiff / Math.max(0.1, controlData.min) * 100);
  
  const q1Diff = variantData.q1 - controlData.q1;
  const q1Pct = (q1Diff / Math.max(0.1, controlData.q1) * 100);
  
  const q3Diff = variantData.q3 - controlData.q3;
  const q3Pct = (q3Diff / Math.max(0.1, controlData.q3) * 100);
  
  const maxDiff = variantData.max - controlData.max;
  const maxPct = (maxDiff / Math.max(0.1, controlData.max) * 100);
  
  const meanDiff = variantData.mean !== undefined && controlData.mean !== undefined 
    ? variantData.mean - controlData.mean 
    : undefined;
  const meanPct = meanDiff !== undefined && controlData.mean !== undefined
    ? (meanDiff / Math.max(0.1, controlData.mean) * 100)
    : undefined;
  
  const iqrControl = controlData.q3 - controlData.q1;
  const iqrVariant = variantData.q3 - variantData.q1;
  const iqrDiff = iqrVariant - iqrControl;
  const iqrPct = (iqrDiff / Math.max(0.1, iqrControl) * 100);
  
  // Calculate the range of values for scaling
  const allValues = [
    controlData.min, controlData.q1, controlData.median, controlData.q3, controlData.max,
    variantData.min, variantData.q1, variantData.median, variantData.q3, variantData.max
  ];
  if (controlData.mean) allValues.push(controlData.mean);
  if (variantData.mean) allValues.push(variantData.mean);

  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  
  // Add padding to the range (10%)
  const padding = (maxValue - minValue) * 0.1;
  const yMin = Math.max(0, minValue - padding); // Ensure we never go below 0
  const yMax = maxValue + padding;

  // Detailed comparison table
  const DetailedComparisonTable = () => (
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
              {formatPercent(minPct)}
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
              {formatPercent(q1Pct)}
            </td>
          </tr>
          
          <tr className="bg-gray-50">
            <td className="px-4 py-2 border border-gray-200 font-bold">Median</td>
            <td className="px-4 py-2 text-right border border-gray-200 font-medium">{formatCurrency(controlData.median)}</td>
            <td className="px-4 py-2 text-right border border-gray-200 font-medium">{formatCurrency(variantData.median)}</td>
            <td className="px-4 py-2 text-right border border-gray-200 font-medium">
              {medianDiff >= 0 ? '+' : ''}{formatCurrency(medianDiff)}
            </td>
            <td className={`px-4 py-2 text-right border border-gray-200 ${medianDiff >= 0 ? 'text-green-600' : 'text-red-600'} font-medium`}>
              {formatPercent(medianPct)}
            </td>
          </tr>
          
          {meanDiff !== undefined && controlData.mean !== undefined && variantData.mean !== undefined && meanPct !== undefined && (
            <tr>
              <td className="px-4 py-2 border border-gray-200 font-medium">Mean</td>
              <td className="px-4 py-2 text-right border border-gray-200">{formatCurrency(controlData.mean)}</td>
              <td className="px-4 py-2 text-right border border-gray-200">{formatCurrency(variantData.mean)}</td>
              <td className="px-4 py-2 text-right border border-gray-200">
                {meanDiff >= 0 ? '+' : ''}{formatCurrency(meanDiff)}
              </td>
              <td className={`px-4 py-2 text-right border border-gray-200 ${meanDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercent(meanPct)}
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
              {formatPercent(q3Pct)}
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
              {formatPercent(maxPct)}
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
              {formatPercent(iqrPct)}
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
                {Math.round(value)}€
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
                 
            {/* Label at the bottom */}
            <div className="absolute bottom-[-25px] text-xs font-medium">Variant</div>
          </div>
        </div>
      </div>
    </div>
  );

  // Switch button
  const ViewSwitcher = () => (
    <div className="flex justify-end mb-2">
      <button 
        className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
        onClick={() => setViewMode(viewMode === 'chart' ? 'table' : 'chart')}
      >
        {viewMode === 'chart' ? (
          <>
            <Table size={14} />
            <span>View as Table</span>
          </>
        ) : (
          <>
            <BarChart2 size={14} />
            <span>View as Chart</span>
          </>
        )}
      </button>
    </div>
  );

  return (
    <div className="w-full">
      <div className="border border-gray-200 rounded-md bg-white p-4">
        <ViewSwitcher />
        
        {viewMode === 'chart' ? (
          <BoxPlotChart />
        ) : (
          <DetailedComparisonTable />
        )}
        
        {/* Annotation text */}
        <div className="text-center py-2 text-sm font-medium mt-2">
          {diffText}
        </div>
      </div>

      {/* Legend (only for chart view) */}
      {viewMode === 'chart' && (
        <div className="flex justify-center mt-4 gap-8">
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-sm bg-[#8884d8] mr-2"></div>
            <span>Control</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-sm bg-[#82ca9d] mr-2"></div>
            <span>Variant</span>
          </div>
        </div>
      )}

      {/* Explanation */}
      {viewMode === 'chart' && (
        <div className="mt-3 text-xs text-gray-500 text-center px-6">
          <p>The box shows the interquartile range (Q1-Q3), the line in the box is the median.</p>
          <p>The whiskers extend to the minimum and maximum values.</p>
        </div>
      )}
    </div>
  );
};

export default AovBoxPlot; 