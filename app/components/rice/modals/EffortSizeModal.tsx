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
import { EffortSize } from "../../../services/RiceService";

interface EffortSizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (size: Omit<EffortSize, 'id'>) => void;
  size?: EffortSize;
}

export function EffortSizeModal({
  isOpen,
  onClose,
  onSave,
  size
}: EffortSizeModalProps) {
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('');
  const [devEffort, setDevEffort] = useState(0.5);
  const [designEffort, setDesignEffort] = useState(0.3);
  const [example, setExample] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fill fields if a size is provided for editing
  useEffect(() => {
    if (size) {
      setName(size.name);
      setDuration(size.duration);
      setDevEffort(size.devEffort);
      setDesignEffort(size.designEffort);
      setExample(size.example);
    } else {
      // Reset fields for a new size
      setName('');
      setDuration('1-2 wk');
      setDevEffort(0.5);
      setDesignEffort(0.3);
      setExample('');
    }
  }, [size, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const newSize: Omit<EffortSize, 'id'> = {
      name,
      duration,
      devEffort,
      designEffort,
      example
    };
    
    onSave(newSize);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {size ? "Edit Effort Size" : "Add Effort Size"}
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
                placeholder="Ex: S, M, L, XL"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="duration" className="text-right">
                Duration
              </Label>
              <Input
                id="duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="col-span-3 border-[0.5px] border-border/40 bg-background/60"
                placeholder="Ex: 1-2 wk"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="devEffort" className="text-right">
                Dev Effort ({devEffort.toFixed(1)})
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Slider
                  id="devEffort"
                  min={0.1}
                  max={2}
                  step={0.1}
                  value={[devEffort]}
                  onValueChange={(value) => setDevEffort(value[0])}
                  className="flex-1 border-border/40"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="designEffort" className="text-right">
                Design Effort ({designEffort.toFixed(1)})
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Slider
                  id="designEffort"
                  min={0.1}
                  max={2}
                  step={0.1}
                  value={[designEffort]}
                  onValueChange={(value) => setDesignEffort(value[0])}
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
                placeholder="Ex: Contact form"
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