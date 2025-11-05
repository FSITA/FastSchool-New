import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { processUniversalFormData } from '@/lib/presentation/universal-form-processor';
import { verifyAuth } from '@/lib/auth/api-auth';
import { getDisabilityTypeById } from '@/types/accessibility';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

function getGradeLevelInstructions(gradeLevel: string): string {
  const gradeLevelMap = {
    primary: "Create a summary suitable for Primary School students. Use simple vocabulary, clear concepts, and focus on basic ideas.",
    secondary: "Create a summary suitable for Secondary School students. Include more complex concepts and key ideas.",
    high_school: "Create a summary suitable for High School students. Include advanced concepts and analytical insights.",
    university: "Create a summary suitable for University-level students. Include advanced theoretical concepts and critical analysis."
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

function getAccessibilityInstructions(disabilityType: string): string {
  const disability = getDisabilityTypeById(disabilityType);
  return disability ? disability.promptInstructions : '';
}

function enhancePromptForAccessibility(
  basePrompt: string, 
  disabilityType: string, 
  language: string
): string {
  if (!disabilityType) return basePrompt;
  
  const accessibilityInstructions = getAccessibilityInstructions(disabilityType);
  const displayLanguage = getLanguageInstructions(language);
  
  return `${basePrompt}

ACCESSIBILITY REQUIREMENTS:
This summary is specifically designed for students with: ${disabilityType.replace('_', ' ').toUpperCase()}

Please ensure the summary includes the following accessibility considerations:
${accessibilityInstructions}

CRITICAL ACCESSIBILITY FORMATTING RULES:
- Include accessibility considerations within the summary content
- Embed accessibility accommodations naturally within the material
- Do NOT create separate accessibility sections
- Make content accessible while maintaining educational value`;
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

    console.log("Starting summary generator request");
    
    // Process the universal form data
    const formData = await request.formData();
    console.log("🔍 Raw form data keys:", Array.from(formData.keys()));
    
    const { content, gradeLevel, language, isSpecialNeeds, disabilityType } = await processUniversalFormData(formData);

    console.log("Processed content:", {
      contentLength: content.length,
      gradeLevel,
      language,
      isSpecialNeeds,
      disabilityType
    });

    const gradeLevelInstructions = getGradeLevelInstructions(gradeLevel);
    const displayLanguage = getLanguageInstructions(language);
    
    // Initialize model with a strong system instruction enforcing the output language
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      systemInstruction: `You are an expert educational consultant. Always respond entirely in ${displayLanguage}. Translate any user-provided or source material into ${displayLanguage}. Do not use any other language in your response.`,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048, // Reduced for concise summaries
      }
    });

    let basePrompt = `
You are an expert educational consultant. Create a concise summary with exactly 10 outlines based on the provided content.

CONTENT TO BASE SUMMARY ON:
${content}

GRADE LEVEL: ${gradeLevel}
LANGUAGE: ${displayLanguage}

${gradeLevelInstructions}

CRITICAL FORMATTING REQUIREMENTS:
- Generate EXACTLY 10 outlines
- Each outline must start with "OUTLINE X:" where X is the number (1, 2, 3... 10)
- Each outline must have a clear, descriptive title
- Each outline content must be MAXIMUM 2 lines (short, concise)
- Use consistent formatting across all outlines
- Each outline should cover different aspects of the content
- Do not repeat content across outlines

OUTLINE STRUCTURE:
OUTLINE 1: [Title]
[Maximum 2 lines of content]

OUTLINE 2: [Title]
[Maximum 2 lines of content]

... (continue for all 10 outlines)

LANGUAGE REQUIREMENTS:
- Write the entire summary strictly in ${displayLanguage}.
- Translate any provided source content into ${displayLanguage}.
- Do not include any words, phrases, or sentences in other languages.
- Use natural, idiomatic ${displayLanguage} for headings and content.

IMPORTANT: Create exactly 10 outlines. Each outline must be clearly marked with "OUTLINE X:" header and contain maximum 2 lines of content.
`;

    // Enhance prompt with accessibility considerations if needed
    const promptText = isSpecialNeeds && disabilityType 
      ? enhancePromptForAccessibility(basePrompt, disabilityType, language)
      : basePrompt;

    console.log("Sending request to Gemini API (streaming mode)");
    const result = await model.generateContentStream(promptText);

    const stream = new ReadableStream({
      async start(controller) {
        console.log("Starting stream for summary generation");
        let buffer = '';
        
        try {
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            buffer += chunkText;
            
            // Send chunk to client
            controller.enqueue(new TextEncoder().encode(chunkText));
          }
          
          console.log("Stream completed successfully");
          controller.close();
        } catch (error) {
          console.error("Error in stream:", error);
          controller.enqueue(new TextEncoder().encode(`\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        // Keep raw text stream (client parses plain text), but reduce buffering
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        // Encourage immediate flushing through proxies where applicable
        "Transfer-Encoding": "chunked",
        "X-Accel-Buffering": "no",
      },
    });

  } catch (error) {
    console.error('Error generating summary:', error);
    
    let errorMessage = 'Failed to generate summary';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

