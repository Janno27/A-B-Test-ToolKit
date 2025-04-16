"""
Data Analysis Module
"""
import base64
import io
import json
import pandas as pd
import numpy as np
from scipy import stats
from typing import Dict, List, Any, Tuple, Optional
import warnings

from .visualization_preprocessor import prepare_visualization_data

# ... existing code ...

def analyze_ab_test_data(
    file_content: str,
    file_type: str,
    control_column: Dict[str, Any],
    variation_column: Dict[str, Any],
    kpi_type: str,
    exclude_outliers: bool = False,
    users_per_variation: Dict[str, int] = None
) -> Dict[str, Any]:
    """
    Analyze A/B test data from a file and return detailed analysis
    """
    # ... existing code to process the file ...
    
    # After processing the data and performing analysis
    
    # Prepare the data for visualization
    data_df = process_file_data(file_content, file_type)
    
    # Extract data for the specified columns
    control_data = extract_column_data(data_df, control_column)
    variation_data = extract_column_data(data_df, variation_column)
    
    # Prepare data for visualizations
    visualization_data = prepare_visualization_data(
        control_data, 
        variation_data, 
        kpi_type
    )
    
    # Add visualization data to the analysis result
    # ... existing code for detailed_result ...
    detailed_result = {
        # Existing fields...
    }
    
    # Add visualization data
    detailed_result.update({
        "raw_data": visualization_data.get("raw_data"),
        "quartiles": visualization_data.get("quartiles"),
        "histogram_data": visualization_data.get("histogram_data"),
        "frequency_data": visualization_data.get("frequency_data")
    })
    
    return detailed_result 