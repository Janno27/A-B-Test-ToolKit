import numpy as np
from scipy import stats
from scipy.stats import norm
import math

def calculate_frequentist(visits, conversions, traffic, variations, improvement, confidence):
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
    
    sample_size = math.ceil(numerator / denominator)
    
    # Calculate total sample size accounting for number of variations
    total_sample_size = sample_size * variations
    
    # Calculate days needed
    daily_test_visitors = visits * traffic_decimal
    days_needed = math.ceil(total_sample_size / daily_test_visitors)
    
    return {
        "days": days_needed,
        "minSample": total_sample_size
    }

def calculate_bayesian(visits, conversions, traffic, variations, improvement, confidence):
    # Bayesian calculation using Beta distribution
    alpha_prior = 1  # uninformative prior
    beta_prior = 1   # uninformative prior
    
    # Convert to decimals
    p = conversions / visits
    traffic_decimal = traffic / 100
    improvement_decimal = improvement / 100
    
    # Calculate required sample size for desired probability
    conf_decimal = confidence / 100
    target_rate = p * (1 + improvement_decimal)
    
    def simulate_test(n_samples):
        control = np.random.beta(alpha_prior + conversions, 
                               beta_prior + visits - conversions, 
                               10000)
        treatment = np.random.beta(alpha_prior + conversions * (1 + improvement_decimal),
                                 beta_prior + visits - conversions * (1 + improvement_decimal),
                                 10000)
        prob_improvement = np.mean(treatment > control)
        return prob_improvement >= conf_decimal
    
    # Binary search for required sample size
    min_n = 100
    max_n = 1000000
    while max_n - min_n > 100:
        mid_n = (min_n + max_n) // 2
        if simulate_test(mid_n):
            max_n = mid_n
        else:
            min_n = mid_n
    
    total_sample_size = max_n * variations
    
    # Calculate days needed
    daily_test_visitors = visits * traffic_decimal
    days_needed = math.ceil(total_sample_size / daily_test_visitors)
    
    return {
        "days": days_needed,
        "minSample": total_sample_size
    }

def calculate(request):
    data = request.json()
    
    if data["method"] == "frequentist":
        return calculate_frequentist(
            data["visits"],
            data["conversions"],
            data["traffic"],
            data["variations"],
            data["improvement"],
            data["confidence"]
        )
    else:
        return calculate_bayesian(
            data["visits"],
            data["conversions"],
            data["traffic"],
            data["variations"],
            data["improvement"],
            data["confidence"]
        )