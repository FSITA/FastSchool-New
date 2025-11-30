"use client";

import { useState, useEffect, useRef } from "react";
import UniversalForm from "@/components/presentation/universal-form/UniversalForm";
import { QuizGeneratorViewer } from "./quiz-viewer";
import { QuizTitleForm } from "./quiz-title-form";
import QuizLoading from "./quiz-loading";
import ContentExtractionNotificationBar from "@/components/shared/ContentExtractionNotificationBar";
import { toast } from "sonner";
import type { QuizGenerator, Quiz } from "@/types/quiz-generator";
import { QuizParser } from "@/lib/quiz-generator/quiz-parser";
import type { ProcessedContent } from "@/lib/presentation/universal-form-processor";

interface QuizGeneratorFormContainerProps {
  onLoadingStateChange?: (isLoading: boolean) => void;
}

export default function QuizGeneratorFormContainer({ onLoadingStateChange }: QuizGeneratorFormContainerProps = {}) {
  const [formStep, setFormStep] = useState(0);
  const [universalFormData, setUniversalFormData] = useState<FormData | null>(null);
  const [extractedContent, setExtractedContent] = useState<ProcessedContent | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string>("");
  const [quizTitle, setQuizTitle] = useState("");
  const [numberOfQuizzes, setNumberOfQuizzes] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [generatedQuizzes, setGeneratedQuizzes] = useState<Quiz[]>([]);
  const [currentQuiz, setCurrentQuiz] = useState<QuizGenerator | null>(null);
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

  const handleTitleFormSubmit = async (title: string, quizzes: number) => {
    console.log("🎯 handleTitleFormSubmit called with:", { title, quizzes });
    
    // Validate inputs
    if (!title.trim()) {
      setErrorMessage("Inserisci un titolo per il quiz");
      toast.error('Inserisci un titolo per il quiz');
      return;
    }
    
    if (quizzes < 1 || quizzes > 50) {
      setErrorMessage("Il numero di quiz deve essere compreso tra 1 e 50");
      toast.error('Il numero di quiz deve essere compreso tra 1 e 50');
      return;
    }
    
    setQuizTitle(title);
    setNumberOfQuizzes(quizzes);
    setFormStep(2);
    setTimeout(() => {
      handleGenerateQuiz({ title, quizzes });
    }, 100);
  };

  const handleGenerateQuiz = async (titleOverride?: { title: string; quizzes: number }) => {
    setErrorMessage("");
    setIsLoading(true);
    onLoadingStateChange?.(true);

    if (!universalFormData) {
      setErrorMessage("Completa il primo passaggio");
      setIsLoading(false);
      onLoadingStateChange?.(false);
      toast.error('Completa il primo passaggio');
      return;
    }

    try {
      // Create the quiz data from universal form
      const finalData = titleOverride || { title: quizTitle, quizzes: numberOfQuizzes };
      const quizData: QuizGenerator = {
        topic: finalData.title || 'Untitled Quiz',
        gradeLevel: universalFormData.get('gradeLevel')?.toString() || 'secondary',
        mainConcept: universalFormData.get('notes')?.toString() || 
                     universalFormData.get('youtubeUrl')?.toString() || 
                     universalFormData.get('wikipediaLink')?.toString() || 
                     'Uploaded content',
        language: universalFormData.get('language')?.toString() || 'english',
        numberOfQuizzes: finalData.quizzes
      };

      // Make quiz metadata available immediately so the viewer can render
      setCurrentQuiz(quizData);

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

      // Add quiz-specific data
      console.log("🔧 Adding quiz data to API:", finalData);
      apiFormData.append('numberOfQuizzes', finalData.quizzes.toString());

      console.log("🚀 Starting quiz generation...");
      
      // Use streaming fetch
      const response = await fetch('/api/quiz-generator/generate', {
        method: 'POST',
        body: apiFormData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to generate quiz' }));
        throw new Error(errorData.message || 'Failed to generate quiz');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let lastParsedLength = 0; // Track what we've already parsed
      const seenQuestionTexts = new Set<string>(); // Track parsed questions to avoid duplicates

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
          if (fullContent.length - lastParsedLength > 100 || fullContent.includes('\n')) {
            try {
              // Parse only the new content (but we'll parse full content to get context)
              const allQuestions = QuizParser.parseAllQuestions(fullContent);
              
              // Filter out already seen questions
              const newQuestions = allQuestions.filter(q => {
                const questionKey = q.question.trim().toLowerCase();
                if (!seenQuestionTexts.has(questionKey)) {
                  seenQuestionTexts.add(questionKey);
                  return true;
                }
                return false;
              });
              
              if (newQuestions.length > 0) {
                console.log(`📝 Found ${newQuestions.length} new questions (total: ${allQuestions.length})`);
                
                // Randomize each new question once
                const randomizedQuestions = newQuestions.map(q => QuizParser.randomizeSingleQuestion(q));
                
                // Build quizzes incrementally: 1 question per quiz
                setGeneratedQuizzes(prevQuizzes => {
                  const existingCount = prevQuizzes.length;
                  const newQuizzes: Quiz[] = [];
                  
                  // Keep existing quizzes (they're already randomized)
                  const updated = [...prevQuizzes];
                  
                  // Add new quizzes (1 question each)
                  randomizedQuestions.forEach((question, idx) => {
                    updated.push({
                      quizNumber: existingCount + idx + 1,
                      questions: [question]
                    });
                  });
                  
                  // Limit to requested number of quizzes
                  if (updated.length > finalData.quizzes) {
                    return updated.slice(0, finalData.quizzes);
                  }
                  
                  return updated;
                });
                
                // Ensure viewer is ready
                setCurrentQuiz(prev => prev ?? quizData);
                
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

      // Final parsing to catch any remaining questions
      console.log(`📊 Final content length: ${fullContent.length}`);
      try {
        const allQuestions = QuizParser.parseAllQuestions(fullContent);
        const newQuestions = allQuestions.filter(q => {
          const questionKey = q.question.trim().toLowerCase();
          return !seenQuestionTexts.has(questionKey);
        });
        
        if (newQuestions.length > 0) {
          console.log(`📝 Final parse found ${newQuestions.length} additional questions`);
          const randomizedQuestions = newQuestions.map(q => QuizParser.randomizeSingleQuestion(q));
          
          setGeneratedQuizzes(prevQuizzes => {
            const existingCount = prevQuizzes.length;
            const updated = [...prevQuizzes];
            
            randomizedQuestions.forEach((question, idx) => {
              // Only add if we haven't reached the limit
              if (updated.length < finalData.quizzes) {
                updated.push({
                  quizNumber: existingCount + idx + 1,
                  questions: [question]
                });
              }
            });
            
            // Limit to requested number of quizzes
            return updated.slice(0, finalData.quizzes);
          });
        }
        
        // Final validation - ensure we have quizzes
        setGeneratedQuizzes(prevQuizzes => {
          if (prevQuizzes.length === 0) {
            // Fallback: parse all at once if streaming parsing failed
            const fallbackQuizzes = QuizParser.parseQuizzes(fullContent, finalData.quizzes);
            if (fallbackQuizzes.length > 0) {
              return fallbackQuizzes.slice(0, finalData.quizzes);
            }
          }
          return prevQuizzes.slice(0, finalData.quizzes);
        });
        
        console.log(`✅ Final parsing complete`);
      } catch (parseError) {
        console.error('Final parsing error:', parseError);
        // Check if we have any quizzes from streaming
        const currentQuizzes = generatedQuizzes;
        if (currentQuizzes.length === 0) {
          // Try fallback parsing
          try {
            const fallbackQuizzes = QuizParser.parseQuizzes(fullContent, finalData.quizzes);
            if (fallbackQuizzes.length > 0) {
              setGeneratedQuizzes(fallbackQuizzes.slice(0, finalData.quizzes));
            } else {
              throw new Error('Failed to parse quiz content: ' + (parseError instanceof Error ? parseError.message : 'Unknown error'));
            }
          } catch (fallbackError) {
            throw new Error('Failed to parse quiz content: ' + (parseError instanceof Error ? parseError.message : 'Unknown error'));
          }
        }
        // If we have quizzes from streaming, continue with them
      }
      
      setCurrentQuiz(quizData);
      toast.success('Quiz generato con successo!');
    } catch (error) {
      console.error('Error generating quiz:', error);
      const errorMsg = error instanceof Error
        ? `Errore nella generazione del quiz: ${error.message}`
        : "Errore nella generazione del quiz, riprova!";
      setErrorMessage(errorMsg);
      toast.error('Impossibile generare il quiz. Riprova.');
      
      // Reset states on error
      setGeneratedContent('');
      setGeneratedQuizzes([]);
      setCurrentQuiz(null);
    } finally {
      setIsLoading(false);
      onLoadingStateChange?.(false);
    }
  };

  const handleGenerateAgain = () => {
    setGeneratedContent('');
    setGeneratedQuizzes([]);
    setCurrentQuiz(null);
    setFormStep(0);
    setUniversalFormData(null);
    setExtractedContent(null);
    setExtractionError("");
    setQuizTitle("");
    setNumberOfQuizzes(5);
    setErrorMessage("");
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
        <QuizTitleForm 
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

      {/* Show loader until we have at least one quiz ready */}
      {generatedQuizzes.length === 0 && isLoading && (
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4 text-balance">Generazione del Tuo Quiz</h1>
            <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
              Creazione di {numberOfQuizzes} quiz per: <strong>{quizTitle}</strong>
            </p>
          </div>
          <QuizLoading 
            totalQuizzes={numberOfQuizzes}
            currentContent={generatedContent}
            generatedQuizzes={generatedQuizzes}
          />
        </div>
      )}

      {/* Show quiz viewer as soon as we have at least one quiz */}
      {generatedQuizzes.length > 0 && currentQuiz && (
        <QuizGeneratorViewer
          quiz={currentQuiz}
          generatedQuizzes={generatedQuizzes}
          onGenerateAgain={handleGenerateAgain}
        />
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mt-4 max-w-lg mx-auto">
          <strong className="font-bold">Errore: </strong>
          <span className="block sm:inline">{errorMessage}</span>
        </div>
      )}
    </section>
  );
}

