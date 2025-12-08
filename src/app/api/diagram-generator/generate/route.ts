import { NextRequest, NextResponse } from 'next/server'
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { verifyAuth } from '@/lib/auth/api-auth'
import { env } from '@/env'
import { processUniversalFormData } from '@/lib/presentation/universal-form-processor'
import type { MindmapData } from '@/types/mindmap'

const MINDMAP_SYSTEM_MESSAGE = `You are a mindmap generator. 
Create a structured mindmap on the given topic.
Return a JSON structure with the following format:
{
  "root": {
    "text": "Main Topic",
    "definition": "Definition of the main topic in the context of the mindmap.",
    "children": [
      {
        "text": "Subtopic 1",
        "definition": "Definition of Subtopic 1 in the context of the main topic.",
        "children": [
          {"text": "Detail 1.1", "definition": "Definition of Detail 1.1 in the context of Subtopic 1."},
          {"text": "Detail 1.2", "definition": "Definition of Detail 1.2 in the context of Subtopic 1."}
        ]
      },
      {
        "text": "Subtopic 2",
        "definition": "Definition of Subtopic 2 in the context of the main topic.",
        "children": [
          {"text": "Detail 2.1", "definition": "Definition of Detail 2.1 in the context of Subtopic 2."},
          {"text": "Detail 2.2", "definition": "Definition of Detail 2.2 in the context of Subtopic 2."}
        ]
      }
    ]
  }
}
Each node (root, subtopic, detail) must have a 'definition' field that is concise and contextual.
Keep the structure concise and focused.
Limit to max 3 levels deep.
Use clear and concise labels.`;

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-flash-latest",
  maxOutputTokens: 2048,
  temperature: 0.3,
  apiKey: env.GEMINI_API_KEY,
});

// Language-specific instructions
const languageInstructions: Record<string, string> = {
  italian: "IMPORTANTE: Genera la mappa mentale con etichette e testo in ITALIANO. Usa termini italiani per tutti i nodi e le definizioni.",
  english: "IMPORTANT: Generate the mindmap with labels and text in ENGLISH. Use English terms for all nodes and definitions.",
  spanish: "IMPORTANTE: Genera el mapa mental con etiquetas y texto en ESPAÑOL. Usa términos españoles para todos los nodos y definiciones.",
  french: "IMPORTANT: Générez la carte mentale avec des étiquettes et du texte en FRANÇAIS. Utilisez des termes français pour tous les nœuds et définitions.",
  german: "WICHTIG: Generieren Sie die Mindmap mit Beschriftungen und Text auf DEUTSCH. Verwenden Sie deutsche Begriffe für alle Knoten und Definitionen.",
  portuguese: "IMPORTANTE: Gere o mapa mental com etiquetas e texto em PORTUGUÊS. Use termos portugueses para todos os nós e definições.",
  dutch: "BELANGRIJK: Genereer de mindmap met labels en tekst in het NEDERLANDS. Gebruik Nederlandse termen voor alle nodes en definities.",
  russian: "ВАЖНО: Создайте карту ума с метками и текстом на РУССКОМ ЯЗЫКЕ. Используйте русские термины для всех узлов и определений.",
  chinese: "重要：使用中文生成思维导图，包括标签和文本。所有节点和定义都使用中文术语。"
};

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (authResult instanceof Response) {
      return authResult;
    }
    const { user } = authResult;

    // Check if request is FormData (universal form) or JSON (legacy)
    const contentType = request.headers.get("content-type");
    let topic: string;
    let language: string = "english"; // Default language
    let context: string = "";

    if (contentType?.includes("multipart/form-data")) {
      // Handle universal form data
      const formData = await request.formData();
      const processedData = await processUniversalFormData(formData);
      topic = processedData.content;
      language = processedData.language;
      
      // Use the extracted content as context
      context = processedData.content;
      
      console.log("Processed universal form data for mindmap:", {
        contentLength: topic.length,
        gradeLevel: processedData.gradeLevel,
        language: processedData.language,
        contentPreview: topic.substring(0, 200) + "..."
      });
    } else {
      // Handle legacy JSON request
      const body = await request.json();
      topic = body.topic || body.userText || "";
      if (body.language) {
        language = body.language;
      }
      if (body.pdfText) {
        context = body.pdfText.slice(0, 8000);
      }
    }

    // Validate input
    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Topic is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    // Build system prompt with language instructions
    const languageInstruction = languageInstructions[language] || languageInstructions.english;
    let systemPrompt = `${MINDMAP_SYSTEM_MESSAGE}\n\n${languageInstruction}`;
    
    // Add context if available (from PDF or other sources)
    if (context && context.length > 0) {
      // Limit context to avoid token limits
      const limitedContext = context.slice(0, 8000);
      systemPrompt += `\n\nRelevant Context:\n${limitedContext}`;
    }

    console.log(`🌍 Using language: ${language}`);
    console.log(`📝 Generating mindmap for topic (first 200 chars): ${topic.substring(0, 200)}...`);

    const response = await llm.invoke([
      ["system", systemPrompt],
      ["human", `Generate a mindmap for: ${topic}`],
    ]);

    // Parse the response to ensure it's valid JSON with definitions at each node
    let mindmapData: MindmapData;
    try {
      const responseText = String(response.content);
      const jsonMatch =
        responseText.match(/```json\n([\s\S]*?)\n```/) ||
        responseText.match(/{[\s\S]*}/);

      const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : responseText;
      mindmapData = JSON.parse(jsonStr);
      
      // Validate the structure
      if (!mindmapData || !mindmapData.root || !mindmapData.root.text) {
        throw new Error('Invalid mindmap structure: missing root node');
      }
    } catch (parseError) {
      console.error("Failed to parse mindmap data:", parseError);
      return NextResponse.json(
        { 
          success: false,
          error: "Failed to generate valid mindmap structure",
          details: parseError instanceof Error ? parseError.message : "Unknown parsing error"
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      mindmap: mindmapData
    });

  } catch (error) {
    console.error('Generate mindmap error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate mindmap',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
