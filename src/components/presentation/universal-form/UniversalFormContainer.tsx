"use client";

import { useState } from "react";
import { usePresentationState } from "@/states/presentation-state";
import UniversalForm from "./UniversalForm";
import PresentationSettingsForm from "./PresentationSettingsForm";
import FormField from "@/components/shared/FormField";
import ContentExtractionNotificationBar from "@/components/shared/ContentExtractionNotificationBar";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createEmptyPresentation } from "@/app/_actions/presentation/presentationActions";
import type { ProcessedContent } from "@/lib/presentation/universal-form-processor";

export default function UniversalFormContainer() {
  const { 
    setCurrentPresentation, 
    setIsGeneratingOutline,
    setShouldStartOutlineGeneration,
    universalFormData,
    setUniversalFormData,
    formStep,
    setFormStep,
    setIsFromUniversalForm,
    setOriginalLanguage
  } = usePresentationState();
  
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [extractedContent, setExtractedContent] = useState<ProcessedContent | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string>("");

  const handleUniversalFormNext = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const language = formData.get("language") as string;
    setUniversalFormData(formData);
    setOriginalLanguage(language);
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
      
      // Add extracted content to FormData for use in generation
      if (processedData) {
        formData.append('extractedContent', processedData.content);
        formData.append('extractedGradeLevel', processedData.gradeLevel);
        formData.append('extractedLanguage', processedData.language);
        if (processedData.isSpecialNeeds !== undefined) {
          formData.append('extractedIsSpecialNeeds', processedData.isSpecialNeeds.toString());
        }
        if (processedData.disabilityType) {
          formData.append('extractedDisabilityType', processedData.disabilityType);
        }
      }
      
      setUniversalFormData(formData); // Update with extracted content
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

  const handleGeneratePresentation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");

    if (!universalFormData) {
      toast.error("Please complete the first step");
      return;
    }

    // Set UI loading state
    setIsGeneratingOutline(true);
    // Mark that this presentation is from universal form
    setIsFromUniversalForm(true);

    try {
      // Create empty presentation first
      const result = await createEmptyPresentation("Presentazione FastSchool senza titolo");

      if (result.success && result.presentation) {
        // Set the current presentation
        setCurrentPresentation(
          result.presentation.id,
          result.presentation.title
        );
        
        // Navigate to generation page where outline generation will start
        router.push(`/presentation/generate/${result.presentation.id}`);
      } else {
        setIsGeneratingOutline(false);
        toast.error(result.message || "Failed to create presentation");
      }
    } catch (error) {
      setIsGeneratingOutline(false);
      console.error("Error creating presentation:", error);
      toast.error("Failed to create presentation");
    }
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
      {formStep === 0 && !isExtracting && (
        <UniversalForm onSubmit={handleUniversalFormNext} />
      )}

      {/* Show step 2 form even during extraction */}
      {(formStep === 1 || isExtracting) && (
        <PresentationSettingsForm 
          onSubmit={handleGeneratePresentation}
          isExtracting={isExtracting}
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

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mt-4 max-w-lg mx-auto">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{errorMessage}</span>
        </div>
      )}
    </section>
  );
}
