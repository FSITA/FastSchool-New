export interface QuizType {
  id: number;
  question: string;
  description: string;
  options: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  answer: string;
  resources?: Array<{
    title: string;
    link: string;
  }>;
}
