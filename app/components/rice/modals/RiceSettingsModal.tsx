"use client";

import { useState, useEffect, Fragment } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Target, Zap, Lightbulb, Clock, Calculator, Save, Loader2, RefreshCw } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RiceSettingsTable } from "../RiceSettingsTable";
import { v4 as uuidv4 } from "uuid";
import { 
  ReachCategory,
  ImpactKPI,
  ConfidenceSource,
  EffortSize,
  RiceSettings
} from '../../../types/RiceServiceTypes';
import { useRiceSettingsService } from '../../../hooks/useRiceSettingsService';
import { useToast } from '@/hooks/use-toast';

interface RiceSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings?: RiceSettings;
  onSave?: (settings: RiceSettings) => void;
}

export function RiceSettingsModal({ 
  open, 
  onOpenChange,
  settings,
  onSave
}: RiceSettingsModalProps) {
  const [activeTab, setActiveTab] = useState("global");
  const [customWeightsEnabled, setCustomWeightsEnabled] = useState(false);
  const [localMarketRuleEnabled, setLocalMarketRuleEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // État local des réglages RICE
  const [riceSettings, setRiceSettings] = useState<RiceSettings | null>(null);
  
  // Utiliser notre hook personnalisé pour le service RICE
  const { service, isLoading, error } = useRiceSettingsService();
  
  // Toast pour les notifications
  const { toast } = useToast();
  
  // Charger les paramètres par défaut depuis la base de données si aucun paramètre n'est fourni
  useEffect(() => {
    if (settings) {
      // Si des paramètres sont fournis, les utiliser
      setRiceSettings(settings);
      setCustomWeightsEnabled(settings.customWeightsEnabled);
      setLocalMarketRuleEnabled(settings.localMarketRuleEnabled);
      setWeights({
        reach: settings.reachWeight,
        impact: settings.impactWeight,
        confidence: settings.confidenceWeight,
        effort: settings.effortWeight
      });
    } else {
      // Charger les paramètres par défaut depuis la base de données
      const loadDefaultSettings = async () => {
        try {
          setIsCreating(true);
          // Tenter de récupérer les paramètres par défaut (ID fixe)
          const defaultId = '00000000-0000-0000-0000-000000000001';
          console.log('RiceSettingsModal: Tentative de récupération des paramètres par défaut', defaultId);
          let defaultSettings = await service?.getSettingsById(defaultId);
          console.log('RiceSettingsModal: Paramètres par défaut récupérés', defaultSettings);
          
          if (!defaultSettings) {
            // Si les paramètres par défaut n'existent pas, créer un nouveau jeu de paramètres
            toast({
              title: "Info",
              description: "Default settings not found. Creating new settings...",
              variant: "default"
            });
            
            // Créer les paramètres avec un nouvel ID généré
            const newSettings: Omit<RiceSettings, 'id' | 'createdAt' | 'updatedAt'> = {
              name: "New settings",
              customWeightsEnabled: false,
              localMarketRuleEnabled: true,
              reachWeight: 30,
              impactWeight: 30,
              confidenceWeight: 20,
              effortWeight: 20,
              weights: {
                reach: 30,
                impact: 30,
                confidence: 20,
                effort: 20
              },
              reachCategories: [],
              impactKPIs: [],
              confidenceSources: [],
              effortSizes: []
            };
            
            if (service) {
              console.log('RiceSettingsModal: Création de nouveaux paramètres');
              defaultSettings = await service.createSettings(newSettings);
              console.log('RiceSettingsModal: Nouveaux paramètres créés', defaultSettings);
            }
          }
          
          if (defaultSettings) {
            console.log('RiceSettingsModal: Mise à jour de l\'état local avec les paramètres', defaultSettings);
            setRiceSettings(defaultSettings);
            setCustomWeightsEnabled(defaultSettings.customWeightsEnabled);
            setLocalMarketRuleEnabled(defaultSettings.localMarketRuleEnabled);
            setWeights({
              reach: defaultSettings.reachWeight,
              impact: defaultSettings.impactWeight,
              confidence: defaultSettings.confidenceWeight,
              effort: defaultSettings.effortWeight
            });
          }
        } catch (err) {
          console.error("Error loading default settings:", err);
          toast({
            title: "Error",
            description: "Unable to load default settings",
            variant: "destructive"
          });
          
          // Créer un objet vide pour éviter les erreurs
      setRiceSettings({
        id: uuidv4(),
            name: "New settings",
        customWeightsEnabled: false,
        localMarketRuleEnabled: true,
        reachWeight: 30,
        impactWeight: 30,
        confidenceWeight: 20,
        effortWeight: 20,
            weights: {
              reach: 30,
              impact: 30,
              confidence: 20,
              effort: 20
            },
            reachCategories: [],
            impactKPIs: [],
            confidenceSources: [],
            effortSizes: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        } finally {
          setIsCreating(false);
        }
      };
      
      if (service) {
        loadDefaultSettings();
      }
    }
  }, [settings, service, toast]);
  
  const [weights, setWeights] = useState({
    reach: 30,
    impact: 30,
    confidence: 20,
    effort: 20
  });

  // Mettre à jour un poids spécifique
  const updateWeight = (key: keyof typeof weights, value: number) => {
    setWeights(prev => ({ ...prev, [key]: value }));
    
    // Mettre à jour l'état général des réglages RICE
    if (riceSettings) {
      const updatedSettings = { ...riceSettings };
      if (key === 'reach') updatedSettings.reachWeight = value;
      if (key === 'impact') updatedSettings.impactWeight = value;
      if (key === 'confidence') updatedSettings.confidenceWeight = value;
      if (key === 'effort') updatedSettings.effortWeight = value;
      setRiceSettings(updatedSettings);
    }
  };

  // Formuler l'équation RICE en fonction des paramètres
  const getRiceFormula = () => {
    if (customWeightsEnabled) {
      return `RICE = (${weights.reach/100}R × ${weights.impact/100}I × ${weights.confidence/100}C) ÷ ${weights.effort/100}E`;
    } else {
      return `RICE = (R × I × C) ÷ E`;
    }
  };

  // Obtenir la description de Reach en fonction de l'état du marché local
  const getReachDescription = () => {
    if (localMarketRuleEnabled) {
      return "Value: 0.3 to 1.0 based on reach matrix (x0.6 for local markets)";
    } else {
      return "Value: 0.3 to 1.0 based on reach matrix";
    }
  };
  
  // Gestionnaires pour les catégories de portée
  const handleAddReachCategory = (category: ReachCategory) => {
    if (!riceSettings) return;
    
    try {
    const updatedSettings = { 
      ...riceSettings,
      reachCategories: [...riceSettings.reachCategories, category],
      updatedAt: new Date().toISOString()
    };
    setRiceSettings(updatedSettings);
      
      toast({
        title: "Category added",
        description: "Reach category has been added locally",
        variant: "default"
      });
    } catch (err) {
      console.error("Erreur lors de l'ajout d'une catégorie:", err);
      toast({
        title: "Error",
        description: "An error occurred while adding the category",
        variant: "destructive"
      });
    }
  };
  
  const handleEditReachCategory = (id: string, category: ReachCategory) => {
    if (!riceSettings) return;
    const updatedCategories = riceSettings.reachCategories.map((item: ReachCategory) => 
      item.id === id ? category : item
    );
    const updatedSettings = {
      ...riceSettings,
      reachCategories: updatedCategories,
      updatedAt: new Date().toISOString()
    };
    setRiceSettings(updatedSettings);
  };
  
  const handleDeleteReachCategory = (id: string) => {
    if (!riceSettings) return;
    
    // Appeler le gestionnaire de suppression individuelle
    handleSingleItemDelete('reach', id);
  };
  
  // Gestionnaires pour les KPIs d'impact
  const handleAddImpactKPI = (kpi: ImpactKPI) => {
    if (!riceSettings) return;
    const updatedSettings = { 
      ...riceSettings,
      impactKPIs: [...riceSettings.impactKPIs, kpi],
      updatedAt: new Date().toISOString()
    };
    setRiceSettings(updatedSettings);
  };
  
  const handleEditImpactKPI = (id: string, kpi: ImpactKPI) => {
    if (!riceSettings) return;
    const updatedKPIs = riceSettings.impactKPIs.map((item: ImpactKPI) => 
      item.id === id ? kpi : item
    );
    const updatedSettings = {
      ...riceSettings,
      impactKPIs: updatedKPIs,
      updatedAt: new Date().toISOString()
    };
    setRiceSettings(updatedSettings);
  };
  
  const handleDeleteImpactKPI = (id: string) => {
    if (!riceSettings) return;
    
    // Appeler le gestionnaire de suppression individuelle
    handleSingleItemDelete('impact', id);
  };
  
  // Gestionnaires pour les sources de confiance
  const handleAddConfidenceSource = (source: ConfidenceSource) => {
    if (!riceSettings) return;
    const updatedSettings = { 
      ...riceSettings,
      confidenceSources: [...riceSettings.confidenceSources, source],
      updatedAt: new Date().toISOString()
    };
    setRiceSettings(updatedSettings);
  };
  
  const handleEditConfidenceSource = (id: string, source: ConfidenceSource) => {
    if (!riceSettings) return;
    const updatedSources = riceSettings.confidenceSources.map((item: ConfidenceSource) => 
      item.id === id ? source : item
    );
    const updatedSettings = {
      ...riceSettings,
      confidenceSources: updatedSources,
      updatedAt: new Date().toISOString()
    };
    setRiceSettings(updatedSettings);
  };
  
  const handleDeleteConfidenceSource = (id: string) => {
    if (!riceSettings) return;
    
    // Appeler le gestionnaire de suppression individuelle  
    handleSingleItemDelete('confidence', id);
  };
  
  // Gestionnaires pour les tailles d'effort
  const handleAddEffortSize = (size: EffortSize) => {
    if (!riceSettings) return;
    const updatedSettings = { 
      ...riceSettings,
      effortSizes: [...riceSettings.effortSizes, size],
      updatedAt: new Date().toISOString()
    };
    setRiceSettings(updatedSettings);
  };
  
  const handleEditEffortSize = (id: string, size: EffortSize) => {
    if (!riceSettings) return;
    const updatedSizes = riceSettings.effortSizes.map((item: EffortSize) => 
      item.id === id ? size : item
    );
    const updatedSettings = {
      ...riceSettings,
      effortSizes: updatedSizes,
      updatedAt: new Date().toISOString()
    };
    setRiceSettings(updatedSettings);
  };
  
  const handleDeleteEffortSize = (id: string) => {
    if (!riceSettings) return;
    
    // Appeler le gestionnaire de suppression individuelle
    handleSingleItemDelete('effort', id);
  };
  
  // Gestionnaire pour mettre à jour les règles spéciales
  const handleToggleCustomWeights = () => {
    const newValue = !customWeightsEnabled;
    setCustomWeightsEnabled(newValue);
    if (riceSettings) {
      setRiceSettings({
        ...riceSettings,
        customWeightsEnabled: newValue,
        updatedAt: new Date().toISOString()
      });
    }
  };
  
  const handleToggleLocalMarketRule = () => {
    const newValue = !localMarketRuleEnabled;
    setLocalMarketRuleEnabled(newValue);
    if (riceSettings) {
      setRiceSettings({
        ...riceSettings,
        localMarketRuleEnabled: newValue,
        updatedAt: new Date().toISOString()
      });
    }
  };
  
  // Gestionnaire pour sauvegarder les réglages
  const handleSaveSettings = async () => {
    if (!riceSettings || !service) return;
    
    try {
      setIsSaving(true);
      console.log('Sauvegarde des paramètres RICE:', riceSettings);
      
      // Assurons-nous que toutes les propriétés nécessaires sont présentes
      const completeSettings = {
        ...riceSettings,
        updatedAt: new Date().toISOString(),
        // Assurons-nous que les poids sont bien définis
        reachWeight: weights.reach,
        impactWeight: weights.impact,
        confidenceWeight: weights.confidence,
        effortWeight: weights.effort,
        // État des règles spéciales
        customWeightsEnabled: customWeightsEnabled,
        localMarketRuleEnabled: localMarketRuleEnabled,
        // S'assurer que la structure weights est bien définie pour Supabase
        weights: {
          reach: weights.reach,
          impact: weights.impact,
          confidence: weights.confidence,
          effort: weights.effort
        }
      };
      
      // Si nous avons un ID, c'est une mise à jour, sinon c'est une création
      let savedSettings;
      if (completeSettings.id) {
        savedSettings = await service.updateSettings(completeSettings.id, completeSettings);
        toast({
          title: "Settings updated",
          description: "RICE settings have been successfully updated",
          variant: "default"
        });
      } else {
        savedSettings = await service.createSettings(completeSettings);
        toast({
          title: "Settings created",
          description: "New RICE settings have been successfully created",
          variant: "default"
        });
      }
      
      // Mettre à jour l'état local avec les paramètres sauvegardés
      setRiceSettings(savedSettings);
      
      // Envoyer les paramètres mis à jour à la fonction de rappel
      if (onSave) {
        onSave(savedSettings);
      }
      
      // Ne plus fermer la modale
      // onOpenChange(false);
    } catch (err) {
      console.error("Erreur lors de la sauvegarde des paramètres RICE:", err);
      toast({
        title: "Error",
        description: "An error occurred while saving the settings",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Helper function to get Impact formula based on behavior metrics presence
  const getImpactFormula = () => {
    if (!riceSettings) return "I = (0.4 × ΔCVR) + (0.6 × ΔRevenue)";
    
    // Check if any behavior metrics exist
    const hasBehaviorMetrics = riceSettings.impactKPIs.some((kpi: ImpactKPI) => kpi.isBehaviorMetric);
    
    return hasBehaviorMetrics 
      ? "I = (0.4 × ΔCVR) + (0.3 × ΔRevenue) + (0.3 × ΔBehavior)"
      : "I = (0.4 × ΔCVR) + (0.6 × ΔRevenue)";
  };

  // Helper function to get behavior metrics
  const getBehaviorSubMetrics = () => {
    if (!riceSettings) return [];
    return riceSettings.impactKPIs.filter((kpi: ImpactKPI) => kpi.isBehaviorMetric);
  };

  // Gestionnaire pour les modifications d'éléments individuels
  const handleSingleItemUpdate = async (type: string, id: string, key: string, value: any) => {
    if (!riceSettings || !service) return;
    
    console.log('Modification envoyée pour sauvegarde:', { type, id, key, value });
    
    try {
      setIsSaving(true);
      
      // Créer l'objet de mise à jour avec l'élément individuel
      const update = {
        id: riceSettings.id,
        updateSingleItem: {
          type: type as 'reach' | 'impact' | 'confidence' | 'effort',
          itemId: id,
          key: key,
          value: value
        }
      };
      
      // Mettre à jour l'élément individuellement dans Supabase
      await service.updateSettings(riceSettings.id, update);
      
      // Mise à jour réussie
      toast({
        title: "Change saved",
        description: "Your change was successfully saved",
        variant: "default"
      });
      
      // Mettre à jour aussi l'état local
      const updatedSettings = { ...riceSettings };
      
      if (type === 'reach') {
        updatedSettings.reachCategories = updatedSettings.reachCategories.map(cat => 
          cat.id === id ? { ...cat, [key]: value } : cat
        );
      } else if (type === 'impact') {
        updatedSettings.impactKPIs = updatedSettings.impactKPIs.map(kpi => 
          kpi.id === id ? { ...kpi, [key]: value } : kpi
        );
      } else if (type === 'confidence') {
        updatedSettings.confidenceSources = updatedSettings.confidenceSources.map(source => 
          source.id === id ? { ...source, [key]: value } : source
        );
      } else if (type === 'effort') {
        updatedSettings.effortSizes = updatedSettings.effortSizes.map(size => 
          size.id === id ? { ...size, [key]: value } : size
        );
      }
      
      setRiceSettings(updatedSettings);
      
    } catch (err) {
      console.error("Erreur lors de la sauvegarde des paramètres RICE:", err);
      toast({
        title: "Error",
        description: "An error occurred while saving the change",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Fonction pour rafraîchir les données depuis Supabase
  const refreshSettingsFromDatabase = async () => {
    if (!riceSettings || !service) return;
    
    try {
      console.log('RiceSettingsModal: Rafraîchissement des paramètres depuis la base de données', riceSettings.id);
      const refreshedSettings = await service.getSettingsById(riceSettings.id);
      
      if (refreshedSettings) {
        console.log('RiceSettingsModal: Paramètres rafraîchis', {
          reachCategoriesCount: refreshedSettings.reachCategories.length,
          impactKPIsCount: refreshedSettings.impactKPIs.length,
          confidenceSourcesCount: refreshedSettings.confidenceSources.length,
          effortSizesCount: refreshedSettings.effortSizes.length
        });
        
        setRiceSettings(refreshedSettings);
        setCustomWeightsEnabled(refreshedSettings.customWeightsEnabled);
        setLocalMarketRuleEnabled(refreshedSettings.localMarketRuleEnabled);
        setWeights({
          reach: refreshedSettings.reachWeight,
          impact: refreshedSettings.impactWeight,
          confidence: refreshedSettings.confidenceWeight,
          effort: refreshedSettings.effortWeight
        });
        
        toast({
          title: "Settings refreshed",
          description: "Settings have been refreshed from the database",
          variant: "default"
        });
      } else {
        console.error('RiceSettingsModal: Impossible de rafraîchir les paramètres - ID non trouvé', riceSettings.id);
        toast({
          title: "Error",
          description: "Failed to refresh settings - ID not found",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('RiceSettingsModal: Erreur lors du rafraîchissement des paramètres', error);
      toast({
        title: "Error",
        description: "An error occurred while refreshing settings",
        variant: "destructive"
      });
    }
  };

  // Gestionnaire pour les suppressions d'éléments individuels
  const handleSingleItemDelete = async (type: string, id: string) => {
    if (!riceSettings || !service) return;
    
    console.log('RiceSettingsModal: handleSingleItemDelete appelé', { type, id });
    
    try {
      setIsSaving(true);
      
      // Vérifier si l'élément existe avant de le supprimer
      let elementExists = false;
      if (type === 'reach') {
        elementExists = riceSettings.reachCategories.some(cat => cat.id === id);
      } else if (type === 'impact') {
        elementExists = riceSettings.impactKPIs.some(kpi => kpi.id === id);
      } else if (type === 'confidence') {
        elementExists = riceSettings.confidenceSources.some(source => source.id === id);
      } else if (type === 'effort') {
        elementExists = riceSettings.effortSizes.some(size => size.id === id);
      }
      
      console.log('RiceSettingsModal: Élément existe?', elementExists);
      
      if (!elementExists) {
        console.warn(`RiceSettingsModal: Tentative de suppression d'un élément inexistant: ${type} ${id}`);
        toast({
          title: "Warning",
          description: "The item you are trying to delete does not exist",
          variant: "destructive"
        });
        return;
      }
      
      // Créer l'objet de suppression avec le type et l'ID de l'élément
      const update = {
        id: riceSettings.id,
        deleteSingleItem: {
          type: type as 'reach' | 'impact' | 'confidence' | 'effort',
          itemId: id
        }
      };
      
      console.log('RiceSettingsModal: Envoi de la suppression à Supabase', update);
      
      // Supprimer l'élément individuellement dans Supabase
      await service.updateSettings(riceSettings.id, update);
      
      // Suppression réussie
      toast({
        title: "Item deleted",
        description: "The item has been successfully deleted",
        variant: "default"
      });
      
      // Pour s'assurer que les données sont correctement mises à jour, rafraîchir depuis la base de données
      await refreshSettingsFromDatabase();
      
    } catch (err) {
      console.error("Erreur lors de la suppression:", err);
      toast({
        title: "Error",
        description: "An error occurred while deleting the item",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Gestionnaires pour les modifications dans les tables
  const handleReachCategoryEdit = (id: string, item: ReachCategory) => {
    if (!riceSettings) return;
    
    const updatedCategories = riceSettings.reachCategories.map(cat => 
      cat.id === id ? item : cat
    );
    
    const updatedSettings = {
      ...riceSettings,
      reachCategories: updatedCategories
    };
    
    setRiceSettings(updatedSettings);
    
    // Envoyer la mise à jour directement à Supabase si nous avons un ID de paramètre
    if (riceSettings.id && id && item) {
      // Trouver la propriété qui a changé
      const originalItem = riceSettings.reachCategories.find(c => c.id === id);
      if (originalItem) {
        const changedKey = Object.keys(item).find(key => 
          item[key as keyof ReachCategory] !== originalItem[key as keyof ReachCategory]
        );
        
        if (changedKey) {
          handleSingleItemUpdate(
            'reach', 
            id,
            changedKey,
            item[changedKey as keyof ReachCategory]
          );
        }
      }
    }
  };

  const handleImpactKpiEdit = (id: string, item: ImpactKPI) => {
    if (!riceSettings) return;
    
    const updatedKpis = riceSettings.impactKPIs.map(kpi => 
      kpi.id === id ? item : kpi
    );
    
    const updatedSettings = {
      ...riceSettings,
      impactKPIs: updatedKpis
    };
    
    setRiceSettings(updatedSettings);
    
    // Envoyer la mise à jour directement à Supabase si nous avons un ID de paramètre
    if (riceSettings.id && id && item) {
      // Trouver la propriété qui a changé
      const originalItem = riceSettings.impactKPIs.find(k => k.id === id);
      if (originalItem) {
        const changedKey = Object.keys(item).find(key => 
          item[key as keyof ImpactKPI] !== originalItem[key as keyof ImpactKPI]
        );
        
        if (changedKey) {
          handleSingleItemUpdate(
            'impact', 
            id,
            changedKey,
            item[changedKey as keyof ImpactKPI]
          );
        }
      }
    }
  };

  const handleConfidenceSourceEdit = (id: string, item: ConfidenceSource) => {
    if (!riceSettings) return;
    
    const updatedSources = riceSettings.confidenceSources.map(source => 
      source.id === id ? item : source
    );
    
    const updatedSettings = {
      ...riceSettings,
      confidenceSources: updatedSources
    };
    
    setRiceSettings(updatedSettings);
    
    // Envoyer la mise à jour directement à Supabase si nous avons un ID de paramètre
    if (riceSettings.id && id && item) {
      // Trouver la propriété qui a changé
      const originalItem = riceSettings.confidenceSources.find(s => s.id === id);
      if (originalItem) {
        const changedKey = Object.keys(item).find(key => 
          item[key as keyof ConfidenceSource] !== originalItem[key as keyof ConfidenceSource]
        );
        
        if (changedKey) {
          handleSingleItemUpdate(
            'confidence', 
            id,
            changedKey,
            item[changedKey as keyof ConfidenceSource]
          );
        }
      }
    }
  };

  const handleEffortSizeEdit = (id: string, item: EffortSize) => {
    if (!riceSettings) return;
    
    const updatedSizes = riceSettings.effortSizes.map(size => 
      size.id === id ? item : size
    );
    
    const updatedSettings = {
      ...riceSettings,
      effortSizes: updatedSizes
    };
    
    setRiceSettings(updatedSettings);
    
    // Envoyer la mise à jour directement à Supabase si nous avons un ID de paramètre
    if (riceSettings.id && id && item) {
      // Trouver la propriété qui a changé
      const originalItem = riceSettings.effortSizes.find(s => s.id === id);
      if (originalItem) {
        const changedKey = Object.keys(item).find(key => 
          item[key as keyof EffortSize] !== originalItem[key as keyof EffortSize]
        );
        
        if (changedKey) {
          handleSingleItemUpdate(
            'effort', 
            id,
            changedKey,
            item[changedKey as keyof EffortSize]
          );
        }
      }
    }
  };

  if (!riceSettings) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-medium">RICE Framework Settings</DialogTitle>
        </DialogHeader>
        
        {isLoading || isCreating ? (
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <p>Loading settings...</p>
          </div>
        ) : error ? (
          <div className="text-red-500 p-6 text-center">
            An error occurred while loading settings
          </div>
        ) : riceSettings ? (
          <>
        <Tabs defaultValue="global" value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="w-full grid grid-cols-6 mb-8">
            <TabsTrigger value="global">Global</TabsTrigger>
            <TabsTrigger value="reach">Reach</TabsTrigger>
            <TabsTrigger value="impact">Impact</TabsTrigger>
            <TabsTrigger value="confidence">Confidence</TabsTrigger>
            <TabsTrigger value="effort">Effort</TabsTrigger>
            <TabsTrigger value="formula">Formula</TabsTrigger>
          </TabsList>
          
          <TabsContent value="global" className="space-y-6">
            <div className="text-sm text-muted-foreground">
              Configure the global settings for the RICE prioritization framework.
            </div>
            
            <div className="space-y-6">
              <div className="pt-0">
                <h3 className="text-sm font-medium mb-4">Special Rules</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="customWeightsRule"
                      className="rounded border-[0.5px] border-border/40"
                      checked={customWeightsEnabled}
                      onChange={handleToggleCustomWeights}
                    />
                    <Label htmlFor="customWeightsRule" className="text-xs">
                      Enable custom weights distribution
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="localMarketRule"
                      className="rounded border-[0.5px] border-border/40"
                      checked={localMarketRuleEnabled}
                      onChange={handleToggleLocalMarketRule}
                    />
                    <Label htmlFor="localMarketRule" className="text-xs">
                      Local market tests have a x0.6 coefficient applied to the final R score
                    </Label>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-4">Weights Distribution</h3>
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label className="flex justify-between text-xs">
                      Reach
                      <span className="text-xs text-muted-foreground">{weights.reach}%</span>
                    </Label>
                    <Slider 
                      value={[weights.reach]} 
                      max={100} 
                      step={5}
                      disabled={!customWeightsEnabled}
                      onValueChange={(value) => updateWeight('reach', value[0])}
                      className={!customWeightsEnabled ? "opacity-50" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex justify-between text-xs">
                      Impact
                      <span className="text-xs text-muted-foreground">{weights.impact}%</span>
                    </Label>
                    <Slider 
                      value={[weights.impact]} 
                      max={100} 
                      step={5}
                      disabled={!customWeightsEnabled}
                      onValueChange={(value) => updateWeight('impact', value[0])}
                      className={!customWeightsEnabled ? "opacity-50" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex justify-between text-xs">
                      Confidence
                      <span className="text-xs text-muted-foreground">{weights.confidence}%</span>
                    </Label>
                    <Slider 
                      value={[weights.confidence]} 
                      max={100} 
                      step={5}
                      disabled={!customWeightsEnabled}
                      onValueChange={(value) => updateWeight('confidence', value[0])}
                      className={!customWeightsEnabled ? "opacity-50" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex justify-between text-xs">
                      Effort
                      <span className="text-xs text-muted-foreground">{weights.effort}%</span>
                    </Label>
                    <Slider 
                      value={[weights.effort]} 
                      max={100} 
                      step={5}
                      disabled={!customWeightsEnabled}
                      onValueChange={(value) => updateWeight('effort', value[0])}
                      className={!customWeightsEnabled ? "opacity-50" : ""}
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="reach" className="space-y-6">
            <div className="text-sm text-muted-foreground mb-4">
              <p>Reach represents the percentage of users impacted by the test.</p>
            </div>
            
                {riceSettings && (
                  <>
            <RiceSettingsTable
              title="Reach Categories"
              description="Define categories for user reach values"
              items={riceSettings.reachCategories}
              onAdd={handleAddReachCategory}
                      onEdit={handleReachCategoryEdit}
              onDelete={handleDeleteReachCategory}
              type="reach"
            />
            
            {localMarketRuleEnabled && (
              <div className="bg-muted/20 p-3 rounded-md mt-2">
                <h3 className="text-xs font-medium mb-1">Special Rule</h3>
                <div className="text-xs text-muted-foreground">
                  Local market tests have a x0.6 coefficient applied to the final R score.
                </div>
              </div>
                    )}
                  </>
            )}
          </TabsContent>
          
          <TabsContent value="impact" className="space-y-6">
            <div className="text-sm text-muted-foreground mb-4">
              <p>Impact formula: {getImpactFormula()}</p>
            </div>
            
                {riceSettings && (
            <RiceSettingsTable
              title="Impact KPIs"
              description="Define metrics for measuring impact, including behavior sub-metrics"
              items={riceSettings.impactKPIs}
              onAdd={handleAddImpactKPI}
                    onEdit={handleImpactKpiEdit}
              onDelete={handleDeleteImpactKPI}
              type="impact"
            />
                )}
          </TabsContent>
          
          <TabsContent value="confidence" className="space-y-6">
            <div className="text-sm text-muted-foreground mb-4">
              <p>Confidence represents the certainty in your estimates based on proof sources.</p>
            </div>
            
            <RiceSettingsTable
              title="Confidence Sources"
              description="Define sources of evidence and their point values"
              items={riceSettings.confidenceSources}
              onAdd={handleAddConfidenceSource}
                  onEdit={handleConfidenceSourceEdit}
              onDelete={handleDeleteConfidenceSource}
              type="confidence"
            />
            
            <div className="bg-muted/20 p-3 rounded-md">
              <p className="text-xs font-medium mb-1">Special Rules:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li className="text-xs text-muted-foreground">Capped at 5 points total</li>
                <li className="text-xs text-muted-foreground">Minimum threshold of 3 points</li>
              </ul>
            </div>
          </TabsContent>
          
          <TabsContent value="effort" className="space-y-6">
            <div className="text-sm text-muted-foreground mb-4">
              <p>Effort is measured using the T-shirt sizing system that combines development and design time.</p>
            </div>
            
            <RiceSettingsTable
              title="Effort Sizes"
              description="Define effort levels using T-shirt sizes"
              items={riceSettings.effortSizes}
              onAdd={handleAddEffortSize}
              onEdit={handleEditEffortSize}
              onDelete={handleDeleteEffortSize}
              type="effort"
            />
          </TabsContent>
          
          <TabsContent value="formula" className="space-y-6">
            <div className="text-sm text-muted-foreground mb-4">
              <p>The RICE prioritization framework helps quantify and compare different test opportunities.</p>
            </div>
            
            <div className="space-y-5">
              <h3 className="text-sm font-medium">RICE Formula</h3>
              
              <div className="bg-muted/20 p-4 rounded-md">
                <p className="text-xs font-medium mb-2">Standard Formula:</p>
                <div className="font-mono text-sm text-center my-3">
                  RICE Score = (Reach × Impact × Confidence) ÷ Effort
                </div>
                <div className="font-mono text-sm text-center mb-3">
                  {getRiceFormula()}
                </div>
                {customWeightsEnabled && (
                  <div className="text-xs text-center text-muted-foreground mt-1">
                    Using custom weights: Reach ({weights.reach}%), Impact ({weights.impact}%), 
                    Confidence ({weights.confidence}%), Effort ({weights.effort}%)
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/10 p-3 rounded-md">
                  <h4 className="text-xs font-medium mb-1">Reach (R)</h4>
                  <p className="text-xs text-muted-foreground">
                    Percentage of users impacted by the test.
                  </p>
                  <p className="text-xs mt-1">
                    {getReachDescription()}
                  </p>
                </div>
                
                <div className="bg-muted/10 p-3 rounded-md">
                  <h4 className="text-xs font-medium mb-1">Impact (I)</h4>
                  <p className="text-xs text-muted-foreground">
                    The effect on key metrics if the test succeeds.
                  </p>
                  <p className="text-xs mt-1">
                    Value: 0.5 to 8+ based on impact formula
                  </p>
                </div>
                
                <div className="bg-muted/10 p-3 rounded-md">
                  <h4 className="text-xs font-medium mb-1">Confidence (C)</h4>
                  <p className="text-xs text-muted-foreground">
                    How sure we are about the estimated impact.
                  </p>
                  <p className="text-xs mt-1">
                    Value: 3.0 to 5.0 based on proof sources
                  </p>
                </div>
                
                <div className="bg-muted/10 p-3 rounded-md">
                  <h4 className="text-xs font-medium mb-1">Effort (E)</h4>
                  <p className="text-xs text-muted-foreground">
                    The resources required to implement the test.
                  </p>
                  <p className="text-xs mt-1">
                    Value: 0.5 to 2.7 based on dev + design effort
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
              {/* Pas de boutons */}
        </DialogFooter>
          </>
        ) : (
          <div className="p-6 text-center">
            No settings available
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 