"use client";

import { useState, useEffect } from 'react';
import Image from "next/image";
import type { LessonPlanSection } from '@/types/lesson-planner';

interface LessonPlanLoadingProps {
  totalSections: number;
  currentContent: string;
  generatedSections: LessonPlanSection[];
}

export default function LessonPlanLoading({ totalSections, currentContent, generatedSections }: LessonPlanLoadingProps) {
  const [currentSection, setCurrentSection] = useState(0);

  useEffect(() => {
    // Update current section based on parsed sections
    if (generatedSections.length > 0) {
      setCurrentSection(generatedSections.length);
    }
  }, [generatedSections]);

  const getStatusMessage = () => {
    if (currentSection === 0) {
      return "Inizializzazione generazione piano di lezione...";
    } else if (currentSection < totalSections) {
      return `Generazione sezione ${currentSection} di ${totalSections}...`;
    } else {
      return "Finalizzazione contenuto piano di lezione...";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-8 min-h-[400px]">
      <Image
        src="/images/loader.gif"
        alt="Generazione piano di lezione..."
        width={200}
        height={200}
        unoptimized
        className="w-auto h-auto"
      />
      <p className="text-sm text-muted-foreground mt-4">
        {getStatusMessage()}
      </p>
    </div>
  );
}
