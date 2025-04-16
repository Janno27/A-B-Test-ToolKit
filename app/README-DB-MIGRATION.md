# Adaptation au schéma de base de données existant

Ce document décrit les modifications apportées pour adapter notre code à la structure de base de données existante (`000_initial_schema.sql`).

## Différences de schéma

Le schéma initial (`000_initial_schema.sql`) diffère de celui utilisé dans le code (`001_initial_schema.sql`) sur plusieurs points :

### 1. Noms des tables

| 000_initial_schema.sql (actuel) | 001_initial_schema.sql (précédent) |
|--------------------------------|----------------------------------|
| rice_settings | rice_settings |
| rice_reach_categories | reach_categories |
| rice_impact_kpis | impact_kpis |
| rice_confidence_sources | confidence_sources |
| rice_effort_sizes | effort_sizes |

### 2. Structure de la table `rice_settings`

**000_initial_schema.sql (actuel)** : 
- Utilise des colonnes individuelles pour les poids (reach_weight, impact_weight, confidence_weight, effort_weight)

**001_initial_schema.sql (précédent)** :
- Utilise une colonne JSONB pour stocker tous les poids (weights JSONB)

### 3. Structure de la table `rice_impact_kpis`

**000_initial_schema.sql (actuel)** :
- Inclut les colonnes `is_behavior_metric` et `parent_kpi_id` pour gérer la hiérarchie des KPIs
- Une seule table gère tous les KPIs, y compris les métriques de comportement

**001_initial_schema.sql (précédent)** :
- N'incluait pas ces colonnes
- Utilisait une table séparée `impact_metrics` pour les métriques liées aux KPIs

### 4. Structure des tables de votes

**000_initial_schema.sql (actuel)** :
- Utilise des références directes (ex: `category_id UUID REFERENCES rice_reach_categories(id)`)

**001_initial_schema.sql (précédent)** :
- Utilisait des identifiants TEXT (ex: `category_id TEXT NOT NULL`)

## Modifications apportées

### 1. Service `SupabaseRiceSettingsService`

- Mise à jour des noms de tables avec les préfixes `rice_`
- Adaptation des requêtes pour utiliser les colonnes de poids individuelles 
- Modification de la logique d'insertion et de mise à jour des KPIs pour gérer les métriques de comportement
- Suppression des opérations liées à la table `impact_metrics` qui n'existe plus
- Adaptation de la fonction de mappage pour convertir entre le format de la base de données et celui de l'application

### 2. Types et interfaces

Les interfaces du fichier `RiceServiceTypes.ts` étaient déjà en grande partie compatibles avec la structure actuelle :
- L'interface `ImpactKPI` inclut déjà les propriétés `isBehaviorMetric` et `parentKPI` 
- L'interface `RiceSettings` contient à la fois les poids individuels et la structure `weights` pour faciliter la manipulation côté client

## Compatibilité future

Pour maintenir la compatibilité à l'avenir :

1. Le service convertit automatiquement entre :
   - Les poids individuels en base de données (reach_weight, impact_weight...)
   - La structure `weights` utilisée dans l'application

2. La logique de gestion des KPIs d'impact a été adaptée pour :
   - Récupérer les KPIs comportementaux (liés au KPI parent "Behavior")
   - Créer/mettre à jour correctement la hiérarchie des KPIs

Ces modifications permettent d'utiliser le schéma de base de données actuel sans avoir à le modifier.

## Test et vérification

Pour tester que les modifications fonctionnent correctement avec le schéma actuel :

### 1. Vérifiez la configuration Supabase

Assurez-vous que votre fichier `.env.local` contient les informations correctes :

```
NEXT_PUBLIC_SUPABASE_URL=votre-url-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anon
NEXT_PUBLIC_USE_SUPABASE=true
```

### 2. Test des opérations CRUD

Lancez l'application et testez les fonctionnalités suivantes :

1. **Création** : Créez un nouveau paramètre RICE en remplissant le formulaire
   - Vérifiez dans la base de données que les données sont correctement enregistrées
   - Les poids doivent être stockés dans leurs colonnes respectives (reach_weight, impact_weight, etc.)
   - Les KPIs comportementaux doivent être liés au KPI parent "Behavior"

2. **Lecture** : Chargez la liste des paramètres RICE existants
   - Vérifiez que toutes les catégories de portée, KPIs, sources de confiance et tailles d'effort sont correctement affichées

3. **Mise à jour** : Modifiez un paramètre RICE existant
   - Ajoutez/modifiez/supprimez des catégories de portée
   - Ajoutez/modifiez/supprimez des KPIs, y compris des KPIs comportementaux
   - Vérifiez que les modifications sont correctement enregistrées dans la base de données

4. **Suppression** : Supprimez un paramètre RICE et vérifiez que toutes ses données associées sont également supprimées

### 3. Vérification de la hiérarchie des KPIs

Pour vérifier la gestion correcte des KPIs comportementaux :

1. Créez un KPI nommé "Behavior"
2. Ajoutez des KPIs enfants (comme "AddToCart", "PDP Access") en cochant l'option "isBehaviorMetric"
3. Vérifiez dans la base de données que :
   - `is_behavior_metric` est défini sur `true` pour les KPIs enfants
   - `parent_kpi_id` pointe vers l'ID du KPI "Behavior"

### 4. Vérification des votes

Pour tester la structure correcte des votes :

1. Créez une session RICE
2. Ajoutez des participants
3. Effectuez des votes (portée, impact, confiance, effort)
4. Vérifiez dans la base de données que les références entre les votes et les catégories/KPIs/sources sont correctes

En cas de problème, consultez les logs de la console du navigateur pour identifier les erreurs potentielles dans les requêtes Supabase. 