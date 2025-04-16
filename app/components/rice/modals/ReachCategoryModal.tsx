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
import { ReachCategory } from "@/app/services/RiceService";

interface ReachCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: Omit<ReachCategory, 'id'>) => void;
  category?: ReachCategory;
}

export function ReachCategoryModal({ 
  isOpen, 
  onClose, 
  onSave,
  category 
}: ReachCategoryModalProps) {
  const [name, setName] = useState('');
  const [minReach, setMinReach] = useState('0');
  const [maxReach, setMaxReach] = useState('100');
  const [points, setPoints] = useState('1.0');
  const [example, setExample] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fill fields if a category is provided for editing
  useEffect(() => {
    if (category) {
      setName(category.name);
      setMinReach(category.minReach.toString());
      setMaxReach(category.maxReach.toString());
      setPoints(category.points.toString());
      setExample(category.example);
    } else {
      // Reset fields for a new category
      setName('');
      setMinReach('0');
      setMaxReach('100');
      setPoints('1.0');
      setExample('');
    }
  }, [category, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const newCategory: Omit<ReachCategory, 'id'> = {
      name,
      minReach: parseFloat(minReach),
      maxReach: parseFloat(maxReach),
      points: parseFloat(points),
      example
    };
    
    onSave(newCategory);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {category ? "Edit Reach Category" : "Add Reach Category"}
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
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="minReach" className="text-right">
                Min Reach (%)
              </Label>
              <Input
                id="minReach"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={minReach}
                onChange={(e) => setMinReach(e.target.value)}
                className="col-span-3 border-[0.5px] border-border/40 bg-background/60"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="maxReach" className="text-right">
                Max Reach (%)
              </Label>
              <Input
                id="maxReach"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={maxReach}
                onChange={(e) => setMaxReach(e.target.value)}
                className="col-span-3 border-[0.5px] border-border/40 bg-background/60"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="points" className="text-right">
                Points
              </Label>
              <Input
                id="points"
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                className="col-span-3 border-[0.5px] border-border/40 bg-background/60"
                required
              />
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
                placeholder="Ex: Header modification sitewide"
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