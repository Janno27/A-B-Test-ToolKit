# Framework RICE - Documentation

## Introduction

Le framework RICE (Reach, Impact, Confidence, Effort) est un outil de priorisation utilisé pour évaluer et comparer différentes opportunités de test. Ce document décrit l'implémentation du framework RICE dans l'application, ses fonctionnalités et comment l'adapter à une base de données Supabase.

## Structure du Système

Le système RICE est composé de trois éléments principaux :

1. **RiceService** : Un service qui gère les opérations CRUD (Create, Read, Update, Delete) pour les paramètres RICE.
2. **Hooks React** : Des hooks personnalisés pour utiliser le service RICE dans les composants React.
3. **Interface Utilisateur** : Les composants permettant aux utilisateurs de configurer et gérer les paramètres RICE.

## Types de Données

### RiceWeights
```typescript
interface RiceWeights {
  reach: number;      // Poids pour la portée (%)
  impact: number;     // Poids pour l'impact (%)
  confidence: number; // Poids pour la confiance (%)
  effort: number;     // Poids pour l'effort (%)
}
```

### ReachCategory
```typescript
interface ReachCategory {
  id: string;         // Identifiant unique
  name: string;       // Nom de la catégorie
  minReach: number;   // Portée minimale (%)
  maxReach: number;   // Portée maximale (%)
  points: number;     // Points attribués
  example: string;    // Exemple de cas d'utilisation
}
```

### ImpactKPI
```typescript
interface ImpactKPI {
  id: string;         // Identifiant unique
  name: string;       // Nom du KPI
  minDelta: string;   // Variation minimale
  maxDelta: string;   // Variation maximale
  pointsPerUnit: string; // Points par unité
  example: string;    // Exemple de cas d'utilisation
}
```

### ConfidenceSource
```typescript
interface ConfidenceSource {
  id: string;         // Identifiant unique
  name: string;       // Nom de la source de confiance
  points: number;     // Points attribués
  example: string;    // Exemple de cas d'utilisation
}
```

### EffortSize
```typescript
interface EffortSize {
  id: string;         // Identifiant unique
  name: string;       // Nom de la taille (XS, S, M, L, XL)
  duration: string;   // Durée estimée
  devEffort: number;  // Effort de développement
  designEffort: number; // Effort de design
  example: string;    // Exemple de cas d'utilisation
}
```

### RiceSettings
```typescript
interface RiceSettings {
  id: string;                  // Identifiant unique
  name: string;                // Nom du paramétrage
  customWeightsEnabled: boolean; // Activation des poids personnalisés
  localMarketRuleEnabled: boolean; // Activation de la règle de marché local
  weights: RiceWeights;        // Poids pour chaque facteur
  reachCategories: ReachCategory[]; // Catégories de portée
  impactKPIs: ImpactKPI[];     // KPIs d'impact
  confidenceSources: ConfidenceSource[]; // Sources de confiance
  effortSizes: EffortSize[];   // Tailles d'effort
  createdAt: Date;             // Date de création
  updatedAt: Date;             // Date de dernière mise à jour
}
```

## Service RICE

Le `RiceService` est une couche d'abstraction qui gère les opérations CRUD sur les paramètres RICE. Il est actuellement implémenté pour utiliser le localStorage, mais il est conçu pour être facilement adapté à Supabase.

```typescript
class RiceService {
  // Opérations principales
  async getAllSettings(): Promise<RiceSettings[]>
  async getSettingsById(id: string): Promise<RiceSettings | null>
  async createSettings(settings: Omit<RiceSettings, 'id' | 'createdAt' | 'updatedAt'>): Promise<RiceSettings>
  async updateSettings(id: string, updates: Partial<RiceSettings>): Promise<RiceSettings>
  async deleteSettings(id: string): Promise<boolean>
  
  // Opérations pour Reach Categories
  async addReachCategory(settingsId: string, category: Omit<ReachCategory, 'id'>): Promise<ReachCategory>
  async updateReachCategory(settingsId: string, categoryId: string, updates: Partial<ReachCategory>): Promise<ReachCategory>
  async deleteReachCategory(settingsId: string, categoryId: string): Promise<boolean>
  
  // Opérations pour Impact KPIs
  async addImpactKPI(settingsId: string, kpi: Omit<ImpactKPI, 'id'>): Promise<ImpactKPI>
  async updateImpactKPI(settingsId: string, kpiId: string, updates: Partial<ImpactKPI>): Promise<ImpactKPI>
  async deleteImpactKPI(settingsId: string, kpiId: string): Promise<boolean>
  
  // Opérations pour Confidence Sources
  async addConfidenceSource(settingsId: string, source: Omit<ConfidenceSource, 'id'>): Promise<ConfidenceSource>
  async updateConfidenceSource(settingsId: string, sourceId: string, updates: Partial<ConfidenceSource>): Promise<ConfidenceSource>
  async deleteConfidenceSource(settingsId: string, sourceId: string): Promise<boolean>
  
  // Opérations pour Effort Sizes
  async addEffortSize(settingsId: string, size: Omit<EffortSize, 'id'>): Promise<EffortSize>
  async updateEffortSize(settingsId: string, sizeId: string, updates: Partial<EffortSize>): Promise<EffortSize>
  async deleteEffortSize(settingsId: string, sizeId: string): Promise<boolean>
}
```

## Hooks React

### useRiceSettings

Ce hook gère une liste de paramètres RICE et fournit des méthodes pour les manipuler.

```typescript
function useRiceSettings() {
  // État
  const [settings, setSettings] = useState<RiceSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Fonctions principales
  const reload = async () => {...}
  const createSettings = async (newSettings) => {...}
  const updateSettings = async (id, updates) => {...}
  const deleteSettings = async (id) => {...}
  
  // Opérations sur les sous-objets
  // ... méthodes pour manipuler reach, impact, confidence, effort
  
  return {
    settings,
    loading,
    error,
    reload,
    createSettings,
    updateSettings,
    deleteSettings,
    // ... autres méthodes
  };
}
```

### useSingleRiceSettings

Ce hook gère un seul paramètre RICE identifié par son ID.

```typescript
function useSingleRiceSettings(id: string | null) {
  // État
  const [settings, setSettings] = useState<RiceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Fonctions principales
  const reload = async () => {...}
  const updateSettings = async (updates) => {...}
  const updateWeights = async (weights) => {...}
  const toggleCustomWeights = async (enabled) => {...}
  const toggleLocalMarketRule = async (enabled) => {...}
  
  // Opérations sur les sous-objets
  // ... méthodes pour manipuler reach, impact, confidence, effort
  
  return {
    settings,
    loading,
    error,
    reload,
    updateSettings,
    updateWeights,
    toggleCustomWeights,
    toggleLocalMarketRule,
    // ... autres méthodes
  };
}
```

## Interface Utilisateur

L'interface utilisateur est composée de plusieurs composants interactifs:

### 1. Composants Modaux

Pour chaque type d'élément RICE, il existe un modal dédié pour l'ajout et la modification :

- `ReachCategoryModal` : pour gérer les catégories de portée (Reach)
- `ImpactKpiModal` : pour gérer les KPIs d'impact (Impact)
- `ConfidenceSourceModal` : pour gérer les sources de confiance (Confidence)
- `EffortSizeModal` : pour gérer les tailles d'effort (Effort)

### 2. Composant de Tableau

Le composant `RiceSettingsTable` permet d'afficher et d'éditer les différents facteurs RICE avec les fonctionnalités suivantes :

- Affichage des données dans un tableau
- Ajout d'une nouvelle entrée via un modal dédié
- Édition en ligne des cellules modifiables (au survol, un icône de crayon apparaît)
- Édition complète via un modal dédié
- Suppression d'entrées avec confirmation

Chaque type de facteur a ses propres champs modifiables :
- **Reach** : uniquement les points
- **Impact** : Min, Max et Points/unité (l'exemple se met à jour automatiquement)
- **Confidence** : uniquement les points
- **Effort** : Durée, Effort Dev et Effort Design

### 3. Boutons d'Action

- Les boutons d'ajout sont positionnés au-dessus des tableaux
- Le bouton de sauvegarde global est séparé pour éviter toute confusion

## Adaptation à Supabase

Pour adapter ce système à Supabase, il faut modifier le `RiceService` pour utiliser les API Supabase au lieu du localStorage.

### Étapes pour la migration vers Supabase

1. **Installation des dépendances Supabase**

```bash
npm install @supabase/supabase-js
```

2. **Création des tables dans Supabase**

```sql
-- Table principale
CREATE TABLE rice_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  custom_weights_enabled BOOLEAN DEFAULT FALSE,
  local_market_rule_enabled BOOLEAN DEFAULT TRUE,
  weights JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tables pour les sous-éléments
CREATE TABLE reach_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  settings_id UUID REFERENCES rice_settings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  min_reach NUMERIC NOT NULL,
  max_reach NUMERIC NOT NULL,
  points NUMERIC NOT NULL,
  example TEXT
);

CREATE TABLE impact_kpis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  settings_id UUID REFERENCES rice_settings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  min_delta TEXT NOT NULL,
  max_delta TEXT NOT NULL,
  points_per_unit TEXT NOT NULL,
  example TEXT
);

CREATE TABLE confidence_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  settings_id UUID REFERENCES rice_settings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  points NUMERIC NOT NULL,
  example TEXT
);

CREATE TABLE effort_sizes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  settings_id UUID REFERENCES rice_settings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration TEXT NOT NULL,
  dev_effort NUMERIC NOT NULL,
  design_effort NUMERIC NOT NULL,
  example TEXT
);
```

3. **Création d'un client Supabase**

```typescript
// supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

4. **Modification du RiceService**

```typescript
import { supabase } from './supabaseClient';

class RiceService {
  // ...méthodes existantes

  // Modification pour utiliser Supabase au lieu du localStorage
  async getAllSettings(): Promise<RiceSettings[]> {
    try {
      const { data, error } = await supabase
        .from('rice_settings')
        .select(`
          *,
          reach_categories(*),
          impact_kpis(*),
          confidence_sources(*),
          effort_sizes(*)
        `);
        
      if (error) throw error;
      
      // Mapper les données au format attendu par l'application
      return data.map(this.mapDbSettingsToApp);
    } catch (error) {
      console.error('Error fetching RICE settings:', error);
      return [];
    }
  }
  
  // Fonction utilitaire pour mapper les données
  private mapDbSettingsToApp(dbSettings): RiceSettings {
    return {
      id: dbSettings.id,
      name: dbSettings.name,
      customWeightsEnabled: dbSettings.custom_weights_enabled,
      localMarketRuleEnabled: dbSettings.local_market_rule_enabled,
      weights: dbSettings.weights,
      reachCategories: dbSettings.reach_categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        minReach: cat.min_reach,
        maxReach: cat.max_reach,
        points: cat.points,
        example: cat.example
      })),
      // Mapper les autres sous-objets de manière similaire
      createdAt: new Date(dbSettings.created_at),
      updatedAt: new Date(dbSettings.updated_at)
    };
  }
  
  // Similarement, adapter les autres méthodes
}
```

5. **Gestion des modifications locales et synchronisation**

Pour gérer efficacement les modifications locales et la synchronisation avec Supabase, nous avons implémenté l'approche suivante:

1. Les modifications de cellules individuelles sont stockées localement
2. Ces modifications ne sont envoyées à Supabase que lorsque l'utilisateur clique sur le bouton "Sauvegarder"
3. Une fonction `syncWithSupabase` est fournie pour synchroniser toutes les modifications locales

```typescript
// Dans un composant parent
const [pendingChanges, setPendingChanges] = useState<Map<string, any>>(new Map());

const handleCellEdit = (id: string, key: string, value: any) => {
  const newChanges = new Map(pendingChanges);
  
  if (!newChanges.has(id)) {
    newChanges.set(id, {});
  }
  
  const itemChanges = newChanges.get(id);
  itemChanges[key] = value;
  
  setPendingChanges(newChanges);
};

const syncWithSupabase = async () => {
  // Parcourir toutes les modifications en attente et les envoyer à Supabase
  for (const [id, changes] of pendingChanges.entries()) {
    await riceService.updateItem(id, changes);
  }
  
  // Vider les modifications en attente
  setPendingChanges(new Map());
};
```

## Intégration Future avec Supabase

Pour compléter l'intégration avec Supabase, les étapes suivantes seront nécessaires:

1. **Configuration de l'authentification** : Mettre en place l'authentification utilisateur pour sécuriser l'accès aux données.

2. **Gestion des permissions** : Configurer les RLS (Row Level Security) dans Supabase pour garantir que les utilisateurs n'accèdent qu'à leurs propres paramètres RICE.

3. **Synchronisation en temps réel** : Utiliser les fonctionnalités de temps réel de Supabase pour permettre aux utilisateurs de voir les modifications apportées par d'autres en temps réel.

4. **Gestion hors ligne** : Implémenter une solution pour gérer les modifications lorsque l'utilisateur est hors ligne.

## Bonnes Pratiques pour l'Utilisation

1. **Utiliser les hooks dans les composants** plutôt que d'appeler directement le service pour bénéficier de la réactivité de React.

2. **Gérer les erreurs** à tous les niveaux, du service aux composants.

3. **Implémenter des indicateurs de chargement** pour les opérations asynchrones.

4. **Ajouter la validation des données** avant de les envoyer au service.

5. **Établir une stratégie de mise en cache** pour minimiser les requêtes à la base de données.

6. **Regrouper les modifications** avant de les envoyer à Supabase pour réduire le nombre de requêtes.

## Conclusion

Cette implémentation du framework RICE fournit une base solide pour la priorisation des tests A/B. Elle est conçue pour être modulaire et facilement adaptable à différents backends, notamment Supabase. Les hooks React facilitent l'intégration dans les composants de l'interface utilisateur, tandis que le service d'abstraction permet de changer la couche de persistance sans affecter le reste de l'application.

L'interface utilisateur intuitive avec édition en ligne et confirmation des modifications globales offre une expérience utilisateur fluide et efficace. 