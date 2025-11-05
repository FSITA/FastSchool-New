"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { Quiz } from '@/types/quiz-generator';

interface QuizLoadingProps {
  totalQuizzes: number;
  currentContent: string;
  generatedQuizzes: Quiz[];
}

export default function QuizLoading({ totalQuizzes, generatedQuizzes }: QuizLoadingProps) {
  const [currentQuiz, setCurrentQuiz] = useState(0);

  useEffect(() => {
    // Update current quiz based on parsed quizzes
    if (generatedQuizzes.length > 0) {
      setCurrentQuiz(generatedQuizzes.length);
    }
  }, [generatedQuizzes]);

  const getStatusMessage = () => {
    if (currentQuiz === 0) {
      return "Inizializzazione generazione quiz...";
    } else if (currentQuiz < totalQuizzes) {
      return `Generazione quiz ${currentQuiz} di ${totalQuizzes}...`;
    } else {
      return "Finalizzazione contenuto quiz...";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-8 min-h-[400px]">
      <Image
        src="/images/loader.gif"
        alt="Generazione quiz..."
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

