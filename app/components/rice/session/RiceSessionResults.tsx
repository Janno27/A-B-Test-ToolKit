"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Trophy,
  Target,
  Lightbulb,
  Clock,
  ArrowLeft,
  InfoIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import supabaseRiceSessionService from "../../../services/db/SupabaseRiceSessionService";
import { RiceSession } from "../../../services/RiceSessionService";
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Label,
  ZAxis
} from 'recharts';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

// Interface pour représenter les scores RICE calculés retournés par l'API
interface RiceScoreData {
  reach: number;
  impact: number;
  confidence: number;
  effort: number;
  rice: number;
}

// Interface pour représenter les résultats RICE stockés dans la base de données
interface RiceResultsSummary {
  reach_score: number;
  impact_score: number;
  confidence_score: number;
  effort_score: number;
  rice_score: number;
  created_at?: string;
  updated_at?: string;
}

// Interface pour les données du graphique
interface ChartDataPoint {
  id: string;
  name: string;
  reach: number;
  impact: number;
  confidence: number;
  effort: number;
  rice: number;
  impactScore: number;
  x: number; // effort
  y: number; // impact * reach * confidence
  z: number; // taille du point (rice score)
  isCurrentSession?: boolean;
  created_at: string;
}

// Étendre l'interface RiceSession du service
interface ExtendedRiceSession extends RiceSession {
  riceResults?: RiceResultsSummary;
}

interface RiceSessionResultsProps {
  sessionId: string;
  onBack: () => void;
  onFinish: () => void;
}

// Tooltip personnalisé pour les points du graphique
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border rounded-md shadow-md">
        <p className="font-medium">{data.name}</p>
        <p>RIC: {data.y.toFixed(2)}</p>
        <p>Effort: {data.x.toFixed(2)}</p>
        <p>RICE: {data.rice.toFixed(2)}</p>
      </div>
    );
  }
  return null;
};

export default function RiceSessionResults({ sessionId, onBack, onFinish }: RiceSessionResultsProps) {
  const [riceScore, setRiceScore] = useState<RiceScoreData>({
    reach: 0,
    impact: 0,
    confidence: 0,
    effort: 0,
    rice: 0
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [priorityThresholds, setPriorityThresholds] = useState({ high: 3.0, medium: 1.5 });
  const [priorityLevel, setPriorityLevel] = useState("Low Priority");
  const { toast } = useToast();
  
  // Récupérer les scores RICE depuis Supabase
  useEffect(() => {
    setIsLoading(true);
    
    async function loadRiceScores() {
      try {
        console.log(`Récupération des scores RICE pour la session ${sessionId} depuis Supabase`);
        
        // Récupérer le score depuis Supabase
        const session = await supabaseRiceSessionService.getSessionById(sessionId) as ExtendedRiceSession;
        
        if (session && session.riceResults) {
          console.log("Scores RICE récupérés depuis Supabase:", session.riceResults);
          
          setRiceScore({
            reach: session.riceResults.reach_score || 0,
            impact: session.riceResults.impact_score || 0,
            confidence: session.riceResults.confidence_score || 0,
            effort: session.riceResults.effort_score || 0,
            rice: session.riceResults.rice_score || 0
          });
        } else {
          console.log("Aucun score RICE trouvé pour cette session, calcul en cours...");
          
          try {
            // Si aucun score n'est trouvé, calculer et sauvegarder
            const calculatedScores = await supabaseRiceSessionService.calculateAndSaveRiceScore(sessionId);
            
            if (calculatedScores) {
              console.log("Scores RICE calculés et sauvegardés:", calculatedScores);
              setRiceScore({
                reach: calculatedScores.reach || 0,
                impact: calculatedScores.impact || 0,
                confidence: calculatedScores.confidence || 0,
                effort: calculatedScores.effort || 0,
                rice: calculatedScores.rice || 0
              });
              
              // Sauvegarde également dans le localStorage pour compatibilité avec RiceSessionSteps
              try {
                localStorage.setItem(`rice_session_${sessionId}_summary`, JSON.stringify({
                  rice_score: calculatedScores.rice || 0
                }));
              } catch (e) {
                console.warn("Impossible de sauvegarder le score dans localStorage:", e);
              }
            } else {
              throw new Error("Impossible de calculer les scores RICE");
            }
          } catch (calcError) {
            console.error("Erreur lors du calcul et de la sauvegarde des scores RICE:", calcError);
            // Récupérer les résultats existants en cas d'erreur de duplication
            const summary = await supabaseRiceSessionService.getRiceSummary(sessionId);
            if (summary) {
              console.log("Scores RICE récupérés après erreur:", summary);
              setRiceScore({
                reach: summary.reach_score || 0,
                impact: summary.impact_score || 0,
                confidence: summary.confidence_score || 0,
                effort: summary.effort_score || 0,
                rice: summary.rice_score || 0
              });
            } else {
              throw new Error("Impossible de récupérer les scores RICE après erreur");
            }
          }
        }
        
        // Récupérer les seuils dynamiques de priorité
        const priorityInfo = await supabaseRiceSessionService.getPriorityLevel(
          session?.riceResults?.rice_score || 0
        );
        setPriorityLevel(priorityInfo.level);
        setPriorityThresholds(priorityInfo.thresholds);
        
        // Récupérer les données pour le graphique
        const historicalData = await supabaseRiceSessionService.getAllRiceScoresForChart();
        
        if (historicalData && historicalData.length > 0) {
          // Transformer les données pour le graphique
          const formattedData = historicalData.map(item => {
            const isCurrentSession = item.id === sessionId;
            return {
              ...item,
              x: item.effort,
              y: item.impactScore,
              z: item.rice * 5, // Taille du point proportionnelle au score RICE
              isCurrentSession
            };
          });
          
          setChartData(formattedData);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des scores RICE:", error);
        toast({
          title: "Error",
          description: "Unable to retrieve or calculate RICE scores",
          variant: "destructive"
        });
        
        // Valeurs par défaut en cas d'erreur
        setRiceScore({
          reach: 0.7,
          impact: 3,
          confidence: 0.8,
          effort: 1,
          rice: 2.1
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    loadRiceScores();
  }, [sessionId, toast]);
  
  // Determine priority class based on RICE score and dynamic thresholds
  const getPriorityClass = () => {
    if (riceScore.rice >= priorityThresholds.high) return "text-green-600";
    if (riceScore.rice >= priorityThresholds.medium) return "text-amber-600";
    return "text-red-600";
  };
  
  return (
    <Card className="p-6 max-w-4xl mx-auto">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold leading-tight mb-1">RICE Score Results</h2>
          <p className="text-sm text-muted-foreground">
            Discover the final RICE score and its components for this feature.
          </p>
        </div>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="h-12 w-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            <p className="mt-4 text-muted-foreground">Calculating RICE score...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center">
                <Trophy className="h-6 w-6 mr-2 text-yellow-500" />
                <h3 className="text-xl font-semibold">RICE Score</h3>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 ml-1">
                      <InfoIcon className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <div className="space-y-2">
                      <h4 className="font-medium">RICE Formula</h4>
                      <p className="text-sm text-muted-foreground">
                        RICE = (Reach × Impact × Confidence) ÷ Effort
                      </p>
                      <div className="text-sm font-mono bg-muted/30 p-2 rounded">
                        {riceScore.rice.toFixed(2)} = ({riceScore.reach.toFixed(1)} × {riceScore.impact.toFixed(1)} × {riceScore.confidence.toFixed(2)}) ÷ {riceScore.effort.toFixed(1)}
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </div>
              <div className="mt-2 text-5xl font-bold text-primary">
                {riceScore.rice.toFixed(2)}
              </div>
              <div className={`mt-2 font-medium ${getPriorityClass()}`}>
                {priorityLevel}
                <span className="text-xs ml-2 text-muted-foreground">
                  (High: {priorityThresholds.high}+, Medium: {priorityThresholds.medium}+)
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-muted/20 rounded-lg p-4 text-center">
                <div className="flex justify-center mb-2">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Target className="h-5 w-5 text-blue-700" />
                  </div>
                </div>
                <div className="text-sm font-medium">Reach</div>
                <div className="text-2xl font-bold mt-1">
                  {riceScore.reach.toFixed(1)}
                </div>
              </div>
              
              <div className="bg-muted/20 rounded-lg p-4 text-center">
                <div className="flex justify-center mb-2">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Lightbulb className="h-5 w-5 text-purple-700" />
                  </div>
                </div>
                <div className="text-sm font-medium">Impact</div>
                <div className="text-2xl font-bold mt-1">
                  {riceScore.impact.toFixed(1)}
                </div>
              </div>
              
              <div className="bg-muted/20 rounded-lg p-4 text-center">
                <div className="flex justify-center mb-2">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Target className="h-5 w-5 text-green-700" />
                  </div>
                </div>
                <div className="text-sm font-medium">Confidence</div>
                <div className="text-2xl font-bold mt-1">
                  {riceScore.confidence.toFixed(2)}
                </div>
              </div>
              
              <div className="bg-muted/20 rounded-lg p-4 text-center">
                <div className="flex justify-center mb-2">
                  <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-red-700" />
                  </div>
                </div>
                <div className="text-sm font-medium">Effort</div>
                <div className="text-2xl font-bold mt-1">
                  {riceScore.effort.toFixed(1)}
                </div>
              </div>
            </div>
            
            {/* Quadrant Chart */}
            <div className="mt-8">
              <div className="h-80 w-full flex justify-center items-center">
                <ResponsiveContainer width="90%" height="100%">
                  <ScatterChart
                    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis 
                      type="number" 
                      dataKey="x" 
                      name="Effort" 
                      domain={[0, 'dataMax + 1']}
                      hide={true}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="y" 
                      name="Impact Score (R×I×C)" 
                      domain={[0, 'dataMax + 2']}
                      hide={true}
                    />
                    <ZAxis 
                      type="number" 
                      dataKey="z" 
                      range={[60, 400]}
                      name="RICE Score" 
                    />
                    <Tooltip content={<CustomTooltip />} />
                    
                    {/* Reference Lines for Quadrants - with stronger styling */}
                    <ReferenceLine 
                      y={chartData.length > 0 
                        ? chartData.reduce((sum, item) => sum + item.y, 0) / chartData.length 
                        : 5} 
                      stroke="#d4d4d8" 
                      strokeDasharray="0"
                      strokeWidth={1}
                    />
                    <ReferenceLine 
                      x={chartData.length > 0
                        ? chartData.reduce((sum, item) => sum + item.x, 0) / chartData.length 
                        : 2} 
                      stroke="#d4d4d8" 
                      strokeDasharray="0"
                      strokeWidth={1}
                    />
                    
                    {/* Quadrant Labels - better positioned */}
                    <text x="25%" y="20%" fill="#5B8AF9" fontSize={12} fontWeight="500" opacity="0.7" textAnchor="middle">
                      Easy win
                    </text>
                    <text x="75%" y="20%" fill="#5B8AF9" fontSize={12} fontWeight="500" opacity="0.7" textAnchor="middle">
                      Big bet
                    </text>
                    <text x="25%" y="80%" fill="#5B8AF9" fontSize={12} fontWeight="500" opacity="0.7" textAnchor="middle">
                      Fill-in
                    </text>
                    <text x="75%" y="80%" fill="#5B8AF9" fontSize={12} fontWeight="500" opacity="0.7" textAnchor="middle">
                      Money pit
                    </text>
                    
                    {/* Historical Data Points */}
                    <Scatter
                      name="A/B Tests"
                      data={chartData.filter(item => !item.isCurrentSession)}
                      fill="#8884d8"
                      opacity={0.6}
                    />
                    
                    {/* Current Session Data Point */}
                    <Scatter
                      name="Current Test"
                      data={chartData.filter(item => item.isCurrentSession)}
                      fill="#ff7300"
                      opacity={1}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <Button onClick={onFinish} disabled={isLoading}>
            Finish
          </Button>
        </div>
      </div>
    </Card>
  );
}
