export interface LessonGenerator {
  topic: string;
  gradeLevel: string;
  mainConcept?: string;
  isSpecialNeeds?: boolean;
  disabilityType?: string;
  language?: string;
  numberOfPages: number;
}

export interface LessonPage {
  pageNumber: number;
  title: string;
  content: string;
  type: 'overview' | 'content' | 'activities' | 'assessment' | 'summary';
}

export interface LessonGeneratorViewerProps {
  lesson: LessonGenerator;
  generatedPages: LessonPage[];
  onGenerateAgain: () => void;
}

export interface LessonGeneratorFormProps {
  onSubmit: (lesson: LessonGenerator) => void;
  isLoading: boolean;
}

export interface LessonTitleFormProps {
  onSubmit: (title: string, numberOfPages: number, isSpecialNeeds: boolean, disabilityType: string) => void;
  isLoading: boolean;
  isExtracting?: boolean;
  universalFormData: FormData | null;
}

export interface StreamingResponse {
  type: 'page' | 'progress' | 'complete' | 'error';
  page?: LessonPage;
  progress?: {
    currentPage: number;
    totalPages: number;
    percentage: number;
  };
  error?: string;
}

export interface PageGenerationConfig {
  pageCount: number;
  gradeLevel: string;
  language: string;
  isSpecialNeeds: boolean;
  disabilityType?: string;
  content: string;
}
