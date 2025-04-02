"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { Trash2, Clock, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import localStorageService, { AnalysisResult } from "./localStorageService";

interface RecentAnalysesProps {
  onSelect: (analysis: AnalysisResult) => void;
}

export default function RecentAnalyses({ onSelect }: RecentAnalysesProps) {
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);

  useEffect(() => {
    const storedAnalyses = localStorageService.getAnalyses();
    setAnalyses(storedAnalyses);
  }, []);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (localStorageService.deleteAnalysis(id)) {
      setAnalyses(analyses.filter(analysis => analysis.id !== id));
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true
      });
    } catch (error) {
      return "Unknown date";
    }
  };

  const handleSelectAnalysis = (analysis: AnalysisResult) => {
    const freshAnalysis = {
      ...analysis,
      lastModified: new Date().toISOString()
    };
    
    onSelect(freshAnalysis);
  };

  if (analyses.length === 0) {
    return (
      <div className="mt-6 text-center text-muted-foreground text-sm">
        No recent analyses available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-muted-foreground">Recent Analyses</h4>
      
      <div className="grid gap-2">
        {analyses.slice(0, 3).map((analysis) => (
          <Card key={analysis.id} className="p-3 transition-all hover:bg-accent/30 cursor-pointer" onClick={() => handleSelectAnalysis(analysis)}>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-medium">{analysis.name}</h3>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>
                    {new Date(analysis.lastModified).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
              <div className="flex items-center">
                <button
                  onClick={(e) => handleDelete(e, analysis.id)}
                  className="p-1.5 rounded-full hover:bg-muted transition-colors mr-1"
                  aria-label="Delete analysis"
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive transition-colors" />
                </button>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
} 