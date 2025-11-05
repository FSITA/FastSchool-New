"use client";

import { useState, useEffect } from "react";
import UniversalForm from "@/components/presentation/universal-form/UniversalForm";
import FormField from "@/components/shared/FormField";
import { LessonGeneratorViewer } from "./lesson-viewer";
import { LessonTitleForm } from "./lesson-title-form";
import LessonLoading from "./lesson-loading";
import ContentExtractionNotificationBar from "@/components/shared/ContentExtractionNotificationBar";
import { toast } from "sonner";
import type { LessonGenerator, LessonPage } from "@/types/lesson-generator";
import { PageParser } from "@/lib/lesson-generator/page-parser";
import type { ProcessedContent } from "@/lib/presentation/universal-form-processor";

interface LessonGeneratorFormContainerProps {
  onLoadingStateChange?: (isLoading: boolean) => void;
}

export default function LessonGeneratorFormContainer({ onLoadingStateChange }: LessonGeneratorFormContainerProps = {}) {
  const [formStep, setFormStep] = useState(0);
  const [universalFormData, setUniversalFormData] = useState<FormData | null>(null);
  const [extractedContent, setExtractedContent] = useState<ProcessedContent | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string>("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [numberOfPages, setNumberOfPages] = useState(3);
  const [accessibilityData, setAccessibilityData] = useState({ isSpecialNeeds: false, disabilityType: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [generatedPages, setGeneratedPages] = useState<LessonPage[]>([]);
  const [currentLesson, setCurrentLesson] = useState<LessonGenerator | null>(null);

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

  const handleTitleFormSubmit = async (title: string, pages: number, isSpecialNeeds: boolean, disabilityType: string) => {
    console.log("🎯 handleTitleFormSubmit called with:", { title, pages, isSpecialNeeds, disabilityType });
    setLessonTitle(title);
    setNumberOfPages(pages);
    setAccessibilityData({ isSpecialNeeds, disabilityType });
    setFormStep(2);
    setTimeout(() => {
      handleGenerateLesson({ title, pages, isSpecialNeeds, disabilityType });
    }, 100);
  };

  const handleGenerateLesson = async (titleOverride?: { title: string; pages: number; isSpecialNeeds: boolean; disabilityType: string }) => {
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
      // Create the lesson data from universal form
      const finalData = titleOverride || { title: lessonTitle, pages: numberOfPages, isSpecialNeeds: accessibilityData.isSpecialNeeds, disabilityType: accessibilityData.disabilityType };
      const lessonData: LessonGenerator = {
        topic: finalData.title || 'Untitled Lesson',
        gradeLevel: universalFormData.get('gradeLevel')?.toString() || '',
        mainConcept: universalFormData.get('notes')?.toString() || 
                     universalFormData.get('youtubeUrl')?.toString() || 
                     universalFormData.get('wikipediaLink')?.toString() || 
                     'Uploaded content',
        isSpecialNeeds: finalData.isSpecialNeeds,
        disabilityType: finalData.disabilityType,
        language: universalFormData.get('language')?.toString() || 'english',
        numberOfPages: finalData.pages
      };

      // Make lesson metadata available immediately so the viewer can render
      setCurrentLesson(lessonData);

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

      // Add lesson-specific data
      console.log("🔧 Adding lesson data to API:", finalData);
      apiFormData.append('numberOfPages', finalData.pages.toString());
      apiFormData.append('isSpecialNeeds', finalData.isSpecialNeeds.toString());
      apiFormData.append('disabilityType', finalData.disabilityType);

      console.log("🚀 Starting lesson generation...");
      
      // Use streaming fetch
      const response = await fetch('/api/lesson-generator/generate', {
        method: 'POST',
        body: apiFormData,
      });

      if (!response.ok) {
        throw new Error('Failed to generate lesson');
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
          
          // Try to parse pages as content comes in
          console.log(`📝 Received chunk, total content length: ${fullContent.length}`);
          const pages = PageParser.parsePages(fullContent);
          console.log(`📄 Parsed pages: ${pages.length}`);
          if (pages.length > 0) {
            setGeneratedPages(pages);
            console.log(`✅ Updated generatedPages to ${pages.length} pages`);
            // Ensure viewer condition is satisfied as soon as first page arrives
            setCurrentLesson(prev => prev ?? lessonData);
          }
        }
      }

      // Final parsing
      const finalPages = PageParser.parsePages(fullContent);
      setGeneratedPages(finalPages);
      setCurrentLesson(lessonData);
      toast.success('Lezione generata con successo!');
    } catch (error) {
      console.error('Error generating lesson:', error);
      setErrorMessage(
        error instanceof Error
          ? `Errore nella generazione della lezione: ${error.message}`
          : "Errore nella generazione della lezione, riprova!"
      );
      toast.error('Impossibile generare la lezione. Riprova.');
    } finally {
      setIsLoading(false);
      onLoadingStateChange?.(false);
    }
  };

  const handleGenerateAgain = () => {
    setGeneratedContent('');
    setGeneratedPages([]);
    setCurrentLesson(null);
    setFormStep(0);
    setUniversalFormData(null);
    setExtractedContent(null);
    setExtractionError("");
    setLessonTitle("");
    setNumberOfPages(3);
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

      {/* Show loader until we have at least one page ready */}
      {generatedPages.length === 0 && isLoading && (
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4 text-balance">Generazione della Tua Lezione</h1>
            <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
              Creazione di una lezione completa di {numberOfPages} pagine per: <strong>{lessonTitle}</strong>
            </p>
          </div>
          <LessonLoading 
            totalPages={numberOfPages}
            currentContent={generatedContent}
            generatedPages={generatedPages}
          />
        </div>
      )}

      {/* Show lesson viewer as soon as we have at least one page */}
      {generatedPages.length > 0 && currentLesson && (
        <LessonGeneratorViewer
          lesson={currentLesson}
          generatedPages={generatedPages}
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
