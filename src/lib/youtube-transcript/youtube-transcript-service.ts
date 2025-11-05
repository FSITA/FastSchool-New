import { parseStringPromise } from "xml2js";
import { env } from "@/env";
import type { TranscriptResult } from "./types";
import { cookieManager } from "./cookie-manager";
import { getUserAgentForClient } from "./user-agents";
import { getClientConfig, rotateClientConfig, resetClientConfig, type ClientConfig } from "./client-types";
import { 
  fetchWithRetry, 
  generateHeaders, 
  randomDelay, 
  twoStepRequestFlow,
  isBlockedResponse 
} from "./request-utils";

/**
 * Extract video ID from YouTube URL
 * Supports multiple URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 */
export function extractVideoId(url: string): string | null {
  console.log("🔍 [extractVideoId] Starting video ID extraction");
  console.log("📝 [extractVideoId] Input URL:", url);

  if (!url || typeof url !== "string") {
    console.error("❌ [extractVideoId] Invalid URL input:", url);
    return null;
  }

  const trimmedUrl = url.trim();
  console.log("📝 [extractVideoId] Trimmed URL:", trimmedUrl);

  // Regex pattern to match various YouTube URL formats
  const videoIdMatch = trimmedUrl.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  );

  if (!videoIdMatch || !videoIdMatch[1]) {
    console.error("❌ [extractVideoId] Could not extract video ID from URL");
    return null;
  }

  const videoId = videoIdMatch[1];
  console.log("✅ [extractVideoId] Successfully extracted video ID:", videoId);
  return videoId;
}

/**
 * Tier 1: YouTube Innertube API (Enhanced for Render.com deployment)
 * This extracts INNERTUBE_API_KEY from YouTube page and uses it to get captions
 * Uses cookie management, user agent rotation, client type rotation, and retry logic
 */
async function tier1InnertubeApi(
  videoId: string,
  lang: string = "en",
  useTwoStepFlow: boolean = true
): Promise<{ success: boolean; transcript?: string; error?: string }> {
  console.log("🚀 [Tier 1] Starting Innertube API fetch (Enhanced)");
  console.log("📝 [Tier 1] Video ID:", videoId);
  console.log("📝 [Tier 1] Language:", lang);
  console.log("📝 [Tier 1] Two-step flow:", useTwoStepFlow ? "enabled" : "disabled");

  // Get client config (start with ANDROID for best compatibility)
  let clientConfig = getClientConfig();
  console.log(`📱 [Tier 1] Using client: ${clientConfig.name} v${clientConfig.version}`);
  
  // Get cookies from cookie manager
  let cookies = cookieManager.getCookies();
  console.log(`🍪 [Tier 1] Using cookies: ${cookies.substring(0, 50)}...`);

  // Try up to 2 client types if first fails
  const maxClientAttempts = 2;
  
  for (let clientAttempt = 0; clientAttempt < maxClientAttempts; clientAttempt++) {
    try {
      let html: string;
      
      if (useTwoStepFlow) {
        // Use two-step request flow (homepage → video page)
        console.log(`📋 [Tier 1] Using two-step request flow with ${clientConfig.name} client...`);
        const result = await twoStepRequestFlow(videoId, clientConfig, cookies);
        html = result.html;
        cookies = result.cookies;
      } else {
        // Single-step request (direct to video page)
        console.log(`📋 [Tier 1] Using single-step request with ${clientConfig.name} client...`);
        await randomDelay(2, 4); // 2-4 second delay
        
        const userAgent = getUserAgentForClient(clientConfig.name);
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        
        const response = await fetchWithRetry(
          videoUrl,
          {
            method: 'GET',
            headers: generateHeaders(userAgent, cookies, 'https://www.google.com/', clientConfig, false),
          },
          2,
          `video_page_${clientConfig.name}`
        );
        
        console.log(`📊 [Tier 1] Response status: ${response.status}`);
        html = await response.text();
        
        // Extract cookies from response
        const extractedCookies = cookieManager.extractCookiesFromResponse(response);
        if (extractedCookies.length > 0) {
          cookieManager.updateCookies(extractedCookies);
          cookies = extractedCookies.join('; ');
        }
      }
      
      console.log(`📊 [Tier 1] HTML length: ${html.length}`);
      
      // Check for blocking
      const blockCheck = isBlockedResponse(html);
      if (blockCheck.blocked) {
        console.log(`⚠️ [Tier 1] Request blocked: ${blockCheck.reason}`);
        if (clientAttempt < maxClientAttempts - 1) {
          console.log(`🔄 [Tier 1] Rotating to next client type...`);
          clientConfig = rotateClientConfig();
          await randomDelay(3, 5); // Wait before retry
          continue;
        }
        return { success: false, error: `Request blocked: ${blockCheck.reason}` };
      }

      // Extract INNERTUBE_API_KEY
      let apiKeyMatch = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/);
      if (!apiKeyMatch) {
        console.log(`🔍 [Tier 1] INNERTUBE_API_KEY not found, searching for alternative patterns...`);
        
        const altPatterns = [
          /"INNERTUBE_API_KEY":"([^"]+)"/,
          /INNERTUBE_API_KEY['"]\s*:\s*['"]([^'"]+)['"]/,
          /apiKey['"]\s*:\s*['"]([^'"]+)['"]/,
          /"key":"([^"]+)"/,
        ];
        
        for (const pattern of altPatterns) {
          const match = html.match(pattern);
          if (match) {
            console.log(`✅ [Tier 1] Found API key with pattern`);
            apiKeyMatch = match;
            break;
          }
        }
      }

      if (!apiKeyMatch || !apiKeyMatch[1]) {
        console.error(`❌ [Tier 1] INNERTUBE_API_KEY not found`);
        if (clientAttempt < maxClientAttempts - 1) {
          console.log(`🔄 [Tier 1] Rotating to next client type...`);
          clientConfig = rotateClientConfig();
          await randomDelay(3, 5);
          continue;
        }
        return { success: false, error: 'INNERTUBE_API_KEY not found in HTML' };
      }

      const apiKey = apiKeyMatch[1];
      console.log(`✅ [Tier 1] Found API key: ${apiKey.substring(0, 20)}...`);

      // Call YouTube Innertube API with retry
      console.log(`🔍 [Tier 1] Calling YouTube Innertube API with ${clientConfig.name} client...`);
      await randomDelay(1, 2); // Small delay before API call
      
      const userAgent = getUserAgentForClient(clientConfig.name);
      const apiUrl = `https://www.youtube.com/youtubei/v1/player?key=${apiKey}`;
      
      const apiResponse = await fetchWithRetry(
        apiUrl,
        {
          method: "POST",
          headers: generateHeaders(userAgent, cookies, 'https://www.youtube.com/', clientConfig, true),
          body: JSON.stringify({
            context: {
              client: {
                clientName: clientConfig.clientName,
                clientVersion: clientConfig.clientVersion,
              },
            },
            videoId,
          }),
        },
        3,
        `innertube_api_${clientConfig.name}`
      );
      
      console.log(`📊 [Tier 1] YouTube API response status: ${apiResponse.status}`);
      
      if (!apiResponse.ok) {
        if (apiResponse.status === 429 || apiResponse.status >= 500) {
          if (clientAttempt < maxClientAttempts - 1) {
            console.log(`🔄 [Tier 1] API error ${apiResponse.status}, rotating client...`);
            clientConfig = rotateClientConfig();
            await randomDelay(5, 8); // Longer delay for rate limits
            continue;
          }
        }
        // Read error text
        const errorText = await apiResponse.text();
        console.error(`❌ [Tier 1] API error: ${apiResponse.status} - ${errorText.substring(0, 200)}`);
        return { success: false, error: `API error: ${apiResponse.status}` };
      }
      
      const playerData = await apiResponse.json() as any;

        // Log the structure for debugging
      console.log(`🔍 [Tier 1] Player data keys:`, Object.keys(playerData || {}));
      console.log(`🔍 [Tier 1] Captions structure:`, playerData?.captions ? Object.keys(playerData.captions) : 'no captions key');
      
      // Try multiple paths to find caption tracks
      let tracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      
      // Alternative path 1: Check if captions is directly an array
      if ((!tracks || tracks.length === 0) && Array.isArray(playerData?.captions)) {
        console.log(`🔍 [Tier 1] Trying alternative path: captions is array`);
        tracks = playerData.captions;
      }
      
      // Alternative path 2: Check playerCaptionsTracklistRenderer directly
      if ((!tracks || tracks.length === 0) && playerData?.playerCaptionsTracklistRenderer) {
        console.log(`🔍 [Tier 1] Trying alternative path: playerCaptionsTracklistRenderer`);
        tracks = playerData.playerCaptionsTracklistRenderer.captionTracks;
      }
      
      // Alternative path 3: Check for audioTracks or other caption-related fields
      if ((!tracks || tracks.length === 0) && playerData?.captions?.audioTracks) {
        console.log(`🔍 [Tier 1] Trying alternative path: audioTracks`);
        tracks = playerData.captions.audioTracks;
      }
      
      // Alternative path 4: Deep search in captions object
      if ((!tracks || tracks.length === 0) && playerData?.captions) {
        console.log(`🔍 [Tier 1] Deep searching captions object...`);
        const deepSearch = (obj: any, depth = 0): any[] => {
          if (depth > 5) return []; // Prevent infinite recursion
          if (!obj || typeof obj !== 'object') return [];
          
          // Check if this object has captionTracks
          if (Array.isArray(obj.captionTracks) && obj.captionTracks.length > 0) {
            return obj.captionTracks;
          }
          
          // Recursively search
          for (const key in obj) {
            if (Array.isArray(obj[key]) && obj[key].length > 0) {
              const firstItem = obj[key][0];
              if (firstItem && typeof firstItem === 'object' && (firstItem.baseUrl || firstItem.languageCode || firstItem.vssId)) {
                console.log(`✅ [Tier 1] Found caption tracks at path: captions.${key}`);
                return obj[key];
              }
            }
            const result = deepSearch(obj[key], depth + 1);
            if (result.length > 0) return result;
          }
          return [];
        };
        const foundTracks = deepSearch(playerData.captions);
        if (foundTracks.length > 0) {
          tracks = foundTracks;
        }
      }
      
      console.log(`📊 [Tier 1] Found ${tracks?.length || 0} caption tracks`);

      if (tracks && tracks.length > 0) {
        console.log(`📊 [Tier 1] Available languages: ${tracks.map((t: any) => t.languageCode || t.language || t.vssId || 'unknown').join(', ')}`);
        console.log(`📊 [Tier 1] First track structure:`, JSON.stringify(tracks[0], null, 2).substring(0, 500));
      }

      if (!tracks || tracks.length === 0) {
        console.log(`❌ [Tier 1] No caption tracks found after trying all paths`);
        if (clientAttempt < maxClientAttempts - 1) {
          console.log(`🔄 [Tier 1] Rotating to next client type...`);
          clientConfig = rotateClientConfig();
          await randomDelay(3, 5);
          continue;
        }
        console.log(`🔍 [Tier 1] Full captions object (first 2000 chars):`, JSON.stringify(playerData?.captions, null, 2).substring(0, 2000));
        return { success: false, error: "No captions found for this video." };
      }

      // Find track for requested language or fallback to first available
      let track = tracks.find((t: any) => {
        const trackLang = t.languageCode || t.language || '';
        return trackLang === lang || trackLang.startsWith(lang);
      });
      if (!track) {
        console.log(`⚠️ [Tier 1] No captions for language '${lang}', falling back to first available track`);
        track = tracks[0];
      }

      const trackLang = track.languageCode || track.language || track.vssId || 'unknown';
      const trackName = track.name?.simpleText || track.name?.runs?.[0]?.text || track.name || 'Unknown';
      console.log(`✅ [Tier 1] Using caption track: ${trackLang} (${trackName})`);

      // Fetch transcript XML - try multiple possible baseUrl locations
      let baseUrl = track.baseUrl || track.url || track.base_url;
      if (!baseUrl) {
        // Try to construct from other fields
        if (track.vssId) {
          baseUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${trackLang}`;
        } else {
          console.error(`❌ [Tier 1] No baseUrl found in track:`, JSON.stringify(track, null, 2));
          if (clientAttempt < maxClientAttempts - 1) {
            console.log(`🔄 [Tier 1] Rotating to next client type...`);
            clientConfig = rotateClientConfig();
            await randomDelay(3, 5);
            continue;
          }
          return { success: false, error: "No transcript URL found in caption track" };
        }
      }
      
      baseUrl = baseUrl.replace(/&fmt=\w+$/, "");
      console.log(`🔍 [Tier 1] Fetching transcript from: ${baseUrl.substring(0, 100)}...`);

      // Use fetchWithRetry for transcript XML fetch
      const xmlResponse = await fetchWithRetry(
        baseUrl,
        {
          method: 'GET',
          headers: generateHeaders(userAgent, cookies, 'https://www.youtube.com/', clientConfig, false),
        },
        2,
        'transcript_xml'
      );

      console.log(`📊 [Tier 1] Transcript XML response status: ${xmlResponse.status}`);
      const xml = await xmlResponse.text();

      console.log(`📊 [Tier 1] Transcript XML length: ${xml.length}`);

      if (!xml || xml.trim().length === 0) {
        console.warn(`⚠️ [Tier 1] Empty XML response`);
        if (clientAttempt < maxClientAttempts - 1) {
          console.log(`🔄 [Tier 1] Rotating to next client type...`);
          clientConfig = rotateClientConfig();
          await randomDelay(3, 5);
          continue;
        }
        return { success: false, error: "Empty transcript response" };
      }

      // Parse XML
      console.log(`🔄 [Tier 1] Parsing XML with xml2js...`);
      const parsed = await parseStringPromise(xml);
      console.log(`✅ [Tier 1] XML parsed successfully`);

      if (!parsed.transcript || !parsed.transcript.text || !Array.isArray(parsed.transcript.text)) {
        console.warn(`⚠️ [Tier 1] Invalid XML structure`);
        if (clientAttempt < maxClientAttempts - 1) {
          console.log(`🔄 [Tier 1] Rotating to next client type...`);
          clientConfig = rotateClientConfig();
          await randomDelay(3, 5);
          continue;
        }
        return { success: false, error: "Invalid XML structure" };
      }

      console.log(`📊 [Tier 1] Number of text entries: ${parsed.transcript.text.length}`);

      // Extract transcript text
      const transcript = parsed.transcript.text
        .map((entry: any) => {
          if (typeof entry === "string") return entry;
          if (entry && typeof entry === "object" && entry._) return entry._;
          return "";
        })
        .filter((text: string) => text.trim().length > 0)
        .join(" ");

      if (!transcript || transcript.trim().length === 0) {
        console.warn(`⚠️ [Tier 1] Empty transcript after extraction`);
        if (clientAttempt < maxClientAttempts - 1) {
          console.log(`🔄 [Tier 1] Rotating to next client type...`);
          clientConfig = rotateClientConfig();
          await randomDelay(3, 5);
          continue;
        }
        return { success: false, error: "No transcript text found in XML" };
      }

      console.log(`✅ [Tier 1] SUCCESS! Transcript extracted successfully`);
      console.log(`📊 [Tier 1] Transcript length: ${transcript.length}`);
      console.log(`📝 [Tier 1] Transcript preview (first 200 chars): ${transcript.substring(0, 200)}`);
      console.log(`✅ [Tier 1] Successfully used ${clientConfig.name} client`);

      // Reset client config to default on success
      resetClientConfig();

      return {
        success: true,
        transcript: transcript.trim(),
      };
      
    } catch (error) {
      console.error(`❌ [Tier 1] Error with ${clientConfig.name} client:`, error);
      
      // If this was the last client attempt, return error
      if (clientAttempt === maxClientAttempts - 1) {
        console.error("❌ [Tier 1] All client attempts failed");
        console.error("❌ [Tier 1] Error details:", {
          message: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
        });
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error in Tier 1",
        };
      }
      
      // Try next client type
      console.log(`🔄 [Tier 1] Rotating to next client type and retrying...`);
      clientConfig = rotateClientConfig();
      await randomDelay(3, 5); // Wait before retry with different client
    }
  }
  
  // If we get here, all client attempts failed
  resetClientConfig();
  return {
    success: false,
    error: "All client type attempts failed",
  };
}

/**
 * Tier 2: Guaranteed Fallback - Use youtube-transcript-io API
 * This is a paid service but very reliable
 */
async function tier2YoutubeTranscriptIo(
  videoId: string
): Promise<{ success: boolean; transcript?: string; error?: string }> {
  console.log("🚀 [Tier 2] Starting youtube-transcript-io API fetch");
  console.log("📝 [Tier 2] Video ID:", videoId);

  // Check if API key is configured
  const apiKey = env.YT_TRANSCRIPT_IO_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    console.warn("⚠️ [Tier 2] YT_TRANSCRIPT_IO_KEY not configured - skipping Tier 2");
    return {
      success: false,
      error: "YT_TRANSCRIPT_IO_KEY not configured",
    };
  }

  console.log("✅ [Tier 2] API key found (length:", apiKey.length, "chars)");

  try {
    const apiUrl = "https://www.youtube-transcript.io/api/transcripts";
    console.log("🔗 [Tier 2] API URL:", apiUrl);

    const requestBody = {
      videoIds: [videoId],
    };
    console.log("📤 [Tier 2] Request body:", JSON.stringify(requestBody));

    console.log("🔄 [Tier 2] Sending POST request...");
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log("📊 [Tier 2] Response status:", response.status);
    console.log("📊 [Tier 2] Response headers:", Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [Tier 2] HTTP error response:", errorText);
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    console.log("📊 [Tier 2] Response data received");
    console.log("📊 [Tier 2] Response keys:", Object.keys(data));

    // Extract transcript from response
    // The API response structure may vary, so we need to handle different formats
    let transcript: string | undefined;

    if (data.transcripts && Array.isArray(data.transcripts) && data.transcripts.length > 0) {
      const firstTranscript = data.transcripts[0];
      if (firstTranscript.transcript) {
        transcript = firstTranscript.transcript;
      } else if (firstTranscript.text) {
        transcript = firstTranscript.text;
      }
    } else if (data.transcript) {
      transcript = data.transcript;
    } else if (data.text) {
      transcript = data.text;
    } else if (data[videoId] && data[videoId].transcript) {
      transcript = data[videoId].transcript;
    }

    if (!transcript || transcript.trim().length === 0) {
      console.warn("⚠️ [Tier 2] No transcript found in response");
      console.log("📊 [Tier 2] Full response structure:", JSON.stringify(data, null, 2));
      return {
        success: false,
        error: "No transcript found in API response",
      };
    }

    console.log("✅ [Tier 2] Transcript extracted successfully");
    console.log("📊 [Tier 2] Transcript length:", transcript.length);
    console.log("📝 [Tier 2] Transcript preview (first 200 chars):", transcript.substring(0, 200));

    return {
      success: true,
      transcript: transcript.trim(),
    };
  } catch (error) {
    console.error("❌ [Tier 2] Error occurred:", error);
    console.error("❌ [Tier 2] Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error in Tier 2",
    };
  }
}

/**
 * Main orchestrator function - tries all tiers sequentially until one succeeds
 */
export async function fetchTranscriptWithFallback(
  videoId: string,
  lang: string = "en"
): Promise<TranscriptResult> {
  console.log("=".repeat(60));
  console.log("🎬 [fetchTranscriptWithFallback] Starting transcript fetch");
  console.log("📝 [fetchTranscriptWithFallback] Video ID:", videoId);
  console.log("📝 [fetchTranscriptWithFallback] Language:", lang);
  console.log("=".repeat(60));

  // Validate video ID
  if (!videoId || videoId.trim().length !== 11) {
    console.error("❌ [fetchTranscriptWithFallback] Invalid video ID:", videoId);
    return {
      success: false,
      error: "Invalid video ID format",
    };
  }

  // Tier 1: Try YouTube Innertube API (the working method)
  console.log("\n📋 [fetchTranscriptWithFallback] Attempting Tier 1 (innertube-api)...");
  const tier1Result = await tier1InnertubeApi(videoId, lang);
  if (tier1Result.success && tier1Result.transcript) {
    console.log("✅ [fetchTranscriptWithFallback] Tier 1 SUCCEEDED!");
    console.log("=".repeat(60));
    return {
      success: true,
      source: "innertube-api",
      transcript: tier1Result.transcript,
    };
  }
  console.log("❌ [fetchTranscriptWithFallback] Tier 1 failed:", tier1Result.error);

  // Tier 2: Try youtube-transcript-io API
  console.log("\n📋 [fetchTranscriptWithFallback] Attempting Tier 2 (youtube-transcript-io)...");
  const tier2Result = await tier2YoutubeTranscriptIo(videoId);
  if (tier2Result.success && tier2Result.transcript) {
    console.log("✅ [fetchTranscriptWithFallback] Tier 2 SUCCEEDED!");
    console.log("=".repeat(60));
    return {
      success: true,
      source: "youtube-transcript-io",
      transcript: tier2Result.transcript,
    };
  }
  console.log("❌ [fetchTranscriptWithFallback] Tier 2 failed:", tier2Result.error);

  // All tiers failed
  console.log("\n❌ [fetchTranscriptWithFallback] ALL TIERS FAILED!");
  console.log("=".repeat(60));
  return {
    success: false,
    error: "Transcript not found or unavailable for this video. All tiers failed.",
  };
}

