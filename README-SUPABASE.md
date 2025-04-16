# Guide d'intégration Supabase pour l'application RICE

Ce guide explique comment configurer Supabase pour l'application RICE et comment basculer entre le stockage local (localStorage) et Supabase.

## Prérequis

- Un compte Supabase (inscription gratuite sur [supabase.com](https://supabase.com))
- Node.js et npm installés localement

## Configuration de Supabase

### 1. Créer un nouveau projet Supabase

1. Connectez-vous à votre compte Supabase et cliquez sur "New Project".
2. Nommez votre projet (ex: "rice-app") et choisissez un mot de passe pour la base de données.
3. Sélectionnez une région proche de vos utilisateurs.
4. Cliquez sur "Create new project" et attendez que le projet soit initialisé.

### 2. Configurer la base de données

1. Dans l'interface Supabase, allez dans l'onglet "SQL Editor".
2. Cliquez sur "New Query" et collez le contenu du fichier `app/sql/migrations/001_initial_schema.sql`.
3. Exécutez le script pour créer les tables et les relations.

### 3. Configurer les variables d'environnement

1. Dans l'interface Supabase, allez dans "Settings" > "API" et copiez les informations suivantes :
   - URL: `https://your-project-id.supabase.co`
   - anon/public key

2. Modifiez votre fichier `.env.local` pour y ajouter ces informations :
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anon
   NEXT_PUBLIC_USE_SUPABASE=true
   ```

## Utilisation

### Basculer entre localStorage et Supabase

L'application est configurée pour utiliser soit localStorage, soit Supabase, en fonction de la valeur de la variable d'environnement `NEXT_PUBLIC_USE_SUPABASE` :

- `NEXT_PUBLIC_USE_SUPABASE=true` : Utilise Supabase comme source de données
- `NEXT_PUBLIC_USE_SUPABASE=false` : Utilise localStorage comme source de données (par défaut)

Pour basculer entre les deux modes, modifiez simplement cette variable dans votre fichier `.env.local` et redémarrez l'application.

### Migrer les données de localStorage vers Supabase

Si vous avez déjà des données dans localStorage et que vous souhaitez les migrer vers Supabase, suivez ces étapes :

1. Exportez vos données de localStorage :
   - Ouvrez les DevTools de votre navigateur (F12)
   - Allez dans l'onglet "Application" > "Storage" > "Local Storage"
   - Copiez les valeurs des clés `rice_settings` et `rice_sessions`

2. Créez un script de migration pour importer ces données dans Supabase

3. Exécutez le script pour migrer vos données

## Services disponibles

L'application utilise plusieurs services adaptés à Supabase :

1. **SupabaseRiceSettingsService** : Pour gérer les paramètres RICE
   - Méthodes CRUD pour les paramètres et leurs sous-éléments
   - Synchronisation bidirectionnelle avec la base de données

2. **SupabaseRiceSessionService** : Pour gérer les sessions RICE
   - Gestion des participants, des votes et des résultats
   - Calcul des scores RICE

## Structure des fichiers

- `app/lib/supabase.ts` : Configuration du client Supabase
- `app/services/db/SupabaseRiceSettingsService.ts` : Service pour les paramètres RICE
- `app/services/db/SupabaseRiceSessionService.ts` : Service pour les sessions RICE
- `app/sql/migrations/001_initial_schema.sql` : Script de création des tables

## Dépannage

### Problèmes de connexion

Si vous rencontrez des problèmes de connexion à Supabase :

1. Vérifiez que vos variables d'environnement sont correctement configurées
2. Assurez-vous que votre projet Supabase est actif
3. Vérifiez les logs dans la console du navigateur

### Problèmes de migration

Si vous rencontrez des problèmes lors de la migration des données :

1. Vérifiez que votre schéma de base de données correspond à celui défini dans le script SQL
2. Assurez-vous que les données respectent les contraintes définies dans le schéma 