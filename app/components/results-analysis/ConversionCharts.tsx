import { FC } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ErrorBar } from "recharts";
import HorizontalBarChart from './HorizontalBarChart';

interface ConversionChartsProps {
  controlRate?: number;
  variantRate?: number;
  confidenceInterval?: {
    control: [number, number]; // [lower, upper]
    variant: [number, number]; // [lower, upper]
  };
}

const ConversionCharts: FC<ConversionChartsProps> = ({
  controlRate = 0.18,
  variantRate = 0.22,
  confidenceInterval
}) => {
  // Convert data to format expected by charts
  const getConversionData = () => {
    // If we have actual data, use it
    const controlColor = "#8884d8";
    const variantColor = "#82ca9d";
    
    return [
      { 
        name: "Control", 
        value: controlRate, 
        color: controlColor,
        errorY: confidenceInterval ? [
          Math.max(0, controlRate - confidenceInterval.control[0]),
          Math.max(0, confidenceInterval.control[1] - controlRate)
        ] : undefined
      },
      { 
        name: "Variant", 
        value: variantRate, 
        color: variantColor,
        errorY: confidenceInterval ? [
          Math.max(0, variantRate - confidenceInterval.variant[0]),
          Math.max(0, confidenceInterval.variant[1] - variantRate)
        ] : undefined
      }
    ];
  };
  
  const conversionComparisonData = getConversionData();
  
  // Debug
  console.log("Conversion Data:", conversionComparisonData);
  
  return (
    <Card className="w-full mt-6">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-center">Conversion Analysis Charts</CardTitle>
      </CardHeader>
      <CardContent>
        <HorizontalBarChart 
          data={conversionComparisonData} 
          height={400}
          defaultColor="#8884d8"
          referenceLine={controlRate}
          referenceLineLabel="Control Average"
        />
      </CardContent>
    </Card>
  );
};

export default ConversionCharts; 