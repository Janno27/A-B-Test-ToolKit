import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import KpiDetailTab from "./KpiDetailTab";

interface RevenueDashboardProps {
  analysisResults: any;
  usersPerVariation: Record<string, string>;
}

export default function RevenueDashboard({ 
  analysisResults,
  usersPerVariation
}: RevenueDashboardProps) {
  
  // Convert users from string to number
  const usersControl = parseInt(usersPerVariation["control"] || "0");
  const usersVariation = parseInt(usersPerVariation["variation"] || "0");
  
  // Get interpretations for each KPI
  const interpretationsConversion = [
    "Conversion rate represents the percentage of users who completed a transaction.",
    analysisResults?.conversion_metrics?.interpretation || 
      `The variation ${analysisResults?.conversion_metrics?.uplift >= 0 ? 'increased' : 'decreased'} conversion rate by ${Math.abs(analysisResults?.conversion_metrics?.uplift || 0).toFixed(2)}%.`,
    analysisResults?.conversion_metrics?.test_result?.confidence >= 95 
      ? "With high statistical confidence, we can attribute this change to the variation rather than random chance."
      : "More data may be needed to reach high statistical confidence."
  ];
  
  const interpretationsAov = [
    "Average Order Value (AOV) represents the average amount spent per transaction.",
    analysisResults?.aov_metrics?.interpretation || 
      `The variation ${analysisResults?.aov_metrics?.uplift >= 0 ? 'increased' : 'decreased'} AOV by ${Math.abs(analysisResults?.aov_metrics?.uplift || 0).toFixed(2)}%.`,
    analysisResults?.aov_metrics?.test_result?.confidence >= 95 
      ? "With high statistical confidence, we can attribute this change to the variation rather than random chance."
      : "More data may be needed to reach high statistical confidence."
  ];
  
  const interpretationsRevenue = [
    "Revenue represents the total revenue generated in each group.",
    analysisResults?.revenue_metrics?.interpretation || 
      `The variation ${analysisResults?.revenue_metrics?.uplift >= 0 ? 'increased' : 'decreased'} revenue by ${Math.abs(analysisResults?.revenue_metrics?.uplift || 0).toFixed(2)}%.`,
    analysisResults?.revenue_metrics?.test_result?.confidence >= 95 
      ? "With high statistical confidence, we can attribute this change to the variation rather than random chance."
      : "More data may be needed to reach high statistical confidence."
  ];
  
  // Calculate Revenue per User metrics
  const revenuePerUserControl = usersControl > 0 
    ? (analysisResults?.revenue_metrics?.control_value || 0) / usersControl 
    : 0;
  
  const revenuePerUserVariation = usersVariation > 0 
    ? (analysisResults?.revenue_metrics?.variation_value || 0) / usersVariation 
    : 0;
  
  const revenuePerUserUplift = revenuePerUserControl > 0 
    ? ((revenuePerUserVariation - revenuePerUserControl) / revenuePerUserControl) * 100 
    : 0;
  
  // Create a revenue per user mock metrics object
  const revenuePerUserMetrics = {
    control_value: revenuePerUserControl,
    variation_value: revenuePerUserVariation,
    uplift: revenuePerUserUplift,
    test_result: {
      confidence: analysisResults?.revenue_metrics?.test_result?.confidence || 0,
      significant: analysisResults?.revenue_metrics?.test_result?.significant || false,
      pValue: analysisResults?.revenue_metrics?.test_result?.pValue || 0.5
    }
  };
  
  const interpretationsRevenuePerUser = [
    "Revenue per User represents the average revenue generated per user, accounting for both conversion rate and order value.",
    `The variation ${revenuePerUserUplift >= 0 ? 'increased' : 'decreased'} revenue per user by ${Math.abs(revenuePerUserUplift).toFixed(2)}%.`,
    analysisResults?.revenue_metrics?.test_result?.confidence >= 95 
      ? "With high statistical confidence, we can attribute this change to the variation rather than random chance."
      : "More data may be needed to reach high statistical confidence."
  ];
  
  // Create a summary interpretation
  const interpretationsSummary = [
    ...(analysisResults?.basic_interpretation || []),
    "The analysis compares the performance of the control and variation groups across multiple KPIs.",
    `Overall, the variation ${analysisResults?.revenue_metrics?.uplift >= 0 ? 'positively' : 'negatively'} impacted revenue with ${analysisResults?.revenue_metrics?.test_result?.confidence.toFixed(1)}% confidence.`,
    analysisResults?.conversion_metrics?.uplift !== 0 && 
      `Conversion rate ${analysisResults?.conversion_metrics?.uplift >= 0 ? 'increased' : 'decreased'} by ${Math.abs(analysisResults?.conversion_metrics?.uplift).toFixed(2)}% (${analysisResults?.conversion_metrics?.test_result?.confidence.toFixed(1)}% confidence).`,
    analysisResults?.aov_metrics?.uplift !== 0 && 
      `Average order value ${analysisResults?.aov_metrics?.uplift >= 0 ? 'increased' : 'decreased'} by ${Math.abs(analysisResults?.aov_metrics?.uplift).toFixed(2)}% (${analysisResults?.aov_metrics?.test_result?.confidence.toFixed(1)}% confidence).`,
  ].filter(Boolean);
  
  return (
    <div>
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="w-full flex justify-center mb-4">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="conversion">Conversion Rate</TabsTrigger>
          <TabsTrigger value="aov">AOV</TabsTrigger>
          <TabsTrigger value="revenue-per-user">Revenue per User</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>
        
        {/* Summary Tab */}
        <TabsContent value="summary">
          <KpiDetailTab
            title="Summary"
            metrics={analysisResults?.revenue_metrics || {control_value: 0, variation_value: 0, uplift: 0, test_result: {confidence: 0, significant: false, pValue: 0.5}}}
            statisticsControl={analysisResults?.basic_statistics?.control || {count: 0, mean: 0, std: 0, min_value: 0, max_value: 0}}
            statisticsVariation={analysisResults?.basic_statistics?.variation || {count: 0, mean: 0, std: 0, min_value: 0, max_value: 0}}
            usersControl={usersControl}
            usersVariation={usersVariation}
            interpretations={interpretationsSummary}
            kpiType="revenue"
          />
        </TabsContent>
        
        {/* Conversion Rate Tab */}
        <TabsContent value="conversion">
          <KpiDetailTab
            title="Conversion Rate"
            metrics={analysisResults?.conversion_metrics || {control_value: 0, variation_value: 0, uplift: 0, test_result: {confidence: 0, significant: false, pValue: 0.5}}}
            statisticsControl={analysisResults?.basic_statistics?.control || {count: 0, mean: 0, std: 0, min_value: 0, max_value: 0}}
            statisticsVariation={analysisResults?.basic_statistics?.variation || {count: 0, mean: 0, std: 0, min_value: 0, max_value: 0}}
            usersControl={usersControl}
            usersVariation={usersVariation}
            isPercentage={true}
            interpretations={interpretationsConversion}
            kpiType="conversion"
          />
        </TabsContent>
        
        {/* AOV Tab */}
        <TabsContent value="aov">
          <KpiDetailTab
            title="Average Order Value"
            metrics={analysisResults?.aov_metrics || {control_value: 0, variation_value: 0, uplift: 0, test_result: {confidence: 0, significant: false, pValue: 0.5}}}
            statisticsControl={analysisResults?.basic_statistics?.control || {count: 0, mean: 0, std: 0, min_value: 0, max_value: 0}}
            statisticsVariation={analysisResults?.basic_statistics?.variation || {count: 0, mean: 0, std: 0, min_value: 0, max_value: 0}}
            usersControl={usersControl}
            usersVariation={usersVariation}
            interpretations={interpretationsAov}
            kpiType="aov"
          />
        </TabsContent>
        
        {/* Revenue per User Tab */}
        <TabsContent value="revenue-per-user">
          <KpiDetailTab
            title="Revenue per User"
            metrics={revenuePerUserMetrics}
            statisticsControl={analysisResults?.basic_statistics?.control || {count: 0, mean: 0, std: 0, min_value: 0, max_value: 0}}
            statisticsVariation={analysisResults?.basic_statistics?.variation || {count: 0, mean: 0, std: 0, min_value: 0, max_value: 0}}
            usersControl={usersControl}
            usersVariation={usersVariation}
            interpretations={interpretationsRevenuePerUser}
            kpiType="revenue_per_user"
          />
        </TabsContent>
        
        {/* Revenue Tab */}
        <TabsContent value="revenue">
          <KpiDetailTab
            title="Revenue"
            metrics={analysisResults?.revenue_metrics || {control_value: 0, variation_value: 0, uplift: 0, test_result: {confidence: 0, significant: false, pValue: 0.5}}}
            statisticsControl={analysisResults?.basic_statistics?.control || {count: 0, mean: 0, std: 0, min_value: 0, max_value: 0}}
            statisticsVariation={analysisResults?.basic_statistics?.variation || {count: 0, mean: 0, std: 0, min_value: 0, max_value: 0}}
            usersControl={usersControl}
            usersVariation={usersVariation}
            interpretations={interpretationsRevenue}
            kpiType="revenue"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
} 