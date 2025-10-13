import { create } from "zustand";

type StreamStatus = "idle" | "streaming" | "done" | "start" | "summary";

interface StoreState {
  status: StreamStatus;
  quizStream: string;
  universalFormData: FormData | null;
  setQuizStream: (stream: string) => void;
  setUniversalFormData: (data: FormData) => void;
}

interface StoreActions extends StoreState {
  setStatus: (status: StreamStatus) => void;
}

export const useFormStore = create<StoreState & StoreActions>((set) => ({
  status: "idle",
  quizStream: "",
  universalFormData: null,
  setQuizStream: (stream) => set({ quizStream: stream }),
  setUniversalFormData: (data) => set({ universalFormData: data }),
  setStatus: (status) => set({ status }),
}));
