import { useState, useEffect } from 'react';
import { RiceService } from '../services/RiceService';
import { SupabaseRiceSettingsService } from '../services/db/SupabaseRiceSettingsService';
import { RiceServiceInterface } from '../types/RiceServiceTypes';

// Hook personnalisé pour accéder au service RiceSettings approprié
export function useRiceSettingsService() {
  const [service, setService] = useState<RiceServiceInterface | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initService = async () => {
      try {
        // Vérifier si Supabase doit être utilisé
        const useSupabase = process.env.NEXT_PUBLIC_USE_SUPABASE === 'true';
        
        if (useSupabase) {
          console.log('Utilisation de Supabase comme source de données');
          setService(new SupabaseRiceSettingsService());
        } else {
          console.log('Utilisation de localStorage comme source de données');
          setService(new RiceService());
        }
      } catch (err) {
        console.error('Erreur lors de l\'initialisation du service:', err);
        setError(err instanceof Error ? err : new Error('Erreur inconnue'));
      } finally {
        setIsLoading(false);
      }
    };

    initService();
  }, []);

  return { service, isLoading, error };
} 