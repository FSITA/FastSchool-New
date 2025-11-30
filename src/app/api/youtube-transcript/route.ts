import { NextRequest, NextResponse } from "next/server";
import {
  fetchTranscriptWithFallback,
  extractVideoId,
} from "@/lib/youtube-transcript/youtube-transcript-service";

/**
 * POST /api/youtube-transcript
 * 
 * Fetches YouTube transcript using 2-tier fallback system:
 * - Tier 1: YouTube Innertube API (captions)
 * - Tier 2: Gemini summary transcription fallback
 * 
 * Request body:
 * {
 *   "url": "https://www.youtube.com/watch?v=VIDEO_ID", // OR
 *   "videoId": "VIDEO_ID",
 *   "lang": "en" // optional, defaults to "en"
 * }
 * 
 * Response (success):
 * {
 *   "success": true,
 *   "source": "gemini-summary" | "innertube-api",
 *   "transcript": "Full transcript text here..."
 * }
 * 
 * Response (error):
 * {
 *   "success": false,
 *   "error": "Error message here"
 * }
 */
export async function POST(request: NextRequest) {
  console.log("=".repeat(60));
  console.log("🌐 [API] /api/youtube-transcript - POST request received");
  console.log("=".repeat(60));

  try {
    // Parse request body
    console.log("📥 [API] Parsing request body...");
    const body = await request.json();
    console.log("📊 [API] Request body:", JSON.stringify(body, null, 2));

    // Extract video ID from URL or use provided videoId
    let videoId: string | null = null;

    if (body.videoId) {
      console.log("📝 [API] Using provided videoId:", body.videoId);
      videoId = body.videoId.trim();
    } else if (body.url) {
      console.log("📝 [API] Extracting videoId from URL:", body.url);
      videoId = extractVideoId(body.url);
      if (!videoId) {
        console.error("❌ [API] Failed to extract videoId from URL");
        return NextResponse.json(
          {
            success: false,
            error: "Invalid YouTube URL. Could not extract video ID.",
          },
          { status: 400 }
        );
      }
      console.log("✅ [API] Extracted videoId:", videoId);
    } else {
      console.error("❌ [API] Missing required field: 'url' or 'videoId'");
      return NextResponse.json(
        {
          success: false,
          error: "Missing required field: 'url' or 'videoId'",
        },
        { status: 400 }
      );
    }

    // Validate video ID format
    if (!videoId || videoId.trim().length !== 11) {
      console.error("❌ [API] Invalid video ID format:", videoId);
      return NextResponse.json(
        {
          success: false,
          error: "Invalid video ID format. Video ID must be 11 characters.",
        },
        { status: 400 }
      );
    }

    // Get language (optional, defaults to "en")
    const lang = body.lang || "en";
    console.log("📝 [API] Language:", lang);

    // Fetch transcript using 2-tier fallback system
    console.log("🔄 [API] Calling fetchTranscriptWithFallback...");
    const result = await fetchTranscriptWithFallback(videoId, lang);

    console.log("📊 [API] Transcript fetch result:", {
      success: result.success,
      source: result.source,
      transcriptLength: result.transcript?.length || 0,
      error: result.error,
    });

    // Return success response
    if (result.success && result.transcript) {
      console.log("✅ [API] Successfully fetched transcript");
      console.log("📝 [API] Source:", result.source);
      console.log("📊 [API] Transcript length:", result.transcript.length);
      console.log("=".repeat(60));

      return NextResponse.json(
        {
          success: true,
          source: result.source,
          transcript: result.transcript,
        },
        { status: 200 }
      );
    }

    // Return error response
    console.error("❌ [API] Failed to fetch transcript");
    console.error("❌ [API] Error:", result.error);
    console.log("=".repeat(60));

    return NextResponse.json(
      {
        success: false,
        error: result.error || "Transcript not found or unavailable",
      },
      { status: 404 }
    );
  } catch (error) {
    console.error("❌ [API] Unexpected error occurred:", error);
    console.error("❌ [API] Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    });
    console.log("=".repeat(60));

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while fetching transcript",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/youtube-transcript
 * 
 * Health check endpoint
 */
export async function GET(request: NextRequest) {
  console.log("🌐 [API] /api/youtube-transcript - GET request received (health check)");

  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");
  const url = searchParams.get("url");

  if (!videoId && !url) {
    return NextResponse.json(
      {
        success: false,
        error: "Missing required parameter: 'videoId' or 'url'",
      },
      { status: 400 }
    );
  }

  // Extract video ID
  let extractedVideoId: string | null = null;
  if (videoId) {
    extractedVideoId = videoId;
  } else if (url) {
    extractedVideoId = extractVideoId(url);
  }

  if (!extractedVideoId) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid YouTube URL or video ID",
      },
      { status: 400 }
    );
  }

  // Fetch transcript
  const result = await fetchTranscriptWithFallback(extractedVideoId);

  if (result.success && result.transcript) {
    return NextResponse.json(
      {
        success: true,
        source: result.source,
        transcript: result.transcript,
      },
      { status: 200 }
    );
  }

  return NextResponse.json(
    {
      success: false,
      error: result.error || "Transcript not found",
    },
    { status: 404 }
  );
}

