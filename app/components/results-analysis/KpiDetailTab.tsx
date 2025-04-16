import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, TrendingUp, TrendingDown, Info } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ConfidenceTooltip from "./ConfidenceTooltip";
import ConversionCharts from "./ConversionCharts";
import RevenueCharts from "./RevenueCharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface StatisticsData {
  count: number;
  mean: number;
  median: number;
  std_dev?: number;
  min_value?: number;
  max_value?: number;
  q1?: number;
  q3?: number;
}

interface MetricsData {
  control_value: number;
  variation_value: number;
  uplift: number;
  test_result: {
    confidence: number;
    significant: boolean;
    pValue: number;
    power?: number;
    test_name?: string;
    confidenceInterval?: {
      control: number;
      variant: number;
    };
  };
}

interface KpiDetailTabProps {
  title: string;
  metrics: MetricsData;
  statisticsControl: StatisticsData;
  statisticsVariation: StatisticsData;
  usersControl: number;
  usersVariation: number;
  isPercentage?: boolean;
  interpretations: string[];
  kpiType: 'conversion' | 'aov' | 'revenue' | 'revenue_per_user';
  rawData?: {
    control: number[];
    variation: number[];
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

// Tooltips definitions for metrics in English
const metricTooltips = {
  sampleSize: "Number of samples used in the analysis. The higher this number, the more reliable the results.",
  mean: "Average value, calculated by summing all values and dividing by the number of samples.",
  median: "Middle value that separates the higher half from the lower half of the data.",
  stdDev: "Standard deviation measures the dispersion of values from the mean. A high value indicates greater variability.",
  minValue: "The minimum value observed in the data.",
  maxValue: "The maximum value observed in the data.",
  pValue: "Probability of observing a difference at least as large as the one observed, if the null hypothesis is true. A p-value < 0.05 is generally considered statistically significant.",
  confidence: "Statistical confidence level (1 - p-value) × 100%. A high level indicates greater certainty in the results.",
  power: "Probability of detecting an effect if it actually exists. Power > 80% is generally considered sufficient for reliable tests.",
  zTest: "Z-test compares proportions between two samples, commonly used for conversion rates. It's suitable for large sample sizes and binary outcomes.",
  tTest: "T-test compares means between two samples when the data follows a normal distribution. Welch's t-test is used, which doesn't assume equal variances.",
  mannWhitney: "Mann-Whitney U test is a non-parametric test that compares two samples without assuming normal distribution. It's used when data doesn't follow a normal distribution.",
  bootstrap: "Bootstrap is a resampling method used when traditional statistical assumptions don't hold. It's used for comparing total revenue by creating sampling distributions."
};

// Statistical test descriptions
const testMethodDescriptions = {
  'z-test': "Z-test for proportions",
  't-test': "Welch's t-test for means",
  'mann-whitney': "Mann-Whitney U test",
  'bootstrap': "Bootstrap resampling"
};

export default function KpiDetailTab({
  title,
  metrics,
  statisticsControl,
  statisticsVariation,
  usersControl,
  usersVariation,
  isPercentage = false,
  interpretations,
  kpiType,
  rawData,
  quartiles,
  histogramData,
  frequencyData
}: KpiDetailTabProps) {
  
  // Ensure all statistical properties have default values
  const stdControl = statisticsControl.std_dev ?? 0;
  const stdVariation = statisticsVariation.std_dev ?? 0;
  const minValueControl = statisticsControl.min_value ?? 0;
  const minValueVariation = statisticsVariation.min_value ?? 0;
  const maxValueControl = statisticsControl.max_value ?? 0;
  const maxValueVariation = statisticsVariation.max_value ?? 0;
  
  // Get statistical test method name
  const testMethod = metrics.test_result.test_name || 
    (kpiType === 'conversion' ? 'z-test' : 
     kpiType === 'revenue' ? 'bootstrap' : 
     kpiType === 'aov' || kpiType === 'revenue_per_user' ? 't-test' : 'unknown');
  
  // Format values based on KPI type
  const formatValue = (value: number): string => {
    if (isPercentage) {
      return `${(value * 100).toFixed(2)}%`;
    } else if (kpiType === 'aov' || kpiType === 'revenue_per_user') {
      return `${value.toFixed(2)} €`;
    } else if (kpiType === 'revenue') {
      return `${value.toLocaleString('en-US', {maximumFractionDigits: 1})} €`;
    }
    return value.toString();
  };
  
  // Get confidence level class
  const getConfidenceClass = () => {
    const { confidence } = metrics.test_result;
    if (confidence >= 95) {
      return metrics.uplift >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
    } else if (confidence >= 85) {
      return "bg-amber-100 text-amber-800";
    }
    return "bg-gray-100 text-gray-800";
  };
  
  // Format percentage with sign
  const formatPercentWithSign = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };
  
  // Calculate statistical power if not provided
  const getPower = (): number => {
    // Use backend value if available
    if (metrics.test_result.power !== undefined && metrics.test_result.power !== null) {
      return metrics.test_result.power * 100; // Convert to percentage
    }
    
    // Otherwise, calculate an approximate estimate
    const { pValue } = metrics.test_result;
    if (!pValue || pValue >= 0.5) return 0;
    
    const n1 = statisticsControl.count;
    const n2 = statisticsVariation.count;
    
    if (n1 === 0 || n2 === 0) return 0;
    
    // Simplified power calculation based on sample sizes and effect size
    const effectSize = Math.abs(metrics.variation_value - metrics.control_value) / 
                     (isPercentage ? 0.1 : (stdControl + stdVariation) / 2 || 1);
    
    // Cohen's d effect size categories
    if (effectSize < 0.2) return 0.2 * Math.sqrt((n1 * n2) / (n1 + n2)) * 100;
    if (effectSize < 0.5) return 0.5 * Math.sqrt((n1 * n2) / (n1 + n2)) * 100;
    if (effectSize < 0.8) return 0.8 * Math.sqrt((n1 * n2) / (n1 + n2)) * 100;
    
    return Math.min(95, 0.9 * Math.sqrt((n1 * n2) / (n1 + n2)) * 100);
  };
  
  // Adjusted p-value calculation based on confidence
  const getAdjustedPValue = (): number => {
    if (metrics.test_result.pValue !== undefined && metrics.test_result.pValue !== null) {
      return metrics.test_result.pValue;
    }
    
    // If we have confidence but no p-value, derive it
    if (metrics.test_result.confidence !== undefined && metrics.test_result.confidence !== null) {
      return 1 - (metrics.test_result.confidence / 100);
    }
    
    return 0.5; // Default to 50% confidence (p-value = 0.5)
  };
  
  const pValue = getAdjustedPValue();
  const power = getPower();
  
  // Helper component for metric with tooltip
  const MetricWithTooltip = ({ label, tooltip }: { label: string, tooltip: string }) => (
    <div className="flex items-center">
      {label}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="ml-1 inline-flex items-center justify-center rounded-full p-1 text-xs text-muted-foreground hover:bg-muted/50 hover:text-foreground">
              <Info size={12} />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-sm text-sm">
            {tooltip}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
  
  // Determine which metrics to show based on KPI type
  const shouldShowMetric = (metricName: string): boolean => {
    const commonMetrics = ['Sample Size', 'p-value', 'Confidence', 'Statistical Power', 'Test Method'];
    
    if (commonMetrics.includes(metricName)) return true;
    
    switch (kpiType) {
      case 'conversion':
        return ['Mean', 'Standard Deviation'].includes(metricName);
      case 'aov':
        return ['Mean', 'Median', 'Standard Deviation', 'Minimum Value', 'Maximum Value'].includes(metricName);
      case 'revenue':
        return ['Mean', 'Median', 'Standard Deviation', 'Minimum Value', 'Maximum Value'].includes(metricName);
      case 'revenue_per_user':
        return ['Mean', 'Standard Deviation'].includes(metricName);
      default:
        return true;
    }
  };
  
  // Debug data
  console.log("KpiDetailTab - Visualization data:", {
    kpiType,
    rawData: rawData ? { controlLength: rawData.control?.length, variationLength: rawData.variation?.length } : null,
    quartiles,
    histogramData: histogramData?.length,
    frequencyData: frequencyData ? { control: frequencyData.control?.length, variation: frequencyData.variation?.length } : null
  });
  
  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">Control</CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="text-2xl font-bold">
              {formatValue(metrics.control_value)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {statisticsControl.count} samples
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">Variation</CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="text-2xl font-bold">
              {formatValue(metrics.variation_value)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {statisticsVariation.count} samples
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">Uplift</CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="text-2xl font-bold flex items-center">
              <span className={metrics.uplift >= 0 ? "text-green-600" : "text-red-600"}>
                {formatPercentWithSign(metrics.uplift)}
              </span>
              <ConfidenceTooltip 
                kpiType={kpiType === 'revenue_per_user' ? 'revenue' : kpiType}
                confidence={metrics.test_result.confidence}
                controlValue={metrics.control_value}
                variationValue={metrics.variation_value}
                controlCount={statisticsControl.count}
                variationCount={statisticsVariation.count}
                controlStd={stdControl}
                variationStd={stdVariation}
              />
            </div>
            <div className="flex mt-1">
              <Badge variant="outline" className={`text-xs px-2 py-0 h-5 ${getConfidenceClass()}`}>
                {metrics.test_result.confidence >= 95 ? "High confidence" : 
                 metrics.test_result.confidence >= 85 ? "Moderate confidence" : 
                 "Low confidence"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Detailed Statistics - with subtle grid */}
      <div className="border rounded-md overflow-hidden">
        <Table className="[&_tr:last-child]:border-0 [&_tr]:border-b [&_th]:border-r [&_td]:border-r [&_th:last-child]:border-r-0 [&_td:last-child]:border-r-0 border-gray-100">
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[220px]">Metric</TableHead>
              <TableHead>Control</TableHead>
              <TableHead>Variation</TableHead>
              <TableHead>Difference</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shouldShowMetric('Sample Size') && (
              <TableRow>
                <TableCell className="font-medium">
                  <MetricWithTooltip label="Sample Size" tooltip={metricTooltips.sampleSize} />
                </TableCell>
                <TableCell>{statisticsControl.count}</TableCell>
                <TableCell>{statisticsVariation.count}</TableCell>
                <TableCell>
                  {statisticsVariation.count - statisticsControl.count >= 0 ? '+' : ''}
                  {statisticsVariation.count - statisticsControl.count}
                </TableCell>
              </TableRow>
            )}
            
            {shouldShowMetric('Mean') && (
              <TableRow>
                <TableCell className="font-medium">
                  <MetricWithTooltip label="Mean" tooltip={metricTooltips.mean} />
                </TableCell>
                <TableCell>
                  {kpiType === 'conversion' ? 
                    statisticsControl.mean.toFixed(4) : 
                    isPercentage ? 
                      (statisticsControl.mean * 100).toFixed(2) + '%' : 
                      statisticsControl.mean.toFixed(2)}
                  {kpiType === 'aov' || kpiType === 'revenue' || kpiType === 'revenue_per_user' ? ' €' : ''}
                </TableCell>
                <TableCell>
                  {kpiType === 'conversion' ? 
                    statisticsVariation.mean.toFixed(4) : 
                    isPercentage ? 
                      (statisticsVariation.mean * 100).toFixed(2) + '%' : 
                      statisticsVariation.mean.toFixed(2)}
                  {kpiType === 'aov' || kpiType === 'revenue' || kpiType === 'revenue_per_user' ? ' €' : ''}  
                </TableCell>
                <TableCell className={statisticsVariation.mean >= statisticsControl.mean ? "text-green-600" : "text-red-600"}>
                  {statisticsVariation.mean >= statisticsControl.mean ? '+' : ''}
                  {kpiType === 'conversion' ? 
                    (statisticsVariation.mean - statisticsControl.mean).toFixed(4) : 
                    isPercentage ? 
                      ((statisticsVariation.mean - statisticsControl.mean) * 100).toFixed(2) + '%' : 
                      (statisticsVariation.mean - statisticsControl.mean).toFixed(2)}
                  {kpiType === 'aov' || kpiType === 'revenue' || kpiType === 'revenue_per_user' ? ' €' : ''}
                </TableCell>
              </TableRow>
            )}
            
            {shouldShowMetric('Median') && statisticsControl.median && statisticsVariation.median && (
              <TableRow>
                <TableCell className="font-medium">
                  <MetricWithTooltip label="Median" tooltip={metricTooltips.median} />
                </TableCell>
                <TableCell>
                  {kpiType === 'conversion' ? 
                    statisticsControl.median.toFixed(4) : 
                    isPercentage ? 
                      (statisticsControl.median * 100).toFixed(2) + '%' : 
                      statisticsControl.median.toFixed(2)}
                  {kpiType === 'aov' || kpiType === 'revenue' || kpiType === 'revenue_per_user' ? ' €' : ''}
                </TableCell>
                <TableCell>
                  {kpiType === 'conversion' ? 
                    statisticsVariation.median.toFixed(4) : 
                    isPercentage ? 
                      (statisticsVariation.median * 100).toFixed(2) + '%' : 
                      statisticsVariation.median.toFixed(2)}
                  {kpiType === 'aov' || kpiType === 'revenue' || kpiType === 'revenue_per_user' ? ' €' : ''}
                </TableCell>
                <TableCell className={statisticsVariation.median >= statisticsControl.median ? "text-green-600" : "text-red-600"}>
                  {statisticsVariation.median >= statisticsControl.median ? '+' : ''}
                  {kpiType === 'conversion' ? 
                    (statisticsVariation.median - statisticsControl.median).toFixed(4) : 
                    isPercentage ? 
                      ((statisticsVariation.median - statisticsControl.median) * 100).toFixed(2) + '%' : 
                      (statisticsVariation.median - statisticsControl.median).toFixed(2)}
                  {kpiType === 'aov' || kpiType === 'revenue' || kpiType === 'revenue_per_user' ? ' €' : ''}
                </TableCell>
              </TableRow>
            )}
            
            {shouldShowMetric('Standard Deviation') && (
              <TableRow>
                <TableCell className="font-medium">
                  <MetricWithTooltip label="Standard Deviation" tooltip={metricTooltips.stdDev} />
                </TableCell>
                <TableCell>
                  {kpiType === 'conversion' ? 
                    (stdControl || 0.0001).toFixed(6) : 
                    (stdControl || 0.01).toFixed(2)}
                  {kpiType === 'aov' || kpiType === 'revenue' || kpiType === 'revenue_per_user' ? ' €' : ''}
                </TableCell>
                <TableCell>
                  {kpiType === 'conversion' ? 
                    (stdVariation || 0.0001).toFixed(6) : 
                    (stdVariation || 0.01).toFixed(2)}
                  {kpiType === 'aov' || kpiType === 'revenue' || kpiType === 'revenue_per_user' ? ' €' : ''}
                </TableCell>
                <TableCell>
                  {((stdVariation || 0.0001) - (stdControl || 0.0001)) >= 0 ? '+' : ''}
                  {kpiType === 'conversion' ? 
                    ((stdVariation || 0.0001) - (stdControl || 0.0001)).toFixed(6) : 
                    ((stdVariation || 0.01) - (stdControl || 0.01)).toFixed(2)}
                  {kpiType === 'aov' || kpiType === 'revenue' || kpiType === 'revenue_per_user' ? ' €' : ''}
                </TableCell>
              </TableRow>
            )}
            
            {shouldShowMetric('Minimum Value') && (
              <TableRow>
                <TableCell className="font-medium">
                  <MetricWithTooltip label="Minimum Value" tooltip={metricTooltips.minValue} />
                </TableCell>
                <TableCell>
                  {kpiType === 'conversion' ? 
                    minValueControl.toFixed(4) : 
                    isPercentage ? 
                      (minValueControl * 100).toFixed(2) + '%' : 
                      minValueControl.toFixed(2)}
                  {kpiType === 'aov' || kpiType === 'revenue' || kpiType === 'revenue_per_user' ? ' €' : ''}
                </TableCell>
                <TableCell>
                  {kpiType === 'conversion' ? 
                    minValueVariation.toFixed(4) : 
                    isPercentage ? 
                      (minValueVariation * 100).toFixed(2) + '%' : 
                      minValueVariation.toFixed(2)}
                  {kpiType === 'aov' || kpiType === 'revenue' || kpiType === 'revenue_per_user' ? ' €' : ''}
                </TableCell>
                <TableCell>
                  {minValueVariation - minValueControl >= 0 ? '+' : ''}
                  {kpiType === 'conversion' ? 
                    (minValueVariation - minValueControl).toFixed(4) : 
                    isPercentage ? 
                      ((minValueVariation - minValueControl) * 100).toFixed(2) + '%' : 
                      (minValueVariation - minValueControl).toFixed(2)}
                  {kpiType === 'aov' || kpiType === 'revenue' || kpiType === 'revenue_per_user' ? ' €' : ''}
                </TableCell>
              </TableRow>
            )}
            
            {shouldShowMetric('Maximum Value') && (
              <TableRow>
                <TableCell className="font-medium">
                  <MetricWithTooltip label="Maximum Value" tooltip={metricTooltips.maxValue} />
                </TableCell>
                <TableCell>
                  {kpiType === 'conversion' ? 
                    maxValueControl.toFixed(4) : 
                    isPercentage ? 
                      (maxValueControl * 100).toFixed(2) + '%' : 
                      maxValueControl.toFixed(2)}
                  {kpiType === 'aov' || kpiType === 'revenue' || kpiType === 'revenue_per_user' ? ' €' : ''}
                </TableCell>
                <TableCell>
                  {kpiType === 'conversion' ? 
                    maxValueVariation.toFixed(4) : 
                    isPercentage ? 
                      (maxValueVariation * 100).toFixed(2) + '%' : 
                      maxValueVariation.toFixed(2)}
                  {kpiType === 'aov' || kpiType === 'revenue' || kpiType === 'revenue_per_user' ? ' €' : ''}
                </TableCell>
                <TableCell>
                  {maxValueVariation - maxValueControl >= 0 ? '+' : ''}
                  {kpiType === 'conversion' ? 
                    (maxValueVariation - maxValueControl).toFixed(4) : 
                    isPercentage ? 
                      ((maxValueVariation - maxValueControl) * 100).toFixed(2) + '%' : 
                      (maxValueVariation - maxValueControl).toFixed(2)}
                  {kpiType === 'aov' || kpiType === 'revenue' || kpiType === 'revenue_per_user' ? ' €' : ''}
                </TableCell>
              </TableRow>
            )}
            
            {shouldShowMetric('p-value') && (
              <TableRow>
                <TableCell className="font-medium">
                  <MetricWithTooltip label="p-value" tooltip={metricTooltips.pValue} />
                </TableCell>
                <TableCell colSpan={2}>
                  {pValue !== undefined ? pValue.toFixed(4) : '0.5000'}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-xs px-2 py-0 h-5 ${(pValue < 0.05) ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                    {(pValue < 0.05) ? "Significant" : "Not significant"}
                  </Badge>
                </TableCell>
              </TableRow>
            )}
            
            {shouldShowMetric('Confidence') && (
              <TableRow>
                <TableCell className="font-medium">
                  <MetricWithTooltip label="Confidence" tooltip={metricTooltips.confidence} />
                </TableCell>
                <TableCell colSpan={2}>{(metrics.test_result.confidence !== undefined && metrics.test_result.confidence !== null) ? metrics.test_result.confidence.toFixed(2) : ((1 - pValue) * 100).toFixed(2)}%</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-xs px-2 py-0 h-5 ${getConfidenceClass()}`}>
                    {metrics.test_result.confidence >= 95 ? "High" : 
                    metrics.test_result.confidence >= 85 ? "Moderate" : 
                    "Low"}
                  </Badge>
                </TableCell>
              </TableRow>
            )}
            
            {shouldShowMetric('Statistical Power') && (
              <TableRow>
                <TableCell className="font-medium">
                  <MetricWithTooltip label="Statistical Power" tooltip={metricTooltips.power} />
                </TableCell>
                <TableCell colSpan={2}>{power.toFixed(1)}%</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-xs px-2 py-0 h-5 ${power >= 80 ? "bg-green-100 text-green-800" : power >= 50 ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-800"}`}>
                    {power >= 80 ? "Sufficient" : power >= 50 ? "Moderate" : "Insufficient"}
                  </Badge>
                </TableCell>
              </TableRow>
            )}
            
            {shouldShowMetric('Test Method') && (
              <TableRow>
                <TableCell className="font-medium">
                  <MetricWithTooltip 
                    label="Test Method" 
                    tooltip={testMethod === 'z-test' ? metricTooltips.zTest :
                             testMethod === 't-test' ? metricTooltips.tTest :
                             testMethod === 'mann-whitney' ? metricTooltips.mannWhitney :
                             testMethod === 'bootstrap' ? metricTooltips.bootstrap :
                             "Statistical method used to analyze the data."} 
                  />
                </TableCell>
                <TableCell colSpan={3}>
                  {testMethodDescriptions[testMethod as keyof typeof testMethodDescriptions] || testMethod}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Conversion charts - only shown for conversion KPI */}
      {kpiType === 'conversion' && (
        <ConversionCharts />
      )}
      
      {/* Revenue charts - only shown for revenue KPI */}
      {kpiType === 'revenue' && rawData && (
        <RevenueCharts 
          controlData={rawData.control}
          variationData={rawData.variation}
          basicStatistics={{
            control: {
              count: statisticsControl.count,
              mean: statisticsControl.mean,
              median: statisticsControl.median || 0,
              std_dev: statisticsControl.std_dev || 0,
              min_value: statisticsControl.min_value || 0,
              max_value: statisticsControl.max_value || 0,
              q1: statisticsControl.q1,
              q3: statisticsControl.q3
            },
            variation: {
              count: statisticsVariation.count,
              mean: statisticsVariation.mean,
              median: statisticsVariation.median || 0,
              std_dev: statisticsVariation.std_dev || 0,
              min_value: statisticsVariation.min_value || 0,
              max_value: statisticsVariation.max_value || 0,
              q1: statisticsVariation.q1,
              q3: statisticsVariation.q3
            }
          }}
          quartiles={quartiles}
          histogramData={histogramData}
          frequencyData={frequencyData}
        />
      )}
      
      {/* Interpretation */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle>Interpretation</CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <ul className="list-disc space-y-2 pl-5">
            {interpretations.map((interpretation, index) => (
              <li key={index}>{interpretation}</li>
            ))}
            
            {/* Automatic interpretations based on data */}
            <li>
              The variation {metrics.uplift >= 0 ? "outperformed" : "underperformed"} the control by {Math.abs(metrics.uplift).toFixed(2)}% 
              with a statistical confidence of {metrics.test_result.confidence?.toFixed(2) || ((1 - pValue) * 100).toFixed(2)}%.
            </li>
            <li>
              This result is {(pValue < 0.05) ? "statistically significant" : "not statistically significant"} 
              (p-value = {pValue.toFixed(4)}).
            </li>
            {power < 80 && (
              <li className="text-amber-700">
                Statistical power is {power.toFixed(1)}%, which is below the recommended 80%. Results should be interpreted with caution.
              </li>
            )}
            {(metrics.test_result.confidence ?? 0) < 95 && (
              <li className="text-amber-700">
                More data may be required to reach high confidence (95%+). Current confidence level is {metrics.test_result.confidence?.toFixed(2) || ((1 - pValue) * 100).toFixed(2)}%.
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
      
      {/* Business Impact */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle>Business Impact</CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Projected Impact</h4>
              
              {/* KPI-specific impact calculations */}
              {kpiType === 'conversion' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Additional conversions:</span>
                    <span className={metrics.uplift >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                      {metrics.uplift >= 0 ? '+' : ''}
                      {Math.round((metrics.variation_value - metrics.control_value) * (usersControl + usersVariation))}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Based on a user base of {usersControl + usersVariation} users, 
                    implementing the variation would result in 
                    {metrics.uplift >= 0 ? ' an additional ' : ' a loss of '}
                    {Math.abs(Math.round((metrics.variation_value - metrics.control_value) * (usersControl + usersVariation)))} 
                    conversions compared to the control.
                  </div>
                </div>
              )}
              
              {kpiType === 'aov' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Average order value change:</span>
                    <span className={metrics.uplift >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                      {metrics.uplift >= 0 ? '+' : ''}
                      {(metrics.variation_value - metrics.control_value).toFixed(2)} €
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Implementing the variation would result in 
                    {metrics.uplift >= 0 ? ' an increase ' : ' a decrease '}
                    of {Math.abs((metrics.variation_value - metrics.control_value)).toFixed(2)} € 
                    per order, which represents a {Math.abs(metrics.uplift).toFixed(2)}% change.
                  </div>
                </div>
              )}
              
              {kpiType === 'revenue' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Revenue impact:</span>
                    <span className={metrics.uplift >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                      {metrics.uplift >= 0 ? '+' : ''}
                      {Math.round(metrics.variation_value - metrics.control_value).toLocaleString()} €
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Implementing the variation would result in 
                    {metrics.uplift >= 0 ? ' an additional ' : ' a loss of '}
                    {Math.abs(Math.round(metrics.variation_value - metrics.control_value)).toLocaleString()} € 
                    in revenue, which represents a {Math.abs(metrics.uplift).toFixed(2)}% change.
                  </div>
                </div>
              )}
              
              {kpiType === 'revenue_per_user' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Revenue per user change:</span>
                    <span className={metrics.uplift >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                      {metrics.uplift >= 0 ? '+' : ''}
                      {(metrics.variation_value - metrics.control_value).toFixed(2)} €
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Implementing the variation would result in 
                    {metrics.uplift >= 0 ? ' an increase ' : ' a decrease '}
                    of {Math.abs((metrics.variation_value - metrics.control_value)).toFixed(2)} € 
                    per user, which represents a {Math.abs(metrics.uplift).toFixed(2)}% change.
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span>Total revenue impact:</span>
                    <span className={metrics.uplift >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                      {metrics.uplift >= 0 ? '+' : ''}
                      {Math.round((metrics.variation_value - metrics.control_value) * (usersControl + usersVariation)).toLocaleString()} €
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Recommendation</h4>
              <div className="p-3 rounded-md border">
                {metrics.test_result.confidence >= 95 && metrics.uplift > 0 && (
                  <div className="space-y-2">
                    <div className="font-medium text-green-700 flex items-center">
                      <ArrowUp className="mr-1 h-4 w-4" />
                      Implement the variation
                    </div>
                    <p className="text-sm">
                      With high statistical confidence and positive impact, implementing the variation is recommended.
                    </p>
                  </div>
                )}
                
                {metrics.test_result.confidence >= 95 && metrics.uplift <= 0 && (
                  <div className="space-y-2">
                    <div className="font-medium text-red-700 flex items-center">
                      <ArrowDown className="mr-1 h-4 w-4" />
                      Keep the control version
                    </div>
                    <p className="text-sm">
                      With high statistical confidence and negative impact, keeping the control version is recommended.
                    </p>
                  </div>
                )}
                
                {metrics.test_result.confidence >= 85 && metrics.test_result.confidence < 95 && metrics.uplift > 0 && (
                  <div className="space-y-2">
                    <div className="font-medium text-amber-700 flex items-center">
                      <TrendingUp className="mr-1 h-4 w-4" />
                      Consider implementing with caution
                    </div>
                    <p className="text-sm">
                      With moderate confidence and positive impact, consider implementing the variation but monitor closely.
                    </p>
                  </div>
                )}
                
                {metrics.test_result.confidence < 85 && (
                  <div className="space-y-2">
                    <div className="font-medium text-blue-700 flex items-center">
                      <TrendingUp className="mr-1 h-4 w-4" />
                      Collect more data
                    </div>
                    <p className="text-sm">
                      With low confidence, more data is needed to make a reliable decision.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 