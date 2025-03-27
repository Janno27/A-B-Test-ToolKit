"""
A/B Test Toolkit API
Main FastAPI application
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.responses import JSONResponse
import logging
import time

from models import CalculationRequest, CalculationResponse
from calculators import calculate_frequentist, calculate_bayesian, calculate_confidence_evolution

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger("abtest_api")

# Create FastAPI app
app = FastAPI(
    title="A/B Test Calculator API",
    description="API for calculating A/B test sample sizes and durations",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the exact URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware for request logging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    logger.info(f"{request.method} {request.url.path} - {response.status_code} - {process_time:.4f}s")
    return response

# Error handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred. Please try again."},
    )

# Health check endpoint
@app.get("/", tags=["Health"])
async def root():
    """
    Health check endpoint to verify the API is running
    """
    return {"status": "healthy", "message": "A/B Test Calculator API is running"}

# Main calculation endpoint
@app.post("/calculate", response_model=CalculationResponse, tags=["Calculations"])
async def calculate(request: CalculationRequest):
    """
    Calculate the estimated duration and minimum sample size for an A/B test
    
    This endpoint takes the test parameters and returns how long the test needs to run
    to reach statistical significance, based on either frequentist or Bayesian methods.
    """
    try:
        if request.method == "frequentist":
            logger.info(f"Processing frequentist calculation: {request.dict()}")
            return calculate_frequentist(
                request.visits,
                request.conversions,
                request.traffic,
                request.variations,
                request.improvement,
                request.confidence
            )
        else:
            logger.info(f"Processing bayesian calculation: {request.dict()}")
            return calculate_bayesian(
                request.visits,
                request.conversions,
                request.traffic,
                request.variations,
                request.improvement,
                request.confidence
            )
    except Exception as e:
        logger.error(f"Calculation error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Calculation error: {str(e)}")

# Confidence evolution endpoint
@app.post("/confidence-evolution", tags=["Calculations"])
async def get_confidence_evolution(request: CalculationRequest):
    """
    Calculate the evolution of statistical confidence and confidence interval width
    
    This endpoint takes the test parameters and returns data showing how confidence
    and confidence interval width change as sample size increases.
    """
    try:
        logger.info(f"Processing confidence evolution calculation: {request.dict()}")
        return calculate_confidence_evolution(
            request.visits,
            request.conversions,
            request.traffic,
            request.variations,
            request.improvement,
            request.confidence
        )
    except Exception as e:
        logger.error(f"Confidence evolution calculation error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Calculation error: {str(e)}")

# Custom OpenAPI schema
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title="A/B Test Calculator API",
        version="1.0.0",
        description="API for calculating A/B test sample sizes and durations",
        routes=app.routes,
    )
    
    # Add additional info if needed
    openapi_schema["info"]["contact"] = {
        "name": "Emma - The Sleep Company",
        "url": "https://www.emma-sleep.com",
        "email": "support@emma-sleep.com",
    }
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 