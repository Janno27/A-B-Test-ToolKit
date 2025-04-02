"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown, InfoIcon, ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useEffect, useState } from "react";

interface StatisticalResult {
  testName: string;
  pValue: number;
  confidence: number;
  significant: boolean;
  power: number;
}

interface MetricResult {
  metricName: string;
  controlValue: number;
  variationValue: number;
  uplift: number;
  testResult: StatisticalResult;
  interpretation: string;
}

interface AnalysisResultsProps {
  kpiName: string;
  isLoading?: boolean;
  fileId?: string; // File identifier to retrieve analysis results
  analysisResults?: any; // Results returned directly from backend
}

export default function AnalysisResults({ kpiName, isLoading = false, fileId, analysisResults }: AnalysisResultsProps) {
  // State to store analysis results from API
  const [results, setResults] = useState<{
    basic_statistics: { [key: string]: { [key: string]: number } };
    basic_interpretation: string[];
    conversion_metrics?: {
      metric_name: string;
      control_value: number;
      variation_value: number;
      uplift: number;
      test_result: {
        test_name: string;
        p_value: number;
        confidence: number;
        significant: boolean;
        power: number;
      };
      interpretation: string;
    };
    aov_metrics?: {
      metric_name: string;
      control_value: number;
      variation_value: number;
      uplift: number;
      test_result: {
        test_name: string;
        p_value: number;
        confidence: number;
        significant: boolean;
        power: number;
      };
      interpretation: string;
    };
    revenue_metrics?: {
      metric_name: string;
      control_value: number;
      variation_value: number;
      uplift: number;
      test_result: {
        test_name: string;
        p_value: number;
        confidence: number;
        significant: boolean;
        power: number;
      };
      interpretation: string;
    };
    message: string;
  } | null>(null);
  
  useEffect(() => {
    // If results are directly provided from parent
    if (analysisResults) {
      setResults(analysisResults);
      return;
    }
    
    // Otherwise, if fileId is provided, fetch results from API
    if (fileId) {
      const fetchResults = async () => {
        try {
          const response = await fetch(`/api/analysis-results?fileId=${fileId}`);
          if (!response.ok) throw new Error('Failed to load results');
          const data = await response.json();
          setResults(data);
        } catch (error) {
          console.error('Error loading results:', error);
        }
      };
      
      fetchResults();
    }
  }, [fileId, analysisResults]);
  
  const formatValue = (value: number | undefined) => {
    if (value === undefined) return '0.00';
    // Format value based on type
    if (value < 0.01) {
      return value.toExponential(2);
    } else if (value < 1) {
      return value.toFixed(3);
    } else if (value > 1000) {
      return value.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      });
    } else {
      return value.toFixed(2);
    }
  };
  
  const formatPercentage = (value: number | undefined) => {
    if (value === undefined) return '0.00%';
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };
  
  if (isLoading || !results) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>Loading analysis results...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card className="border border-border/40 bg-card/50 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{kpiName} Results</CardTitle>
          <CardDescription>{results.message}</CardDescription>
        </CardHeader>
      </Card>
      
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="conversion">Conversion</TabsTrigger>
          <TabsTrigger value="aov">AOV</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary" className="space-y-6 mt-4">
          <Card className="border border-border/40 bg-card/50 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {results.conversion_metrics && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Conversion Rate</h4>
                    <div className="flex items-end gap-1">
                      <span className="text-2xl font-bold">{(results.conversion_metrics.variation_value * 100).toFixed(2)}%</span>
                      <span className={`text-sm ${results.conversion_metrics.uplift >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercentage(results.conversion_metrics.uplift)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {results.conversion_metrics.test_result.significant 
                        ? "Statistically significant" 
                        : "Not statistically significant"}
                    </p>
                  </div>
                )}
                
                {results.aov_metrics && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Average Order Value</h4>
                    <div className="flex items-end gap-1">
                      <span className="text-2xl font-bold">${formatValue(results.aov_metrics.variation_value)}</span>
                      <span className={`text-sm ${results.aov_metrics.uplift >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercentage(results.aov_metrics.uplift)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {results.aov_metrics.test_result.significant 
                        ? "Statistically significant" 
                        : "Not statistically significant"}
                    </p>
                  </div>
                )}
                
                {results.revenue_metrics && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Revenue</h4>
                    <div className="flex items-end gap-1">
                      <span className="text-2xl font-bold">${formatValue(results.revenue_metrics.variation_value)}</span>
                      <span className={`text-sm ${results.revenue_metrics.uplift >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercentage(results.revenue_metrics.uplift)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {results.revenue_metrics.test_result.significant 
                        ? "Statistically significant" 
                        : "Not statistically significant"}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-3">Basic Statistics</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      <TableHead>Control</TableHead>
                      <TableHead>Variation</TableHead>
                      <TableHead>Difference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Mean</TableCell>
                      <TableCell>{formatValue(results.basic_statistics.control.mean)}</TableCell>
                      <TableCell>{formatValue(results.basic_statistics.variation.mean)}</TableCell>
                      <TableCell className={results.basic_statistics.variation.mean >= results.basic_statistics.control.mean ? "text-green-600" : "text-red-600"}>
                        {formatPercentage(((results.basic_statistics.variation.mean - results.basic_statistics.control.mean) / results.basic_statistics.control.mean) * 100)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Median</TableCell>
                      <TableCell>{formatValue(results.basic_statistics.control.median)}</TableCell>
                      <TableCell>{formatValue(results.basic_statistics.variation.median)}</TableCell>
                      <TableCell className={results.basic_statistics.variation.median >= results.basic_statistics.control.median ? "text-green-600" : "text-red-600"}>
                        {formatPercentage(((results.basic_statistics.variation.median - results.basic_statistics.control.median) / results.basic_statistics.control.median) * 100)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Std. Dev.</TableCell>
                      <TableCell>{formatValue(results.basic_statistics.control.std_dev)}</TableCell>
                      <TableCell>{formatValue(results.basic_statistics.variation.std_dev)}</TableCell>
                      <TableCell className={results.basic_statistics.variation.std_dev <= results.basic_statistics.control.std_dev ? "text-green-600" : "text-red-600"}>
                        {formatPercentage(((results.basic_statistics.variation.std_dev - results.basic_statistics.control.std_dev) / results.basic_statistics.control.std_dev) * 100)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border border-border/40 bg-card/50 shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Interpretation</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-2 text-sm">
                  {results.basic_interpretation.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            
            <Card className="border border-border/40 bg-card/50 shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Recommendation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <p>
                    {kpiName === "Revenue" 
                      ? results.revenue_metrics?.interpretation
                      : kpiName === "Average Order Value" 
                        ? results.aov_metrics?.interpretation
                        : results.conversion_metrics?.interpretation}
                  </p>
                  {results.revenue_metrics?.test_result.significant || results.conversion_metrics?.test_result.significant ? (
                    <div className="text-green-700">
                      <p className="font-medium">Recommended Action: Implement the variation</p>
                    </div>
                  ) : (
                    <div className="text-amber-700">
                      <p className="font-medium">Recommended Action: Collect more data or focus on other metrics</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Conversion tab content */}
        <TabsContent value="conversion" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border border-border/40 bg-card/50 shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Conversion Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Control</TableCell>
                      <TableCell>{(results.conversion_metrics?.control_value * 100).toFixed(2)}%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Variation</TableCell>
                      <TableCell>{(results.conversion_metrics?.variation_value * 100).toFixed(2)}%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Uplift</TableCell>
                      <TableCell className={results.conversion_metrics?.uplift >= 0 ? "text-green-600" : "text-red-600"}>
                        {formatPercentage(results.conversion_metrics?.uplift)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            
            <Card className="border border-border/40 bg-card/50 shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Statistical Details</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Test Method</TableCell>
                      <TableCell>{results.conversion_metrics?.test_result.test_name}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">p-value</TableCell>
                      <TableCell>{results.conversion_metrics?.test_result.p_value.toFixed(3)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Confidence</TableCell>
                      <TableCell>{results.conversion_metrics?.test_result.confidence.toFixed(1)}%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Significance</TableCell>
                      <TableCell className={results.conversion_metrics?.test_result.significant ? "text-green-600" : "text-amber-600"}>
                        {results.conversion_metrics?.test_result.significant ? "Significant" : "Not significant"}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Power</TableCell>
                      <TableCell>{results.conversion_metrics?.test_result.power.toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                
                <div className="mt-4 space-y-2">
                  <p className="text-sm">{results.conversion_metrics?.interpretation}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* AOV tab content */}
        <TabsContent value="aov" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border border-border/40 bg-card/50 shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Average Order Value Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Control</TableCell>
                      <TableCell>${formatValue(results.aov_metrics?.control_value)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Variation</TableCell>
                      <TableCell>${formatValue(results.aov_metrics?.variation_value)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Uplift</TableCell>
                      <TableCell className={results.aov_metrics?.uplift >= 0 ? "text-green-600" : "text-red-600"}>
                        {formatPercentage(results.aov_metrics?.uplift)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            
            <Card className="border border-border/40 bg-card/50 shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Statistical Details</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Test Method</TableCell>
                      <TableCell>{results.aov_metrics?.test_result.test_name}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">p-value</TableCell>
                      <TableCell>{results.aov_metrics?.test_result.p_value.toFixed(3)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Confidence</TableCell>
                      <TableCell>{results.aov_metrics?.test_result.confidence.toFixed(1)}%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Significance</TableCell>
                      <TableCell className={results.aov_metrics?.test_result.significant ? "text-green-600" : "text-amber-600"}>
                        {results.aov_metrics?.test_result.significant ? "Significant" : "Not significant"}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Power</TableCell>
                      <TableCell>{results.aov_metrics?.test_result.power.toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                
                <div className="mt-4 space-y-2">
                  <p className="text-sm">{results.aov_metrics?.interpretation}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Revenue tab content */}
        <TabsContent value="revenue" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border border-border/40 bg-card/50 shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Revenue Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Control</TableCell>
                      <TableCell>${formatValue(results.revenue_metrics?.control_value)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Variation</TableCell>
                      <TableCell>${formatValue(results.revenue_metrics?.variation_value)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Uplift</TableCell>
                      <TableCell className={results.revenue_metrics?.uplift >= 0 ? "text-green-600" : "text-red-600"}>
                        {formatPercentage(results.revenue_metrics?.uplift)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            
            <Card className="border border-border/40 bg-card/50 shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Statistical Details</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Test Method</TableCell>
                      <TableCell>{results.revenue_metrics?.test_result.test_name}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">p-value</TableCell>
                      <TableCell>{results.revenue_metrics?.test_result.p_value.toFixed(3)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Confidence</TableCell>
                      <TableCell>{results.revenue_metrics?.test_result.confidence.toFixed(1)}%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Significance</TableCell>
                      <TableCell className={results.revenue_metrics?.test_result.significant ? "text-green-600" : "text-amber-600"}>
                        {results.revenue_metrics?.test_result.significant ? "Significant" : "Not significant"}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Power</TableCell>
                      <TableCell>{results.revenue_metrics?.test_result.power.toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                
                <div className="mt-4 space-y-2">
                  <p className="text-sm">{results.revenue_metrics?.interpretation}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 