"use client";

import { useState, useEffect, useRef } from "react";
import UniversalForm from "@/components/presentation/universal-form/UniversalForm";
import FormField from "@/components/shared/FormField";
import { SummaryGeneratorViewer } from "./summary-viewer";
import { SummaryTitleForm } from "./summary-title-form";
import SummaryLoading from "./summary-loading";
import ContentExtractionNotificationBar from "@/components/shared/ContentExtractionNotificationBar";
import { toast } from "sonner";
import type { SummaryGenerator, SummaryOutline } from "@/types/summary-generator";
import { OutlineParser } from "@/lib/summary-generator/outline-parser";
import type { ProcessedContent } from "@/lib/presentation/universal-form-processor";

interface SummaryGeneratorFormContainerProps {
  onLoadingStateChange?: (isLoading: boolean) => void;
}

export default function SummaryGeneratorFormContainer({ onLoadingStateChange }: SummaryGeneratorFormContainerProps = {}) {
  const [formStep, setFormStep] = useState(0);
  const [universalFormData, setUniversalFormData] = useState<FormData | null>(null);
  const [extractedContent, setExtractedContent] = useState<ProcessedContent | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string>("");
  const [summaryTitle, setSummaryTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [generatedOutlines, setGeneratedOutlines] = useState<SummaryOutline[]>([]);
  const [currentSummary, setCurrentSummary] = useState<SummaryGenerator | null>(null);
  const [extractionMessage, setExtractionMessage] = useState<string | undefined>(undefined);
  const fallbackNoticeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const FALLBACK_NOTICE_IT =
    "Non siamo riusciti a recuperare la trascrizione dai sottotitoli. Ora stiamo generando la trascrizione direttamente dall'audio: potrebbe volerci qualche istante (un video di 5 minuti richiede circa 15 secondi).";

  const handleUniversalFormNext = async (e: React.FormEvent<HTMLFormElement>) => {
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
      // Don't move to next step if extraction fails
    } finally {
      if (fallbackNoticeTimeoutRef.current) {
        clearTimeout(fallbackNoticeTimeoutRef.current);
        fallbackNoticeTimeoutRef.current = null;
      }
    }
  };

  const handleTitleFormSubmit = async (title: string) => {
    console.log("🎯 handleTitleFormSubmit called with:", { title });
    setSummaryTitle(title);
    setFormStep(2);
    setTimeout(() => {
      handleGenerateSummary({ title });
    }, 100);
  };

  const handleGenerateSummary = async (titleOverride?: { title: string }) => {
    setErrorMessage("");
    setIsLoading(true);
    onLoadingStateChange?.(true);

    if (!universalFormData) {
      setErrorMessage("Completa il primo passaggio");
      setIsLoading(false);
      onLoadingStateChange?.(false);
      return;
    }

    try {
      // Create the summary data from universal form
      const finalData = titleOverride || { title: summaryTitle };
      const summaryData: SummaryGenerator = {
        topic: finalData.title || 'Untitled Summary',
        gradeLevel: universalFormData.get('gradeLevel')?.toString() || '',
        mainConcept: universalFormData.get('notes')?.toString() || 
                     universalFormData.get('youtubeUrl')?.toString() || 
                     universalFormData.get('wikipediaLink')?.toString() || 
                     'Uploaded content',
        language: universalFormData.get('language')?.toString() || 'english',
      };

      // Make summary metadata available immediately so the viewer can render
      setCurrentSummary(summaryData);

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

      // Add summary-specific data (always set to false/empty for accessibility)
      console.log("🔧 Adding summary data to API:", finalData);
      apiFormData.append('isSpecialNeeds', 'false');
      apiFormData.append('disabilityType', '');

      console.log("🚀 Starting summary generation...");
      
      // Use streaming fetch
      const response = await fetch('/api/summary-generator/generate', {
        method: 'POST',
        body: apiFormData,
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;
          
          // Update content in real-time
          setGeneratedContent(fullContent);
          
          // Try to parse outlines as content comes in
          console.log(`📝 Received chunk, total content length: ${fullContent.length}`);
          const outlines = OutlineParser.parseOutlines(fullContent);
          console.log(`📄 Parsed outlines: ${outlines.length}`);
          if (outlines.length > 0) {
            setGeneratedOutlines(outlines);
            console.log(`✅ Updated generatedOutlines to ${outlines.length} outlines`);
            // Ensure viewer condition is satisfied as soon as first outline arrives
            setCurrentSummary(prev => prev ?? summaryData);
          }
        }
      }

      // Final parsing
      const finalOutlines = OutlineParser.parseOutlines(fullContent);
      
      // Validate we have exactly 10 outlines
      if (finalOutlines.length !== 10) {
        console.warn(`⚠️ Expected 10 outlines, got ${finalOutlines.length}`);
        // Pad or truncate to 10
        const validatedOutlines = finalOutlines.length < 10 
          ? OutlineParser.parseOutlines(fullContent) // Try to parse again
          : finalOutlines.slice(0, 10);
        
        if (validatedOutlines.length < 10) {
          // If still not 10, pad with empty outlines
          const padded = [...validatedOutlines];
          for (let i = validatedOutlines.length; i < 10; i++) {
            padded.push({
              outlineNumber: i + 1,
              title: `Outline ${i + 1}`,
              content: '',
              type: 'content'
            });
          }
          setGeneratedOutlines(padded);
        } else {
          setGeneratedOutlines(validatedOutlines);
        }
      } else {
        setGeneratedOutlines(finalOutlines);
      }
      
      setCurrentSummary(summaryData);
      toast.success('Riassunto generato con successo!');
    } catch (error) {
      console.error('Error generating summary:', error);
      setErrorMessage(
        error instanceof Error
          ? `Errore nella generazione del riassunto: ${error.message}`
          : "Errore nella generazione del riassunto, riprova!"
      );
      toast.error('Impossibile generare il riassunto. Riprova.');
    } finally {
      setIsLoading(false);
      onLoadingStateChange?.(false);
    }
  };

  const handleGenerateAgain = () => {
    setGeneratedContent('');
    setGeneratedOutlines([]);
    setCurrentSummary(null);
    setFormStep(0);
    setUniversalFormData(null);
    setExtractedContent(null);
    setExtractionError("");
    setSummaryTitle("");
    setExtractionMessage(undefined);
    if (fallbackNoticeTimeoutRef.current) {
      clearTimeout(fallbackNoticeTimeoutRef.current);
      fallbackNoticeTimeoutRef.current = null;
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
    <section className="bg-white">
      {!generatedContent && formStep === 0 && !isExtracting && (
        <UniversalForm onSubmit={handleUniversalFormNext} />
      )}

      {/* Show step 2 form even during extraction */}
      {!generatedContent && (formStep === 1 || isExtracting) && (
        <SummaryTitleForm 
          onSubmit={handleTitleFormSubmit}
          isLoading={isLoading}
          isExtracting={isExtracting}
          universalFormData={universalFormData}
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

      {/* Show loader until we have all 10 outlines ready */}
      {generatedOutlines.length < 10 && isLoading && (
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4 text-balance">Generazione del Tuo Riassunto</h1>
            <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
              Creazione di 10 riassunti concisi per: <strong>{summaryTitle}</strong>
            </p>
          </div>
          <SummaryLoading 
            currentContent={generatedContent}
            generatedOutlines={generatedOutlines}
          />
        </div>
      )}

      {/* Show summary viewer as soon as we have all 10 outlines */}
      {generatedOutlines.length >= 10 && currentSummary && (
        <SummaryGeneratorViewer
          summary={currentSummary}
          generatedOutlines={generatedOutlines.slice(0, 10)}
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

