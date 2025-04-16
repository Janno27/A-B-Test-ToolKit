"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Target, Zap, Lightbulb, Clock, Calculator } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface RiceSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RiceSettingsModal({ open, onOpenChange }: RiceSettingsModalProps) {
  const [activeTab, setActiveTab] = useState("global");
  const [customWeightsEnabled, setCustomWeightsEnabled] = useState(false);
  const [localMarketRuleEnabled, setLocalMarketRuleEnabled] = useState(true);
  
  const [weights, setWeights] = useState({
    reach: 30,
    impact: 30,
    confidence: 20,
    effort: 20
  });

  // Mettre à jour un poids spécifique
  const updateWeight = (key: keyof typeof weights, value: number) => {
    setWeights(prev => ({ ...prev, [key]: value }));
  };

  // Formuler l'équation RICE en fonction des paramètres
  const getRiceFormula = () => {
    if (customWeightsEnabled) {
      return `RICE = (${weights.reach/100}R × ${weights.impact/100}I × ${weights.confidence/100}C) ÷ ${weights.effort/100}E`;
    } else {
      return `RICE = (R × I × C) ÷ E`;
    }
  };

  // Obtenir la description de Reach en fonction de l'état du marché local
  const getReachDescription = () => {
    if (localMarketRuleEnabled) {
      return "Value: 0.3 to 1.0 based on reach matrix (x0.6 for local markets)";
    } else {
      return "Value: 0.3 to 1.0 based on reach matrix";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-medium">RICE Framework Settings</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="global" value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="w-full grid grid-cols-6 mb-8">
            <TabsTrigger value="global">Global</TabsTrigger>
            <TabsTrigger value="reach">Reach</TabsTrigger>
            <TabsTrigger value="impact">Impact</TabsTrigger>
            <TabsTrigger value="confidence">Confidence</TabsTrigger>
            <TabsTrigger value="effort">Effort</TabsTrigger>
            <TabsTrigger value="formula">Formula</TabsTrigger>
          </TabsList>
          
          <TabsContent value="global" className="space-y-6">
            <div className="text-sm text-muted-foreground">
              Configure the global settings for the RICE prioritization framework.
            </div>
            
            <div className="space-y-6">
              <div className="pt-0">
                <h3 className="text-sm font-medium mb-4">Special Rules</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="customWeightsRule"
                      className="rounded border-gray-300"
                      checked={customWeightsEnabled}
                      onChange={() => setCustomWeightsEnabled(!customWeightsEnabled)}
                    />
                    <Label htmlFor="customWeightsRule" className="text-xs">
                      Enable custom weights distribution
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="localMarketRule"
                      className="rounded border-gray-300"
                      checked={localMarketRuleEnabled}
                      onChange={() => setLocalMarketRuleEnabled(!localMarketRuleEnabled)}
                    />
                    <Label htmlFor="localMarketRule" className="text-xs">
                      Local market tests have a x0.6 coefficient applied to the final R score
                    </Label>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-4">Weights Distribution</h3>
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label className="flex justify-between text-xs">
                      Reach
                      <span className="text-xs text-muted-foreground">{weights.reach}%</span>
                    </Label>
                    <Slider 
                      value={[weights.reach]} 
                      max={100} 
                      step={5}
                      disabled={!customWeightsEnabled}
                      onValueChange={(value) => updateWeight('reach', value[0])}
                      className={!customWeightsEnabled ? "opacity-50" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex justify-between text-xs">
                      Impact
                      <span className="text-xs text-muted-foreground">{weights.impact}%</span>
                    </Label>
                    <Slider 
                      value={[weights.impact]} 
                      max={100} 
                      step={5}
                      disabled={!customWeightsEnabled}
                      onValueChange={(value) => updateWeight('impact', value[0])}
                      className={!customWeightsEnabled ? "opacity-50" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex justify-between text-xs">
                      Confidence
                      <span className="text-xs text-muted-foreground">{weights.confidence}%</span>
                    </Label>
                    <Slider 
                      value={[weights.confidence]} 
                      max={100} 
                      step={5}
                      disabled={!customWeightsEnabled}
                      onValueChange={(value) => updateWeight('confidence', value[0])}
                      className={!customWeightsEnabled ? "opacity-50" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex justify-between text-xs">
                      Effort
                      <span className="text-xs text-muted-foreground">{weights.effort}%</span>
                    </Label>
                    <Slider 
                      value={[weights.effort]} 
                      max={100} 
                      step={5}
                      disabled={!customWeightsEnabled}
                      onValueChange={(value) => updateWeight('effort', value[0])}
                      className={!customWeightsEnabled ? "opacity-50" : ""}
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="reach" className="space-y-6">
            <div className="text-sm text-muted-foreground mb-4">
              <p>Reach represents the percentage of users impacted by the test.</p>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px] text-xs font-medium">Segment</TableHead>
                  <TableHead className="text-xs font-medium">Reach (%)</TableHead>
                  <TableHead className="text-xs font-medium">Points (R)</TableHead>
                  <TableHead className="text-right text-xs font-medium">Example</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="text-xs">Sitewide Test</TableCell>
                  <TableCell className="text-xs">80-100%</TableCell>
                  <TableCell className="text-xs">1.0</TableCell>
                  <TableCell className="text-right text-xs">Header modification</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-xs">Critical Journey</TableCell>
                  <TableCell className="text-xs">50-79%</TableCell>
                  <TableCell className="text-xs">0.7</TableCell>
                  <TableCell className="text-right text-xs">Checkout optimization</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-xs">Specific Page</TableCell>
                  <TableCell className="text-xs">20-49%</TableCell>
                  <TableCell className="text-xs">0.5</TableCell>
                  <TableCell className="text-right text-xs">Mattress PDP redesign</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-xs">Micro-Interaction</TableCell>
                  <TableCell className="text-xs">1-19%</TableCell>
                  <TableCell className="text-xs">0.3</TableCell>
                  <TableCell className="text-right text-xs">Delivery tooltip adjustment</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            
            <div className="flex justify-end">
              <Button size="sm" variant="outline" className="text-xs">
                <Plus className="h-3 w-3 mr-1" /> Add Category
              </Button>
            </div>
            
            {localMarketRuleEnabled && (
              <div className="bg-muted/20 p-3 rounded-md mt-2">
                <h3 className="text-xs font-medium mb-1">Special Rule</h3>
                <div className="text-xs text-muted-foreground">
                  Local market tests have a x0.6 coefficient applied to the final R score.
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="impact" className="space-y-6">
            <div className="text-sm text-muted-foreground mb-4">
              <p>Impact formula: I = (0.4 × ΔCVR) + (0.3 × ΔRevenue) + (0.3 × ΔBehavior)</p>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-medium">KPI</TableHead>
                  <TableHead className="text-xs font-medium">Min Δ</TableHead>
                  <TableHead className="text-xs font-medium">Max Δ</TableHead>
                  <TableHead className="text-xs font-medium">Points/Unit</TableHead>
                  <TableHead className="text-right text-xs font-medium">Example</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="text-xs">CVR (pp)</TableCell>
                  <TableCell className="text-xs">+0.5%</TableCell>
                  <TableCell className="text-xs">+5%</TableCell>
                  <TableCell className="text-xs">0.4/pp</TableCell>
                  <TableCell className="text-right text-xs">Δ +2% → 0.8</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-xs">Revenue (€k)</TableCell>
                  <TableCell className="text-xs">+10k</TableCell>
                  <TableCell className="text-xs">+500k</TableCell>
                  <TableCell className="text-xs">0.03/k€</TableCell>
                  <TableCell className="text-right text-xs">Δ +150k → 4.5</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-xs">Behavior*</TableCell>
                  <TableCell className="text-xs">+5%</TableCell>
                  <TableCell className="text-xs">+50%</TableCell>
                  <TableCell className="text-xs">0.06/%</TableCell>
                  <TableCell className="text-right text-xs">Δ +20% AddToCart → 1.2</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            
            <div className="text-xs text-muted-foreground">
              *Behavior = Weighted avg. of AddToCart (40%), PDP Access (30%), Scroll Depth (30%)
            </div>
            
            <div className="flex justify-end">
              <Button size="sm" variant="outline" className="text-xs">
                <Plus className="h-3 w-3 mr-1" /> Add KPI
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="confidence" className="space-y-6">
            <div className="text-sm text-muted-foreground mb-4">
              <p>Confidence represents the certainty in your estimates based on proof sources.</p>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[220px] text-xs font-medium">Type of Proof</TableHead>
                  <TableHead className="text-xs font-medium">Points</TableHead>
                  <TableHead className="text-right text-xs font-medium">Example</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="text-xs">Previous A/B Test</TableCell>
                  <TableCell className="text-xs">2.5</TableCell>
                  <TableCell className="text-right text-xs">Similar test on collection page</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-xs">Advanced Analytics (SQL/GA4)</TableCell>
                  <TableCell className="text-xs">2.0</TableCell>
                  <TableCell className="text-right text-xs">6-month funnel analysis</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-xs">Baymard Benchmark</TableCell>
                  <TableCell className="text-xs">1.5</TableCell>
                  <TableCell className="text-right text-xs">Checkout study 2024</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-xs">User Testing (5+ participants)</TableCell>
                  <TableCell className="text-xs">1.2</TableCell>
                  <TableCell className="text-right text-xs">Moderated session DE/FR</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-xs">Verified Competitor Copy</TableCell>
                  <TableCell className="text-xs">0.8</TableCell>
                  <TableCell className="text-right text-xs">Analysis of 3 market leaders</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-xs">Heuristic Audit</TableCell>
                  <TableCell className="text-xs">0.5</TableCell>
                  <TableCell className="text-right text-xs">WCAG compliance review</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            
            <div className="bg-muted/20 p-3 rounded-md">
              <p className="text-xs font-medium mb-1">Special Rules:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li className="text-xs text-muted-foreground">Capped at 5 points total</li>
                <li className="text-xs text-muted-foreground">Minimum threshold of 3 points</li>
              </ul>
            </div>
            
            <div className="flex justify-end">
              <Button size="sm" variant="outline" className="text-xs">
                <Plus className="h-3 w-3 mr-1" /> Add Proof Source
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="effort" className="space-y-6">
            <div className="text-sm text-muted-foreground mb-4">
              <p>Effort is measured using the T-shirt sizing system that combines development and design time.</p>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px] text-xs font-medium">Size</TableHead>
                  <TableHead className="text-xs font-medium">Duration</TableHead>
                  <TableHead className="text-xs font-medium">Dev</TableHead>
                  <TableHead className="text-xs font-medium">Design</TableHead>
                  <TableHead className="text-right text-xs font-medium">Example</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="text-xs">XS</TableCell>
                  <TableCell className="text-xs">0-1 wk</TableCell>
                  <TableCell className="text-xs">0.3</TableCell>
                  <TableCell className="text-xs">0.2</TableCell>
                  <TableCell className="text-right text-xs">Minor CSS modification</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-xs">S</TableCell>
                  <TableCell className="text-xs">1-2 wk</TableCell>
                  <TableCell className="text-xs">0.5</TableCell>
                  <TableCell className="text-xs">0.3</TableCell>
                  <TableCell className="text-right text-xs">New tracking integration</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-xs">M</TableCell>
                  <TableCell className="text-xs">2-4 wk</TableCell>
                  <TableCell className="text-xs">0.8</TableCell>
                  <TableCell className="text-xs">0.5</TableCell>
                  <TableCell className="text-right text-xs">PDP module redesign</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-xs">L</TableCell>
                  <TableCell className="text-xs">4-6 wk</TableCell>
                  <TableCell className="text-xs">1.2</TableCell>
                  <TableCell className="text-xs">0.8</TableCell>
                  <TableCell className="text-right text-xs">Checkout revamp</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-xs">XL</TableCell>
                  <TableCell className="text-xs">6-8 wk</TableCell>
                  <TableCell className="text-xs">1.5</TableCell>
                  <TableCell className="text-xs">1.2</TableCell>
                  <TableCell className="text-right text-xs">Payment API migration</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            
            <div className="flex justify-end">
              <Button size="sm" variant="outline" className="text-xs">
                <Plus className="h-3 w-3 mr-1" /> Add Size
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="formula" className="space-y-6">
            <div className="text-sm text-muted-foreground mb-4">
              <p>The RICE prioritization framework helps quantify and compare different test opportunities.</p>
            </div>
            
            <div className="space-y-5">
              <h3 className="text-sm font-medium">RICE Formula</h3>
              
              <div className="bg-muted/20 p-4 rounded-md">
                <p className="text-xs font-medium mb-2">Standard Formula:</p>
                <div className="font-mono text-sm text-center my-3">
                  RICE Score = (Reach × Impact × Confidence) ÷ Effort
                </div>
                <div className="font-mono text-sm text-center mb-3">
                  {getRiceFormula()}
                </div>
                {customWeightsEnabled && (
                  <div className="text-xs text-center text-muted-foreground mt-1">
                    Using custom weights: Reach ({weights.reach}%), Impact ({weights.impact}%), 
                    Confidence ({weights.confidence}%), Effort ({weights.effort}%)
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/10 p-3 rounded-md">
                  <h4 className="text-xs font-medium mb-1">Reach (R)</h4>
                  <p className="text-xs text-muted-foreground">
                    Percentage of users impacted by the test.
                  </p>
                  <p className="text-xs mt-1">
                    {getReachDescription()}
                  </p>
                </div>
                
                <div className="bg-muted/10 p-3 rounded-md">
                  <h4 className="text-xs font-medium mb-1">Impact (I)</h4>
                  <p className="text-xs text-muted-foreground">
                    Weighted score of different KPIs affected.
                  </p>
                  <p className="text-xs mt-1">
                    I = (0.4×ΔCVR) + (0.3×ΔRevenue) + (0.3×ΔBehavior)
                  </p>
                </div>
                
                <div className="bg-muted/10 p-3 rounded-md">
                  <h4 className="text-xs font-medium mb-1">Confidence (C)</h4>
                  <p className="text-xs text-muted-foreground">
                    Sum of points from all proof sources.
                  </p>
                  <p className="text-xs mt-1">
                    Range: 3.0 to 5.0 points
                  </p>
                </div>
                
                <div className="bg-muted/10 p-3 rounded-md">
                  <h4 className="text-xs font-medium mb-1">Effort (E)</h4>
                  <p className="text-xs text-muted-foreground">
                    Combined score of development and design resources.
                  </p>
                  <p className="text-xs mt-1">
                    E = Dev Effort + Design Effort
                  </p>
                </div>
              </div>
              
              <div className="bg-primary/5 p-3 rounded-md mt-4">
                <p className="text-xs font-medium mb-2">Example Calculation:</p>
                <div className="space-y-1 text-xs">
                  <p>Homepage test with Reach (0.9) × Impact (3.5) × Confidence (4.0) ÷ Effort (1.1)</p>
                  {customWeightsEnabled ? (
                    <p className="font-mono pl-2 mt-1">
                      RICE Score = ({weights.reach/100}×0.9 × {weights.impact/100}×3.5 × {weights.confidence/100}×4.0) ÷ ({weights.effort/100}×1.1) = 
                      {((weights.reach/100 * 0.9 * weights.impact/100 * 3.5 * weights.confidence/100 * 4.0) / (weights.effort/100 * 1.1)).toFixed(2)}
                    </p>
                  ) : (
                    <p className="font-mono pl-2 mt-1">RICE Score = (0.9 × 3.5 × 4.0) ÷ 1.1 = 11.45</p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end mt-6">
          <DialogClose asChild>
            <Button variant="outline" size="sm">Save Settings</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
} 