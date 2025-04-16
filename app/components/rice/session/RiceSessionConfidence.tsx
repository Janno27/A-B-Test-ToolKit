"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Eye,
  EyeOff,
  CheckCircle2,
  Users,
  X,
  Info
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRiceSettingsService } from '../../../hooks/useRiceSettingsService';
import { RiceSettings, ConfidenceSource } from '../../../types/RiceServiceTypes';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from "@/hooks/use-toast";
import supabaseRiceSessionService from '../../../services/db/SupabaseRiceSessionService';

interface Participant {
  id: string;
  name: string;
  role: "host" | "participant";
  avatar?: string;
}

interface ConfidenceVote {
  userId: string;
  sourceId: string;
}

interface RiceSessionConfidenceProps {
  sessionId: string;
  onBack: () => void;
  onNext: () => void;
}

export default function RiceSessionConfidence({ sessionId, onBack, onNext }: RiceSessionConfidenceProps) {
  const [currentUser, setCurrentUser] = useState<Participant | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [confidenceSources, setConfidenceSources] = useState<ConfidenceSource[]>([]);
  const [votes, setVotes] = useState<ConfidenceVote[]>([]);
  const [userSources, setUserSources] = useState<string[]>([]);
  const [showVotes, setShowVotes] = useState<boolean>(false);
  const [voteSubmitted, setVoteSubmitted] = useState<boolean>(false);
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  // Utiliser le hook pour accéder au service RICE
  const { service, isLoading: isServiceLoading, error: serviceError } = useRiceSettingsService();
  const { toast } = useToast();
  
  // Simuler le chargement des données depuis localStorage
  useEffect(() => {
    // Charger l'utilisateur actuel
    const storedUser = localStorage.getItem(`rice_session_${sessionId}_user`);
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    
    // Charger les participants
    const storedParticipants = localStorage.getItem(`rice_session_${sessionId}_participants`);
    if (storedParticipants) {
      setParticipants(JSON.parse(storedParticipants));
    }
    
    // Récupérer les sources de confiance depuis Supabase
    const fetchConfidenceSources = async () => {
      setIsLoading(true);
      try {
        if (service) {
          // ID des paramètres par défaut
          const defaultId = '00000000-0000-0000-0000-000000000001';
          const settings = await service.getSettingsById(defaultId);
          
          if (settings && settings.confidenceSources && settings.confidenceSources.length > 0) {
            console.log('RiceSessionConfidence: Sources de confiance récupérées depuis Supabase:', settings.confidenceSources);
            setConfidenceSources(settings.confidenceSources);
          } else {
            console.warn('RiceSessionConfidence: Aucune source de confiance trouvée dans Supabase, utilisation des valeurs par défaut');
            // Valeurs par défaut en cas d'échec
            const defaultConfidenceSources: ConfidenceSource[] = [
              { id: "cs1", name: "Previous A/B Test", description: "Results from a previous test on similar feature", points: 2.5, example: "Similar test on collection page" },
              { id: "cs2", name: "Advanced Analytics (SQL/GA4)", description: "In-depth data analysis supporting the hypothesis", points: 2.0, example: "6-month funnel analysis" },
              { id: "cs3", name: "Baymard Benchmark", description: "Industry best practices from research institute", points: 1.5, example: "Checkout study 2024" },
              { id: "cs4", name: "User Testing (5+ participants)", description: "Feedback from moderated user testing sessions", points: 1.2, example: "Moderated session DE/FR" },
              { id: "cs5", name: "Verified Competitor Copy", description: "Evidence that competitors use similar features successfully", points: 0.8, example: "Analysis of 3 market leaders" },
              { id: "cs6", name: "Heuristic Audit", description: "Expert review based on usability principles", points: 0.5, example: "WCAG compliance review" }
            ];
            setConfidenceSources(defaultConfidenceSources);
          }
        }
      } catch (error) {
        console.error('RiceSessionConfidence: Erreur lors du chargement des sources de confiance:', error);
        // Utiliser les valeurs par défaut en cas d'erreur
        const defaultConfidenceSources: ConfidenceSource[] = [
          { id: "cs1", name: "Previous A/B Test", description: "Results from a previous test on similar feature", points: 2.5, example: "Similar test on collection page" },
          { id: "cs2", name: "Advanced Analytics (SQL/GA4)", description: "In-depth data analysis supporting the hypothesis", points: 2.0, example: "6-month funnel analysis" },
          { id: "cs3", name: "Baymard Benchmark", description: "Industry best practices from research institute", points: 1.5, example: "Checkout study 2024" },
          { id: "cs4", name: "User Testing (5+ participants)", description: "Feedback from moderated user testing sessions", points: 1.2, example: "Moderated session DE/FR" },
          { id: "cs5", name: "Verified Competitor Copy", description: "Evidence that competitors use similar features successfully", points: 0.8, example: "Analysis of 3 market leaders" },
          { id: "cs6", name: "Heuristic Audit", description: "Expert review based on usability principles", points: 0.5, example: "WCAG compliance review" }
        ];
        setConfidenceSources(defaultConfidenceSources);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchConfidenceSources();
    
    // Charger les votes existants
    const storedVotes = localStorage.getItem(`rice_session_${sessionId}_confidence_votes`);
    if (storedVotes) {
      setVotes(JSON.parse(storedVotes));
      
      // Filtrer les votes de l'utilisateur actuel
      if (currentUser) {
        const userVotes = JSON.parse(storedVotes).filter(
          (vote: ConfidenceVote) => vote.userId === currentUser.id
        );
        setUserSources(userVotes.map((vote: ConfidenceVote) => vote.sourceId));
      }
    }
    
    // Simuler des mises à jour en temps réel (pourrait être remplacé par des webhooks ou des sockets)
    const interval = setInterval(() => {
      const storedVotes = localStorage.getItem(`rice_session_${sessionId}_confidence_votes`);
      if (storedVotes) {
        setVotes(JSON.parse(storedVotes));
      }
    }, 5000);
    
    return () => {
      clearInterval(interval);
    };
  }, [sessionId, service, currentUser?.id]);
  
  // Verify if the user has already voted when loading existing votes
  useEffect(() => {
    if (currentUser) {
      const userHasVoted = votes.some(vote => vote.userId === currentUser.id);
      setHasVoted(userHasVoted);
    }
  }, [currentUser, votes]);
  
  const toggleSource = (sourceId: string) => {
    if (userSources.includes(sourceId)) {
      // Retirer la source
      setUserSources(userSources.filter(id => id !== sourceId));
    } else {
      // Ajouter la source
      setUserSources([...userSources, sourceId]);
    }
  };
  
  const saveVotes = () => {
    if (!currentUser) return;
    
    // Supprimer les votes existants de l'utilisateur
    const otherVotes = votes.filter(vote => vote.userId !== currentUser.id);
    
    // Créer de nouveaux votes
    const newVotes = userSources.map(sourceId => ({
      userId: currentUser.id,
      sourceId
    }));
    
    // Combiner avec les votes existants
    const updatedVotes = [...otherVotes, ...newVotes];
    
    // Sauvegarder dans localStorage
    localStorage.setItem(`rice_session_${sessionId}_confidence_votes`, JSON.stringify(updatedVotes));
    
    // Mettre à jour l'état local
    setVotes(updatedVotes);
  };
  
  const handleVote = async () => {
    if (!currentUser || userSources.length === 0) return;
    
    // Enregistrer les votes localement d'abord
    saveVotes();
    
    // Préparer pour envoyer à Supabase
    setIsSaving(true);
    console.log("==== SAVING CONFIDENCE VOTES TO SUPABASE ====");
    console.log("sessionId:", sessionId);
    console.log("participantId:", currentUser.id);
    console.log("sources:", userSources);
    
    try {
      // Vérifier que le service Supabase est disponible
      if (!supabaseRiceSessionService) {
        console.error("Supabase Rice Session Service is not available");
        toast({
          title: "Erreur",
          description: "Le service de base de données n'est pas disponible",
          variant: "destructive"
        });
        return;
      }
      
      // Envoyer à Supabase
      const result = await supabaseRiceSessionService.saveConfidenceVote(
        sessionId,
        currentUser.id,
        userSources
      );
      
      console.log("Result from saveConfidenceVote:", result);
      
      toast({
        title: "Votes enregistrés",
        description: "Vos sources de confiance ont été sauvegardées",
        variant: "default"
      });
    } catch (error) {
      console.error("Error saving confidence votes to Supabase:", error);
      
      // Get a more descriptive error message
      let errorMessage = "Échec de l'enregistrement de vos votes";
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = `Erreur: ${(error as any).message}`;
      }
      
      console.error('Detailed error message:', errorMessage);
      
      // Try to extract Supabase error details if available
      if (error && typeof error === 'object' && 'code' in error) {
        console.error('Supabase error code:', (error as any).code);
        console.error('Supabase error details:', (error as any).details);
      }
      
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder vos sources. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
    
    // Feedback visuel pour l'utilisateur
    setVoteSubmitted(true);
    setHasVoted(true);
    
    // Réinitialiser après animation
    setTimeout(() => {
      setVoteSubmitted(false);
    }, 2000);
  };
  
  const calculateParticipantScore = (participantVotes: ConfidenceVote[]) => {
    let score = 0;
    
    // Calculer le score basé sur les sources sélectionnées
    participantVotes.forEach(vote => {
      const source = confidenceSources.find(s => s.id === vote.sourceId);
      if (source) {
        score += source.points;
      }
    });
    
    // Appliquer la règle de plafonnement à 5 points
    score = Math.min(score, 5);
    
    // Minimum 3 points si au moins une source
    if (participantVotes.length > 0 && score < 3) {
      score = 3;
    }
    
    return score;
  };
  
  const getTotalConfidenceScore = () => {
    if (votes.length === 0) return 0;
    
    // Grouper les votes par utilisateur
    const userVotesMap = new Map<string, ConfidenceVote[]>();
    votes.forEach(vote => {
      if (!userVotesMap.has(vote.userId)) {
        userVotesMap.set(vote.userId, []);
      }
      userVotesMap.get(vote.userId)?.push(vote);
    });
    
    // Calculer le score pour chaque utilisateur
    const userScores: number[] = [];
    
    userVotesMap.forEach(userVotes => {
      let score = 0;
      
      // Calculer le score basé sur les sources de confiance
      userVotes.forEach(vote => {
        const source = confidenceSources.find(s => s.id === vote.sourceId);
        if (source) {
          score += source.points;
        }
      });
      
      // Appliquer la règle spéciale: plafonnement à 5 points
      score = Math.min(score, 5);
      
      // Appliquer la règle spéciale: minimum 3 points si au moins une source
      if (userVotes.length > 0 && score < 3) {
        score = 3;
      }
      
      userScores.push(score);
    });
    
    // Moyenne de tous les scores des utilisateurs
    const total = userScores.reduce((acc, score) => acc + score, 0);
    return Math.round((total / userScores.length) * 100) / 100;
  };
  
  const canRevealVotes = () => {
    if (!currentUser || currentUser.role !== "host") return false;
    
    // Vérifier si tous les participants ont voté avec au moins une source
    const voterIdsWithSources = new Set();
    votes.forEach(vote => {
      voterIdsWithSources.add(vote.userId);
    });
    
    return participants.every(participant => voterIdsWithSources.has(participant.id));
  };
  
  // Calculer score utilisateur actuel
  const userScore = currentUser
    ? calculateParticipantScore(votes.filter(vote => vote.userId === currentUser.id))
    : 0;
    
  const totalScore = getTotalConfidenceScore();
  const isHost = currentUser?.role === "host";
  
  return (
    <Card className="p-6 max-w-3xl mx-auto">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold leading-tight mb-1">Confidence Evaluation</h2>
          <p className="text-sm text-muted-foreground">
            How confident are we in our predictions? Select evidence sources that support your impact claims.
          </p>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm">
            <Users className="h-4 w-4 mr-1" />
            <span>{participants.length} Participants</span>
          </div>
          
          {isHost && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowVotes(!showVotes)}
              disabled={!canRevealVotes() && !showVotes}
              className="flex items-center gap-1"
            >
              {showVotes ? (
                <>
                  <EyeOff className="h-4 w-4 mr-1" />
                  <span>Hide Votes</span>
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-1" />
                  <span>Reveal Votes</span>
                </>
              )}
            </Button>
          )}
        </div>
        
        {/* Evidence Sources Selection */}
        <div className="border rounded-md p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium">Select Evidence Sources</h3>
            {showVotes && (
              <div className="flex items-center gap-1">
                <span className="text-sm">Your score:</span>
                <span className="font-bold">{userScore.toFixed(1)}</span>
              </div>
            )}
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 mb-4">
              {confidenceSources.map(source => {
                const isSelected = userSources.includes(source.id);
                return (
                  <div
                    key={source.id}
                    onClick={() => toggleSource(source.id)}
                    className={`px-3 py-2 rounded-full text-sm cursor-pointer transition-colors
                      ${isSelected 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted hover:bg-muted/80 text-foreground'
                      }`}
                  >
                    {source.name}
                    {showVotes && isSelected && (
                      <span className="ml-1 text-xs font-medium inline-block">
                        +{source.points.toFixed(1)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          
          {userSources.length > 0 ? (
            <div className="flex justify-center mt-4">
              <Button 
                onClick={handleVote} 
                variant="ghost"
                size="sm"
                className={`${voteSubmitted ? "text-green-600" : "text-muted-foreground hover:text-foreground"}`}
              >
                {voteSubmitted ? "Votes registered ✓" : "Submit votes"}
              </Button>
            </div>
          ) : (
            <div className="text-center p-8 text-sm text-muted-foreground">
              Select one or more evidence sources that support your predictions
            </div>
          )}
        </div>
        
        {showVotes && (
          <div className="p-4 bg-muted/50 rounded-md">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium">Team Confidence Score</h3>
              <div className="flex items-center">
                <span className="font-bold text-xl">{totalScore.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground ml-1">/ 5.0</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground ml-1" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">
                        Confidence score caps at 5.0.<br />
                        Minimum score is 3.0 if at least one source is selected.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            
            <ScrollArea className="h-[200px] rounded-md border bg-background">
              <div className="p-2 space-y-2">
                {participants.map(participant => {
                  const participantVotes = votes.filter(vote => vote.userId === participant.id);
                  const participantScore = calculateParticipantScore(participantVotes);
                  
                  return (
                    <div key={participant.id} className="p-3 bg-muted/50 rounded-md">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center">
                          <div className="h-6 w-6 rounded-full bg-primary/10 mr-2 flex items-center justify-center">
                            {participant.name.charAt(0)}
                          </div>
                          <span className="font-medium">{participant.name}</span>
                          {participant.role === "host" && (
                            <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-primary/10">Host</span>
                          )}
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium">{participantScore.toFixed(1)}</span>
                        </div>
                      </div>
                      
                      {participantVotes.length === 0 ? (
                        <div className="text-xs text-muted-foreground text-center py-1">
                          No votes submitted yet
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {participantVotes.map((vote, index) => {
                            const source = confidenceSources.find(s => s.id === vote.sourceId);
                            return (
                              <div key={index} className="flex gap-1 items-center px-2 py-1 rounded-full bg-primary/10 text-xs">
                                <span>{source?.name}</span>
                                <span className="font-medium">(+{source?.points.toFixed(1)})</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}
        
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button 
            onClick={onNext}
            disabled={!hasVoted || userSources.length === 0}
          >
            Next Step
          </Button>
        </div>
      </div>
    </Card>
  );
} 