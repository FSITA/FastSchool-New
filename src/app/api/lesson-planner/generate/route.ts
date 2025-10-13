import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { processUniversalFormData } from '@/lib/presentation/universal-form-processor';
import { verifyAuth } from '@/lib/auth/api-auth';

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
    const { content, gradeLevel, language } = await processUniversalFormData(formData);

    console.log("Processed content:", {
      contentLength: content.length,
      gradeLevel,
      language
    });

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096,
      }
    });

    const gradeLevelInstructions = getGradeLevelInstructions(gradeLevel);
    const displayLanguage = getLanguageInstructions(language);

    const promptText = `
    You are an expert educational consultant. Create a comprehensive lesson plan based on the provided content.

    CONTENT TO BASE LESSON PLAN ON:
    ${content}

    GRADE LEVEL: ${gradeLevel}
    LANGUAGE: ${displayLanguage}

    ${gradeLevelInstructions}

    Create a detailed lesson plan with the following structure. Format the response in clear sections and ensure the entire lesson plan is in ${displayLanguage}:

    SECTION 1: LESSON OVERVIEW
    • Topic/Title
    • Duration
    • Grade Level
    • Main Learning Objectives

    SECTION 2: MATERIALS NEEDED
    • List each material on a new line
    • Include all necessary supplies
    • Specify any technology requirements

    SECTION 3: LEARNING OBJECTIVES
    • List each objective on a new line
    • Include both cognitive and practical objectives
    • Ensure objectives are measurable and aligned with the content

    SECTION 4: LESSON TIMELINE
    Create a detailed timeline with these columns:
    Duration | Activity | Instructions | Teacher Notes

    SECTION 5: ACTIVITIES AND INSTRUCTIONS
    • Detailed step-by-step activities
    • Clear instructions for each activity
    • Engagement strategies

    SECTION 6: ASSESSMENT METHODS
    • Describe assessment strategies
    • Include both formative and summative assessments
    • Provide specific assessment criteria

    SECTION 7: DIFFERENTIATION STRATEGIES
    • Accommodations for different learning styles
    • Extension activities for advanced students
    • Support strategies for struggling students

    SECTION 8: ADDITIONAL NOTES
    • Include preparation requirements
    • List any safety considerations
    • Note any special considerations

    Format each section clearly and separate them with section headers. Make sure the lesson plan is comprehensive, practical, and directly related to the provided content.
    `;

    const result = await model.generateContent(promptText);
    const response = result.response.text();

    console.log("Successfully generated lesson plan");

    return NextResponse.json({ content: response });
  } catch (error) {
    console.error('Error generating lesson plan:', error);
    
    let errorMessage = 'Failed to generate lesson plan';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
