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
  Info,
  Paintbrush,
  Code,
  ArrowRight,
  ArrowLeft
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRiceSettingsService } from '../../../hooks/useRiceSettingsService';
import { RiceSettings, EffortSize as SupabaseEffortSize } from '../../../types/RiceServiceTypes';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from "@/hooks/use-toast";
import supabaseRiceSessionService from '../../../services/db/SupabaseRiceSessionService';

interface Participant {
  id: string;
  name: string;
  role: "host" | "participant";
  avatar?: string;
}

interface EffortVote {
  userId: string;
  devSizeId: string;
  designSizeId: string;
}

interface RiceSessionEffortProps {
  sessionId: string;
  onBack: () => void;
  onNext: () => void;
}

interface EffortSize extends SupabaseEffortSize {
  size: "XS" | "S" | "M" | "L" | "XL";
}

const mapEffortSize = (effortSize: SupabaseEffortSize): EffortSize => {
  let size: "XS" | "S" | "M" | "L" | "XL" = "M";
  if (effortSize.name.includes("Extra Small") || effortSize.name.includes("XS")) size = "XS";
  else if (effortSize.name.includes("Small") || effortSize.name.includes("S")) size = "S";
  else if (effortSize.name.includes("Medium") || effortSize.name.includes("M")) size = "M";
  else if (effortSize.name.includes("Large") || effortSize.name.includes("L")) size = "L";
  else if (effortSize.name.includes("Extra Large") || effortSize.name.includes("XL")) size = "XL";

  return {
    ...effortSize,
    size
  };
};

export default function RiceSessionEffort({ sessionId, onBack, onNext }: RiceSessionEffortProps) {
  const [currentUser, setCurrentUser] = useState<Participant | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [effortSizes, setEffortSizes] = useState<EffortSize[]>([]);
  const [votes, setVotes] = useState<EffortVote[]>([]);
  const [devSize, setDevSize] = useState<string>("");
  const [designSize, setDesignSize] = useState<string>("");
  const [step, setStep] = useState<"dev" | "design">("dev");
  const [showVotes, setShowVotes] = useState<boolean>(false);
  const [voteSubmitted, setVoteSubmitted] = useState<boolean>(false);
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const { service, isLoading: isServiceLoading, error: serviceError } = useRiceSettingsService();
  const { toast } = useToast();
  
  useEffect(() => {
    const storedUser = localStorage.getItem(`rice_session_${sessionId}_user`);
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    
    const storedParticipants = localStorage.getItem(`rice_session_${sessionId}_participants`);
    if (storedParticipants) {
      setParticipants(JSON.parse(storedParticipants));
    }
    
    const fetchEffortSizes = async () => {
      setIsLoading(true);
      try {
        if (service) {
          const defaultId = '00000000-0000-0000-0000-000000000001';
          const settings = await service.getSettingsById(defaultId);
          
          if (settings && settings.effortSizes && settings.effortSizes.length > 0) {
            console.log('RiceSessionEffort: Tailles d\'effort récupérées depuis Supabase:', settings.effortSizes);
            const mappedEffortSizes = settings.effortSizes.map(mapEffortSize);
            setEffortSizes(mappedEffortSizes);
          } else {
            console.warn('RiceSessionEffort: Aucune taille d\'effort trouvée dans Supabase, utilisation des valeurs par défaut');
            const defaultEffortSizes: EffortSize[] = [
              { id: "es1", name: "Extra Small", size: "XS", devEffort: 0.3, designEffort: 0.2, duration: "0-1 week", example: "Minor CSS modification" },
              { id: "es2", name: "Small", size: "S", devEffort: 0.5, designEffort: 0.3, duration: "1-2 weeks", example: "New tracking integration" },
              { id: "es3", name: "Medium", size: "M", devEffort: 0.8, designEffort: 0.5, duration: "2-4 weeks", example: "PDP module redesign" },
              { id: "es4", name: "Large", size: "L", devEffort: 1.2, designEffort: 0.8, duration: "4-6 weeks", example: "Checkout revamp" },
              { id: "es5", name: "Extra Large", size: "XL", devEffort: 1.5, designEffort: 1.2, duration: "6-8 weeks", example: "Payment API migration" }
            ];
            setEffortSizes(defaultEffortSizes);
          }
        }
      } catch (error) {
        console.error('RiceSessionEffort: Erreur lors du chargement des tailles d\'effort:', error);
        const defaultEffortSizes: EffortSize[] = [
          { id: "es1", name: "Extra Small", size: "XS", devEffort: 0.3, designEffort: 0.2, duration: "0-1 week", example: "Minor CSS modification" },
          { id: "es2", name: "Small", size: "S", devEffort: 0.5, designEffort: 0.3, duration: "1-2 weeks", example: "New tracking integration" },
          { id: "es3", name: "Medium", size: "M", devEffort: 0.8, designEffort: 0.5, duration: "2-4 weeks", example: "PDP module redesign" },
          { id: "es4", name: "Large", size: "L", devEffort: 1.2, designEffort: 0.8, duration: "4-6 weeks", example: "Checkout revamp" },
          { id: "es5", name: "Extra Large", size: "XL", devEffort: 1.5, designEffort: 1.2, duration: "6-8 weeks", example: "Payment API migration" }
        ];
        setEffortSizes(defaultEffortSizes);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEffortSizes();
    
    const storedVotes = localStorage.getItem(`rice_session_${sessionId}_effort_votes`);
    if (storedVotes) {
      setVotes(JSON.parse(storedVotes));
      
      if (currentUser) {
        const userVote = JSON.parse(storedVotes).find(
          (vote: EffortVote) => vote.userId === currentUser.id
        );
        
        if (userVote) {
          setDevSize(userVote.devSizeId);
          setDesignSize(userVote.designSizeId);
        }
      }
    }
    
    const interval = setInterval(() => {
      const storedVotes = localStorage.getItem(`rice_session_${sessionId}_effort_votes`);
      if (storedVotes) {
        setVotes(JSON.parse(storedVotes));
      }
    }, 5000);
    
    return () => {
      clearInterval(interval);
    };
  }, [sessionId, service, currentUser?.id]);
  
  useEffect(() => {
    if (currentUser) {
      const userHasVoted = votes.some(vote => vote.userId === currentUser.id);
      setHasVoted(userHasVoted);
    }
  }, [currentUser, votes]);
  
  const saveVote = async () => {
    if (!currentUser || !devSize || !designSize) return;
    
    const newVote: EffortVote = {
      userId: currentUser.id,
      devSizeId: devSize,
      designSizeId: designSize
    };
    
    const otherVotes = votes.filter(vote => vote.userId !== currentUser.id);
    
    const updatedVotes = [...otherVotes, newVote];
    
    try {
      // Sauvegarder dans localStorage
      localStorage.setItem(`rice_session_${sessionId}_effort_votes`, JSON.stringify(updatedVotes));
      
      // Récupérer les objets de taille pour obtenir leurs noms
      const devSizeObj = effortSizes.find(size => size.id === devSize);
      const designSizeObj = effortSizes.find(size => size.id === designSize);
      
      // Envoyer à Supabase
      await supabaseRiceSessionService.saveEffortVote(
        sessionId,
        currentUser.id,
        devSizeObj?.name || devSize,
        designSizeObj?.name || designSize
      );
      
      setVotes(updatedVotes);
      
      toast({
        title: "Votes saved successfully",
        description: "Your votes have been successfully saved.",
      });
    } catch (error) {
      console.error('RiceSessionEffort: Erreur lors de la sauvegarde des votes:', error);
      toast({
        title: "Error saving votes",
        description: "There was an error saving your votes. Please try again later.",
        variant: "destructive"
      });
    }
  };
  
  const getTotalEffortScore = () => {
    if (votes.length === 0) return 0;
    
    let totalDevEffort = 0;
    let totalDesignEffort = 0;
    
    votes.forEach(vote => {
      const devSize = effortSizes.find(size => size.id === vote.devSizeId);
      const designSize = effortSizes.find(size => size.id === vote.designSizeId);
      
      if (devSize) totalDevEffort += devSize.devEffort;
      if (designSize) totalDesignEffort += designSize.designEffort;
    });
    
    const avgDevEffort = votes.length > 0 ? totalDevEffort / votes.length : 0;
    const avgDesignEffort = votes.length > 0 ? totalDesignEffort / votes.length : 0;
    
    return Math.round(((avgDevEffort * 0.55) + (avgDesignEffort * 0.45)) * 100) / 100;
  };
  
  const canRevealVotes = () => {
    if (!currentUser || currentUser.role !== "host") return false;
    
    const voterIds = new Set();
    votes.forEach(vote => {
      voterIds.add(vote.userId);
    });
    
    return participants.every(participant => voterIds.has(participant.id));
  };
  
  const getSelectedSizeDetails = (sizeId: string) => {
    return effortSizes.find(size => size.id === sizeId);
  };
  
  const handleVote = async () => {
    if (!currentUser || !devSize || !designSize) return;
    
    console.log("handleVote - devSize:", devSize, "designSize:", designSize);
    
    // Sauvegarder le vote localement et dans Supabase
    setVoteSubmitted(true); // Feedback visuel immédiat
    
    try {
      await saveVote();
      setHasVoted(true);
    } catch (error) {
      console.error("Error in handleVote:", error);
      // Les erreurs sont déjà gérées dans saveVote
    }
    
    // Réinitialiser après animation
    setTimeout(() => {
      setVoteSubmitted(false);
    }, 2000);
  };
  
  const isHost = currentUser?.role === "host";
  const devSizeDetails = getSelectedSizeDetails(devSize);
  const designSizeDetails = getSelectedSizeDetails(designSize);
  const totalEffortScore = getTotalEffortScore();
  
  const isStepComplete = (stepName: "dev" | "design") => {
    return stepName === "dev" ? !!devSize : !!designSize;
  };
  
  const goToNextStep = () => {
    if (step === "dev" && devSize) {
      setStep("design");
    }
  };
  
  const goToPrevStep = () => {
    if (step === "design") {
      setStep("dev");
    }
  };
  
  const getVoteStats = (type: "dev" | "design") => {
    if (votes.length === 0) return [];
    
    const sizeVotes = new Map<string, number>();
    votes.forEach(vote => {
      const sizeId = type === "dev" ? vote.devSizeId : vote.designSizeId;
      sizeVotes.set(sizeId, (sizeVotes.get(sizeId) || 0) + 1);
    });
    
    return effortSizes.map(size => {
      const count = sizeVotes.get(size.id) || 0;
      const percentage = votes.length > 0 ? Math.round((count / votes.length) * 100) : 0;
      return {
        ...size,
        count,
        percentage
      };
    }).filter(result => result.count > 0)
      .sort((a, b) => b.count - a.count);
  };
  
  const devVoteStats = getVoteStats("dev");
  const designVoteStats = getVoteStats("design");
  
  return (
    <Card className="p-6 max-w-3xl mx-auto">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold leading-tight mb-1">Effort Sizing</h2>
          <p className="text-sm text-muted-foreground">
            How much effort would it take to implement this feature? Select T-shirt sizes for both development and design.
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
        
        <div className="flex items-center justify-center mb-4">
          <div className="flex items-center w-full max-w-md">
            <div className={`flex-1 flex flex-col items-center ${step === 'dev' ? 'opacity-100' : 'opacity-60'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${isStepComplete('dev') ? 'bg-green-100 text-green-700' : 'bg-muted text-foreground'}`}>
                <Code className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">Dev Effort</span>
            </div>
            
            <div className="w-16 h-0.5 bg-muted"></div>
            
            <div className={`flex-1 flex flex-col items-center ${step === 'design' ? 'opacity-100' : 'opacity-60'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${isStepComplete('design') ? 'bg-green-100 text-green-700' : 'bg-muted text-foreground'}`}>
                <Paintbrush className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">Design Effort</span>
            </div>
          </div>
        </div>
        
        {step === "dev" && (
          <div className="p-4 bg-muted/50 rounded-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium flex items-center">
                <Code className="h-4 w-4 mr-1" />
                <span>Development Effort</span>
              </h3>
              {devSizeDetails && (
                <div className="inline-flex items-center px-2 py-1 rounded bg-primary/10">
                  <span className="text-xl font-bold mr-1">{devSizeDetails.size}</span>
                  {showVotes && <span className="text-xs text-muted-foreground">({devSizeDetails.devEffort.toFixed(1)})</span>}
                </div>
              )}
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {effortSizes.map((size) => (
                  <div
                    key={size.id}
                    onClick={() => setDevSize(size.id)}
                    className={`cursor-pointer p-3 rounded-md transition-colors ${
                      devSize === size.id 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted/30 hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex flex-col items-center text-center">
                      <span className="text-2xl font-bold">{size.size}</span>
                      <span className="text-sm mt-1">{size.name}</span>
                      <span className="text-xs mt-1">{size.duration}</span>
                      <div className="flex items-center justify-center px-2 py-0.5 bg-primary/10 rounded-full mt-2">
                        <span className="text-xs font-medium">{showVotes ? `${size.devEffort.toFixed(1)}` : "Effort"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="mt-4 p-2 border border-dashed rounded-md">
                    <p className="text-xs text-muted-foreground text-center">
                      {devSizeDetails?.example || "Select a size to see its description"}
                    </p>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">The effort size you select determines the denominator in the RICE score calculation.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <div className="flex justify-end mt-4">
              <Button 
                onClick={goToNextStep}
                disabled={!devSize}
                className="flex items-center gap-1"
              >
                <span>Next</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        
        {step === "design" && (
          <div className="p-4 bg-muted/50 rounded-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium flex items-center">
                <Paintbrush className="h-4 w-4 mr-1" />
                <span>Design Effort</span>
              </h3>
              {designSizeDetails && (
                <div className="inline-flex items-center px-2 py-1 rounded bg-primary/10">
                  <span className="text-xl font-bold mr-1">{designSizeDetails.size}</span>
                  {showVotes && <span className="text-xs text-muted-foreground">({designSizeDetails.designEffort.toFixed(1)})</span>}
                </div>
              )}
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {effortSizes.map((size) => (
                  <div
                    key={size.id}
                    onClick={() => setDesignSize(size.id)}
                    className={`cursor-pointer p-3 rounded-md transition-colors ${
                      designSize === size.id 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted/30 hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex flex-col items-center text-center">
                      <span className="text-2xl font-bold">{size.size}</span>
                      <span className="text-sm mt-1">{size.name}</span>
                      <span className="text-xs mt-1">{size.duration}</span>
                      <div className="flex items-center justify-center px-2 py-0.5 bg-primary/10 rounded-full mt-2">
                        <span className="text-xs font-medium">{showVotes ? `${size.designEffort.toFixed(1)}` : "Effort"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="mt-4 p-2 border border-dashed rounded-md">
                    <p className="text-xs text-muted-foreground text-center">
                      {designSizeDetails?.example || "Select a size to see its description"}
                    </p>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">Design effort counts for 30% of the total effort score.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <div className="flex justify-between mt-4">
              <Button 
                variant="outline"
                onClick={goToPrevStep}
                className="flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              
              <div className="flex justify-center">
                <Button 
                  onClick={handleVote} 
                  variant="ghost"
                  size="sm"
                  disabled={!devSize || !designSize}
                  className={`${voteSubmitted ? "text-green-600" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {voteSubmitted ? "Votes registered ✓" : "Submit votes"}
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {showVotes && (
          <div className="p-4 bg-muted/50 rounded-md">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium">Team Effort Assessment</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Final Score:</span>
                <span className="text-xl font-bold">{totalEffortScore.toFixed(1)}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-medium flex items-center">
                    <Code className="h-3 w-3 mr-1" />
                    <span>Dev Effort</span>
                  </h4>
                </div>
                
                <div className="space-y-2">
                  {devVoteStats.map((result) => (
                    <div key={result.id} className="bg-background rounded-md p-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <span className="text-base font-bold mr-1">{result.size}</span>
                          <span className="text-xs">{result.count} votes</span>
                        </div>
                        <span className="text-xs font-medium">{result.percentage}%</span>
                      </div>
                      <div className="w-full bg-muted/50 rounded-full h-1.5 mt-1">
                        <div 
                          className="bg-primary h-1.5 rounded-full" 
                          style={{ width: `${result.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-medium flex items-center">
                    <Paintbrush className="h-3 w-3 mr-1" />
                    <span>Design Effort</span>
                  </h4>
                </div>
                
                <div className="space-y-2">
                  {designVoteStats.map((result) => (
                    <div key={result.id} className="bg-background rounded-md p-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <span className="text-base font-bold mr-1">{result.size}</span>
                          <span className="text-xs">{result.count} votes</span>
                        </div>
                        <span className="text-xs font-medium">{result.percentage}%</span>
                      </div>
                      <div className="w-full bg-muted/50 rounded-full h-1.5 mt-1">
                        <div 
                          className="bg-primary h-1.5 rounded-full" 
                          style={{ width: `${result.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-primary/5 rounded border border-primary/10">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Calculation:</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Final Score: Development (55%) + Design (45%)</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button 
            onClick={() => {
              // Calculer et enregistrer les résultats RICE avant de passer à l'étape suivante
              if (isHost && showVotes) {
                try {
                  // Appel à Supabase pour calculer le score RICE
                  supabaseRiceSessionService.calculateAndSaveRiceScore(sessionId)
                    .then((riceScores) => {
                      console.log("Score RICE calculé avec Supabase:", riceScores);
                    })
                    .catch((error) => {
                      console.error("Erreur lors du calcul du score RICE avec Supabase:", error);
                    });
                } catch (error) {
                  console.error("Erreur lors de l'appel au calcul du score RICE:", error);
                }
              }
              
              // Passer à l'étape suivante
              onNext();
            }}
            disabled={!devSize || !designSize || !hasVoted}
          >
            Next Step
          </Button>
        </div>
      </div>
    </Card>
  );
} 