"use client";

import { useState, useEffect, useRef } from "react";
import UniversalForm from "@/components/presentation/universal-form/UniversalForm";
import FormField from "@/components/shared/FormField";
import { LessonPlanViewer } from "./lesson-plan-viewer";
import { LessonTitleForm } from "./lesson-title-form";
import LessonPlanLoading from "./lesson-plan-loading";
import ContentExtractionNotificationBar from "@/components/shared/ContentExtractionNotificationBar";
import { toast } from "sonner";
import type { LessonPlan, LessonPlanSection } from "@/types/lesson-planner";
import type { ProcessedContent } from "@/lib/presentation/universal-form-processor";
import { SectionParser } from "@/lib/lesson-planner/section-parser";

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
  const [generatedSections, setGeneratedSections] = useState<LessonPlanSection[]>([]);
  const [currentLessonPlan, setCurrentLessonPlan] = useState<LessonPlan | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [accessibilityData, setAccessibilityData] = useState<{ isSpecialNeeds: boolean; disabilityType: string }>({ isSpecialNeeds: false, disabilityType: "" });
  const [extractionMessage, setExtractionMessage] = useState<string | undefined>(undefined);
  const fallbackNoticeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const FALLBACK_NOTICE_IT =
    "Non siamo riusciti a recuperare la trascrizione dai sottotitoli. Ora stiamo generando la trascrizione direttamente dall'audio: potrebbe volerci qualche istante (un video di 5 minuti richiede circa 15 secondi).";

  // Reset state when component mounts to prevent stale state issues
  useEffect(() => {
    setFormStep(0);
    setUniversalFormData(null);
    setLessonTitle("");
    setIsLoading(false);
    setGeneratedContent('');
    setGeneratedSections([]);
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

      // Make lesson plan metadata available immediately so the viewer can render
      setCurrentLessonPlan(lessonPlanData);

      console.log("🚀 Starting lesson plan generation...");
      
      // Use streaming fetch
      const response = await fetch('/api/lesson-planner/generate', {
        method: 'POST',
        body: apiFormData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to generate lesson plan' }));
        throw new Error(errorData.message || 'Failed to generate lesson plan');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let lastParsedLength = 0;

      if (!reader) {
        throw new Error('No response body reader available');
      }

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;
          
          // Update content in real-time for UI feedback
          setGeneratedContent(fullContent);
          
          // Parse incrementally - only parse new content since last parse
          // Debounce slightly to avoid parsing on every tiny chunk
          // Only parse when we have substantial new content (500 chars) to avoid incomplete sections
          if (fullContent.length - lastParsedLength > 500 || (fullContent.includes('SECTION') && fullContent.length > 1000)) {
            try {
              // Parse all sections from full content to get context (allow partial during streaming)
              const allSections = SectionParser.parseContent(fullContent, true);
              
              // Filter to only complete sections (parser already filters, but double-check)
              const completeSections = allSections.filter(section => 
                section.content.trim().length >= 50
              );
              
              if (completeSections.length > 0) {
                console.log(`📝 Found ${completeSections.length} complete sections (total parsed: ${allSections.length})`);
                
                // Update sections: merge new ones and update existing ones with more complete content
                setGeneratedSections(prevSections => {
                  const updatedSections = [...prevSections];
                  const existingTitles = new Map(prevSections.map((s, idx) => [s.title, idx]));
                  let hasChanges = false;
                  
                  // Process all complete sections
                  for (const section of completeSections) {
                    const existingIndex = existingTitles.get(section.title);
                    
                    if (existingIndex !== undefined) {
                      // Update existing section if new content is more complete
                      const existingSection = updatedSections[existingIndex];
                      if (section.content.trim().length > existingSection.content.trim().length) {
                        updatedSections[existingIndex] = section;
                        hasChanges = true;
                        console.log(`📝 Updated section "${section.title}" with more complete content`);
                      }
                    } else {
                      // Add new section
                      updatedSections.push(section);
                      existingTitles.set(section.title, updatedSections.length - 1);
                      hasChanges = true;
                      console.log(`📝 Added new section "${section.title}"`);
                    }
                  }
                  
                  return hasChanges ? updatedSections : prevSections;
                });
                
                // Ensure viewer condition is satisfied as soon as first section arrives
                setCurrentLessonPlan(prev => prev ?? lessonPlanData);
                
                lastParsedLength = fullContent.length;
              }
            } catch (parseError) {
              // Continue streaming even if parsing fails temporarily
              console.warn('Incremental parsing error (may be incomplete):', parseError);
            }
          }
          
          console.log(`📝 Received chunk, total content length: ${fullContent.length}`);
        }
      } catch (streamError) {
        console.error('Stream reading error:', streamError);
        throw new Error('Error reading stream: ' + (streamError instanceof Error ? streamError.message : 'Unknown error'));
      }

      // Final parsing to catch any remaining sections (full parse, no partial)
      console.log(`📊 Final content length: ${fullContent.length}`);
      try {
        const finalSections = SectionParser.parseContent(fullContent, false);
        
        // Get all complete sections (final parse doesn't need filtering, just ensure completeness)
        const remainingSections = finalSections.filter(section => 
          section.content.trim().length >= 50
        );
        
        if (remainingSections.length > 0) {
          console.log(`📝 Final parse found ${remainingSections.length} sections`);
          
          setGeneratedSections(prevSections => {
            const updatedSections = [...prevSections];
            const existingTitles = new Map(prevSections.map((s, idx) => [s.title, idx]));
            let hasChanges = false;
            
            // Update or add all final sections
            for (const section of remainingSections) {
              const existingIndex = existingTitles.get(section.title);
              
              if (existingIndex !== undefined) {
                // Update existing section with final complete content
                updatedSections[existingIndex] = section;
                hasChanges = true;
              } else {
                // Add new section
                updatedSections.push(section);
                existingTitles.set(section.title, updatedSections.length - 1);
                hasChanges = true;
              }
            }
            
            return hasChanges ? updatedSections : prevSections;
          });
        }
        
        // Final validation - ensure we have sections
        setGeneratedSections(prevSections => {
          if (prevSections.length === 0) {
            // Fallback: parse all at once if streaming parsing failed
            const fallbackSections = SectionParser.parseContent(fullContent, false);
            if (fallbackSections.length > 0) {
              return fallbackSections;
            }
          }
          return prevSections;
        });
        
        console.log(`✅ Final parsing complete`);
      } catch (parseError) {
        console.error('Final parsing error:', parseError);
        // Check if we have any sections from streaming
        if (generatedSections.length === 0) {
          // Try fallback parsing
          try {
            const fallbackSections = SectionParser.parseContent(fullContent, false);
            if (fallbackSections.length > 0) {
              setGeneratedSections(fallbackSections);
            } else {
              throw new Error('Failed to parse lesson plan content: ' + (parseError instanceof Error ? parseError.message : 'Unknown error'));
            }
          } catch (fallbackError) {
            throw new Error('Failed to parse lesson plan content: ' + (parseError instanceof Error ? parseError.message : 'Unknown error'));
          }
        }
        // If we have sections from streaming, continue with them
      }
      
      setCurrentLessonPlan(lessonPlanData);
      toast.success('Piano di lezione generato con successo!');
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
    setGeneratedSections([]);
    setCurrentLessonPlan(null);
    setFormStep(0);
    setUniversalFormData(null);
    setExtractedContent(null);
    setExtractionError("");
    setLessonTitle("");
    setAccessibilityData({ isSpecialNeeds: false, disabilityType: "" });
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

      {/* Show loader until we have at least one section ready */}
      {generatedSections.length === 0 && isLoading && (
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4 text-balance">Generazione del Tuo Piano di Lezione</h1>
            <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
              Creazione di un piano di lezione completo per: <strong>{lessonTitle || 'Piano di lezione Fastschool'}</strong>
            </p>
          </div>
          <LessonPlanLoading 
            totalSections={8}
            currentContent={generatedContent}
            generatedSections={generatedSections}
          />
        </div>
      )}

      {/* Show lesson plan viewer as soon as we have at least one section */}
      {generatedSections.length > 0 && currentLessonPlan && (
        <LessonPlanViewer
          lessonPlan={currentLessonPlan}
          generatedContent={generatedContent}
          generatedSections={generatedSections}
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
