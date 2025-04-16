import { supabase } from '../../lib/supabase';
import {
  RiceSession,
  Participant,
  ReachVote,
  ImpactVote,
  ConfidenceVote,
  EffortVote,
  RiceResults
} from '../RiceSessionService';

// Service pour gérer les sessions RICE avec Supabase
class SupabaseRiceSessionService {
  private supabaseClient;
  
  constructor() {
    // Vérifier si Supabase est disponible au moment de l'initialisation
    if (!supabase) {
      console.error('SupabaseRiceSessionService: Le client Supabase n\'est pas disponible. Les opérations échoueront.');
    } else {
      console.log('SupabaseRiceSessionService: Initialisé avec succès.');
    }
    this.supabaseClient = supabase;
  }

  /**
   * Vérifie si le client Supabase est disponible
   * @returns Le client Supabase si disponible
   * @throws Error si le client Supabase n'est pas disponible
   */
  private checkSupabase() {
    if (!this.supabaseClient) {
      throw new Error('Supabase client not available');
    }
    return this.supabaseClient;
  }

  /**
   * Récupère un résumé des scores RICE pour une session
   * @param sessionId L'ID de la session
   * @returns Le résumé des scores RICE ou null si non trouvé
   */
  async getRiceSummary(sessionId: string): Promise<{
    reach_score: number;
    impact_score: number;
    confidence_score: number;
    effort_score: number;
    rice_score: number;
    created_at: string;
    updated_at: string;
  } | null> {
    try {
      const { data, error } = await this.checkSupabase()
        .from('rice_results_summary')
        .select('*')
        .eq('session_id', sessionId)
        .single();
        
      if (error) {
        // Ne pas signaler d'erreur si le résumé n'existe pas encore
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error(`Erreur lors de la récupération du résumé RICE pour la session ${sessionId}:`, error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du résumé RICE pour la session ${sessionId}:`, error);
      return null;
    }
  }

  /**
   * Récupère toutes les sessions RICE
   * @returns Une promesse qui se résout avec un tableau de sessions RICE
   */
  async getAllSessions(): Promise<RiceSession[]> {
    try {
      const supabase = this.checkSupabase();
      const { data, error } = await supabase
        .from('rice_sessions')
        .select(`
          *,
          rice_participants(*)
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Mapper les données au format attendu par l'application
      return data.map(this.mapDbSessionToApp);
    } catch (error) {
      console.error('Error fetching RICE sessions from Supabase:', error);
      return [];
    }
  }

  // Récupérer une session RICE par ID
  async getSessionById(id: string): Promise<RiceSession | null> {
    try {
      const client = this.checkSupabase();
      
      const { data: sessionData, error: sessionError } = await client
        .from('rice_sessions')
        .select(`
          *,
          rice_participants (*)
        `)
        .eq('id', id)
        .single();
        
      if (sessionError) throw sessionError;
      if (!sessionData) return null;
      
      // Récupérer les votes pour cette session
      const { data: reachVotesData, error: reachError } = await client
        .from('rice_reach_votes')
        .select('*')
        .eq('session_id', id);
        
      if (reachError) throw reachError;
      
      const { data: impactVotesData, error: impactError } = await client
        .from('rice_impact_votes')
        .select('*')
        .eq('session_id', id);
        
      if (impactError) throw impactError;
      
      const { data: confidenceVotesData, error: confidenceError } = await client
        .from('rice_confidence_votes')
        .select('*')
        .eq('session_id', id);
        
      if (confidenceError) throw confidenceError;
      
      const { data: effortVotesData, error: effortError } = await client
        .from('rice_effort_votes')
        .select('*')
        .eq('session_id', id);
        
      if (effortError) throw effortError;
      
      // Construire l'objet session
      return this.buildFullSession(
        sessionData, 
        reachVotesData || [],
        impactVotesData || [],
        confidenceVotesData || [],
        effortVotesData || []
      );
    } catch (error) {
      console.error(`Error fetching RICE session with id ${id} from Supabase:`, error);
      return null;
    }
  }

  // Créer une nouvelle session RICE
  async createSession(session: Omit<RiceSession, 'id' | 'createdAt' | 'updatedAt'>): Promise<RiceSession> {
    try {
      // Insérer la session principale
      const { data: createdSession, error } = await this.supabaseClient!
        .from('rice_sessions')
        .insert({
          name: session.name,
          settings_id: session.settingsId,
          status: session.status,
          description: "", // Utilisation de champs existants dans le schéma au lieu de created_by
          feature_name: session.name
        })
        .select()
        .single();
        
      if (error) throw error;
      if (!createdSession) throw new Error('Failed to create session');
      
      // Ajouter les participants si fournis
      if (session.participants?.length) {
        const participants = session.participants.map(p => ({
          session_id: createdSession.id,
          name: p.name,
          role: p.role
          // user_id a été supprimé car il n'est pas dans le schéma
        }));
        
        const { error: participantsError } = await this.supabaseClient!
          .from('rice_participants')
          .insert(participants);
          
        if (participantsError) throw participantsError;
      }
      
      // Récupérer la session complète
      return this.getSessionById(createdSession.id) as Promise<RiceSession>;
    } catch (error) {
      console.error('Error creating RICE session in Supabase:', error);
      throw error;
    }
  }

  // Mettre à jour une session RICE existante
  async updateSession(id: string, updates: Partial<RiceSession>): Promise<RiceSession> {
    try {
      const { participants, reach, impact, confidence, effort, results, ...mainUpdates } = updates;
      
      // Mettre à jour les informations principales
      if (Object.keys(mainUpdates).length > 0) {
        const dbMainUpdates: any = {};
        
        if (mainUpdates.name) dbMainUpdates.name = mainUpdates.name;
        if (mainUpdates.status) dbMainUpdates.status = mainUpdates.status;
        
        const { error } = await this.supabaseClient!
          .from('rice_sessions')
          .update(dbMainUpdates)
          .eq('id', id);
          
        if (error) throw error;
      }
      
      // Mettre à jour les participants si fournis
      if (participants) {
        await this.updateParticipants(id, participants);
      }
      
      // Mettre à jour les votes si fournis
      if (reach) {
        await this.updateReachVotes(id, reach);
      }
      
      if (impact) {
        await this.updateImpactVotes(id, impact);
      }
      
      if (confidence) {
        await this.updateConfidenceVotes(id, confidence);
      }
      
      if (effort) {
        await this.updateEffortVotes(id, effort);
      }
      
      // Mettre à jour les résultats si fournis
      if (results) {
        const { error } = await this.supabaseClient!
          .from('rice_sessions')
          .update({
            results: results,
            status: 'completed'
          })
          .eq('id', id);
          
        if (error) throw error;
      }
      
      // Récupérer la session mise à jour
      const updatedSession = await this.getSessionById(id);
      if (!updatedSession) throw new Error(`Session with id ${id} not found after update`);
      
      return updatedSession;
    } catch (error) {
      console.error(`Error updating RICE session with id ${id} in Supabase:`, error);
      throw error;
    }
  }

  // Supprimer une session RICE
  async deleteSession(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabaseClient!
        .from('rice_sessions')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error(`Error deleting RICE session with id ${id} from Supabase:`, error);
      throw error;
    }
  }

  // GESTION DES PARTICIPANTS

  // Ajouter un participant à une session
  async addParticipant(sessionId: string, participant: Omit<Participant, 'id' | 'joinedAt'>): Promise<Participant> {
    try {
      const { data, error } = await this.supabaseClient!
        .from('rice_participants')
        .insert({
          session_id: sessionId,
          name: participant.name,
          role: participant.role
        })
        .select()
        .single();
        
      if (error) throw error;
      if (!data) throw new Error('Failed to add participant');
      
      return {
        id: data.id,
        name: data.name,
        role: data.role as 'facilitator' | 'voter',
        joinedAt: new Date(data.joined_at)
      };
    } catch (error) {
      console.error(`Error adding participant to session ${sessionId} in Supabase:`, error);
      throw error;
    }
  }

  // Supprimer un participant d'une session
  async removeParticipant(sessionId: string, participantId: string): Promise<boolean> {
    try {
      const { error } = await this.supabaseClient!
        .from('rice_participants')
        .delete()
        .eq('id', participantId)
        .eq('session_id', sessionId);
        
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error(`Error removing participant ${participantId} from session ${sessionId} in Supabase:`, error);
      throw error;
    }
  }

  // GESTION DES VOTES

  // Vérifier si un participant existe et le créer si nécessaire
  async ensureParticipantExists(sessionId: string, participant: { id: string, name: string, role: string }): Promise<string> {
    try {
      // Vérifier si le participant existe déjà
      const { data: existingParticipants, error: selectError } = await this.supabaseClient!
        .from('rice_participants')
        .select('id')
        .eq('id', participant.id);
        
      if (selectError) throw selectError;
      
      // Si le participant existe, retourner son ID
      if (existingParticipants && existingParticipants.length > 0) {
        return participant.id;
      }
      
      // Sinon, créer le participant
      const { data, error } = await this.supabaseClient!
        .from('rice_participants')
        .insert({
          id: participant.id,
          session_id: sessionId,
          name: participant.name,
          role: participant.role
        })
        .select()
        .single();
        
      if (error) throw error;
      if (!data) throw new Error('Failed to create participant');
      
      return data.id;
    } catch (error) {
      console.error(`Error ensuring participant exists in session ${sessionId}:`, error);
      throw error;
    }
  }

  // Enregistrer un vote pour la portée (Reach)
  async saveReachVote(sessionId: string, participantId: string, categoryId: string, value: number): Promise<ReachVote> {
    try {
      // Vérifier que le participant existe et le créer au besoin
      await this.ensureParticipantExists(sessionId, {
        id: participantId,
        name: "Anonymous User", // Nom par défaut si l'utilisateur est créé
        role: "facilitator"     // Rôle par défaut
      });
      
      // Vérifier d'abord le schéma de la table
      try {
        const { data: tableInfo, error: tableError } = await this.supabaseClient!
          .from('rice_reach_votes')
          .select('*')
          .limit(1);
          
        if (tableError) {
          console.error('Erreur lors de la vérification du schéma:', tableError);
          // Continuer malgré l'erreur
        } else if (tableInfo) {
          // Log les noms de colonnes pour le débogage
          console.log('Structure de la table rice_reach_votes:', 
            tableInfo.length > 0 ? Object.keys(tableInfo[0]) : 'Pas de données');
        }
      } catch (e) {
        console.warn('Impossible de vérifier le schéma:', e);
      }
      
      // Vérifier si le participant a déjà voté
      const { data: existingVotes, error: selectError } = await this.supabaseClient!
        .from('rice_reach_votes')
        .select('*')
        .eq('session_id', sessionId)
        .eq('participant_id', participantId);
        
      if (selectError) throw selectError;
      
      // Mettre à jour ou insérer le vote
      if (existingVotes && existingVotes.length > 0) {
        const { error } = await this.supabaseClient!
          .from('rice_reach_votes')
          .update({
            category_id: categoryId, // Vérifier que ces noms de colonnes sont corrects
            value: value
          })
          .eq('id', existingVotes[0].id);
          
        if (error) {
          console.error('Erreur détaillée lors de la mise à jour:', error);
          throw error;
        }
      } else {
        const { error } = await this.supabaseClient!
          .from('rice_reach_votes')
          .insert({
            session_id: sessionId,
            participant_id: participantId,
            category_id: categoryId, // Vérifier que ces noms de colonnes sont corrects
            value: value
          });
          
        if (error) {
          console.error('Erreur détaillée lors de l\'insertion:', error);
          throw error;
        }
      }
      
      // Récupérer tous les votes actuels pour cette session
      const { data: allVotes, error: votesError } = await this.supabaseClient!
        .from('rice_reach_votes')
        .select('*')
        .eq('session_id', sessionId);
        
      if (votesError) throw votesError;
      
      // Construire l'objet de vote
      const reachVote: ReachVote = {
        categoryId: categoryId,
        categoryValue: 0, // À remplir à partir des paramètres
        votes: allVotes.map((v: any) => ({
          participantId: v.participant_id,
          value: v.value
        })),
        finalValue: 0 // À remplir à partir de la base de données
      };
      
      return reachVote;
    } catch (error) {
      console.error(`Error saving reach vote for session ${sessionId} in Supabase:`, error);
      throw error;
    }
  }

  // Enregistrer un vote pour les métriques d'impact
  async saveImpactVote(
    sessionId: string,
    participantId: string,
    metrics: { metricId: string; value: number }[]
  ): Promise<ImpactVote> {
    try {
      // Vérifier que le participant existe et le créer au besoin
      await this.ensureParticipantExists(sessionId, {
        id: participantId,
        name: "Anonymous User", // Nom par défaut si l'utilisateur est créé
        role: "facilitator"     // Rôle par défaut
      });
      
      // Vérifier d'abord le schéma de la table pour découvrir les noms de colonnes corrects
      const { data: tableInfo, error: tableError } = await this.supabaseClient!
        .from('rice_impact_votes')
        .select('*')
        .limit(1);
        
      if (tableError) {
        console.error('Erreur lors de la vérification du schéma:', tableError);
        
        // Essayer une approche différente pour obtenir des informations sur la table
        try {
          // Récupérer les métadonnées de la table
          const { data: definitions } = await this.supabaseClient!.rpc('get_definitions');
          console.log('Définitions des tables:', definitions);
        } catch (e) {
          console.error('Erreur lors de la récupération des définitions:', e);
        }
        
        throw tableError;
      }
      
      // Log les noms de colonnes pour le débogage
      let columnNames: string[] = [];
      if (tableInfo && tableInfo.length > 0) {
        columnNames = Object.keys(tableInfo[0]);
        console.log('Structure de la table rice_impact_votes:', columnNames);
      } else {
        console.log('Aucune donnée dans la table pour déterminer les colonnes');
        
        // Tenter d'obtenir les informations sur le schéma en utilisant l'API système de Supabase
        try {
          const { data: schemaInfo } = await this.supabaseClient!
            .rpc('get_table_columns', { table_name: 'rice_impact_votes' });
            
          console.log('Informations de schéma:', schemaInfo);
        } catch (e) {
          console.error('Impossible d\'accéder aux informations de schéma:', e);
        }
      }
      
      // Supprimer les votes existants pour ce participant
      const { error: deleteError } = await this.supabaseClient!
        .from('rice_impact_votes')
        .delete()
        .eq('session_id', sessionId)
        .eq('participant_id', participantId);
        
      if (deleteError) throw deleteError;
      
      // Insérer les nouveaux votes avec le nom correct 'expected_value'
      if (metrics && metrics.length > 0) {
        const votesToInsert = metrics.map(metric => ({
          session_id: sessionId,
          participant_id: participantId,
          kpi_id: metric.metricId,
          expected_value: metric.value, // Utiliser expected_value comme dans le schéma SQL
          created_at: new Date().toISOString()
        }));
        
        console.log('Données à insérer dans rice_impact_votes:', votesToInsert);
        
        const { error: insertError } = await this.supabaseClient!
          .from('rice_impact_votes')
          .insert(votesToInsert);
          
        if (insertError) {
          console.error('Erreur détaillée lors de l\'insertion:', insertError);
          throw insertError;
        }
      }
      
      // Récupérer tous les votes pour cette session pour construire l'ImpactVote
      const { data: allVotes, error: fetchError } = await this.supabaseClient!
        .from('rice_impact_votes')
        .select('*')
        .eq('session_id', sessionId);
        
      if (fetchError) throw fetchError;
      
      // Log pour le débogage
      console.log('Votes récupérés après insertion:', allVotes);
      
      // Créer une Map pour regrouper les votes par participant
      const votesByParticipant = new Map<string, { metricId: string; value: number }[]>();
      
      allVotes.forEach((vote: any) => {
        if (!votesByParticipant.has(vote.participant_id)) {
          votesByParticipant.set(vote.participant_id, []);
        }
        
        votesByParticipant.get(vote.participant_id)?.push({
          metricId: vote.kpi_id,
          value: vote.expected_value // Utiliser expected_value comme dans le schéma SQL
        });
      });
      
      // Construire l'objet ImpactVote
      const metricVotes: ImpactVote['metricVotes'] = [];
      votesByParticipant.forEach((metrics, participantId) => {
        metricVotes.push({
          participantId,
          metrics
        });
      });
      
      // Construire l'ensemble des KPIs sélectionnés
      const selectedKPIs = Array.from(
        new Set(allVotes.map((vote: any) => vote.kpi_id))
      );
      
      const impactVote: ImpactVote = {
        selectedKPIs,
        metricVotes
      };
      
      return impactVote;
    } catch (error) {
      console.error(`Error saving impact vote for session ${sessionId} in Supabase:`, error);
      throw error;
    }
  }

  // Enregistrer un vote pour les sources de confiance
  async saveConfidenceVote(
    sessionId: string,
    participantId: string,
    sources: string[]
  ): Promise<ConfidenceVote> {
    try {
      // Vérifier que le participant existe et le créer au besoin
      await this.ensureParticipantExists(sessionId, {
        id: participantId,
        name: "Anonymous User",
        role: "facilitator"
      });
      
      // Vérifier d'abord le schéma de la table
      try {
        const { data: tableInfo, error: tableError } = await this.supabaseClient!
          .from('rice_confidence_votes')
          .select('*')
          .limit(1);
          
        if (tableError) {
          console.error('Erreur lors de la vérification du schéma:', tableError);
          // Continuer malgré l'erreur
        } else if (tableInfo) {
          // Log les noms de colonnes pour le débogage
          console.log('Structure de la table rice_confidence_votes:', 
            tableInfo.length > 0 ? Object.keys(tableInfo[0]) : 'Pas de données');
        }
      } catch (e) {
        console.warn('Impossible de vérifier le schéma:', e);
      }
      
      // Supprimer les votes existants pour ce participant
      const { error: deleteError } = await this.supabaseClient!
        .from('rice_confidence_votes')
        .delete()
        .eq('session_id', sessionId)
        .eq('participant_id', participantId);
        
      if (deleteError) throw deleteError;
      
      // Insérer les nouveaux votes
      if (sources && sources.length > 0) {
        const votesToInsert = sources.map(sourceId => ({
          session_id: sessionId,
          participant_id: participantId,
          source_id: sourceId, // S'assurer que le nom de colonne est correct
          created_at: new Date().toISOString()
        }));
        
        const { error: insertError } = await this.supabaseClient!
          .from('rice_confidence_votes')
          .insert(votesToInsert);
          
        if (insertError) {
          console.error('Erreur détaillée lors de l\'insertion:', insertError);
          throw insertError;
        }
      }
      
      // Récupérer tous les votes pour cette session
      const { data: allVotes, error: fetchError } = await this.supabaseClient!
        .from('rice_confidence_votes')
        .select('*')
        .eq('session_id', sessionId);
        
      if (fetchError) throw fetchError;
      
      // Créer une Map pour regrouper les votes par participant
      const votesByParticipant = new Map<string, string[]>();
      
      allVotes.forEach((vote: any) => {
        if (!votesByParticipant.has(vote.participant_id)) {
          votesByParticipant.set(vote.participant_id, []);
        }
        
        votesByParticipant.get(vote.participant_id)?.push(vote.source_id);
      });
      
      // Construire l'objet ConfidenceVote
      const participantVotes: ConfidenceVote['votes'] = [];
      votesByParticipant.forEach((sourceIds, participantId) => {
        participantVotes.push({
          participantId,
          sources: sourceIds
        });
      });
      
      // Construire l'ensemble des sources sélectionnées
      const selectedSources = Array.from(
        new Set(allVotes.map((vote: any) => vote.source_id))
      );
      
      const confidenceVote: ConfidenceVote = {
        selectedSources,
        votes: participantVotes
      };
      
      return confidenceVote;
    } catch (error) {
      console.error(`Error saving confidence vote for session ${sessionId} in Supabase:`, error);
      throw error;
    }
  }
  
  // Enregistrer un vote pour l'effort
  async saveEffortVote(
    sessionId: string,
    participantId: string,
    devEffort: string,
    designEffort: string
  ): Promise<EffortVote> {
    try {
      // Vérifier que le participant existe et le créer au besoin
      await this.ensureParticipantExists(sessionId, {
        id: participantId,
        name: "Anonymous User",
        role: "facilitator"
      });
      
      // Log pour le débogage - vérifie si les valeurs sont déjà des UUID
      console.log('Enregistrement de vote effort pour session', sessionId);
      console.log('devEffort:', devEffort, 'designEffort:', designEffort);
      
      // Vérifie si les valeurs passées sont des UUID - si non, tente de trouver les IDs correspondants
      const isUUID = (value: string) => 
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
      
      let devSizeId = devEffort;
      let designSizeId = designEffort;
      
      // Si les valeurs ne sont pas des UUID, recherche les IDs correspondants dans la table rice_effort_sizes
      if (!isUUID(devEffort) || !isUUID(designEffort)) {
        // Récupérer d'abord la session pour obtenir settings_id
        const { data: sessionData, error: sessionError } = await this.supabaseClient!
          .from('rice_sessions')
          .select('settings_id')
          .eq('id', sessionId)
          .single();
          
        if (sessionError) {
          console.error('Erreur lors de la récupération du settings_id:', sessionError);
          throw sessionError;
        }
        
        const settingsId = sessionData.settings_id;
        console.log('Settings ID pour la session:', settingsId);
        
        // Récupérer les tailles d'effort pour ce settings_id
        const { data: effortSizes, error: sizesError } = await this.supabaseClient!
          .from('rice_effort_sizes')
          .select('id, name')
          .eq('settings_id', settingsId);
          
        if (sizesError) {
          console.error('Erreur lors de la récupération des tailles d\'effort:', sizesError);
          throw sizesError;
        }
        
        console.log('Tailles d\'effort disponibles:', effortSizes);
        
        // Trouver les IDs correspondants
        if (!isUUID(devEffort)) {
          const devSize = effortSizes.find((size: any) => size.name === devEffort);
          if (devSize) {
            devSizeId = devSize.id;
            console.log(`Trouvé dev ID pour "${devEffort}":`, devSizeId);
          } else {
            console.error(`Impossible de trouver l'ID pour la taille de dev "${devEffort}"`);
            throw new Error(`Taille de développement "${devEffort}" non trouvée`);
          }
        }
        
        if (!isUUID(designEffort)) {
          const designSize = effortSizes.find((size: any) => size.name === designEffort);
          if (designSize) {
            designSizeId = designSize.id;
            console.log(`Trouvé design ID pour "${designEffort}":`, designSizeId);
          } else {
            console.error(`Impossible de trouver l'ID pour la taille de design "${designEffort}"`);
            throw new Error(`Taille de design "${designEffort}" non trouvée`);
          }
        }
      }
      
      // Vérifier si le participant a déjà voté
      const { data: existingVotes, error: selectError } = await this.supabaseClient!
        .from('rice_effort_votes')
        .select('*')
        .eq('session_id', sessionId)
        .eq('participant_id', participantId);
        
      if (selectError) throw selectError;
      
      // Mettre à jour ou insérer le vote
      if (existingVotes && existingVotes.length > 0) {
        const { error: updateError } = await this.supabaseClient!
          .from('rice_effort_votes')
          .update({
            dev_size_id: devSizeId,
            design_size_id: designSizeId,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingVotes[0].id);
          
        if (updateError) {
          console.error('Erreur détaillée lors de la mise à jour:', updateError);
          throw updateError;
        }
      } else {
        const voteData = {
          session_id: sessionId,
          participant_id: participantId,
          dev_size_id: devSizeId,
          design_size_id: designSizeId,
          created_at: new Date().toISOString()
        };
        
        console.log('Données à insérer:', voteData);
        
        const { error: insertError } = await this.supabaseClient!
          .from('rice_effort_votes')
          .insert(voteData);
          
        if (insertError) {
          console.error('Erreur détaillée lors de l\'insertion:', insertError);
          throw insertError;
        }
      }
      
      // Récupérer tous les votes pour cette session
      const { data: allVotes, error: fetchError } = await this.supabaseClient!
        .from('rice_effort_votes')
        .select('*')
        .eq('session_id', sessionId);
        
      if (fetchError) throw fetchError;
      
      // Construire l'objet EffortVote
      const votes = allVotes.map((vote: any) => ({
        participantId: vote.participant_id,
        devEffort: vote.dev_size_id,
        designEffort: vote.design_size_id
      }));
      
      const effortVote: EffortVote = { votes };
      
      return effortVote;
    } catch (error) {
      console.error(`Error saving effort vote for session ${sessionId} in Supabase:`, error);
      throw error;
    }
  }

  // Mapper les données de la base de données vers le format de l'application
  private mapDbSessionToApp(dbSession: any): RiceSession {
    return {
      id: dbSession.id,
      name: dbSession.name,
      settingsId: dbSession.settings_id,
      status: dbSession.status as 'draft' | 'active' | 'completed',
      createdAt: new Date(dbSession.created_at),
      updatedAt: new Date(dbSession.updated_at),
      participants: dbSession.rice_participants ? dbSession.rice_participants.map((p: any) => ({
        id: p.id,
        name: p.name,
        role: p.role as 'facilitator' | 'voter',
        joinedAt: new Date(p.joined_at)
      })) : [],
      results: dbSession.results
    };
  }

  // Construire une session complète avec les votes
  private buildFullSession(
    dbSession: any,
    reachVotes: any[],
    impactVotes: any[],
    confidenceVotes: any[],
    effortVotes: any[]
  ): RiceSession {
    // Construire la session de base
    const session: RiceSession = {
      id: dbSession.id,
      name: dbSession.name,
      settingsId: dbSession.settings_id,
      status: dbSession.status as 'draft' | 'active' | 'completed',
      createdAt: new Date(dbSession.created_at),
      updatedAt: new Date(dbSession.updated_at),
      participants: dbSession.rice_participants ? dbSession.rice_participants.map((p: any) => ({
        id: p.id,
        name: p.name,
        role: p.role as 'facilitator' | 'voter',
        joinedAt: new Date(p.joined_at)
      })) : [],
      results: dbSession.results
    };
    
    // Ajouter les votes de portée
    if (reachVotes.length > 0) {
      session.reach = {
        categoryId: reachVotes[0].category_id,
        categoryValue: 0, // À remplir à partir des paramètres
        votes: reachVotes.map(v => ({
          participantId: v.participant_id,
          value: v.value
        })),
        finalValue: dbSession.reach_final_value
      };
    }
    
    return session;
  }

  // Mettre à jour les participants
  private async updateParticipants(sessionId: string, participants: Participant[]): Promise<void> {
    try {
      // Récupérer les participants existants
      const { data: existingParticipants, error: selectError } = await this.supabaseClient!
        .from('rice_participants')
        .select('*')
        .eq('session_id', sessionId);
        
      if (selectError) throw selectError;
      
      // Supprimer les participants qui ne sont plus présents
      const existingIds = existingParticipants.map((p: any) => p.id);
      const newIds = participants.filter(p => p.id).map(p => p.id);
      
      const idsToDelete = existingIds.filter((id: string) => !newIds.includes(id));
      if (idsToDelete.length > 0) {
        const { error } = await this.supabaseClient!
          .from('rice_participants')
          .delete()
          .in('id', idsToDelete);
          
        if (error) throw error;
      }
      
      // Mise à jour des participants existants
      for (const participant of participants) {
        if (participant.id && existingIds.includes(participant.id)) {
          const { error } = await this.supabaseClient!
            .from('rice_participants')
            .update({
              name: participant.name,
              role: participant.role
            })
            .eq('id', participant.id);
            
          if (error) throw error;
        } else if (!participant.id) {
          // Ajouter les nouveaux participants
          await this.addParticipant(sessionId, participant);
        }
      }
    } catch (error) {
      console.error(`Error updating participants for session ${sessionId} in Supabase:`, error);
      throw error;
    }
  }

  // Mettre à jour les votes de portée
  private async updateReachVotes(sessionId: string, reachVote: ReachVote): Promise<void> {
    try {
      // Mettre à jour la valeur finale si définie
      if (reachVote.finalValue !== undefined) {
        const { error } = await this.supabaseClient!
          .from('rice_sessions')
          .update({
            reach_final_value: reachVote.finalValue
          })
          .eq('id', sessionId);
          
        if (error) throw error;
      }
      
      // Mettre à jour les votes individuels
      for (const vote of reachVote.votes) {
        await this.saveReachVote(sessionId, vote.participantId, reachVote.categoryId, vote.value);
      }
    } catch (error) {
      console.error(`Error updating reach votes for session ${sessionId} in Supabase:`, error);
      throw error;
    }
  }

  // Mettre à jour les votes d'impact, de confiance et d'effort
  private async updateImpactVotes(sessionId: string, impactVote: ImpactVote): Promise<void> {
    // Implémentation simplifiée
    try {
      console.log(`Updating impact votes for session ${sessionId}`);
    } catch (error) {
      console.error(`Error updating impact votes for session ${sessionId}:`, error);
      throw error;
    }
  }

  private async updateConfidenceVotes(sessionId: string, confidenceVote: ConfidenceVote): Promise<void> {
    // Implémentation simplifiée
    try {
      console.log(`Updating confidence votes for session ${sessionId}`);
    } catch (error) {
      console.error(`Error updating confidence votes for session ${sessionId}:`, error);
      throw error;
    }
  }

  private async updateEffortVotes(sessionId: string, effortVote: EffortVote): Promise<void> {
    // Implémentation simplifiée
    try {
      console.log(`Updating effort votes for session ${sessionId}`);
    } catch (error) {
      console.error(`Error updating effort votes for session ${sessionId}:`, error);
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
        return this.createSession(session);
      }
    } catch (error) {
      console.error('Error saving RICE session in Supabase:', error);
      throw error;
    }
  }

  /**
   * Calcule et enregistre le score RICE basé sur tous les votes d'une session
   * @param sessionId L'ID de la session
   * @returns L'objet résumé des scores RICE
   */
  async calculateAndSaveRiceScore(sessionId: string): Promise<{
    reach: number;
    impact: number;
    confidence: number;
    effort: number;
    rice: number;
  }> {
    try {
      console.log(`Début du calcul du score RICE pour la session ${sessionId}`);
      
      // Récupérer la session
      const session = await this.getSessionById(sessionId);
      if (!session) {
        console.error(`Session avec ID ${sessionId} non trouvée`);
        throw new Error(`Session avec ID ${sessionId} non trouvée`);
      }
      
      console.log(`Session récupérée:`, { 
        id: session.id, 
        settingsId: session.settingsId, 
        name: session.name, 
        status: session.status 
      });
      
      // Récupérer les paramètres RICE
      const { data: settingsData, error: settingsError } = await this.supabaseClient!
        .from('rice_settings')
        .select('*')
        .eq('id', session.settingsId)
        .single();
        
      if (settingsError) {
        console.error(`Erreur lors de la récupération des paramètres:`, settingsError);
        throw settingsError;
      }
      
      console.log(`Paramètres RICE récupérés:`, { 
        id: settingsData.id, 
        name: settingsData.name 
      });
      
      // 1. Calculer le score de portée (Reach)
      let reachScore = 0;
      
      // Récupérer les votes de reach sans la jointure qui peut échouer
      const { data: reachVotes, error: reachError } = await this.supabaseClient!
        .from('rice_reach_votes')
        .select(`
          id,
          value,
          category_id,
          participant_id
        `)
        .eq('session_id', sessionId);
        
      if (reachError) {
        console.error(`Erreur lors de la récupération des votes de portée:`, reachError);
        throw reachError;
      }
      
      console.log(`Votes de portée récupérés:`, reachVotes ? reachVotes.length : 0);
      
      if (reachVotes && reachVotes.length > 0) {
        // Calcul simple : moyenne des valeurs
        const totalValue = reachVotes.reduce((sum, vote) => sum + parseFloat(String(vote.value || 0)), 0);
        reachScore = totalValue / reachVotes.length;
        console.log(`Score de portée calculé: ${reachScore} (moyenne de ${totalValue} pour ${reachVotes.length} votes)`);
      } else {
        reachScore = 1; // Valeur par défaut
        console.log(`Score de portée par défaut: ${reachScore}`);
      }
      
      // 2. Calculer le score d'impact
      let impactScore = 0;
      
      // Récupérer les votes d'impact sans la jointure qui peut échouer
      const { data: impactVotes, error: impactError } = await this.supabaseClient!
        .from('rice_impact_votes')
        .select(`
          id,
          expected_value,
          kpi_id,
          participant_id
        `)
        .eq('session_id', sessionId);
        
      if (impactError) {
        console.error(`Erreur lors de la récupération des votes d'impact:`, impactError);
        throw impactError;
      }
      
      // Récupérer tous les KPIs pour pouvoir faire le matching manuellement
      const { data: allKpis, error: kpisError } = await this.supabaseClient!
        .from('rice_impact_kpis')
        .select('*');
        
      if (kpisError) {
        console.error(`Erreur lors de la récupération des KPIs:`, kpisError);
        throw kpisError;
      }
      
      console.log(`Votes d'impact récupérés:`, impactVotes ? impactVotes.length : 0);
      console.log(`KPIs récupérés:`, allKpis ? allKpis.length : 0);
      
      if (impactVotes && impactVotes.length > 0 && allKpis && allKpis.length > 0) {
        // Regrouper les votes par KPI
        const votesByKpi = new Map<string, number[]>();
        
        impactVotes.forEach(vote => {
          const kpiId = String(vote.kpi_id || '');
          if (kpiId && !votesByKpi.has(kpiId)) {
            votesByKpi.set(kpiId, []);
          }
          
          if (kpiId) {
            const expectedValue = parseFloat(String(vote.expected_value || 0));
            votesByKpi.get(kpiId)?.push(expectedValue);
          }
        });
        
        // Coefficients de pondération par catégorie de KPI
        const impactWeights: Record<string, number> = { cvr: 0.4, revenue: 0.3, behavior: 0.3 };
        
        // Scores par catégorie pour le log
        const categoryScores: Record<string, number> = { cvr: 0, revenue: 0, behavior: 0 };
        const categoryKpis: Record<string, number> = { cvr: 0, revenue: 0, behavior: 0 };
        
        // Calculer la moyenne par KPI, appliquer la pondération, puis faire la somme
        let totalWeightedScore = 0;
        
        votesByKpi.forEach((values, kpiId) => {
          // Trouver le KPI correspondant
          const kpi = allKpis.find(k => k.id === kpiId);
          
          if (kpi) {
            // Calculer la moyenne des votes pour ce KPI
            const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length;
            
            // Multiplier par les points par unité
            const pointsPerUnit = parseFloat(kpi.points_per_unit || 0);
            const kpiScore = avgValue * pointsPerUnit;
            
            // Déterminer la catégorie du KPI
            let category = 'cvr'; // Par défaut, considérer comme une métrique de conversion
            
            if (kpi.is_behavior_metric) {
              category = 'behavior';
            } else if (kpi.name.toLowerCase().includes('revenue') || 
                       kpi.name.toLowerCase().includes('revenu') ||
                       kpi.name.toLowerCase().includes('chiffre')) {
              category = 'revenue';
            }
            
            // Appliquer la pondération
            const weightedKpiScore = kpiScore * impactWeights[category];
            
            // Mettre à jour les scores par catégorie pour le log
            categoryScores[category] += weightedKpiScore;
            categoryKpis[category]++;
            
            totalWeightedScore += weightedKpiScore;
            
            console.log(`KPI ${kpi.name} (${category}): moyenne=${avgValue}, points=${pointsPerUnit}, score=${kpiScore}, pondéré=${weightedKpiScore}`);
          }
        });
        
        // Le score d'impact est la somme des scores pondérés de chaque KPI
        impactScore = totalWeightedScore;
        
        console.log(`Score d'impact calculé: ${impactScore}`);
        console.log(`Répartition par catégorie:`);
        console.log(`- CVR: ${categoryScores.cvr.toFixed(2)} (${categoryKpis.cvr} KPIs)`);
        console.log(`- Revenue: ${categoryScores.revenue.toFixed(2)} (${categoryKpis.revenue} KPIs)`);
        console.log(`- Behavior: ${categoryScores.behavior.toFixed(2)} (${categoryKpis.behavior} KPIs)`);
      } else {
        impactScore = 3; // Valeur par défaut
        console.log(`Score d'impact par défaut: ${impactScore}`);
      }
      
      // 3. Calculer le score de confiance
      let confidenceScore = 0;
      
      // Récupérer les votes de confiance sans la jointure qui peut échouer
      const { data: confidenceVotes, error: confidenceError } = await this.supabaseClient!
        .from('rice_confidence_votes')
        .select(`
          id,
          source_id,
          participant_id
        `)
        .eq('session_id', sessionId);
        
      if (confidenceError) {
        console.error(`Erreur lors de la récupération des votes de confiance:`, confidenceError);
        throw confidenceError;
      }
      
      // Récupérer toutes les sources de confiance pour faire le matching manuellement
      const { data: allSources, error: sourcesError } = await this.supabaseClient!
        .from('rice_confidence_sources')
        .select('*');
        
      if (sourcesError) {
        console.error(`Erreur lors de la récupération des sources de confiance:`, sourcesError);
        throw sourcesError;
      }
      
      console.log(`Votes de confiance récupérés:`, confidenceVotes ? confidenceVotes.length : 0);
      console.log(`Sources de confiance récupérées:`, allSources ? allSources.length : 0);
      
      if (confidenceVotes && confidenceVotes.length > 0 && allSources && allSources.length > 0) {
        // Grouper les votes par participant
        const votesByParticipant = new Map<string, string[]>();
        
        confidenceVotes.forEach(vote => {
          const participantId = String(vote.participant_id || '');
          const sourceId = String(vote.source_id || '');
          
          if (participantId && sourceId) {
            if (!votesByParticipant.has(participantId)) {
              votesByParticipant.set(participantId, []);
            }
            
            votesByParticipant.get(participantId)?.push(sourceId);
          }
        });
        
        // Calculer les points de confiance pour chaque participant
        const participantScores: number[] = [];
        
        votesByParticipant.forEach((sourceIds, participantId) => {
          let participantPoints = 0;
          
          // Additionner les points de toutes les sources sélectionnées par ce participant
          sourceIds.forEach(sourceId => {
            const source = allSources.find(s => s.id === sourceId);
            if (source) {
              participantPoints += parseFloat(String(source.points || 0));
            }
          });
          
          // Ajouter le score total de ce participant au tableau
          participantScores.push(participantPoints);
          
          console.log(`Participant ${participantId}: ${sourceIds.length} sources, score total: ${participantPoints} points`);
        });
        
        // Calculer la moyenne des scores entre participants
        if (participantScores.length > 0) {
          // Si un seul participant, utiliser son score
          if (participantScores.length === 1) {
            confidenceScore = participantScores[0] / 10; // Diviser par 10 pour avoir une valeur entre 0 et 1
          } else {
            // Sinon, calculer la moyenne des scores de tous les participants
            const totalScore = participantScores.reduce((sum, score) => sum + score, 0);
            const avgScore = totalScore / participantScores.length;
            confidenceScore = avgScore / 10; // Diviser par 10 pour avoir une valeur entre 0 et 1
          }
          
          console.log(`Score de confiance calculé: ${confidenceScore} (Scores des participants: ${participantScores.join(', ')})`);
        } else {
          confidenceScore = 0.8; // Valeur par défaut
          console.log(`Score de confiance par défaut: ${confidenceScore} (Aucun participant avec votes)`);
        }
      } else {
        confidenceScore = 0.8; // Valeur par défaut (80%)
        console.log(`Score de confiance par défaut: ${confidenceScore} (Aucun vote de confiance ou source trouvée)`);
      }
      
      // 4. Calculer le score d'effort
      let effortScore = 0;
      
      // Récupérer les votes d'effort sans la jointure qui peut échouer
      const { data: effortVotes, error: effortError } = await this.supabaseClient!
        .from('rice_effort_votes')
        .select(`
          id,
          dev_size_id,
          design_size_id,
          participant_id
        `)
        .eq('session_id', sessionId);
        
      if (effortError) {
        console.error(`Erreur lors de la récupération des votes d'effort:`, effortError);
        throw effortError;
      }
      
      // Récupérer toutes les tailles d'effort pour faire le matching manuellement
      const { data: allEffortSizes, error: effortSizesError } = await this.supabaseClient!
        .from('rice_effort_sizes')
        .select('*');
        
      if (effortSizesError) {
        console.error(`Erreur lors de la récupération des tailles d'effort:`, effortSizesError);
        throw effortSizesError;
      }
      
      console.log(`Votes d'effort récupérés:`, effortVotes ? effortVotes.length : 0);
      console.log(`Tailles d'effort récupérées:`, allEffortSizes ? allEffortSizes.length : 0);
      
      if (effortVotes && effortVotes.length > 0 && allEffortSizes && allEffortSizes.length > 0) {
        let totalEffort = 0;
        let validVotes = 0;
        
        effortVotes.forEach(vote => {
          const devSizeId = String(vote.dev_size_id || '');
          const designSizeId = String(vote.design_size_id || '');
          
          // Trouver les tailles correspondantes
          const devSize = allEffortSizes.find(s => s.id === devSizeId);
          const designSize = allEffortSizes.find(s => s.id === designSizeId);
          
          if (devSize && designSize) {
            const devEffort = parseFloat(String(devSize.dev_effort || 0));
            const designEffort = parseFloat(String(designSize.design_effort || 0));
            
            // Somme des efforts pour ce vote
            const voteEffort = devEffort + designEffort;
            totalEffort += voteEffort;
            validVotes++;
            
            console.log(`Vote effort: dev=${devEffort}, design=${designEffort}, total=${voteEffort}`);
          }
        });
        
        if (validVotes > 0) {
          // Moyenne de tous les votes d'effort
          effortScore = totalEffort / validVotes;
          console.log(`Score d'effort calculé: ${effortScore} (total: ${totalEffort}, votes: ${validVotes})`);
        } else {
          effortScore = 1; // Valeur par défaut
          console.log(`Score d'effort par défaut: ${effortScore}`);
        }
      } else {
        effortScore = 1; // Valeur par défaut
        console.log(`Score d'effort par défaut: ${effortScore}`);
      }
      
      // S'assurer qu'aucun score n'est zéro pour éviter les divisions par zéro
      reachScore = reachScore || 1;
      impactScore = impactScore || 1;
      confidenceScore = confidenceScore || 0.1;
      effortScore = effortScore || 1;
      
      // Calculer le score RICE final: (Reach × Impact × Confidence) ÷ Effort
      const riceScore = (reachScore * impactScore * confidenceScore) / effortScore;
      console.log(`Score RICE calculé: (${reachScore} × ${impactScore} × ${confidenceScore}) ÷ ${effortScore} = ${riceScore}`);
      
      // Arrondir les valeurs pour l'affichage
      const finalScores = {
        reach: parseFloat(reachScore.toFixed(2)),
        impact: parseFloat(impactScore.toFixed(2)),
        confidence: parseFloat(confidenceScore.toFixed(2)),
        effort: parseFloat(effortScore.toFixed(2)),
        rice: parseFloat(riceScore.toFixed(2))
      };
      
      console.log('Scores RICE finaux:', finalScores);
      
      // Enregistrer les résultats dans la table rice_results_summary
      try {
        const { data: existingSummary, error: checkError } = await this.supabaseClient!
          .from('rice_results_summary')
          .select('id')
          .eq('session_id', sessionId)
          .single();
          
        if (checkError && checkError.code !== 'PGRST116') {
          console.error(`Erreur lors de la vérification du résumé existant:`, checkError);
          throw checkError;
        }
        
        console.log(`Résumé existant:`, existingSummary);
        
        if (existingSummary) {
          // Mettre à jour le résumé existant
          const { data: updateData, error: updateError } = await this.supabaseClient!
            .from('rice_results_summary')
            .update({
              reach_score: finalScores.reach,
              impact_score: finalScores.impact,
              confidence_score: finalScores.confidence,
              effort_score: finalScores.effort,
              rice_score: finalScores.rice,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingSummary.id)
            .select();
            
          if (updateError) {
            console.error(`Erreur lors de la mise à jour du résumé:`, updateError);
            throw updateError;
          }
          
          console.log(`Résumé mis à jour:`, updateData);
        } else {
          // Créer un nouveau résumé
          const insertData = {
            session_id: sessionId,
            reach_score: finalScores.reach,
            impact_score: finalScores.impact,
            confidence_score: finalScores.confidence,
            effort_score: finalScores.effort,
            rice_score: finalScores.rice
          };
          
          console.log(`Données à insérer dans rice_results_summary:`, insertData);
          
          try {
            const { data: insertedData, error: insertError } = await this.supabaseClient!
              .from('rice_results_summary')
              .insert(insertData)
              .select();
              
            if (insertError) {
              // Si l'erreur est une violation de contrainte d'unicité (doublon session_id),
              // on essaie de faire une mise à jour à la place
              if (insertError.code === '23505') {
                console.log("Contrainte d'unicité détectée, tentative de mise à jour...");
                const { data: updateData, error: updateError } = await this.supabaseClient!
                  .from('rice_results_summary')
                  .update({
                    reach_score: finalScores.reach,
                    impact_score: finalScores.impact,
                    confidence_score: finalScores.confidence,
                    effort_score: finalScores.effort,
                    rice_score: finalScores.rice,
                    updated_at: new Date().toISOString()
                  })
                  .eq('session_id', sessionId)
                  .select();
                  
                if (updateError) {
                  console.error(`Erreur lors de la mise à jour après doublon:`, updateError);
                  throw updateError;
                }
                
                console.log(`Résumé mis à jour après détection de doublon:`, updateData);
              } else {
                console.error(`Erreur lors de l'insertion du résumé:`, insertError);
                throw insertError;
              }
            } else {
              console.log(`Nouveau résumé inséré:`, insertedData);
            }
          } catch (insertOrUpdateError) {
            console.error(`Erreur lors de l'insertion/mise à jour du résumé:`, insertOrUpdateError);
            // Récupérer les résultats existants même en cas d'erreur
            const { data: existingData } = await this.supabaseClient!
              .from('rice_results_summary')
              .select('*')
              .eq('session_id', sessionId)
              .single();
              
            if (existingData) {
              console.log(`Données existantes récupérées malgré l'erreur:`, existingData);
            } else {
              throw insertOrUpdateError;
            }
          }
        }
        
        // Mettre à jour également la session principale pour refléter les résultats
        const { data: sessionUpdateData, error: sessionUpdateError } = await this.supabaseClient!
          .from('rice_sessions')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId)
          .select();
          
        if (sessionUpdateError) {
          console.error(`Erreur lors de la mise à jour du statut de la session:`, sessionUpdateError);
          throw sessionUpdateError;
        }
        
        console.log(`Session mise à jour:`, sessionUpdateData);
      } catch (dbError) {
        console.error(`Erreur lors de l'enregistrement des résultats:`, dbError);
        // Continuer et retourner les scores calculés malgré l'erreur de sauvegarde
      }
      
      return finalScores;
    } catch (error) {
      console.error(`Erreur lors du calcul du score RICE pour la session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Récupère des seuils dynamiques basés sur l'historique des scores RICE
   * @returns Un objet contenant les seuils haut et moyen basés sur les percentiles
   */
  async getDynamicThresholds(): Promise<{ highThreshold: number; mediumThreshold: number }> {
    try {
      console.log('Récupération des seuils dynamiques basés sur l\'historique des scores RICE');
      
      // Récupérer tous les scores RICE des sessions précédentes
      const { data: pastScores, error } = await this.checkSupabase()
        .from('rice_results_summary')
        .select('rice_score')
        .order('rice_score', { ascending: false });
        
      if (error) {
        console.error('Erreur lors de la récupération des scores historiques:', error);
        // Retourner les seuils par défaut en cas d'erreur
        return { highThreshold: 3.0, mediumThreshold: 1.5 };
      }
      
      // Si nous avons moins de 3 scores historiques, utiliser les seuils par défaut
      if (!pastScores || pastScores.length < 3) {
        console.log('Pas assez de données historiques, utilisation des seuils par défaut');
        return { highThreshold: 3.0, mediumThreshold: 1.5 };
      }
      
      // Extraire les scores et les trier par ordre décroissant
      const scores = pastScores.map(record => record.rice_score).sort((a, b) => b - a);
      
      console.log(`Scores historiques triés (${scores.length} scores):`, scores);
      
      // Calculer les percentiles pour les seuils
      // Utiliser le 75e percentile pour le seuil élevé
      // Utiliser le 50e percentile pour le seuil moyen
      const highIndex = Math.floor(scores.length * 0.25);  // Top 25%
      const mediumIndex = Math.floor(scores.length * 0.5); // Top 50%
      
      const highThreshold = scores[highIndex] || 3.0;
      const mediumThreshold = scores[mediumIndex] || 1.5;
      
      console.log(`Seuils dynamiques calculés: haut=${highThreshold}, moyen=${mediumThreshold}`);
      
      return {
        highThreshold: parseFloat(highThreshold.toFixed(2)),
        mediumThreshold: parseFloat(mediumThreshold.toFixed(2))
      };
    } catch (error) {
      console.error('Erreur lors du calcul des seuils dynamiques:', error);
      // Retourner les seuils par défaut en cas d'erreur
      return { highThreshold: 3.0, mediumThreshold: 1.5 };
    }
  }

  /**
   * Détermine le niveau de priorité selon des seuils dynamiques
   * @param riceScore Le score RICE à évaluer
   * @returns Une chaîne indiquant le niveau de priorité
   */
  async getPriorityLevel(riceScore: number): Promise<{ level: string; thresholds: { high: number; medium: number } }> {
    const { highThreshold, mediumThreshold } = await this.getDynamicThresholds();
    
    let level = "Low Priority";
    if (riceScore >= highThreshold) {
      level = "High Priority";
    } else if (riceScore >= mediumThreshold) {
      level = "Medium Priority";
    }
    
    return { 
      level, 
      thresholds: { 
        high: highThreshold, 
        medium: mediumThreshold 
      }
    };
  }

  /**
   * Récupère tous les scores RICE historiques pour l'affichage en graphique
   * @returns Un tableau d'objets contenant les données pour le graphique
   */
  async getAllRiceScoresForChart(): Promise<Array<{
    id: string;
    name: string;
    reach: number;
    impact: number;
    confidence: number;
    effort: number;
    rice: number;
    impactScore: number; // R*I*C pour le graphique
    created_at: string;
  }>> {
    try {
      // Récupérer les résumés RICE et les informations de session associées
      const { data, error } = await this.checkSupabase()
        .from('rice_results_summary')
        .select(`
          *,
          rice_sessions(id, name)
        `)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Erreur lors de la récupération des scores pour le graphique:', error);
        throw error;
      }
      
      // Transformer les données pour le graphique
      const chartData = data.map(item => ({
        id: item.session_id,
        name: item.rice_sessions ? item.rice_sessions.name : `Session ${item.session_id.substring(0, 8)}`,
        reach: item.reach_score || 0,
        impact: item.impact_score || 0,
        confidence: item.confidence_score || 0,
        effort: item.effort_score || 0,
        rice: item.rice_score || 0,
        impactScore: (item.reach_score * item.impact_score * item.confidence_score) || 0, // R*I*C pour l'axe Y
        created_at: item.created_at
      }));
      
      return chartData;
    } catch (error) {
      console.error('Erreur lors de la récupération des données pour le graphique:', error);
      return [];
    }
  }
}

// Exportation d'une instance unique du service
export const supabaseRiceSessionService = new SupabaseRiceSessionService();
export default supabaseRiceSessionService; 