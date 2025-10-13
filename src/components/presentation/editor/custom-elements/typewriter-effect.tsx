"use client";

import React, { useEffect, useState } from "react";
import { usePresentationState } from "@/states/presentation-state";

interface TypewriterEffectProps {
  children: React.ReactNode;
  isGenerating: boolean;
  delay?: number;
}

export const TypewriterEffect: React.FC<TypewriterEffectProps> = ({
  children,
  isGenerating,
  delay = 0,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const { isGeneratingPresentation } = usePresentationState();

  useEffect(() => {
    if (isGenerating && isGeneratingPresentation) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, delay);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(true);
    }
  }, [isGenerating, isGeneratingPresentation, delay]);

  return (
    <span
      className={`transition-all duration-300 ease-out ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      {children}
    </span>
  );
};

