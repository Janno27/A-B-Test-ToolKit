from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any, Union
from enum import Enum

class FileType(str, Enum):
    """Enum for supported file types"""
    CSV = "csv"
    JSON = "json"
    EXCEL = "xlsx"

class DataColumn(BaseModel):
    """Model for a data column specification"""
    name: str = Field(..., description="Column name or identifier")
    index: Optional[int] = Field(None, description="Column index (for CSV files without headers)")
    type: str = Field("numeric", description="Data type (numeric, categorical, etc.)")

class DataAnalysisRequest(BaseModel):
    """Request model for data analysis endpoints"""
    file_content: str = Field(..., description="Base64 encoded file content")
    file_type: FileType = Field(..., description="Type of the data file")
    control_column: DataColumn = Field(..., description="Column representing the control group")
    variation_column: DataColumn = Field(..., description="Column representing the variation group")
    kpi_type: str = Field(..., description="Type of KPI to analyze (conversion, revenue, aov)")
    exclude_outliers: bool = Field(False, description="Whether to exclude outliers from analysis")
    users_per_variation: Dict[str, int] = Field(
        ..., 
        description="Number of users in each variation"
    )
    
    @validator('kpi_type')
    def validate_kpi_type(cls, v):
        allowed_kpis = ['conversion', 'revenue', 'aov']
        if v.lower() not in allowed_kpis:
            raise ValueError(f'KPI type must be one of: {", ".join(allowed_kpis)}')
        return v.lower()

class DataSummary(BaseModel):
    """Summary statistics for a dataset"""
    count: int = Field(..., description="Number of data points")
    mean: float = Field(..., description="Mean value")
    median: float = Field(..., description="Median value")
    std_dev: float = Field(..., description="Standard deviation")
    min_value: float = Field(..., description="Minimum value")
    max_value: float = Field(..., description="Maximum value")
    outliers_count: int = Field(0, description="Number of outliers detected")

class DataAnalysisSummary(BaseModel):
    """Summary response for data analysis"""
    control_summary: DataSummary = Field(..., description="Summary statistics for control group")
    variation_summary: DataSummary = Field(..., description="Summary statistics for variation group")
    message: str = Field(..., description="Summary message for the user")
    has_outliers: bool = Field(False, description="Whether outliers were detected")

class StatisticalTestResult(BaseModel):
    """Result of a statistical test"""
    test_name: str = Field(..., description="Name of the statistical test used")
    p_value: float = Field(..., description="P-value of the test")
    confidence: float = Field(..., description="Statistical confidence level (1 - p_value) * 100")
    significant: bool = Field(..., description="Whether the result is statistically significant")
    power: Optional[float] = Field(None, description="Statistical power of the test")

class MetricResult(BaseModel):
    """Detailed results for a specific metric"""
    metric_name: str = Field(..., description="Name of the metric")
    control_value: float = Field(..., description="Value for control group")
    variation_value: float = Field(..., description="Value for variation group")
    uplift: float = Field(..., description="Uplift percentage ((variation - control) / control) * 100")
    test_result: StatisticalTestResult = Field(..., description="Statistical test results")
    interpretation: str = Field(..., description="Interpretation of the results")

class OutliersRemoved(BaseModel):
    """Information about outliers removed during analysis"""
    control: int = Field(0, description="Number of outliers removed from control group")
    variation: int = Field(0, description="Number of outliers removed from variation group")

class DetailedAnalysisResult(BaseModel):
    """Detailed analysis results with all metrics and interpretations"""
    basic_statistics: Dict[str, Dict[str, float]] = Field(
        ..., 
        description="Basic statistics (mean, median, std dev) for each variation"
    )
    basic_interpretation: List[str] = Field(
        ..., 
        description="Bullet points with interpretation of basic statistics"
    )
    conversion_metrics: Optional[MetricResult] = Field(
        None, 
        description="Conversion rate analysis results"
    )
    aov_metrics: Optional[MetricResult] = Field(
        None, 
        description="Average Order Value analysis results"
    )
    revenue_metrics: Optional[MetricResult] = Field(
        None, 
        description="Total revenue analysis results"
    )
    message: str = Field(..., description="Overall summary message")
    outliers_removed: Optional[OutliersRemoved] = Field(None, description="Information about outliers removed during analysis")
    
    # Add data for charts
    raw_data: Optional[Dict[str, List[float]]] = Field(
        None, 
        description="Raw data for each variation, used for visualizations"
    )
    
    # Advanced statistics for box plots
    quartiles: Optional[Dict[str, Dict[str, float]]] = Field(
        None,
        description="Quartile values (q1, q3) for box plots visualizations"
    )
    
    # Histogram data
    histogram_data: Optional[List[Dict[str, Any]]] = Field(
        None,
        description="Pre-calculated histogram bins for visualizations"
    )
    
    # Frequency data for scatter plots
    frequency_data: Optional[Dict[str, List[Dict[str, Any]]]] = Field(
        None,
        description="Frequency distribution data for scatter plots"
    ) 