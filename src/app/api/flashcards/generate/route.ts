import { NextRequest, NextResponse } from 'next/server'
import { generateFlashcardsWithGemini } from '@/lib/flashcards/gemini-service'
import { verifyAuth } from '@/lib/auth/api-auth'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (authResult instanceof Response) {
      return authResult;
    }
    const { user } = authResult;

    const body = await request.json()
    const { text, count, language, gradeLevel } = body

    // Validate input
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    if (count && (typeof count !== 'number' || count < 1 || count > 50)) {
      return NextResponse.json(
        { error: 'Count must be a number between 1 and 50' },
        { status: 400 }
      )
    }

    const flashcardCount = count || 10
    const selectedLanguage = language || 'english'
    const selectedGradeLevel = gradeLevel || 'secondary'
    const result = await generateFlashcardsWithGemini(text.trim(), flashcardCount, selectedLanguage, selectedGradeLevel)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Generate flashcards error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to generate flashcards',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
