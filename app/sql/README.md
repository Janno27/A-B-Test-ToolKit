# Base de données RICE

Ce répertoire contient les scripts SQL nécessaires pour initialiser et gérer la base de données du framework RICE.

## Structure des tables

La base de données est organisée en deux parties principales :

1. **Tables de paramètres** (dans `reset_db.sql`) :
   - `rice_settings` : Paramètres généraux du framework RICE
   - `rice_reach_categories` : Catégories de portée
   - `rice_impact_kpis` : KPIs d'impact (incluant les métriques de comportement)
   - `rice_confidence_sources` : Sources de confiance
   - `rice_effort_sizes` : Tailles d'effort

2. **Tables de sessions** (dans `sessions_tables.sql`) :
   - `rice_sessions` : Sessions de priorisation RICE
   - `rice_participants` : Participants aux sessions
   - `rice_reach_votes`, `rice_impact_votes`, `rice_confidence_votes`, `rice_effort_votes` : Votes des participants
   - `rice_results` : Résultats calculés des sessions

## Initialisation de la base de données

Pour initialiser la base de données, utilisez le script `init_database.sh` :

```bash
# Définir les variables d'environnement Supabase
export SUPABASE_URL=https://your-project-id.supabase.co
export SUPABASE_ANON_KEY=your-anon-key

# Exécuter le script d'initialisation
chmod +x init_database.sh
./init_database.sh
```

⚠️ **ATTENTION** : Ce script réinitialise entièrement la base de données. Toutes les données existantes seront perdues !

## Données par défaut

Le script d'initialisation insère automatiquement un jeu de paramètres RICE par défaut :

- Paramètres globaux avec poids équilibrés (30/30/20/20)
- Catégories de portée (Sitewide, Critical Journey, etc.)
- KPIs d'impact (CVR, Revenue, Behavior)
- Sources de confiance (A/B Test, Analytics, etc.)
- Tailles d'effort (XS à XL)

Ces données peuvent être modifiées via l'interface utilisateur après l'initialisation.

## Développement et maintenance

### Modification du schéma

Pour modifier le schéma de la base de données :

1. Créez un nouveau fichier SQL de migration dans ce répertoire
2. Ajoutez les commandes `ALTER TABLE`, `CREATE TABLE`, etc. nécessaires
3. Exécutez le fichier SQL via l'interface d'administration de Supabase

### Utilisation avec l'application

L'application se connecte à Supabase via les variables d'environnement suivantes (à définir dans `.env.local`) :

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_USE_SUPABASE=true
``` 