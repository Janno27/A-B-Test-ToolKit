import { useState, useEffect } from 'react';
import riceService, { 
  RiceSettings, 
  ReachCategory, 
  ImpactKPI, 
  ConfidenceSource, 
  EffortSize,
  RiceWeights 
} from '../services/RiceService';

export function useSingleRiceSettings(id: string | null) {
  const [settings, setSettings] = useState<RiceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadSettings = async () => {
    if (!id) {
      setSettings(null);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const data = await riceService.getSettingsById(id);
      setSettings(data);
      setError(null);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, [id]);

  const updateSettings = async (updates: Partial<RiceSettings>) => {
    if (!id || !settings) throw new Error('No settings ID provided');
    
    try {
      const updated = await riceService.updateSettings(id, updates);
      setSettings(updated);
      return updated;
    } catch (err: any) {
      setError(err);
      throw err;
    }
  };

  // Update weights specifically (common operation)
  const updateWeights = async (weights: RiceWeights) => {
    if (!id || !settings) throw new Error('No settings ID provided');
    return updateSettings({ weights });
  };

  // Toggle feature flags
  const toggleCustomWeights = async (enabled: boolean) => {
    if (!id || !settings) throw new Error('No settings ID provided');
    return updateSettings({ customWeightsEnabled: enabled });
  };

  const toggleLocalMarketRule = async (enabled: boolean) => {
    if (!id || !settings) throw new Error('No settings ID provided');
    return updateSettings({ localMarketRuleEnabled: enabled });
  };

  // Reach Categories
  const addReachCategory = async (category: Omit<ReachCategory, 'id'>) => {
    if (!id || !settings) throw new Error('No settings ID provided');
    
    try {
      const newCategory = await riceService.addReachCategory(id, category);
      setSettings({
        ...settings,
        reachCategories: [...settings.reachCategories, newCategory]
      });
      return newCategory;
    } catch (err: any) {
      setError(err);
      throw err;
    }
  };

  const updateReachCategory = async (categoryId: string, updates: Partial<ReachCategory>) => {
    if (!id || !settings) throw new Error('No settings ID provided');
    
    try {
      const updated = await riceService.updateReachCategory(id, categoryId, updates);
      setSettings({
        ...settings,
        reachCategories: settings.reachCategories.map(cat => 
          cat.id === categoryId ? updated : cat
        )
      });
      return updated;
    } catch (err: any) {
      setError(err);
      throw err;
    }
  };

  const deleteReachCategory = async (categoryId: string) => {
    if (!id || !settings) throw new Error('No settings ID provided');
    
    try {
      const success = await riceService.deleteReachCategory(id, categoryId);
      
      if (success) {
        setSettings({
          ...settings,
          reachCategories: settings.reachCategories.filter(cat => cat.id !== categoryId)
        });
      }
      
      return success;
    } catch (err: any) {
      setError(err);
      throw err;
    }
  };

  // Impact KPIs
  const addImpactKPI = async (kpi: Omit<ImpactKPI, 'id'>) => {
    if (!id || !settings) throw new Error('No settings ID provided');
    
    try {
      const newKPI = await riceService.addImpactKPI(id, kpi);
      setSettings({
        ...settings,
        impactKPIs: [...settings.impactKPIs, newKPI]
      });
      return newKPI;
    } catch (err: any) {
      setError(err);
      throw err;
    }
  };

  const updateImpactKPI = async (kpiId: string, updates: Partial<ImpactKPI>) => {
    if (!id || !settings) throw new Error('No settings ID provided');
    
    try {
      const updated = await riceService.updateImpactKPI(id, kpiId, updates);
      setSettings({
        ...settings,
        impactKPIs: settings.impactKPIs.map(kpi => 
          kpi.id === kpiId ? updated : kpi
        )
      });
      return updated;
    } catch (err: any) {
      setError(err);
      throw err;
    }
  };

  const deleteImpactKPI = async (kpiId: string) => {
    if (!id || !settings) throw new Error('No settings ID provided');
    
    try {
      const success = await riceService.deleteImpactKPI(id, kpiId);
      
      if (success) {
        setSettings({
          ...settings,
          impactKPIs: settings.impactKPIs.filter(kpi => kpi.id !== kpiId)
        });
      }
      
      return success;
    } catch (err: any) {
      setError(err);
      throw err;
    }
  };

  // Confidence Sources
  const addConfidenceSource = async (source: Omit<ConfidenceSource, 'id'>) => {
    if (!id || !settings) throw new Error('No settings ID provided');
    
    try {
      const newSource = await riceService.addConfidenceSource(id, source);
      setSettings({
        ...settings,
        confidenceSources: [...settings.confidenceSources, newSource]
      });
      return newSource;
    } catch (err: any) {
      setError(err);
      throw err;
    }
  };

  const updateConfidenceSource = async (sourceId: string, updates: Partial<ConfidenceSource>) => {
    if (!id || !settings) throw new Error('No settings ID provided');
    
    try {
      const updated = await riceService.updateConfidenceSource(id, sourceId, updates);
      setSettings({
        ...settings,
        confidenceSources: settings.confidenceSources.map(source => 
          source.id === sourceId ? updated : source
        )
      });
      return updated;
    } catch (err: any) {
      setError(err);
      throw err;
    }
  };

  const deleteConfidenceSource = async (sourceId: string) => {
    if (!id || !settings) throw new Error('No settings ID provided');
    
    try {
      const success = await riceService.deleteConfidenceSource(id, sourceId);
      
      if (success) {
        setSettings({
          ...settings,
          confidenceSources: settings.confidenceSources.filter(source => source.id !== sourceId)
        });
      }
      
      return success;
    } catch (err: any) {
      setError(err);
      throw err;
    }
  };

  // Effort Sizes
  const addEffortSize = async (size: Omit<EffortSize, 'id'>) => {
    if (!id || !settings) throw new Error('No settings ID provided');
    
    try {
      const newSize = await riceService.addEffortSize(id, size);
      setSettings({
        ...settings,
        effortSizes: [...settings.effortSizes, newSize]
      });
      return newSize;
    } catch (err: any) {
      setError(err);
      throw err;
    }
  };

  const updateEffortSize = async (sizeId: string, updates: Partial<EffortSize>) => {
    if (!id || !settings) throw new Error('No settings ID provided');
    
    try {
      const updated = await riceService.updateEffortSize(id, sizeId, updates);
      setSettings({
        ...settings,
        effortSizes: settings.effortSizes.map(size => 
          size.id === sizeId ? updated : size
        )
      });
      return updated;
    } catch (err: any) {
      setError(err);
      throw err;
    }
  };

  const deleteEffortSize = async (sizeId: string) => {
    if (!id || !settings) throw new Error('No settings ID provided');
    
    try {
      const success = await riceService.deleteEffortSize(id, sizeId);
      
      if (success) {
        setSettings({
          ...settings,
          effortSizes: settings.effortSizes.filter(size => size.id !== sizeId)
        });
      }
      
      return success;
    } catch (err: any) {
      setError(err);
      throw err;
    }
  };

  return {
    settings,
    loading,
    error,
    reload: loadSettings,
    updateSettings,
    updateWeights,
    toggleCustomWeights,
    toggleLocalMarketRule,
    addReachCategory,
    updateReachCategory,
    deleteReachCategory,
    addImpactKPI,
    updateImpactKPI,
    deleteImpactKPI,
    addConfidenceSource,
    updateConfidenceSource,
    deleteConfidenceSource,
    addEffortSize,
    updateEffortSize,
    deleteEffortSize
  };
} 