"use client";

import { useRef, useState } from "react";
import FlashcardUniversalForm from "./FlashcardUniversalForm";
import FlashcardSettingsForm from "./FlashcardSettingsForm";
import ContentExtractionNotificationBar from "@/components/shared/ContentExtractionNotificationBar";
import { toast } from "sonner";
import type { ProcessedContent } from "@/lib/presentation/universal-form-processor";

// Removed client-side processing - now using server-side API
export default function FlashcardUniversalFormContainer({
  generateFlashcards,
}: {
  generateFlashcards: (text: string, count: number, language?: string, gradeLevel?: string) => Promise<void>;
}) {
  const [universalFormData, setUniversalFormData] = useState<FormData | null>(null);
  const [extractedContent, setExtractedContent] = useState<ProcessedContent | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string>("");
  const [formStep, setFormStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [flashcardCount, setFlashcardCount] = useState(10);
  const [extractionMessage, setExtractionMessage] = useState<string | undefined>(undefined);
  const fallbackNoticeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const FALLBACK_NOTICE_IT =
    "Non siamo riusciti a recuperare la trascrizione dai sottotitoli. Ora stiamo generando la trascrizione direttamente dall'audio: potrebbe volerci qualche istante (un video di 5 minuti richiede circa 15 secondi).";

  const handleUniversalFormNext = async (e: React.FormEvent<HTMLFormElement>) => {
    console.log("🔄 handleUniversalFormNext called");
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const step = formData.get("step") as string;
    const activeStep = step ? parseInt(step, 10) : -1;
    setUniversalFormData(formData);
    setExtractionError("");
    setIsExtracting(true);
    setExtractionMessage(undefined);

    if (fallbackNoticeTimeoutRef.current) {
      clearTimeout(fallbackNoticeTimeoutRef.current);
      fallbackNoticeTimeoutRef.current = null;
    }
    if (activeStep === 2) {
      fallbackNoticeTimeoutRef.current = setTimeout(() => {
        setExtractionMessage(FALLBACK_NOTICE_IT);
      }, 6000);
    }

    try {
      // Determine source type for loading message
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
      setExtractionMessage(undefined);
      setFormStep(1);
      toast.success('Contenuto estratto con successo!');
    } catch (error) {
      console.error('Error extracting content:', error);
      setIsExtracting(false);
      setExtractionMessage(undefined);
      const errorMsg = error instanceof Error ? error.message : 'Errore durante l\'estrazione del contenuto';
      setExtractionError(errorMsg);
      toast.error(errorMsg);
    } finally {
      if (fallbackNoticeTimeoutRef.current) {
        clearTimeout(fallbackNoticeTimeoutRef.current);
        fallbackNoticeTimeoutRef.current = null;
      }
    }
  };

  const handleGenerateFlashcards = async () => {
    console.log("🚀 handleGenerateFlashcards called");
    setErrorMessage("");

    if (!extractedContent) {
      console.log("❌ No extracted content found");
      toast.error("Completa il primo passaggio");
      return;
    }

    try {
      console.log("✅ Using pre-extracted content:", {
        contentLength: extractedContent.content.length,
        gradeLevel: extractedContent.gradeLevel,
        language: extractedContent.language,
      });
      
      console.log("🔄 Generating flashcards with count:", flashcardCount, "language:", extractedContent.language, "and grade level:", extractedContent.gradeLevel);
      // Generate flashcards using the pre-extracted content
      await generateFlashcards(extractedContent.content, flashcardCount, extractedContent.language, extractedContent.gradeLevel);
      console.log("✅ Flashcards generated successfully!");
      
    } catch (error) {
      console.error("❌ Error generating flashcards:", error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to generate flashcards");
      toast.error("Failed to generate flashcards");
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
        <FlashcardUniversalForm onSubmit={handleUniversalFormNext} />
      )}

      {/* Show step 2 form even during extraction */}
      {(formStep === 1 || isExtracting) && (
        <FlashcardSettingsForm 
          onSubmit={handleGenerateFlashcards} 
          count={flashcardCount} 
          setCount={setFlashcardCount}
          isExtracting={isExtracting}
        />
      )}

      {/* Show extraction notification bar at top-right */}
      {isExtracting && (
        <ContentExtractionNotificationBar
          sourceType={getExtractionSourceType()}
          message={extractionMessage}
        />
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
