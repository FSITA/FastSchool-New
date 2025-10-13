import { create } from "zustand";
import { QuizType } from "../../types";

interface StoreState {
  quizzes: QuizType[];
  index: number;
  selectedAnswer: string;
  totalPoints: number;
  points: number;
}

interface StoreActions extends StoreState {
  setQuizzes: (quizzes: QuizType[]) => void;
  addQuiz: (quiz: QuizType) => void;
  nextIndex: () => void;
  setSelectedAnswer: (index: string) => void;
  addPoints: () => void;
  reset: () => void;
}

const initialState = {
  quizzes: [],
  index: 0,
  selectedAnswer: "",
  points: 1,
  totalPoints: 0,
};

export const useQuizStore = create<StoreState & StoreActions>((set) => ({
  ...initialState,

  // Replace entire quizzes array at once
  setQuizzes: (quizzes) =>
    set({ quizzes, points: quizzes.length > 0 ? 100 / quizzes.length : 1 }),

  // Append a single quiz (used for streaming)
  addQuiz: (quiz) =>
    set((state) => ({
      quizzes: [...state.quizzes, quiz],
      points: state.quizzes.length > 0 ? 100 / (state.quizzes.length + 1) : 1,
    })),

  nextIndex: () =>
    set((state) => ({
      index:
        state.index + 1 === state.quizzes.length
          ? state.index
          : state.index + 1,
      selectedAnswer: "",
    })),

  setSelectedAnswer: (selectedAnswer) => set({ selectedAnswer }),

  addPoints: () =>
    set((state) => ({ totalPoints: state.totalPoints + state.points })),

  reset: () => set({ ...initialState }),
}));
