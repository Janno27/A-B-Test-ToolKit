# Analysis Components Documentation

This document provides an overview of the Analysis tab components, focusing on the Summary tab and related components. The analysis functionality allows users to upload transaction data, process it, and view statistical results comparing control and variation groups.

## Table of Contents

1. [Component Structure](#component-structure)
2. [Data Flow](#data-flow)
3. [Component Interactions](#component-interactions)
4. [State Management](#state-management)
5. [Custom Components](#custom-components)
6. [Implementation Details](#implementation-details)
7. [Recommendations for Improvement](#recommendations-for-improvement)

## Component Structure

The analysis functionality consists of several interconnected components:

```
ResultsAnalysis.tsx (main container)
├── NewAnalysisForm.tsx
├── RecentAnalyses.tsx
├── DataCleaningModal.tsx
│   └── Various UI components
├── ConfidenceTooltip.tsx
├── ImpactTooltip.tsx
└── localStorageService.ts
```

### Key Components

- **ResultsAnalysis**: The main container component that orchestrates the entire analysis workflow.
- **NewAnalysisForm**: Form for creating a new analysis with a name and description.
- **RecentAnalyses**: Displays a list of previously created analyses for selection.
- **DataCleaningModal**: Modal dialog for data cleaning, processing, and initial analysis.
- **ConfidenceTooltip**: Component that displays statistical methodology and confidence calculations.
- **ImpactTooltip**: Component that displays business impact projections and calculations.

## Data Flow

The data flows through the components in the following sequence:

1. User creates a new analysis via `NewAnalysisForm`
2. User uploads a data file and fills in user counts for control and variation groups
3. User selects a KPI (Key Performance Indicator)
4. `DataCleaningModal` processes the data file with selected options
5. Analysis results flow back to `ResultsAnalysis`
6. `ResultsAnalysis` displays the processed data in various formats (tables, interpretations, etc.)

### Data Transformation Steps

1. **Raw File Upload**: CSV/Excel file with transaction data
2. **Data Processing**: Cleaning, validation, and statistical analysis via API
3. **Results Transformation**: API results are transformed into display-ready formats
4. **Local Storage**: Analysis configurations and metadata are stored for future use

## Component Interactions

### Creating a New Analysis

1. User inputs analysis name and description in `NewAnalysisForm`
2. On submission, `handleAnalysisCreated` in `ResultsAnalysis` creates a new analysis object
3. Analysis is saved to local storage via `localStorageService`
4. Analysis UI changes to data upload and configuration mode

### Processing Data

1. User uploads a data file and configures settings
2. User clicks "Run Analysis" to open `DataCleaningModal`
3. Modal shows a progress animation while the API processes the data
4. On completion, `DataCleaningModal` calls `onAnalysisComplete` with the results
5. `ResultsAnalysis` receives the results via `handleAnalysisComplete`

### Viewing Results

1. Results are displayed in tabs: "Summary" and "Revenue"
2. Summary tab shows a comprehensive overview with comparison tables and recommendations
3. Revenue tab provides detailed revenue analysis
4. User can explore statistical confidence via tooltips on confidence indicators
5. User can view business impact projections via tooltips on impact indicators

## State Management

The analysis functionality uses React's useState for state management. Key state variables include:

- **selectedAnalysis**: Currently selected analysis
- **analyses**: List of all analyses stored in local storage
- **showNewAnalysisForm**: Controls visibility of the new analysis form
- **currentFile**: Currently uploaded data file
- **usersPerVariation**: Number of users in control and variation groups
- **kpis**: Available KPIs for analysis
- **selectedKpis**: KPIs selected for the current analysis
- **cleaningModalOpen**: Controls visibility of the data cleaning modal
- **showResults**: Controls visibility of the analysis results
- **analysisResults**: Stores the processed analysis data from the API

## Custom Components

### ConfidenceTooltip

This component displays statistical methodology and confidence calculations for each KPI:

- **Conversion Rate**: Uses Z-test for proportions
- **Average Order Value**: Uses Student's t-test for means
- **Revenue**: Uses Bootstrap resampling technique

Properties:
- `kpiType`: The type of KPI ('conversion', 'aov', 'revenue')
- `confidence`: Confidence level percentage
- `controlValue`, `variationValue`: Values for control and variation groups
- `controlCount`, `variationCount`: Sample sizes
- `controlStd`, `variationStd`: Standard deviations

### ImpactTooltip

This component displays business impact projections and calculations:

- **Conversions**: Projects additional conversions based on rate differences
- **Order Value**: Shows average order value differences
- **Revenue**: Projects total revenue impact
- **Revenue per User**: Shows revenue per user differences

Properties:
- `type`: The type of impact ('conversions', 'order_value', 'revenue', 'revenue_per_user')
- `controlValue`, `variationValue`: Values for control and variation groups
- `controlUsers`, `variationUsers`: User counts for projections

## Implementation Details

### API Integration

The analysis functionality uses a backend API endpoint (/api/analyze-data) for data processing. The API:

1. Accepts data file content (base64 encoded)
2. Accepts configuration parameters (KPI type, outlier handling, etc.)
3. Processes the data statistically
4. Returns comprehensive analysis results

### Local Storage Service

The `localStorageService.ts` provides functions to:

- **getSavedAnalyses**: Retrieve all saved analyses
- **saveAnalysis**: Save a new analysis
- **updateAnalysis**: Update an existing analysis
- **deleteAnalysis**: Delete an analysis

### Error Handling

The analysis components include robust error handling:

- Data validation before submission
- API error capture and display
- Graceful degradation when data is missing
- User feedback for all error conditions

## Recommendations for Improvement

### Data Persistence

Currently, analyses are stored in local storage. For a production environment:

1. Implement server-side storage for analyses
2. Add user authentication for personalized analyses
3. Add data encryption for sensitive information

### Analysis Functionality

To enhance the analysis capabilities:

1. Add more statistical test options
2. Implement segment analysis for different user groups
3. Add time-based analysis capabilities
4. Integrate with data visualization libraries for richer charts

### User Experience

To improve the user experience:

1. Add batch analysis capabilities for multiple files
2. Create analysis templates for common use cases
3. Implement result sharing functionality (export to PDF, share links, etc.)
4. Add tooltips and contextual help throughout the interface

### Performance Optimization

For better performance:

1. Implement data caching for repeated analyses
2. Add server-side processing for large datasets
3. Optimize component rendering with useMemo and useCallback
4. Implement virtual scrolling for large result sets

---

This documentation provides a comprehensive overview of the analysis components and their interaction. For implementation details, consult the individual component files. 