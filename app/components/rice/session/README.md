# Documentation du système de priorisation RICE

## Vue d'ensemble

Le système de priorisation RICE est une méthode d'évaluation permettant de classer les fonctionnalités ou projets par ordre de priorité en se basant sur quatre facteurs clés :

- **R**each (Portée) : Nombre d'utilisateurs ou de clients impactés
- **I**mpact (Impact) : Amélioration apportée pour chaque utilisateur touché
- **C**onfidence (Confiance) : Degré de certitude dans les estimations
- **E**ffort (Effort) : Ressources nécessaires pour l'implémentation

## Formule RICE

La formule utilisée pour calculer le score RICE est :

```
Score RICE = (Reach × Impact × Confidence) ÷ Effort
```

## Méthode de calcul détaillée

### 1. Reach (Portée)

La portée est calculée en faisant la moyenne des votes des participants. Chaque participant vote pour une catégorie de portée, et chaque catégorie est associée à une valeur numérique. Plus la valeur est élevée, plus la portée est importante.

```javascript
// Calcul de Reach
const reachScore = totalValue / reachVotes.length;
```

### 2. Impact (Impact)

L'impact est calculé en suivant ces étapes :
1. Regroupement des votes par KPI (indicateur clé de performance)
2. Pour chaque KPI :
   - Calcul de la moyenne des valeurs attendues
   - Multiplication de cette moyenne par les points associés au KPI
3. Application d'une pondération selon la catégorie de KPI
4. Sommation des scores de tous les KPIs pondérés

#### Système de pondération des KPIs

Les KPIs sont regroupés en trois catégories principales, chacune ayant un coefficient de pondération spécifique :

- **CVR (Taux de conversion)** : Coefficient de 0.4 (40%)
- **Revenue (Chiffre d'affaires)** : Coefficient de 0.3 (30%)
- **Behavior (Comportement utilisateur)** : Coefficient de 0.3 (30%)

Cette pondération, spécifique à Emma Sleep, permet de donner plus d'importance aux métriques de conversion tout en valorisant également les impacts sur le chiffre d'affaires et le comportement des utilisateurs.

```javascript
// Calcul d'Impact avec pondération
// Coefficients de pondération par catégorie
const impactWeights = { cvr: 0.4, revenue: 0.3, behavior: 0.3 };

// Pour chaque KPI
const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length;
const kpiScore = avgValue * pointsPerUnit;

// Déterminer la catégorie du KPI (basé sur is_behavior_metric et autres attributs)
let category = kpi.is_behavior_metric ? 'behavior' : 
               (kpi.name.toLowerCase().includes('revenue') ? 'revenue' : 'cvr');

// Appliquer la pondération
const weightedKpiScore = kpiScore * impactWeights[category];

// Somme de tous les scores pondérés
impactScore = totalWeightedKpiScore;
```

La table `rice_impact_kpis` stocke les définitions des KPIs, avec notamment le champ `is_behavior_metric` qui permet d'identifier les métriques de comportement. Les KPIs liés au revenu sont identifiés par leur nom, et les autres sont considérés par défaut comme des métriques de conversion.

### 3. Confidence (Confiance)

La confiance est calculée comme suit :
1. Pour chaque participant, on additionne les points de toutes les sources de confiance sélectionnées
2. On calcule la moyenne des scores de tous les participants
3. On divise par 10 pour obtenir une valeur entre 0 et 1

```javascript
// Calcul de Confidence
// Pour chaque participant
participantPoints = somme des points de toutes les sources sélectionnées
// Moyenne entre participants
confidenceScore = moyenne des participantPoints / 10;
```

### 4. Effort (Effort)

L'effort est calculé en faisant la moyenne des efforts combinés (développement + design) de tous les votes :
1. Pour chaque vote :
   - Récupération des valeurs d'effort de développement et de design
   - Addition des deux valeurs pour obtenir l'effort total
2. Calcul de la moyenne de tous les votes

```javascript
// Calcul d'Effort
// Pour chaque vote
const voteEffort = devEffort + designEffort;
// Moyenne de tous les votes
effortScore = totalEffort / validVotes;
```

## Classification des priorités

La classification des priorités est basée sur le score RICE final et utilise les seuils suivants :

- **Haute priorité** (High Priority) : Score RICE ≥ 3.0
- **Priorité moyenne** (Medium Priority) : Score RICE entre 1.5 et 3.0
- **Faible priorité** (Low Priority) : Score RICE < 1.5

```javascript
// Détermination de la priorité
if (riceScore.rice >= 3) return "High Priority";
if (riceScore.rice >= 1.5) return "Medium Priority";
return "Low Priority";
```

Ces seuils ont été définis en fonction des meilleures pratiques et de l'expérience accumulée dans la priorisation des fonctionnalités. Ils permettent de distinguer rapidement les fonctionnalités à forte valeur ajoutée (score élevé) de celles à faible valeur ajoutée (score faible).

## Flux de travail complet

1. **Session de participants** : Les participants sont ajoutés à la session
2. **Votes de Reach** : Les participants votent pour les catégories de portée
3. **Votes d'Impact** : Les participants sélectionnent et évaluent les KPIs pertinents
4. **Votes de Confidence** : Les participants sélectionnent les sources de confiance
5. **Votes d'Effort** : Les participants évaluent l'effort de développement et de design
6. **Calcul du score RICE** : Le système calcule automatiquement le score RICE final
7. **Affichage des résultats** : Présentation du score final et de ses composantes avec la classification de priorité

## Stockage des données

Les votes et les résultats sont stockés dans la base de données Supabase dans les tables suivantes :
- `rice_sessions` : Informations sur la session
- `rice_participants` : Participants à la session
- `rice_reach_votes` : Votes de portée
- `rice_impact_votes` : Votes d'impact
- `rice_confidence_votes` : Votes de confiance
- `rice_effort_votes` : Votes d'effort
- `rice_results_summary` : Résumé des scores RICE calculés

### Structure de la table rice_impact_kpis

```sql
create table public.rice_impact_kpis (
  id uuid not null default extensions.uuid_generate_v4 (),
  settings_id uuid null,
  name text not null,
  min_delta text not null,
  max_delta text not null,
  points_per_unit text not null,
  example text null,
  is_behavior_metric boolean null default false,
  parent_kpi_id uuid null,
  created_at timestamp with time zone null default now(),
  constraint rice_impact_kpis_pkey primary key (id),
  constraint rice_impact_kpis_parent_kpi_id_fkey foreign KEY (parent_kpi_id) references rice_impact_kpis (id),
  constraint rice_impact_kpis_settings_id_fkey foreign KEY (settings_id) references rice_settings (id) on delete CASCADE
) TABLESPACE pg_default;
```

## Exemples

### Exemple de high priority
- Reach: 4.2 (Large audience)
- Impact: 3.5 (High impact per user)
- Confidence: 0.8 (High confidence)
- Effort: 1.2 (Relatively low effort)
- RICE Score: (4.2 × 3.5 × 0.8) ÷ 1.2 = 9.8 → High Priority

### Exemple de medium priority
- Reach: 2.5 (Medium audience)
- Impact: 2.0 (Medium impact)
- Confidence: 0.6 (Medium confidence)
- Effort: 2.0 (Medium effort)
- RICE Score: (2.5 × 2.0 × 0.6) ÷ 2.0 = 1.5 → Medium Priority

### Exemple de low priority
- Reach: 1.0 (Small audience)
- Impact: 2.0 (Medium impact)
- Confidence: 0.5 (Medium confidence)
- Effort: 3.5 (High effort)
- RICE Score: (1.0 × 2.0 × 0.5) ÷ 3.5 = 0.29 → Low Priority 