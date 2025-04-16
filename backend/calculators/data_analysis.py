"""
Data Analysis Module for A/B Test Toolkit
This module handles the analysis of uploaded data files and provides statistical tests.
"""

import pandas as pd
import numpy as np
import base64
import io
import logging
from typing import Dict, List, Tuple, Optional, Any
import scipy.stats as stats
from statsmodels.stats.power import TTestIndPower, tt_ind_solve_power

logger = logging.getLogger("abtest_api.data_analysis")

def detect_outliers(data: np.ndarray, method: str = 'iqr', threshold: float = 1.5) -> np.ndarray:
    """
    Detect outliers in a data array
    
    Parameters:
    -----------
    data : np.ndarray
        Array of data values
    method : str
        Method to use for outlier detection ('iqr' or 'zscore')
    threshold : float
        Threshold for outlier detection (1.5 for IQR, 3 for Z-score typically)
        
    Returns:
    --------
    np.ndarray
        Boolean mask of outliers (True for outliers)
    """
    if method == 'iqr':
        q1, q3 = np.percentile(data, [25, 75])
        iqr = q3 - q1
        lower_bound = q1 - threshold * iqr
        upper_bound = q3 + threshold * iqr
        return (data < lower_bound) | (data > upper_bound)
    elif method == 'zscore':
        z_scores = np.abs((data - np.mean(data)) / np.std(data))
        return z_scores > threshold
    else:
        raise ValueError(f"Unknown outlier detection method: {method}")

def load_data_from_base64(file_content: str, file_type: str) -> pd.DataFrame:
    """
    Load data from a base64 encoded file
    
    Parameters:
    -----------
    file_content : str
        Base64 encoded file content
    file_type : str
        Type of file ('csv', 'json', 'xlsx')
        
    Returns:
    --------
    pd.DataFrame
        Loaded data
    """
    try:
        # Decode base64 content
        decoded_content = base64.b64decode(file_content)
        
        # Create a file-like object
        file_obj = io.BytesIO(decoded_content)
        
        # Load based on file type
        if file_type.lower() == 'csv':
            return pd.read_csv(file_obj)
        elif file_type.lower() == 'json':
            return pd.read_json(file_obj)
        elif file_type.lower() in ['xlsx', 'xls']:
            return pd.read_excel(file_obj)
        else:
            raise ValueError(f"Unsupported file type: {file_type}")
    except Exception as e:
        logger.error(f"Error loading data: {str(e)}")
        raise ValueError(f"Error loading data: {str(e)}")

def extract_column_data(
    df: pd.DataFrame, 
    column_spec: Dict[str, Any]
) -> np.ndarray:
    """
    Extract data from a column based on specification
    
    Parameters:
    -----------
    df : pd.DataFrame
        DataFrame containing the data
    column_spec : Dict[str, Any]
        Column specification (name and/or index)
        
    Returns:
    --------
    np.ndarray
        Extracted column data
    """
    try:
        if 'index' in column_spec and column_spec['index'] is not None:
            # Use index to get the column
            col_idx = column_spec['index']
            if col_idx >= len(df.columns):
                raise ValueError(f"Column index {col_idx} is out of range")
            return df.iloc[:, col_idx].values
        else:
            # Use name to get the column
            col_name = column_spec['name']
            if col_name not in df.columns:
                # Try to find by index if numeric or position
                try:
                    col_idx = int(col_name)
                    return df.iloc[:, col_idx].values
                except:
                    raise ValueError(f"Column '{col_name}' not found in data")
            return df[col_name].values
    except Exception as e:
        logger.error(f"Error extracting column data: {str(e)}")
        raise ValueError(f"Error extracting column data: {str(e)}")

def calculate_summary_statistics(data: np.ndarray) -> Dict[str, float]:
    """
    Calculate summary statistics for a dataset
    
    Parameters:
    -----------
    data : np.ndarray
        Array of data values
        
    Returns:
    --------
    Dict[str, float]
        Dictionary of summary statistics
    """
    return {
        "count": len(data),
        "mean": float(np.mean(data)),
        "median": float(np.median(data)),
        "std_dev": float(np.std(data, ddof=1)),
        "min_value": float(np.min(data)),
        "max_value": float(np.max(data)),
        "outliers_count": int(np.sum(detect_outliers(data)))
    }

def analyze_data(
    control_data: np.ndarray,
    variation_data: np.ndarray,
    exclude_outliers: bool = False
) -> Tuple[Dict[str, Dict[str, float]], str, bool]:
    """
    Analyze data and provide summary statistics
    
    Parameters:
    -----------
    control_data : np.ndarray
        Data for control group
    variation_data : np.ndarray
        Data for variation group
    exclude_outliers : bool
        Whether to exclude outliers from the analysis
        
    Returns:
    --------
    Tuple[Dict[str, Dict[str, float]], str, bool]
        Dictionary of summary statistics, message for user, and whether outliers were detected
    """
    # Calculate initial summary statistics
    control_stats = calculate_summary_statistics(control_data)
    variation_stats = calculate_summary_statistics(variation_data)
    
    # Check for outliers
    has_outliers = control_stats["outliers_count"] > 0 or variation_stats["outliers_count"] > 0
    total_outliers = control_stats["outliers_count"] + variation_stats["outliers_count"]
    
    # Generate basic message
    message = (
        f"Analysis summary: Found {len(control_data)} control transactions and "
        f"{len(variation_data)} variation transactions. "
    )
    
    # If excluding outliers, filter them out
    if exclude_outliers and has_outliers:
        control_mask = ~detect_outliers(control_data)
        variation_mask = ~detect_outliers(variation_data)
        
        filtered_control = control_data[control_mask]
        filtered_variation = variation_data[variation_mask]
        
        # Recalculate summary statistics
        control_stats = calculate_summary_statistics(filtered_control)
        variation_stats = calculate_summary_statistics(filtered_variation)
        
        message += (
            f"Excluded {total_outliers} outliers from analysis. "
            f"Now using {len(filtered_control)} control and {len(filtered_variation)} variation data points."
        )
    elif has_outliers:
        message += (
            f"Detected {total_outliers} outliers in the data. "
            f"Consider using the 'exclude outliers' option for more robust analysis."
        )
    else:
        message += "No outliers detected in the data."
    
    # Return the results
    return {"control": control_stats, "variation": variation_stats}, message, has_outliers

def is_normally_distributed(data: np.ndarray, alpha: float = 0.05) -> bool:
    """
    Test if data is normally distributed using Shapiro-Wilk test
    
    Parameters:
    -----------
    data : np.ndarray
        Data to test
    alpha : float
        Significance level
        
    Returns:
    --------
    bool
        True if data is normally distributed
    """
    if len(data) < 3:
        # Not enough data for the test, assume non-normal
        return False
    
    # If we have too many samples, test can become too sensitive
    # So we'll use a random subset of 5000 samples max
    if len(data) > 5000:
        np.random.seed(42)  # For reproducibility
        data = np.random.choice(data, size=5000, replace=False)
    
    # Run Shapiro-Wilk test
    stat, p_value = stats.shapiro(data)
    
    # If p-value > alpha, we fail to reject the null hypothesis
    # that the data is normally distributed
    return p_value > alpha

def select_statistical_test(
    control_data: np.ndarray,
    variation_data: np.ndarray,
    metric_type: str
) -> str:
    """
    Select appropriate statistical test based on data characteristics
    
    Parameters:
    -----------
    control_data : np.ndarray
        Data for control group
    variation_data : np.ndarray
        Data for variation group
    metric_type : str
        Type of metric ('conversion', 'revenue', 'aov')
        
    Returns:
    --------
    str
        Name of the statistical test to use
    """
    # For conversion rate, always use z-test (proportion test)
    if metric_type == 'conversion':
        return 'z-test'
    
    # For revenue and AOV, check normality
    control_normal = is_normally_distributed(control_data)
    variation_normal = is_normally_distributed(variation_data)
    
    if control_normal and variation_normal:
        # If both datasets are normal, use t-test
        return 't-test'
    else:
        # If not normal, use Mann-Whitney U test
        return 'mann-whitney'

def run_statistical_test(
    control_data: np.ndarray,
    variation_data: np.ndarray,
    test_name: str,
    alpha: float = 0.05
) -> Dict[str, Any]:
    """
    Run a statistical test and return the results
    
    Parameters:
    -----------
    control_data : np.ndarray
        Data for control group
    variation_data : np.ndarray
        Data for variation group
    test_name : str
        Name of the test to run
    alpha : float
        Significance level
        
    Returns:
    --------
    Dict[str, Any]
        Dictionary of test results
    """
    if test_name == 'z-test':
        # For proportions (conversion rates)
        n1 = len(control_data)
        n2 = len(variation_data)
        p1 = np.mean(control_data)
        p2 = np.mean(variation_data)
        
        # Pooled proportion
        p_pooled = (p1 * n1 + p2 * n2) / (n1 + n2)
        
        # Standard error
        se = np.sqrt(p_pooled * (1 - p_pooled) * (1/n1 + 1/n2))
        
        # Z statistic
        if se == 0:  # Handle division by zero
            z_stat = 0
            p_value = 1.0
        else:
            z_stat = (p2 - p1) / se
            p_value = 2 * (1 - stats.norm.cdf(abs(z_stat)))
        
        # Calculate power
        effect_size = (p2 - p1) / np.sqrt(p_pooled * (1 - p_pooled))
        power = TTestIndPower().power(
            effect_size=effect_size,
            nobs1=n1,
            ratio=n2/n1,
            alpha=alpha,
            alternative='two-sided'
        )
    
    elif test_name == 't-test':
        # For normally distributed data
        t_stat, p_value = stats.ttest_ind(
            control_data, 
            variation_data,
            equal_var=False  # Welch's t-test (doesn't assume equal variances)
        )
        
        # Calculate Cohen's d effect size
        mean1, mean2 = np.mean(control_data), np.mean(variation_data)
        std1, std2 = np.std(control_data, ddof=1), np.std(variation_data, ddof=1)
        n1, n2 = len(control_data), len(variation_data)
        
        # Pooled standard deviation
        s_pooled = np.sqrt(((n1 - 1) * std1**2 + (n2 - 1) * std2**2) / (n1 + n2 - 2))
        
        # Cohen's d
        effect_size = abs(mean2 - mean1) / s_pooled
        
        # Calculate power
        power = TTestIndPower().power(
            effect_size=effect_size,
            nobs1=n1,
            ratio=n2/n1,
            alpha=alpha,
            alternative='two-sided'
        )
    
    elif test_name == 'mann-whitney':
        # For non-normally distributed data
        u_stat, p_value = stats.mannwhitneyu(
            control_data, 
            variation_data,
            alternative='two-sided'
        )
        
        # Mann-Whitney doesn't have a standard effect size measure
        # We'll calculate an approximate effect size using rank-biserial correlation
        n1, n2 = len(control_data), len(variation_data)
        effect_size = 1 - (2 * u_stat) / (n1 * n2)
        
        # Power calculation is complex for Mann-Whitney
        # We'll approximate using a transformation to normal distribution
        z_stat = stats.norm.ppf(1 - p_value/2)
        power = stats.norm.cdf(z_stat - stats.norm.ppf(1-alpha/2)) + stats.norm.cdf(-z_stat - stats.norm.ppf(1-alpha/2))
    
    else:
        raise ValueError(f"Unknown statistical test: {test_name}")
    
    # Return the results
    return {
        "test_name": test_name,
        "p_value": float(p_value),
        "confidence": float((1 - p_value) * 100),
        "significant": p_value < alpha,
        "power": float(power)
    }

def calculate_metrics(
    control_data: np.ndarray,
    variation_data: np.ndarray,
    metric_type: str,
    users_control: int,
    users_variation: int
) -> Dict[str, Any]:
    """
    Calculate key metrics and run statistical tests
    
    Parameters:
    -----------
    control_data : np.ndarray
        Data for control group
    variation_data : np.ndarray
        Data for variation group
    metric_type : str
        Type of metric ('conversion', 'revenue', 'aov')
    users_control : int
        Number of users in control group
    users_variation : int
        Number of users in variation group
        
    Returns:
    --------
    Dict[str, Any]
        Dictionary of calculated metrics and test results
    """
    if metric_type == 'conversion':
        # For conversion rate
        control_value = len(control_data) / users_control
        variation_value = len(variation_data) / users_variation
        
        # Create binary arrays (1 for conversion, 0 for non-conversion)
        control_binary = np.ones(len(control_data))
        control_binary = np.append(control_binary, np.zeros(users_control - len(control_data)))
        
        variation_binary = np.ones(len(variation_data))
        variation_binary = np.append(variation_binary, np.zeros(users_variation - len(variation_data)))
        
        # Select and run statistical test
        test_name = 'z-test'  # Always use z-test for conversion rates
        test_result = run_statistical_test(control_binary, variation_binary, test_name)
        
    elif metric_type == 'aov':
        # For average order value
        control_value = np.mean(control_data)
        variation_value = np.mean(variation_data)
        
        # Select and run statistical test
        test_name = select_statistical_test(control_data, variation_data, metric_type)
        test_result = run_statistical_test(control_data, variation_data, test_name)
        
    elif metric_type == 'revenue':
        # For total revenue
        control_value = np.sum(control_data)
        variation_value = np.sum(variation_data)
        
        # For total revenue, we need to bootstrap to create sampling distribution
        # because we can't directly apply a statistical test to single sums
        
        # Create bootstrapped samples of total revenue
        n_bootstrap = 10000
        np.random.seed(42)  # For reproducibility
        
        control_bootstrap = np.zeros(n_bootstrap)
        variation_bootstrap = np.zeros(n_bootstrap)
        
        for i in range(n_bootstrap):
            # Sample with replacement
            control_sample = np.random.choice(control_data, size=len(control_data), replace=True)
            variation_sample = np.random.choice(variation_data, size=len(variation_data), replace=True)
            
            # Calculate total revenue for each bootstrap sample
            control_bootstrap[i] = np.sum(control_sample)
            variation_bootstrap[i] = np.sum(variation_sample)
        
        # Run test on bootstrapped distributions
        test_name = select_statistical_test(control_bootstrap, variation_bootstrap, 'aov')
        test_result = run_statistical_test(control_bootstrap, variation_bootstrap, test_name)
    
    else:
        raise ValueError(f"Unknown metric type: {metric_type}")
    
    # Calculate uplift
    if control_value == 0:
        uplift = float('inf') if variation_value > 0 else 0
    else:
        uplift = ((variation_value - control_value) / control_value) * 100
    
    # Generate interpretation
    if test_result["significant"]:
        if uplift > 0:
            interpretation = (
                f"The {metric_type} for the variation is {uplift:.2f}% higher than the control, "
                f"which is statistically significant (confidence: {test_result['confidence']:.2f}%). "
            )
        else:
            interpretation = (
                f"The {metric_type} for the variation is {abs(uplift):.2f}% lower than the control, "
                f"which is statistically significant (confidence: {test_result['confidence']:.2f}%). "
            )
        
        if test_result["power"] < 0.8:
            interpretation += (
                f"However, the statistical power is only {test_result['power']:.2f}, "
                f"which is below the recommended 0.8. More data may be needed for reliable results."
            )
        else:
            interpretation += (
                f"The statistical power is {test_result['power']:.2f}, "
                f"which is sufficient for reliable results."
            )
    else:
        interpretation = (
            f"The {uplift:.2f}% difference in {metric_type} between control and variation "
            f"is not statistically significant (confidence: {test_result['confidence']:.2f}%). "
        )
        
        if test_result["power"] < 0.8:
            interpretation += (
                f"The test has low statistical power ({test_result['power']:.2f}). "
                f"More data may be needed to detect a significant difference if one exists."
            )
    
    # Return the metrics
    return {
        "metric_name": metric_type,
        "control_value": float(control_value),
        "variation_value": float(variation_value),
        "uplift": float(uplift),
        "test_result": test_result,
        "interpretation": interpretation
    }

def generate_basic_interpretation(
    control_stats: Dict[str, float],
    variation_stats: Dict[str, float]
) -> List[str]:
    """
    Generate bullet points interpreting basic statistics
    
    Parameters:
    -----------
    control_stats : Dict[str, float]
        Statistics for control group
    variation_stats : Dict[str, float]
        Statistics for variation group
        
    Returns:
    --------
    List[str]
        List of interpretation bullet points
    """
    interpretations = []
    
    # Compare means
    mean_diff_pct = ((variation_stats["mean"] - control_stats["mean"]) / control_stats["mean"]) * 100
    if abs(mean_diff_pct) < 1:
        interpretations.append(
            f"The average values are very similar between control ({control_stats['mean']:.2f}) "
            f"and variation ({variation_stats['mean']:.2f}), with only a {abs(mean_diff_pct):.2f}% difference."
        )
    elif mean_diff_pct > 0:
        interpretations.append(
            f"The variation group shows a {mean_diff_pct:.2f}% higher average value "
            f"({variation_stats['mean']:.2f}) compared to the control ({control_stats['mean']:.2f})."
        )
    else:
        interpretations.append(
            f"The variation group shows a {abs(mean_diff_pct):.2f}% lower average value "
            f"({variation_stats['mean']:.2f}) compared to the control ({control_stats['mean']:.2f})."
        )
    
    # Compare medians and assess skew
    control_skew = (control_stats["mean"] - control_stats["median"]) / control_stats["std_dev"] if control_stats["std_dev"] > 0 else 0
    variation_skew = (variation_stats["mean"] - variation_stats["median"]) / variation_stats["std_dev"] if variation_stats["std_dev"] > 0 else 0
    
    median_diff_pct = ((variation_stats["median"] - control_stats["median"]) / control_stats["median"]) * 100
    
    if abs(control_skew) > 0.5 or abs(variation_skew) > 0.5:
        skew_interpretation = ""
        if control_skew > 0.5 and variation_skew > 0.5:
            skew_interpretation = "Both distributions are right-skewed (higher values are pulling up the average)."
        elif control_skew < -0.5 and variation_skew < -0.5:
            skew_interpretation = "Both distributions are left-skewed (lower values are pulling down the average)."
        elif abs(control_skew) > 0.5:
            skew_interpretation = f"The control distribution is {'right' if control_skew > 0 else 'left'}-skewed."
        elif abs(variation_skew) > 0.5:
            skew_interpretation = f"The variation distribution is {'right' if variation_skew > 0 else 'left'}-skewed."
        
        interpretations.append(
            f"The median values ({control_stats['median']:.2f} vs {variation_stats['median']:.2f}, "
            f"{abs(median_diff_pct):.2f}% {'higher' if median_diff_pct > 0 else 'lower'} for variation) "
            f"show {'similar differences' if abs(mean_diff_pct - median_diff_pct) < 5 else 'different patterns'} "
            f"compared to the means. {skew_interpretation}"
        )
    
    # Compare variability
    cv_control = control_stats["std_dev"] / control_stats["mean"] if control_stats["mean"] > 0 else 0
    cv_variation = variation_stats["std_dev"] / variation_stats["mean"] if variation_stats["mean"] > 0 else 0
    
    if abs(cv_variation - cv_control) / cv_control > 0.1:  # More than 10% difference in CV
        if cv_variation > cv_control:
            interpretations.append(
                f"The variation group shows {(cv_variation / cv_control - 1) * 100:.2f}% more variability "
                f"relative to its mean compared to the control group. This suggests less consistent behavior."
            )
        else:
            interpretations.append(
                f"The variation group shows {(1 - cv_variation / cv_control) * 100:.2f}% less variability "
                f"relative to its mean compared to the control group. This suggests more consistent behavior."
            )
    else:
        interpretations.append(
            f"Both groups show similar levels of variability relative to their means "
            f"(coefficient of variation: {cv_control:.2f} vs {cv_variation:.2f})."
        )
    
    return interpretations

def analyze_ab_test_data(
    file_content: str,
    file_type: str,
    control_column: Dict[str, Any],
    variation_column: Dict[str, Any],
    kpi_type: str,
    exclude_outliers: bool,
    users_per_variation: Dict[str, int]
) -> Dict[str, Any]:
    """
    Complete analysis of A/B test data
    
    Parameters:
    -----------
    file_content : str
        Base64 encoded file content
    file_type : str
        Type of file ('csv', 'json', 'xlsx')
    control_column : Dict[str, Any]
        Specification for control column
    variation_column : Dict[str, Any]
        Specification for variation column
    kpi_type : str
        Type of KPI to analyze ('conversion', 'revenue', 'aov')
    exclude_outliers : bool
        Whether to exclude outliers from analysis
    users_per_variation : Dict[str, int]
        Number of users in each variation
        
    Returns:
    --------
    Dict[str, Any]
        Complete analysis results
    """
    try:
        # Load data
        df = load_data_from_base64(file_content, file_type)
        
        # Extract column data
        control_data = extract_column_data(df, control_column)
        variation_data = extract_column_data(df, variation_column)
        
        # Filter out NaN values
        control_data = control_data[~np.isnan(control_data)]
        variation_data = variation_data[~np.isnan(variation_data)]
        
        # Get user counts
        users_control = users_per_variation.get("control", 0)
        users_variation = users_per_variation.get("variation", 0)
        
        if users_control <= 0 or users_variation <= 0:
            raise ValueError("User counts must be positive integers")
        
        # Analyze data and get summary
        summary_stats, summary_message, has_outliers = analyze_data(
            control_data, variation_data, exclude_outliers
        )
        
        # If excluding outliers, update the data arrays
        if exclude_outliers and has_outliers:
            control_mask = ~detect_outliers(control_data)
            variation_mask = ~detect_outliers(variation_data)
            control_data = control_data[control_mask]
            variation_data = variation_data[variation_mask]
        
        # Calculate basic statistics for presentation
        basic_stats = {
            "control": {
                "mean": float(np.mean(control_data)),
                "median": float(np.median(control_data)),
                "std_dev": float(np.std(control_data, ddof=1)),
                "count": len(control_data),
                "min_value": float(np.min(control_data)),
                "max_value": float(np.max(control_data))
            },
            "variation": {
                "mean": float(np.mean(variation_data)),
                "median": float(np.median(variation_data)),
                "std_dev": float(np.std(variation_data, ddof=1)),
                "count": len(variation_data),
                "min_value": float(np.min(variation_data)),
                "max_value": float(np.max(variation_data))
            }
        }
        
        # Generate interpretation bullet points
        basic_interpretation = generate_basic_interpretation(
            summary_stats["control"], summary_stats["variation"]
        )
        
        # Calculate all metrics
        metrics = {}
        
        # Conversion metrics
        metrics["conversion"] = calculate_metrics(
            control_data, variation_data, "conversion", users_control, users_variation
        )
        
        # AOV metrics
        metrics["aov"] = calculate_metrics(
            control_data, variation_data, "aov", users_control, users_variation
        )
        
        # Revenue metrics
        metrics["revenue"] = calculate_metrics(
            control_data, variation_data, "revenue", users_control, users_variation
        )
        
        # Generate overall message
        overall_message = (
            f"Analysis complete for {kpi_type.upper()} data. "
            f"Found {len(control_data)} control transactions and {len(variation_data)} variation transactions. "
        )
        
        if has_outliers:
            if exclude_outliers:
                outliers_count = (
                    summary_stats["control"]["outliers_count"] + 
                    summary_stats["variation"]["outliers_count"]
                )
                overall_message += f"Excluded {outliers_count} outliers from the analysis. "
            else:
                overall_message += "Outliers were detected but not excluded from the analysis. "
        
        # Summarize key findings
        significant_metrics = []
        for metric_name, metric in metrics.items():
            if metric["test_result"]["significant"]:
                direction = "higher" if metric["uplift"] > 0 else "lower"
                significant_metrics.append(
                    f"{metric_name.upper()} is {abs(metric['uplift']):.2f}% {direction} in variation"
                )
        
        if significant_metrics:
            overall_message += "Key findings: " + ", ".join(significant_metrics) + "."
        else:
            overall_message += "No statistically significant differences were found."
        
        # Generate visualization data using the preprocessor
        from .visualization_preprocessor import prepare_visualization_data
        
        # Convert numpy arrays to python lists for serialization
        control_list = control_data.tolist()
        variation_list = variation_data.tolist()
        
        # Get visualization data
        viz_data = prepare_visualization_data(control_list, variation_list, kpi_type)
        
        # Return the complete analysis with visualization data
        return {
            "basic_statistics": basic_stats,
            "basic_interpretation": basic_interpretation,
            "conversion_metrics": metrics["conversion"],
            "aov_metrics": metrics["aov"],
            "revenue_metrics": metrics["revenue"],
            "message": overall_message,
            "data_summary": {
                "control_summary": summary_stats["control"],
                "variation_summary": summary_stats["variation"],
                "message": summary_message,
                "has_outliers": has_outliers
            },
            # Add visualization data
            "raw_data": viz_data.get("raw_data"),
            "quartiles": viz_data.get("quartiles"),
            "histogram_data": viz_data.get("histogram_data"),
            "frequency_data": viz_data.get("frequency_data")
        }
    
    except Exception as e:
        logger.error(f"Error analyzing data: {str(e)}")
        raise ValueError(f"Error analyzing data: {str(e)}") 