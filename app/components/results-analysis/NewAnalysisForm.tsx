"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import localStorageService, { AnalysisResult } from "./localStorageService";

interface NewAnalysisFormProps {
  onAnalysisCreated: (analysis: AnalysisResult) => void;
}

export default function NewAnalysisForm({ onAnalysisCreated }: NewAnalysisFormProps) {
  const [testName, setTestName] = useState("");
  const [isHovered, setIsHovered] = useState(false);

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

        <motion.button
          type="submit"
          className="flex items-center bg-transparent hover:bg-transparent py-1 px-2 text-sm text-primary font-medium transition-all duration-300 gap-1"
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          whileTap={{ scale: 0.98 }}
        >
          <span>Create analysis</span>
          <motion.div
            animate={{
              x: isHovered ? 5 : 0,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <ArrowRight className="h-4 w-4" />
          </motion.div>
        </motion.button>
      </div>
    </form>
  );
} 