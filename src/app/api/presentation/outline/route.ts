import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "@/env.js";
import { processUniversalFormData } from "@/lib/presentation/universal-form-processor";

interface OutlineRequest {
  prompt: string;
  numberOfCards: number;
  language: string;
}

const outlineTemplate = `Given the following presentation topic and requirements, generate a structured outline with {numberOfCards} main topics in markdown format.
The outline should be in {language}.

Topic: {prompt}

Generate exactly {numberOfCards} main topics that would make for an engaging and well-structured presentation. 
Format the response as markdown content, with each topic as a heading followed by 2-3 bullet points.

Example format:
# First Main Topic
- Key point about this topic
- Another important aspect
- Brief conclusion or impact

# Second Main Topic
- Main insight for this section
- Supporting detail or example
- Practical application or takeaway

# Third Main Topic 
- Primary concept to understand
- Evidence or data point
- Conclusion or future direction

Make sure the topics:
1. Flow logically from one to another
2. Cover the key aspects of the main topic
3. Are clear and concise
4. Are engaging for the audience
5. ALWAYS use bullet points (not paragraphs) and format each point as "- point text"
6. Do not use bold, italic or underline
7. Keep each bullet point brief - just one sentence per point
8. Include exactly 2-3 bullet points per topic (not more, not less)`;

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
    temperature: 0.7,
  },
});

export async function POST(req: Request) {
  console.log("--- Outline Generation POST Request Received ---");
  try {
    // Check if request is FormData (universal form) or JSON (legacy)
    const contentType = req.headers.get("content-type");
    let prompt: string;
    let numberOfCards: number;
    let language: string;

    if (contentType?.includes("multipart/form-data")) {
      // Handle universal form data
      const formData = await req.formData();
      const processedData = await processUniversalFormData(formData);
      
      prompt = processedData.content;
      numberOfCards = parseInt(formData.get("numSlides") as string) || 10;
      language = processedData.language;
      
      console.log("Processed universal form data:", { 
        contentLength: prompt.length, 
        numberOfCards, 
        language,
        gradeLevel: processedData.gradeLevel 
      });
    } else {
      // Handle legacy JSON request
      const { prompt: jsonPrompt, numberOfCards: jsonNumberOfCards, language: jsonLanguage } =
        (await req.json()) as OutlineRequest;
      
      prompt = jsonPrompt;
      numberOfCards = jsonNumberOfCards;
      language = jsonLanguage;
      
      console.log("Legacy request body:", { prompt, numberOfCards, language });
    }

    if (!prompt || !numberOfCards || !language) {
      console.error("Missing required fields");
      return new Response("Missing required fields", { status: 400 });
    }

    const fullPrompt = outlineTemplate
      .replace(/{prompt}/g, prompt)
      .replace(/{numberOfCards}/g, numberOfCards.toString())
      .replace(/{language}/g, language);
    console.log("--- Full Prompt for Gemini ---");
    console.log(fullPrompt);
    console.log("-----------------------------");

    const result = await model.generateContentStream(fullPrompt);

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          controller.enqueue(new TextEncoder().encode(chunkText));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("--- ERROR in Outline Generation ---");
    if (error instanceof Error) {
      console.error("Error Message:", error.message);
      console.error("Error Stack:", error.stack);
    } else {
      console.error("Unknown Error:", error);
    }
    console.log("------------------------------------");
    return new Response("Failed to generate outline", { status: 500 });
  }
}
