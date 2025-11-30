import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { verifyAuth } from '@/lib/auth/api-auth'
import { env } from '@/env'
import { processUniversalFormData } from '@/lib/presentation/universal-form-processor'

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY)

const MAX_CONTENT_LENGTH = 2500
const SUMMARY_THRESHOLD = 1800
const DEFAULT_DIRECTION = 'TD'
const SUPPORTED_DIRECTIONS = new Set(['TD', 'LR', 'BT', 'RL'])

type DiagramNode = {
  id?: string
  label?: string
  description?: string
  type?: string
}

type DiagramEdge = {
  from?: string
  to?: string
  label?: string
  relation?: string
}

type DiagramStructure = {
  diagramType?: string
  direction?: string
  nodes?: DiagramNode[]
  edges?: DiagramEdge[]
  notes?: string[]
}

function normalizeAccents(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function sanitizeIdentifier(value: string, fallback: string): string {
  const normalized = normalizeAccents(value || '').replace(/[^a-zA-Z0-9_]/g, '_')
  let identifier = normalized || fallback
  if (/^[0-9]/.test(identifier)) {
    identifier = `n_${identifier}`
  }
  return identifier || fallback
}

function sanitizeLabel(label: string, language: string): string {
  const cleaned = label
    .replace(/[\[\]\{\}<>]/g, '')
    .replace(/&/g, language === 'english' ? 'and' : ' e ')
    .replace(/"/g, "'")
    .replace(/\s+/g, ' ')
    .trim()

  return cleaned.length > 0 ? cleaned : 'Nodo'
}

function sanitizeEdgeLabel(label: string | undefined, language: string): string {
  if (!label) return ''
  const cleaned = label
    .replace(/[\[\]\{\}<>]/g, '')
    .replace(/&/g, language === 'english' ? 'and' : ' e ')
    .replace(/"/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
  return cleaned
}

function extractJsonString(rawText: string): string {
  const startIndex = rawText.indexOf('{')
  const endIndex = rawText.lastIndexOf('}')
  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    throw new Error('No JSON object detected in response')
  }
  return rawText.slice(startIndex, endIndex + 1)
}

function parseDiagramJsonResponse(rawText: string): DiagramStructure {
  const jsonString = extractJsonString(rawText)
  const data = JSON.parse(jsonString)
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid diagram structure received')
  }
  return data
}

function createNodeRegistry(language: string) {
  const idMap = new Map<string, string>()
  const usedIds = new Set<string>()
  const definitions: string[] = []

  function makeUnique(base: string): string {
    let candidate = base || 'node'
    let counter = 1
    while (usedIds.has(candidate)) {
      candidate = `${base}_${counter++}`
    }
    usedIds.add(candidate)
    return candidate
  }

  function ensureNode(rawId: string | undefined, label: string | undefined, fallbackIndex: number) {
    const key = rawId?.trim() || label?.trim()
    if (key && idMap.has(key)) {
      return { id: idMap.get(key)!, created: false }
    }

    const sanitizedBase = sanitizeIdentifier(
      key || `node_${fallbackIndex + 1}`,
      `node_${fallbackIndex + 1}`
    )
    const uniqueId = makeUnique(sanitizedBase)
    const safeLabel = sanitizeLabel(label || key || `Nodo ${fallbackIndex + 1}`, language)

    definitions.push(`${uniqueId}[${safeLabel}]`)

    if (key) {
      idMap.set(key, uniqueId)
    }
    idMap.set(uniqueId, uniqueId)

    return { id: uniqueId, created: true }
  }

  function getDefinitions() {
    return definitions
  }

  return { ensureNode, getDefinitions }
}

function buildMermaidFromStructure(structure: DiagramStructure, language: string): string {
  const direction = structure.direction?.toUpperCase()
  const safeDirection = direction && SUPPORTED_DIRECTIONS.has(direction) ? direction : DEFAULT_DIRECTION

  const registry = createNodeRegistry(language)
  const nodeLabelLookup = new Map<string, string>()
  const edgeLines: string[] = []
  const nodes = Array.isArray(structure.nodes) ? structure.nodes : []
  const edges = Array.isArray(structure.edges) ? structure.edges : []

  nodes.forEach((node, index) => {
    const result = registry.ensureNode(node.id || node.label || `node_${index + 1}`, node.label || node.id, index)
    const labelValue = node.label || node.id || result.id
    if (node.id) {
      nodeLabelLookup.set(node.id.trim(), labelValue)
    }
    if (node.label) {
      nodeLabelLookup.set(node.label.trim(), labelValue)
    }
    nodeLabelLookup.set(result.id, labelValue)
  })

  edges.forEach((edge, index) => {
    const fromLabelHint = edge.from ? nodeLabelLookup.get(edge.from.trim()) || edge.from : undefined
    const toLabelHint = edge.to ? nodeLabelLookup.get(edge.to.trim()) || edge.to : undefined

    const fromResult = registry.ensureNode(edge.from || fromLabelHint || `edge_from_${index + 1}`, fromLabelHint, nodes.length + index)
    const toResult = registry.ensureNode(edge.to || toLabelHint || `edge_to_${index + 1}`, toLabelHint, nodes.length + index + 100)

    if (edge.from && !nodeLabelLookup.has(edge.from)) {
      nodeLabelLookup.set(edge.from.trim(), fromLabelHint || edge.from)
    }
    if (edge.to && !nodeLabelLookup.has(edge.to)) {
      nodeLabelLookup.set(edge.to.trim(), toLabelHint || edge.to)
    }
    nodeLabelLookup.set(fromResult.id, fromLabelHint || edge.from || fromResult.id)
    nodeLabelLookup.set(toResult.id, toLabelHint || edge.to || toResult.id)

    const fromId = fromResult.id
    const toId = toResult.id
    const safeLabel = sanitizeEdgeLabel(edge.label || edge.relation, language)

    if (safeLabel) {
      edgeLines.push(`${fromId} --"${safeLabel}"--> ${toId}`)
    } else {
      edgeLines.push(`${fromId} --> ${toId}`)
    }
  })

  if (edgeLines.length === 0) {
    throw new Error('No edges generated for diagram')
  }

  const lines = [`graph ${safeDirection}`, ...registry.getDefinitions(), ...edgeLines]
  return lines.join('\n')
}

function sanitizeRawMermaidCode(rawCode: string, language: string): string {
  let cleanedCode = rawCode
    .replace(/```mermaid\s*/g, '')
    .replace(/```\s*/g, '')
    .replace(/^---+\s*/g, '')
    .replace(/\s*---+$/g, '')
    .replace(/^[\s\n]*/, '')
    .replace(/[\s\n]*$/, '')
    .replace(/;\s*$/gm, '')

  cleanedCode = cleanedCode.replace(/&/g, language === 'english' ? 'and' : ' e ')

  cleanedCode = cleanedCode.split('\n').map(line => {
    const trimmed = line.trim()
    if (trimmed.startsWith('subgraph') || trimmed === 'end') {
      return ''
    }
    return line
  }).filter(Boolean).join('\n')

  cleanedCode = cleanedCode.split('\n').map(line => {
    const trimmed = line.trim()
    const multiSourceMatch = trimmed.match(/^([^,]+(?:,\s*[^,]+)+)\s*(--[^>]*-->)\s*(.+)$/)
    if (multiSourceMatch) {
      const [, sources, edge, destination] = multiSourceMatch
      const sourceNodes = sources.split(',').map(s => s.trim()).filter(Boolean)
      return sourceNodes.map(node => `${node} ${edge} ${destination}`).join('\n')
    }
    return line
  }).join('\n')

  cleanedCode = cleanedCode.replace(/--([^->\n]+?)-->/g, (match, label) => {
    const trimmedLabel = label.trim()
    if (trimmedLabel.includes(' ') && !trimmedLabel.startsWith('"') && !trimmedLabel.endsWith('"')) {
      return `--"${trimmedLabel}"-->`
    }
    return match
  })

  cleanedCode = cleanedCode.split('\n').map(line => {
    const trimmed = line.trim()
    if (!trimmed || !trimmed.includes('--')) {
      return line
    }

    if (trimmed.match(/^\w+.*--["'][^"']*["']\s*$/)) {
      return ''
    }

    if (trimmed.match(/^\w+.*--[^>]+$/) && !trimmed.includes('-->')) {
      const afterDash = trimmed.match(/--(.+)$/)
      if (afterDash && afterDash[1].trim().length > 0 && !afterDash[1].trim().match(/^[\w\[\(]/)) {
        return ''
      }
    }

    if (trimmed.match(/-->\s*$/)) {
      return ''
    }

    const edgeMatch = trimmed.match(/-->\s*(.+)$/)
    if (edgeMatch) {
      const afterArrow = edgeMatch[1].trim()
      if (!afterArrow || afterArrow.length === 0) {
        return ''
      }
      if (!afterArrow.match(/^[\w\[\(]/)) {
        return ''
      }
    }

    return line
  }).filter(line => line.trim().length > 0).join('\n')

  cleanedCode = cleanedCode.split('\n').map(line => {
    const trimmed = line.trim()
    const arrowCount = (trimmed.match(/-->/g) || []).length

    if (arrowCount > 1) {
      const firstEdgeMatch = trimmed.match(/^(\s*)(\w+(?:\[[^\]]+\])?)\s*(--[^>]*-->)\s*(\w+(?:\[[^\]]+\])?)/)
      if (firstEdgeMatch) {
        const [, indent, nodeA, edge1, nodeB] = firstEdgeMatch
        const restOfLine = trimmed.substring(firstEdgeMatch[0].length).trim()
        if (restOfLine && restOfLine.includes('-->')) {
          const secondEdgeMatch = restOfLine.match(/(--[^>]*-->)\s*(\w+(?:\[[^\]]+\])?.*?)$/)
          if (secondEdgeMatch) {
            const [, edge2, nodeC] = secondEdgeMatch
            return `${indent}${nodeA} ${edge1} ${nodeB}\n${indent}${nodeB} ${edge2} ${nodeC}`
          }
        }
      }
    }

    return line
  }).join('\n')

  cleanedCode = cleanedCode
    .split(/\n/)
    .map(line => {
      if (line.includes('[') && line.includes(']')) {
        return line
      }
      return line.replace(/\([^)]*\)/g, '')
    })
    .join('\n')
    .trim()

  return cleanedCode
}

async function summarizeContentIfNeeded(text: string, language: string): Promise<{ content: string; summarized: boolean }> {
  if (text.length <= SUMMARY_THRESHOLD) {
    return { content: text, summarized: false }
  }

  try {
    const summaryModel = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1024
      }
    })

    const summaryPrompt = `Summarize the following content into concise bullet points (maximum 20). Each bullet should highlight entities and their relationship using the language ${language}. Focus on cause/effect or part/whole relationships.\n\nCONTENT:\n${text}`
    const summaryResult = await summaryModel.generateContent(summaryPrompt)
    const summaryText = summaryResult.response.text().trim()

    if (summaryText && summaryText.length > 0) {
      console.log('✅ Used summarized content for diagram generation')
      return { content: summaryText, summarized: true }
    }
  } catch (error) {
    console.warn('⚠️ Diagram summary generation failed, using original content', error)
  }

  // Fallback: truncate original text if still too long
  if (text.length > MAX_CONTENT_LENGTH) {
    return {
      content: text.substring(0, MAX_CONTENT_LENGTH) + '...',
      summarized: false
    }
  }

  return { content: text, summarized: false }
}

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

    const { content: diagramInput, summarized } = await summarizeContentIfNeeded(userText, language)
    if (summarized) {
      console.log('ℹ️ Diagram content summarized for generation')
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

    const systemPrompt = `Create a structured representation for a flowchart-style diagram based on the user's text. ${languageInstruction}

OUTPUT FORMAT (JSON ONLY, no markdown, no code fences):
{
  "diagramType": "graph",
  "direction": "TD",
  "nodes": [
    { "id": "UniqueIdentifier", "label": "Label in ${language}" }
  ],
  "edges": [
    { "from": "UniqueIdentifier", "to": "UniqueIdentifier", "label": "Relationship in ${language}" }
  ]
}

RULES:
- diagramType must be "graph" unless the user explicitly requests another supported type.
- direction must be "TD" or "LR".
- Node IDs must be short ASCII strings with letters/numbers/underscores only (no spaces, commas, symbols, or diacritics).
- Labels can use the user's language and may include spaces.
- Every edge must have both a "from" and a "to" referencing existing node IDs.
- Edge labels should be short phrases in ${language}. If no label is necessary, omit the "label" field.
- Do NOT use Mermaid syntax in the response. Reply with JSON only.
- Include at least 2 nodes and 1 edge.

For encyclopedia-like content, list key entities and their relationships. For processes, list steps in order. For people, show relationships or timelines.`

    const prompt = `${systemPrompt}\n\nUSER_CONTENT:\n${diagramInput.trim()}`;
    
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

    if (finishReason && finishReason !== 'STOP') {
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

    let finalMermaidCode = ''
    let usedStructuredDiagram = false

    try {
      const structuredDiagram = parseDiagramJsonResponse(mermaidCode)
      finalMermaidCode = buildMermaidFromStructure(structuredDiagram, language)
      usedStructuredDiagram = true
    } catch (jsonError) {
      console.warn('⚠️ Failed to parse structured diagram JSON. Falling back to raw Mermaid sanitization.', jsonError)
      finalMermaidCode = sanitizeRawMermaidCode(mermaidCode, language)
    }

    finalMermaidCode = sanitizeRawMermaidCode(finalMermaidCode, language)

    if (!finalMermaidCode || finalMermaidCode.length < 5) {
      return NextResponse.json(
        { success: false, error: 'Received empty or invalid diagram code from the Gemini API' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      mermaidCode: finalMermaidCode,
      metadata: {
        summarized,
        usedStructuredDiagram
      }
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
