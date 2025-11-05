export interface SummaryGenerator {
  topic: string;
  gradeLevel: string;
  mainConcept?: string;
  isSpecialNeeds?: boolean;
  disabilityType?: string;
  language?: string;
}

export interface SummaryOutline {
  outlineNumber: number;
  title: string;
  content: string;
  type: 'overview' | 'content' | 'activities' | 'assessment' | 'summary';
}

export interface SummaryGeneratorViewerProps {
  summary: SummaryGenerator;
  generatedOutlines: SummaryOutline[];
  onGenerateAgain: () => void;
}

export interface SummaryGeneratorFormContainerProps {
  onLoadingStateChange?: (isLoading: boolean) => void;
}

export interface SummaryTitleFormProps {
  onSubmit: (title: string) => void;
  isLoading: boolean;
  isExtracting?: boolean;
  universalFormData: FormData | null;
}

export interface StreamingResponse {
  type: 'outline' | 'progress' | 'complete' | 'error';
  outline?: SummaryOutline;
  progress?: {
    currentOutline: number;
    totalOutlines: number;
    percentage: number;
  };
  error?: string;
}

