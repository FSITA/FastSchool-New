"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { usePresentationState } from "@/states/presentation-state";
import { SlideParser } from "../utils/parser";
import { updatePresentation } from "@/app/_actions/presentation/presentationActions";

export function PresentationGenerationManager() {
  const {
    numSlides,
    language,
    presentationInput,
    universalFormData,
    shouldStartOutlineGeneration,
    shouldStartPresentationGeneration,
    setIsGeneratingOutline,
    setShouldStartOutlineGeneration,
    setShouldStartPresentationGeneration,
    resetGeneration,
    setOutline,
    setSlides,
    setIsGeneratingPresentation,
    setOriginalLanguage,
  } = usePresentationState();

  // Create a ref for the streaming parser to persist between renders
  const streamingParserRef = useRef<SlideParser>(new SlideParser());

  // Add refs to track the animation frame IDs
  const slidesRafIdRef = useRef<number | null>(null);
  const outlineRafIdRef = useRef<number | null>(null);

  // Create buffer refs to store the latest content
  // Note: The types should match what setOutline and setSlides expect
  const slidesBufferRef = useRef<ReturnType<
    SlideParser["getAllSlides"]
  > | null>(null);
  const outlineBufferRef = useRef<string[] | null>(null);

  // Function to update slides using requestAnimationFrame
  const updateSlidesWithRAF = (): void => {
    // Always check for the latest slides in the buffer
    if (slidesBufferRef.current !== null) {
      setSlides(slidesBufferRef.current);
      slidesBufferRef.current = null;
    }

    // Clear the current frame ID
    slidesRafIdRef.current = null;

    // We don't recursively schedule new frames
    // New frames will be scheduled only when new content arrives
  };

  // Function to update outline using requestAnimationFrame
  const updateOutlineWithRAF = (): void => {
    // Always check for the latest outline in the buffer
    if (outlineBufferRef.current !== null) {
      setOutline(outlineBufferRef.current);
      outlineBufferRef.current = null;
    }

    // Clear the current frame ID
    outlineRafIdRef.current = null;

    // We don't recursively schedule new frames
    // New frames will be scheduled only when new content arrives
  };

  const [outlineCompletion, setOutlineCompletion] = useState("");
  // Watch for outline generation start
  useEffect(() => {
    const startOutlineGeneration = async (): Promise<void> => {
      if (shouldStartOutlineGeneration) {
        const { presentationInput, numSlides, language } =
          usePresentationState.getState();

        console.log("--- Starting Outline Generation with Manual Fetch ---");
        console.log("Presentation Input:", presentationInput);
        console.log("Number of Slides:", numSlides);
        console.log("Language:", language);
        console.log("------------------------------------");

        try {
          setIsGeneratingOutline(true);
          setOutlineCompletion(""); // Reset completion state

          let response: Response;
          
          if (universalFormData) {
            // Use universal form data
            const formData = new FormData();
            universalFormData.forEach((value, key) => {
              formData.append(key, value);
            });
            formData.append("numSlides", numSlides.toString());
            
            // Extract and set the original language from universal form
            const originalLang = universalFormData.get("language") as string;
            if (originalLang) {
              setOriginalLanguage(originalLang);
            }
            
            response = await fetch("/api/presentation/outline", {
              method: "POST",
              body: formData,
            });
          } else {
            // Use legacy presentation input
            response = await fetch("/api/presentation/outline", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                prompt: presentationInput,
                numberOfCards: numSlides,
                language,
              }),
            });
          }

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          if (!response.body) {
            throw new Error("Response body is null");
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let done = false;
          let fullText = "";

          while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            const chunk = decoder.decode(value, { stream: !done });
            fullText += chunk;
            setOutlineCompletion(fullText);
          }

          console.log("--- Outline Generation Finished ---");
          console.log("Final completion:", fullText);
          console.log("------------------------------------");

          const {
            currentPresentationId,
            currentPresentationTitle,
            theme,
          } = usePresentationState.getState();

          if (currentPresentationId) {
            const sections = fullText.split(/^# /gm).filter(Boolean);
            const outlineItems: string[] =
              sections.length > 0
                ? sections.map((section: string) => `# ${section}`.trim())
                : [fullText];

            void updatePresentation({
              id: currentPresentationId,
              outline: outlineItems,
              title: currentPresentationTitle ?? "",
              theme,
            });
          }
        } catch (error) {
          console.error("--- ERROR in Outline Generation (Frontend) ---");
          console.error(error);
          console.log("---------------------------------------------");
          toast.error(
            "Failed to generate outline: " +
              (error instanceof Error ? error.message : String(error)),
          );
          resetGeneration();
        } finally {
          setIsGeneratingOutline(false);
          setShouldStartOutlineGeneration(false);
        }
      }
    };

    void startOutlineGeneration();
  }, [shouldStartOutlineGeneration]);

  useEffect(() => {
    if (outlineCompletion) {
      const sections = outlineCompletion.split(/^# /gm).filter(Boolean);
      const outlineItems: string[] =
        sections.length > 0
          ? sections.map((section) => `# ${section}`.trim())
          : [outlineCompletion];

      outlineBufferRef.current = outlineItems;

      if (outlineRafIdRef.current === null) {
        outlineRafIdRef.current = requestAnimationFrame(updateOutlineWithRAF);
      }
    }
  }, [outlineCompletion]);


  const [presentationCompletion, setPresentationCompletion] = useState("");

  useEffect(() => {
    if (presentationCompletion) {
      try {
        // Don't reset the parser - just parse the new chunk
        // This prevents slides from disappearing and reappearing
        streamingParserRef.current.parseChunk(presentationCompletion);
        const allSlides = streamingParserRef.current.getAllSlides();

        slidesBufferRef.current = allSlides;

        if (slidesRafIdRef.current === null) {
          slidesRafIdRef.current = requestAnimationFrame(updateSlidesWithRAF);
        }
      } catch (error) {
        console.error("Error processing presentation XML:", error);
        toast.error("Error processing presentation content");
      }
    }
  }, [presentationCompletion]);

  useEffect(() => {
    const startPresentationGeneration = async (): Promise<void> => {
      if (shouldStartPresentationGeneration) {
        const {
          outline,
          presentationInput,
          language,
          presentationStyle,
          currentPresentationTitle,
        } = usePresentationState.getState();

        streamingParserRef.current.reset();
        setIsGeneratingPresentation(true);
        setPresentationCompletion("");

        console.log("--- Starting Presentation Generation with Manual Fetch ---");
        console.log("Generation Parameters:", {
          title: presentationInput ?? currentPresentationTitle ?? "",
          outline,
          language,
          tone: presentationStyle,
        });
        console.log("------------------------------------");

        try {
          const response = await fetch("/api/presentation/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: presentationInput ?? currentPresentationTitle ?? "",
              outline,
              language,
              tone: presentationStyle,
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          if (!response.body) {
            throw new Error("Response body is null");
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let done = false;
          let fullText = "";

          while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            const chunk = decoder.decode(value, { stream: !done });
            fullText += chunk;
            setPresentationCompletion(fullText);
          }

          console.log("--- Presentation Generation Finished ---");

          const { currentPresentationId, theme } =
            usePresentationState.getState();
          const parser = streamingParserRef.current;
          parser.finalize();
          parser.clearAllGeneratingMarks();
          const slides = parser.getAllSlides();

          if (currentPresentationId) {
            void updatePresentation({
              id: currentPresentationId,
              content: { slides: slides },
              title: currentPresentationTitle ?? "",
              theme,
            });
          }
        } catch (error) {
          console.error("--- ERROR in Presentation Generation (Frontend) ---");
          console.error(error);
          console.log("---------------------------------------------");
          toast.error(
            "Failed to generate presentation: " +
              (error instanceof Error ? error.message : String(error)),
          );
          resetGeneration();
        } finally {
          setIsGeneratingPresentation(false);
          setShouldStartPresentationGeneration(false);
          toast.success("Presentation generated successfully!");
        }
      }
    };

    void startPresentationGeneration();
  }, [shouldStartPresentationGeneration]);

  // Clean up RAF on unmount
  useEffect(() => {
    return () => {
      if (slidesRafIdRef.current !== null) {
        cancelAnimationFrame(slidesRafIdRef.current);
        slidesRafIdRef.current = null;
      }

      if (outlineRafIdRef.current !== null) {
        cancelAnimationFrame(outlineRafIdRef.current);
        outlineRafIdRef.current = null;
      }
    };
  }, []);

  return null;
}
