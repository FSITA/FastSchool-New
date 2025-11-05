"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { usePresentationState } from "@/states/presentation-state";

import {
  type Themes,
  themes,
  setThemeVariables,
  type ThemeProperties,
} from "@/lib/presentation/themes";
import { useTheme } from "next-themes";

import { getCustomThemeById } from "@/app/_actions/presentation/theme-actions";
import debounce from "lodash.debounce";
import { PresentationSlidesView } from "./PresentationSlidesView";
import { LoadingState } from "./Loading";
import { PresentationLayout } from "./PresentationLayout";
import { GenerationProgress } from "../editor/generation-progress";
import { type Value } from "@udecode/plate-common";
import {
  getPresentation,
  updatePresentationTheme,
} from "@/app/_actions/presentation/presentationActions";
import { type PlateNode, type PlateSlide } from "../utils/parser";
import { type ImageModelList } from "@/app/_actions/image/generate";
import { ImageUploadNotification } from "./ImageUploadNotification";

export default function PresentationPage() {
  const params = useParams();
  const id = params.id as string;
  const { resolvedTheme } = useTheme();
  const [shouldFetchData, setShouldFetchData] = useState(true);
  const {
    setCurrentPresentation,
    setPresentationInput,
    setOutline,
    setSlides,
    isGeneratingPresentation,
    setTheme,
    setImageModel,
    setPresentationStyle,
    setLanguage,
    theme,
  } = usePresentationState();

  useEffect(() => {
    if (isGeneratingPresentation) {
      setShouldFetchData(false);
    } else {
      // If generation is no longer in progress, allow fetching data again
      // Add a small delay to ensure all saves are complete
      const timer = setTimeout(() => {
        setShouldFetchData(true);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isGeneratingPresentation]);

  // Use React Query to fetch presentation data
  const { data: presentationData, isLoading } = useQuery({
    queryKey: ["presentation", id],
    queryFn: async () => {
      const result = await getPresentation(id);
      if (!result.success) {
        throw new Error(result.message ?? "Failed to load presentation");
      }
      return result.presentation;
    },
    enabled: !!id && !isGeneratingPresentation && shouldFetchData,
  });

  // Handle slide content changes
  const handleSlideChange = useCallback((value: Value, slideIndex: number) => {
    const { slides, isGeneratingPresentation, isPresenting } =
      usePresentationState.getState();

    if (isGeneratingPresentation || isPresenting) return;

    const updatedSlides = [...slides];
    // Make sure we have the slide at that index
    if (updatedSlides[slideIndex]) {
      // Update the content of the slide
      updatedSlides[slideIndex] = {
        ...updatedSlides[slideIndex],
        content: value as PlateNode[],
      };

      // Update the global state
      setSlides(updatedSlides);
    }
  }, []);

  // Create a debounced function to update the theme in the database
  const debouncedThemeUpdate = useCallback(
    debounce((presentationId: string, newTheme: string) => {
      console.log("[DIAGNOSTIC] Main.tsx debouncedThemeUpdate: Updating theme in database:", newTheme);
      console.log("[DIAGNOSTIC] Main.tsx debouncedThemeUpdate: Current state theme:", usePresentationState.getState().theme);
      updatePresentationTheme(presentationId, newTheme)
        .then((result) => {
          if (result.success) {
            console.log("[DIAGNOSTIC] Main.tsx debouncedThemeUpdate: Theme updated in database successfully");
          } else {
            console.error("[DIAGNOSTIC] Main.tsx debouncedThemeUpdate: Failed to update theme:", result.message);
          }
        })
        .catch((error) => {
          console.error("[DIAGNOSTIC] Main.tsx debouncedThemeUpdate: Error updating theme:", error);
        });
    }, 600),
    []
  );

  // Update presentation state when data is fetched
  useEffect(() => {
    // Skip if we're coming from the generation page
    if (isGeneratingPresentation || !shouldFetchData) {
      console.log("[DIAGNOSTIC] Main.tsx useEffect: Skipping due to generation state", {
        isGeneratingPresentation,
        shouldFetchData,
      });
      return;
    }

    if (presentationData) {
      console.log("[DIAGNOSTIC] Main.tsx useEffect: Loading complete presentation data:", presentationData);
      console.log("[DIAGNOSTIC] Main.tsx useEffect: Theme from DB:", presentationData.presentation?.theme);
      console.log("[DIAGNOSTIC] Main.tsx useEffect: Current state theme:", usePresentationState.getState().theme);
      
      setCurrentPresentation(presentationData.id, presentationData.title);
      setPresentationInput(presentationData.title);

      // Load all content from the database
      const presentationContent = presentationData.presentation?.content as {
        slides: PlateSlide[];
      };

      // Set slides only if we have slides data
      // Don't overwrite if we already have slides (from generation) with image URLs
      const currentSlides = usePresentationState.getState().slides;
      console.log("[DIAGNOSTIC] Main.tsx useEffect: Slide count from DB:", presentationContent?.slides?.length);
      console.log("[DIAGNOSTIC] Main.tsx useEffect: Current slides count:", currentSlides?.length);
      
      if (presentationContent?.slides && presentationContent.slides.length > 0) {
        // Log image data for each slide
        presentationContent.slides.forEach((slide, index) => {
          console.log(`[DIAGNOSTIC] Main.tsx useEffect: Slide ${index + 1} - rootImage:`, slide.rootImage);
          // Check for IMG elements in content
          const imgElements = slide.content?.filter((el: any) => el.type === "img") || [];
          imgElements.forEach((img: any, imgIdx: number) => {
            console.log(`[DIAGNOSTIC] Main.tsx useEffect: Slide ${index + 1} - IMG element ${imgIdx + 1}:`, {
              url: img.url,
              query: img.query,
            });
          });
        });
        
        // CRITICAL FIX: Don't overwrite slides if current slides have image URLs that DB slides don't
        // This prevents losing image data during the race condition between generation and DB fetch
        if (currentSlides && currentSlides.length > 0) {
          // Check if any current slide has images that DB slide doesn't
          const hasImageDataLoss = currentSlides.some((currentSlide, index) => {
            const dbSlide = presentationContent.slides[index];
            if (!dbSlide) return false;
            
            // Check rootImage URLs
            const currentHasRootImageUrl = currentSlide.rootImage?.url;
            const dbHasRootImageUrl = dbSlide.rootImage?.url;
            
            // If current has URL but DB doesn't, we'd lose data
            if (currentHasRootImageUrl && !dbHasRootImageUrl) {
              console.log(`[DIAGNOSTIC] Main.tsx useEffect: Slide ${index + 1} has rootImage URL in state but not in DB - preserving state`);
              return true;
            }
            
            // Check IMG elements in content
            const currentImgElements = currentSlide.content?.filter((el: any) => el.type === "img") || [];
            const dbImgElements = dbSlide.content?.filter((el: any) => el.type === "img") || [];
            
            // If current has IMG with URL but DB doesn't, we'd lose data
            for (const currentImg of currentImgElements) {
              const dbImg = dbImgElements.find((img: any) => img.query === currentImg.query);
              if (currentImg.url && (!dbImg || !dbImg.url)) {
                console.log(`[DIAGNOSTIC] Main.tsx useEffect: Slide ${index + 1} has IMG URL in state but not in DB - preserving state`);
                return true;
              }
            }
            
            return false;
          });
          
          if (hasImageDataLoss) {
            console.log("[DIAGNOSTIC] Main.tsx useEffect: Potential image data loss detected - preserving current slides state entirely");
            // Don't overwrite slides if we'd lose image data - preserve current state
            // The images will eventually sync when the next DB save happens with the full data
            // This prevents a race condition where DB fetch happens before images are saved
            // Skip setSlides - preserve current state, but continue with other properties below
          } else {
            // Safe to update - no image data loss
            setSlides(presentationContent.slides);
          }
        } else {
          // No current slides, safe to set from DB
          setSlides(presentationContent.slides);
        }
      } else if (!currentSlides || currentSlides.length === 0) {
        // Only set empty slides if we don't have any slides yet
        setSlides([]);
      }

      // Set outline
      if (presentationData.presentation?.outline) {
        setOutline(presentationData.presentation.outline);
      }

      // Set theme if available
      if (presentationData?.presentation?.theme) {
        const themeId = presentationData.presentation.theme;
        console.log("[DIAGNOSTIC] Main.tsx useEffect: Processing theme from DB:", themeId);

        // IMPORTANT: If theme is "default", skip processing to avoid fallback to "mystique"
        // "default" is not a valid theme - it means the presentation hasn't been assigned a theme yet
        // We should preserve the current theme state instead of overwriting it
        if (themeId === "default") {
          console.log("[DIAGNOSTIC] Main.tsx useEffect: Theme is 'default', preserving current theme state to avoid overwrite");
          // Don't change the theme - preserve what's already in state
          // Continue to set other properties below
        } else {
          // Check if this is a predefined theme
          if (themeId in themes) {
            // Use predefined theme
            console.log("[DIAGNOSTIC] Main.tsx useEffect: Theme is predefined, setting to:", themeId);
            setTheme(themeId as Themes);
          } else {
            // If not in predefined themes, treat as custom theme
            console.log("[DIAGNOSTIC] Main.tsx useEffect: Theme is custom, fetching custom theme:", themeId);
            void getCustomThemeById(themeId)
              .then((result) => {
                if (result.success && result.theme) {
                  // Set the theme with the custom theme data
                  const themeData = result.theme.themeData;
                  console.log("[DIAGNOSTIC] Main.tsx useEffect: Custom theme found, setting theme:", themeId);
                  setTheme(themeId, themeData as unknown as ThemeProperties);
                } else {
                  // Fallback to default theme if custom theme not found
                  // BUT: Don't save to DB - just log a warning
                  console.warn("[DIAGNOSTIC] Main.tsx useEffect: Custom theme not found:", themeId);
                  console.log("[DIAGNOSTIC] Main.tsx useEffect: Preserving current theme state instead of overwriting");
                  // DO NOT call setTheme("mystique") here - it will trigger a save to DB
                  // Instead, preserve the current theme state
                }
              })
              .catch((error) => {
                console.error("[DIAGNOSTIC] Main.tsx useEffect: Failed to load custom theme:", error);
                // DO NOT call setTheme("mystique") here - it will trigger a save to DB
                // Preserve the current theme state instead
              });
          }
        }
      } else {
        console.log("[DIAGNOSTIC] Main.tsx useEffect: No theme found in presentationData");
      }

      // Set imageModel if available
      if (presentationData?.presentation?.imageModel) {
        setImageModel(
          presentationData?.presentation?.imageModel as ImageModelList
        );
      }

      // Set presentationStyle if available
      if (presentationData?.presentation?.presentationStyle) {
        setPresentationStyle(presentationData.presentation.presentationStyle);
      }

      // Set language if available
      if (presentationData.presentation?.language) {
        setLanguage(presentationData.presentation.language);
      }
    }
  }, [
    presentationData,
    isGeneratingPresentation,
    shouldFetchData,
  ]);

  // Update theme when it changes
  useEffect(() => {
    if (theme && id && !isLoading) {
      // IMPORTANT: Don't save "mystique" theme if it's a fallback from a failed custom theme load
      // Only save themes that are explicitly set by the user or are valid predefined themes
      if (typeof theme === "string" && theme === "mystique") {
        // Check if this is a valid predefined theme selection or a fallback
        // If we're currently generating, don't overwrite with fallback theme
        if (isGeneratingPresentation) {
          console.log("[DIAGNOSTIC] Main.tsx theme useEffect: Skipping mystique save during generation");
          return;
        }
      }
      
      console.log("[DIAGNOSTIC] Main.tsx theme useEffect: Theme changed, calling debounced update", {
        theme,
        id,
        isLoading,
        themeType: typeof theme,
      });
      debouncedThemeUpdate(id, theme);
    }
  }, [theme, id, debouncedThemeUpdate, isLoading, isGeneratingPresentation]);

  // Set theme variables when theme changes
  useEffect(() => {
    if (theme && resolvedTheme) {
      const state = usePresentationState.getState();

      // Check if we have custom theme data
      if (state.customThemeData) {
        setThemeVariables(state.customThemeData, resolvedTheme === "dark");
      }
      // Otherwise try to use a predefined theme
      else if (typeof theme === "string" && theme in themes) {
        const currentTheme = themes[theme as keyof typeof themes];
        if (currentTheme) {
          setThemeVariables(currentTheme, resolvedTheme === "dark");
        }
      }
    }
  }, [theme, resolvedTheme]);

  // Get the current theme data
  const currentThemeData = (() => {
    const state = usePresentationState.getState();
    if (state.customThemeData) {
      return state.customThemeData;
    }
    if (typeof theme === "string" && theme in themes) {
      return themes[theme as keyof typeof themes];
    }
    return null;
  })();

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <PresentationLayout
      isLoading={isLoading}
      themeData={currentThemeData ?? undefined}
    >
      <GenerationProgress />
      <div className="mx-auto max-w-[90%] space-y-8 p-8 pt-16">
        <div className="space-y-8">
          <PresentationSlidesView
            handleSlideChange={handleSlideChange}
            isGeneratingPresentation={isGeneratingPresentation}
          />
        </div>
      </div>
      <ImageUploadNotification />
    </PresentationLayout>
  );
}
