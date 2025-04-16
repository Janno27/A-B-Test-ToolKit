"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Users, XCircle } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { useRiceSettingsService } from '../../../hooks/useRiceSettingsService';
import { RiceSettings, ImpactKPI } from '../../../types/RiceServiceTypes';
import supabaseRiceSessionService from "../../../services/db/SupabaseRiceSessionService";
import { useToast } from "@/hooks/use-toast";

interface MetricVote {
  userId: string;
  userName: string;
  metric: string;
  expectedValue: number;
  timestamp: string;
}

interface Participant {
  id: string;
  name: string;
  role: "host" | "participant";
  joinedAt: string;
}

interface RiceSessionImpactProps {
  sessionId: string;
  onBack: () => void;
  onNext: () => void;
}

export default function RiceSessionImpact({ sessionId, onBack, onNext }: RiceSessionImpactProps) {
  const [currentUser, setCurrentUser] = useState<Participant | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [votes, setVotes] = useState<MetricVote[]>([]);
  const [showVotes, setShowVotes] = useState(false);
  const [impactKPIs, setImpactKPIs] = useState<ImpactKPI[]>([]);
  const [voteSubmitted, setVoteSubmitted] = useState<boolean>(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Current user selection state
  const [selectedMetric, setSelectedMetric] = useState<string>("");
  const [expectedValue, setExpectedValue] = useState<number>(0);
  const [userMetrics, setUserMetrics] = useState<{metric: string, value: number}[]>([]);

  // Utiliser le hook pour accéder au service RICE
  const { service, isLoading: isServiceLoading, error: serviceError } = useRiceSettingsService();

  // Ajouter ces états
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const { toast } = useToast();

  // Load user data and impact KPIs
  useEffect(() => {
    // Get user data
    const storedUser = localStorage.getItem(`rice_session_${sessionId}_user`);
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    
    // Get participants
    const storedParticipants = localStorage.getItem(`rice_session_${sessionId}_participants`);
    if (storedParticipants) {
      setParticipants(JSON.parse(storedParticipants));
    }
    
    // Récupérer les KPIs d'impact depuis Supabase
    const fetchImpactKPIs = async () => {
      setIsLoading(true);
      try {
        if (service) {
          // ID des paramètres par défaut
          const defaultId = '00000000-0000-0000-0000-000000000001';
          const settings = await service.getSettingsById(defaultId);
          
          if (settings && settings.impactKPIs && settings.impactKPIs.length > 0) {
            console.log('RiceSessionImpact: KPIs d\'impact récupérés depuis Supabase:', settings.impactKPIs);
            setImpactKPIs(settings.impactKPIs);
          } else {
            console.warn('RiceSessionImpact: Aucun KPI d\'impact trouvé dans Supabase, utilisation des valeurs par défaut');
            // Valeurs par défaut en cas d'échec
            const defaultImpactKPIs: ImpactKPI[] = [
              { id: uuidv4(), name: "CVR (pp)", minDelta: "+0.5%", maxDelta: "+5%", pointsPerUnit: "0.4/pp", example: "Δ +2% → 0.8" },
              { id: uuidv4(), name: "Revenue (€k)", minDelta: "+10k", maxDelta: "+500k", pointsPerUnit: "0.03/k€", example: "Δ +150k → 4.5" },
              { id: uuidv4(), name: "Behavior", minDelta: "+5%", maxDelta: "+50%", pointsPerUnit: "0.06/%", example: "Δ +20% → 1.2" },
              // Behavior sub-metrics
              { id: uuidv4(), name: "AddToCart", minDelta: "+5%", maxDelta: "+30%", pointsPerUnit: "0.06/%", example: "Δ +15% → 0.9", isBehaviorMetric: true, parentKPI: "Behavior" },
              { id: uuidv4(), name: "PDP Access", minDelta: "+3%", maxDelta: "+25%", pointsPerUnit: "0.04/%", example: "Δ +10% → 0.4", isBehaviorMetric: true, parentKPI: "Behavior" },
              { id: uuidv4(), name: "Scroll Depth", minDelta: "+10%", maxDelta: "+50%", pointsPerUnit: "0.03/%", example: "Δ +25% → 0.75", isBehaviorMetric: true, parentKPI: "Behavior" }
            ];
            setImpactKPIs(defaultImpactKPIs);
          }
        }
      } catch (error) {
        console.error('RiceSessionImpact: Erreur lors du chargement des KPIs d\'impact:', error);
        // Utiliser les valeurs par défaut en cas d'erreur
        const defaultImpactKPIs: ImpactKPI[] = [
          { id: uuidv4(), name: "CVR (pp)", minDelta: "+0.5%", maxDelta: "+5%", pointsPerUnit: "0.4/pp", example: "Δ +2% → 0.8" },
          { id: uuidv4(), name: "Revenue (€k)", minDelta: "+10k", maxDelta: "+500k", pointsPerUnit: "0.03/k€", example: "Δ +150k → 4.5" },
          { id: uuidv4(), name: "Behavior", minDelta: "+5%", maxDelta: "+50%", pointsPerUnit: "0.06/%", example: "Δ +20% → 1.2" },
          // Behavior sub-metrics
          { id: uuidv4(), name: "AddToCart", minDelta: "+5%", maxDelta: "+30%", pointsPerUnit: "0.06/%", example: "Δ +15% → 0.9", isBehaviorMetric: true, parentKPI: "Behavior" },
          { id: uuidv4(), name: "PDP Access", minDelta: "+3%", maxDelta: "+25%", pointsPerUnit: "0.04/%", example: "Δ +10% → 0.4", isBehaviorMetric: true, parentKPI: "Behavior" },
          { id: uuidv4(), name: "Scroll Depth", minDelta: "+10%", maxDelta: "+50%", pointsPerUnit: "0.03/%", example: "Δ +25% → 0.75", isBehaviorMetric: true, parentKPI: "Behavior" }
        ];
        setImpactKPIs(defaultImpactKPIs);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchImpactKPIs();
    
    // Load any existing votes
    const storedVotes = localStorage.getItem(`rice_session_${sessionId}_impact_votes`);
    if (storedVotes) {
      const parsedVotes = JSON.parse(storedVotes);
      setVotes(parsedVotes);
      
      // Set user's current selections if they exist
      if (currentUser) {
        const userVotes = parsedVotes.filter((vote: MetricVote) => vote.userId === currentUser.id);
        setUserMetrics(userVotes.map((vote: MetricVote) => ({
          metric: vote.metric,
          value: vote.expectedValue
        })));
      }
    }
  }, [sessionId, service, currentUser?.id]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Update votes
      const storedVotes = localStorage.getItem(`rice_session_${sessionId}_impact_votes`);
      if (storedVotes) {
        setVotes(JSON.parse(storedVotes));
      }
      
      // Update participants
      const storedParticipants = localStorage.getItem(`rice_session_${sessionId}_participants`);
      if (storedParticipants) {
        setParticipants(JSON.parse(storedParticipants));
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [sessionId]);

  const handleAddMetric = () => {
    if (!currentUser || !selectedMetric || userMetrics.length >= 3) return;
    
    // Check if this metric is already selected
    if (userMetrics.some(m => m.metric === selectedMetric)) {
      // Update existing metric
      const updatedMetrics = userMetrics.map(m => 
        m.metric === selectedMetric ? { ...m, value: expectedValue } : m
      );
      setUserMetrics(updatedMetrics);
    } else {
      // Add new metric
      setUserMetrics([...userMetrics, { metric: selectedMetric, value: expectedValue }]);
    }
    
    // Reset selection
    setSelectedMetric("");
    setExpectedValue(0);
    
    // Note: Nous ne sauvegardons plus les votes ici
    // saveVotes(); // Cette ligne est supprimée
  };

  const handleRemoveMetric = (metricName: string) => {
    setUserMetrics(userMetrics.filter(m => m.metric !== metricName));
    // Note: Nous ne sauvegardons plus les votes ici
    // saveVotes(); // Cette ligne est supprimée
  };

  const saveVotes = () => {
    if (!currentUser) return;
    
    // Remove all existing votes from this user
    let updatedVotes = votes.filter(vote => vote.userId !== currentUser.id);
    
    // Add new votes for each metric
    userMetrics.forEach(({metric, value}) => {
      if (metric) {
        const newVote: MetricVote = {
          userId: currentUser.id,
          userName: currentUser.name,
          metric,
          expectedValue: value,
          timestamp: new Date().toISOString()
        };
        updatedVotes.push(newVote);
      }
    });
    
    // Update state and localStorage
    setVotes(updatedVotes);
    localStorage.setItem(`rice_session_${sessionId}_impact_votes`, JSON.stringify(updatedVotes));
  };

  const getImpactFormula = () => {
    // Get the behavior sub-metrics currently in votes
    const behaviorSubMetricsInVotes = votes.filter(vote => {
      const kpi = impactKPIs.find(k => k.name === vote.metric);
      return kpi?.isBehaviorMetric;
    });
    
    // Get the main metrics currently in votes
    const mainMetricsInVotes = votes.filter(vote => {
      const kpi = impactKPIs.find(k => k.name === vote.metric);
      return !kpi?.isBehaviorMetric && (vote.metric === "CVR (pp)" || vote.metric === "Revenue (€k)");
    });
    
    // Count unique metrics by type per user to determine formula
    const hasCVR = new Set(mainMetricsInVotes.filter(v => v.metric === "CVR (pp)").map(v => v.userId)).size > 0;
    const hasRevenue = new Set(mainMetricsInVotes.filter(v => v.metric === "Revenue (€k)").map(v => v.userId)).size > 0;
    const hasBehavior = behaviorSubMetricsInVotes.length > 0;
    
    // Determine the formula based on selected metrics
    if (hasCVR && hasRevenue && hasBehavior) {
      return "I = (0.4 × ΔCVR) + (0.3 × ΔRevenue) + (0.3 × ΔBehavior)";
    } else if (hasCVR && hasRevenue) {
      return "I = (0.4 × ΔCVR) + (0.6 × ΔRevenue)";
    } else if (hasCVR && hasBehavior) {
      return "I = (0.4 × ΔCVR) + (0.6 × ΔBehavior)";
    } else if (hasRevenue && hasBehavior) {
      return "I = (0.4 × ΔRevenue) + (0.6 × ΔBehavior)";
    } else if (hasCVR) {
      return "I = ΔCVR";
    } else if (hasRevenue) {
      return "I = ΔRevenue";
    } else if (hasBehavior) {
      return "I = ΔBehavior";
    } else {
      return "No metrics selected";
    }
  };

  const getMetricPoints = (metricName: string, value: number) => {
    const kpi = impactKPIs.find(k => k.name === metricName);
    if (!kpi) return 0;
    
    // Extract the multiplier from the pointsPerUnit string (e.g., "0.4/pp" -> 0.4)
    const multiplier = parseFloat(kpi.pointsPerUnit.split('/')[0]);
    
    // Calculate points based on the expected value and multiplier
    return Math.round(value * multiplier * 100) / 100;
  };

  const getTotalImpactScore = () => {
    const userVotesMap = new Map<string, MetricVote[]>();
    
    // Group votes by user
    votes.forEach(vote => {
      if (!userVotesMap.has(vote.userId)) {
        userVotesMap.set(vote.userId, []);
      }
      userVotesMap.get(vote.userId)?.push(vote);
    });
    
    // Calculate impact score for each user
    const userScores: number[] = [];
    
    userVotesMap.forEach(userVotes => {
      // Get behavior sub-metrics and main metrics for this user
      const behaviorSubMetrics = userVotes.filter(vote => {
        const kpi = impactKPIs.find(k => k.name === vote.metric);
        return kpi?.isBehaviorMetric;
      });
      
      const mainMetrics = userVotes.filter(vote => {
        const kpi = impactKPIs.find(k => k.name === vote.metric);
        return !kpi?.isBehaviorMetric && (vote.metric === "CVR (pp)" || vote.metric === "Revenue (€k)");
      });
      
      // Determine which metrics are present
      const hasCVR = mainMetrics.some(v => v.metric === "CVR (pp)");
      const hasRevenue = mainMetrics.some(v => v.metric === "Revenue (€k)");
      const hasBehavior = behaviorSubMetrics.length > 0;
      
      // Determine weights based on which metrics are present
      let weights: Record<string, number> = {};
      
      if (hasCVR && hasRevenue && hasBehavior) {
        weights = { "CVR (pp)": 0.4, "Revenue (€k)": 0.3, "Behavior": 0.3 };
      } else if (hasCVR && hasRevenue) {
        weights = { "CVR (pp)": 0.4, "Revenue (€k)": 0.6, "Behavior": 0 };
      } else if (hasCVR && hasBehavior) {
        weights = { "CVR (pp)": 0.4, "Revenue (€k)": 0, "Behavior": 0.6 };
      } else if (hasRevenue && hasBehavior) {
        weights = { "CVR (pp)": 0, "Revenue (€k)": 0.4, "Behavior": 0.6 };
      } else if (hasCVR) {
        weights = { "CVR (pp)": 1, "Revenue (€k)": 0, "Behavior": 0 };
      } else if (hasRevenue) {
        weights = { "CVR (pp)": 0, "Revenue (€k)": 1, "Behavior": 0 };
      } else if (hasBehavior) {
        weights = { "CVR (pp)": 0, "Revenue (€k)": 0, "Behavior": 1 };
      }
      
      // Weights for behavior sub-metrics
      const behaviorWeights = {
        "AddToCart": 0.4,
        "PDP Access": 0.3,
        "Scroll Depth": 0.3
      };
      
      let score = 0;
      
      // Calculate score for main metrics (CVR, Revenue)
      mainMetrics.forEach(vote => {
        const metricName = vote.metric;
        const metricPoints = getMetricPoints(metricName, vote.expectedValue);
        const weight = weights[metricName as keyof typeof weights] || 0;
        
        score += metricPoints * weight;
      });
      
      // Calculate behavior score if behavior sub-metrics are present
      if (behaviorSubMetrics.length > 0) {
        let behaviorScore = 0;
        
        behaviorSubMetrics.forEach(vote => {
          const metricName = vote.metric;
          const metricPoints = getMetricPoints(metricName, vote.expectedValue);
          const weight = behaviorWeights[metricName as keyof typeof behaviorWeights] || 0;
          
          behaviorScore += metricPoints * weight;
        });
        
        // Add behavior contribution with appropriate weight
        score += behaviorScore * (weights.Behavior || 0);
      }
      
      userScores.push(score);
    });
    
    // Average all user scores
    if (userScores.length === 0) return 0;
    const total = userScores.reduce((acc, score) => acc + score, 0);
    return Math.round((total / userScores.length) * 100) / 100;
  };

  const canRevealVotes = () => {
    if (!currentUser || currentUser.role !== "host") return false;
    
    // Check if all participants have voted with at least one metric
    const voterIdsWithMetrics = new Set();
    votes.forEach(vote => {
      voterIdsWithMetrics.add(vote.userId);
    });
    
    return participants.every(participant => voterIdsWithMetrics.has(participant.id));
  };

  const getAvailableMetrics = () => {
    // If user has already selected 3 metrics, no more are available
    if (userMetrics.length >= 3) return [];
    
    // Get only top-level metrics (not behavior sub-metrics)
    const topLevelMetrics = impactKPIs.filter(kpi => !kpi.isBehaviorMetric);
    
    // Filter out metrics that are already selected
    return topLevelMetrics.filter(kpi => !userMetrics.some(m => m.metric === kpi.name));
  };

  const getBehaviorSubMetrics = () => {
    // Return all behavior sub-metrics
    return impactKPIs.filter(kpi => kpi.isBehaviorMetric);
  };

  const getCurrentKPI = () => {
    return impactKPIs.find(kpi => kpi.name === selectedMetric);
  };

  const getMinMax = (valueStr: string) => {
    // Extract the numeric part from strings like "+0.5%" or "+10k"
    const numericPart = parseFloat(valueStr.replace(/[^0-9.-]/g, ''));
    return numericPart;
  };

  const formatExpectedValue = (metricName: string, value: number) => {
    if (metricName === "CVR (pp)") return `+${value}%`;
    if (metricName === "Revenue (€k)") return `+${value}k€`;
    if (metricName === "Behavior" || metricName === "AddToCart" || metricName === "PDP Access" || metricName === "Scroll Depth") 
      return `+${value}%`;
    return `${value}`;
  };

  const isHost = currentUser?.role === "host";
  const availableMetrics = getAvailableMetrics();
  const currentKPI = getCurrentKPI();
  
  // Calculate min/max values for the slider
  const minValue = currentKPI ? getMinMax(currentKPI.minDelta) : 0;
  const maxValue = currentKPI ? getMinMax(currentKPI.maxDelta) : 100;

  const renderMetricsContribution = () => {
    // Group votes by metric
    const metricVotes = new Map<string, MetricVote[]>();
    votes.forEach(vote => {
      if (!metricVotes.has(vote.metric)) {
        metricVotes.set(vote.metric, []);
      }
      metricVotes.get(vote.metric)?.push(vote);
    });

    // Determine which metrics are present
    const metricNames = Array.from(metricVotes.keys());
    const hasCVR = metricNames.includes("CVR (pp)");
    const hasRevenue = metricNames.includes("Revenue (€k)");
    
    // Check for behavior sub-metrics
    const behaviorSubMetrics = metricNames.filter(name => {
      const kpi = impactKPIs.find(k => k.name === name);
      return kpi?.isBehaviorMetric;
    });
    const hasBehavior = behaviorSubMetrics.length > 0;

    // Determine weights based on which metrics are present
    let weights: Record<string, number> = {};
    
    if (hasCVR && hasRevenue && hasBehavior) {
      weights = { "CVR (pp)": 0.4, "Revenue (€k)": 0.3, "Behavior": 0.3 };
    } else if (hasCVR && hasRevenue) {
      weights = { "CVR (pp)": 0.4, "Revenue (€k)": 0.6, "Behavior": 0 };
    } else if (hasCVR && hasBehavior) {
      weights = { "CVR (pp)": 0.4, "Revenue (€k)": 0, "Behavior": 0.6 };
    } else if (hasRevenue && hasBehavior) {
      weights = { "CVR (pp)": 0, "Revenue (€k)": 0.4, "Behavior": 0.6 };
    } else if (hasCVR) {
      weights = { "CVR (pp)": 1, "Revenue (€k)": 0, "Behavior": 0 };
    } else if (hasRevenue) {
      weights = { "CVR (pp)": 0, "Revenue (€k)": 1, "Behavior": 0 };
    } else if (hasBehavior) {
      weights = { "CVR (pp)": 0, "Revenue (€k)": 0, "Behavior": 1 };
    }

    // Calculate and display each metric's contribution
    return (
      <div className="mt-4 space-y-3">
        <h3 className="text-sm font-medium">Metrics Contribution:</h3>
        
        {/* Main metrics (CVR, Revenue) */}
        {["CVR (pp)", "Revenue (€k)"].map(metricName => {
          if (!metricVotes.has(metricName)) return null;
          
          const votes = metricVotes.get(metricName) || [];
          const avgValue = votes.reduce((sum, v) => sum + v.expectedValue, 0) / votes.length;
          const points = getMetricPoints(metricName, avgValue);
          const weight = weights[metricName] || 0;
          const contribution = points * weight;
          
          return (
            <div key={metricName} className="px-3 py-2 bg-gray-50 rounded-md text-xs">
              <div className="flex justify-between">
                <span className="font-medium">{metricName}</span>
                <span>{(weight * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Avg. {avgValue.toFixed(2)}</span>
                <span>
                  {points.toFixed(1)} × {weight.toFixed(1)} = {contribution.toFixed(1)}
                </span>
              </div>
            </div>
          );
        })}
        
        {/* Behavior metrics section */}
        {hasBehavior && (
          <div className="px-3 py-2 bg-gray-50 rounded-md text-xs">
            <div className="flex justify-between">
              <span className="font-medium">Behavior</span>
              <span>{(weights.Behavior * 100).toFixed(0)}%</span>
            </div>
            
            {/* Behavior sub-metrics */}
            <div className="mt-1 pl-3 border-l border-gray-200 space-y-1">
              {behaviorSubMetrics.map(metricName => {
                const votes = metricVotes.get(metricName) || [];
                const avgValue = votes.reduce((sum, v) => sum + v.expectedValue, 0) / votes.length;
                const points = getMetricPoints(metricName, avgValue);
                // Tous les sous-métriques de comportement ont le même poids
                const subWeight = 1 / behaviorSubMetrics.length;
                const contribution = points * subWeight * weights.Behavior;
                
                return (
                  <div key={metricName}>
                    <div className="flex justify-between">
                      <span>{metricName}</span>
                      <span>{Math.round(subWeight * 100)}%</span>
                    </div>
                    <div className="flex justify-between text-gray-600 text-xs">
                      <span>Avg. {avgValue.toFixed(1)}</span>
                      <span>
                        {points.toFixed(1)} pts
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Total behavior contribution */}
            <div className="mt-1 text-right text-xs font-medium">
              Total: {calculateBehaviorContribution().toFixed(1)} pts
            </div>
          </div>
        )}
      </div>
    );
  };

  // Helper function to calculate behavior contribution
  const calculateBehaviorContribution = () => {
    // Group votes by metric
    const metricVotes = new Map<string, MetricVote[]>();
    votes.forEach(vote => {
      if (!metricVotes.has(vote.metric)) {
        metricVotes.set(vote.metric, []);
      }
      metricVotes.get(vote.metric)?.push(vote);
    });

    // Find behavior sub-metrics
    const behaviorSubMetrics = Array.from(metricVotes.keys()).filter(name => {
      const kpi = impactKPIs.find(k => k.name === name);
      return kpi?.isBehaviorMetric;
    });
    
    if (behaviorSubMetrics.length === 0) return 0;

    // Determine weights
    const metricNames = Array.from(metricVotes.keys());
    const hasCVR = metricNames.includes("CVR (pp)");
    const hasRevenue = metricNames.includes("Revenue (€k)");
    
    // Determine behavior weight
    let behaviorWeight = 0;
    if (hasCVR && hasRevenue) {
      behaviorWeight = 0.3;
    } else if (hasCVR || hasRevenue) {
      behaviorWeight = 0.6;
    } else {
      behaviorWeight = 1;
    }

    // Calculate behavior contribution with equal weights for all behavior metrics
    const subWeight = 1 / behaviorSubMetrics.length;
    let totalContribution = 0;
    
    behaviorSubMetrics.forEach(metricName => {
      const votes = metricVotes.get(metricName) || [];
      const avgValue = votes.reduce((sum, v) => sum + v.expectedValue, 0) / votes.length;
      const points = getMetricPoints(metricName, avgValue);
      
      totalContribution += points * subWeight * behaviorWeight;
    });
    
    return totalContribution;
  };

  const handleVote = async () => {
    if (!currentUser || userMetrics.length === 0) return;
    
    // Enregistrer les votes localement d'abord
    saveVotes();
    
    // Préparer pour envoyer à Supabase
    setIsSaving(true);
    console.log("==== SAVING VOTES TO SUPABASE ====");
    console.log("sessionId:", sessionId);
    console.log("participantId:", currentUser.id);
    
    try {
      // Convertir les votes au format attendu par saveImpactVote
      const metricsForSupabase = userMetrics.map(({metric, value}) => {
        // Trouver l'ID du KPI à partir du nom
        const kpi = impactKPIs.find(k => k.name === metric);
        return {
          metricId: kpi?.id || metric, // Utiliser l'ID si disponible, sinon le nom
          value: value
        };
      });
      
      console.log("Metrics for Supabase:", metricsForSupabase);
      
      if (metricsForSupabase.length > 0) {
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
        const result = await supabaseRiceSessionService.saveImpactVote(
          sessionId,
          currentUser.id,
          metricsForSupabase
        );
        
        console.log("Result from saveImpactVote:", result);
        
        toast({
          title: "Votes enregistrés",
          description: "Vos votes d'impact ont été sauvegardés",
          variant: "default"
        });
      }
    } catch (error) {
      console.error("Error saving votes to Supabase:", error);
      
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
        description: "Impossible de sauvegarder vos votes. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
    
    // Set vote as submitted for feedback
    setVoteSubmitted(true);
    setHasVoted(true);
    
    // Reset after animation
    setTimeout(() => {
      setVoteSubmitted(false);
    }, 2000);
  };

  return (
    <Card className="p-6 max-w-3xl mx-auto">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold leading-tight mb-1">Impact Evaluation</h2>
          <p className="text-sm text-muted-foreground">
            What effect will this feature have on key metrics? Select up to 3 metrics and estimate their uplift.
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
        
        <div className="space-y-4">
          <div className="border rounded-md p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium">Your Impact Metrics</h3>
              {userMetrics.length < 3 && !isLoading && (
                <Select
                  value={selectedMetric}
                  onValueChange={(value) => {
                    setSelectedMetric(value);
                    // Reset expectedValue when a new metric is selected
                    setExpectedValue(0);
                  }}
                >
                  <SelectTrigger className="w-[180px] h-8 text-xs">
                    <SelectValue placeholder="Select a metric" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Main metrics (non-behavior) */}
                    {availableMetrics
                      .filter(kpi => kpi.name !== "Behavior")
                      .map(kpi => (
                        <SelectItem key={kpi.id} value={kpi.name}>
                          {kpi.name} ({kpi.minDelta} to {kpi.maxDelta})
                        </SelectItem>
                      ))}
                    
                    {/* Behavior with sub-metrics in a group */}
                    {availableMetrics.some(kpi => kpi.name === "Behavior") && (
                      <>
                        <SelectItem value="Behavior" disabled className="font-semibold">
                          Behavior
                        </SelectItem>
                        {getBehaviorSubMetrics().map(kpi => (
                          <SelectItem key={kpi.id} value={kpi.name} className="pl-6">
                            {kpi.name} ({kpi.minDelta} to {kpi.maxDelta})
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              )}
              {isLoading && (
                <div className="w-[180px] h-8 flex justify-center items-center">
                  <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
            
            {userMetrics.length > 0 ? (
              <div className="space-y-3">
                {userMetrics.map(({metric, value}) => (
                  <div key={metric} className="flex items-center justify-between bg-background p-2 rounded-md">
                    <div className="flex items-center">
                      <Badge variant="outline" className="mr-2">
                        {metric}
                      </Badge>
                      <span className="text-sm font-medium">
                        {formatExpectedValue(metric, value)}
                      </span>
                      {showVotes && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({getMetricPoints(metric, value)} points)
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMetric(metric)}
                      className="h-7 w-7 p-0 rounded-full"
                    >
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
                
                {/* Vote button */}
                <div className="flex justify-center mt-4">
                  <Button 
                    onClick={handleVote}
                    disabled={isSaving}
                    variant="ghost"
                    size="sm"
                    className={`${voteSubmitted ? "text-green-600" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {isSaving ? (
                      <>
                        <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                        Saving...
                      </>
                    ) : voteSubmitted ? (
                      "Votes registered ✓"
                    ) : (
                      "Submit votes"
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-3">
                No metrics selected. Select a metric from the dropdown.
              </div>
            )}
            
            {userMetrics.length < 3 && selectedMetric && (
              <div className="mt-4">
                {currentKPI && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>{currentKPI.minDelta}</span>
                      <span className="font-medium">Expected uplift: {formatExpectedValue(selectedMetric, expectedValue)}</span>
                      <span>{currentKPI.maxDelta}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Slider
                        min={minValue}
                        max={maxValue}
                        step={selectedMetric === "Revenue (€k)" ? 10 : 0.5}
                        value={[expectedValue]}
                        onValueChange={(values) => setExpectedValue(values[0])}
                        className="flex-1"
                      />
                      {expectedValue > 0 && (
                        <Button
                          onClick={handleAddMetric}
                          size="sm"
                          variant="ghost"
                          className="text-xs h-7 px-2"
                        >
                          Add →
                        </Button>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground text-center">
                      Example: {currentKPI.example}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {showVotes && (
          <div className="bg-muted/30 rounded-md p-4">
            <h3 className="font-medium mb-2">Summary</h3>
            
            <div className="space-y-3">
              <div className="bg-muted/20 p-2 rounded-md text-xs mb-3">
                <p className="font-medium">Impact Formula:</p>
                <p className="font-mono mt-1">{getImpactFormula()}</p>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm">Average impact score: <span className="font-medium">{getTotalImpactScore()}</span></p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Based on {votes.length} metrics from {new Set(votes.map(v => v.userId)).size} participants
                  </p>
                </div>
                <div className="text-lg font-bold px-4 py-2 rounded-full bg-primary/10 text-primary">
                  {getTotalImpactScore()}
                </div>
              </div>
              
              {renderMetricsContribution()}
            </div>
          </div>
        )}
        
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack} className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          
          <Button 
            onClick={onNext}
            disabled={userMetrics.length === 0 || !hasVoted}
            className="flex items-center gap-1"
          >
            <span>Next Step</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
} 