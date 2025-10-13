interface Flashcard {
  question: string
  answer: string
}

interface GenerateFlashcardsRequest {
  text: string
  count: number
  language: string
  gradeLevel: string
}

interface GenerateFlashcardsResponse {
  cards: Flashcard[]
}

interface HealthResponse {
  status: string
  message?: string
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl = "/api") {
    this.baseUrl = baseUrl
  }

  async healthCheck(): Promise<HealthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/flashcards/health`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Health check error:", error)
      throw new Error("API server is not available")
    }
  }

  async generateFlashcards(text: string, count: number, language: string = 'english', gradeLevel: string = 'secondary'): Promise<GenerateFlashcardsResponse> {
    console.log("🌐 API Client: generateFlashcards called with:", {
      textLength: text.length,
      count,
      language,
      gradeLevel,
      baseUrl: this.baseUrl
    });
    
    try {
      console.log("🌐 Making API request to:", `${this.baseUrl}/flashcards/generate`);
      const response = await fetch(`${this.baseUrl}/flashcards/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, count, language, gradeLevel } as GenerateFlashcardsRequest),
      })
      
      console.log("🌐 API response status:", response.status, response.statusText);

      if (!response.ok) {
        if (response.status === 422) {
          throw new Error("Invalid input text. Please check your content and try again.")
        }
        if (response.status >= 500) {
          throw new Error("Server error. Please try again later.")
        }
        throw new Error(`Failed to generate flashcards: ${response.status}`)
      }

      const data = await response.json()
      console.log("🌐 API response data:", {
        hasCards: !!data.cards,
        cardsCount: data.cards?.length || 0,
        firstCard: data.cards?.[0]
      });

      if (!data.cards || !Array.isArray(data.cards)) {
        console.log("❌ Invalid response format from server");
        throw new Error("Invalid response format from server")
      }

      console.log("✅ API Client: Returning valid response");
      return data
    } catch (error) {
      console.error("Generate flashcards error:", error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error("Failed to generate flashcards. Please try again.")
    }
  }
}

export const apiClient = new ApiClient()

export type {
  Flashcard,
  GenerateFlashcardsRequest,
  GenerateFlashcardsResponse,
  HealthResponse,
}
