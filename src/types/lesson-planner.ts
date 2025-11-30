export interface LessonPlan {
  topic: string;
  gradeLevel: string;
  mainConcept?: string;
  materials?: string;
  objectives?: string;
  outline?: string;
  isSpecialNeeds?: boolean;
  disabilityType?: string;
  language?: string;
}

export interface LessonPlanSection {
  title: string;
  content: string;
  type: 'list' | 'table' | 'text';
}

export interface LessonPlanViewerProps {
  lessonPlan: LessonPlan;
  generatedContent: string;
  generatedSections?: LessonPlanSection[];
  onGenerateAgain: () => void;
}

export interface TimelineRow {
  duration: string;
  activity: string;
  instructions: string;
  teacherNotes: string;
}

export interface TimelineParseResult {
  success: boolean;
  rows: TimelineRow[];
  error?: string;
  fallbackContent?: string;
}
