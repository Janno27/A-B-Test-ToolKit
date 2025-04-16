import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ScatterPlot from './ScatterPlot';
import DistributionHistogram from './DistributionHistogram';
import RevenueBoxPlot from './RevenueBoxPlot';

interface RevenueChartsProps {
  controlData: number[];
  variationData: number[];
  basicStatistics: {
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

const RevenueCharts: React.FC<RevenueChartsProps> = ({
  controlData,
  variationData,
  basicStatistics,
  quartiles,
  histogramData,
  frequencyData
}) => {
  // Prepare box plot data
  const boxPlotData = [
    {
      name: "Control",
      min: basicStatistics.control.min_value,
      q1: quartiles?.control.q1 || basicStatistics.control.q1 || basicStatistics.control.min_value,
      median: basicStatistics.control.median,
      q3: quartiles?.control.q3 || basicStatistics.control.q3 || basicStatistics.control.max_value,
      max: basicStatistics.control.max_value,
      mean: basicStatistics.control.mean,
      color: "#8884d8"
    },
    {
      name: "Variant",
      min: basicStatistics.variation.min_value,
      q1: quartiles?.variation.q1 || basicStatistics.variation.q1 || basicStatistics.variation.min_value,
      median: basicStatistics.variation.median,
      q3: quartiles?.variation.q3 || basicStatistics.variation.q3 || basicStatistics.variation.max_value,
      max: basicStatistics.variation.max_value,
      mean: basicStatistics.variation.mean,
      color: "#82ca9d"
    }
  ];

  // Prepare histogram data if not provided
  const processedHistogramData = histogramData || (() => {
    const allValues = [...controlData, ...variationData];
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const range = max - min;
    const binSize = Math.max(1000, Math.ceil(range / 7));
    
    const bins: Record<string, { control: number; variant: number; binStart: number; binEnd: number }> = {};
    
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
    controlData.forEach(value => {
      for (const binLabel in bins) {
        const { binStart, binEnd } = bins[binLabel];
        if (value >= binStart && (value < binEnd || (binEnd === max && value <= binEnd))) {
          bins[binLabel].control++;
          break;
        }
      }
    });
    
    variationData.forEach(value => {
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
  })();

  // Prepare scatter plot data if not provided
  const processedScatterData = frequencyData ? 
    [...frequencyData.control, ...frequencyData.variation] : 
    (() => {
      const controlFrequency: Record<number, number> = {};
      const variantFrequency: Record<number, number> = {};
      
      // Round values to the nearest thousand for revenue grouping
      controlData.forEach(value => {
        const roundedValue = Math.round(value / 1000) * 1000;
        controlFrequency[roundedValue] = (controlFrequency[roundedValue] || 0) + 1;
      });
      
      variationData.forEach(value => {
        const roundedValue = Math.round(value / 1000) * 1000;
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
    })();

  return (
    <Card className="w-full mt-6">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-center">Revenue Analysis Charts</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="boxplot" className="w-full">
          <div className="flex justify-center mb-6">
            <TabsList>
              <TabsTrigger value="boxplot">Distribution Box Plot</TabsTrigger>
              <TabsTrigger value="histogram">Value Distribution</TabsTrigger>
              <TabsTrigger value="scatter">Frequency & Revenue Value</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="boxplot" className="w-full">
            <RevenueBoxPlot 
              data={boxPlotData}
              height={400}
            />
          </TabsContent>
          
          <TabsContent value="histogram" className="w-full">
            <DistributionHistogram 
              data={processedHistogramData}
              height={400}
              controlColor="#8884d8"
              variantColor="#82ca9d"
            />
          </TabsContent>
          
          <TabsContent value="scatter" className="w-full">
            <ScatterPlot 
              data={processedScatterData}
              height={400}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default RevenueCharts; 