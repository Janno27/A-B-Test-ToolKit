import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

type ImpactTooltipProps = {
  type: 'conversions' | 'order_value' | 'revenue' | 'revenue_per_user';
  controlValue: number;
  variationValue: number;
  controlUsers: number;
  variationUsers: number;
};

export default function ImpactTooltip({
  type,
  controlValue,
  variationValue,
  controlUsers,
  variationUsers
}: ImpactTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-muted text-muted-foreground ml-1 cursor-help">
            <Info className="h-2.5 w-2.5" />
          </div>
        </TooltipTrigger>
        <TooltipContent className="w-80 p-2" side="right">
          <div className="space-y-2 text-xs">
            <div className="font-semibold text-sm">{getImpactTitle(type)}</div>
            <div className="text-xs opacity-90">
              {getExplanation(type)}
            </div>
            <div className="text-[10px] mt-1 font-mono bg-muted p-1.5 rounded">
              {getCalculation(type, controlValue, variationValue, controlUsers, variationUsers)}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Business impact titles
function getImpactTitle(type: string): string {
  switch(type) {
    case 'conversions': return 'Impact on Conversions';
    case 'order_value': return 'Impact on Average Order Value';
    case 'revenue': return 'Impact on Revenue';
    case 'revenue_per_user': return 'Impact on Revenue per User';
    default: return 'Business Impact';
  }
}

// Calculation explanations
function getExplanation(type: string): string {
  switch(type) {
    case 'conversions':
      return "Projection of total additional conversions if the variation were deployed to all current users. Based on the difference in conversion rates between groups.";
    
    case 'order_value':
      return "Difference in average order value between groups. Represents the increase or decrease in typical order value with the variation.";
    
    case 'revenue':
      return "Projection of total revenue impact if the variation were deployed to all users. Calculated from the difference in revenue per user between groups.";
    
    case 'revenue_per_user':
      return "Difference in average revenue generated per user between control and variation groups. This metric combines effects on conversion rate and average order value.";
    
    default:
      return "Calculation of projected business impact based on observed performance.";
  }
}

// Calculation details specific to impact type
function getCalculation(
  type: string, 
  controlValue: number, 
  variationValue: number, 
  controlUsers: number, 
  variationUsers: number
): string {
  switch(type) {
    case 'conversions':
      // Difference in conversion rates × total users
      const controlConvRate = controlValue;
      const variationConvRate = variationValue;
      const totalUsers = controlUsers + variationUsers;
      const projectedDiffConv = Math.round((variationConvRate - controlConvRate) * totalUsers);
      
      return `Conversion rate difference:
${(variationConvRate * 100).toFixed(2)}% - ${(controlConvRate * 100).toFixed(2)}% = ${((variationConvRate - controlConvRate) * 100).toFixed(2)}%

Projected impact:
${((variationConvRate - controlConvRate) * 100).toFixed(2)}% × ${totalUsers} users 
= ${projectedDiffConv} conversions`;
      
    case 'order_value':
      // Direct difference between average order values
      const diffAOV = variationValue - controlValue;
      
      return `Average order value:
Control: ${controlValue.toFixed(1)} €
Variation: ${variationValue.toFixed(1)} €

Difference: ${(diffAOV > 0 ? '+' : '')}${diffAOV.toFixed(1)} €
Relative impact: ${(diffAOV / controlValue * 100).toFixed(1)}%`;
      
    case 'revenue':
      // Calculation of projected revenue difference
      const revenuePerControlUser = controlUsers > 0 ? controlValue / controlUsers : 0;
      const revenuePerVariationUser = variationUsers > 0 ? variationValue / variationUsers : 0;
      const totalUsers2 = controlUsers + variationUsers;
      const projectedRevenue = (revenuePerVariationUser - revenuePerControlUser) * totalUsers2;
      
      return `Revenue per user:
Control: ${revenuePerControlUser.toFixed(1)} € (${controlValue.toFixed(1)} € ÷ ${controlUsers})
Variation: ${revenuePerVariationUser.toFixed(1)} € (${variationValue.toFixed(1)} € ÷ ${variationUsers})

Projected impact:
(${revenuePerVariationUser.toFixed(1)} € - ${revenuePerControlUser.toFixed(1)} €) × ${totalUsers2} users
= ${projectedRevenue.toFixed(1)} €`;
      
    case 'revenue_per_user':
      // Direct calculation of revenue per user
      const rpu1 = controlUsers > 0 ? controlValue / controlUsers : 0;
      const rpu2 = variationUsers > 0 ? variationValue / variationUsers : 0;
      const diffRPU = rpu2 - rpu1;
      
      return `Revenue per user:
Control: ${rpu1.toFixed(1)} € (${controlValue.toFixed(1)} € ÷ ${controlUsers})
Variation: ${rpu2.toFixed(1)} € (${variationValue.toFixed(1)} € ÷ ${variationUsers})

Difference: ${(diffRPU > 0 ? '+' : '')}${diffRPU.toFixed(1)} €
Relative impact: ${(diffRPU / (rpu1 || 1) * 100).toFixed(1)}%`;
      
    default:
      return "Business impact calculation based on analysis data.";
  }
} 