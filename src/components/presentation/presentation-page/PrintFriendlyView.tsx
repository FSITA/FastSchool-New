"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { usePresentationState } from "@/states/presentation-state";
import { getPresentation } from "@/app/_actions/presentation/presentationActions";
import { PresentationSlidesView } from "./PresentationSlidesView";
import { type Value } from "@udecode/plate-common";
import { type PlateNode } from "../utils/parser";
import {
  type Themes,
  themes,
  setThemeVariables,
  type ThemeProperties,
} from "@/lib/presentation/themes";
import { useTheme } from "next-themes";
import { getCustomThemeById } from "@/app/_actions/presentation/theme-actions";
import { Loader } from "@/components/ui/loader";

export function PrintFriendlyView() {
  const params = useParams();
  const id = params.id as string;
  const { resolvedTheme } = useTheme();
  const {
    setCurrentPresentation,
    setSlides,
    setTheme,
    setImageModel,
    setPresentationStyle,
    setLanguage,
    theme,
  } = usePresentationState();

  // Fetch presentation data
  const { data: presentationData, isLoading } = useQuery({
    queryKey: ["presentation", id, "print"],
    queryFn: async () => {
      const result = await getPresentation(id);
      if (!result.success) {
        throw new Error(result.message ?? "Failed to load presentation");
      }
      return result.presentation;
    },
    enabled: !!id,
  });

  // Update state when data is loaded
  useEffect(() => {
    if (presentationData) {
      setCurrentPresentation(
        presentationData.id,
        presentationData.title ?? null
      );
      
      // Get slides from the correct location
      let slides: any[] = [];
      if (presentationData.content && typeof presentationData.content === 'object' && 'slides' in presentationData.content) {
        slides = (presentationData.content as any).slides || [];
      } else if (presentationData.presentation?.content && typeof presentationData.presentation.content === 'object' && 'slides' in presentationData.presentation.content) {
        slides = (presentationData.presentation.content as any).slides || [];
      }
      
      console.log("[PDF] Setting slides in state:", slides.length);
      setSlides(slides);
      
      // Get theme and other settings from presentation object
      const presentation = presentationData.presentation || presentationData;
      setTheme(presentation.theme ?? "mystique");
      setImageModel(presentation.imageModel ?? "imagen-4.0-fast-generate-001");
      setPresentationStyle(presentation.presentationStyle ?? "professional");
      setLanguage(presentation.language ?? "english");

      // Load custom theme if needed
      if (presentationData.theme && !themes[presentationData.theme as keyof typeof themes]) {
        getCustomThemeById(presentationData.theme).then((themeData) => {
          if (themeData) {
            setTheme(presentationData.theme, themeData);
          }
        });
      }
    }
  }, [presentationData, setCurrentPresentation, setSlides, setTheme, setImageModel, setPresentationStyle, setLanguage]);

  // Signal when slides are ready for PDF export
  useEffect(() => {
    if (isLoading || !presentationData) {
      (window as any).__pdfReady = false;
      return;
    }

    // Debug: Check the structure of presentationData
    console.log("[PDF] presentationData structure:", {
      hasContent: !!presentationData.content,
      hasPresentation: !!presentationData.presentation,
      presentationContent: presentationData.presentation?.content,
      contentType: typeof presentationData.content,
      presentationContentType: typeof presentationData.presentation?.content,
    });

    // Try multiple ways to get slides
    let slides: any[] = [];
    
    // Try presentationData.content.slides (from Presentation type)
    if (presentationData.content && typeof presentationData.content === 'object' && 'slides' in presentationData.content) {
      slides = (presentationData.content as any).slides || [];
      console.log("[PDF] Found slides in presentationData.content.slides:", slides.length);
    }
    // Try presentationData.presentation.content.slides (from Prisma structure)
    else if (presentationData.presentation?.content && typeof presentationData.presentation.content === 'object' && 'slides' in presentationData.presentation.content) {
      slides = (presentationData.presentation.content as any).slides || [];
      console.log("[PDF] Found slides in presentationData.presentation.content.slides:", slides.length);
    }
    // Fallback: check state directly
    else {
      const state = usePresentationState.getState();
      slides = state.slides || [];
      console.log("[PDF] Using slides from state:", slides.length);
    }

    if (slides.length === 0) {
      console.log("[PDF] No slides found - checking state:", {
        stateSlides: usePresentationState.getState().slides.length,
        presentationDataKeys: Object.keys(presentationData),
      });
      return;
    }

    let interval: NodeJS.Timeout | null = null;
    let observer: MutationObserver | null = null;
    let attempts = 0;
    const maxAttempts = 300; // 300 * 500ms = 150 seconds max

    const checkReady = () => {
      attempts++;
      
      // Check state from Zustand store directly
      const state = usePresentationState.getState();
      const stateSlides = state.slides || [];
      const stateHasSlides = stateSlides.length > 0;
      
      // Check DOM for actual rendered slides
      const slideWrappers = document.querySelectorAll(".slide-wrapper");
      const presentationSlides = document.querySelectorAll(
        ".presentation-slide[data-slide-content='true']"
      );
      const slideContainers = document.querySelectorAll('[class*="slide-container"]');
      
      // Also check for any contenteditable editors (they're inside slides)
      const editors = document.querySelectorAll("[contenteditable='true']");
      
      const domHasSlides =
        slideWrappers.length > 0 ||
        presentationSlides.length > 0 ||
        slideContainers.length > 0;

      // Debug logging every 10 attempts
      if (attempts % 10 === 0) {
        console.log("[PDF] Checking slides...", {
          attempt: attempts,
          stateSlides: stateSlides.length,
          expectedSlides: slides.length,
          slideWrappers: slideWrappers.length,
          presentationSlides: presentationSlides.length,
          slideContainers: slideContainers.length,
          editors: editors.length,
          stateHasSlides,
          domHasSlides,
        });
      }

      // Both state and DOM must be ready, and match expected count
      if (stateHasSlides && domHasSlides) {
        const count = Math.max(
          slideWrappers.length,
          presentationSlides.length,
          slideContainers.length,
          stateSlides.length
        );
        
        // Make sure we have at least the expected number of slides
        if (count >= slides.length) {
          (window as any).__pdfReady = true;
          (window as any).__pdfSlideCount = count;
          console.log("[PDF] ✅ Slides ready!", {
            stateSlides: stateSlides.length,
            slideWrappers: slideWrappers.length,
            presentationSlides: presentationSlides.length,
            slideContainers: slideContainers.length,
            editors: editors.length,
            total: count,
            expected: slides.length,
          });
          return true;
        }
      }
      return false;
    };

    // Start checking after a delay to allow React to update
    const startDelay = setTimeout(() => {
      // Use MutationObserver to watch for DOM changes
      observer = new MutationObserver(() => {
        if (checkReady()) {
          if (observer) observer.disconnect();
          if (interval) clearInterval(interval);
        }
      });

      // Start observing the slides container
      const slidesContainer = document.querySelector(".presentation-slides");
      if (slidesContainer && observer) {
        observer.observe(slidesContainer, {
          childList: true,
          subtree: true,
          attributes: true,
          characterData: true,
        });
      }

      // Also poll as fallback
      interval = setInterval(() => {
        if (checkReady()) {
          if (interval) clearInterval(interval);
          if (observer) observer.disconnect();
        } else if (attempts >= maxAttempts) {
          // Max attempts reached - check one last time
          if (interval) clearInterval(interval);
          if (observer) observer.disconnect();
          const state = usePresentationState.getState();
          if (state.slides.length > 0) {
            (window as any).__pdfReady = true;
            (window as any).__pdfSlideCount = state.slides.length;
            console.log("[PDF] ⚠️ Max attempts reached - marking as ready with", state.slides.length, "slides");
          }
        }
      }, 500); // Check every 500ms

      // Initial check
      checkReady();
    }, 2000); // Wait 2 seconds for React to update state

    return () => {
      clearTimeout(startDelay);
      if (interval) clearInterval(interval);
      if (observer) observer.disconnect();
    };
  }, [isLoading, presentationData]);

  // Set theme variables
  useEffect(() => {
    if (theme && resolvedTheme) {
      const state = usePresentationState.getState();
      if (state.customThemeData) {
        setThemeVariables(state.customThemeData, resolvedTheme === "dark");
      } else if (typeof theme === "string" && theme in themes) {
        const currentTheme = themes[theme as keyof typeof themes];
        if (currentTheme) {
          setThemeVariables(currentTheme, resolvedTheme === "dark");
        }
      }
    }
  }, [theme, resolvedTheme]);

  const handleSlideChange = (value: Value, slideIndex: number) => {
    const { slides } = usePresentationState.getState();
    const updatedSlides = [...slides];
    if (updatedSlides[slideIndex]) {
      updatedSlides[slideIndex] = {
        ...updatedSlides[slideIndex],
        content: value as PlateNode[],
      };
      setSlides(updatedSlides);
    }
  };

  // Add pdf-mode class to body when in PDF mode
  useEffect(() => {
    const isPDFMode = window.location.search.includes("pdf=1");
    if (isPDFMode) {
      document.body.classList.add("pdf-mode");
    }
    return () => {
      document.body.classList.remove("pdf-mode");
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader size="lg" variant="dots" />
      </div>
    );
  }

  return (
    <div className="print-view min-h-screen bg-white">
      {/* No header, sidebar, or notifications - just slides */}
      <div className="presentation-slides w-full">
        <PresentationSlidesView
          handleSlideChange={handleSlideChange}
          isGeneratingPresentation={false}
        />
      </div>
    </div>
  );
}

