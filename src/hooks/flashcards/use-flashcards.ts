"use client"

import { useState } from "react"
import { apiClient, type Flashcard } from "@/lib/flashcards/api-client"

interface UseFlashcardsReturn {
  flashcards: Flashcard[]
  isLoading: boolean
  error: string | null
  generateFlashcards: (text: string, count: number, language?: string, gradeLevel?: string) => Promise<void>
  clearFlashcards: () => void
  clearError: () => void
}

export function useFlashcards(): UseFlashcardsReturn {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateFlashcards = async (text: string, count: number, language: string = 'english', gradeLevel: string = 'secondary') => {
    console.log("🎯 useFlashcards.generateFlashcards called with:", {
      textLength: text.length,
      count,
      language,
      gradeLevel,
      textPreview: text.substring(0, 100) + "..."
    });

    if (!text.trim()) {
      console.log("❌ No text provided");
      setError("Please enter some text to generate flashcards.")
      return
    }

    console.log("🔄 Setting loading state to true");
    setIsLoading(true)
    setError(null)

    try {
      console.log("🔄 Calling apiClient.generateFlashcards...");
      const response = await apiClient.generateFlashcards(text, count, language, gradeLevel)
      console.log("✅ API response received:", {
        cardsCount: response.cards.length,
        firstCard: response.cards[0]
      });
      setFlashcards(response.cards)
    } catch (err) {
      console.error("❌ Error in generateFlashcards:", err);
      setError(err instanceof Error ? err.message : "Failed to generate flashcards")
      setFlashcards([])
    } finally {
      console.log("🔄 Setting loading state to false");
      setIsLoading(false)
    }
  }

  const clearFlashcards = () => {
    setFlashcards([])
    setError(null)
  }

  const clearError = () => {
    setError(null)
  }

  return {
    flashcards,
    isLoading,
    error,
    generateFlashcards,
    clearFlashcards,
    clearError,
  }
}
