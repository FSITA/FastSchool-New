import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { NextResponse } from "next/server";
import { processPDF } from "@/utils/chatFunctions/pdf-utils";

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
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(req: Request) {
  try {
    let topic = "";
    let pdfText = "";
    let context = "";
    const contentType = req.headers.get("content-type") || "";
    
    if (contentType.startsWith("multipart/form-data")) {
      const formData = await req.formData();
      topic = formData.get("topic")?.toString() || "";
      const pdfFile = formData.get("pdf");
      if (pdfFile && typeof pdfFile === "object" && "arrayBuffer" in pdfFile) {
        const buffer = Buffer.from(await pdfFile.arrayBuffer());
        pdfText = await processPDF(buffer);
        context = pdfText.slice(0, 8000); // Limit context for LLM input
      }
    } else {
      // JSON body
      const body = await req.json();
      topic = body.topic || "";
      if (body.pdfText) {
        context = body.pdfText.slice(0, 8000);
      }
    }

    if (!topic) {
      return NextResponse.json({ error: "L'argomento è obbligatorio" }, { status: 400 });
    }

    let systemPrompt = MINDMAP_SYSTEM_MESSAGE;
    if (context) {
      systemPrompt += `\n\nRelevant PDF Context:\n${context}`;
    }

    const response = await llm.invoke([
      ["system", systemPrompt],
      ["human", `Generate a mindmap for: ${topic}`],
    ]);

    // Parse the response to ensure it's valid JSON with definitions at each node
    let mindmapData;
    try {
      const responseText = String(response.content);
      const jsonMatch =
        responseText.match(/```json\n([\s\S]*?)\n```/) ||
        responseText.match(/{[\s\S]*}/);

      const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : responseText;
      mindmapData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse mindmap data:", parseError);
      return NextResponse.json(
        { error: "Failed to generate valid mindmap structure" },
        { status: 500 }
      );
    }

    return NextResponse.json({ mindmap: mindmapData });
  } catch (error) {
    console.error("Error generating mindmap:", error);
      return NextResponse.json(
      { error: "Impossibile generare la mappa mentale" },
      { status: 500 }
    );
  }
}
