import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { verifyAuth } from '@/lib/auth/api-auth'
import { env } from '@/env'

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY)

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (authResult instanceof Response) {
      return authResult;
    }
    const { user } = authResult;

    const body = await request.json()
    const { userText } = body

    // Validate input
    if (!userText || typeof userText !== 'string' || userText.trim().length === 0) {
      return NextResponse.json(
        { error: 'User text is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    })

    const systemPrompt = `You are an expert at creating Mermaid.js diagrams. Generate a Mermaid diagram based on the user's text description. 

CRITICAL RULES:
1. Return ONLY the Mermaid code without any explanations, markdown formatting, or code blocks
2. Do NOT include \`\`\`mermaid or \`\`\` in your response
3. Do NOT include --- dashes or any other decorative elements
4. Start directly with the diagram type (e.g., "graph TD", "sequenceDiagram", "classDiagram", etc.)
5. End with the last diagram element - no extra formatting
6. Choose the most appropriate diagram type for the scenario
7. Use clear, descriptive node labels
8. Make the diagram comprehensive but not overly complex
9. AVOID using parentheses () in node labels as they cause parsing errors
10. AVOID using semicolons ; at the end of lines
11. Use simple, clean node labels without special characters

EXAMPLE CORRECT FORMAT:
graph TD
A[Start] --> B{Decision}
B --> C[Option 1]
B --> D[Option 2]

Common diagram types:
- graph TD/LR: For flowcharts and process flows
- sequenceDiagram: For interactions between entities over time
- classDiagram: For object-oriented relationships
- erDiagram: For database relationships
- gitgraph: For git workflows
- journey: For user journeys
- gantt: For project timelines

Remember: Return ONLY valid Mermaid syntax, nothing else!`

    const prompt = `${systemPrompt}\n\nUser request: ${userText.trim()}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const mermaidCode = response.text().trim();

    if (!mermaidCode) {
      return NextResponse.json(
        { success: false, error: 'No diagram code received from the Gemini API' },
        { status: 500 }
      );
    }

    // Clean the response
    const cleanedCode = mermaidCode
      .replace(/```mermaid\s*/g, "")
      .replace(/```\s*/g, "")
      .replace(/^---+\s*/g, "") // Remove leading dashes
      .replace(/\s*---+$/g, "") // Remove trailing dashes
      .replace(/^[\s\n]*/, "") // Remove leading whitespace and newlines
      .replace(/[\s\n]*$/, "") // Remove trailing whitespace and newlines
      .replace(/\([^)]*\)/g, "") // Remove parentheses and their content
      .replace(/;\s*$/gm, "") // Remove semicolons at end of lines
      .trim();

    if (!cleanedCode || cleanedCode.length < 5) {
      return NextResponse.json(
        { success: false, error: 'Received empty or invalid diagram code from the Gemini API' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      mermaidCode: cleanedCode,
    });

  } catch (error) {
    console.error('Generate diagram error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate diagram',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
