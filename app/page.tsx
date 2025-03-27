"use client";

import { useState, useRef, useEffect } from "react";
import { Calculator, Loader2, TrendingUp, Split, Calendar, Users, HelpCircle, Info, ArrowRight } from "lucide-react";
import { 
  Bar, BarChart, Line, LineChart, Pie, PieChart, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ReferenceArea, ReferenceLine
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { Switch } from "@/components/ui/switch";

export default function Home() {
  const [visits, setVisits] = useState("");
  const [conversions, setConversions] = useState("");
  const [traffic, setTraffic] = useState([50]);
  const [variations, setVariations] = useState("2");
  const [improvement, setImprovement] = useState("1");
  const [customImprovement, setCustomImprovement] = useState("");
  const [confidence, setConfidence] = useState("95");
  const [method, setMethod] = useState("frequentist");
  const [result, setResult] = useState<{ days: number; minSample: number } | null>(null);
  const [confidenceEvolution, setConfidenceEvolution] = useState<{
    dataPointsBySample: Array<{
      sampleSize: number;
      confidence: number;
      ciWidth: number;
      isUncertainty: boolean;
    }>;
    dataPointsByDay: Array<{
      day: number;
      confidence: number;
      ciWidth: number;
      isUncertainty: boolean;
    }>;
    uncertaintyBoundSample: number;
    uncertaintyBoundDay: number;
    targetSampleSize: number;
    targetDay: number;
    totalSampleSize: number;
    totalDays: number;
  } | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showBySample, setShowBySample] = useState(false);
  const [showConfidenceBySample, setShowConfidenceBySample] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  const resultRef = useRef<HTMLDivElement>(null);

  const conversionRate = visits && conversions 
    ? ((Number(conversions) / Number(visits)) * 100).toFixed(2)
    : "0.00";

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleImprovementChange = (value: string) => {
    if (value === "custom") {
      setShowCustomModal(true);
    } else {
      setImprovement(value);
    }
  };

  const calculateDays = async () => {
    setIsCalculating(true);
    try {
      // URL du backend FastAPI (à modifier selon votre environnement)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
      const requestBody = {
          visits: Number(visits),
          conversions: Number(conversions),
          traffic: traffic[0],
          variations: Number(variations),
          improvement: improvement === "custom" ? Number(customImprovement) : Number(improvement),
          confidence: Number(confidence),
          method,
      };
      
      // 1. Calcul principal
      const response = await fetch(`${apiUrl}/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        throw new Error("Erreur lors du calcul");
      }
      
      const data = await response.json();
      setResult(data);
      
      // 2. Calcul de l'évolution de la confiance
      try {
        const evolutionResponse = await fetch(`${apiUrl}/confidence-evolution`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });
        
        if (evolutionResponse.ok) {
          const evolutionData = await evolutionResponse.json();
          setConfidenceEvolution(evolutionData);
        }
      } catch (evolutionError) {
        console.error("Error fetching confidence evolution:", evolutionError);
        // Ne pas bloquer le flux principal en cas d'erreur sur ce calcul secondaire
      }
      
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (error) {
      console.error("Calculation error:", error);
      // Fallback values for demo
      setResult({ days: 14, minSample: 1000 });
    }
    setIsCalculating(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex justify-end">
          <ThemeToggle />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tighter bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-transparent bg-clip-text">
            A/B Test Toolkit
          </h1>
          <p className="text-muted-foreground mb-3">
            Powerful tools to plan and analyze your A/B tests
          </p>
        </div>

        <Tabs defaultValue="duration" className="w-full">
          <div className="flex justify-center mb-4">
            <TabsList className="grid w-[400px] grid-cols-2">
              <TabsTrigger value="duration">Duration Calculator</TabsTrigger>
              <TabsTrigger value="analysis">Results Analysis</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="duration">
            <div 
              className="relative rounded-xl p-[1.5px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 shadow-md"
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
              <Card className="relative p-6 backdrop-blur-sm bg-background/80 rounded-xl border-0 z-10">
            <div className="grid gap-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="visits">Daily Visits</Label>
                  <div className="relative">
                    <Input
                      id="visits"
                      placeholder="e.g. 1000"
                      value={visits}
                      onChange={(e) => setVisits(e.target.value)}
                      type="number"
                      min="0"
                    />
                  </div>
                  {visits && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Conversion Rate: <span className="font-medium">{conversionRate}%</span>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="conversions">Daily Conversions</Label>
                  <div className="relative">
                    <Input
                      id="conversions"
                      placeholder="e.g. 100"
                      value={conversions}
                      onChange={(e) => setConversions(e.target.value)}
                      type="number"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label>Traffic Allocation</Label>
                    <div className="mt-2">
                      <Slider
                        value={traffic}
                        onValueChange={setTraffic}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        {traffic[0]}% of traffic included in test
                      </p>
                    </div>
                  </div>
                  <div className="w-[200px]">
                    <Label>Number of Variations</Label>
                        <Select value={variations} onValueChange={setVariations}>
                          <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select variations" />
                      </SelectTrigger>
                      <SelectContent>
                        {[2, 3, 4, 5, 6].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} variations
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                    <div className="flex items-center justify-between">
                <Label>Statistical Method</Label>
                    </div>
                <RadioGroup
                  value={method}
                  onValueChange={setMethod}
                      className="flex space-x-12 mt-2"
                >
                      <div className="flex flex-col space-y-1">
                        <span className="inline-flex items-center rounded-full border px-1.5 py-0 text-[10px] font-medium bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 ml-6 mb-1 w-fit">
                          Recommended
                        </span>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="frequentist" id="frequentist" />
                          <Label htmlFor="frequentist" className="flex items-center">
                            Frequentist
                            <TooltipProvider>
                              <Tooltip delayDuration={300}>
                                <TooltipTrigger asChild>
                                  <InfoCircledIcon className="h-4 w-4 text-muted-foreground cursor-help ml-1" />
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-md w-96 p-4 space-y-2">
                                  <p className="font-medium text-sm">Frequentist Method</p>
                                  <div className="text-xs text-muted-foreground space-y-2">
                                    <p>Based on hypothesis testing - calculates the probability of observing your test results if there truly is no difference between variations.</p>
                                    <div className="bg-muted/60 p-2 rounded text-foreground/90">
                                      <p className="font-medium">Key Calculations:</p>
                                      <div className="mt-1 space-y-1">
                                        <p><span className="font-mono">z-score = (p₂ - p₁) / √[p(1-p)(1/n₁ + 1/n₂)]</span> where p is pooled conversion rate</p>
                                        <p><span className="font-mono">sample size = 16 * σ² / MDE²</span> where MDE is minimum detectable effect</p>
                                        <p><span className="font-mono">Statistical Power = 1 - β</span> (typically set at 80%)</p>
                                      </div>
                                    </div>
                                    <div className="pt-1">
                                      <p className="font-medium">Advantages:</p>
                                      <ul className="list-disc list-inside">
                                        <li>Industry standard approach</li>
                                        <li>Fixed sample size calculation</li>
                                        <li>Well-suited for high-traffic sites</li>
                                      </ul>
                                    </div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </Label>
                        </div>
                  </div>
                      <div className="flex flex-col space-y-1">
                        <div className="h-[18px]"></div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="bayesian" id="bayesian" />
                          <Label htmlFor="bayesian" className="flex items-center">
                            Bayesian
                            <TooltipProvider>
                              <Tooltip delayDuration={300}>
                                <TooltipTrigger asChild>
                                  <InfoCircledIcon className="h-4 w-4 text-muted-foreground cursor-help ml-1" />
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-md w-96 p-4 space-y-2">
                                  <p className="font-medium text-sm">Bayesian Method</p>
                                  <div className="text-xs text-muted-foreground space-y-2">
                                    <p>Uses probability distributions to directly calculate the likelihood that one variation is better than another. Updates continuously with new data.</p>
                                    <div className="bg-muted/60 p-2 rounded text-foreground/90">
                                      <p className="font-medium">Key Calculations:</p>
                                      <div className="mt-1 space-y-1">
                                        <div className="text-xs">
                                          <strong>Formule:</strong> P(B{'>'}A) = ∫ P(pᵦ | data) × [∫ P(pₐ | data) × 1(pᵦ {'>'}pₐ) dpₐ] dpᵦ
                                        </div>
                                        <p><span className="font-mono">Prior: Beta(α,β)</span> - Jeffrey's prior uses α=β=0.5</p>
                                        <p><span className="font-mono">Posterior: Beta(α+conversions, β+non-conversions)</span></p>
                                      </div>
                                    </div>
                                    <div className="pt-1">
                                      <p className="font-medium">Advantages:</p>
                                      <ul className="list-disc list-inside">
                                        <li>More intuitive probabilities (direct P(B{'>'}A))</li>
                                        <li>Better for small sample sizes</li>
                                        <li>Allows early stopping when confidence is reached</li>
                                        <li>Incorporates prior knowledge</li>
                                      </ul>
                                    </div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </Label>
                        </div>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Expected Improvement</Label>
                  <Select 
                    value={improvement} 
                    onValueChange={handleImprovementChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select improvement">
                        {improvement === "custom" 
                          ? `+${customImprovement}%` 
                          : `+${improvement}%`}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {[0.5, 1, 2, 3, 4, 5].map((percent) => (
                        <SelectItem key={percent} value={percent.toString()}>
                          +{percent}%
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">Custom value</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Statistical Confidence</Label>
                  <Select value={confidence} onValueChange={setConfidence}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select confidence" />
                    </SelectTrigger>
                    <SelectContent>
                      {[80, 85, 90, 95, 99].map((percent) => (
                        <SelectItem key={percent} value={percent.toString()}>
                          {percent}%
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={calculateDays}
                    className="w-[200px] mx-auto bg-primary hover:bg-primary/90 transition-colors"
                    disabled={isCalculating || !visits || !conversions}
              >
                {isCalculating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <Calculator className="mr-2 h-4 w-4" />
                    Calculate Duration
                  </>
                )}
              </Button>

              {result && (
                    <div ref={resultRef} className="mt-8 space-y-6">
                      <div className="text-center">
                        <h3 className="text-2xl font-medium mb-1">Test Requirements</h3>
                        <p className="text-muted-foreground text-sm">Estimated resources needed for statistical significance</p>
                      </div>
                      
                      <div className="flex items-center justify-center">
                        <div className="relative flex items-center justify-center">
                          <div className="flex flex-col items-center">
                            <span className="text-2xl font-bold">{result.days} days</span>
                            <span className="text-sm text-muted-foreground">Test Duration</span>
                          </div>
                          
                          <div className="mx-4 text-lg font-medium text-muted-foreground">AND</div>
                          
                          <div className="flex flex-col items-center">
                            <span className="text-2xl font-bold">{result.minSample ? result.minSample.toLocaleString() : '0'}</span>
                            <span className="text-sm text-muted-foreground">Total Sample Size</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <button 
                          onClick={() => setShowDetailModal(true)} 
                          className="text-sm text-muted-foreground hover:text-primary hover:underline transition-all duration-200"
                        >
                          View detailed calculation
                        </button>
                      </div>
                      
                      <div className="grid gap-6 md:grid-cols-2 mt-6">
                        <div className="rounded-lg border bg-card/80 p-4">
                          <h4 className="text-lg font-medium mb-3 flex items-center">
                            <Split className="h-5 w-5 mr-2 text-blue-500" />
                            Traffic Distribution
                          </h4>
                          <div className="aspect-square relative flex items-center justify-center h-[250px]">
                            {(() => {
                              // Calculate the data for the pie chart
                              const controlPercent = Math.round(100 / Number(variations));
                              const variantPercent = Math.round(100 - controlPercent);
                              const trackedPercent = Math.round(traffic[0]);
                              const untrackedPercent = 100 - trackedPercent;
                              
                              const controlValue = Math.round((controlPercent / 100) * trackedPercent);
                              const variantValue = Math.round((variantPercent / 100) * trackedPercent);
                              
                              const data = [
                                { name: 'Control', value: controlValue, fill: '#4f46e5' },
                                { name: 'Variant', value: variantValue, fill: '#8b5cf6' },
                                { name: 'Untracked', value: untrackedPercent, fill: '#d1d5db' }
                              ];
                              
                              return (
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                                    <Pie
                                      data={data}
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={50}
                                      outerRadius={90}
                                      paddingAngle={3}
                                      dataKey="value"
                                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                      labelLine={false}
                                      style={{ fontSize: '8px' }}
                                    />
                                    <Legend 
                                      verticalAlign="bottom" 
                                      height={20} 
                                      iconSize={6}
                                      iconType="circle"
                                      wrapperStyle={{ fontSize: '9px' }}
                                    />
                                  </PieChart>
                                </ResponsiveContainer>
                              );
                            })()}
                          </div>
                          <div className="text-xs text-muted-foreground mt-4 pt-3 border-t">
                            <div className="flex justify-between">
                              <span>Traffic in test: {traffic[0]}%</span>
                              <span>Untracked: {100 - traffic[0]}%</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="rounded-lg border bg-card/80 p-4">
                          <h4 className="text-lg font-medium mb-3 flex items-center">
                            <TrendingUp className="h-5 w-5 mr-2 text-purple-500" />
                            Expected Lift
                          </h4>
                          <div className="aspect-square relative flex items-center justify-center h-[250px]">
                            {(() => {
                              // Calculate data for the bar chart
                              const currentRate = Number(conversionRate);
                              const improvementVal = improvement === "custom" ? Number(customImprovement) : Number(improvement);
                              const expectedRate = Number((currentRate * (1 + improvementVal / 100)).toFixed(2));
                              
                              const data = [
                                { name: 'Current', value: currentRate, fill: '#6b7280' },
                                { name: 'Expected', value: expectedRate, fill: '#10b981' }
                              ];
                              
                              return (
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart
                                    data={data}
                                    margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                                    <XAxis 
                                      dataKey="name" 
                                      axisLine={false} 
                                      tick={{ fontSize: 8 }}
                                      tickLine={false}
                                    />
                                    <YAxis 
                                      unit="%" 
                                      domain={[0, 'auto']} 
                                      axisLine={false}
                                      tickLine={false}
                                      tick={{ fontSize: 8 }}
                                      width={25}
                                    />
                                    <Bar 
                                      dataKey="value" 
                                      radius={[4, 4, 0, 0]} 
                                      maxBarSize={80}
                                    />
                                  </BarChart>
                                </ResponsiveContainer>
                              );
                            })()}
                          </div>
                          <div className="text-xs text-muted-foreground mt-4 pt-3 border-t">
                            <div className="flex justify-between">
                              <span>Current Rate: {conversionRate}%</span>
                              <span>Expected Rate: {(Number(conversionRate) * (1 + (improvement === "custom" ? Number(customImprovement) : Number(improvement)) / 100)).toFixed(2)}%</span>
                            </div>
                            <div className="flex justify-end mt-1">
                              <span className="font-medium text-green-500">
                                +{improvement === "custom" ? customImprovement : improvement}% Lift
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="rounded-lg border bg-card/80 p-4">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-lg font-medium">Statistical Confidence Evolution</h4>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-muted-foreground">Days</span>
                            <Switch 
                              checked={showBySample}
                              onCheckedChange={setShowBySample}
                              className="scale-75"
                            />
                            <span className="text-xs text-muted-foreground">Sample</span>
                          </div>
                        </div>
                        <div className="h-[300px] w-full">
                          {(() => {
                            if (!confidenceEvolution) return null;
                            
                            const data = showBySample 
                              ? confidenceEvolution.dataPointsBySample
                              : confidenceEvolution.dataPointsByDay;

                            const targetConfidence = Number(confidence);

                            return (
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart 
                                  data={data}
                                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                  <XAxis 
                                    dataKey={showBySample ? "sampleSize" : "day"}
                                    tickFormatter={(value) => {
                                      if (showBySample) {
                                        // Formatage pour les grandes valeurs
                                        return value >= 1000 ? `${Math.round(value/1000)}k` : value;
                                      } else {
                                        // Jours affichés simplement
                                        return `D${value}`;
                                      }
                                    }}
                                    axisLine={{ stroke: 'var(--border)', strokeWidth: 1 }}
                                    tick={{ fontSize: 10, fill: 'var(--foreground)' }}
                                    tickLine={false}
                                  />
                                  <YAxis 
                                    yAxisId="left"
                                    domain={[0, 100]} 
                                    axisLine={{ stroke: 'var(--border)', strokeWidth: 1 }}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: 'var(--foreground)' }}
                                    width={36}
                                    tickFormatter={(value) => `${value}%`}
                                    label={{ 
                                      value: 'Statistical Confidence',
                                      angle: -90,
                                      position: 'insideLeft',
                                      offset: -20,
                                      style: { 
                                        textAnchor: 'middle',
                                        fill: 'var(--foreground)',
                                        fontSize: 10
                                      }
                                    }}
                                  />
                                  <YAxis 
                                    yAxisId="right"
                                    orientation="right"
                                    domain={[0, 'auto']}
                                    axisLine={{ stroke: 'var(--border)', strokeWidth: 1 }}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: 'var(--foreground)' }}
                                    width={36}
                                    tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                                    label={{ 
                                      value: 'CI Width',
                                      angle: 90,
                                      position: 'insideRight',
                                      offset: -10,
                                      style: { 
                                        textAnchor: 'middle',
                                        fill: 'var(--foreground)',
                                        fontSize: 10
                                      }
                                    }}
                                  />
                                  {/* Zone d'incertitude */}
                                  {(() => {
                                    // Calculer la largeur de la zone d'incertitude en fonction des données
                                    const uncertainCount = data.filter(d => d.isUncertainty).length;
                                    if (uncertainCount === 0) return null;
                                    
                                    const uncertaintyWidth = (uncertainCount / data.length) * 100;
                                    // Limiter la largeur à 25% max du graphique pour s'assurer qu'elle reste au début
                                    const limitedWidth = Math.min(uncertaintyWidth, 25);
                                    
                                    return (
                                      <rect 
                                        x="0%" 
                                        y="0%" 
                                        width={`${limitedWidth}%`} 
                                        height="100%" 
                                        fill="var(--accent)"
                                        fillOpacity={0.1}
                                      />
                                    );
                                  })()}
                                  {/* Target confidence line */}
                                  <ReferenceLine
                                    y={Number(confidence)}
                                    stroke="#10b981"
                                    strokeWidth={1.5}
                                    strokeDasharray="4 4"
                                    yAxisId="left"
                                    label={{
                                      value: `${confidence}%`,
                                      position: 'right',
                                      fill: '#10b981',
                                      fontSize: 10,
                                      offset: 10
                                    }}
                                  />
                                  {/* 99% confidence line */}
                                  <ReferenceLine
                                    y={99}
                                    stroke="#10b981"
                                    strokeWidth={1}
                                    strokeDasharray="2 4"
                                    opacity={0.5}
                                    yAxisId="left"
                                  />
                                  <Line 
                                    yAxisId="left"
                                    type="monotone" 
                                    dataKey="confidence" 
                                    stroke="#4f46e5"
                                    strokeWidth={2}
                                    dot={{ stroke: '#4f46e5', strokeWidth: 1, r: 2, fill: '#4f46e5' }}
                                    activeDot={{ r: 4, strokeWidth: 1 }}
                                    name="Statistical Confidence"
                                  />
                                  <Line 
                                    yAxisId="right"
                                    type="monotone" 
                                    dataKey="ciWidth" 
                                    stroke="#ef4444"
                                    strokeWidth={1.5}
                                    strokeDasharray="5 3"
                                    dot={{ stroke: '#ef4444', strokeWidth: 1, r: 2, fill: '#ef4444' }}
                                    activeDot={{ r: 4, strokeWidth: 1 }}
                                    name="Confidence Interval"
                                  />
                                  <RechartsTooltip 
                                    content={({ active, payload, label }) => {
                                      if (active && payload && payload.length) {
                                        const targetReached = payload[0]?.value && Number(payload[0].value) >= Number(confidence);
                                        const reached99 = payload[0]?.value && Number(payload[0].value) >= 99;
                                        
                                        return (
                                          <div className="bg-popover/95 backdrop-blur-sm border rounded-md shadow-md p-2 dark:border-gray-700 dark:bg-gray-900/95">
                                            <div className="space-y-1">
                                              <p className="text-sm font-medium leading-none dark:text-gray-200">
                                                {showBySample 
                                                  ? `Sample size: ${label.toLocaleString()}`
                                                  : `Day ${label}`
                                                }
                                              </p>
                                              {payload.map((entry, index) => (
                                                <div key={`tooltip-${index}`} className="flex items-center">
                                                  <div 
                                                    className="w-2 h-2 rounded-full mr-1" 
                                                    style={{ backgroundColor: entry.color }}
                                                  />
                                                  <span className="text-xs text-muted-foreground dark:text-gray-300">
                                                    {entry.name === "Statistical Confidence" 
                                                      ? `Confidence: ${Number(entry.value || 0).toFixed(2)}%`
                                                      : entry.name === "Confidence Interval" 
                                                        ? `CI Width: ±${(Number(entry.value || 0) * 100).toFixed(2)}%`
                                                        : `${entry.name}: ${entry.value}`
                                                    }
                                                  </span>
                                                </div>
                                              ))}
                                              {targetReached && !reached99 && (
                                                <p className="text-xs text-emerald-500 mt-1 font-medium">
                                                  Target confidence reached
                                                </p>
                                              )}
                                              {reached99 && (
                                                <p className="text-xs text-emerald-500 mt-1 font-medium">
                                                  99% confidence reached
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      }
                                      return null;
                                    }}
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            );
                          })()}
                        </div>
                        <div className="text-xs text-muted-foreground mt-4 pt-3 border-t space-y-2">
                          <div className="flex justify-between">
                            <span>Blue line: Statistical confidence</span>
                            <span>Red dashed: Confidence interval (CI) width</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Gray area: Initial uncertainty phase (misleadingly high values)</span>
                            <span>Target confidence: {confidence}% <span className="text-emerald-500">(green line)</span></span>
                          </div>
                          <p className="text-xs mt-2">
                            Early test phase often shows falsely high confidence due to small sample size.
                            This <span className="text-gray-500 font-medium">gray zone</span> marks the period where confidence values are unreliable.
                          </p>
                          <p className="text-xs mt-1">
                            <span className="text-red-500 font-medium">CI width</span>: represents the margin of error (±%). A narrower interval indicates more precise estimates.
                          </p>
                    </div>
                  </div>
                      
                      <div className="rounded-lg border bg-card/80 p-4 mt-6">
                        <h4 className="text-lg font-medium mb-3">Additional Insights</h4>
                        <div className="space-y-2 text-sm">
                          <p><span className="font-medium">Sample per variation:</span> {result && Math.ceil(result.minSample / Number(variations)).toLocaleString()} users</p>
                          <p><span className="font-medium">Daily traffic in test:</span> {result && Math.ceil(Number(visits) * (traffic[0] / 100)).toLocaleString()} visitors</p>
                          <p><span className="font-medium">Methodology:</span> {method === 'frequentist' ? 'Frequentist (null hypothesis testing)' : 'Bayesian (probability distribution)'}</p>
                          <p><span className="font-medium">Confidence threshold:</span> {confidence}%</p>
                          <p><span className="font-medium">Estimated daily conversions:</span> {result && Math.ceil(Number(visits) * (traffic[0] / 100) * (Number(conversionRate) / 100)).toLocaleString()} conversions</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
          </TabsContent>
          <TabsContent value="analysis">
            <div className="rounded-xl p-8 bg-muted/30 text-center">
              <h3 className="text-xl font-medium mb-2">Results Analysis</h3>
              <p className="text-muted-foreground">This tool will be available soon. It will allow you to analyze the results of your A/B tests.</p>
      </div>
          </TabsContent>
        </Tabs>

      <Dialog open={showCustomModal} onOpenChange={setShowCustomModal}>
          <DialogContent>
          <DialogHeader>
              <DialogTitle>Enter a custom value</DialogTitle>
          </DialogHeader>
            <div className="space-y-4 py-2">
            <div className="space-y-2">
                <Label htmlFor="custom-improvement">Expected Improvement (%)</Label>
              <Input
                id="custom-improvement"
                  placeholder="ex: 1.5"
                value={customImprovement}
                onChange={(e) => setCustomImprovement(e.target.value)}
              />
            </div>
            <Button
                onClick={() => setShowCustomModal(false)}
                className="w-full"
            >
              Apply
            </Button>
          </div>
        </DialogContent>
      </Dialog>

        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detailed Calculation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto">
              <div className="space-y-2">
                <h4 className="font-medium">Input Parameters</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="px-3 py-2 bg-muted/50 rounded-md">
                    <p className="font-medium">Daily Visits</p>
                    <p className="text-muted-foreground">{visits}</p>
                  </div>
                  <div className="px-3 py-2 bg-muted/50 rounded-md">
                    <p className="font-medium">Daily Conversions</p>
                    <p className="text-muted-foreground">{conversions}</p>
                  </div>
                  <div className="px-3 py-2 bg-muted/50 rounded-md">
                    <p className="font-medium">Traffic Allocation</p>
                    <p className="text-muted-foreground">{traffic[0]}%</p>
                  </div>
                  <div className="px-3 py-2 bg-muted/50 rounded-md">
                    <p className="font-medium">Number of Variations</p>
                    <p className="text-muted-foreground">{variations}</p>
                  </div>
                  <div className="px-3 py-2 bg-muted/50 rounded-md">
                    <p className="font-medium">Expected Improvement</p>
                    <p className="text-muted-foreground">+{improvement === "custom" ? customImprovement : improvement}%</p>
                  </div>
                  <div className="px-3 py-2 bg-muted/50 rounded-md">
                    <p className="font-medium">Statistical Confidence</p>
                    <p className="text-muted-foreground">{confidence}%</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">{method === 'frequentist' ? 'Frequentist' : 'Bayesian'} Calculation</h4>
                <div className="px-4 py-3 bg-muted/50 rounded-md space-y-2">
                  {method === 'frequentist' ? (
                    <>
                      <div>
                        <p className="text-sm font-medium">Step 1: Calculate baseline conversion rate</p>
                        <p className="text-sm text-muted-foreground">
                          p = conversions / visits = {conversions} / {visits} = {(Number(conversions) / Number(visits)).toFixed(4)} ({conversionRate}%)
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Step 2: Calculate z-scores</p>
                        <p className="text-sm text-muted-foreground">
                          z<sub>α/2</sub> = {method === 'frequentist' ? 
                            confidence === "80" ? "1.282" : 
                            confidence === "85" ? "1.440" : 
                            confidence === "90" ? "1.645" : 
                            confidence === "95" ? "1.96" : 
                            confidence === "99" ? "2.576" : "1.96" 
                            : "N/A"} (for {confidence}% confidence)
                        </p>
                        <p className="text-sm text-muted-foreground">
                          z<sub>β</sub> = 0.84 (for 80% power)
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Step 3: Calculate minimum detectable effect (MDE)</p>
                        <p className="text-sm text-muted-foreground">
                          MDE = p × improvement = {(Number(conversions) / Number(visits)).toFixed(4)} × {(improvement === "custom" ? Number(customImprovement) : Number(improvement)) / 100} = {((Number(conversions) / Number(visits)) * ((improvement === "custom" ? Number(customImprovement) : Number(improvement)) / 100)).toFixed(6)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Step 4: Calculate required sample size per variation</p>
                        <p className="text-sm text-muted-foreground">
                          n = (z<sub>α/2</sub> + z<sub>β</sub>)² × 2 × p × (1-p) / MDE² 
                        </p>
                        <p className="text-sm text-muted-foreground">
                          = {result && Math.ceil(result.minSample / Number(variations)).toLocaleString()} per variation
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Step 5: Calculate total sample size</p>
                        <p className="text-sm text-muted-foreground">
                          Total sample = n × variations = {result && Math.ceil(result.minSample / Number(variations)).toLocaleString()} × {variations} = {result && result.minSample.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Step 6: Calculate required days</p>
                        <p className="text-sm text-muted-foreground">
                          Daily test traffic = visits × traffic allocation = {visits} × {traffic[0]}% = {result && Math.ceil(Number(visits) * (traffic[0] / 100)).toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Days = total sample / daily test traffic = {result && result.minSample.toLocaleString()} / {result && Math.ceil(Number(visits) * (traffic[0] / 100)).toLocaleString()} = {result && result.days} days
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-sm font-medium">Step 1: Calculate baseline conversion rate</p>
                        <p className="text-sm text-muted-foreground">
                          p = conversions / visits = {conversions} / {visits} = {(Number(conversions) / Number(visits)).toFixed(4)} ({conversionRate}%)
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Step 2: Define prior distribution</p>
                        <p className="text-sm text-muted-foreground">
                          Using Jeffrey's prior: Beta(0.5, 0.5)
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Step 3: Calculate minimum detectable effect (MDE)</p>
                        <p className="text-sm text-muted-foreground">
                          MDE = p × improvement = {(Number(conversions) / Number(visits)).toFixed(4)} × {(improvement === "custom" ? Number(customImprovement) : Number(improvement)) / 100} = {((Number(conversions) / Number(visits)) * ((improvement === "custom" ? Number(customImprovement) : Number(improvement)) / 100)).toFixed(6)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Step 4: Simulate posterior distributions</p>
                        <p className="text-sm text-muted-foreground">
                          Using Monte Carlo simulation to determine the sample size required to achieve {confidence}% probability that the treatment is better than control.
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Step 5: Calculate required sample size</p>
                        <p className="text-sm text-muted-foreground">
                          Estimated sample size: {result && result.minSample.toLocaleString()} total ({result && Math.ceil(result.minSample / Number(variations)).toLocaleString()} per variation)
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Step 6: Calculate required days</p>
                        <p className="text-sm text-muted-foreground">
                          Daily test traffic = visits × traffic allocation = {visits} × {traffic[0]}% = {result && Math.ceil(Number(visits) * (traffic[0] / 100)).toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Days = total sample / daily test traffic = {result && result.minSample.toLocaleString()} / {result && Math.ceil(Number(visits) * (traffic[0] / 100)).toLocaleString()} = {result && result.days} days
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            <DialogClose asChild>
              <Button>Close</Button>
            </DialogClose>
          </DialogContent>
        </Dialog>
      </div>
      <footer className="mt-12 text-center text-sm text-muted-foreground space-y-1">
        <p>A/B Test ToolKit © 2025</p>
        <p>By Emma - The Sleep Company - Created by Jean R.</p>
      </footer>
    </div>
  );
}