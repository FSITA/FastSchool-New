import {
  HarmBlockThreshold,
  HarmCategory,
  VertexAI,
} from "@google-cloud/vertexai";
import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import fetch from "node-fetch";
import { parseStringPromise } from "xml2js";
import { verifyAuth } from "@/lib/auth/api-auth";

// Add debugging to check if the API key is properly formatted
let credentials;
try {
  const decodedKey = Buffer.from(
    process.env.GOOGLE_SERVICE_KEY || "",
    "base64"
  ).toString();
  console.log(
    "Decoded key format check:",
    decodedKey.substring(0, 20) + "..."
  );
  credentials = JSON.parse(decodedKey);
} catch (error) {
  console.error("Error parsing API key:", error);
  // If the key is not in JSON format, it might be a direct API key
  credentials = { apiKey: process.env.GOOGLE_SERVICE_KEY };
}

// Initialize Vertex with your Cloud project and location
const vertex_ai = new VertexAI({
  project: credentials.project_id || "tough-pod-446502-n1",
  location: "europe-west3",
  googleAuthOptions: {
    credentials,
  },
});
const model = "gemini-2.5-flash";

const generativeModel = vertex_ai.getGenerativeModel({
  model: model,
  generationConfig: {
    maxOutputTokens: 8192,
    temperature: 1,
    topP: 0.95,
  },
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ],
});

/**
 * geminiIteratorToSSEStream
 * - Accepts the Gemini async iterator (resp.stream).
 * - Ensures chunk is always a string before appending.
 * - Splits incoming text into lines (NDJSON expectation).
 * - Emits valid JSON objects as SSE `data: <json>\n\n`.
 * - Emits chunk errors as `data: {...}` (type: chunk_error).
 * - Emits final `event: done` when finished.
 */
function geminiIteratorToSSEStream(iterator: AsyncIterable<any>) {
  return new ReadableStream({
    async start(controller) {
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        for await (const value of iterator as any) {
          let chunk = "";

          if (value?.candidates?.[0]?.content?.parts?.[0]?.text) {
            chunk = value.candidates[0].content.parts[0].text;
          } else if (value?.text) {
            chunk = value.text;
          } else if (typeof value === "string") {
            chunk = value;
          }

          if (!chunk) continue;

          buffer += chunk;

          // Split into lines (NDJSON expectation)
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? ""; // keep unfinished line in buffer

          for (const line of lines) {
            const clean = line.trim().replace(/```json|```/g, "");
            if (!clean) continue;

            try {
              const parsed = JSON.parse(clean);
              controller.enqueue(`data: ${JSON.stringify({ type: "quiz", payload: parsed })}\n\n`);
            } catch (err) {
              console.error("❌ JSON parse error:", err, " line:", clean);
              controller.enqueue(
                `data: ${JSON.stringify({ type: "chunk_error", raw: clean })}\n\n`
              );
            }
          }
        }

        // flush leftover buffer if any
        if (buffer.trim()) {
          try {
            const parsed = JSON.parse(buffer.trim());
            controller.enqueue(`data: ${JSON.stringify({ type: "quiz", payload: parsed })}\n\n`);
          } catch (err) {
            console.error("❌ leftover parse error:", err, buffer);
          }
        }

        // end
        controller.enqueue(`event: done\ndata: ${JSON.stringify({ status: "complete" })}\n\n`);
        controller.close();
      } catch (err) {
        console.error("Error reading Gemini iterator:", err);
        controller.enqueue(
          `data: ${JSON.stringify({ type: "error", message: "Server error during streaming." })}\n\n`
        );
        controller.close();
      }
    },
  });
}


async function getYoutubeTranscript(
  videoId: string,
  language = "en"
): Promise<string> {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  // Add realistic headers to avoid blocking
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Referer': 'https://www.google.com/',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'cross-site',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1'
  };

  const html = await fetch(videoUrl, { headers }).then((res) => res.text());
  const apiKeyMatch = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/);
  if (!apiKeyMatch) throw new Error("INNERTUBE_API_KEY not found.");
  const apiKey = apiKeyMatch[1];

  const playerData = await fetch(
    `https://www.youtube.com/youtubei/v1/player?key=${apiKey}`,
    {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.youtube.com/',
        'Origin': 'https://www.youtube.com'
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName: "ANDROID",
            clientVersion: "20.10.38",
          },
        },
        videoId,
      }),
    }
  ).then((res) => res.json()) as any;

  const tracks =
    playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  if (!tracks || tracks.length === 0) {
    throw new Error("No captions found for this video.");
  }

  let track = tracks.find((t: any) => t.languageCode === language);
  if (!track) {
    console.log(
      `No captions for language '${language}', falling back to the first available track.`
    );
    track = tracks[0];
  }

  const baseUrl = track.baseUrl.replace(/&fmt=\w+$/, "");
  const xml = await fetch(baseUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/xml, text/xml, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://www.youtube.com/'
    }
  }).then((res) => res.text());
  const parsed = await parseStringPromise(xml);

  return parsed.transcript.text.map((entry: any) => entry._).join(" ");
}

function getGradeLevelInstructions(gradeLevel: string | null): string {
  const gradeLevelMap = {
    primary:
      "Generate questions suitable for Primary School students. Use simple vocabulary, short sentences, and focus on basic recall of facts (e.g., 'Who?', 'What?', 'Where?'). Avoid abstract concepts.",
    secondary:
      "Generate questions suitable for Secondary School students. Questions should require some interpretation and comparison. Use more complex sentence structures than primary level.",
    high_school:
      "Generate questions suitable for High School students. These should require analysis, synthesis, and evaluation of the provided material. Encourage critical thinking.",
    university:
      "Generate questions suitable for University-level students. Questions should be analytical, require critical thinking, and may involve complex, abstract concepts from the given text.",
  };

  return gradeLevelMap[gradeLevel as keyof typeof gradeLevelMap] || gradeLevelMap.primary;
}

export async function POST(req: Request) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(req);
    if (authResult instanceof Response) {
      return authResult;
    }
    const { user } = authResult;

    console.log("Starting quiz generation request");
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const notes = formData.get("notes");
    const youtubeUrl = formData.get("youtubeUrl") as string;
    const wikipediaLink = formData.get("wikipediaLink") as string;
    const totalQuizQuestions = formData.get("quizCount");
    const gradeLevel = formData.get("gradeLevel") as string | null;
    const language = formData.get("language") as string | null;
    const topic = formData.get("topic");
    const startPage = formData.get("startPage") as string;
    const endPage = formData.get("endPage") as string;

    console.log("Form data received:", {
      filesCount: files.length,
      hasNotes: !!notes,
      totalQuizQuestions,
      gradeLevel,
      topic,
      startPage,
      endPage,
      youtubeUrl,
      wikipediaLink,
    });

    let context = "";

    if (youtubeUrl) {
      try {
        const videoIdMatch = youtubeUrl.match(
          /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
        );
        if (!videoIdMatch) {
          throw new Error("Invalid YouTube URL");
        }
        const videoId = videoIdMatch[1];
        console.log(`Extracted video ID: ${videoId}`);

        if (!videoId) {
          throw new Error("Could not extract video ID from YouTube URL");
        }

        context = await getYoutubeTranscript(videoId, "en");
        console.log("Successfully fetched YouTube transcript via Innertube API.");
      } catch (error) {
        console.error("Error fetching YouTube transcript:", error);
        return new NextResponse("Error processing YouTube URL", {
          status: 500,
        });
      }
    } else if (wikipediaLink) {
      try {
        const title = wikipediaLink.split("/").pop();
        const response = await fetch(
          `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&format=json&titles=${title}`
        );
        const data = (await response.json()) as {
          query: { pages: { [key: string]: { extract: string } } };
        };
        const pages = data.query.pages;
        const pageId = Object.keys(pages)[0];
        if (!pageId || !pages[pageId]) {
          throw new Error("Could not extract page ID from Wikipedia response");
        }
        context = pages[pageId].extract;
      } catch (error) {
        console.error("Error fetching Wikipedia content:", error);
        return new NextResponse("Error processing Wikipedia URL", {
          status: 500,
        });
      }
    }

    if (files.length < 1 && !notes && !context) {
      return new NextResponse(
        "Please provide either a file, notes or a youtube url",
        {
          status: 400,
        }
      );
    }

    const gradeLevelInstructions = getGradeLevelInstructions(gradeLevel);
    const gradeLevelMap = {
        primary: "Primary School",
        secondary: "Secondary School",
        high_school: "High School",
        university: "University Level"
    };
    const displayGradeLevel = gradeLevel ? gradeLevelMap[gradeLevel as keyof typeof gradeLevelMap] : "Primary School";

    const languageMap = {
        italian: "Italian",
        english: "English",
        spanish: "Spanish",
        french: "French",
        german: "German",
        portuguese: "Portuguese",
        dutch: "Dutch",
        russian: "Russian",
        chinese: "Chinese (Simplified)",
    };
    const displayLanguage = language ? languageMap[language as keyof typeof languageMap] : "Italian";

    const text1 = {
      text: `You are an all-rounder tutor with professional expertise in different fields. You are to generate a list of quiz questions from the document(s) for a ${displayGradeLevel} level. ${gradeLevelInstructions} The quiz must be entirely in ${displayLanguage}.`,
    };

    // IMPORTANT: we keep the original object schema but add a single-line instruction
    // asking Gemini to emit results as NDJSON (one JSON object per line).
    // This preserves the JSON structure you parse while enabling streaming.
    const text2 = {
  text: `Respond with ${ totalQuizQuestions || 5 } quiz questions.

STRICT OUTPUT RULES:
- Output must be exactly one JSON object per line (NDJSON).
- Do not wrap with \`\`\`json or any other markdown.
- Do not output arrays or extra text.
- Each object should look like this:
{"id":1,"question":"...","options":{"a":"...","b":"...","c":"...","d":"..."},"answer":"a"}
- Every quiz question must be a single concise sentence (max 20 words).
- Only one correct answer per question.
- No explanations, reasoning, or extra context should be generated.

Stream exactly N lines, where N = ${ totalQuizQuestions || 5 }.
Each line must be a valid JSON object on its own.
Do not group them in an array. Do not add commentary.`,
};


    const filesBase64 = await Promise.all(
      files.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        let buffer = Buffer.from(arrayBuffer);

        const start = parseInt(startPage, 10);
        const end = parseInt(endPage, 10);

        if (
          file.type === "application/pdf" &&
          start > 0 &&
          end > 0 &&
          start <= end
        ) {
          try {
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const totalPages = pdfDoc.getPageCount();

            if (start <= totalPages && end <= totalPages) {
              const newPdfDoc = await PDFDocument.create();
              const pageIndices = Array.from(
                { length: end - start + 1 },
                (_, i) => start + i - 1
              );
              const copiedPages = await newPdfDoc.copyPages(
                pdfDoc,
                pageIndices
              );
              copiedPages.forEach((page) => newPdfDoc.addPage(page));

              const pdfBytes = await newPdfDoc.save();
              buffer = Buffer.from(pdfBytes);
              console.log(
                `PDF sliced from page ${start} to ${end}. New size: ${buffer.length} bytes.`
              );
            } else {
              console.warn("Invalid page range provided, using the full PDF.");
            }
          } catch (pdfError) {
            console.error("Error slicing PDF, using the full PDF:", pdfError);
          }
        }

        return buffer.toString("base64");
      })
    );

    const filesData = filesBase64.map((b64, i) => ({
      inlineData: {
        mimeType: files[i]?.type || 'application/octet-stream',
        data: b64,
      },
    }));

    const data =
      files.length > 0
        ? filesData
        : [{ text: context || notes?.toString() || "No notes" }];

    const body = {
      contents: [{ role: "user", parts: [text1, ...data, text2] }],
    };

    console.log("Sending request to Gemini API (streaming mode)");
    try {
      const resp = await generativeModel.generateContentStream(body);
      console.log("Received streaming response from Gemini API");

      // Convert Gemini iterator into an SSE-friendly ReadableStream that emits full JSON objects per event
      const sseStream = geminiIteratorToSSEStream(resp.stream);

      // Return a raw streaming Response with SSE headers.
      // This avoids any intermediate buffering that might convert chunks into one large blob.
      return new Response(sseStream as any, {
        status: 200,
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          // no transform - ensure streaming passes through
          "Transfer-Encoding": "chunked",
        },
      });
    } catch (error) {
      console.error("Error generating content from Gemini API:", error);

      let errorMessage = "Error generating quizzes, try again!";
      let statusCode = 500;

      if (error instanceof Error) {
        if (
          error.message.includes("PERMISSION_DENIED") ||
          error.message.includes("permission denied")
        ) {
          errorMessage =
            "Permission denied accessing Google Cloud project. Please check your API key and project configuration.";
        } else if (
          error.message.includes("authentication") ||
          error.message.includes("auth") ||
          error.message.includes("credential")
        ) {
          errorMessage =
            "Authentication error with Google Cloud. Please check your API key format and permissions.";
        } else if (
          error.message.includes("quota") ||
          error.message.includes("rate limit")
        ) {
          errorMessage =
            "API quota exceeded or rate limited. Please try again later.";
        }
      }

      return new NextResponse(errorMessage, {
        status: statusCode,
      });
    }
  } catch (error) {
    console.error("Unexpected error in quiz generation:", error);

    let errorMessage = "Error generating quizzes, try again!";

    if (error instanceof Error) {
      if (
        error.message.includes("PERMISSION_DENIED") ||
        error.message.includes("permission denied")
      ) {
        errorMessage =
          "Permission denied accessing Google Cloud project. Please check your API key and project configuration.";
      } else if (
        error.message.includes("authentication") ||
        error.message.includes("auth")
      ) {
        errorMessage =
          "Authentication error with Google Cloud. Please check your API key format.";
      } else if (error.message.includes("project")) {
        errorMessage =
          "Error with Google Cloud project configuration. Please check your project settings.";
      }
    }

    return new NextResponse(errorMessage, {
      status: 500,
    });
  }
}
