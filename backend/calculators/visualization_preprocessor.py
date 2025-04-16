"""
Visualization Preprocessor Module
Prepares data for frontend visualizations
"""
import numpy as np
from typing import Dict, List, Any, Tuple, Optional
import math

def prepare_visualization_data(control_data: List[float], variant_data: List[float], kpi_type: str) -> Dict[str, Any]:
    """
    Process raw data to prepare visualization-ready data structures for frontend charts
    
    Args:
        control_data: List of values for control group
        variant_data: List of values for variant group
        kpi_type: Type of KPI being analyzed (conversion, aov, revenue)
        
    Returns:
        Dictionary containing structured data for various chart types
    """
    result = {
        "raw_data": {
            "control": control_data,
            "variation": variant_data
        }
    }
    
    # Only perform these calculations for AOV and revenue type metrics
    if kpi_type in ["aov", "revenue", "revenue_per_user"]:
        # Calculate quartiles for box plots
        result["quartiles"] = calculate_quartiles(control_data, variant_data)
        
        # Generate histogram data
        result["histogram_data"] = generate_histogram_bins(control_data, variant_data)
        
        # Generate frequency data for scatter plots
        result["frequency_data"] = generate_frequency_data(control_data, variant_data)
    
    return result

def calculate_quartiles(control_data: List[float], variant_data: List[float]) -> Dict[str, Dict[str, float]]:
    """
    Calculate quartile values for box plot visualizations
    
    Args:
        control_data: List of values for control group
        variant_data: List of values for variant group
        
    Returns:
        Dictionary with quartile values for both groups
    """
    # Clean data - remove NaN and None values
    control_clean = [x for x in control_data if x is not None and not math.isnan(x)]
    variant_clean = [x for x in variant_data if x is not None and not math.isnan(x)]
    
    # Sort data for percentile calculations
    control_sorted = sorted(control_clean)
    variant_sorted = sorted(variant_clean)
    
    # Calculate quartiles and other statistics
    control_q1 = np.percentile(control_sorted, 25) if control_sorted else 0
    control_q3 = np.percentile(control_sorted, 75) if control_sorted else 0
    variant_q1 = np.percentile(variant_sorted, 25) if variant_sorted else 0
    variant_q3 = np.percentile(variant_sorted, 75) if variant_sorted else 0
    
    return {
        "control": {
            "q1": float(control_q1),
            "q3": float(control_q3)
        },
        "variation": {
            "q1": float(variant_q1),
            "q3": float(variant_q3)
        }
    }

def generate_histogram_bins(control_data: List[float], variant_data: List[float], bin_count: int = 7) -> List[Dict[str, Any]]:
    """
    Generate histogram bins for visualization
    
    Args:
        control_data: List of values for control group
        variant_data: List of values for variant group
        bin_count: Number of bins to generate
        
    Returns:
        List of bin data suitable for histogram visualization
    """
    # Clean data - remove NaN and None values
    control_clean = [x for x in control_data if x is not None and not math.isnan(x)]
    variant_clean = [x for x in variant_data if x is not None and not math.isnan(x)]
    
    # Combine data to determine overall range
    all_data = control_clean + variant_clean
    
    if not all_data:
        return []
    
    min_value = min(all_data)
    max_value = max(all_data)
    
    # Ensure we have a non-zero range
    if min_value == max_value:
        max_value = min_value + 1
    
    # Calculate bin size
    bin_size = (max_value - min_value) / bin_count
    
    # Initialize empty bins
    bins = []
    for i in range(bin_count):
        bin_start = min_value + i * bin_size
        bin_end = min_value + (i + 1) * bin_size if i < bin_count - 1 else max_value
        
        # Round bin edges for better readability
        bin_start_rounded = round(bin_start, 2)
        bin_end_rounded = round(bin_end, 2)
        
        bin_label = f"{bin_start_rounded}€-{bin_end_rounded}€"
        
        bins.append({
            "bin": bin_label,
            "control": 0,
            "variant": 0,
            "binStart": bin_start_rounded,
            "binEnd": bin_end_rounded
        })
    
    # Count values in each bin
    for value in control_clean:
        bin_index = min(bin_count - 1, max(0, int((value - min_value) / bin_size)))
        bins[bin_index]["control"] += 1
        
    for value in variant_clean:
        bin_index = min(bin_count - 1, max(0, int((value - min_value) / bin_size)))
        bins[bin_index]["variant"] += 1
    
    return bins

def generate_frequency_data(control_data: List[float], variant_data: List[float]) -> Dict[str, List[Dict[str, Any]]]:
    """
    Generate frequency distribution data for scatter plots
    
    Args:
        control_data: List of values for control group
        variant_data: List of values for variant group
        
    Returns:
        Dictionary with frequency data for scatter plot visualization
    """
    # Clean data - remove NaN and None values
    control_clean = [x for x in control_data if x is not None and not math.isnan(x)]
    variant_clean = [x for x in variant_data if x is not None and not math.isnan(x)]
    
    # Round values to create discrete bins
    control_rounded = [round(x) for x in control_clean]
    variant_rounded = [round(x) for x in variant_clean]
    
    # Count frequency of each value
    control_freq = {}
    for value in control_rounded:
        control_freq[value] = control_freq.get(value, 0) + 1
        
    variant_freq = {}
    for value in variant_rounded:
        variant_freq[value] = variant_freq.get(value, 0) + 1
    
    # Format data for scatter plot
    control_scatter = [
        {
            "orderValue": float(value),
            "frequency": count,
            "name": "Control",
            "color": "#8884d8"
        }
        for value, count in control_freq.items()
    ]
    
    variant_scatter = [
        {
            "orderValue": float(value),
            "frequency": count,
            "name": "Variant",
            "color": "#82ca9d"
        }
        for value, count in variant_freq.items()
    ]
    
    return {
        "control": control_scatter,
        "variation": variant_scatter
    } 