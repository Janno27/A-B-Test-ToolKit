// Types for analyses
export interface AnalysisResult {
  id: string;
  name: string;
  createdAt: string;
  lastModified: string;
  variations?: number;
  kpis?: {
    id: string;
    name: string;
    dataUploaded?: boolean;
  }[];
}

// Key used to store analyses in localStorage
const STORAGE_KEY = 'ab-test-analysis-results';

// Service to manage analyses in localStorage
const localStorageService = {
  // Get all saved analyses
  getAnalyses: (): AnalysisResult[] => {
    if (typeof window === 'undefined') return [];
    
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      return storedData ? JSON.parse(storedData) : [];
    } catch (error) {
      console.error('Error retrieving analyses:', error);
      return [];
    }
  },
  
  // Add a new analysis
  saveAnalysis: (name: string): AnalysisResult => {
    const analyses = localStorageService.getAnalyses();
    
    const newAnalysis: AnalysisResult = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      variations: 2,
      kpis: []
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify([newAnalysis, ...analyses]));
    return newAnalysis;
  },
  
  // Update an existing analysis
  updateAnalysis: (id: string, data: Partial<AnalysisResult>): AnalysisResult | null => {
    const analyses = localStorageService.getAnalyses();
    const index = analyses.findIndex(analysis => analysis.id === id);
    
    if (index === -1) return null;
    
    const updatedAnalysis = {
      ...analyses[index],
      ...data,
      lastModified: new Date().toISOString()
    };
    
    analyses[index] = updatedAnalysis;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(analyses));
    
    return updatedAnalysis;
  },
  
  // Delete an analysis
  deleteAnalysis: (id: string): boolean => {
    const analyses = localStorageService.getAnalyses();
    const filteredAnalyses = analyses.filter(analysis => analysis.id !== id);
    
    if (filteredAnalyses.length === analyses.length) return false;
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredAnalyses));
    return true;
  }
};

export default localStorageService; 