// RiceSessionService.ts
// Service pour gérer les opérations CRUD sur les sessions RICE

import { 
  RiceSettings,
  ReachCategory, 
  ImpactKPI, 
  ConfidenceSource, 
  EffortSize
} from './RiceService';

// Types pour les sessions RICE
export interface RiceSession {
  id: string;
  name: string;
  settingsId: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'active' | 'completed';
  createdBy?: string;
  participants: Participant[];
  reach?: ReachVote;
  impact?: ImpactVote;
  confidence?: ConfidenceVote;
  effort?: EffortVote;
  results?: RiceResults;
}

export interface Participant {
  id: string;
  name: string;
  role: 'facilitator' | 'voter';
  joinedAt: Date;
}

export interface ReachVote {
  categoryId: string;
  categoryValue: number;
  votes: {
    participantId: string;
    value: number;
  }[];
  finalValue?: number;
}

export interface ImpactVote {
  selectedKPIs: string[];
  metricVotes: {
    participantId: string;
    metrics: {
      metricId: string;
      value: number;
    }[];
  }[];
  finalMetrics?: {
    metricId: string;
    value: number;
  }[];
  finalValue?: number;
}

export interface ConfidenceVote {
  selectedSources: string[];
  votes: {
    participantId: string;
    sources: string[];
  }[];
  finalValue?: number;
}

export interface EffortVote {
  votes: {
    participantId: string;
    devEffort: string;
    designEffort: string;
  }[];
  finalDevEffort?: string;
  finalDesignEffort?: string;
  finalValue?: number;
}

export interface RiceResults {
  reach: number;
  impact: number;
  confidence: number;
  effort: number;
  score: number; // R * I * C / E
  qualitativeAssessment?: string;
}

// Service d'abstraction pour la gestion des sessions RICE
class RiceSessionService {
  private STORAGE_KEY = 'rice_sessions';

  // Récupérer toutes les sessions RICE
  async getAllSessions(): Promise<RiceSession[]> {
    if (typeof window === 'undefined') return [];
    
    try {
      const storedSessions = localStorage.getItem(this.STORAGE_KEY);
      return storedSessions ? JSON.parse(storedSessions) : [];
    } catch (error) {
      console.error('Error fetching RICE sessions:', error);
      return [];
    }
  }

  // Récupérer une session RICE par ID
  async getSessionById(id: string): Promise<RiceSession | null> {
    if (typeof window === 'undefined') return null;
    
    try {
      const sessions = await this.getAllSessions();
      return sessions.find(s => s.id === id) || null;
    } catch (error) {
      console.error(`Error fetching RICE session with id ${id}:`, error);
      return null;
    }
  }

  // Créer une nouvelle session RICE
  async createSession(session: Omit<RiceSession, 'id' | 'createdAt' | 'updatedAt'>): Promise<RiceSession> {
    if (typeof window === 'undefined') throw new Error('Cannot access localStorage on server');
    
    try {
      const allSessions = await this.getAllSessions();
      
      const newSession: RiceSession = {
        ...session,
        id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      allSessions.push(newSession);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allSessions));
      
      return newSession;
    } catch (error) {
      console.error('Error creating RICE session:', error);
      throw error;
    }
  }

  // Mettre à jour une session RICE existante
  async updateSession(id: string, updates: Partial<RiceSession>): Promise<RiceSession> {
    if (typeof window === 'undefined') throw new Error('Cannot access localStorage on server');
    
    try {
      const allSessions = await this.getAllSessions();
      const index = allSessions.findIndex(s => s.id === id);
      
      if (index === -1) {
        throw new Error(`Session with id ${id} not found`);
      }
      
      const updatedSession: RiceSession = {
        ...allSessions[index],
        ...updates,
        updatedAt: new Date()
      };
      
      allSessions[index] = updatedSession;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allSessions));
      
      return updatedSession;
    } catch (error) {
      console.error(`Error updating RICE session with id ${id}:`, error);
      throw error;
    }
  }

  // Supprimer une session RICE
  async deleteSession(id: string): Promise<boolean> {
    if (typeof window === 'undefined') throw new Error('Cannot access localStorage on server');
    
    try {
      const allSessions = await this.getAllSessions();
      const newSessions = allSessions.filter(s => s.id !== id);
      
      if (newSessions.length === allSessions.length) {
        return false; // Aucune session n'a été supprimée
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newSessions));
      return true;
    } catch (error) {
      console.error(`Error deleting RICE session with id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Sauvegarde une session RICE complète
   * @param session La session à sauvegarder
   * @returns La session sauvegardée avec ID mis à jour
   */
  async saveSession(session: Omit<RiceSession, 'id' | 'createdAt' | 'updatedAt'> | RiceSession): Promise<RiceSession> {
    try {
      // Si la session a un ID, on met à jour, sinon on crée
      if ('id' in session && session.id) {
        return this.updateSession(session.id, session as Partial<RiceSession>);
      } else {
        return this.createSession(session as Omit<RiceSession, 'id' | 'createdAt' | 'updatedAt'>);
      }
    } catch (error) {
      console.error('Error saving RICE session:', error);
      throw error;
    }
  }

  // GESTION DES PARTICIPANTS

  // Ajouter un participant à une session
  async addParticipant(sessionId: string, participant: Omit<Participant, 'id' | 'joinedAt'>): Promise<Participant> {
    const session = await this.getSessionById(sessionId);
    if (!session) throw new Error(`Session with id ${sessionId} not found`);
    
    const newParticipant: Participant = {
      ...participant,
      id: this.generateId(),
      joinedAt: new Date()
    };
    
    const updatedParticipants = [...session.participants, newParticipant];
    await this.updateSession(sessionId, { participants: updatedParticipants });
    
    return newParticipant;
  }

  // Supprimer un participant d'une session
  async removeParticipant(sessionId: string, participantId: string): Promise<boolean> {
    const session = await this.getSessionById(sessionId);
    if (!session) throw new Error(`Session with id ${sessionId} not found`);
    
    const updatedParticipants = session.participants.filter(p => p.id !== participantId);
    if (updatedParticipants.length === session.participants.length) {
      return false; // Aucun participant n'a été supprimé
    }
    
    await this.updateSession(sessionId, { participants: updatedParticipants });
    return true;
  }

  // GESTION DES VOTES

  // Enregistrer un vote pour la portée (Reach)
  async saveReachVote(sessionId: string, participantId: string, categoryId: string, value: number): Promise<ReachVote> {
    const session = await this.getSessionById(sessionId);
    if (!session) throw new Error(`Session with id ${sessionId} not found`);
    
    // Vérifier si le participant existe
    const participant = session.participants.find(p => p.id === participantId);
    if (!participant) throw new Error(`Participant with id ${participantId} not found`);
    
    let reachVote = session.reach || {
      categoryId,
      categoryValue: 0, // Sera mis à jour à partir des paramètres
      votes: []
    };
    
    // Vérifier si le participant a déjà voté
    const existingVoteIndex = reachVote.votes.findIndex(v => v.participantId === participantId);
    
    if (existingVoteIndex >= 0) {
      // Mettre à jour le vote existant
      reachVote.votes[existingVoteIndex].value = value;
    } else {
      // Ajouter un nouveau vote
      reachVote.votes.push({
        participantId,
        value
      });
    }
    
    // Mettre à jour la session
    await this.updateSession(sessionId, { reach: reachVote });
    
    return reachVote;
  }

  // Finaliser le vote pour la portée (Reach)
  async finalizeReachVote(sessionId: string, finalValue: number): Promise<ReachVote> {
    const session = await this.getSessionById(sessionId);
    if (!session) throw new Error(`Session with id ${sessionId} not found`);
    
    if (!session.reach) throw new Error('No reach votes found for this session');
    
    const updatedReachVote = {
      ...session.reach,
      finalValue
    };
    
    await this.updateSession(sessionId, { reach: updatedReachVote });
    
    return updatedReachVote;
  }

  // Enregistrer un vote pour l'impact
  async saveImpactVote(
    sessionId: string, 
    participantId: string, 
    metrics: { metricId: string; value: number }[]
  ): Promise<ImpactVote> {
    const session = await this.getSessionById(sessionId);
    if (!session) throw new Error(`Session with id ${sessionId} not found`);
    
    // Vérifier si le participant existe
    const participant = session.participants.find(p => p.id === participantId);
    if (!participant) throw new Error(`Participant with id ${participantId} not found`);
    
    let impactVote = session.impact || {
      selectedKPIs: [],
      metricVotes: []
    };
    
    // Vérifier si le participant a déjà voté
    const existingVoteIndex = impactVote.metricVotes.findIndex(v => v.participantId === participantId);
    
    if (existingVoteIndex >= 0) {
      // Mettre à jour le vote existant
      impactVote.metricVotes[existingVoteIndex].metrics = metrics;
    } else {
      // Ajouter un nouveau vote
      impactVote.metricVotes.push({
        participantId,
        metrics
      });
    }
    
    // Mettre à jour la session
    await this.updateSession(sessionId, { impact: impactVote });
    
    return impactVote;
  }

  // Finaliser le vote pour l'impact
  async finalizeImpactVote(
    sessionId: string, 
    finalMetrics: { metricId: string; value: number }[], 
    finalValue: number
  ): Promise<ImpactVote> {
    const session = await this.getSessionById(sessionId);
    if (!session) throw new Error(`Session with id ${sessionId} not found`);
    
    if (!session.impact) throw new Error('No impact votes found for this session');
    
    const updatedImpactVote = {
      ...session.impact,
      finalMetrics,
      finalValue
    };
    
    await this.updateSession(sessionId, { impact: updatedImpactVote });
    
    return updatedImpactVote;
  }

  // Enregistrer un vote pour la confiance
  async saveConfidenceVote(
    sessionId: string, 
    participantId: string, 
    sources: string[]
  ): Promise<ConfidenceVote> {
    const session = await this.getSessionById(sessionId);
    if (!session) throw new Error(`Session with id ${sessionId} not found`);
    
    // Vérifier si le participant existe
    const participant = session.participants.find(p => p.id === participantId);
    if (!participant) throw new Error(`Participant with id ${participantId} not found`);
    
    let confidenceVote = session.confidence || {
      selectedSources: [],
      votes: []
    };
    
    // Vérifier si le participant a déjà voté
    const existingVoteIndex = confidenceVote.votes.findIndex(v => v.participantId === participantId);
    
    if (existingVoteIndex >= 0) {
      // Mettre à jour le vote existant
      confidenceVote.votes[existingVoteIndex].sources = sources;
    } else {
      // Ajouter un nouveau vote
      confidenceVote.votes.push({
        participantId,
        sources
      });
    }
    
    // Mettre à jour la session
    await this.updateSession(sessionId, { confidence: confidenceVote });
    
    return confidenceVote;
  }

  // Finaliser le vote pour la confiance
  async finalizeConfidenceVote(sessionId: string, finalValue: number): Promise<ConfidenceVote> {
    const session = await this.getSessionById(sessionId);
    if (!session) throw new Error(`Session with id ${sessionId} not found`);
    
    if (!session.confidence) throw new Error('No confidence votes found for this session');
    
    const updatedConfidenceVote = {
      ...session.confidence,
      finalValue
    };
    
    await this.updateSession(sessionId, { confidence: updatedConfidenceVote });
    
    return updatedConfidenceVote;
  }

  // Enregistrer un vote pour l'effort
  async saveEffortVote(
    sessionId: string, 
    participantId: string, 
    devEffort: string,
    designEffort: string
  ): Promise<EffortVote> {
    const session = await this.getSessionById(sessionId);
    if (!session) throw new Error(`Session with id ${sessionId} not found`);
    
    // Vérifier si le participant existe
    const participant = session.participants.find(p => p.id === participantId);
    if (!participant) throw new Error(`Participant with id ${participantId} not found`);
    
    let effortVote = session.effort || {
      votes: []
    };
    
    // Vérifier si le participant a déjà voté
    const existingVoteIndex = effortVote.votes.findIndex(v => v.participantId === participantId);
    
    if (existingVoteIndex >= 0) {
      // Mettre à jour le vote existant
      effortVote.votes[existingVoteIndex].devEffort = devEffort;
      effortVote.votes[existingVoteIndex].designEffort = designEffort;
    } else {
      // Ajouter un nouveau vote
      effortVote.votes.push({
        participantId,
        devEffort,
        designEffort
      });
    }
    
    // Mettre à jour la session
    await this.updateSession(sessionId, { effort: effortVote });
    
    return effortVote;
  }

  // Finaliser le vote pour l'effort
  async finalizeEffortVote(
    sessionId: string, 
    finalDevEffort: string,
    finalDesignEffort: string,
    finalValue: number
  ): Promise<EffortVote> {
    const session = await this.getSessionById(sessionId);
    if (!session) throw new Error(`Session with id ${sessionId} not found`);
    
    if (!session.effort) throw new Error('No effort votes found for this session');
    
    const updatedEffortVote = {
      ...session.effort,
      finalDevEffort,
      finalDesignEffort,
      finalValue
    };
    
    await this.updateSession(sessionId, { effort: updatedEffortVote });
    
    return updatedEffortVote;
  }

  // Calculer et enregistrer les résultats RICE finaux
  async calculateRiceResults(sessionId: string, qualitativeAssessment?: string): Promise<RiceResults> {
    const session = await this.getSessionById(sessionId);
    if (!session) throw new Error(`Session with id ${sessionId} not found`);
    
    // Vérifier que toutes les valeurs finales sont disponibles
    if (!session.reach?.finalValue) throw new Error('Reach final value is missing');
    if (!session.impact?.finalValue) throw new Error('Impact final value is missing');
    if (!session.confidence?.finalValue) throw new Error('Confidence final value is missing');
    if (!session.effort?.finalValue) throw new Error('Effort final value is missing');
    
    const reach = session.reach.finalValue;
    const impact = session.impact.finalValue;
    const confidence = session.confidence.finalValue;
    const effort = session.effort.finalValue;
    
    // Calculer le score RICE: R * I * C / E
    const score = (reach * impact * confidence) / effort;
    
    const results: RiceResults = {
      reach,
      impact,
      confidence,
      effort,
      score,
      qualitativeAssessment
    };
    
    // Mettre à jour la session avec les résultats
    await this.updateSession(sessionId, { 
      results,
      status: 'completed' 
    });
    
    return results;
  }

  // Utilitaire pour générer un ID unique
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }
}

// Exportation d'une instance unique du service
export const riceSessionService = new RiceSessionService();
export default riceSessionService; 