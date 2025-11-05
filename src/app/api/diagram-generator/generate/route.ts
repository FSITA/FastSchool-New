import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { verifyAuth } from '@/lib/auth/api-auth'
import { env } from '@/env'
import { processUniversalFormData } from '@/lib/presentation/universal-form-processor'

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY)

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
    let userText: string;
    let language: string = "english"; // Default language

    if (contentType?.includes("multipart/form-data")) {
      // Handle universal form data
      const formData = await request.formData();
      const processedData = await processUniversalFormData(formData);
      userText = processedData.content;
      language = processedData.language;
      
      console.log("Processed universal form data:", {
        contentLength: userText.length,
        gradeLevel: processedData.gradeLevel,
        language: processedData.language,
        contentPreview: userText.substring(0, 200) + "..."
      });
    } else {
      // Handle legacy JSON request
      const body = await request.json();
      userText = body.userText;
    }

    // Validate input
    if (!userText || typeof userText !== 'string' || userText.trim().length === 0) {
      return NextResponse.json(
        { error: 'User text is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    // Truncate content if too long (to avoid token limits and improve response quality)
    // Keep content focused for diagram generation - shorter content leaves more room for output
    const MAX_CONTENT_LENGTH = 2500;
    if (userText.length > MAX_CONTENT_LENGTH) {
      console.log(`⚠️ Content truncated from ${userText.length} to ${MAX_CONTENT_LENGTH} characters`);
      userText = userText.substring(0, MAX_CONTENT_LENGTH) + "...";
    }

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192, // Increased from 2048 to handle complex diagrams
      }
    })

    // Create language-specific instructions
    const languageInstructions = {
      italian: "IMPORTANTE: Genera il diagramma con etichette e testo in ITALIANO. Usa termini italiani per tutti i nodi e le connessioni.",
      english: "IMPORTANT: Generate the diagram with labels and text in ENGLISH. Use English terms for all nodes and connections.",
      spanish: "IMPORTANTE: Genera el diagrama con etiquetas y texto en ESPAÑOL. Usa términos españoles para todos los nodos y conexiones.",
      french: "IMPORTANT: Générez le diagramme avec des étiquettes et du texte en FRANÇAIS. Utilisez des termes français pour tous les nœuds et connexions.",
      german: "WICHTIG: Generieren Sie das Diagramm mit Beschriftungen und Text auf DEUTSCH. Verwenden Sie deutsche Begriffe für alle Knoten und Verbindungen.",
      portuguese: "IMPORTANTE: Gere o diagrama com etiquetas e texto em PORTUGUÊS. Use termos portugueses para todos os nós e conexões.",
      dutch: "BELANGRIJK: Genereer het diagram met labels en tekst in het NEDERLANDS. Gebruik Nederlandse termen voor alle nodes en verbindingen.",
      russian: "ВАЖНО: Создайте диаграмму с метками и текстом на РУССКОМ ЯЗЫКЕ. Используйте русские термины для всех узлов и соединений.",
      chinese: "重要：使用中文生成图表，包括标签和文本。所有节点和连接都使用中文术语。"
    };

    const languageInstruction = languageInstructions[language as keyof typeof languageInstructions] || languageInstructions.english;

    console.log(`🌍 Using language: ${language}`);
    console.log(`📝 Language instruction: ${languageInstruction}`);

    const systemPrompt = `Create a Mermaid.js diagram from the user's text. ${languageInstruction}

RULES: Return ONLY Mermaid code. No markdown, no \`\`\`mermaid, no explanations. Start with diagram type (graph TD, sequenceDiagram, etc.). Avoid parentheses in labels, avoid semicolons at line ends. Keep labels simple and clean. Use Unicode characters (Chinese, Russian, Arabic, etc.) in labels as needed for the selected language.

For Wikipedia/concepts: Create flowcharts showing main ideas and relationships.
For processes: Use flowcharts or sequence diagrams.
For people: Create timelines or relationship diagrams.

Example:
graph TD
A[Start] --> B{Decision}
B --> C[Option 1]
B --> D[Option 2]

Types: graph TD/LR, sequenceDiagram, classDiagram, erDiagram, journey, gantt.

IMPORTANT: When the language is Chinese, Russian, or other non-Latin scripts, use those characters directly in the diagram labels. Mermaid supports Unicode.`

    const prompt = `${systemPrompt}\n\nUser request: ${userText.trim()}`;
    
    console.log("📤 Sending request to Gemini API...", {
      promptLength: prompt.length,
      contentLength: userText.length,
      language: language
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    // Check for blocked content or safety filters
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      console.error("❌ No candidates in Gemini response - content may be blocked");
      return NextResponse.json(
        { success: false, error: 'Content was blocked by safety filters. Please try with different content.' },
        { status: 500 }
      );
    }

    // Check finish reason - MAX_TOKENS means partial content, which we can still use
    const finishReason = candidates[0]?.finishReason;
    
    let mermaidCode = "";
    try {
      mermaidCode = response.text().trim();
    } catch (error) {
      console.error("❌ Error extracting text from Gemini response:", error);
      // Try to get content from parts
      if (candidates[0]?.content?.parts) {
        mermaidCode = candidates[0].content.parts.map((part: any) => part.text || "").join("").trim();
      }
    }

    // Handle MAX_TOKENS - partial content is still usable
    if (finishReason === 'MAX_TOKENS') {
      console.warn("⚠️ Response hit MAX_TOKENS limit, but partial content available:", mermaidCode.length, "characters");
      // Continue processing - we'll use the partial content
      if (!mermaidCode || mermaidCode.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Response was cut off and no content was generated. Please try with shorter or simpler content.' },
          { status: 500 }
        );
      }
    } else if (finishReason && finishReason !== 'STOP') {
      // Other finish reasons (SAFETY, etc.) are errors
      console.error("❌ Content blocked or stopped:", finishReason);
      return NextResponse.json(
        { success: false, error: `Content generation stopped: ${finishReason}. Please try with different content.` },
        { status: 500 }
      );
    }

    console.log("🔍 Gemini API response:", {
      hasResponse: !!response,
      responseText: mermaidCode.substring(0, 200) + (mermaidCode.length > 200 ? "..." : ""),
      responseLength: mermaidCode.length,
      finishReason: finishReason,
      wasTruncated: finishReason === 'MAX_TOKENS'
    });

    if (!mermaidCode || mermaidCode.length === 0) {
      console.error("❌ Empty response from Gemini API");
      console.error("Full response structure:", JSON.stringify({
        finishReason,
        candidates: candidates?.length,
        hasParts: candidates?.[0]?.content?.parts?.length > 0
      }, null, 2));
      return NextResponse.json(
        { success: false, error: 'No diagram code received from the Gemini API. The model may have been blocked or encountered an error.' },
        { status: 500 }
      );
    }

    // Clean the response - be careful to preserve Unicode characters (Chinese, Russian, etc.)
    let cleanedCode = mermaidCode
      .replace(/```mermaid\s*/g, "")
      .replace(/```\s*/g, "")
      .replace(/^---+\s*/g, "") // Remove leading dashes
      .replace(/\s*---+$/g, "") // Remove trailing dashes
      .replace(/^[\s\n]*/, "") // Remove leading whitespace and newlines
      .replace(/[\s\n]*$/, "") // Remove trailing whitespace and newlines
      .replace(/;\s*$/gm, ""); // Remove semicolons at end of lines
    
    // Only remove parentheses that are OUTSIDE of square brackets (Mermaid labels)
    // This preserves parentheses inside labels like A[Label (note)]
    // But removes standalone parentheses like (comment)
    cleanedCode = cleanedCode
      .split(/\n/)
      .map(line => {
        // Don't modify lines that contain square brackets (label lines)
        if (line.includes('[') && line.includes(']')) {
          // Only remove parentheses that are outside the brackets
          const bracketMatch = line.match(/\[([^\]]*)\]/);
          if (bracketMatch) {
            // Keep the line as-is, just remove semicolons if any (already done above)
            return line;
          }
        }
        // For non-label lines, remove parentheses and their content
        return line.replace(/\([^)]*\)/g, "");
      })
      .join('\n')
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
