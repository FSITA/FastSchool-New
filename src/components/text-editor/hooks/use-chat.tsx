"use client";

// import { useChat as useBaseChat } from "ai/react";

export const useChat = () => {
  // return useBaseChat({
  //   id: "editor",
  //   api: "/api/ai/command",
  // });
  return {
    messages: [],
    input: "",
    setInput: (value: string) => {},
    handleInputChange: () => {},
    handleSubmit: () => {},
    isLoading: false,
  };
};
