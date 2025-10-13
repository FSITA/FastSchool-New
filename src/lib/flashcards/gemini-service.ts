import { GoogleGenerativeAI } from '@google/generative-ai'
import { env } from '@/env'

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY)

export interface Flashcard {
  question: string
  answer: string
}

export interface FlashcardsResponse {
  cards: Flashcard[]
}

export async function generateFlashcardsWithGemini(
  text: string, 
  count: number = 10,
  language: string = "english",
  gradeLevel: string = "secondary"
): Promise<FlashcardsResponse> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `
Generate exactly ${count} flashcards from the following text. IMPORTANT: Generate ALL questions and answers in ${language} language, regardless of what language the input text is in.  

Grade Level: ${gradeLevel}
- Primary School: Use simple vocabulary, basic concepts, and shorter sentences
- Secondary School: Use intermediate vocabulary and concepts
- High School: Use advanced vocabulary and complex concepts
- University Level: Use sophisticated vocabulary and detailed explanations

Input text:
${text}

Return ONLY a JSON object in the following format, with no explanation, no markdown, no code fences:

{
  "cards": [
    {"question": "Question 1", "answer": "Answer 1"},
    {"question": "Question 2", "answer": "Answer 2"},
    {"question": "Question 3", "answer": "Answer 3"},
    {"question": "Question 4", "answer": "Answer 4"},
    {"question": "Question 5", "answer": "Answer 5"}
  ]
}

Make sure:
1. ALL questions and answers are written in ${language} language
2. The complexity and vocabulary level is appropriate for ${gradeLevel} students
3. The questions are clear and the answers are comprehensive but concise
4. If the input text is in a different language, translate the content to ${language} while creating the flashcards
5. Adapt the content complexity to match the ${gradeLevel} educational level
`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const rawOutput = response.text().trim()

    try {
      // Clean the response to extract JSON
      let jsonString = rawOutput
      
      // Remove markdown code blocks if present
      if (jsonString.includes('```json')) {
        const parts = jsonString.split('```json')
        if (parts.length > 1 && parts[1]) {
          const innerParts = parts[1].split('```')
          if (innerParts.length > 0 && innerParts[0]) {
            jsonString = innerParts[0]
          }
        }
      } else if (jsonString.includes('```')) {
        const parts = jsonString.split('```')
        if (parts.length > 1 && parts[1]) {
          const innerParts = parts[1].split('```')
          if (innerParts.length > 0 && innerParts[0]) {
            jsonString = innerParts[0]
          }
        }
      }
      
      // Remove any leading/trailing whitespace
      jsonString = jsonString.trim()
      
      const parsed = JSON.parse(jsonString)
      
      // Validate the response structure
      if (!parsed.cards || !Array.isArray(parsed.cards)) {
        throw new Error('Invalid response structure')
      }
      
      // Ensure all cards have question and answer
      const validCards = parsed.cards.filter((card: any) => 
        card && 
        card.question && 
        card.answer && 
        typeof card.question === 'string' && 
        typeof card.answer === 'string'
      )
      
      if (validCards.length === 0) {
        throw new Error('No valid flashcards generated')
      }
      
      return { cards: validCards }
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError)
      console.error('Raw response:', rawOutput)
      
      // Fallback: create a single card with the raw response
      return {
        cards: [{
          question: "Error parsing AI response",
          answer: rawOutput.substring(0, 500) + (rawOutput.length > 500 ? '...' : '')
        }]
      }
    }
  } catch (error) {
    console.error('Gemini API error:', error)
    throw new Error(`Failed to generate flashcards: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
