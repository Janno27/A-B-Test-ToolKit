import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, TrendingUp, TrendingDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ConfidenceTooltip from "./ConfidenceTooltip";

interface KpiDetailTabProps {
  title: string;
  metrics: {
    control_value: number;
    variation_value: number;
    uplift: number;
    test_result: {
      confidence: number;
      significant: boolean;
      pValue: number;
    };
  };
  statisticsControl: {
    count: number;
    mean: number;
    median?: number;
    std?: number;
    min_value?: number;
    max_value?: number;
  };
  statisticsVariation: {
    count: number;
    mean: number;
    median?: number;
    std?: number;
    min_value?: number;
    max_value?: number;
  };
  usersControl: number;
  usersVariation: number;
  isPercentage?: boolean;
  interpretations: string[];
  kpiType: 'conversion' | 'aov' | 'revenue' | 'revenue_per_user';
}

export default function KpiDetailTab({
  title,
  metrics,
  statisticsControl,
  statisticsVariation,
  usersControl,
  usersVariation,
  isPercentage = false,
  interpretations,
  kpiType
}: KpiDetailTabProps) {
  
  // S'assurer que toutes les propriétés statistiques ont des valeurs par défaut
  const stdControl = statisticsControl.std ?? 0;
  const stdVariation = statisticsVariation.std ?? 0;
  const minValueControl = statisticsControl.min_value ?? 0;
  const minValueVariation = statisticsVariation.min_value ?? 0;
  const maxValueControl = statisticsControl.max_value ?? 0;
  const maxValueVariation = statisticsVariation.max_value ?? 0;
  
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
      
      {/* Detailed Statistics */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle>Statistical Analysis</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Metric</TableHead>
                <TableHead>Control</TableHead>
                <TableHead>Variation</TableHead>
                <TableHead>Difference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Sample Size</TableCell>
                <TableCell>{statisticsControl.count}</TableCell>
                <TableCell>{statisticsVariation.count}</TableCell>
                <TableCell>
                  {statisticsVariation.count - statisticsControl.count >= 0 ? '+' : ''}
                  {statisticsVariation.count - statisticsControl.count}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Mean</TableCell>
                <TableCell>{isPercentage ? (statisticsControl.mean * 100).toFixed(2) + '%' : statisticsControl.mean.toFixed(2)}</TableCell>
                <TableCell>{isPercentage ? (statisticsVariation.mean * 100).toFixed(2) + '%' : statisticsVariation.mean.toFixed(2)}</TableCell>
                <TableCell className={statisticsVariation.mean >= statisticsControl.mean ? "text-green-600" : "text-red-600"}>
                  {statisticsVariation.mean >= statisticsControl.mean ? '+' : ''}
                  {isPercentage ? 
                    ((statisticsVariation.mean - statisticsControl.mean) * 100).toFixed(2) + '%' : 
                    (statisticsVariation.mean - statisticsControl.mean).toFixed(2)}
                </TableCell>
              </TableRow>
              {statisticsControl.median && statisticsVariation.median && (
                <TableRow>
                  <TableCell className="font-medium">Median</TableCell>
                  <TableCell>{isPercentage ? (statisticsControl.median * 100).toFixed(2) + '%' : statisticsControl.median.toFixed(2)}</TableCell>
                  <TableCell>{isPercentage ? (statisticsVariation.median * 100).toFixed(2) + '%' : statisticsVariation.median.toFixed(2)}</TableCell>
                  <TableCell className={statisticsVariation.median >= statisticsControl.median ? "text-green-600" : "text-red-600"}>
                    {statisticsVariation.median >= statisticsControl.median ? '+' : ''}
                    {isPercentage ? 
                      ((statisticsVariation.median - statisticsControl.median) * 100).toFixed(2) + '%' : 
                      (statisticsVariation.median - statisticsControl.median).toFixed(2)}
                  </TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell className="font-medium">Standard Deviation</TableCell>
                <TableCell>{stdControl.toFixed(2)}</TableCell>
                <TableCell>{stdVariation.toFixed(2)}</TableCell>
                <TableCell>
                  {stdVariation - stdControl >= 0 ? '+' : ''}
                  {(stdVariation - stdControl).toFixed(2)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Minimum Value</TableCell>
                <TableCell>{isPercentage ? (minValueControl * 100).toFixed(2) + '%' : minValueControl.toFixed(2)}</TableCell>
                <TableCell>{isPercentage ? (minValueVariation * 100).toFixed(2) + '%' : minValueVariation.toFixed(2)}</TableCell>
                <TableCell>
                  {minValueVariation - minValueControl >= 0 ? '+' : ''}
                  {isPercentage ? 
                    ((minValueVariation - minValueControl) * 100).toFixed(2) + '%' : 
                    (minValueVariation - minValueControl).toFixed(2)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Maximum Value</TableCell>
                <TableCell>{isPercentage ? (maxValueControl * 100).toFixed(2) + '%' : maxValueControl.toFixed(2)}</TableCell>
                <TableCell>{isPercentage ? (maxValueVariation * 100).toFixed(2) + '%' : maxValueVariation.toFixed(2)}</TableCell>
                <TableCell>
                  {maxValueVariation - maxValueControl >= 0 ? '+' : ''}
                  {isPercentage ? 
                    ((maxValueVariation - maxValueControl) * 100).toFixed(2) + '%' : 
                    (maxValueVariation - maxValueControl).toFixed(2)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">p-value</TableCell>
                <TableCell colSpan={2}>{metrics.test_result.pValue?.toFixed(4) || 'N/A'}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-xs px-2 py-0 h-5 ${(metrics.test_result.pValue ?? 1) < 0.05 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                    {(metrics.test_result.pValue ?? 1) < 0.05 ? "Significant" : "Not significant"}
                  </Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Confidence</TableCell>
                <TableCell colSpan={2}>{metrics.test_result.confidence?.toFixed(2) || 'N/A'}%</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-xs px-2 py-0 h-5 ${getConfidenceClass()}`}>
                    {metrics.test_result.confidence >= 95 ? "High" : 
                     metrics.test_result.confidence >= 85 ? "Moderate" : 
                     "Low"}
                  </Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
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
              with a statistical confidence of {metrics.test_result.confidence?.toFixed(2) || 'N/A'}%.
            </li>
            <li>
              This result is {(metrics.test_result.pValue ?? 1) < 0.05 ? "statistically significant" : "not statistically significant"} 
              (p-value = {metrics.test_result.pValue?.toFixed(4) || 'N/A'}).
            </li>
            {(metrics.test_result.confidence ?? 0) < 95 && (
              <li className="text-amber-700">
                More data may be required to reach high confidence (95%+). Current confidence level is {metrics.test_result.confidence?.toFixed(2) || 'N/A'}%.
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