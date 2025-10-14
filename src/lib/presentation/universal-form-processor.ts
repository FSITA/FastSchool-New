import { PDFDocument } from "pdf-lib";
import { parseStringPromise } from "xml2js";

// YouTube transcript function (reused from Quiz AI)
async function getYoutubeTranscript(
  videoId: string,
  language = "en"
): Promise<string> {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  // Enhanced headers with cookies to avoid blocking
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Referer': 'https://www.google.com/',
    'Cookie': 'CONSENT=YES+cb.20210328-17-p0.en+FX+667; YSC=dQw4w9WgXcQ; VISITOR_INFO1_LIVE=f0wojS1_1Zo; PREF=f4=4000000&tz=UTC',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'cross-site',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'DNT': '1',
    'x-youtube-client-name': '1',
    'x-youtube-client-version': '2.20231219.04.00'
  };

  console.log(`🔍 Fetching YouTube page: ${videoUrl}`);
  
  const response = await fetch(videoUrl, { headers });
  
  console.log(`📊 Response status: ${response.status}`);
  console.log(`📊 Response headers:`, Object.fromEntries(response.headers.entries()));
  
  const html = await response.text();
  console.log(`📊 HTML length: ${html.length}`);
  console.log(`📊 HTML preview: ${html.substring(0, 500)}...`);
  
  // Check for common blocking indicators
  if (html.includes('consent.google.com') || html.includes('consent.youtube.com')) {
    console.log('❌ YouTube consent page detected');
    throw new Error('YouTube consent page detected - need better cookies');
  }
  if (html.includes('bot detection') || html.includes('unusual traffic')) {
    console.log('❌ YouTube bot detection triggered');
    throw new Error('YouTube bot detection triggered');
  }
  if (html.includes('age verification')) {
    console.log('❌ YouTube age verification required');
    throw new Error('YouTube age verification required');
  }
  
  let apiKeyMatch = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/);
  if (!apiKeyMatch) {
    console.log(`❌ INNERTUBE_API_KEY not found in HTML`);
    console.log(`🔍 Searching for alternative patterns...`);
    
    // Try alternative patterns
    const altPatterns = [
      /"INNERTUBE_API_KEY":"([^"]+)"/,
      /INNERTUBE_API_KEY['"]\s*:\s*['"]([^'"]+)['"]/,
      /apiKey['"]\s*:\s*['"]([^'"]+)['"]/,
      /"key":"([^"]+)"/,
    ];
    
    for (const pattern of altPatterns) {
      const match = html.match(pattern);
      if (match) {
        console.log(`✅ Found API key with pattern: ${pattern}`);
        apiKeyMatch = match;
        break;
      }
    }
  }
  
  if (!apiKeyMatch) {
    console.log(`❌ All API key patterns failed. HTML length: ${html.length}`);
    throw new Error(`INNERTUBE_API_KEY not found. HTML length: ${html.length}`);
  }
  
  const apiKey = apiKeyMatch[1];
  if (!apiKey) {
    throw new Error("API key extraction failed - empty key");
  }
  
  console.log(`✅ Found API key: ${apiKey.substring(0, 20)}...`);

  console.log(`🔍 Calling YouTube API with key: ${apiKey.substring(0, 20)}...`);
  
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
        'Origin': 'https://www.youtube.com',
        'Cookie': 'CONSENT=YES+cb.20210328-17-p0.en+FX+667; YSC=dQw4w9WgXcQ; VISITOR_INFO1_LIVE=f0wojS1_1Zo'
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
  ).then((res) => {
    console.log(`📊 YouTube API response status: ${res.status}`);
    return res.json();
  }) as any;
  
  console.log(`📊 Player data received, checking for captions...`);

  const tracks =
    playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  
  console.log(`📊 Found ${tracks?.length || 0} caption tracks`);
  if (tracks && tracks.length > 0) {
    console.log(`📊 Available languages: ${tracks.map((t: any) => t.languageCode).join(', ')}`);
  }
  
  if (!tracks || tracks.length === 0) {
    console.log(`❌ No caption tracks found in player data`);
    throw new Error("No captions found for this video.");
  }

  let track = tracks.find((t: any) => t.languageCode === language);
  if (!track) {
    console.log(
      `⚠️ No captions for language '${language}', falling back to the first available track.`
    );
    track = tracks[0];
  }
  
  console.log(`✅ Using caption track: ${track.languageCode} (${track.name?.simpleText || 'Unknown'})`);

  const baseUrl = track.baseUrl.replace(/&fmt=\w+$/, "");
  console.log(`🔍 Fetching transcript from: ${baseUrl.substring(0, 100)}...`);
  
  const xml = await fetch(baseUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/xml, text/xml, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://www.youtube.com/',
      'Cookie': 'CONSENT=YES+cb.20210328-17-p0.en+FX+667'
    }
  }).then((res) => {
    console.log(`📊 Transcript XML response status: ${res.status}`);
    return res.text();
  });
  
  console.log(`📊 Transcript XML length: ${xml.length}`);
  const parsed = await parseStringPromise(xml);

  return parsed.transcript.text.map((entry: any) => entry._).join(" ");
}

export interface ProcessedContent {
  content: string;
  gradeLevel: string;
  language: string;
}

export async function processUniversalFormData(formData: FormData): Promise<ProcessedContent> {
  console.log("🔄 processUniversalFormData called");
  
  const files = formData.getAll("files") as File[];
  const notes = formData.get("notes") as string;
  const youtubeUrl = formData.get("youtubeUrl") as string;
  const wikipediaLink = formData.get("wikipediaLink") as string;
  const gradeLevel = formData.get("gradeLevel") as string;
  const language = formData.get("language") as string;
  const startPage = formData.get("startPage") as string;
  const endPage = formData.get("endPage") as string;

  console.log("📝 Processing universal form data:", {
    filesCount: files.length,
    hasNotes: !!notes,
    notesLength: notes?.length || 0,
    youtubeUrl,
    wikipediaLink,
    gradeLevel,
    language,
    startPage,
    endPage,
  });

  // Debug: Log all form data keys
  console.log("All form data keys:", Array.from(formData.keys()));

  let content = "";

  // Process YouTube URL
  if (youtubeUrl) {
    try {
      const videoIdMatch = youtubeUrl.match(
        /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
      );
      if (!videoIdMatch) {
        throw new Error("Invalid YouTube URL");
      }
      const videoId = videoIdMatch[1];
      if (!videoId) {
        throw new Error("Could not extract video ID from YouTube URL");
      }
      console.log(`Extracted video ID: ${videoId}`);

      content = await getYoutubeTranscript(videoId, "en");
      console.log("Successfully fetched YouTube transcript");
    } catch (error) {
      console.error("Error fetching YouTube transcript:", error);
      throw new Error("Error processing YouTube URL");
    }
  } 
  // Process Wikipedia Link
  else if (wikipediaLink) {
    try {
      const title = wikipediaLink.split("/").pop();
      if (!title) {
        throw new Error("Could not extract title from Wikipedia URL");
      }
      const response = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&format=json&titles=${title}`
      );
      const data = (await response.json()) as {
        query: { pages: { [key: string]: { extract: string } } };
      };
      const pages = data.query.pages;
      const pageId = Object.keys(pages)[0];
      if (!pageId || !pages[pageId]) {
        throw new Error("No Wikipedia page found");
      }
      content = pages[pageId].extract;
    } catch (error) {
      console.error("Error fetching Wikipedia content:", error);
      throw new Error("Error processing Wikipedia URL");
    }
  }
  // Process uploaded files
  else if (files.length > 0) {
    try {
      const fileContents = await Promise.all(
        files.map(async (file) => {
          const arrayBuffer = await file.arrayBuffer();
          let buffer = Buffer.from(arrayBuffer);

          // Handle PDF page range if specified
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

          // Extract text content from PDF files
          if (file.type === "application/pdf") {
            try {
              // Convert PDF to base64 and send to Gemini for text extraction
              const base64Content = buffer.toString("base64");
              
              // Use Gemini to extract text from PDF
              const { GoogleGenerativeAI } = await import("@google/generative-ai");
              const { env } = await import("@/env");
              const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
              const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
              
              const result = await model.generateContent([
                {
                  inlineData: {
                    mimeType: "application/pdf",
                    data: base64Content,
                  },
                },
                "Extract all text content from this PDF document. Return only the text content without any formatting or additional commentary."
              ]);
              
              const extractedText = result.response.text();
              console.log(`Successfully extracted text from PDF: ${file.name}`);
              return extractedText;
            } catch (error) {
              console.error(`Error extracting text from PDF ${file.name}:`, error);
              // Fallback to filename if extraction fails
              return `Content from file: ${file.name} (text extraction failed)`;
            }
          } else {
            // For non-PDF files, return filename for now
            return `Content from file: ${file.name}`;
          }
        })
      );

      content = fileContents.join("\n\n");
    } catch (error) {
      console.error("Error processing files:", error);
      throw new Error("Error processing uploaded files");
    }
  }
  // Use text notes
  else if (notes) {
    console.log("📝 Using text notes as content");
    content = notes;
  }

  console.log("📊 Final content length:", content.length);

  if (!content) {
    console.log("❌ No content found");
    throw new Error("Please provide either a file, notes, YouTube URL, or Wikipedia link");
  }

  const result = {
    content,
    gradeLevel: gradeLevel || "secondary",
    language: language || "english",
  };
  
  console.log("✅ processUniversalFormData completed:", {
    contentLength: result.content.length,
    gradeLevel: result.gradeLevel,
    language: result.language
  });

  return result;
}
