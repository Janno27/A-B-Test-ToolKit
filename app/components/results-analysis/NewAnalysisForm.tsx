"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import localStorageService, { AnalysisResult } from "./localStorageService";

interface NewAnalysisFormProps {
  onAnalysisCreated: (analysis: AnalysisResult) => void;
}

export default function NewAnalysisForm({ onAnalysisCreated }: NewAnalysisFormProps) {
  const [testName, setTestName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!testName.trim()) return;
    
    const newAnalysis = localStorageService.saveAnalysis(testName);
    onAnalysisCreated(newAnalysis);
    setTestName("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-end gap-4">
        <div className="flex-1 max-w-[250px]">
          <Label htmlFor="test-name" className="mb-2 block">Test name</Label>
          <Input
            id="test-name"
            placeholder="e.g. Homepage redesign"
            value={testName}
            onChange={(e) => setTestName(e.target.value)}
            required
            className="bg-background/60"
          />
        </div>

        <Button
          type="submit"
          size="sm"
          variant="outline"
          className="flex items-center gap-1"
          disabled={!testName.trim()}
        >
          <span>Create analysis</span>
            <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
} 