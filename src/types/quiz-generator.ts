// Quiz metadata interface
export interface QuizGenerator {
  topic: string;
  gradeLevel: string;
  mainConcept?: string;
  language?: string;
  numberOfQuizzes: number;
}

// Single quiz question interface
export interface QuizQuestion {
  questionNumber: number;
  question: string;
  options: string[]; // Exactly 4 options
  correctAnswer: number; // Index of correct option (0-3)
  correctAnswerText: string; // The actual correct option text
}

// Complete quiz interface
export interface Quiz {
  quizNumber: number;
  questions: QuizQuestion[];
}

// Props for components
export interface QuizGeneratorViewerProps {
  quiz: QuizGenerator;
  generatedQuizzes: Quiz[];
  onGenerateAgain: () => void;
}

export interface QuizTitleFormProps {
  onSubmit: (title: string, numberOfQuizzes: number) => void;
  isLoading: boolean;
  isExtracting?: boolean;
  universalFormData: FormData | null;
}

export interface StreamingResponse {
  type: 'question' | 'progress' | 'complete' | 'error';
  question?: QuizQuestion;
  progress?: {
    currentQuiz: number;
    totalQuizzes: number;
    percentage: number;
  };
  error?: string;
}

