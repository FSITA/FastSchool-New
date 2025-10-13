export interface LessonPlan {
  topic: string;
  gradeLevel: string;
  mainConcept?: string;
  materials?: string;
  objectives?: string;
  outline?: string;
}

export interface LessonPlanSection {
  title: string;
  content: string;
  type: 'list' | 'table' | 'text';
}

export interface LessonPlanViewerProps {
  lessonPlan: LessonPlan;
  generatedContent: string;
  onGenerateAgain: () => void;
}
