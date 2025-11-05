"use client";

import React from "react";
import { usePresentationState } from "@/states/presentation-state";
import { cn } from "@/lib/utils";

interface GenerationProgressProps {
  className?: string;
}

export const GenerationProgress: React.FC<GenerationProgressProps> = ({
  className,
}) => {
  const { isGeneratingPresentation, slides } = usePresentationState();

  if (!isGeneratingPresentation) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 bg-background/95 backdrop-blur-sm border rounded-lg p-4 shadow-lg",
        "animate-fade-in",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
        </div>
        <div className="text-sm font-medium">
          Generazione presentazione...
        </div>
        <div className="text-xs text-muted-foreground">
          {slides.length} {slides.length === 1 ? "diapositiva" : "diapositive"} create
        </div>
      </div>
    </div>
  );
};
