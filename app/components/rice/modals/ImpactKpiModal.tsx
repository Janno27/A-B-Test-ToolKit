"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { v4 as uuidv4 } from "uuid";
import { ImpactKPI } from "@/services/RiceService";

interface ImpactKpiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (kpi: ImpactKPI) => void;
  kpi?: ImpactKPI;
}

export function ImpactKpiModal({ isOpen, onClose, onSave, kpi }: ImpactKpiModalProps) {
  const [name, setName] = useState("");
  const [minDelta, setMinDelta] = useState("");
  const [maxDelta, setMaxDelta] = useState("");
  const [pointsPerUnit, setPointsPerUnit] = useState("");
  const [example, setExample] = useState("");
  const [isBehaviorMetric, setIsBehaviorMetric] = useState(false);
  const [isBehaviorParent, setIsBehaviorParent] = useState(false);
  
  useEffect(() => {
    if (kpi) {
      setName(kpi.name);
      setMinDelta(kpi.minDelta);
      setMaxDelta(kpi.maxDelta);
      setPointsPerUnit(kpi.pointsPerUnit);
      setExample(kpi.example);
      setIsBehaviorMetric(kpi.isBehaviorMetric || false);
      setIsBehaviorParent(kpi.name === "Behavior");
    } else {
      // Default values for new KPI
      setName("");
      setMinDelta("+0.5%");
      setMaxDelta("+5%");
      setPointsPerUnit("0.05");
      setExample("");
      setIsBehaviorMetric(false);
      setIsBehaviorParent(false);
    }
  }, [kpi, isOpen]);

  const handleUpdateExample = () => {
    try {
      // Extract numeric parts to calculate the example
      const minValue = parseFloat(minDelta.replace(/[^0-9.]/g, ''));
      const maxValue = parseFloat(maxDelta.replace(/[^0-9.]/g, ''));
      const midValue = (minValue + maxValue) / 2;
      
      const formatMidValue = () => {
        if (minDelta.includes('%')) return `+${midValue}%`;
        if (minDelta.includes('k')) return `+${midValue}k`;
        return `+${midValue}`;
      };
      
      // Calculate points - just use pointsPerUnit * midValue for simplicity
      const points = parseFloat(pointsPerUnit) * midValue;
      
      setExample(`Δ ${formatMidValue()} → ${points.toFixed(1)}`);
    } catch (e) {
      console.error('Error updating example:', e);
    }
  };
  
  const handleNameChange = (value: string) => {
    setName(value);
    // If name is Behavior, it's the parent behavior metric
    if (value === "Behavior") {
      setIsBehaviorParent(true);
      setIsBehaviorMetric(false);
      setPointsPerUnit("0.06/%"); // Default for behavior
    } else {
      setIsBehaviorParent(false);
    }
  };
  
  const handleSubmit = () => {
    // Simple validation
    if (!name.trim()) {
      return;
    }
    
    const newKpi: ImpactKPI = {
      id: kpi?.id || uuidv4(),
      name,
      minDelta: isBehaviorParent ? "" : minDelta, // No min/max for Behavior parent
      maxDelta: isBehaviorParent ? "" : maxDelta,
      pointsPerUnit: isBehaviorParent ? "Calculated" : pointsPerUnit, // For Behavior parent
      example: isBehaviorParent ? "Weighted average of sub-metrics" : (example || `Example impact`),
      isBehaviorMetric,
      parentKPI: isBehaviorMetric ? "Behavior" : undefined
    };
    
    onSave(newKpi);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{kpi ? "Edit Impact KPI" : "Add Impact KPI"}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            {kpi && kpi.name === "Behavior" ? (
              <Input
                id="name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="CVR (pp)"
                disabled={true}
              />
            ) : (
              <Input
                id="name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="CVR (pp)"
              />
            )}
          </div>
          
          {!isBehaviorParent && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min-delta">Min Delta</Label>
                  <Input
                    id="min-delta"
                    value={minDelta}
                    onChange={(e) => setMinDelta(e.target.value)}
                    placeholder="+0.5%"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max-delta">Max Delta</Label>
                  <Input
                    id="max-delta"
                    value={maxDelta}
                    onChange={(e) => setMaxDelta(e.target.value)}
                    placeholder="+5%"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="points-per-unit">Points Per Unit</Label>
                <Input
                  id="points-per-unit"
                  value={pointsPerUnit}
                  onChange={(e) => setPointsPerUnit(e.target.value)}
                  placeholder="0.4/pp"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="example">Example (Optional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="example"
                    value={example}
                    onChange={(e) => setExample(e.target.value)}
                    placeholder="Δ +2% → 0.8"
                  />
                  <Button onClick={handleUpdateExample} type="button" variant="secondary" size="sm">
                    Auto
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  You can generate an example automatically or enter your own
                </p>
              </div>
            </>
          )}
          
          {isBehaviorParent && (
            <div className="p-3 bg-muted/20 rounded-md">
              <p className="text-sm font-medium">Behavior KPI</p>
              <p className="text-xs text-muted-foreground mt-1">
                The Behavior KPI is calculated as a weighted average of behavior sub-metrics:
              </p>
              <p className="text-xs font-mono mt-1">
                Behavior = (0.4 × ΔAddToCart) + (0.3 × ΔPDP Access) + (0.3 × ΔScroll Depth)
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Add behavior sub-metrics separately after creating this parent KPI.
              </p>
            </div>
          )}
          
          {!isBehaviorParent && !kpi?.isBehaviorMetric && name !== "Behavior" && (
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                id="is-behavior-metric"
                checked={isBehaviorMetric}
                onCheckedChange={(checked) => setIsBehaviorMetric(checked as boolean)}
              />
              <Label htmlFor="is-behavior-metric" className="text-sm">
                This is a behavior sub-metric
              </Label>
            </div>
          )}
          
          {isBehaviorMetric && (
            <p className="text-xs text-muted-foreground pl-6">
              Behavior sub-metrics will be grouped under the "Behavior" KPI and weighted according to the behavior formula.
            </p>
          )}
        </div>
        
        <DialogFooter>
          <Button onClick={onClose} variant="outline">Cancel</Button>
          <Button onClick={handleSubmit} type="submit">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 