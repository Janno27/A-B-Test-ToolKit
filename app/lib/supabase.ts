import { createClient } from '@supabase/supabase-js';

// Vérifier que les variables d'environnement sont définies
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Les variables d\'environnement Supabase ne sont pas complètes:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '[MASQUÉ]' : 'manquant');
  // Ne pas throw d'erreur, pour permettre l'exécution même si l'API est down ou mal configurée
  // throw new Error('Les variables d\'environnement Supabase ne sont pas définies. Vérifiez votre fichier .env.local');
}

// Créer et exporter le client Supabase
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

console.log('Supabase client initialized:', supabase ? 'SUCCESS' : 'FAILED'); 