"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ConfidenceSource } from "../../../services/RiceService";

interface ConfidenceSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (source: Omit<ConfidenceSource, 'id'>) => void;
  source?: ConfidenceSource;
}

export function ConfidenceSourceModal({
  isOpen,
  onClose,
  onSave,
  source
}: ConfidenceSourceModalProps) {
  const [name, setName] = useState('');
  const [points, setPoints] = useState(1);
  const [example, setExample] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fill fields if a source is provided for editing
  useEffect(() => {
    if (source) {
      setName(source.name);
      setPoints(source.points);
      setExample(source.example);
    } else {
      // Reset fields for a new source
      setName('');
      setPoints(1);
      setExample('');
    }
  }, [source, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const newSource: Omit<ConfidenceSource, 'id'> = {
      name,
      points,
      example
    };
    
    onSave(newSource);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {source ? "Edit Confidence Source" : "Add Confidence Source"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3 border-[0.5px] border-border/40 bg-background/60"
                placeholder="Ex: User Testing"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="points" className="text-right">
                Points ({points.toFixed(1)})
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Slider
                  id="points"
                  min={0.1}
                  max={3}
                  step={0.1}
                  value={[points]}
                  onValueChange={(value) => setPoints(value[0])}
                  className="flex-1 border-border/40"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="example" className="text-right">
                Example
              </Label>
              <Input
                id="example"
                value={example}
                onChange={(e) => setExample(e.target.value)}
                className="col-span-3 border-[0.5px] border-border/40 bg-background/60"
                placeholder="Ex: Tests with 5 users"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              disabled={isSubmitting}
              size="sm"
              className="border-[0.5px] border-border/40"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              size="sm"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 