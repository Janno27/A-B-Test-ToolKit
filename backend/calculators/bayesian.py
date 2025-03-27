import math
import numpy as np

def calculate_bayesian(visits, conversions, traffic, variations, improvement, confidence):
    """
    Calculate the sample size and test duration using the Bayesian approach.
    
    Parameters:
    -----------
    visits : float
        Daily visits to the website
    conversions : float
        Daily conversions
    traffic : float
        Percentage of traffic to include in the test
    variations : int
        Number of test variations (including control)
    improvement : float
        Expected improvement in conversion rate (percentage)
    confidence : float
        Statistical confidence level (percentage)
        
    Returns:
    --------
    dict
        Dictionary containing days needed and minimum sample size
    """
    # Bayesian calculation using Beta distribution
    alpha_prior = 0.5  # Jeffrey's prior for better small sample behavior
    beta_prior = 0.5   # Jeffrey's prior
    
    # Convert to decimals
    p = conversions / visits  # baseline conversion rate
    traffic_decimal = traffic / 100
    improvement_decimal = improvement / 100
    
    # Set target improvement based on relative lift
    target_rate = p * (1 + improvement_decimal)
    
    # Required probability of being better
    required_prob = confidence / 100
    
    # Simulate A/B test with different sample sizes
    def simulate_bayesian_test(sample_size_per_variation):
        # Scale based on daily metrics to test-specific metrics
        control_size = sample_size_per_variation
        treatment_size = sample_size_per_variation
        
        # Expected conversions based on current rate
        control_conversions = control_size * p
        # Expected conversions with improvement
        treatment_conversions = treatment_size * target_rate
        
        # Generate posterior distributions
        control_posterior = np.random.beta(
            alpha_prior + control_conversions,
            beta_prior + control_size - control_conversions,
            50000  # Simulations for reasonable accuracy
        )
        
        treatment_posterior = np.random.beta(
            alpha_prior + treatment_conversions,
            beta_prior + treatment_size - treatment_conversions,
            50000  # Simulations for reasonable accuracy
        )
        
        # Calculate probability that treatment is better
        prob_improvement = np.mean(treatment_posterior > control_posterior)
        
        # Check if the probability meets our threshold
        return prob_improvement >= required_prob
    
    # Handle edge cases
    if p <= 0 or improvement_decimal <= 0 or traffic_decimal <= 0:
        return {
            "days": 9999,
            "minSample": 9999999
        }
    
    # Binary search to find minimum sample size
    min_sample = 100  # Start with a reasonable minimum
    max_sample = int(1e6)  # Cap at a reasonable maximum
    
    # Edge case: for very small improvements, we need larger samples
    if improvement_decimal < 0.005:
        min_sample = 10000
    
    # Binary search to efficiently find the minimum sample size
    while max_sample - min_sample > 100:
        mid_sample = (min_sample + max_sample) // 2
        if simulate_bayesian_test(mid_sample):
            max_sample = mid_sample
        else:
            min_sample = mid_sample
    
    # Use max_sample for safety (ensures we meet the probability threshold)
    sample_size_per_variation = max_sample
    
    # Adjust for number of variations
    total_sample_size = sample_size_per_variation * variations
    
    # Calculate days needed
    daily_test_visitors = visits * traffic_decimal
    days_needed = math.ceil(total_sample_size / daily_test_visitors)
    
    return {
        "days": days_needed,
        "minSample": total_sample_size
    } 