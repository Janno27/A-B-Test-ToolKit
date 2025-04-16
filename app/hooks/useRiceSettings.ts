import { useState, useEffect } from 'react';
import { 
  RiceSettings
} from '../services/RiceService';
import riceSettingsService from '../services/RiceSettingsService';
import supabaseRiceSettingsService from '../services/db/SupabaseRiceSettingsService';

// Déterminer quel service utiliser en fonction de la configuration
const settingsService = process.env.NEXT_PUBLIC_USE_SUPABASE === 'true' 
  ? supabaseRiceSettingsService 
  : riceSettingsService;

export function useRiceSettings() {
  const [settings, setSettings] = useState<RiceSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await settingsService.getAllSettings();
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
  }, []);

  const createSettings = async (newSettings: Omit<RiceSettings, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const created = await settingsService.createSettings(newSettings);
      setSettings(prev => [...prev, created]);
      return created;
    } catch (err: any) {
      setError(err);
      throw err;
    }
  };

  const updateSettings = async (id: string, updates: Partial<RiceSettings>) => {
    try {
      const updated = await settingsService.updateSettings(id, updates);
      setSettings(prev => prev.map(item => item.id === id ? updated : item));
      return updated;
    } catch (err: any) {
      setError(err);
      throw err;
    }
  };

  const deleteSettings = async (id: string) => {
    try {
      const success = await settingsService.deleteSettings(id);
      if (success) {
        setSettings(prev => prev.filter(item => item.id !== id));
      }
      return success;
    } catch (err: any) {
      setError(err);
      throw err;
    }
  };

  const refreshSettings = async () => {
    await loadSettings();
  };

  return {
    settings,
    loading,
    error,
    createSettings,
    updateSettings,
    deleteSettings,
    refreshSettings
  };
} 