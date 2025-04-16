# RICE Sessions - Documentation

## Vue d'ensemble

Le module de sessions RICE permet aux équipes de collaborer en temps réel pour prioriser des fonctionnalités ou idées en utilisant le framework RICE (Reach, Impact, Confidence, Effort). Cette documentation détaille le processus de vote participatif et son intégration avec Supabase.

## Flux d'utilisation

Le processus de priorisation RICE est divisé en 6 étapes principales :

1. **Participants** : Rejoindre la session et attendre que tous les participants soient présents
2. **Reach** (Portée) : Voter sur le nombre d'utilisateurs impactés
3. **Impact** : Évaluer l'impact de chaque fonctionnalité sur les métriques clés
4. **Confidence** (Confiance) : Indiquer le niveau de confiance dans ces estimations
5. **Effort** : Estimer l'effort requis pour implémenter
6. **Results** (Résultats) : Afficher les scores RICE calculés et la priorisation finale

## Structure des données

### Participants
```typescript
interface Participant {
  id: string;            // Identifiant unique
  name: string;          // Nom d'affichage
  role: "host" | "participant"; // Rôle (hôte ou participant)
  joinedAt: string;      // Timestamp ISO
}
```

### Votes
```typescript
interface Vote {
  userId: string;        // ID du participant qui vote
  userName: string;      // Nom du participant
  value: number;         // Valeur du vote (1-5)
  timestamp: string;     // Timestamp ISO
}
```

### Éléments de session
```typescript
interface SessionItem {
  id: string;            // Identifiant unique
  name: string;          // Nom de la fonctionnalité/idée
  description: string;   // Description
  votes: Vote[];         // Votes par étape (reach, impact, etc.)
}
```

### Session
```typescript
interface RiceSession {
  id: string;            // Identifiant unique
  name: string;          // Nom de la session
  createdAt: string;     // Timestamp ISO
  riceSettingsId: string; // ID des paramètres RICE utilisés
  participants: Participant[]; // Liste des participants
  items: SessionItem[];  // Éléments à évaluer
  currentStep: string;   // Étape actuelle
  // Votes par étape et par élément
  reachVotes: Record<string, Vote[]>;
  impactVotes: Record<string, Vote[]>;
  confidenceVotes: Record<string, Vote[]>;
  effortVotes: Record<string, Vote[]>;
  results: SessionResults | null; // Résultats calculés
}
```

## Architecture du système

### Stockage actuel (transitoire)
- Actuellement, les données sont stockées temporairement dans `localStorage`
- Simulacre de temps réel via des `setInterval` pour vérifier les mises à jour

### Migration vers Supabase

#### Structure des tables

1. **sessions**
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  rice_settings_id UUID REFERENCES rice_settings(id),
  current_step TEXT NOT NULL DEFAULT 'participants',
  results JSONB
);
```

2. **session_participants**
```sql
CREATE TABLE session_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

3. **session_items**
```sql
CREATE TABLE session_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

4. **session_votes**
```sql
CREATE TABLE session_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  item_id UUID REFERENCES session_items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  user_name TEXT NOT NULL,
  vote_type TEXT NOT NULL, -- 'reach', 'impact', 'confidence', 'effort'
  value INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contrainte unique pour s'assurer qu'un utilisateur ne vote qu'une fois par élément et type
  UNIQUE (session_id, item_id, user_id, vote_type)
);
```

#### Fonctions RPC Supabase

1. **create_session(name, rice_settings_id)**
   - Crée une nouvelle session
   - Retourne l'ID de session pour redirection

2. **join_session(session_id, name, is_host)**
   - Ajoute un participant à une session
   - Gère l'attribution du rôle d'hôte si aucun hôte n'existe

3. **submit_vote(session_id, item_id, vote_type, value)**
   - Enregistre le vote d'un utilisateur
   - Met à jour un vote existant si l'utilisateur a déjà voté

4. **reveal_votes(session_id, item_id, vote_type)**
   - Option réservée à l'hôte pour révéler les votes
   - Mettre à jour le drapeau révélant les votes pour une étape spécifique

5. **calculate_rice_scores(session_id)**
   - Calcule les scores RICE finaux
   - Prend en compte tous les votes pour chaque facteur et élément

#### Intégration temps réel

```typescript
// Exemple de souscription aux mises à jour de participants
useEffect(() => {
  const channel = supabase
    .channel(`session_participants:${sessionId}`)
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'session_participants',
      filter: `session_id=eq.${sessionId}`
    }, (payload) => {
      // Mise à jour des participants
      fetchParticipants();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [sessionId]);

// Exemple de souscription aux mises à jour de votes
useEffect(() => {
  const channel = supabase
    .channel(`session_votes:${sessionId}`)
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'session_votes',
      filter: `session_id=eq.${sessionId} AND vote_type=eq.${voteType}`
    }, (payload) => {
      // Mise à jour des votes
      fetchVotes();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [sessionId, voteType]);
```

## Considérations techniques

### Gestion des votes

1. **Vote temporaire vs persistant**
   - Les votes sont d'abord stockés localement lors de la sélection
   - Ils sont envoyés à Supabase immédiatement, mais restent masqués aux autres utilisateurs
   - Seul l'hôte peut révéler les votes collectivement

2. **Règles de révélation**
   - L'hôte peut révéler les votes seulement quand tous les participants ont voté
   - Option pour révéler les votes moyens sans montrer les votes individuels
   - Option pour cacher les votes après révélation pour permettre des ajustements

3. **Calcul des scores**
   - Les scores sont calculés sur le serveur via une fonction RPC Supabase
   - Formule : (Reach × Impact × Confidence) ÷ Effort
   - Les pondérations personnalisées des paramètres RICE sont appliquées

### Interface utilisateur

1. **Rôles et autorisations**
   - Hôte : peut gérer la session, révéler les votes, passer aux étapes suivantes
   - Participant : peut seulement voter et voir les résultats révélés

2. **Feedback visuel**
   - Animation de transition entre les étapes
   - Indicateurs de progression
   - Retour visuel sur les votes effectués
   - Indicateurs de vote en attente

3. **Animations**
   - Transition entre étapes par glissement horizontal
   - Animation de la barre de progression
   - Effet d'échelle sur les boutons et les votes

## Bonnes pratiques d'implémentation

1. **Sécurité**
   - Utiliser Row Level Security (RLS) pour limiter l'accès aux données
   - Vérifier les autorisations côté serveur pour toutes les actions critiques

2. **Performance**
   - Utiliser des requêtes optimisées avec des jointures adaptées
   - Limiter le nombre de souscriptions en temps réel

3. **Gestion d'erreurs**
   - Gérer les déconnexions réseau avec une file d'attente de synchronisation
   - Afficher des messages d'erreur explicites
   - Mettre en place des mécanismes de récupération

## Futures améliorations

1. **Export des résultats**
   - Format CSV, PDF ou intégration avec d'autres outils

2. **Sessions asynchrones**
   - Permettre aux participants de voter à leur rythme sur une période donnée

3. **Intégration Slack/Teams**
   - Notifications pour les nouvelles sessions
   - Résumés de résultats

4. **Visualisations avancées**
   - Graphiques comparatifs des scores
   - Visualisations interactives

5. **Templates de session**
   - Réutilisation de listes d'éléments prédéfinis
   - Préchargement de fonctionnalités courantes 