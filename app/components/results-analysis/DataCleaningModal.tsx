"use client";

import React, { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { InfoIcon, AlertTriangle, Check } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

interface DataCleaningModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  fileId?: string;
  fileName?: string;
  fileContent?: File;
  kpiName: string;
  onAnalysisComplete?: (results: any) => void;
  usersPerVariation?: Record<string, string>;
}

export function DataCleaningModal({
  isOpen,
  onOpenChange,
  fileId,
  fileName,
  fileContent,
  kpiName,
  onAnalysisComplete,
  usersPerVariation
}: DataCleaningModalProps) {
  // Reset state when modal is opened/closed
  const [excludeOutliers, setExcludeOutliers] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processComplete, setProcessComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{
    control: { count: number; min: number; max: number; mean: number };
    variation: { count: number; min: number; max: number; mean: number };
  } | null>(null);
  const [outliersRemoved, setOutliersRemoved] = useState<{
    control: number;
    variation: number;
  }>({ control: 0, variation: 0 });
  
  // Reset state when modal is opened
  useEffect(() => {
    if (isOpen) {
      setExcludeOutliers(false);
      setIsProcessing(false);
      setProgress(0);
      setProcessComplete(false);
      setError(null);
      setSummary(null);
      setOutliersRemoved({ control: 0, variation: 0 });
    }
  }, [isOpen]);
  
  const handleClean = async () => {
    if (!fileContent && !fileId) {
      setError("No File Available");
      return;
    }
    
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    
    // Animation fluide pour la barre de progression - accélérée
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        // Progression plus rapide
        const increment = 1.2 + (Math.random() * 0.8); // Incrément entre 1.2 et 2.0
        // Limiter la progression automatique à 95%
        return prev < 95 ? Math.min(prev + increment, 95) : prev;
      });
    }, 250); // Mise à jour moins fréquente
    
    // Durée totale de l'animation : environ 5-7 secondes
    let backendResponse: any = null;
    let backendError: Error | null = null;
    
    // Exécuter la requête au backend en parallèle (ne pas attendre)
    const backendCall = async () => {
      try {
        // Create FormData for API request
        const formData = new FormData();
        
        // Convert file to base64 for sending to API
        let fileContentBase64 = '';
        let fileTypeValue = '';
        
        if (fileContent) {
          const buffer = await fileContent.arrayBuffer();
          const uint8Array = new Uint8Array(buffer);
          let binaryString = '';
          for (let i = 0; i < uint8Array.length; i++) {
            binaryString += String.fromCharCode(uint8Array[i]);
          }
          fileContentBase64 = btoa(binaryString);
          fileTypeValue = fileContent.name.split('.').pop()?.toLowerCase() || 'csv';
        }
        
        // Convert usersPerVariation strings to numbers
        const usersNumeric: Record<string, number> = {};
        
        if (usersPerVariation) {
          console.log("Users per variation (raw):", JSON.stringify(usersPerVariation));
          
          // Ensure required keys are present
          if (!('control' in usersPerVariation)) {
            throw new Error("Control group data is missing");
          }
          
          if (!('variation1' in usersPerVariation) && !('variation' in usersPerVariation)) {
            throw new Error("Variation group data is missing");
          }
          
          // Process control group
          const controlValue = usersPerVariation['control'].trim();
          if (!controlValue) {
            throw new Error("Please specify the number of users for Control group");
          }
          const controlCount = parseInt(controlValue, 10);
          if (isNaN(controlCount) || controlCount <= 0) {
            throw new Error("User count for Control group must be a positive integer");
          }
          usersNumeric['control'] = controlCount;
          
          // Process variations
          // If we have 'variation' directly, there's only one variation
          if ('variation' in usersPerVariation) {
            const variationValue = usersPerVariation['variation'].trim();
            if (!variationValue) {
              throw new Error("Please specify the number of users for Variation");
            }
            const variationCount = parseInt(variationValue, 10);
            if (isNaN(variationCount) || variationCount <= 0) {
              throw new Error("User count for Variation must be a positive integer");
            }
            usersNumeric['variation'] = variationCount;
          } else {
            // Otherwise process each numbered variation
            for (const key in usersPerVariation) {
              if (key.startsWith('variation')) {
                const variationValue = usersPerVariation[key].trim();
                if (!variationValue) {
                  throw new Error(`Please specify the number of users for ${key}`);
                }
                const variationCount = parseInt(variationValue, 10);
                if (isNaN(variationCount) || variationCount <= 0) {
                  throw new Error(`User count for ${key} must be a positive integer`);
                }
                usersNumeric[key] = variationCount;
              }
            }
          }
          
          console.log("Users per variation (processed):", JSON.stringify(usersNumeric));
        } else {
          throw new Error("User data is missing");
        }
        
        // Rename variations to match backend expectations
        // Backend expects only 'control' and 'variation'
        const finalUsersPerVariation: Record<string, number> = {
          control: usersNumeric.control
        };
        
        // If we have a single variation, use 'variation'
        if (usersNumeric.variation) {
          finalUsersPerVariation.variation = usersNumeric.variation;
        }
        // Otherwise, take the first variation found
        else if (usersNumeric.variation1) {
          finalUsersPerVariation.variation = usersNumeric.variation1;
        }
        
        // Prepare request payload
        const payload = {
          file_content: fileContentBase64,
          file_type: fileTypeValue,
          control_column: {
            name: "control",
            type: "numeric"
          },
          variation_column: {
            name: "variation",
            type: "numeric"
          },
          kpi_type: kpiName.toLowerCase(),
          exclude_outliers: excludeOutliers,
          users_per_variation: finalUsersPerVariation
        };
        
        console.log("Sending payload to backend:", JSON.stringify(payload.users_per_variation));
        
        // Send request to backend API
        const response = await fetch('/api/analyze-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`API responded with status: ${response.status} - ${errorData.message || errorData.error || response.statusText}`);
        }
        
        backendResponse = await response.json();
        console.log("Backend response:", JSON.stringify(backendResponse));
        
        // Envoyer les valeurs utilisateur correctes au backend
        const userValues = {
          control: parseInt(usersPerVariation?.control || "0"),
          variation: parseInt(usersPerVariation?.variation || "0")
        };
        
        console.log("API: Sending user values to backend:", JSON.stringify(userValues));
        
        // Modify the response to include user numbers
        const enhancedResponse = { 
          ...backendResponse, 
          user_counts: userValues
        };
        
        console.log("Enhanced response with user counts:", JSON.stringify(enhancedResponse.user_counts));
        
        // Mettre à jour l'état avec les résultats d'analyse
        setSummary({
          control: {
            count: enhancedResponse.basic_statistics?.control?.count || 0,
            min: enhancedResponse.basic_statistics?.control?.min_value || 0,
            max: enhancedResponse.basic_statistics?.control?.max_value || 0,
            mean: enhancedResponse.basic_statistics?.control?.mean || 0
          },
          variation: {
            count: enhancedResponse.basic_statistics?.variation?.count || 0,
            min: enhancedResponse.basic_statistics?.variation?.min_value || 0,
            max: enhancedResponse.basic_statistics?.variation?.max_value || 0,
            mean: enhancedResponse.basic_statistics?.variation?.mean || 0
          }
        });
        
        // Store outliers information - Try different approaches to extract the values
        let controlOutliers = 0;
        let variationOutliers = 0;
        
        if (enhancedResponse.outliers_removed) {
          if (typeof enhancedResponse.outliers_removed === 'object') {
            controlOutliers = enhancedResponse.outliers_removed.control || 0;
            variationOutliers = enhancedResponse.outliers_removed.variation || 0;
            
            // Convert to number if they're strings
            if (typeof controlOutliers === 'string') controlOutliers = parseInt(controlOutliers) || 0;
            if (typeof variationOutliers === 'string') variationOutliers = parseInt(variationOutliers) || 0;
          } else if (typeof enhancedResponse.outliers_removed === 'number') {
            // If it's a single number, assign it to both for safety
            controlOutliers = enhancedResponse.outliers_removed / 2;
            variationOutliers = enhancedResponse.outliers_removed / 2;
          }
        }
        
        console.log("Final outliers values:", JSON.stringify({
          control: controlOutliers,
          variation: variationOutliers
        }));
        
        setOutliersRemoved({
          control: controlOutliers,
          variation: variationOutliers
        });
        
        // Marquer comme terminé avec une transition fluide
        setProgress(100);
        setProcessComplete(true);
        
        // Pass results to parent component without closing the modal
        if (onAnalysisComplete) {
          // Important: Ensure the user counts are correctly passed in the results object
          const finalResponse = {
            ...enhancedResponse,
            // Make sure usersPerVariation values are added directly to the root level for easy access
            users_per_variation: {
              control: parseInt(usersPerVariation?.control || "0"),
              variation: parseInt(usersPerVariation?.variation || "0")
            }
          };
          
          console.log("Sending final response with users:", JSON.stringify(finalResponse.users_per_variation));
          
          // Use setTimeout to ensure summary is displayed before passing results
          setTimeout(() => {
            onAnalysisComplete(finalResponse);
          }, 100);
        }
      } catch (err) {
        console.error("Error in data processing:", err);
        backendError = err as Error;
      }
    };
    
    // Démarrer la requête au backend en arrière-plan
    backendCall();
    
    // Pendant ce temps, exécuter l'animation de progression indépendamment
    try {
      // Force une progression séquentielle pour les étapes
      const simulateSteps = async () => {
        try {
          // Reading file (0-20%)
          await new Promise(resolve => setTimeout(resolve, 600));
          
          // Validating data (20-40%)
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Identifying groups (40-60%)
          await new Promise(resolve => setTimeout(resolve, 600));
          
          // Calculating statistics (60-75%)
          await new Promise(resolve => setTimeout(resolve, 600));
          
          // Statistical tests (75-90%)
          await new Promise(resolve => setTimeout(resolve, 700));
          
          // Finalizing results (90-99%)
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Attendre que le backend ait répondu avec un timeout
          let timeoutCounter = 0;
          const maxTimeout = 50; // 5 secondes maximum d'attente (50 * 100ms)
          
          while (backendResponse === null && backendError === null && timeoutCounter < maxTimeout) {
            await new Promise(resolve => setTimeout(resolve, 100));
            timeoutCounter++;
          }
          
          // Si le timeout est atteint et qu'il n'y a ni réponse ni erreur, on simule une erreur
          if (timeoutCounter >= maxTimeout && backendResponse === null && backendError === null) {
            backendError = new Error("Analysis timed out. Please try again.");
          }
          
          // Traiter l'erreur si nécessaire
          if (backendError) {
            throw backendError;
          }
          
          // Arrêter l'animation de progression
          clearInterval(progressInterval);
          
          // Traiter la réponse du backend
          const results = backendResponse;
          console.log("Processing complete results:", JSON.stringify(results));
          
          // Extract transaction counts from message if available
          let controlCount = 0;
          let variationCount = 0;
          
          if (results.message) {
            const messageMatch = results.message.match(/Found (\d+) control transactions and (\d+) variation transactions/);
            if (messageMatch && messageMatch.length >= 3) {
              controlCount = parseInt(messageMatch[1], 10);
              variationCount = parseInt(messageMatch[2], 10);
            }
          }
          
          // Debug the incoming values before setting state
          if (results.basic_statistics) {
            console.log("Control data:", JSON.stringify({
              count: results.basic_statistics?.control?.count,
              min: results.basic_statistics?.control?.min_value,
              max: results.basic_statistics?.control?.max_value,
              mean: results.basic_statistics?.control?.mean
            }));
            console.log("Variation data:", JSON.stringify({
              count: results.basic_statistics?.variation?.count,
              min: results.basic_statistics?.variation?.min_value,
              max: results.basic_statistics?.variation?.max_value,
              mean: results.basic_statistics?.variation?.mean
            }));
          }
          
          // Debug outliers data structure
          console.log("Raw outliers data:", JSON.stringify(results.outliers_removed));
          
          // Set summary data for the modal with correct values from the response
          setSummary({
            control: {
              count: controlCount || 0,
              min: results.basic_statistics?.control?.min_value || 0,
              max: results.basic_statistics?.control?.max_value || 0,
              mean: results.basic_statistics?.control?.mean || 0
            },
            variation: {
              count: variationCount || 0,
              min: results.basic_statistics?.variation?.min_value || 0, 
              max: results.basic_statistics?.variation?.max_value || 0,
              mean: results.basic_statistics?.variation?.mean || 0
            }
          });
          
          // Store outliers information - Try different approaches to extract the values
          let controlOutliers = 0;
          let variationOutliers = 0;
          
          if (results.outliers_removed) {
            if (typeof results.outliers_removed === 'object') {
              controlOutliers = results.outliers_removed.control || 0;
              variationOutliers = results.outliers_removed.variation || 0;
              
              // Convert to number if they're strings
              if (typeof controlOutliers === 'string') controlOutliers = parseInt(controlOutliers) || 0;
              if (typeof variationOutliers === 'string') variationOutliers = parseInt(variationOutliers) || 0;
            } else if (typeof results.outliers_removed === 'number') {
              // If it's a single number, assign it to both for safety
              controlOutliers = results.outliers_removed / 2;
              variationOutliers = results.outliers_removed / 2;
            }
          }
          
          console.log("Final outliers values:", JSON.stringify({
            control: controlOutliers,
            variation: variationOutliers
          }));
          
          setOutliersRemoved({
            control: controlOutliers,
            variation: variationOutliers
          });
          
          // Marquer comme terminé avec une transition fluide
          setProgress(100);
          setProcessComplete(true);
          
          // Pass results to parent component without closing the modal
          if (onAnalysisComplete) {
            // Use setTimeout to ensure summary is displayed before passing results
            setTimeout(() => {
              onAnalysisComplete(results);
            }, 100);
          }
        } catch (stepError) {
          // Si une étape échoue, on passe quand même à la fin de l'animation
          console.error("Error in simulation steps:", stepError);
          throw stepError;
        } finally {
          // Assurer qu'on arrête l'intervalle dans tous les cas
          clearInterval(progressInterval);
        }
      };
      
      // Simuler les étapes de progression
      await simulateSteps();
      
    } catch (err) {
      // Arrêter l'animation de progression
      clearInterval(progressInterval);
      
      console.error("Error in data processing:", err);
      
      // Forcer la progression à 100% pour sortir de l'état de chargement
      setProgress(100);
      
      // Afficher l'erreur
      setError((err as Error).message || "Failed to analyze data. Please try again.");
      
      // Marquer le traitement comme terminé même en cas d'erreur
      setProcessComplete(true);
    }
  };
  
  const formatValue = (value: number) => {
    if (value < 0.01) {
      return value.toExponential(2);
    } else if (value < 1) {
      return value.toFixed(2);
    } else if (value > 1000) {
      return value.toLocaleString('en-US', { 
        minimumFractionDigits: 1, 
        maximumFractionDigits: 1 
      });
    } else {
      return value.toFixed(1);
    }
  };
  
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => {
      // Only allow closing if processing is complete or hasn't started
      if (!isProcessing || processComplete) {
        onOpenChange(open);
      }
    }}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>
            Analyze {kpiName} Data
          </AlertDialogTitle>
          <AlertDialogDescription>
            Configure analysis options before processing your data set.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {!fileContent && !fileId ? (
          <Alert variant="destructive" className="my-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>No Data File Available</AlertTitle>
            <AlertDescription>
              Please upload a data file before proceeding with analysis.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {!isProcessing ? (
              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="outliers" className="text-base">Outlier Handling</Label>
                      <p className="text-sm text-muted-foreground">
                        Decide how to handle extreme values in your dataset
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className={`p-3 rounded-md border cursor-pointer ${!excludeOutliers ? 'border-primary bg-primary/5' : 'border-border'}`}
                      onClick={() => setExcludeOutliers(false)}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Keep Outliers</span>
                        {!excludeOutliers && <Check className="h-4 w-4 text-primary" />}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Analyze the complete dataset including all extreme values.
                        Best for maintaining data integrity and capturing all business events.
                      </p>
                    </div>
                    
                    <div className={`p-3 rounded-md border cursor-pointer ${excludeOutliers ? 'border-primary bg-primary/5' : 'border-border'}`}
                      onClick={() => setExcludeOutliers(true)}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Remove Outliers</span>
                        {excludeOutliers && <Check className="h-4 w-4 text-primary" />}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Exclude values &gt;3 standard deviations from the mean.
                        Best for finding stable patterns in data with occasional extreme events.
                      </p>
                    </div>
                  </div>
                </div>
                
                <Alert className="bg-muted">
                  <InfoIcon className="h-4 w-4" />
                  <AlertTitle>About your data</AlertTitle>
                  <AlertDescription>
                    {fileName && <div className="mb-1"><strong>File:</strong> {fileName}</div>}
                    <div>We'll perform comprehensive statistical testing on your {kpiName} data using the configuration above.</div>
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <div className="space-y-6 py-4">
                {!processComplete ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Processing data...</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} />
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      <div className={`flex items-center ${progress >= 5 ? 'text-foreground' : 'text-muted-foreground'}`}>
                        <div className={`mr-2 h-4 w-4 rounded-full flex items-center justify-center ${progress >= 5 ? 'bg-primary/20' : 'bg-muted'}`}>
                          {progress >= 20 ? 
                            <Check className="h-3 w-3 text-primary" /> : 
                            (progress >= 5 && <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />)
                          }
                        </div>
                        <p>Reading data file</p>
                      </div>
                      
                      <div className={`flex items-center ${progress >= 20 ? 'text-foreground' : 'text-muted-foreground'}`}>
                        <div className={`mr-2 h-4 w-4 rounded-full flex items-center justify-center ${progress >= 20 ? 'bg-primary/20' : 'bg-muted'}`}>
                          {progress >= 40 ? 
                            <Check className="h-3 w-3 text-primary" /> : 
                            (progress >= 20 && <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />)
                          }
                        </div>
                        <p>Validating data structure</p>
                      </div>
                      
                      <div className={`flex items-center ${progress >= 40 ? 'text-foreground' : 'text-muted-foreground'}`}>
                        <div className={`mr-2 h-4 w-4 rounded-full flex items-center justify-center ${progress >= 40 ? 'bg-primary/20' : 'bg-muted'}`}>
                          {progress >= 60 ? 
                            <Check className="h-3 w-3 text-primary" /> : 
                            (progress >= 40 && <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />)
                          }
                        </div>
                        <p>Identifying control and variation groups</p>
                      </div>
                      
                      <div className={`flex items-center ${progress >= 60 ? 'text-foreground' : 'text-muted-foreground'}`}>
                        <div className={`mr-2 h-4 w-4 rounded-full flex items-center justify-center ${progress >= 60 ? 'bg-primary/20' : 'bg-muted'}`}>
                          {progress >= 75 ? 
                            <Check className="h-3 w-3 text-primary" /> : 
                            (progress >= 60 && <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />)
                          }
                        </div>
                        <p>Calculating descriptive statistics</p>
                      </div>
                      
                      <div className={`flex items-center ${progress >= 75 ? 'text-foreground' : 'text-muted-foreground'}`}>
                        <div className={`mr-2 h-4 w-4 rounded-full flex items-center justify-center ${progress >= 75 ? 'bg-primary/20' : 'bg-muted'}`}>
                          {progress >= 90 ? 
                            <Check className="h-3 w-3 text-primary" /> : 
                            (progress >= 75 && <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />)
                          }
                        </div>
                        <p>Running statistical tests</p>
                      </div>
                      
                      <div className={`flex items-center ${progress >= 90 ? 'text-foreground' : 'text-muted-foreground'}`}>
                        <div className={`mr-2 h-4 w-4 rounded-full flex items-center justify-center ${progress >= 90 ? 'bg-primary/20' : 'bg-muted'}`}>
                          {progress >= 100 ? 
                            <Check className="h-3 w-3 text-primary" /> : 
                            (progress >= 90 && <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />)
                          }
                        </div>
                        <p>Finalizing results</p>
                      </div>
                    </div>
                  </div>
                ) : error ? (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-6">
                    <Alert variant="default" className="border-primary bg-primary/5">
                      <Check className="h-4 w-4 text-primary" />
                      <AlertTitle>Analysis successfully completed</AlertTitle>
                      <AlertDescription>
                        Your data has been successfully analyzed. You can now view the detailed results.
                      </AlertDescription>
                    </Alert>
                    
                    {summary && (
                      <div className="space-y-3">
                        <h3 className="text-lg font-medium">Data Summary</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="rounded-md border border-primary/20 bg-primary/5 p-4">
                            <h4 className="font-medium mb-2">Control Group</h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span>Samples:</span>
                                <span className="font-semibold">{summary.control.count.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Min value:</span>
                                <span className="font-semibold">{formatValue(summary.control.min)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Max value:</span>
                                <span className="font-semibold">{formatValue(summary.control.max)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Mean:</span>
                                <span className="font-semibold">{formatValue(summary.control.mean)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="rounded-md border border-primary/20 bg-primary/5 p-4">
                            <h4 className="font-medium mb-2">Variation Group</h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span>Samples:</span>
                                <span className="font-semibold">{summary.variation.count.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Min value:</span>
                                <span className="font-semibold">{formatValue(summary.variation.min)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Max value:</span>
                                <span className="font-semibold">{formatValue(summary.variation.max)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Mean:</span>
                                <span className="font-semibold">{formatValue(summary.variation.mean)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-sm mt-2">
                          <p className="mb-1">
                            <span className="font-medium">Mean difference:</span>{' '}
                            <span className={summary.variation.mean > summary.control.mean ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                              {summary.variation.mean > summary.control.mean ? '+' : ''}
                              {(((summary.variation.mean - summary.control.mean) / summary.control.mean) * 100).toFixed(1)}%
                            </span>
                          </p>
                          {excludeOutliers && (
                            <p className="text-muted-foreground">
                              <span className="font-medium">Outliers removed:</span>{' '}
                              {outliersRemoved.control + outliersRemoved.variation} data points
                              ({outliersRemoved.control} from control, {outliersRemoved.variation} from variation)
                            </p>
                          )}
                          {!excludeOutliers && (
                            <p className="text-muted-foreground">
                              <span className="font-medium">Outliers:</span>{' '}
                              Kept all data points (no outliers removed)
                            </p>
                          )}
                          <p className="mt-1 text-muted-foreground">Click "View Results" to access the complete statistical analysis.</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
        
        <AlertDialogFooter>
          {!isProcessing ? (
            <>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={(e) => {
                  e.preventDefault();
                  handleClean();
                }}
                className="bg-primary"
              >
                Run Analysis
              </AlertDialogAction>
            </>
          ) : (
            processComplete && (
              <>
                {error ? (
                  <AlertDialogAction
                    onClick={(e) => {
                      e.preventDefault();
                      if (onOpenChange) {
                        onOpenChange(false);
                      }
                    }}
                    className="bg-primary"
                  >
                    Close
                  </AlertDialogAction>
                ) : (
                  <AlertDialogAction 
                    onClick={(e) => {
                      e.preventDefault();
                      if (onOpenChange) {
                        onOpenChange(false);
                      }
                    }}
                    className="bg-primary"
                  >
                    View Results
                  </AlertDialogAction>
                )}
              </>
            )
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 