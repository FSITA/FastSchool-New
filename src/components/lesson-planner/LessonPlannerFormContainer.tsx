"use client";

import { useState, useEffect } from "react";
import UniversalForm from "@/components/presentation/universal-form/UniversalForm";
import FormField from "@/components/shared/FormField";
import { LessonPlanViewer } from "./lesson-plan-viewer";
import { LessonTitleForm } from "./lesson-title-form";
import LessonPlanLoading from "./lesson-plan-loading";
import ContentExtractionNotificationBar from "@/components/shared/ContentExtractionNotificationBar";
import { toast } from "sonner";
import type { LessonPlan } from "@/types/lesson-planner";
import type { ProcessedContent } from "@/lib/presentation/universal-form-processor";

interface LessonPlannerFormContainerProps {
  onLoadingStateChange?: (isLoading: boolean) => void;
}

export default function LessonPlannerFormContainer({ onLoadingStateChange }: LessonPlannerFormContainerProps = {}) {
  const [formStep, setFormStep] = useState(0);
  const [universalFormData, setUniversalFormData] = useState<FormData | null>(null);
  const [extractedContent, setExtractedContent] = useState<ProcessedContent | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string>("");
  const [lessonTitle, setLessonTitle] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [currentLessonPlan, setCurrentLessonPlan] = useState<LessonPlan | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [accessibilityData, setAccessibilityData] = useState<{ isSpecialNeeds: boolean; disabilityType: string }>({ isSpecialNeeds: false, disabilityType: "" });

  // Reset state when component mounts to prevent stale state issues
  useEffect(() => {
    setFormStep(0);
    setUniversalFormData(null);
    setLessonTitle("");
    setIsLoading(false);
    setGeneratedContent('');
    setCurrentLessonPlan(null);
    setErrorMessage("");
    setAccessibilityData({ isSpecialNeeds: false, disabilityType: "" });
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
    setExtractionError("");
    setIsExtracting(true);

    try {
      // Determine source type for loading message
      const step = formData.get("step") as string;
      const activeStep = step ? parseInt(step, 10) : -1;
      let sourceType: "PDF" | "YouTube" | "Wikipedia" | "Notes" | "Files" | undefined;
      
      if (activeStep === 0) sourceType = "Notes";
      else if (activeStep === 1) sourceType = "PDF";
      else if (activeStep === 2) sourceType = "YouTube";
      else if (activeStep === 3) sourceType = "Wikipedia";

      // Call extraction API
      const response = await fetch('/api/universal-form/extract-content', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to extract content' }));
        throw new Error(errorData.details || errorData.error || 'Failed to extract content');
      }

      const processedData: ProcessedContent = await response.json();
      setExtractedContent(processedData);
      setIsExtracting(false);
      setFormStep(1);
      toast.success('Contenuto estratto con successo!');
    } catch (error) {
      console.error('Error extracting content:', error);
      setIsExtracting(false);
      const errorMsg = error instanceof Error ? error.message : 'Errore durante l\'estrazione del contenuto';
      setExtractionError(errorMsg);
      toast.error(errorMsg);
      // Don't move to next step if extraction fails
    }
  };

  const handleTitleFormSubmit = async (title: string, isSpecialNeeds: boolean, disabilityType: string) => {
    console.log("🎯 handleTitleFormSubmit called with:", { title, isSpecialNeeds, disabilityType });
    setLessonTitle(title);
    setAccessibilityData({ isSpecialNeeds, disabilityType });
    setFormStep(2);
    // Automatically start generation after setting the title
    // Use setTimeout to ensure state is updated
    setTimeout(() => {
      handleGenerateLessonPlan({ isSpecialNeeds, disabilityType, title });
    }, 100);
  };

  const handleGenerateLessonPlan = async (accessibilityOverride?: { isSpecialNeeds: boolean; disabilityType: string; title?: string }) => {
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
      const finalAccessibilityData = accessibilityOverride || accessibilityData;
      // Use the title from override first, then state, then default
      const finalTitle = accessibilityOverride?.title || lessonTitle || 'Piano di lezione Fastschool';
      const lessonPlanData: LessonPlan = {
        topic: finalTitle,
        gradeLevel: universalFormData.get('gradeLevel')?.toString() || '',
        mainConcept: universalFormData.get('notes')?.toString() || 
                     universalFormData.get('youtubeUrl')?.toString() || 
                     universalFormData.get('wikipediaLink')?.toString() || 
                     'Uploaded content',
        isSpecialNeeds: finalAccessibilityData.isSpecialNeeds,
        disabilityType: finalAccessibilityData.disabilityType,
        language: universalFormData.get('language')?.toString() || 'english'
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

      // Add pre-extracted content if available (for faster processing)
      if (extractedContent) {
        console.log("✅ Using pre-extracted content");
        apiFormData.append('extractedContent', extractedContent.content);
        apiFormData.append('extractedGradeLevel', extractedContent.gradeLevel);
        apiFormData.append('extractedLanguage', extractedContent.language);
        if (extractedContent.isSpecialNeeds !== undefined) {
          apiFormData.append('extractedIsSpecialNeeds', extractedContent.isSpecialNeeds.toString());
        }
        if (extractedContent.disabilityType) {
          apiFormData.append('extractedDisabilityType', extractedContent.disabilityType);
        }
      }

      // Add accessibility data
      console.log("🔧 Adding accessibility data to API:", finalAccessibilityData);
      apiFormData.append('isSpecialNeeds', finalAccessibilityData.isSpecialNeeds.toString());
      apiFormData.append('disabilityType', finalAccessibilityData.disabilityType);

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
    setExtractedContent(null);
    setExtractionError("");
    setLessonTitle("");
    setAccessibilityData({ isSpecialNeeds: false, disabilityType: "" });
  };

  // Determine source type for extraction loader
  const getExtractionSourceType = (): "PDF" | "YouTube" | "Wikipedia" | "Notes" | "Files" | undefined => {
    if (!universalFormData) return undefined;
    const step = universalFormData.get("step") as string;
    const activeStep = step ? parseInt(step, 10) : -1;
    if (activeStep === 0) return "Notes";
    else if (activeStep === 1) return "PDF";
    else if (activeStep === 2) return "YouTube";
    else if (activeStep === 3) return "Wikipedia";
    return undefined;
  };

  return (
    <section>
      {!generatedContent && formStep === 0 && !isExtracting && (
        <UniversalForm onSubmit={handleUniversalFormNext} />
      )}

      {/* Show step 2 form even during extraction */}
      {!generatedContent && (formStep === 1 || isExtracting) && (
        <LessonTitleForm 
          onSubmit={handleTitleFormSubmit}
          isLoading={isLoading}
          isExtracting={isExtracting}
          universalFormData={universalFormData}
        />
      )}

      {/* Show extraction notification bar at top-right */}
      {isExtracting && (
        <ContentExtractionNotificationBar sourceType={getExtractionSourceType()} />
      )}

      {/* Show extraction error if any */}
      {extractionError && !isExtracting && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5 fade-in duration-300">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg max-w-md">
            <strong className="font-bold">Errore: </strong>
            <span>{extractionError}</span>
          </div>
        </div>
      )}

      {!generatedContent && formStep === 2 && isLoading && (
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4 text-balance">Generazione del Tuo Piano di Lezione</h1>
            <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
              Creazione di un piano di lezione completo per: <strong>{lessonTitle || 'Piano di lezione Fastschool'}</strong>
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
