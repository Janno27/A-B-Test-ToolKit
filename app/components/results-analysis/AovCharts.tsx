import React, { FC, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ScatterPlot from './ScatterPlot';
import DistributionHistogram from './DistributionHistogram';
import AovBoxPlot from './AovBoxPlot';

interface AovChartsProps {
  // Data from backend
  controlData?: number[];
  variationData?: number[];
  basicStatistics?: {
    control: {
      count: number;
      mean: number;
      median: number;
      std_dev: number;
      min_value: number;
      max_value: number;
      q1?: number;
      q3?: number;
    };
    variation: {
      count: number;
      mean: number;
      median: number;
      std_dev: number;
      min_value: number;
      max_value: number;
      q1?: number;
      q3?: number;
    };
  };
  // Backend-prepared visualization data
  quartiles?: {
    control: { q1: number; q3: number; };
    variation: { q1: number; q3: number; };
  };
  histogramData?: Array<{
    bin: string;
    control: number;
    variant: number;
    binStart: number;
    binEnd: number;
  }>;
  frequencyData?: {
    control: Array<{
      orderValue: number;
      frequency: number;
      name: string;
      color: string;
    }>;
    variation: Array<{
      orderValue: number;
      frequency: number;
      name: string;
      color: string;
    }>;
  };
}

const AovCharts: FC<AovChartsProps> = ({ 
  controlData, 
  variationData,
  basicStatistics,
  quartiles,
  histogramData,
  frequencyData
}) => {
  // Debug logging
  useEffect(() => {
    console.log("AovCharts - Rendering with data:", {
      controlData: controlData?.length,
      variationData: variationData?.length,
      basicStatistics: !!basicStatistics,
      quartiles: quartiles,
      histogramData: histogramData?.length,
      frequencyData: frequencyData ? {
        control: frequencyData.control?.length, 
        variation: frequencyData.variation?.length
      } : null
    });
  }, [controlData, variationData, basicStatistics, quartiles, histogramData, frequencyData]);
  
  // Transform backend data for box plot
  const getBoxPlotData = () => {
    // If we have basic statistics and quartiles, use them
    if (basicStatistics && quartiles) {
      return [
        {
          name: "Control",
          min: basicStatistics.control.min_value,
          q1: quartiles.control.q1 || basicStatistics.control.q1 || 
              basicStatistics.control.min_value + (basicStatistics.control.median - basicStatistics.control.min_value) * 0.5,
          median: basicStatistics.control.median,
          q3: quartiles.control.q3 || basicStatistics.control.q3 || 
              basicStatistics.control.max_value - (basicStatistics.control.max_value - basicStatistics.control.median) * 0.5,
          max: basicStatistics.control.max_value,
          mean: basicStatistics.control.mean,
          color: "#8884d8"
        },
        {
          name: "Variant",
          min: basicStatistics.variation.min_value,
          q1: quartiles.variation.q1 || basicStatistics.variation.q1 || 
              basicStatistics.variation.min_value + (basicStatistics.variation.median - basicStatistics.variation.min_value) * 0.5,
          median: basicStatistics.variation.median,
          q3: quartiles.variation.q3 || basicStatistics.variation.q3 || 
              basicStatistics.variation.max_value - (basicStatistics.variation.max_value - basicStatistics.variation.median) * 0.5,
          max: basicStatistics.variation.max_value,
          mean: basicStatistics.variation.mean,
          color: "#82ca9d"
        }
      ];
    }
    
    // Otherwise, use fallback data
    return [
      {
        name: "Control",
        min: 35,
        q1: 72,
        median: 95,
        q3: 145,
        max: 280,
        mean: 105.8,
        color: "#8884d8"
      },
      {
        name: "Variant",
        min: 40,
        q1: 85,
        median: 120,
        q3: 165,
        max: 310,
        mean: 128.5,
        color: "#82ca9d"
      }
    ];
  };

  // Get the appropriate data for the histogram
  const getHistogramData = () => {
    // If we have pre-calculated histogram data, use it
    if (histogramData && histogramData.length > 0) {
      console.log("Using pre-calculated histogram data:", histogramData);
      return histogramData;
    }
    
    // Otherwise, generate data using our original method
    if (controlData && variationData && Array.isArray(controlData) && Array.isArray(variationData)) {
      // Create bins for the histogram
      const allValues = [...controlData, ...variationData];
      const min = Math.min(...allValues);
      const max = Math.max(...allValues);
      const range = max - min;
      const binSize = Math.max(10, Math.ceil(range / 7)); // Create reasonable bin sizes
      
      const bins: Record<string, {control: number, variant: number, binStart: number, binEnd: number}> = {};
      
      // Initialize bins
      for (let i = 0; i < 7; i++) {
        const binStart = min + i * binSize;
        const binEnd = i === 6 ? max : min + (i + 1) * binSize;
        const binLabel = `${Math.round(binStart)}€-${Math.round(binEnd)}€`;
        
        bins[binLabel] = {
          control: 0,
          variant: 0,
          binStart: Math.round(binStart),
          binEnd: Math.round(binEnd)
        };
      }
      
      // Count values in each bin
      controlData.forEach((value: number) => {
        for (const binLabel in bins) {
          const { binStart, binEnd } = bins[binLabel];
          if (value >= binStart && (value < binEnd || (binEnd === max && value <= binEnd))) {
            bins[binLabel].control++;
            break;
          }
        }
      });
      
      variationData.forEach((value: number) => {
        for (const binLabel in bins) {
          const { binStart, binEnd } = bins[binLabel];
          if (value >= binStart && (value < binEnd || (binEnd === max && value <= binEnd))) {
            bins[binLabel].variant++;
            break;
          }
        }
      });
      
      return Object.entries(bins).map(([bin, data]) => ({
        bin,
        ...data
      }));
    }
    
    // Fallback data
    return [
      { bin: "0-50€", control: 120, variant: 90, binStart: 0, binEnd: 50 },
      { bin: "50-100€", control: 220, variant: 180, binStart: 50, binEnd: 100 },
      { bin: "100-150€", control: 180, variant: 210, binStart: 100, binEnd: 150 },
      { bin: "150-200€", control: 100, variant: 150, binStart: 150, binEnd: 200 },
      { bin: "200-250€", control: 60, variant: 90, binStart: 200, binEnd: 250 },
      { bin: "250-300€", control: 30, variant: 50, binStart: 250, binEnd: 300 },
      { bin: "300-350€", control: 20, variant: 35, binStart: 300, binEnd: 350 }
    ];
  };
  
  // Get the appropriate data for the scatter plot
  const getScatterData = () => {
    // If we have pre-calculated frequency data, use it
    if (frequencyData && 
        frequencyData.control && frequencyData.control.length > 0 && 
        frequencyData.variation && frequencyData.variation.length > 0) {
      console.log("Using pre-calculated frequency data:", frequencyData);
      // Combine the arrays for the scatter plot
      return [...frequencyData.control, ...frequencyData.variation];
    }
    
    // Otherwise, generate data using the original method
    if (controlData && variationData && Array.isArray(controlData) && Array.isArray(variationData)) {
      const controlFrequency: Record<number, number> = {};
      const variantFrequency: Record<number, number> = {};
      
      // Round values to the nearest integer to group them
      controlData.forEach((value: number) => {
        const roundedValue = Math.round(value);
        controlFrequency[roundedValue] = (controlFrequency[roundedValue] || 0) + 1;
      });
      
      variationData.forEach((value: number) => {
        const roundedValue = Math.round(value);
        variantFrequency[roundedValue] = (variantFrequency[roundedValue] || 0) + 1;
      });
      
      const scatterData = [];
      
      // Add control data points
      for (const [orderValue, frequency] of Object.entries(controlFrequency)) {
        scatterData.push({
          orderValue: Number(orderValue),
          frequency: Number(frequency),
          name: 'Control',
          color: "#8884d8"
        });
      }
      
      // Add variant data points
      for (const [orderValue, frequency] of Object.entries(variantFrequency)) {
        scatterData.push({
          orderValue: Number(orderValue),
          frequency: Number(frequency),
          name: 'Variant',
          color: "#82ca9d"
        });
      }
      
      return scatterData;
    }
    
    // Fallback data
    return [
      // Control data points
      { orderValue: 55, frequency: 48, name: 'Control', color: "#8884d8" },
      { orderValue: 65, frequency: 42, name: 'Control', color: "#8884d8" },
      { orderValue: 75, frequency: 35, name: 'Control', color: "#8884d8" },
      { orderValue: 85, frequency: 25, name: 'Control', color: "#8884d8" },
      { orderValue: 95, frequency: 18, name: 'Control', color: "#8884d8" },
      { orderValue: 105, frequency: 12, name: 'Control', color: "#8884d8" },
      { orderValue: 115, frequency: 8, name: 'Control', color: "#8884d8" },
      { orderValue: 125, frequency: 5, name: 'Control', color: "#8884d8" },
      
      // Variant data points
      { orderValue: 55, frequency: 40, name: 'Variant', color: "#82ca9d" },
      { orderValue: 65, frequency: 38, name: 'Variant', color: "#82ca9d" },
      { orderValue: 75, frequency: 42, name: 'Variant', color: "#82ca9d" },
      { orderValue: 85, frequency: 35, name: 'Variant', color: "#82ca9d" },
      { orderValue: 95, frequency: 30, name: 'Variant', color: "#82ca9d" },
      { orderValue: 105, frequency: 20, name: 'Variant', color: "#82ca9d" },
      { orderValue: 115, frequency: 15, name: 'Variant', color: "#82ca9d" },
      { orderValue: 125, frequency: 10, name: 'Variant', color: "#82ca9d" },
    ];
  };
  
  // Get the data for all charts
  const boxPlotData = getBoxPlotData();
  const histogramData_processed = getHistogramData();
  const scatterData = getScatterData();
  
  // Check if we have any data to show
  const hasData = boxPlotData.length > 0 || 
                 histogramData_processed.length > 0 || 
                 scatterData.length > 0;
  
  if (!hasData) {
    return (
      <Card className="w-full mt-6">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-center">AOV Analysis Charts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px] bg-gray-50 border border-gray-200 rounded-md">
            <p className="text-gray-500">No data available for visualization</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full mt-6">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-center">AOV Analysis Charts</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="boxplot" className="w-full">
          <div className="flex justify-center mb-6">
            <TabsList>
              <TabsTrigger value="boxplot">Distribution Box Plot</TabsTrigger>
              <TabsTrigger value="histogram">Value Distribution</TabsTrigger>
              <TabsTrigger value="scatter">Frequency & Order Value</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="boxplot" className="w-full">
            <AovBoxPlot 
              data={boxPlotData} 
              height={400}
            />
          </TabsContent>
          
          <TabsContent value="histogram" className="w-full">
            <DistributionHistogram 
              data={histogramData_processed} 
              height={400}
              controlColor="#8884d8"
              variantColor="#82ca9d"
            />
          </TabsContent>
          
          <TabsContent value="scatter" className="w-full">
            <ScatterPlot 
              data={scatterData} 
              height={400}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AovCharts; 