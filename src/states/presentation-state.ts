import { create } from "zustand";
import { type Themes, type ThemeProperties } from "@/lib/presentation/themes";
import { type PlateSlide } from "@/components/presentation/utils/parser";
import { type ImageModelList } from "@/app/_actions/image/generate";

interface PresentationState {
  currentPresentationId: string | null;
  currentPresentationTitle: string | null;
  isGridView: boolean;
  isSheetOpen: boolean;
  numSlides: number;
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  theme: Themes | string;
  customThemeData: ThemeProperties | null;
  language: string;
  pageStyle: string;
  showTemplates: boolean;
  presentationInput: string;
  presentationStyle: string;
  savingStatus: "idle" | "saving" | "saved";
  isPresenting: boolean;
  currentSlideIndex: number;
  isThemeCreatorOpen: boolean;
  imageModel: ImageModelList;
  isImageGenerationModelOpen: boolean;

  // Universal form state
  universalFormData: FormData | null;
  formStep: number;
  gradeLevel: string;
  isFromUniversalForm: boolean;
  originalLanguage: string | null; // Language selected in universal form

  // Generation states
  shouldStartOutlineGeneration: boolean;
  shouldStartPresentationGeneration: boolean;
  isGeneratingOutline: boolean;
  isGeneratingPresentation: boolean;
  outline: string[];
  slides: PlateSlide[]; // This now holds the new object structure

  setSlides: (slides: PlateSlide[]) => void;
  setCurrentPresentation: (id: string | null, title: string | null) => void;
  setIsGridView: (isGrid: boolean) => void;
  setIsSheetOpen: (isOpen: boolean) => void;
  setNumSlides: (num: number) => void;
  setTheme: (
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    theme: Themes | string,
    customData?: ThemeProperties | null
  ) => void;
  shouldShowExitHeader: boolean;
  setShouldShowExitHeader: (udpdate: boolean) => void;
  setLanguage: (lang: string) => void;
  setPageStyle: (style: string) => void;
  setShowTemplates: (show: boolean) => void;
  setPresentationInput: (input: string) => void;
  setOutline: (topics: string[]) => void;
  setPresentationStyle: (style: string) => void;
  setSavingStatus: (status: "idle" | "saving" | "saved") => void;
  setIsPresenting: (isPresenting: boolean) => void;
  setCurrentSlideIndex: (index: number) => void;
  nextSlide: () => void;
  previousSlide: () => void;

  // Universal form actions
  setUniversalFormData: (data: FormData | null) => void;
  setFormStep: (step: number) => void;
  setGradeLevel: (level: string) => void;
  setIsFromUniversalForm: (isFrom: boolean) => void;
  setOriginalLanguage: (language: string | null) => void;

  setIsThemeCreatorOpen: (update: boolean) => void;
  setImageModel: (model: ImageModelList) => void;
  setImageGenerationModelOpen: (update: boolean) => void;
  // Generation actions
  setShouldStartOutlineGeneration: (shouldStart: boolean) => void;
  setShouldStartPresentationGeneration: (shouldStart: boolean) => void;
  setIsGeneratingOutline: (isGenerating: boolean) => void;
  setIsGeneratingPresentation: (isGenerating: boolean) => void;
  startOutlineGeneration: () => void;
  startPresentationGeneration: () => void;
  resetGeneration: () => void;

  // Selection state
  isSelecting: boolean;
  selectedPresentations: string[];
  toggleSelecting: () => void;
  selectAllPresentations: (ids: string[]) => void;
  deselectAllPresentations: () => void;
  togglePresentationSelection: (id: string) => void;
}

export const usePresentationState = create<PresentationState>((set) => ({
  currentPresentationId: null,
  currentPresentationTitle: null,
  isGridView: true,
  isSheetOpen: false,
  shouldShowExitHeader: false,
  setShouldShowExitHeader: (update) => set({ shouldShowExitHeader: update }),
  numSlides: 10,
  language: "english",
  pageStyle: "default",
  showTemplates: false,
  presentationInput: "",
  outline: [],
  theme: "mystique",
  customThemeData: null,
  presentationStyle: "professional",
  slides: [], // Now holds the new slide object structure
  savingStatus: "idle",
  isPresenting: false,
  currentSlideIndex: 0,
  imageModel: "imagen-4.0-fast-generate-001",
  isThemeCreatorOpen: false,
  isImageGenerationModelOpen: false,

  // Universal form state
  universalFormData: null,
  formStep: 0,
  gradeLevel: "secondary",
  isFromUniversalForm: false,
  originalLanguage: null,

  // Generation states
  shouldStartOutlineGeneration: false,
  shouldStartPresentationGeneration: false,
  isGeneratingOutline: false,
  isGeneratingPresentation: false,

  setSlides: (slides) => {
    set({ slides });
  },
  setCurrentPresentation: (id, title) =>
    set({ currentPresentationId: id, currentPresentationTitle: title }),
  setIsGridView: (isGrid) => set({ isGridView: isGrid }),
  setIsSheetOpen: (isOpen) => set({ isSheetOpen: isOpen }),
  setNumSlides: (num) => set({ numSlides: num }),
  setLanguage: (lang) => set({ language: lang }),
  setTheme: (theme, customData = null) => {
    // Use setTimeout to debounce theme changes and prevent DOM conflicts
    setTimeout(() => {
      set({
        theme: theme,
        customThemeData: customData,
      });
    }, 0);
  },
  setPageStyle: (style) => set({ pageStyle: style }),
  setShowTemplates: (show) => set({ showTemplates: show }),
  setPresentationInput: (input) => set({ presentationInput: input }),
  setOutline: (topics) => set({ outline: topics }),
  setPresentationStyle: (style) => set({ presentationStyle: style }),
  setSavingStatus: (status) => set({ savingStatus: status }),
  setIsPresenting: (isPresenting) => set({ isPresenting }),
  setCurrentSlideIndex: (index) => set({ currentSlideIndex: index }),
  nextSlide: () =>
    set((state) => ({
      currentSlideIndex: Math.min(
        state.currentSlideIndex + 1,
        state.slides.length - 1
      ),
    })),
  previousSlide: () =>
    set((state) => ({
      currentSlideIndex: Math.max(state.currentSlideIndex - 1, 0),
    })),

  // Generation actions
  setShouldStartOutlineGeneration: (shouldStart) =>
    set({ shouldStartOutlineGeneration: shouldStart }),
  setShouldStartPresentationGeneration: (shouldStart) =>
    set({ shouldStartPresentationGeneration: shouldStart }),
  setIsGeneratingOutline: (isGenerating) =>
    set({ isGeneratingOutline: isGenerating }),
  setIsGeneratingPresentation: (isGenerating) =>
    set({ isGeneratingPresentation: isGenerating }),
  startOutlineGeneration: () =>
    set({
      shouldStartOutlineGeneration: true,
      isGeneratingOutline: true,
      shouldStartPresentationGeneration: false,
      isGeneratingPresentation: false,
      outline: [],
    }),
  startPresentationGeneration: () =>
    set({
      shouldStartPresentationGeneration: true,
      isGeneratingPresentation: true,
      slides: [], // Reset slides when starting a new presentation
    }),
  resetGeneration: () =>
    set({
      shouldStartOutlineGeneration: false,
      shouldStartPresentationGeneration: false,
      isGeneratingOutline: false,
      isGeneratingPresentation: false,
    }),

  setIsThemeCreatorOpen: (update) => set({ isThemeCreatorOpen: update }),
  setImageModel: (model) => set({ imageModel: model }),
  setImageGenerationModelOpen: (update) => set({ isImageGenerationModelOpen: update }),

  // Universal form actions
  setUniversalFormData: (data) => set({ universalFormData: data }),
  setFormStep: (step) => set({ formStep: step }),
  setGradeLevel: (level) => set({ gradeLevel: level }),
  setIsFromUniversalForm: (isFrom) => set({ isFromUniversalForm: isFrom }),
  setOriginalLanguage: (language) => set({ originalLanguage: language }),

  // Selection state
  isSelecting: false,
  selectedPresentations: [],
  toggleSelecting: () =>
    set((state) => ({
      isSelecting: !state.isSelecting,
      selectedPresentations: [],
    })),
  selectAllPresentations: (ids) => set({ selectedPresentations: ids }),
  deselectAllPresentations: () => set({ selectedPresentations: [] }),
  togglePresentationSelection: (id) =>
    set((state) => ({
      selectedPresentations: state.selectedPresentations.includes(id)
        ? state.selectedPresentations.filter((p) => p !== id)
        : [...state.selectedPresentations, id],
    })),
}));
