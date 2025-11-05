"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { LessonPage } from '@/types/lesson-generator';

interface LessonLoadingProps {
  totalPages: number;
  currentContent: string;
  generatedPages: LessonPage[];
}

export default function LessonLoading({ totalPages, currentContent, generatedPages }: LessonLoadingProps) {
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    // Update current page based on parsed pages
    if (generatedPages.length > 0) {
      setCurrentPage(generatedPages.length);
    }
  }, [generatedPages]);

  const getStatusMessage = () => {
    if (currentPage === 0) {
      return "Inizializzazione generazione lezione...";
    } else if (currentPage < totalPages) {
      return `Generazione pagina ${currentPage} di ${totalPages}...`;
    } else {
      return "Finalizzazione contenuto lezione...";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-8 min-h-[400px]">
      <Image
        src="/images/loader.gif"
        alt="Generazione lezione..."
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
