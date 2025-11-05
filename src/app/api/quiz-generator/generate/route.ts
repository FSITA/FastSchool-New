import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { processUniversalFormData } from '@/lib/presentation/universal-form-processor';
import { verifyAuth } from '@/lib/auth/api-auth';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

function getGradeLevelInstructions(gradeLevel: string): string {
  const gradeLevelMap = {
    primary: "Create quiz questions suitable for Primary School students. Use simple vocabulary, straightforward questions, and focus on basic concepts. Questions should be clear and age-appropriate.",
    secondary: "Create quiz questions suitable for Secondary School students. Include moderate complexity, analytical thinking, and conceptual understanding.",
    high_school: "Create quiz questions suitable for High School students. Include advanced concepts, critical thinking, and application-based questions.",
    university: "Create quiz questions suitable for University-level students. Include advanced theoretical concepts, deep analysis, and synthesis questions."
  };

  return gradeLevelMap[gradeLevel as keyof typeof gradeLevelMap] || gradeLevelMap.secondary;
}

function getLanguageInstructions(language: string): string {
  const languageMap = {
    italian: "Italian (Italiano)",
    english: "English",
    spanish: "Spanish (Español)",
    french: "French (Français)",
    german: "German (Deutsch)",
    portuguese: "Portuguese (Português)",
    dutch: "Dutch (Nederlands)",
    russian: "Russian (Pусский)",
    chinese: "Chinese (Simplified – 中文, 汉语)"
  };

  return languageMap[language as keyof typeof languageMap] || "English";
}

function getQuizCountInstructions(quizCount: number): string {
  if (quizCount === 1) {
    return `
SINGLE QUIZ INSTRUCTIONS:
- Create a focused, comprehensive quiz
- Ensure all questions are well-structured
- Cover key concepts from the content
- Maintain consistent difficulty level
`;
  } else if (quizCount <= 5) {
    return `
SMALL QUIZ SET INSTRUCTIONS (${quizCount} quizzes):
- Distribute questions evenly across quizzes
- Each quiz should cover different aspects of the content
- Maintain variety in question types
- Ensure comprehensive coverage
`;
  } else if (quizCount <= 15) {
    return `
MEDIUM QUIZ SET INSTRUCTIONS (${quizCount} quizzes):
- Create diverse quiz sets covering different topics
- Include variety in question complexity
- Ensure each quiz is well-balanced
- Cover comprehensive range of content
`;
  } else {
    return `
EXTENSIVE QUIZ SET INSTRUCTIONS (${quizCount} quizzes):
- Create comprehensive quiz coverage
- Distribute questions across different topics and difficulty levels
- Include variety in question types (factual, conceptual, analytical)
- Ensure thorough content coverage
`;
  }
}

export async function POST(request: NextRequest) {
  if (request.method !== 'POST') {
    return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
  }

  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (authResult instanceof Response) {
      return authResult;
    }
    const { user } = authResult;

    console.log("Starting quiz generator request");
    
    // Process the universal form data
    const formData = await request.formData();
    console.log("🔍 Raw form data keys:", Array.from(formData.keys()));
    
    const { content, gradeLevel, language } = await processUniversalFormData(formData);
    const numberOfQuizzes = parseInt(formData.get('numberOfQuizzes')?.toString() || '1');

    // Validate number of quizzes
    if (isNaN(numberOfQuizzes) || numberOfQuizzes < 1 || numberOfQuizzes > 50) {
      console.error('Invalid number of quizzes:', numberOfQuizzes);
      return NextResponse.json({ 
        message: 'Invalid number of quizzes. Must be between 1 and 50.' 
      }, { status: 400 });
    }

    // Validate content exists
    if (!content || content.trim().length === 0) {
      console.error('No content provided for quiz generation');
      return NextResponse.json({ 
        message: 'No content provided. Please provide text, file, YouTube URL, or Wikipedia link.' 
      }, { status: 400 });
    }

    // Validate API key
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not configured');
      return NextResponse.json({ 
        message: 'API key not configured. Please contact administrator.' 
      }, { status: 500 });
    }

    console.log("Processed content:", {
      contentLength: content.length,
      gradeLevel,
      language,
      numberOfQuizzes
    });

    const gradeLevelInstructions = getGradeLevelInstructions(gradeLevel);
    const displayLanguage = getLanguageInstructions(language);
    
    // Each quiz should have exactly 1 question
    const totalQuestions = numberOfQuizzes;
    
    // Initialize model with strong system instruction enforcing the output language
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      systemInstruction: `You are an expert educational consultant. Always respond entirely in ${displayLanguage}. Translate any user-provided or source material into ${displayLanguage}. Do not use any other language in your response.`,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    });

    const quizCountInstructions = getQuizCountInstructions(numberOfQuizzes);

    let basePrompt = `
You are an expert educational consultant. Create ${totalQuestions} quiz questions (distributed across ${numberOfQuizzes} quizzes) based on the provided content.

CONTENT TO BASE QUIZ ON:
${content.substring(0, 8000)}${content.length > 8000 ? '...[content truncated]' : ''}

GRADE LEVEL: ${gradeLevel}
LANGUAGE: ${displayLanguage}
NUMBER OF QUIZZES: ${numberOfQuizzes}
IMPORTANT: Each quiz must have exactly 1 question. So you will create exactly ${numberOfQuizzes} questions total.

${gradeLevelInstructions}

${quizCountInstructions}

CRITICAL FORMATTING REQUIREMENTS:
- DO NOT use "PAGE" markers or page numbers. Only use question numbers.
- Each question must start with "QUESTION X:" where X is the question number (1, 2, 3, etc.) - numbering should be continuous from 1 to ${totalQuestions}
- Each question must have exactly 4 multiple choice options
- Options must be labeled as A), B), C), D)
- Each option MUST contain actual meaningful text, NOT placeholder text like "Option 1", "Option 2", "Option 3", "Option 4"
- Write complete, meaningful option text for each choice
- Mark the correct answer with "CORRECT:" prefix or "✓" symbol or "✅" emoji
- Format example:
  QUESTION 1: [Question text here]
  A) [Complete meaningful option text - NOT "Option 1"]
  B) [Complete meaningful option text - NOT "Option 2"] ✓
  C) [Complete meaningful option text - NOT "Option 3"]
  D) [Complete meaningful option text - NOT "Option 4"]
  
  QUESTION 2: [Question text here]
  A) [Complete meaningful option text]
  B) [Complete meaningful option text]
  C) [Complete meaningful option text]
  D) [Complete meaningful option text]
  CORRECT: C

IMPORTANT RULES:
- DO NOT create pages or page breaks. Only create questions numbered sequentially from 1 to ${totalQuestions}.
- DO NOT use "PAGE X:" or any page-related markers.
- Create exactly ${totalQuestions} questions total, numbered QUESTION 1, QUESTION 2, QUESTION 3... up to QUESTION ${totalQuestions}
- CRITICAL: Each option MUST contain actual meaningful text. NEVER write "Option 1", "Option 2", "Option 3", "Option 4" as option text.
- Each option must be a complete, meaningful sentence or phrase that answers or relates to the question
- Ensure questions test understanding of key concepts from the content
- Make incorrect options plausible distractors (not obviously wrong)
- Vary question types: factual recall, conceptual understanding, application, analysis
- The correct answer MUST be randomly positioned (A, B, C, or D should be correct randomly across all questions)
- Each question must have exactly 4 options - no more, no less
- Questions should be clear and unambiguous
- Avoid trick questions unless appropriate for grade level

LANGUAGE REQUIREMENTS:
- Write the entire quiz strictly in ${displayLanguage}.
- Translate any provided source content into ${displayLanguage}.
- Do not include any words, phrases, or sentences in other languages.
- Use natural, idiomatic ${displayLanguage} for all questions and options.

CRITICAL: Create exactly ${totalQuestions} questions (1 question per quiz, so ${numberOfQuizzes} total questions). Number them sequentially from QUESTION 1 to QUESTION ${totalQuestions}. NO PAGES. NO QUIZ GROUPINGS. Just sequential questions numbered 1 to ${totalQuestions}. Each question must have exactly 4 options. Each correct answer must be clearly marked.
`;

    console.log("Sending request to Gemini API (streaming mode)");
    const result = await model.generateContentStream(basePrompt);

    const stream = new ReadableStream({
      async start(controller) {
        console.log("Starting stream for quiz generation");
        let buffer = '';
        let errorOccurred = false;
        
        try {
          for await (const chunk of result.stream) {
            try {
              const chunkText = chunk.text();
              if (chunkText && chunkText.length > 0) {
                buffer += chunkText;
                
                // Send chunk to client immediately
                controller.enqueue(new TextEncoder().encode(chunkText));
              }
            } catch (chunkError) {
              console.error("Error processing chunk:", chunkError);
              // Continue with next chunk
            }
          }
          
          // Validate we got some content
          if (buffer.trim().length === 0) {
            throw new Error('No content generated from AI');
          }
          
          console.log("Stream completed successfully, total length:", buffer.length);
          controller.close();
        } catch (error) {
          errorOccurred = true;
          console.error("Error in stream:", error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          try {
            controller.enqueue(new TextEncoder().encode(`\n\nError: ${errorMessage}`));
          } catch (enqueueError) {
            console.error("Error enqueueing error message:", enqueueError);
          }
          
          try {
            controller.close();
          } catch (closeError) {
            console.error("Error closing controller:", closeError);
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Transfer-Encoding": "chunked",
        "X-Accel-Buffering": "no",
      },
    });

  } catch (error) {
    console.error('Error generating quiz:', error);
    
    let errorMessage = 'Failed to generate quiz';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

