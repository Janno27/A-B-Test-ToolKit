import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

type ConfidenceTooltipProps = {
  kpiType: 'conversion' | 'aov' | 'revenue';
  confidence: number;
  controlValue: number;
  variationValue: number;
  controlCount?: number;
  variationCount?: number;
  controlStd?: number;
  variationStd?: number;
};

export default function ConfidenceTooltip({
  kpiType,
  confidence,
  controlValue,
  variationValue,
  controlCount = 0,
  variationCount = 0,
  controlStd = 0,
  variationStd = 0
}: ConfidenceTooltipProps) {
  // Determine dot color based on confidence
  const dotColor = confidence >= 95 
    ? (variationValue >= controlValue ? 'bg-green-500' : 'bg-red-500')
    : confidence >= 85 
      ? 'bg-amber-400' 
      : 'bg-gray-400';
  
  // Generate methodology explanation based on KPI type
  const methodology = getMethodologyExplanation(kpiType);
  
  // Generate calculation formula with real values
  const calculation = getCalculationDetails(
    kpiType, 
    controlValue, 
    variationValue, 
    controlCount, 
    variationCount,
    controlStd,
    variationStd
  );
  
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <span className={`inline-block w-2 h-2 rounded-full ml-1 cursor-help ${dotColor}`}></span>
        </TooltipTrigger>
        <TooltipContent className="w-80 p-2" side="right">
          <div className="space-y-2 text-xs">
            <div className="font-semibold text-sm">{getKpiTitle(kpiType)} - Confidence: {confidence.toFixed(1)}%</div>
            <div className="text-xs opacity-90">{methodology}</div>
            <div className="text-[10px] mt-1 font-mono bg-muted p-1.5 rounded">
              {calculation}
            </div>
            <div className="mt-1 text-[10px] font-medium">
              {confidence >= 95 
                ? "High statistical confidence ≥ 95%" 
                : confidence >= 85 
                  ? "Moderate statistical confidence (85-94%)" 
                  : "Insufficient statistical confidence < 85%"}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// KPI titles
function getKpiTitle(kpiType: string): string {
  switch(kpiType) {
    case 'conversion': return 'Conversion Rate';
    case 'aov': return 'Average Order Value';
    case 'revenue': return 'Revenue';
    default: return 'Metric';
  }
}

// Statistical methodology explanations
function getMethodologyExplanation(kpiType: string): string {
  switch(kpiType) {
    case 'conversion':
      return "Methodology: Proportion Test (Z-test). Compares conversion rates between groups using normal distribution to determine statistical significance.";
    case 'aov':
      return "Methodology: Student's t-test. Compares average order values between groups, accounting for standard deviations and sample sizes.";
    case 'revenue':
      return "Methodology: Bootstrap. Resampling technique creating multiple samples from data to estimate statistical confidence, suitable for non-normal distributions.";
    default:
      return "Statistical methodology adapted to analyzed data type.";
  }
}

// Calculation details specific to KPI type
function getCalculationDetails(
  kpiType: string, 
  controlValue: number, 
  variationValue: number, 
  controlCount: number, 
  variationCount: number,
  controlStd: number,
  variationStd: number
): string {
  switch(kpiType) {
    case 'conversion':
      // Z-test formula for proportions
      const p1 = controlValue;
      const p2 = variationValue;
      const n1 = controlCount || 100; // Default value to avoid division by zero
      const n2 = variationCount || 100; // Default value to avoid division by zero
      const pPooled = ((p1 * n1) + (p2 * n2)) / (n1 + n2);
      const standardError = Math.sqrt(pPooled * (1 - pPooled) * ((1/n1) + (1/n2)));
      const zScore = Math.abs(p1 - p2) / (standardError || 0.0001); // Avoid division by zero
      
      return `Z-test:
p₁ = ${(p1 * 100).toFixed(2)}%, p₂ = ${(p2 * 100).toFixed(2)}%
n₁ = ${n1}, n₂ = ${n2}
Z = |p₁ - p₂| / √[p̂(1-p̂)(1/n₁ + 1/n₂)]
Z ≈ ${zScore.toFixed(2)}`;
      
    case 'aov':
      // t-test formula for means
      const mean1 = controlValue;
      const mean2 = variationValue;
      const s1 = controlStd;
      const s2 = variationStd;
      const n1Aov = controlCount || 100; // Default value to avoid division by zero
      const n2Aov = variationCount || 100; // Default value to avoid division by zero
      const standardErrorT = Math.sqrt((s1*s1/n1Aov) + (s2*s2/n2Aov));
      const tScore = Math.abs(mean1 - mean2) / (standardErrorT || 0.0001); // Avoid division by zero
      const df = Math.floor(((s1*s1/n1Aov + s2*s2/n2Aov)**2) / 
        (((s1*s1/n1Aov)**2/(Math.max(n1Aov-1, 1))) + ((s2*s2/n2Aov)**2/(Math.max(n2Aov-1, 1)))));
      
      return `t-test:
x̄₁ = ${mean1.toFixed(2)}, x̄₂ = ${mean2.toFixed(2)}
s₁ = ${s1.toFixed(2)}, s₂ = ${s2.toFixed(2)}
t = |x̄₁ - x̄₂| / √[(s₁²/n₁) + (s₂²/n₂)]
t ≈ ${tScore.toFixed(2)}, df ≈ ${df}`;
      
    case 'revenue':
      // Bootstrap method
      return `Bootstrap:
Control = ${controlValue.toFixed(1)} ± ${controlStd.toFixed(1)}
Variation = ${variationValue.toFixed(1)} ± ${variationStd.toFixed(1)}
Diff = ${(variationValue - controlValue).toFixed(1)}
CI95 = [${(variationValue - controlValue - 1.96*Math.sqrt(controlStd*controlStd + variationStd*variationStd)).toFixed(1)}, ${(variationValue - controlValue + 1.96*Math.sqrt(controlStd*controlStd + variationStd*variationStd)).toFixed(1)}]`;
      
    default:
      return "Statistical calculation adapted to data type.";
  }
} 