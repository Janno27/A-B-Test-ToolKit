from pydantic import BaseModel, Field, validator

class CalculationRequest(BaseModel):
    """
    Request model for ab test calculation endpoints
    """
    visits: float = Field(..., gt=0, description="Daily visits to the website")
    conversions: float = Field(..., ge=0, description="Daily conversions")
    traffic: float = Field(..., gt=0, le=100, description="Percentage of traffic to include in the test")
    variations: int = Field(..., ge=2, description="Number of variations (including control)")
    improvement: float = Field(..., gt=0, description="Expected improvement in percentage")
    confidence: float = Field(..., ge=80, le=99.9, description="Statistical confidence level in percentage")
    method: str = Field(..., description="Statistical method to use (frequentist or bayesian)")
    
    @validator('conversions')
    def validate_conversions(cls, v, values):
        if 'visits' in values and v > values['visits']:
            raise ValueError('Conversions cannot be greater than visits')
        return v
    
    @validator('method')
    def validate_method(cls, v):
        allowed_methods = ['frequentist', 'bayesian']
        if v.lower() not in allowed_methods:
            raise ValueError(f'Method must be one of: {", ".join(allowed_methods)}')
        return v.lower()

class CalculationResponse(BaseModel):
    """
    Response model for ab test calculation endpoints
    """
    days: int = Field(..., description="Estimated number of days needed for the test")
    minSample: int = Field(..., description="Minimum required sample size") 