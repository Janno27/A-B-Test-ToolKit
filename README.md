# Système de Prioritisation RICE

Ce projet implémente un système de prioritisation RICE (Reach, Impact, Confidence, Effort) pour aider les équipes à prendre des décisions sur les fonctionnalités à développer.

## Vue d'ensemble

Le système RICE permet d'attribuer un score à chaque fonctionnalité en évaluant quatre dimensions :

- **Reach** : Combien d'utilisateurs seront touchés par cette fonctionnalité
- **Impact** : L'effet de la fonctionnalité sur les KPIs clés
- **Confidence** : Le niveau de certitude dans les prédictions
- **Effort** : Les ressources nécessaires pour développer la fonctionnalité

Le score final est calculé selon la formule :
```
RICE = (Reach × Impact × Confidence) ÷ Effort
```

## Fonctionnalités clés

- Processus de vote en plusieurs étapes pour évaluer chaque dimension du RICE
- Modes hôte et participant pour faciliter les sessions collaboratives
- Visualisation en temps réel des votes et des résultats
- Calcul automatique du score final RICE
- Interface utilisateur moderne et conviviale

## Flux des utilisateurs

Le système guide les utilisateurs à travers les étapes suivantes :

1. **Participants** : Rejoindre une session existante ou en créer une nouvelle
2. **Reach** : Voter sur la portée de la fonctionnalité (% d'utilisateurs touchés)
3. **Impact** : Sélectionner les métriques pertinentes et estimer l'impact
4. **Confidence** : Choisir les sources de preuves supportant les prédictions
5. **Effort** : Estimer l'effort de développement et de design
6. **Résultats** : Voir le score RICE final et sa décomposition

## Structure du code

### Composants principaux

- `RiceSessionSteps` : Orchestrateur principal qui gère la navigation entre les étapes
- `RiceSessionParticipants` : Gestion des participants et du démarrage de la session
- `RiceSessionVoting` : Évaluation du Reach (portée utilisateur)
- `RiceSessionImpact` : Évaluation de l'Impact (effet sur les KPIs)
- `RiceSessionConfidence` : Évaluation de la Confidence (certitude dans les prédictions)
- `RiceSessionEffort` : Évaluation de l'Effort (ressources requises)

### Logique clé

Chaque composant d'étape suit une structure similaire :
1. Charger les données existantes depuis le localStorage
2. Permettre à l'utilisateur de sélectionner ses votes
3. Soumettre les votes avec un retour visuel
4. Afficher les résultats collectifs (pour l'hôte et après révélation)
5. Calculer les scores selon les algorithmes spécifiques à chaque dimension

## Préparation pour Supabase

Actuellement, l'application utilise localStorage pour simuler la persistance des données. Pour migrer vers Supabase, nous devrons :

### 1. Modèle de données

Créer les tables suivantes dans Supabase :

```sql
-- Sessions
CREATE TABLE rice_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'active'
);

-- Participants
CREATE TABLE rice_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES rice_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  role TEXT DEFAULT 'participant',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reach Votes
CREATE TABLE rice_reach_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES rice_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  category_id TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Impact Votes
CREATE TABLE rice_impact_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES rice_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  metric TEXT NOT NULL,
  expected_value DECIMAL NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Confidence Votes
CREATE TABLE rice_confidence_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES rice_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  source_id TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Effort Votes
CREATE TABLE rice_effort_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES rice_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  dev_size_id TEXT NOT NULL,
  design_size_id TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Service d'authentification

Intégrer Supabase Auth pour gérer les utilisateurs et les sessions :

```typescript
// Exemple de service d'authentification
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseKey)

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signUp(email: string, password: string, name: string) {
  return supabase.auth.signUp({ 
    email, 
    password,
    options: {
      data: {
        name
      }
    }
  })
}

export async function signOut() {
  return supabase.auth.signOut()
}
```

### 3. Services de données

Remplacer les appels localStorage par des appels Supabase :

```typescript
// Exemple de service pour les votes de Reach
import { supabase } from './authService'

export async function saveReachVote(sessionId: string, userId: string, categoryId: string) {
  // Supprimer les votes existants de l'utilisateur
  await supabase
    .from('rice_reach_votes')
    .delete()
    .match({ session_id: sessionId, user_id: userId })
  
  // Ajouter le nouveau vote
  return supabase
    .from('rice_reach_votes')
    .insert({
      session_id: sessionId,
      user_id: userId,
      category_id: categoryId
    })
}

export async function getReachVotes(sessionId: string) {
  const { data, error } = await supabase
    .from('rice_reach_votes')
    .select(`
      id,
      category_id,
      user_id,
      users:rice_participants(name)
    `)
    .eq('session_id', sessionId)
  
  if (error) throw error
  return data
}
```

### 4. Modifications aux composants

Pour chaque composant, remplacer :

1. Les appels `localStorage.getItem` par des appels aux services Supabase
2. Les appels `localStorage.setItem` par des appels d'insertion ou de mise à jour dans Supabase
3. Ajouter des abonnements en temps réel pour synchroniser les données entre les utilisateurs

```typescript
// Exemple pour RiceSessionVoting
const [votes, setVotes] = useState<Vote[]>([]);

// Au chargement du composant
useEffect(() => {
  // Charger les votes initiaux
  getReachVotes(sessionId).then(setVotes);
  
  // S'abonner aux changements
  const subscription = supabase
    .channel(`rice_reach_votes:${sessionId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'rice_reach_votes',
      filter: `session_id=eq.${sessionId}`
    }, (payload) => {
      // Mettre à jour les votes après chaque changement
      getReachVotes(sessionId).then(setVotes);
    })
    .subscribe();
  
  return () => {
    subscription.unsubscribe();
  };
}, [sessionId]);
```

## Points d'attention pour l'implémentation

1. **Gestion des états de vote** : Vérifier que le bouton "Next Step" n'est activé qu'après confirmation du vote
2. **Cohérence des données** : S'assurer que les calculs sont basés sur les données réelles des votes
3. **Performance** : Optimiser les requêtes et minimiser les appels API pour éviter la latence
4. **Sécurité** : Implémenter des règles d'accès strictes dans Supabase pour protéger les données
5. **Résilience** : Gérer les erreurs réseau et les états de chargement pour une expérience utilisateur fluide

## Prochaines étapes

1. Mettre en place l'environnement Supabase et créer les tables
2. Implémenter les services d'accès aux données
3. Modifier les composants pour utiliser les services au lieu du localStorage
4. Ajouter des abonnements en temps réel pour synchroniser les données
5. Tester extensivement le flux d'utilisation complet
6. Déployer l'application 