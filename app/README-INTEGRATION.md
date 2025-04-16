# Intégration de Supabase dans le composant RiceSettingsModal

Ce document décrit l'intégration de Supabase dans le composant RiceSettingsModal pour sauvegarder les paramètres RICE dans une base de données.

## Structure de l'intégration

1. **Types** (`app/types/RiceServiceTypes.ts`) :
   - Définition des interfaces pour les modèles de données (RiceSettings, ReachCategory, etc.)
   - Interface RiceServiceInterface pour standardiser les services

2. **Services** :
   - `app/services/RiceService.ts` : Service utilisant localStorage
   - `app/services/db/SupabaseRiceSettingsService.ts` : Service utilisant Supabase

3. **Hook personnalisé** (`app/hooks/useRiceSettingsService.ts`) :
   - Détecte automatiquement si Supabase doit être utilisé (basé sur la variable d'environnement `NEXT_PUBLIC_USE_SUPABASE`)
   - Retourne le service approprié

4. **Composant RiceSettingsModal** :
   - Utilise le hook `useRiceSettingsService` pour accéder au service
   - Utilise le hook `useToast` pour les notifications visuelles
   - Gère les états de chargement et d'erreur

## Fonctionnement

Le composant RiceSettingsModal permet de :

1. **Créer** de nouveaux paramètres RICE 
2. **Modifier** des paramètres existants
3. **Ajouter/modifier/supprimer** des catégories de portée, KPIs d'impact, etc.

Toutes les modifications sont d'abord effectuées localement (dans l'état du composant), puis envoyées à la base de données lors de la sauvegarde (bouton "Sauvegarder").

## Notifications Toast

Le composant utilise le système de notifications toast pour informer l'utilisateur :
- Lors de l'ajout/modification/suppression d'éléments localement
- Après la sauvegarde réussie des paramètres
- En cas d'erreur

## Configuration

Pour utiliser Supabase, assurez-vous de configurer les variables d'environnement dans `.env.local` :

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_USE_SUPABASE=true
```

Pour utiliser localStorage à la place, définissez :

```
NEXT_PUBLIC_USE_SUPABASE=false
```

## Migration des données

Pour migrer des données existantes de localStorage vers Supabase, suivez les instructions dans le fichier `README-SUPABASE.md`. 