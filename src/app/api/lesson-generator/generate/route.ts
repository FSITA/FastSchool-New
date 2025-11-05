import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { processUniversalFormData } from '@/lib/presentation/universal-form-processor';
import { verifyAuth } from '@/lib/auth/api-auth';
import { getDisabilityTypeById } from '@/types/accessibility';
import { PageGenerationConfig } from '@/types/lesson-generator';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

function getGradeLevelInstructions(gradeLevel: string): string {
  const gradeLevelMap = {
    primary: "Create a lesson suitable for Primary School students. Use simple vocabulary, clear instructions, and focus on basic concepts. Include hands-on activities and visual aids.",
    secondary: "Create a lesson suitable for Secondary School students. Include more complex concepts, group activities, and critical thinking exercises.",
    high_school: "Create a lesson suitable for High School students. Include advanced concepts, analytical thinking, and preparation for higher education.",
    university: "Create a lesson suitable for University-level students. Include advanced theoretical concepts, research components, and critical analysis."
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
This lesson is specifically designed for students with: ${disabilityType.replace('_', ' ').toUpperCase()}

Please ensure the lesson includes the following accessibility considerations:
${accessibilityInstructions}

CRITICAL ACCESSIBILITY FORMATTING RULES:
- Include accessibility considerations within the lesson content
- Embed accessibility accommodations naturally within the material
- Do NOT create separate accessibility sections
- Make content accessible while maintaining educational value`;
}

function getPageCountInstructions(pageCount: number): string {
  if (pageCount === 1) {
    return `
SINGLE PAGE INSTRUCTIONS:
- Create a concise, comprehensive lesson overview
- Use simple paragraph format
- Avoid complex tables or extensive bullet points
- Focus on essential information only
- Keep content focused and direct
- Use clear, readable formatting
`;
  } else if (pageCount <= 3) {
    return `
SHORT LESSON INSTRUCTIONS (${pageCount} pages):
- Use clear section headers for each page
- Include some bullet points for key concepts
- Add simple tables if beneficial
- Balance text and structured content
- Each page should have a clear purpose
- Use consistent formatting across pages
`;
  } else if (pageCount <= 8) {
    return `
MEDIUM LESSON INSTRUCTIONS (${pageCount} pages):
- Use diverse content types (paragraphs, lists, tables)
- Include detailed activities and examples
- Add assessment sections
- Use clear visual hierarchy
- Each page should build upon previous content
- Include variety in content presentation
`;
  } else {
    return `
EXTENSIVE LESSON INSTRUCTIONS (${pageCount} pages):
- Use rich content variety (tables, lists, examples, case studies)
- Include multiple activity types
- Add comprehensive assessment methods
- Include extension activities and resources
- Use detailed explanations and examples
- Create a comprehensive learning experience
- Each page should have substantial, valuable content
`;
  }
}

function getPageStructure(pageCount: number): string[] {
  if (pageCount === 1) {
    return ['overview'];
  } else if (pageCount <= 3) {
    return ['overview', 'content', 'activities'];
  } else if (pageCount <= 6) {
    return ['overview', 'content', 'content', 'activities', 'assessment', 'summary'];
  } else {
    const structure = ['overview'];
    const contentPages = Math.ceil((pageCount - 3) * 0.6);
    const activityPages = Math.ceil((pageCount - 3) * 0.3);
    
    for (let i = 0; i < contentPages; i++) {
      structure.push('content');
    }
    for (let i = 0; i < activityPages; i++) {
      structure.push('activities');
    }
    structure.push('assessment');
    structure.push('summary');
    
    return structure.slice(0, pageCount);
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

    console.log("Starting lesson generator request");
    
    // Process the universal form data
    const formData = await request.formData();
    console.log("🔍 Raw form data keys:", Array.from(formData.keys()));
    
    const { content, gradeLevel, language, isSpecialNeeds, disabilityType } = await processUniversalFormData(formData);
    const numberOfPages = parseInt(formData.get('numberOfPages')?.toString() || '1');

    console.log("Processed content:", {
      contentLength: content.length,
      gradeLevel,
      language,
      isSpecialNeeds,
      disabilityType,
      numberOfPages
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
        maxOutputTokens: 8192, // Increased for multi-page content
      }
    });
    const pageCountInstructions = getPageCountInstructions(numberOfPages);
    const pageStructure = getPageStructure(numberOfPages);

    let basePrompt = `
You are an expert educational consultant. Create a comprehensive ${numberOfPages}-page lesson based on the provided content.

CONTENT TO BASE LESSON ON:
${content}

GRADE LEVEL: ${gradeLevel}
LANGUAGE: ${displayLanguage}
NUMBER OF PAGES: ${numberOfPages}

${gradeLevelInstructions}

${pageCountInstructions}

PAGE STRUCTURE GUIDANCE:
The lesson should follow this structure: ${pageStructure.join(' → ')}

CRITICAL FORMATTING REQUIREMENTS:
- Each page must start with "PAGE X:" where X is the page number (1, 2, 3, etc.)
- Each page should have a clear, descriptive title
- Use consistent formatting across all pages
- Ensure each page has substantial, valuable content
- Do not repeat content across pages
- Each page should build upon previous content
- Use appropriate content types for each page (text, lists, tables, activities)

LANGUAGE REQUIREMENTS:
- Write the entire lesson strictly in ${displayLanguage}.
- Translate any provided source content into ${displayLanguage}.
- Do not include any words, phrases, or sentences in other languages.
- Use natural, idiomatic ${displayLanguage} for headings, lists, tables, and body text.

PAGE CONTENT GUIDELINES:
- Overview pages: Introduction, objectives, key concepts
- Content pages: Detailed explanations, examples, concepts
- Activity pages: Hands-on activities, exercises, practice
- Assessment pages: Questions, evaluations, tests
- Summary pages: Key takeaways, review, conclusions

IMPORTANT: Create exactly ${numberOfPages} pages. Each page should be clearly marked with "PAGE X:" header and contain substantial, educational content.
`;

    // Enhance prompt with accessibility considerations if needed
    const promptText = isSpecialNeeds && disabilityType 
      ? enhancePromptForAccessibility(basePrompt, disabilityType, language)
      : basePrompt;

    console.log("Sending request to Gemini API (streaming mode)");
    const result = await model.generateContentStream(promptText);

    const stream = new ReadableStream({
      async start(controller) {
        console.log("Starting stream for lesson generation");
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
    console.error('Error generating lesson:', error);
    
    let errorMessage = 'Failed to generate lesson';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
