import math
from scipy.stats import norm

def calculate_frequentist(visits, conversions, traffic, variations, improvement, confidence):
    """
    Calculate the sample size and test duration using the frequentist approach.
    
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
    # Convert percentage values to decimals
    p = conversions / visits  # baseline conversion rate
    traffic_decimal = traffic / 100
    improvement_decimal = improvement / 100
    
    # Calculate Z-scores
    alpha = 1 - (confidence / 100)
    z_alpha = norm.ppf(1 - alpha/2)  # two-tailed test
    z_beta = norm.ppf(0.8)  # power = 80%
    
    # Calculate minimum detectable effect
    mde = p * improvement_decimal
    
    # Calculate sample size per variation
    numerator = (z_alpha + z_beta)**2 * 2 * p * (1 - p)
    denominator = mde**2
    
    if denominator == 0:  # Avoid division by zero
        sample_size = float('inf')
    else:
        sample_size = math.ceil(numerator / denominator)
    
    # Calculate total sample size accounting for number of variations
    total_sample_size = sample_size * variations
    
    # Calculate days needed
    daily_test_visitors = visits * traffic_decimal
    
    if daily_test_visitors == 0:  # Avoid division by zero
        days_needed = float('inf')
    else:
        days_needed = math.ceil(total_sample_size / daily_test_visitors)
    
    return {
        "days": days_needed,
        "minSample": total_sample_size
    } 