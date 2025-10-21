export interface LLMResponse {
  success: boolean;
  mermaidCode?: string;
  error?: string;
}

export class LLMService {
  static async generateMermaidDiagram(userText: string): Promise<LLMResponse> {
    try {
      const response = await fetch('/api/diagram-generator/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error || `API Error (${response.status})`,
        };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error calling LLM API:", error);
      return {
        success: false,
        error: `Network error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }
}
