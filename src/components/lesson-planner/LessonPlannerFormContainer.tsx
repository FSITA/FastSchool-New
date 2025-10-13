"use client";

import { useState, useEffect } from "react";
import UniversalForm from "@/components/presentation/universal-form/UniversalForm";
import FormField from "@/components/quiz/pages/FormField";
import { LessonPlanViewer } from "./lesson-plan-viewer";
import { LessonTitleForm } from "./lesson-title-form";
import LessonPlanLoading from "./lesson-plan-loading";
import { toast } from "sonner";
import type { LessonPlan } from "@/types/lesson-planner";

interface LessonPlannerFormContainerProps {
  onLoadingStateChange?: (isLoading: boolean) => void;
}

export default function LessonPlannerFormContainer({ onLoadingStateChange }: LessonPlannerFormContainerProps = {}) {
  const [formStep, setFormStep] = useState(0);
  const [universalFormData, setUniversalFormData] = useState<FormData | null>(null);
  const [lessonTitle, setLessonTitle] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [currentLessonPlan, setCurrentLessonPlan] = useState<LessonPlan | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Reset state when component mounts to prevent stale state issues
  useEffect(() => {
    setFormStep(0);
    setUniversalFormData(null);
    setLessonTitle("");
    setIsLoading(false);
    setGeneratedContent('');
    setCurrentLessonPlan(null);
    setErrorMessage("");
  }, []);

  // Cleanup effect to prevent memory leaks and DOM issues
  useEffect(() => {
    return () => {
      // Cleanup any pending operations
      setIsLoading(false);
      setErrorMessage("");
    };
  }, []);

  // Notify parent component of loading state changes
  useEffect(() => {
    onLoadingStateChange?.(isLoading);
  }, [isLoading, onLoadingStateChange]);

  const handleUniversalFormNext = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setUniversalFormData(formData);
    setFormStep(1);
  };

  const handleTitleFormSubmit = async (title: string) => {
    setLessonTitle(title);
    setFormStep(2);
    // Automatically start generation after setting the title
    setTimeout(() => {
      handleGenerateLessonPlan();
    }, 100);
  };

  const handleGenerateLessonPlan = async () => {
    setErrorMessage("");
    setIsLoading(true);
    onLoadingStateChange?.(true);

    if (!universalFormData) {
      toast.error("Please complete the first step");
      setIsLoading(false);
      onLoadingStateChange?.(false);
      return;
    }

    try {
      // Create the lesson plan data from universal form
      const lessonPlanData: LessonPlan = {
        topic: lessonTitle || 'Untitled Lesson Plan',
        gradeLevel: universalFormData.get('gradeLevel')?.toString() || '',
        mainConcept: universalFormData.get('notes')?.toString() || 
                     universalFormData.get('youtubeUrl')?.toString() || 
                     universalFormData.get('wikipediaLink')?.toString() || 
                     'Uploaded content'
      };

      // Prepare form data for API
      const apiFormData = new FormData();
      
      // Add universal form data
      universalFormData.forEach((value, key) => {
        apiFormData.append(key, value);
      });

      // Add any uploaded files
      const files = universalFormData.getAll('files');
      files.forEach(file => {
        if (file instanceof File) {
          apiFormData.append('files', file);
        }
      });

      const response = await fetch('/api/lesson-planner/generate', {
        method: 'POST',
        body: apiFormData,
      });

      if (!response.ok) {
        throw new Error('Failed to generate lesson plan');
      }

      const data = await response.json();
      setGeneratedContent(data.content);
      setCurrentLessonPlan(lessonPlanData);
      toast.success('Lesson plan generated successfully!');
    } catch (error) {
      console.error('Error generating lesson plan:', error);
      setErrorMessage(
        error instanceof Error
          ? `Error generating lesson plan: ${error.message}`
          : "Error generating lesson plan, try again!"
      );
      toast.error('Failed to generate lesson plan. Please try again.');
    } finally {
      setIsLoading(false);
      onLoadingStateChange?.(false);
    }
  };

  const handleGenerateAgain = () => {
    setGeneratedContent('');
    setCurrentLessonPlan(null);
    setFormStep(0);
    setUniversalFormData(null);
    setLessonTitle("");
  };

  return (
    <section>
      {!generatedContent && formStep === 0 && (
        <UniversalForm onSubmit={handleUniversalFormNext} />
      )}
      
      {!generatedContent && formStep === 1 && (
        <LessonTitleForm 
          onSubmit={handleTitleFormSubmit}
          isLoading={isLoading}
          universalFormData={universalFormData}
        />
      )}

      {!generatedContent && formStep === 2 && isLoading && (
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4 text-balance">Generazione del Tuo Piano di Lezione</h1>
            <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
              Creazione di un piano di lezione completo per: <strong>{lessonTitle}</strong>
            </p>
          </div>
          <LessonPlanLoading />
        </div>
      )}

      {generatedContent && currentLessonPlan && (
        <LessonPlanViewer
          lessonPlan={currentLessonPlan}
          generatedContent={generatedContent}
          onGenerateAgain={handleGenerateAgain}
        />
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mt-4 max-w-lg mx-auto">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{errorMessage}</span>
        </div>
      )}
    </section>
  );
}
