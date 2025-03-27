function calculateFrequentist(data: {
  visits: number;
  conversions: number;
  traffic: number;
  variations: number;
  improvement: number;
  confidence: number;
}) {
  const { visits, conversions, traffic, variations, improvement, confidence } = data;
  
  // Convert percentage values to decimals
  const p = conversions / visits; // baseline conversion rate
  const trafficDecimal = traffic / 100;
  const improvementDecimal = improvement / 100;
  
  // Calculate Z-scores
  const alpha = 1 - (confidence / 100);
  const zAlpha = 1.96; // Approximation for 95% confidence
  const zBeta = 0.84; // Power = 80%
  
  // Calculate minimum detectable effect
  const mde = p * improvementDecimal;
  
  // Calculate sample size per variation
  const numerator = Math.pow(zAlpha + zBeta, 2) * 2 * p * (1 - p);
  const denominator = Math.pow(mde, 2);
  
  const sampleSize = Math.ceil(numerator / denominator);
  
  // Calculate total sample size accounting for number of variations
  const totalSampleSize = sampleSize * variations;
  
  // Calculate days needed
  const dailyTestVisitors = visits * trafficDecimal;
  const daysNeeded = Math.ceil(totalSampleSize / dailyTestVisitors);
  
  return {
    days: daysNeeded,
    minSample: totalSampleSize
  };
}

function calculateBayesian(data: {
  visits: number;
  conversions: number;
  traffic: number;
  variations: number;
  improvement: number;
  confidence: number;
}) {
  const { visits, conversions, traffic, variations, improvement, confidence } = data;
  
  // Simplified Bayesian calculation
  const conversionRate = conversions / visits;
  const trafficDecimal = traffic / 100;
  const improvementDecimal = improvement / 100;
  
  // Calculate required sample size based on effect size
  const effectSize = conversionRate * improvementDecimal;
  const baselineSampleSize = Math.ceil(16 / Math.pow(effectSize, 2));
  const totalSampleSize = baselineSampleSize * variations;
  
  // Calculate days needed
  const dailyTestVisitors = visits * trafficDecimal;
  const daysNeeded = Math.ceil(totalSampleSize / dailyTestVisitors);
  
  return {
    days: daysNeeded,
    minSample: totalSampleSize
  };
}

export { calculateFrequentist, calculateBayesian };