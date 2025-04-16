"use client";

import { useState, useEffect } from "react";
import RiceSessionParticipants from "./RiceSessionParticipants";
import RiceSessionVoting from "./RiceSessionVoting";
import RiceSessionImpact from "./RiceSessionImpact";
import RiceSessionConfidence from "./RiceSessionConfidence";
import RiceSessionEffort from "./RiceSessionEffort";
import RiceSessionResults from "./RiceSessionResults";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trophy, Lightbulb, Percent, Clock, Target } from "lucide-react";

type Step = "participants" | "reach" | "impact" | "confidence" | "effort" | "results";

interface RiceSessionStepsProps {
  sessionId: string;
}

export default function RiceSessionSteps({ sessionId }: RiceSessionStepsProps) {
  const [currentStep, setCurrentStep] = useState<Step>("participants");
  const [direction, setDirection] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showDetails, setShowDetails] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const goToNext = () => {
    setDirection(1);
    switch (currentStep) {
      case "participants":
        setCurrentStep("reach");
        break;
      case "reach":
        setCurrentStep("impact");
        break;
      case "impact":
        setCurrentStep("confidence");
        break;
      case "confidence":
        setCurrentStep("effort");
        break;
      case "effort":
        setCurrentStep("results");
        break;
      default:
        break;
    }
  };

  const goToPrevious = () => {
    setDirection(-1);
    switch (currentStep) {
      case "reach":
        setCurrentStep("participants");
        break;
      case "impact":
        setCurrentStep("reach");
        break;
      case "confidence":
        setCurrentStep("impact");
        break;
      case "effort":
        setCurrentStep("confidence");
        break;
      case "results":
        setCurrentStep("effort");
        break;
      default:
        break;
    }
  };

  // Animation variants
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  return (
    <div 
      className="relative rounded-xl p-[1.5px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 shadow-md mx-auto max-w-5xl"
      onMouseMove={handleMouseMove}
      style={{
        backgroundImage: `radial-gradient(800px at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.15), transparent 80%)`
      }}
    >
      <div 
        className="absolute inset-0 rounded-xl"
        style={{
          background: `radial-gradient(1200px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(134, 213, 255, 0.25), rgba(228, 138, 255, 0.18), transparent 50%)`,
          transition: 'background 0.3s ease',
          transform: 'translateZ(0)',
        }}
      />
      <div className="absolute inset-0 rounded-xl overflow-hidden">
        <div className="w-full h-full bg-gradient-to-r from-[#86d5ff30] via-[#8091ff25] to-[#e48aff30]"
          style={{
            transform: `translate(${mousePosition.x/20}px, ${mousePosition.y/20}px)`,
            filter: 'blur(40px)',
            transition: 'transform 0.4s ease',
            borderRadius: 'inherit',
          }}
        />
      </div>
      <Card className="relative backdrop-blur-sm bg-background/80 rounded-xl border-0 z-10 p-6">
        <div className="container mx-auto">
          <div className="mb-6">
            <div className="flex justify-center items-center mb-4">
              <h1 className="text-2xl font-bold text-center">RICE Prioritization</h1>
            </div>
            
            <div className="relative">
              <div className="w-full h-2 bg-muted rounded-full">
                <motion.div 
                  className="h-2 bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${calculateProgress(currentStep)}%`,
                    transition: { duration: 0.5 }
                  }}
                />
              </div>
              
              <div className="flex justify-between mt-2">
                <StepIndicator 
                  step="participants" 
                  currentStep={currentStep}
                  label="Participants" 
                />
                <StepIndicator 
                  step="reach" 
                  currentStep={currentStep}
                  label="Reach" 
                />
                <StepIndicator 
                  step="impact" 
                  currentStep={currentStep}
                  label="Impact" 
                />
                <StepIndicator 
                  step="confidence" 
                  currentStep={currentStep}
                  label="Confidence" 
                />
                <StepIndicator 
                  step="effort" 
                  currentStep={currentStep}
                  label="Effort" 
                />
                <StepIndicator 
                  step="results" 
                  currentStep={currentStep}
                  label="Results" 
                />
              </div>
            </div>
          </div>
          
          <div className="mt-8 overflow-hidden relative">
            <AnimatePresence custom={direction} mode="wait">
              <motion.div
                key={currentStep}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ 
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 }
                }}
                className="w-full"
              >
                {currentStep === "participants" && (
                  <RiceSessionParticipants
                    sessionId={sessionId}
                    onStartSession={goToNext}
                  />
                )}
                
                {currentStep === "reach" && (
                  <RiceSessionVoting
                    sessionId={sessionId}
                    onBack={goToPrevious}
                    onNext={goToNext}
                  />
                )}
                
                {currentStep === "impact" && (
                  <RiceSessionImpact
                    sessionId={sessionId}
                    onBack={goToPrevious}
                    onNext={goToNext}
                  />
                )}
                
                {currentStep === "confidence" && (
                  <RiceSessionConfidence
                    sessionId={sessionId}
                    onBack={goToPrevious}
                    onNext={goToNext}
                  />
                )}
                
                {currentStep === "effort" && (
                  <RiceSessionEffort
                    sessionId={sessionId}
                    onBack={goToPrevious}
                    onNext={goToNext}
                  />
                )}
                
                {currentStep === "results" && (
                  <RiceSessionResults
                    sessionId={sessionId}
                    onBack={goToPrevious}
                    onFinish={() => window.location.href = "/"}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Fonctions auxiliaires pour calculer le score RICE
function getRiceComponents(sessionId: string) {
  // Récupérer les composants du score RICE depuis le localStorage

  // Reach: valeur moyenne des votes (échelle 0-5)
  const reachVotesStr = localStorage.getItem(`rice_session_${sessionId}_reach_votes`);
  let reach = 3.5; // Valeur par défaut
  
  if (reachVotesStr) {
    try {
      const reachVotes = JSON.parse(reachVotesStr);
      
      if (reachVotes && reachVotes.length > 0) {
        // Définir les catégories de reach comme dans RiceSessionVoting
        const reachCategories = [
          { id: "sitewide", name: "Sitewide Test", minReach: 80, maxReach: 100, points: 1.0, example: "Header modification" },
          { id: "critical", name: "Critical Journey", minReach: 50, maxReach: 79, points: 0.7, example: "Checkout optimization" },
          { id: "specific", name: "Specific Page", minReach: 20, maxReach: 49, points: 0.5, example: "Product page redesign" },
          { id: "micro", name: "Micro-Interaction", minReach: 1, maxReach: 19, points: 0.3, example: "Delivery tooltip adjustment" }
        ];
        
        // Calculer la moyenne des points de reach
        let sumPoints = 0;
        let count = 0;
        
        reachVotes.forEach((vote: any) => {
          const category = reachCategories.find(cat => cat.id === vote.categoryId);
          if (category) {
            sumPoints += category.points;
            count++;
          } else {
            // Si le categoryId ne correspond pas à nos catégories prédéfinies
            // (peut arriver si l'ID est généré avec uuidv4), utiliser une valeur par défaut
            sumPoints += 0.5; // Valeur moyenne des points de reach
            count++;
          }
        });
        
        // Calculer la moyenne et multiplier par 5 pour avoir une échelle 0-5
        if (count > 0) {
          reach = (sumPoints / count) * 5;
        }
      }
    } catch (e) {
      console.error("Error parsing reach votes:", e);
    }
  }
  
  // Impact: score d'impact des KPIs sélectionnés (échelle 0-5)
  const impactVotesStr = localStorage.getItem(`rice_session_${sessionId}_impact_votes`);
  let impact = 4.0; // Valeur par défaut
  
  if (impactVotesStr) {
    try {
      // L'impact est directement stocké comme un score dans le localStorage
      // Vérifier si la structure est comme attendue
      const impactData = JSON.parse(impactVotesStr);
      
      if (impactData && typeof impactData === 'object') {
        // Si c'est un tableau de votes
        if (Array.isArray(impactData) && impactData.length > 0) {
          let totalImpact = 0;
          
          impactData.forEach((vote: any) => {
            if (vote && typeof vote.impact === 'number') {
              totalImpact += vote.impact;
            } else if (vote && typeof vote.score === 'number') {
              totalImpact += vote.score;
            } else if (vote && typeof vote.value === 'number') {
              totalImpact += vote.value;
            } else if (vote && vote.kpiId && vote.value) {
              // Format utilisé dans certaines implémentations
              totalImpact += parseFloat(vote.value);
            }
          });
          
          if (impactData.length > 0) {
            impact = totalImpact / impactData.length;
          }
        } 
        // Si c'est un objet avec un score total
        else if (impactData.totalScore && typeof impactData.totalScore === 'number') {
          impact = impactData.totalScore;
        } else if (typeof impactData === 'number') {
          // Si c'est directement un nombre
          impact = impactData;
        }
      }
    } catch (e) {
      console.error("Error parsing impact data:", e);
    }
  }
  
  // Si l'impact est toujours 0, essayer de charger depuis supabase
  if (impact === 0) {
    // Utiliser une valeur par défaut raisonnable
    impact = 4.0;
    
    // Note: Un chargement asynchrone depuis Supabase pourrait être implémenté ici,
    // mais ne serait pas visible immédiatement dans l'interface
  }
  
  // Confidence: valeur entre 0 et 1 basée sur les sources de confiance sélectionnées
  const confidenceVotesStr = localStorage.getItem(`rice_session_${sessionId}_confidence_votes`);
  let confidence = 0.8; // Valeur par défaut (0.8 = 80%)
  
  if (confidenceVotesStr) {
    try {
      const confidenceVotes = JSON.parse(confidenceVotesStr);
      
      if (confidenceVotes && Array.isArray(confidenceVotes) && confidenceVotes.length > 0) {
        // Définir les sources de confiance comme dans RiceSessionConfidence
        const confidenceSources = [
          { id: "cs1", name: "Previous A/B Test", points: 2.5 },
          { id: "cs2", name: "Advanced Analytics (SQL/GA4)", points: 2.0 },
          { id: "cs3", name: "Baymard Benchmark", points: 1.5 },
          { id: "cs4", name: "User Testing (5+ participants)", points: 1.2 },
          { id: "cs5", name: "Verified Competitor Copy", points: 0.8 },
          { id: "cs6", name: "Heuristic Audit", points: 0.5 }
        ];
        
        // Grouper les votes par utilisateur
        const userVotesMap = new Map<string, any[]>();
        confidenceVotes.forEach((vote: any) => {
          if (vote && vote.userId) {
            if (!userVotesMap.has(vote.userId)) {
              userVotesMap.set(vote.userId, []);
            }
            userVotesMap.get(vote.userId)?.push(vote);
          }
        });
        
        // Calculer le score pour chaque utilisateur
        const userScores: number[] = [];
        
        userVotesMap.forEach(userVotes => {
          let score = 0;
          
          // Calculer le score basé sur les sources de confiance
          userVotes.forEach(vote => {
            if (vote && vote.sourceId) {
              const source = confidenceSources.find(s => s.id === vote.sourceId);
              if (source) {
                score += source.points;
              } else {
                score += 1.0; // Valeur par défaut si la source n'est pas trouvée
              }
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
        
        if (userScores.length > 0) {
          // Moyenne de tous les scores des utilisateurs
          const totalScore = userScores.reduce((acc, score) => acc + score, 0);
          const avgScore = totalScore / userScores.length;
          
          // Convertir le score de 0-5 en 0-1
          confidence = avgScore / 5;
        }
      }
    } catch (e) {
      console.error("Error parsing confidence votes:", e);
    }
  }
  
  // Effort: score d'effort (valeur positive)
  const effortVotesStr = localStorage.getItem(`rice_session_${sessionId}_effort_votes`);
  let effort = 1.2; // Valeur par défaut
  
  if (effortVotesStr) {
    try {
      const effortVotes = JSON.parse(effortVotesStr);
      
      if (effortVotes && Array.isArray(effortVotes) && effortVotes.length > 0) {
        const effortSizes = [
          { id: "es1", name: "Extra Small", size: "XS", devEffort: 0.3, designEffort: 0.2 },
          { id: "es2", name: "Small", size: "S", devEffort: 0.5, designEffort: 0.3 },
          { id: "es3", name: "Medium", size: "M", devEffort: 0.8, designEffort: 0.5 },
          { id: "es4", name: "Large", size: "L", devEffort: 1.2, designEffort: 0.8 },
          { id: "es5", name: "Extra Large", size: "XL", devEffort: 1.5, designEffort: 1.2 }
        ];
        
        // Calculer le score d'effort moyen
        let totalDevEffort = 0;
        let totalDesignEffort = 0;
        let validVotes = 0;
        
        effortVotes.forEach((vote: any) => {
          if (vote && vote.devSizeId && vote.designSizeId) {
            const devSize = effortSizes.find(size => size.id === vote.devSizeId);
            const designSize = effortSizes.find(size => size.id === vote.designSizeId);
            
            if (devSize && designSize) {
              totalDevEffort += devSize.devEffort;
              totalDesignEffort += designSize.designEffort;
              validVotes++;
            }
          }
        });
        
        if (validVotes > 0) {
          const avgDevEffort = totalDevEffort / validVotes;
          const avgDesignEffort = totalDesignEffort / validVotes;
          
          // Calculer la moyenne pondérée (55% pour dev et 45% pour design)
          effort = Math.round(((avgDevEffort * 0.55) + (avgDesignEffort * 0.45)) * 100) / 100;
        }
      }
    } catch (e) {
      console.error("Error parsing effort votes:", e);
    }
  }
  
  // Log pour débogage
  console.log("RICE Components:", { reach, impact, confidence, effort });
  
  return { reach, impact, confidence, effort };
}

function calculateRiceScore(sessionId: string) {
  // Tenter de récupérer le score depuis localStorage
  const storedScoreStr = localStorage.getItem(`rice_session_${sessionId}_summary`);
  if (storedScoreStr) {
    try {
      const storedScore = JSON.parse(storedScoreStr);
      if (storedScore && typeof storedScore.rice_score === 'number') {
        return storedScore.rice_score;
      }
    } catch (e) {
      console.error("Erreur lors de la lecture du score RICE stocké:", e);
    }
  }
  
  // Sinon, utiliser la méthode traditionnelle
  const { reach, impact, confidence, effort } = getRiceComponents(sessionId);
  
  // Formule RICE = (Reach × Impact × Confidence) ÷ Effort
  return (reach * impact * confidence) / effort;
}

function getRiceQualitativeScore(score: number) {
  if (score >= 10) return "Excellent";
  if (score >= 7) return "Très bon";
  if (score >= 5) return "Bon";
  if (score >= 3) return "Moyen";
  if (score >= 1) return "Faible";
  return "Très faible";
}

// Fonction StepIndicator pour visualiser l'étape active
function StepIndicator({ 
  step, 
  currentStep, 
  label 
}: { 
  step: Step; 
  currentStep: Step;
  label: string;
}) {
  const stepOrder: Record<Step, number> = {
    participants: 1,
    reach: 2,
    impact: 3,
    confidence: 4,
    effort: 5,
    results: 6
  };
  
  const isActive = currentStep === step;
  const isCompleted = stepOrder[currentStep] > stepOrder[step];
  
  return (
    <div className="flex flex-col items-center">
      <motion.div 
        animate={
          isActive 
            ? { scale: [1, 1.1, 1] }
            : {}
        }
        transition={{ duration: 0.3 }}
        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${
          isActive
            ? "border-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-medium" 
            : isCompleted
              ? "border-0 bg-gradient-to-r from-blue-400/80 via-purple-400/80 to-pink-400/80 text-white"
              : "border-muted bg-transparent text-muted-foreground"
        }`}
      >
        {stepOrder[step]}
      </motion.div>
      <span className={`text-xs mt-1 ${
        isActive ? "font-medium" : "text-muted-foreground"
      }`}>{label}</span>
    </div>
  );
}

function calculateProgress(currentStep: Step): number {
  switch (currentStep) {
    case "participants":
      return 0;
    case "reach":
      return 20;
    case "impact":
      return 40;
    case "confidence":
      return 60;
    case "effort":
      return 80;
    case "results":
      return 100;
    default:
      return 0;
  }
} 