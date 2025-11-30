import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { processUniversalFormData } from '@/lib/presentation/universal-form-processor';
import { verifyAuth } from '@/lib/auth/api-auth';
import { getDisabilityTypeById } from '@/types/accessibility';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

function getGradeLevelInstructions(gradeLevel: string): string {
  const gradeLevelMap = {
    primary: "Create a lesson plan suitable for Primary School students. Use simple vocabulary, clear instructions, and focus on basic concepts. Include hands-on activities and visual aids.",
    secondary: "Create a lesson plan suitable for Secondary School students. Include more complex concepts, group activities, and critical thinking exercises.",
    high_school: "Create a lesson plan suitable for High School students. Include advanced concepts, analytical thinking, and preparation for higher education.",
    university: "Create a lesson plan suitable for University-level students. Include advanced theoretical concepts, research components, and critical analysis."
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
This lesson plan is specifically designed for students with: ${disabilityType.replace('_', ' ').toUpperCase()}

Please ensure the lesson plan includes the following accessibility considerations:
${accessibilityInstructions}

CRITICAL ACCESSIBILITY FORMATTING RULES:
- Include accessibility considerations WITHIN the existing 8 sections only
- Do NOT create any additional sections for accessibility
- Embed accessibility accommodations within the appropriate existing sections
- For example, include accessibility materials in SECTION 2: MATERIALS NEEDED
- Include accessibility activities in SECTION 5: ACTIVITIES AND INSTRUCTIONS
- Include accessibility assessments in SECTION 6: ASSESSMENT METHODS
- Include accessibility strategies in SECTION 7: DIFFERENTIATION STRATEGIES
- Do NOT break content across multiple sections or create new sections
- All accessibility content must be written in ${displayLanguage} (following the language requirements above)
- IMPORTANT: If you use labels like "*Accessibility consideration:" or "*Accessibility note:" or any accessibility labels, translate ALL of these labels to ${displayLanguage}
- Do NOT include English accessibility labels - translate ALL labels and content to ${displayLanguage}
- Do NOT include English translations in parentheses or brackets - write everything only in ${displayLanguage}`;
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

    console.log("Starting lesson plan generation request");
    
    // Process the universal form data
    const formData = await request.formData();
    console.log("🔍 Raw form data keys:", Array.from(formData.keys()));
    console.log("🔍 Raw form data values:", {
      isSpecialNeeds: formData.get('isSpecialNeeds'),
      disabilityType: formData.get('disabilityType')
    });
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
    
    // STEP 3: Verify language is passed correctly (validation step)
    console.log("🌐 Language for generation:", language, "→ Display:", displayLanguage);

    // STEP 1: Add systemInstruction to model initialization
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      systemInstruction: `You are an expert educational consultant. Always respond entirely in ${displayLanguage}. Translate any user-provided or source material into ${displayLanguage}. Do not use any other language in your response. Do not include English translations in parentheses, brackets, or after colons. All labels, titles, activity names, assessment titles, section labels, and any other text must be in ${displayLanguage}. The only exception is structural section headers like "SECTION 1:", "SECTION 2:", and section titles like "LESSON OVERVIEW" which must remain in English for parsing purposes.`,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096,
      }
    });

    let basePrompt = `
    You are an expert educational consultant. Create a comprehensive lesson plan based on the provided content.

    CONTENT TO BASE LESSON PLAN ON:
    ${content}

    GRADE LEVEL: ${gradeLevel}
    LANGUAGE: ${displayLanguage}

    ${gradeLevelInstructions}

    LANGUAGE REQUIREMENTS (CRITICAL - MUST FOLLOW STRICTLY):
    - Write the ENTIRE lesson plan strictly in ${displayLanguage}. This includes ALL text: labels, titles, descriptions, lists, tables, activities, assessments, notes, everything.
    - Translate any provided source content into ${displayLanguage}.
    - Do NOT include any words, phrases, or sentences in other languages.
    - Do NOT include English translations in parentheses, brackets, or after colons.
    - Use natural, idiomatic ${displayLanguage} for ALL content.
    - IMPORTANT EXCEPTION: Only the section headers like "SECTION 1:", "SECTION 2:", etc. and section titles like "LESSON OVERVIEW", "MATERIALS NEEDED", etc. must remain in English (these are structural markers required for parsing).
    - ALL other text must be in ${displayLanguage}, including:
      * All labels within sections (like "Topic/Title:", "Duration:", "Grade Level:", "Main Learning Objectives:", "Activity 1:", "Activity 2:", "Formative Assessment:", "Summative Assessment:", "Preparation requirements:", "Safety considerations:", etc.) - translate ALL of these to ${displayLanguage}
      * All content descriptions, bullet points, timeline entries, activity names, assessment titles, notes, requirements, considerations
      * All text in tables, lists, and any other format
      * No English text should appear except for the structural section headers mentioned above

    Create a detailed lesson plan with EXACTLY these 8 sections. Use the EXACT section headers provided below. Do not create any additional sections or modify the section titles.

    CRITICAL SECTION FORMATTING RULES:
    - Use EXACTLY these section headers: SECTION 1:, SECTION 2:, etc.
    - Do NOT create any additional sections beyond these 8
    - Do NOT embed accessibility content as separate sections
    - Include accessibility considerations WITHIN the appropriate existing sections
    - Each section must start with its exact header followed by a colon

    SECTION 1: LESSON OVERVIEW
    Include the following information (NOTE: All labels and content below are FORMAT EXAMPLES only - translate ALL labels and content to ${displayLanguage}):
    • Topic/Title (translate this label and provide the actual title in ${displayLanguage})
    • Duration (translate this label and provide duration in ${displayLanguage})
    • Grade Level (translate this label and provide grade level in ${displayLanguage})
    • Main Learning Objectives (translate this label and provide objectives in ${displayLanguage})

    SECTION 2: MATERIALS NEEDED
    List each material on a new line (NOTE: All materials must be listed in ${displayLanguage}, no English translations):
    • List each material in ${displayLanguage}
    • Include all necessary supplies
    • Specify any technology requirements
    (IMPORTANT: Do NOT include English translations. Write everything only in ${displayLanguage})

    SECTION 3: LEARNING OBJECTIVES
    List each objective on a new line in ${displayLanguage}:
    • Each objective must be written entirely in ${displayLanguage}
    • Include both cognitive and practical objectives
    • Ensure objectives are measurable and aligned with the content
    (IMPORTANT: No English text should appear)

    SECTION 4: LESSON TIMELINE
    Create a detailed timeline using EXACTLY this format (NOTE: The example below shows FORMAT only - write ALL content in ${displayLanguage}):

    [Example format structure - translate all column headers and content to ${displayLanguage}]
    Duration | Activity | Instructions | Teacher Notes
    5 min | Warm-up | Greet students, review previous lesson | Ensure all students are present
    15 min | Introduction | Present new concept with examples | Use visual aids, check understanding
    20 min | Main Activity | Students work in groups on problem | Monitor groups, provide support
    10 min | Assessment | Quick quiz or discussion | Collect feedback, note areas for review

    CRITICAL TIMELINE FORMATTING AND LANGUAGE REQUIREMENTS:
    - Use pipe (|) separators between columns
    - Each row must have exactly 4 columns
    - Duration should be in format "X min" or "X minutes" (or equivalent in ${displayLanguage})
    - ALL column headers (Duration, Activity, Instructions, Teacher Notes) must be translated to ${displayLanguage}
    - ALL content in each row must be in ${displayLanguage}
    - Do not use bullet points, dashes, or other formatting
    - Include at least 4-6 timeline entries
    - Do not include header row in the timeline data (write headers in ${displayLanguage} but don't include the example header row)
    - Each row should be on a new line
    - Ensure proper spacing around pipe separators
    - NO English text should appear in the timeline table except for structural formatting

    SECTION 5: ACTIVITIES AND INSTRUCTIONS
    Provide detailed activities in ${displayLanguage} (NOTE: All activity labels like "Activity 1:", "Activity 2:", etc. must be translated to ${displayLanguage}):
    • Write activity titles and labels in ${displayLanguage} (e.g., if using "Activity 1:", translate it to ${displayLanguage})
    • Detailed step-by-step activities in ${displayLanguage}
    • Clear instructions for each activity in ${displayLanguage}
    • Engagement strategies in ${displayLanguage}
    (IMPORTANT: Do NOT use "Activity 1:", "Activity 2:" in English. Translate these labels to ${displayLanguage})

    SECTION 6: ASSESSMENT METHODS
    Describe assessment strategies in ${displayLanguage} (NOTE: Translate section labels like "Formative Assessment:", "Summative Assessment:" to ${displayLanguage}):
    • Translate all assessment section labels to ${displayLanguage} (e.g., "Formative Assessment:", "Summative Assessment:", etc.)
    • Describe assessment strategies in ${displayLanguage}
    • Include both formative and summative assessments (with translated labels)
    • Provide specific assessment criteria in ${displayLanguage}
    (IMPORTANT: Do NOT use "Formative Assessment:", "Summative Assessment:" in English. Translate ALL labels to ${displayLanguage})

    SECTION 7: DIFFERENTIATION STRATEGIES
    Provide differentiation strategies in ${displayLanguage}:
    • Write all content in ${displayLanguage}
    • Accommodations for different learning styles (in ${displayLanguage})
    • Extension activities for advanced students (in ${displayLanguage})
    • Support strategies for struggling students (in ${displayLanguage})
    (IMPORTANT: All text must be in ${displayLanguage})

    SECTION 8: ADDITIONAL NOTES
    Include additional notes in ${displayLanguage} (NOTE: Translate section labels like "Preparation requirements:", "Safety considerations:" to ${displayLanguage}):
    • Translate all section labels to ${displayLanguage} (e.g., "Preparation requirements:" → translate to ${displayLanguage}, "Safety considerations:" → translate to ${displayLanguage})
    • Include preparation requirements (with translated label) in ${displayLanguage}
    • List any safety considerations (with translated label) in ${displayLanguage}
    • Note any special considerations (with translated label) in ${displayLanguage}
    (IMPORTANT: Do NOT use "Preparation requirements:", "Safety considerations:" in English. Translate ALL labels and content to ${displayLanguage})

    IMPORTANT: Do not create any sections beyond these 8. Include all accessibility considerations within the appropriate existing sections. Do not break content across multiple sections.
    `;

    // Enhance prompt with accessibility considerations if needed
    const promptText = isSpecialNeeds && disabilityType 
      ? enhancePromptForAccessibility(basePrompt, disabilityType, language)
      : basePrompt;

    console.log("Sending request to Gemini API (streaming mode)");
    const result = await model.generateContentStream(promptText);

    const stream = new ReadableStream({
      async start(controller) {
        console.log("Starting stream for lesson plan generation");
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
    console.error('Error generating lesson plan:', error);
    
    let errorMessage = 'Failed to generate lesson plan';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
