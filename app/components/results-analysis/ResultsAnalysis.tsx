"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Plus, Upload, X, Check, Info, ChevronRight, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import NewAnalysisForm from "./NewAnalysisForm";
import RecentAnalyses from "./RecentAnalyses";
import localStorageService, { AnalysisResult } from "./localStorageService";
import { DataCleaningModal } from "./DataCleaningModal";
import AnalysisResults from "./AnalysisResults";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ConfidenceTooltip from "./ConfidenceTooltip";
import ImpactTooltip from "./ImpactTooltip";

export default function ResultsAnalysis() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisResult | null>(null);
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [variations, setVariations] = useState<string>("2");
  const [usersPerVariation, setUsersPerVariation] = useState<Record<string, string>>({
    "control": "",
    "variation": ""
  });
  const [kpis, setKpis] = useState<{id: string, name: string, dataUploaded?: boolean}[]>([
    { id: "1", name: "Revenue" },
  ]);
  const [selectedKpis, setSelectedKpis] = useState<{id: string, name: string, fileAttached?: boolean}[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const [showKpiTooltip, setShowKpiTooltip] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentKpiId, setCurrentKpiId] = useState<string | null>(null);
  const [cleaningModalOpen, setCleaningModalOpen] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [currentKpiName, setCurrentKpiName] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisTabs, setAnalysisTabs] = useState<{id: string, name: string}[]>([]);
  const [showAnalysisSection, setShowAnalysisSection] = useState(false);
  const analysisResultsRef = useRef<HTMLDivElement>(null);
  const [analysisResults, setAnalysisResults] = useState<any | null>(null);
  const [editingUsers, setEditingUsers] = useState<Record<string, string>>({});
  const [isEditingUsers, setIsEditingUsers] = useState(false);

  useEffect(() => {
    setAnalyses(localStorageService.getAnalyses());
  }, []);

  useEffect(() => {
    if (selectedAnalysis) {
      setVariations(selectedAnalysis.variations?.toString() || "2");
      
      // Update variation input fields when variation count changes
      const newUsersObj: Record<string, string> = {};
      if (selectedAnalysis.variations) {
        newUsersObj["control"] = "";
        for (let i = 1; i < selectedAnalysis.variations; i++) {
          newUsersObj[`variation${i}`] = "";
        }
      }
      setUsersPerVariation(newUsersObj);
    }
  }, [selectedAnalysis]);

  useEffect(() => {
    // Show tooltip briefly when new KPI is added
    if (selectedKpis.length > 0) {
      setShowKpiTooltip(true);
      const timer = setTimeout(() => {
        setShowKpiTooltip(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [selectedKpis.length]);

  // Réinitialiser complètement l'état entre les analyses
  const resetAnalysisState = () => {
    setShowResults(false);
    setShowAnalysisSection(false);
    setAnalysisResults(null);
    setSelectedKpis([]);
    setCurrentFile(null);
    setCleaningModalOpen(false);
    setIsAnalyzing(false);
    setAnalysisTabs([]);
    setCurrentKpiName("");
    setCurrentKpiId(null);
  };

  // Effet pour nettoyer l'état quand on désélectionne une analyse
  useEffect(() => {
    // Si on n'a plus d'analyse sélectionnée, réinitialiser tous les états
    if (!selectedAnalysis) {
      resetAnalysisState();
    }
    return () => {
      // Nettoyage lors du démontage
      if (!selectedAnalysis) {
        resetAnalysisState();
      }
    };
  }, [selectedAnalysis]);

  const handleAnalysisCreated = (analysis: AnalysisResult) => {
    // Réinitialiser tous les états d'analyse
    resetAnalysisState();
    
    // Réinitialiser les utilisateurs par variation
    const newUsersObj: Record<string, string> = {
      "control": "",
      "variation": ""
    };
    if (analysis.variations && analysis.variations > 2) {
      for (let i = 2; i < analysis.variations; i++) {
        newUsersObj[`variation${i-1}`] = "";
      }
    }
    setUsersPerVariation(newUsersObj);
    
    // Définir la nouvelle analyse
    setSelectedAnalysis(analysis);
    setVariations(analysis.variations?.toString() || "2");
    setAnalyses([analysis, ...analyses]);
  };

  const handleAnalysisSelected = (analysis: AnalysisResult) => {
    // Réinitialiser tous les états d'analyse
    resetAnalysisState();
    
    // Réinitialiser les utilisateurs par variation
    const newUsersObj: Record<string, string> = {
      "control": "",
      "variation": ""
    };
    if (analysis.variations && analysis.variations > 2) {
      for (let i = 2; i < analysis.variations; i++) {
        newUsersObj[`variation${i-1}`] = "";
      }
    }
    setUsersPerVariation(newUsersObj);
    
    // Définir l'analyse sélectionnée
    setSelectedAnalysis(analysis);
    setVariations(analysis.variations?.toString() || "2");
  };

  const handleVariationChange = (value: string) => {
    setVariations(value);
    
    // Update selected analysis in localStorage
    if (selectedAnalysis) {
      const updated = localStorageService.updateAnalysis(selectedAnalysis.id, {
        variations: parseInt(value)
      });
      if (updated) setSelectedAnalysis(updated);
    }
    
    // Update variation input fields
    const newUsersObj: Record<string, string> = {};
    newUsersObj["control"] = usersPerVariation["control"] || "";
    for (let i = 1; i < parseInt(value); i++) {
      newUsersObj[`variation${i}`] = usersPerVariation[`variation${i}`] || "";
    }
    setUsersPerVariation(newUsersObj);
  };
  
  const handleUserCountChange = (variation: string, value: string) => {
    setUsersPerVariation(prev => ({
      ...prev,
      [variation]: value
    }));
  };
  
  const handleKpiSelect = (kpiId: string) => {
    // Only allow one KPI at a time
    const kpiToAdd = kpis.find(k => k.id === kpiId);
    if (kpiToAdd) {
      setSelectedKpis([{ id: kpiToAdd.id, name: kpiToAdd.name, fileAttached: false }]);
    }
  };
  
  const removeKpi = (kpiId: string) => {
    setSelectedKpis(selectedKpis.filter(k => k.id !== kpiId));
  };

  const handleKpiClick = (kpiId: string) => {
    setCurrentKpiId(kpiId);
    // Set current KPI name for modal
    const kpi = selectedKpis.find(k => k.id === kpiId);
    if (kpi) {
      setCurrentKpiName(kpi.name);
    }
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (file && currentKpiId) {
      // Check if file is of allowed type
      const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
      const allowedTypes = ['json', 'csv', 'xlsx', 'xls'];
      
      if (!allowedTypes.includes(fileExt)) {
        alert('Only JSON, CSV, or Excel files are allowed');
        e.target.value = ''; // Clear input
        return;
      }
      
      // Store file for later use
      setCurrentFile(file);
      
      // Mark KPI as having file attached
      setSelectedKpis(prev => 
        prev.map(kpi => 
          kpi.id === currentKpiId
            ? { ...kpi, fileAttached: true }
            : kpi
        )
      );
      
      console.log('File attached to KPI:', file.name);
    }
    
    // Clear input for future uploads
    if (e.target.value) e.target.value = '';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  // Check if any KPI has a file attached
  const hasFileAttached = selectedKpis.some(kpi => kpi.fileAttached);

  const handleCleanData = () => {
    // Open modal for data cleaning
    setCleaningModalOpen(true);
  };

  const handleDataCleaned = (excludeOutliers: boolean) => {
    console.log(`Data cleaned with excludeOutliers: ${excludeOutliers}`);
    // You could call an API here with the file and options
  };

  const handleCalculateResults = () => {
    // Vérifier si les utilisateurs sont spécifiés pour toutes les variations
    const errors = [];
    
    // Vérifier que toutes les variations ont des nombres d'utilisateurs valides
    // On doit avoir au moins control et une variation
    if (!usersPerVariation.control || usersPerVariation.control.trim() === '') {
      errors.push(`Please specify the number of users for the Control group`);
    }
    
    // Vérifier si au moins une variation a des utilisateurs
    let hasVariation = false;
    for (const key in usersPerVariation) {
      if (key !== 'control' && usersPerVariation[key] && usersPerVariation[key].trim() !== '') {
        hasVariation = true;
        break;
      }
    }
    
    if (!hasVariation) {
      errors.push("Please specify the number of users for at least one variation");
    }
    
    // Vérifier que les valeurs sont numériques et positives
    for (const key in usersPerVariation) {
      const value = usersPerVariation[key].trim();
      if (value) {
        const numValue = parseInt(value, 10);
        if (isNaN(numValue) || numValue <= 0) {
          errors.push(`User count for ${key.charAt(0).toUpperCase() + key.slice(1)} must be a positive integer`);
        }
      }
    }
    
    // Afficher les erreurs s'il y en a
    if (errors.length > 0) {
      alert(errors.join('\n'));
      return;
    }
    
    // Vérifier si un fichier est attaché
    if (!hasFileAttached || !currentFile) {
      alert("Please attach a data file for analysis");
      return;
    }
    
    // Définir le bon nom de KPI
    if (selectedKpis.length > 0) {
      setCurrentKpiName(selectedKpis[0].name);
    }
    
    // Ouvrir la modal pour confirmer les paramètres d'analyse
    setCleaningModalOpen(true);
  };

  const handleAnalysisComplete = (results: any) => {
    // Log the incoming results for debugging
    console.log("Analysis complete results:", JSON.stringify(results));
    
    // Log the outliers specifically
    if (results.outliers_removed) {
      console.log("Outliers removed data:", JSON.stringify(results.outliers_removed));
    }
    
    // Vérifier et utiliser les valeurs utilisateurs fournies dans les résultats
    if (results.users_per_variation) {
      console.log("Using user counts from analysis results:", JSON.stringify(results.users_per_variation));
      // Utiliser les valeurs utilisateurs depuis les résultats (si elles existent)
      setUsersPerVariation(prev => {
        const newValues = {
          ...prev,
          "control": String(results.users_per_variation.control || prev.control),
          "variation": String(results.users_per_variation.variation || prev.variation)
        };
        console.log("Updated usersPerVariation:", newValues);
        return newValues;
      });
    }
    
    // Ne pas fermer la modale - le resume s'affiche déjà dans la modale
    // La modal sera fermée uniquement quand l'utilisateur clique sur "Voir les résultats"
    
    // Stocker les résultats pour les utiliser plus tard
    setAnalysisResults(results);
    
    // Mettre à jour l'état pour préparer l'affichage des résultats détaillés
    setShowResults(true);
    
    // Créer les onglets d'analyse en fonction des KPIs
    setAnalysisTabs([
      { id: "1", name: kpis[0].name }
    ]);
    
    // Préparer l'affichage de l'analyse une fois que la modale est fermée
    setShowAnalysisSection(true);
  };

  // Fonction appelée quand la modale de nettoyage est fermée (après l'analyse)
  const handleCleaningModalClosed = () => {
    // Fermer la modale
    setCleaningModalOpen(false);
    
    // Si des résultats d'analyse existent, les afficher
    if (analysisResults && showAnalysisSection) {
      // Cacher les sections des utilisateurs par variation et de sélection de KPI
      setShowResults(true);
      
      // Scroll vers les résultats si nécessaire
      if (analysisResultsRef.current) {
        analysisResultsRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Simplifier la fonction handleUserCountUpdate pour qu'elle ne fonctionne qu'avec le dialogue d'édition complet
  const handleUserCountUpdate = async () => {
    // Si des résultats existent, relancer l'analyse
    if (analysisResults) {
      setCleaningModalOpen(true);
    }
  };

  const handleStartEditingUsers = () => {
    // Initialiser l'édition avec les valeurs actuelles
    setEditingUsers({...usersPerVariation});
    setIsEditingUsers(true);
  };

  const handleEditUserChange = (key: string, value: string) => {
    setEditingUsers(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveUserEdit = () => {
    // Validation: vérifier que toutes les valeurs sont des nombres
    const errors: string[] = [];
    
    Object.entries(editingUsers).forEach(([key, value]) => {
      if (value.trim() !== '') {
        const num = parseInt(value, 10);
        if (isNaN(num) || num <= 0) {
          errors.push(`Le nombre d'utilisateurs pour ${key === 'control' ? 'le groupe de contrôle' : 'la variation'} doit être un nombre entier positif.`);
        }
      }
    });
    
    if (errors.length > 0) {
      alert(errors.join('\n'));
      return;
    }
    
    // Mettre à jour les valeurs
    setUsersPerVariation(editingUsers);
    setIsEditingUsers(false);
    
    // Si des résultats existent, relancer l'analyse
    if (analysisResults) {
      setCleaningModalOpen(true);
    }
  };

  const handleCancelUserEdit = () => {
    setIsEditingUsers(false);
    setEditingUsers({});
  };

  return (
    <>
      {!selectedAnalysis ? (
        <div 
          className="relative rounded-xl p-[1.5px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 shadow-md"
          onMouseMove={handleMouseMove}
          style={{
            backgroundImage: `radial-gradient(800px at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.15), transparent 80%)`
          }}
        >
          <div 
            className="absolute inset-0 rounded-xl"
            style={{
              background: `radial-gradient(1200px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(134, 213, 255, 0.25), rgba(228, 138, 255, 0.18), transparent 50%)`,
              transition: 'background 0.3s ease',
              transform: 'translateZ(0)',
            }}
          />
          <div className="absolute inset-0 rounded-xl overflow-hidden">
            <div className="w-full h-full bg-gradient-to-r from-[#86d5ff30] via-[#8091ff25] to-[#e48aff30]"
              style={{
                transform: `translate(${mousePosition.x/20}px, ${mousePosition.y/20}px)`,
                filter: 'blur(40px)',
                transition: 'transform 0.4s ease',
                borderRadius: 'inherit',
              }}
            />
          </div>
          <Card className="relative p-6 backdrop-blur-sm bg-background/80 rounded-xl border-0 z-10">
            <div className="grid gap-6">
              <div className="text-center space-y-1">
                <h3 className="text-xl font-medium">Results Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Analyze your A/B test results and make data-driven decisions
                </p>
              </div>

              <NewAnalysisForm onAnalysisCreated={handleAnalysisCreated} />
              
              <RecentAnalyses onSelect={handleAnalysisSelected} />
            </div>
          </Card>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative rounded-xl p-[1.5px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 shadow-md mt-4"
        >
          <div 
            className="absolute inset-0 rounded-xl"
            style={{
              background: `radial-gradient(1200px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(134, 213, 255, 0.25), rgba(228, 138, 255, 0.18), transparent 50%)`,
              transition: 'background 0.3s ease',
              transform: 'translateZ(0)',
            }}
          />
          <Card className="p-6 backdrop-blur-sm bg-background/80 rounded-xl border-0 z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setSelectedAnalysis(null)}
                  className="rounded-full h-8 w-8"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h3 className="text-xl font-medium">{selectedAnalysis.name}</h3>
              </div>
              
              {!showResults && (
              <div className="flex items-center gap-2">
                <Label htmlFor="variations" className="text-sm mr-2">Variations:</Label>
                <Select value={variations} onValueChange={handleVariationChange}>
                  <SelectTrigger id="variations" className="w-[140px] border-muted">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {[2, 3, 4, 5].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num - 1} variation{num > 2 ? 's' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              )}
            </div>
            
            <div className="space-y-6">
              {/* Users per variation section - hide when showing results */}
              {!showResults && (
              <div className="rounded-lg border border-border/40 bg-card/50 p-4">
                <h4 className="text-md font-medium mb-4">Users per variation</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div key="control" className="space-y-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Users</span>
                    <h5 className="text-base font-medium">Control</h5>
                    <Input
                      id="control-users"
                      placeholder="e.g. 1000"
                      value={usersPerVariation["control"]}
                      onChange={(e) => handleUserCountChange("control", e.target.value)}
                      type="number"
                      min="0"
                      className="bg-background/60 border-muted/50 focus-visible:ring-1 focus-visible:ring-offset-1"
                    />
                  </div>
                  
                  {/* Dynamically render input fields for variations */}
                  {Array.from({ length: parseInt(variations) - 1 }).map((_, i) => (
                    <div key={`variation${i+1}`} className="space-y-1">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">Users</span>
                      <h5 className="text-base font-medium">Variation {i+1}</h5>
                      <Input
                        id={`variation${i+1}-users`}
                        placeholder="e.g. 1000"
                        value={usersPerVariation[`variation${i+1}`] || ""}
                        onChange={(e) => handleUserCountChange(`variation${i+1}`, e.target.value)}
                        type="number"
                        min="0"
                        className="bg-background/60 border-muted/50 focus-visible:ring-1 focus-visible:ring-offset-1"
                      />
                    </div>
                  ))}
                </div>
              </div>
              )}
              
              {/* KPI selection section - hide when showing results */}
              {!showResults && (
              <div className="rounded-lg border border-border/40 bg-card/50 p-4">
                <h4 className="text-md font-medium mb-3">Select KPI</h4>
                
                <div>
                  <div className="flex max-w-md">
                    <Select value={selectedKpis.length > 0 ? selectedKpis[0].id : ""} onValueChange={handleKpiSelect}>
                      <SelectTrigger className="bg-background/60 border-muted/50 focus:ring-1 focus:ring-offset-1">
                        <SelectValue placeholder="Select a KPI" />
                      </SelectTrigger>
                      <SelectContent>
                        {kpis.map((kpi) => (
                          <SelectItem key={kpi.id} value={kpi.id}>
                            {kpi.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedKpis.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      <TooltipProvider>
                        {selectedKpis.map(kpi => (
                          <Badge 
                            key={kpi.id} 
                            variant="secondary"
                            className={`flex items-center gap-1 pl-3 pr-2 py-1.5 ${kpi.fileAttached ? 'border-primary/30' : ''} cursor-pointer`}
                            onClick={() => handleKpiClick(kpi.id)}
                          >
                            <span className="flex items-center gap-1">
                              {kpi.name}
                              {kpi.fileAttached && (
                                <span className="inline-flex items-center justify-center w-2 h-2 bg-primary rounded-full" title="File attached"></span>
                              )}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 rounded-full p-0 ml-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeKpi(kpi.id);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                        </TooltipProvider>
                              </div>
                        )}
                  </div>
                    </div>
                  )}
                  
              {/* Action buttons section - hide when showing results */}
              {!showResults && (
                <div className="flex justify-center mt-6">
                    <Button 
                    className="px-8"
                    onClick={handleCalculateResults}
                    disabled={!hasFileAttached || !selectedKpis.length}
                  >
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Run Analysis
                    </Button>
                      </div>
                    )}
                    
              {/* Input for file upload (hidden) */}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
                accept=".csv,.json,.xlsx,.xls"
              />
              
              {/* Conditional rendering of analysis results */}
              {showResults && showAnalysisSection && (
                <div ref={analysisResultsRef}>
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-semibold mb-1">{selectedAnalysis.name} Analysis</h2>
                      <p className="text-muted-foreground">
                      Analyzed {analysisResults?.basic_statistics?.control?.count || 0} control and 
                      {analysisResults?.basic_statistics?.variation?.count || 0} variation transactions
                      </p>
                    </div>
                  
                      <Tabs defaultValue="summary" className="w-full">
                        <div className="flex justify-center mb-4">
                          <TabsList className="grid w-[400px] grid-cols-2">
                            <TabsTrigger value="summary">Summary</TabsTrigger>
                            <TabsTrigger value="revenue">Revenue</TabsTrigger>
                        </TabsList>
                        </div>
                        
                        <TabsContent value="summary">
                          <div className="space-y-6">
                            {/* Summary Table */}
                            <div className="overflow-x-auto">
                              <table className="w-full border-collapse">
                                <thead>
                                  <tr className="border-b border-border bg-muted/30">
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Variation</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                  <div className="flex items-center">
                                    <span>Users</span>
                                    <button 
                                      className="ml-2 rounded-full p-1 hover:bg-muted/50"
                                      onClick={handleStartEditingUsers}
                                      title="Edit users"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                                      </svg>
                                    </button>
                                  </div>
                                </th>
                                    {/* KPIs - Showing in fixed order: Engagement, Behavioral, Revenue */}
                                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Conversion Rate</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Average Order Value</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground w-[140px]">Revenue</th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Revenue per user</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr className="border-b border-border/50">
                                    <td className="px-4 py-3 text-sm font-medium">Control</td>
                                <td className="px-4 py-3 text-sm">
                                  {isEditingUsers ? (
                                    <Input
                                      type="number"
                                      min="1"
                                      value={editingUsers["control"] || ""}
                                      onChange={(e) => handleEditUserChange("control", e.target.value)}
                                      className="w-24 h-8 py-1 text-sm"
                                    />
                                  ) : (
                                    <span>{usersPerVariation["control"] || "0"}</span>
                                  )}
                                </td>
                                    {/* Conversion Rate */}
                                    <td className="px-4 py-3 text-sm text-right">
                                  <div>{((analysisResults?.conversion_metrics?.control_value || 0) * 100).toFixed(2)}%</div>
                                  <div className="text-xs text-muted-foreground">
                                    {parseInt(usersPerVariation["control"] || "0") > 0 
                                      ? Math.round((analysisResults?.conversion_metrics?.control_value || 0) * parseInt(usersPerVariation["control"])) 
                                      : 0} conversions
                                  </div>
                                    </td>
                                    {/* AOV */}
                                    <td className="px-4 py-3 text-sm text-right">
                                  <div>{(analysisResults?.aov_metrics?.control_value || 0).toFixed(2)} €</div>
                                      <div className="text-xs text-muted-foreground">baseline</div>
                                    </td>
                                    {/* Revenue */}
                                    <td className="px-4 py-3 text-sm text-right">
                                  <div>{(analysisResults?.revenue_metrics?.control_value || 0).toLocaleString('en-US', {maximumFractionDigits: 1})} €</div>
                                  <div className="text-xs text-muted-foreground">baseline</div>
                                </td>
                                {/* Revenue per user - new KPI */}
                                <td className="px-4 py-3 text-sm text-right">
                                  <div>{parseInt(usersPerVariation["control"] || "0") > 0 
                                    ? ((analysisResults?.revenue_metrics?.control_value || 0) / parseInt(usersPerVariation["control"])).toFixed(1)
                                    : "0.0"} €</div>
                                      <div className="text-xs text-muted-foreground">baseline</div>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-4 py-3 text-sm font-medium">Variation</td>
                                <td className="px-4 py-3 text-sm">
                                  {isEditingUsers ? (
                                    <Input
                                      type="number"
                                      min="1"
                                      value={editingUsers["variation"] || ""}
                                      onChange={(e) => handleEditUserChange("variation", e.target.value)}
                                      className="w-24 h-8 py-1 text-sm"
                                    />
                                  ) : (
                                    <span>{usersPerVariation["variation"] || "0"}</span>
                                  )}
                                </td>
                                {/* Conversion Rate */}
                                    <td className="px-4 py-3 text-sm text-right">
                                  <div>{((analysisResults?.conversion_metrics?.variation_value || 0) * 100).toFixed(2)}%</div>
                                  <div className={`text-xs ${analysisResults?.conversion_metrics?.uplift >= 0 ? 'text-green-600' : 'text-red-600'} font-medium`}>
                                    {analysisResults?.conversion_metrics?.uplift >= 0 ? '+' : ''}
                                    {(analysisResults?.conversion_metrics?.uplift || 0).toFixed(2)}%
                                    <ConfidenceTooltip 
                                      kpiType="conversion"
                                      confidence={analysisResults?.conversion_metrics?.test_result?.confidence || 0}
                                      controlValue={analysisResults?.conversion_metrics?.control_value || 0}
                                      variationValue={analysisResults?.conversion_metrics?.variation_value || 0}
                                      controlCount={analysisResults?.basic_statistics?.control?.count || 0}
                                      variationCount={analysisResults?.basic_statistics?.variation?.count || 0}
                                    />
                                  </div>
                                    </td>
                                {/* AOV */}
                                    <td className="px-4 py-3 text-sm text-right">
                                  <div>{(analysisResults?.aov_metrics?.variation_value || 0).toFixed(2)} €</div>
                                  <div className={`text-xs ${analysisResults?.aov_metrics?.uplift >= 0 ? 'text-green-600' : 'text-red-600'} font-medium`}>
                                    {analysisResults?.aov_metrics?.uplift >= 0 ? '+' : ''}
                                    {(analysisResults?.aov_metrics?.uplift || 0).toFixed(2)}%
                                    <ConfidenceTooltip 
                                      kpiType="aov"
                                      confidence={analysisResults?.aov_metrics?.test_result?.confidence || 0}
                                      controlValue={analysisResults?.aov_metrics?.control_value || 0}
                                      variationValue={analysisResults?.aov_metrics?.variation_value || 0}
                                      controlCount={analysisResults?.basic_statistics?.control?.count || 0}
                                      variationCount={analysisResults?.basic_statistics?.variation?.count || 0}
                                      controlStd={analysisResults?.basic_statistics?.control?.std || 0}
                                      variationStd={analysisResults?.basic_statistics?.variation?.std || 0}
                                    />
                                  </div>
                                    </td>
                                {/* Revenue */}
                                    <td className="px-4 py-3 text-sm text-right">
                                  <div>{(analysisResults?.revenue_metrics?.variation_value || 0).toLocaleString('en-US', {maximumFractionDigits: 1})} €</div>
                                  <div className={`text-xs ${analysisResults?.revenue_metrics?.uplift >= 0 ? 'text-green-600' : 'text-red-600'} font-medium`}>
                                    {analysisResults?.revenue_metrics?.uplift >= 0 ? '+' : ''}
                                    {(analysisResults?.revenue_metrics?.uplift || 0).toFixed(2)}%
                                    <ConfidenceTooltip 
                                      kpiType="revenue"
                                      confidence={analysisResults?.revenue_metrics?.test_result?.confidence || 0}
                                      controlValue={analysisResults?.revenue_metrics?.control_value || 0}
                                      variationValue={analysisResults?.revenue_metrics?.variation_value || 0}
                                      controlCount={analysisResults?.basic_statistics?.control?.count || 0}
                                      variationCount={analysisResults?.basic_statistics?.variation?.count || 0}
                                      controlStd={analysisResults?.basic_statistics?.control?.std || 0}
                                      variationStd={analysisResults?.basic_statistics?.variation?.std || 0}
                                    />
                                  </div>
                                </td>
                                {/* Revenue per user - new KPI */}
                                <td className="px-4 py-3 text-sm text-right">
                                  <div>{parseInt(usersPerVariation["variation"] || "0") > 0 
                                    ? ((analysisResults?.revenue_metrics?.variation_value || 0) / parseInt(usersPerVariation["variation"])).toFixed(1)
                                    : "0.0"} €</div>
                                  <div className={`text-xs ${
                                    (parseInt(usersPerVariation["control"] || "0") > 0 && parseInt(usersPerVariation["variation"] || "0") > 0) ?
                                      ((analysisResults?.revenue_metrics?.variation_value || 0) / parseInt(usersPerVariation["variation"])) > 
                                      ((analysisResults?.revenue_metrics?.control_value || 0) / parseInt(usersPerVariation["control"])) ?
                                        'text-green-600' : 'text-red-600'
                                      : 'text-muted-foreground'
                                  } font-medium`}>
                                    {(parseInt(usersPerVariation["control"] || "0") > 0 && parseInt(usersPerVariation["variation"] || "0") > 0) ?
                                      ((analysisResults?.revenue_metrics?.variation_value || 0) / parseInt(usersPerVariation["variation"])) > 
                                      ((analysisResults?.revenue_metrics?.control_value || 0) / parseInt(usersPerVariation["control"])) ?
                                        `+${(((
                                          (analysisResults?.revenue_metrics?.variation_value || 0) / parseInt(usersPerVariation["variation"]) - 
                                          (analysisResults?.revenue_metrics?.control_value || 0) / parseInt(usersPerVariation["control"])
                                        ) / ((analysisResults?.revenue_metrics?.control_value || 0) / parseInt(usersPerVariation["control"]))) * 100).toFixed(1)}%` :
                                        `${(((
                                          (analysisResults?.revenue_metrics?.variation_value || 0) / parseInt(usersPerVariation["variation"]) - 
                                          (analysisResults?.revenue_metrics?.control_value || 0) / parseInt(usersPerVariation["control"])
                                        ) / ((analysisResults?.revenue_metrics?.control_value || 0) / parseInt(usersPerVariation["control"]))) * 100).toFixed(1)}%`
                                      : ''
                                    }
                                  </div>
                                    </td>
                                  </tr>
                                </tbody>
                            {isEditingUsers && (
                              <tfoot className="border-t border-border">
                                <tr>
                                  <td></td>
                                  <td className="px-4 py-2">
                                    <div className="flex gap-2">
                                      <Button size="sm" variant="default" className="h-8 px-3 py-1" onClick={handleSaveUserEdit}>
                                        Validate
                                      </Button>
                                      <Button size="sm" variant="ghost" className="h-8 px-3 py-1" onClick={handleCancelUserEdit}>
                                        Cancel
                                      </Button>
                                    </div>
                                  </td>
                                  <td colSpan={4}></td>
                                </tr>
                              </tfoot>
                            )}
                                <tfoot>
                                  <tr>
                                <td colSpan={6} className="px-4 py-2 text-xs text-muted-foreground">
                                      <div className="flex items-center gap-4 mt-2">
                                        <div className="flex items-center">
                                          <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                                          <span>High confidence (95%+)</span>
                                        </div>
                                        <div className="flex items-center">
                                          <span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-1"></span>
                                      <span>Low confidence (85-94%)</span>
                                        </div>
                                        <div className="flex items-center">
                                      <span className="inline-block w-2 h-2 rounded-full bg-gray-400 mr-1"></span>
                                      <span>Inconclusive (below 85%)</span>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>

                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Recommendation & Action Plan</h3>
                          
                          {/* Recommandation principale */}
                          <div className={`p-4 border rounded-md ${
                            // Logique de recommandation améliorée, plus pragmatique
                            (() => {
                              // Vérifier le niveau de confiance des métriques de revenu
                              const revenueConfident = analysisResults?.revenue_metrics?.test_result?.confidence >= 85;
                              const conversionConfident = analysisResults?.conversion_metrics?.test_result?.confidence >= 85;
                              const aovConfident = analysisResults?.aov_metrics?.test_result?.confidence >= 85;
                              
                              // Évaluer l'impact global sur le revenu
                              const revenuePositive = analysisResults?.revenue_metrics?.uplift > 0;
                              const conversionPositive = analysisResults?.conversion_metrics?.uplift > 0;
                              
                              // Vérifier les échantillons pour éviter les faux positifs
                              const controlSampleSize = analysisResults?.basic_statistics?.control?.count || 0;
                              const variationSampleSize = analysisResults?.basic_statistics?.variation?.count || 0;
                              const adequateSample = Math.min(controlSampleSize, variationSampleSize) >= 100;
                              
                              // Calculer le compromis entre conversion et revenu
                              const conversionDropPercent = conversionConfident && !conversionPositive 
                                ? Math.abs(analysisResults?.conversion_metrics?.uplift || 0) 
                                : 0;
                              
                              const revenueLiftPercent = revenueConfident && revenuePositive
                                ? analysisResults?.revenue_metrics?.uplift || 0
                                : 0;
                                
                              // Décider de la couleur et du style
                              if (revenueConfident && revenuePositive && (conversionPositive || !conversionConfident || conversionDropPercent < 5)) {
                                return 'border-green-200 bg-green-50 text-green-800';
                              } else if (revenueConfident && revenuePositive && !conversionPositive && conversionConfident && conversionDropPercent >= 5) {
                                return 'border-amber-200 bg-amber-50 text-amber-800';
                              } else if (!revenueConfident && adequateSample) {
                                return 'border-blue-200 bg-blue-50 text-blue-800';
                              } else {
                                return 'border-gray-200 bg-gray-50 text-gray-800';
                              }
                            })()
                          }`}>
                            <h4 className="font-medium text-lg mb-2">{
                              // Titre de recommandation plus pragmatique
                              (() => {
                                const revenueConfident = analysisResults?.revenue_metrics?.test_result?.confidence >= 85;
                                const conversionConfident = analysisResults?.conversion_metrics?.test_result?.confidence >= 85;
                                const revenuePositive = analysisResults?.revenue_metrics?.uplift > 0;
                                const conversionPositive = analysisResults?.conversion_metrics?.uplift > 0;
                                const conversionDropPercent = conversionConfident && !conversionPositive 
                                  ? Math.abs(analysisResults?.conversion_metrics?.uplift || 0) 
                                  : 0;
                                
                                if (revenueConfident && revenuePositive && (conversionPositive || !conversionConfident)) {
                                  return 'Implement the variation';
                                } else if (revenueConfident && revenuePositive && !conversionPositive && conversionDropPercent < 5) {
                                  return 'Implement with caution';
                                } else if (revenueConfident && revenuePositive && !conversionPositive && conversionDropPercent >= 5) {
                                  return 'Test additional optimizations';
                                } else if (!revenueConfident && (analysisResults?.revenue_metrics?.uplift || 0) > 5) {
                                  return 'Continue testing';
                                } else {
                                  return 'Rethink the variation';
                                }
                              })()
                            }</h4>
                            
                            {/* Analyse détaillée et justification */}
                            <div className="space-y-3">
                              <p className="text-sm">
                                {(() => {
                                  const revenueConfident = analysisResults?.revenue_metrics?.test_result?.confidence >= 85;
                                  const conversionConfident = analysisResults?.conversion_metrics?.test_result?.confidence >= 85;
                                  const aovConfident = analysisResults?.aov_metrics?.test_result?.confidence >= 85;
                                  
                                  const revenuePositive = analysisResults?.revenue_metrics?.uplift > 0;
                                  const conversionPositive = analysisResults?.conversion_metrics?.uplift > 0;
                                  const aovPositive = analysisResults?.aov_metrics?.uplift > 0;
                                  
                                  const revenueChange = analysisResults?.revenue_metrics?.uplift || 0;
                                  const conversionChange = analysisResults?.conversion_metrics?.uplift || 0;
                                  const aovChange = analysisResults?.aov_metrics?.uplift || 0;
                                  
                                  const controlSampleSize = analysisResults?.basic_statistics?.control?.count || 0;
                                  const variationSampleSize = analysisResults?.basic_statistics?.variation?.count || 0;
                                  
                                  // Construire une explication pragmatique
                                  if (revenueConfident && revenuePositive && conversionConfident && conversionPositive) {
                                    return `Results show a significant improvement in revenue (+${revenueChange.toFixed(1)}%) and conversion rate (+${conversionChange.toFixed(1)}%). This variation has a positive impact on all key metrics with high statistical confidence.`;
                                  } else if (revenueConfident && revenuePositive && (!conversionConfident || (conversionConfident && conversionChange > -5))) {
                                    return `The variation shows a significant revenue improvement (+${revenueChange.toFixed(1)}%)${conversionConfident ? ` despite a slight decrease in conversion rate (${conversionChange.toFixed(1)}%)` : ' with no significant impact on conversion rate'}. The overall impact on business metrics is positive.`;
                                  } else if (revenueConfident && revenuePositive && conversionConfident && conversionChange <= -5) {
                                    return `The variation shows revenue improvement (+${revenueChange.toFixed(1)}%) but a significant drop in conversion rate (${conversionChange.toFixed(1)}%). This presents a tradeoff between short-term revenue and long-term user experience/conversion.`;
                                  } else if (!revenueConfident && revenueChange > 0) {
                                    if (Math.min(controlSampleSize, variationSampleSize) < 100) {
                                      return `The data sample is too small (${Math.min(controlSampleSize, variationSampleSize)} transactions) to draw reliable conclusions. The positive trends observed need more data for confirmation.`;
                                    } else {
                                      return `The variation shows a positive trend (+${revenueChange.toFixed(1)}% on revenue) but lacks statistical significance. Continuing tests would provide more conclusive results.`;
                                    }
                                  } else if (revenueConfident && !revenuePositive) {
                                    return `The variation shows a decrease in revenue (${revenueChange.toFixed(1)}%) with sufficient statistical confidence. This variation is not recommended for implementation.`;
                                  } else {
                                    return `Results don't show significant or positive impact on key metrics. Consider reverting to the control version or designing a new variation.`;
                                  }
                                })()}
                              </p>
                              
                              {/* Tableau des impacts */}
                              <div className="mt-2 bg-background rounded border p-2">
                                <div className="text-xs font-medium mb-1">Projected business impact (total)</div>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <div className="text-muted-foreground text-xs flex items-center">
                                      Conversions
                                      <ImpactTooltip
                                        type="conversions"
                                        controlValue={analysisResults?.conversion_metrics?.control_value || 0}
                                        variationValue={analysisResults?.conversion_metrics?.variation_value || 0}
                                        controlUsers={parseInt(usersPerVariation["control"] || "0")}
                                        variationUsers={parseInt(usersPerVariation["variation"] || "0")}
                                      />
                                    </div>
                                    <div className="font-medium">
                                      {(() => {
                                        const controlConvRate = analysisResults?.conversion_metrics?.control_value || 0;
                                        const variationConvRate = analysisResults?.conversion_metrics?.variation_value || 0;
                                        const controlUsers = parseInt(usersPerVariation["control"] || "0");
                                        const variationUsers = parseInt(usersPerVariation["variation"] || "0");
                                        
                                        // Calcul du nombre total de conversions pour chaque groupe
                                        const controlConversions = controlConvRate * controlUsers;
                                        const variationConversions = variationConvRate * variationUsers;
                                        
                                        // Calcul de la différence totale projetée
                                        const projectedDifference = (variationConvRate - controlConvRate) * (controlUsers + variationUsers);
                                        const sign = projectedDifference >= 0 ? '+' : '';
                                        
                                        return `${sign}${Math.round(projectedDifference)} conversions`;
                                      })()}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-muted-foreground text-xs flex items-center">
                                      Order Value
                                      <ImpactTooltip
                                        type="order_value"
                                        controlValue={analysisResults?.aov_metrics?.control_value || 0}
                                        variationValue={analysisResults?.aov_metrics?.variation_value || 0}
                                        controlUsers={parseInt(usersPerVariation["control"] || "0")}
                                        variationUsers={parseInt(usersPerVariation["variation"] || "0")}
                                      />
                                    </div>
                                    <div className="font-medium">
                                      {(() => {
                                        const controlAOV = analysisResults?.aov_metrics?.control_value || 0;
                                        const variationAOV = analysisResults?.aov_metrics?.variation_value || 0;
                                        const difference = variationAOV - controlAOV;
                                        const sign = difference >= 0 ? '+' : '';
                                        
                                        return `${sign}${difference.toFixed(2)} € per order`;
                                      })()}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-muted-foreground text-xs flex items-center">
                                      Revenue
                                      <ImpactTooltip
                                        type="revenue"
                                        controlValue={analysisResults?.revenue_metrics?.control_value || 0}
                                        variationValue={analysisResults?.revenue_metrics?.variation_value || 0}
                                        controlUsers={parseInt(usersPerVariation["control"] || "0")}
                                        variationUsers={parseInt(usersPerVariation["variation"] || "0")}
                                      />
                                    </div>
                                    <div className="font-medium">
                                      {(() => {
                                        const controlRevenue = analysisResults?.revenue_metrics?.control_value || 0;
                                        const variationRevenue = analysisResults?.revenue_metrics?.variation_value || 0;
                                        const controlUsers = parseInt(usersPerVariation["control"] || "0");
                                        const variationUsers = parseInt(usersPerVariation["variation"] || "0");
                                        
                                        // Calcul de la différence de revenu par utilisateur
                                        const revenuePerControlUser = controlUsers > 0 ? controlRevenue / controlUsers : 0;
                                        const revenuePerVariationUser = variationUsers > 0 ? variationRevenue / variationUsers : 0;
                                        
                                        // Calcul du revenu total projeté
                                        const totalUsers = controlUsers + variationUsers;
                                        const projectedDifference = (revenuePerVariationUser - revenuePerControlUser) * totalUsers;
                                        const sign = projectedDifference >= 0 ? '+' : '';
                                        
                                        return `${sign}${Math.round(projectedDifference).toLocaleString()} € total`;
                                      })()}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Message spécial si confiance modérée */}
                              {(() => {
                                const revenueConfidence = analysisResults?.revenue_metrics?.test_result?.confidence || 0;
                                const conversionConfidence = analysisResults?.conversion_metrics?.test_result?.confidence || 0;
                                
                                if ((revenueConfidence >= 85 && revenueConfidence < 95) || 
                                    (conversionConfidence >= 85 && conversionConfidence < 95)) {
                                  return (
                                    <div className="mt-2 text-xs bg-amber-50 border border-amber-100 rounded p-2 text-amber-800">
                                      <strong>Note:</strong> Some results show moderate statistical confidence (85-94%). 
                                      There is a higher risk of false positives compared to 95%+ confidence. Consider this 
                                      uncertainty in your decision.
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          </div>
                          
                          {/* Plan d'action */}
                          <div className="rounded-md border p-4">
                            <h4 className="font-medium mb-2">Recommended action plan</h4>
                            <ul className="space-y-2">
                              {(() => {
                                const revenueConfident = analysisResults?.revenue_metrics?.test_result?.confidence >= 85;
                                const conversionConfident = analysisResults?.conversion_metrics?.test_result?.confidence >= 85;
                                const revenuePositive = analysisResults?.revenue_metrics?.uplift > 0;
                                const conversionPositive = analysisResults?.conversion_metrics?.uplift > 0;
                                const conversionDropPercent = conversionConfident && !conversionPositive 
                                  ? Math.abs(analysisResults?.conversion_metrics?.uplift || 0) 
                                  : 0;
                                  
                                // Calcul des plages d'échantillon nécessaires
                                const controlSampleSize = analysisResults?.basic_statistics?.control?.count || 0;
                                const variationSampleSize = analysisResults?.basic_statistics?.variation?.count || 0;
                                const minSampleSize = Math.min(controlSampleSize, variationSampleSize);
                                
                                if (revenueConfident && revenuePositive && (conversionPositive || !conversionConfident || conversionDropPercent < 5)) {
                                  // Recommandation d'implémentation
                                  return (
                                    <>
                                <li className="flex items-start">
                                        <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mr-2 mt-0.5 text-green-600">
                                          <Check className="h-4 w-4" />
                                  </div>
                                  <div>
                                          <div className="font-medium">Implement the variation for all users</div>
                                          <div className="text-sm text-muted-foreground mt-0.5">
                                            Deploy the variation for all users by replacing the control version.
                                          </div>
                                  </div>
                                </li>
                                <li className="flex items-start">
                                        <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mr-2 mt-0.5 text-green-600">
                                          <BarChart3 className="h-4 w-4" />
                                  </div>
                                  <div>
                                          <div className="font-medium">Monitor post-deployment metrics</div>
                                          <div className="text-sm text-muted-foreground mt-0.5">
                                            Set up a dashboard to track key metrics after full deployment.
                                          </div>
                                  </div>
                                </li>
                                <li className="flex items-start">
                                        <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mr-2 mt-0.5 text-green-600">
                                          <Plus className="h-4 w-4" />
                                  </div>
                                  <div>
                                          <div className="font-medium">Plan complementary optimization tests</div>
                                          <div className="text-sm text-muted-foreground mt-0.5">
                                            Use these results to develop new tests that could further improve performance.
                                          </div>
                                  </div>
                                </li>
                                    </>
                                  );
                                } else if (revenueConfident && revenuePositive && conversionConfident && conversionDropPercent >= 5) {
                                  // Recommandation pour tester des améliorations
                                  return (
                                    <>
                                      <li className="flex items-start">
                                        <div className="h-6 w-6 rounded-full bg-amber-100 flex items-center justify-center mr-2 mt-0.5 text-amber-600">
                                          <Check className="h-4 w-4" />
                            </div>
                                        <div>
                                          <div className="font-medium">Deploy the variation to a portion of users</div>
                                          <div className="text-sm text-muted-foreground mt-0.5">
                                            Implement the variation for 50% of users to maintain revenue gains while limiting negative impact on conversion rate.
                              </div>
                            </div>
                                </li>
                                      <li className="flex items-start">
                                        <div className="h-6 w-6 rounded-full bg-amber-100 flex items-center justify-center mr-2 mt-0.5 text-amber-600">
                                          <Plus className="h-4 w-4" />
                                        </div>
                                        <div>
                                          <div className="font-medium">Develop an improved variation</div>
                                          <div className="text-sm text-muted-foreground mt-0.5">
                                            Create a new variation that maintains the positive revenue impact while improving conversion rate.
                                          </div>
                                        </div>
                                </li>
                                      <li className="flex items-start">
                                        <div className="h-6 w-6 rounded-full bg-amber-100 flex items-center justify-center mr-2 mt-0.5 text-amber-600">
                                          <BarChart3 className="h-4 w-4" />
                                        </div>
                                        <div>
                                          <div className="font-medium">Analyze impact on customer retention</div>
                                          <div className="text-sm text-muted-foreground mt-0.5">
                                            Evaluate whether the decrease in conversion rate affects retention and long-term customer value.
                                          </div>
                                        </div>
                                </li>
                                    </>
                                  );
                                } else if (!revenueConfident && minSampleSize < 500) {
                                  // Recommandation pour poursuivre les tests
                                  return (
                                    <>
                                      <li className="flex items-start">
                                        <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mr-2 mt-0.5 text-blue-600">
                                          <BarChart3 className="h-4 w-4" />
                            </div>
                                        <div>
                                          <div className="font-medium">Collect more data</div>
                                          <div className="text-sm text-muted-foreground mt-0.5">
                                            Continue the test until reaching at least 500 transactions per variation to obtain sufficient statistical power.
                          </div>
                                </div>
                                      </li>
                                      <li className="flex items-start">
                                        <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mr-2 mt-0.5 text-blue-600">
                                          <Info className="h-4 w-4" />
                              </div>
                                        <div>
                                          <div className="font-medium">Segment the results</div>
                                          <div className="text-sm text-muted-foreground mt-0.5">
                                            Analyze if certain user segments respond better to the variation to identify targeted opportunities.
                                          </div>
                                        </div>
                                      </li>
                                      <li className="flex items-start">
                                        <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mr-2 mt-0.5 text-blue-600">
                                          <Plus className="h-4 w-4" />
                                        </div>
                                        <div>
                                          <div className="font-medium">Prepare an alternative iteration</div>
                                          <div className="text-sm text-muted-foreground mt-0.5">
                                            Develop an alternative variation based on trends observed in current data.
                                          </div>
                                        </div>
                                      </li>
                                    </>
                                  );
                                } else {
                                  // Recommandation pour repenser l'approche
                                  return (
                                    <>
                                      <li className="flex items-start">
                                        <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center mr-2 mt-0.5 text-gray-600">
                                          <X className="h-4 w-4" />
                                        </div>
                                        <div>
                                          <div className="font-medium">Abandon this variation</div>
                                          <div className="text-sm text-muted-foreground mt-0.5">
                                            The current variation doesn't show significant improvements. Revert to the control version.
                                          </div>
                                        </div>
                                      </li>
                                      <li className="flex items-start">
                                        <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center mr-2 mt-0.5 text-gray-600">
                                          <Info className="h-4 w-4" />
                                        </div>
                                        <div>
                                          <div className="font-medium">Return to research phase</div>
                                          <div className="text-sm text-muted-foreground mt-0.5">
                                            Conduct new user research to better understand problems and opportunities.
                                          </div>
                                        </div>
                                      </li>
                                      <li className="flex items-start">
                                        <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center mr-2 mt-0.5 text-gray-600">
                                          <Plus className="h-4 w-4" />
                                        </div>
                                        <div>
                                          <div className="font-medium">Develop a different approach</div>
                                          <div className="text-sm text-muted-foreground mt-0.5">
                                            Create a new variation with more substantial changes based on different hypotheses.
                                          </div>
                                        </div>
                                      </li>
                                    </>
                                  );
                                }
                              })()}
                            </ul>
                          </div>
                        </div>
                            </div>
                          </TabsContent>
                      </Tabs>
                </div>
              )}
            </div>
          </Card>
          
          <DataCleaningModal
            isOpen={cleaningModalOpen}
            onOpenChange={handleCleaningModalClosed}
            fileContent={currentFile || undefined}
            fileName={currentFile?.name}
            kpiName={currentKpiName}
            onAnalysisComplete={handleAnalysisComplete}
            usersPerVariation={usersPerVariation}
          />
        </motion.div>
      )}
    </>
  );
} 