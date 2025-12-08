import { fetchTranscriptWithFallback } from "@/lib/youtube-transcript/youtube-transcript-service";
import { randomInt } from "crypto";
import { fetchWithRetry, delay } from "@/lib/youtube-transcript/request-utils";

/**
 * YouTube transcript function - Uses 2-tier fallback system
 * Tier 1: YouTube Innertube API (extracts API key from YouTube page)
 * Tier 2: Gemini summary transcription (gemini-2.5-flash)
 * 
 * @param videoId - YouTube video ID (11 characters)
 * @param language - Language code (default: "en")
 * @returns Promise<string> - Full transcript text
 * @throws Error if all tiers fail
 */
async function getYoutubeTranscript(
  videoId: string,
  language = "en"
): Promise<string> {
  console.log("=".repeat(60));
  console.log("🎬 [getYoutubeTranscript] Starting transcript fetch");
  console.log("📝 [getYoutubeTranscript] Video ID:", videoId);
  console.log("📝 [getYoutubeTranscript] Language:", language);
  console.log("=".repeat(60));

  // Validate video ID
  if (!videoId || videoId.trim().length !== 11) {
    console.error("❌ [getYoutubeTranscript] Invalid video ID format:", videoId);
    throw new Error("Invalid video ID format. Video ID must be 11 characters.");
  }

  // Fetch transcript using 2-tier fallback system (Innertube → Gemini fallback)
  console.log("🔄 [getYoutubeTranscript] Calling fetchTranscriptWithFallback...");
  const result = await fetchTranscriptWithFallback(videoId, language);

  console.log("📊 [getYoutubeTranscript] Result:", {
    success: result.success,
    source: result.source,
    transcriptLength: result.transcript?.length || 0,
    error: result.error,
  });

  // Check if fetch was successful
  if (!result.success || !result.transcript) {
    console.error("❌ [getYoutubeTranscript] Failed to fetch transcript");
    console.error("❌ [getYoutubeTranscript] Error:", result.error);
    console.log("=".repeat(60));
    throw new Error(
      result.error || "Trascrizione non trovata o non disponibile per questo video. Tutti i metodi sono falliti."
    );
  }

  console.log("✅ [getYoutubeTranscript] Successfully fetched transcript");
  console.log("📝 [getYoutubeTranscript] Source:", result.source);
  console.log("📊 [getYoutubeTranscript] Transcript length:", result.transcript.length);
  console.log("=".repeat(60));

  return result.transcript;
}

/**
 * Extracts video ID from YouTube URL
 * @param youtubeUrl - YouTube URL
 * @returns Video ID or null if invalid
 */
function extractVideoIdFromUrl(youtubeUrl: string): string | null {
  const videoIdMatch = youtubeUrl.trim().match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  );
  return videoIdMatch?.[1] || null;
}

/**
 * Processes YouTube URL and returns transcript content
 * @param youtubeUrl - YouTube URL
 * @param strictMode - If true, throws error on failure. If false, returns null on failure
 * @returns Transcript content or null if failed (in non-strict mode)
 * @throws Error if strictMode is true and processing fails
 */
async function processYouTubeUrl(
  youtubeUrl: string,
  strictMode: boolean = true
): Promise<string | null> {
  const context = strictMode ? "[processYouTubeUrl] (strict)" : "[processYouTubeUrl] (fallback)";
  
  console.log("=".repeat(60));
  console.log(`🎬 ${context} Processing YouTube URL`);
  console.log("=".repeat(60));
  
  console.log(`📝 ${context} YouTube URL:`, youtubeUrl);
  
  try {
    console.log(`🔍 ${context} Extracting video ID from URL...`);
    const videoId = extractVideoIdFromUrl(youtubeUrl);
    
    if (!videoId) {
      const errorMsg = "Invalid YouTube URL or could not extract video ID";
      console.error(`❌ ${context} ${errorMsg}`);
      if (strictMode) {
        throw new Error(errorMsg);
      }
      return null;
    }
    
    console.log(`✅ ${context} Extracted video ID:`, videoId);
    
    console.log(`🔄 ${context} Calling getYoutubeTranscript...`);
    const content = await getYoutubeTranscript(videoId, "en");
    
    console.log(`✅ ${context} Successfully fetched YouTube transcript`);
    console.log(`📊 ${context} Content length:`, content.length);
    console.log(`📝 ${context} Content preview (first 200 chars):`, content.substring(0, 200));
    console.log("=".repeat(60));
    
    return content;
  } catch (error) {
    console.error(`❌ ${context} Error fetching YouTube transcript:`, error);
    console.error(`❌ ${context} Error details:`, {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    console.log("=".repeat(60));
    
    if (strictMode) {
      const errorMsg = error instanceof Error ? error.message : 'Errore sconosciuto';
      // Translate common error messages
      let translatedError = errorMsg;
      if (errorMsg.includes('Transcript not found') || errorMsg.includes('Trascrizione non trovata')) {
        translatedError = 'Trascrizione non trovata o non disponibile per questo video. Tutti i metodi sono falliti.';
      } else if (errorMsg.includes('Error processing YouTube URL')) {
        translatedError = `Errore durante l'elaborazione dell'URL di YouTube: ${errorMsg.replace('Error processing YouTube URL: ', '')}`;
      }
      throw new Error(`Errore durante l'elaborazione dell'URL di YouTube: ${translatedError}`);
    }
    return null;
  }
}

/**
 * Processes Wikipedia link and returns content
 * @param wikipediaLink - Wikipedia URL
 * @param strictMode - If true, throws error on failure. If false, returns null on failure
 * @returns Wikipedia content or null if failed (in non-strict mode)
 * @throws Error if strictMode is true and processing fails
 */
async function processWikipediaLink(
  wikipediaLink: string,
  strictMode: boolean = true
): Promise<string | null> {
  try {
    const title = wikipediaLink.trim().split("/").pop();
    if (!title) {
      const errorMsg = "Impossibile estrarre il titolo dall'URL di Wikipedia";
      if (strictMode) {
        throw new Error(`Errore durante l'elaborazione dell'URL di Wikipedia: ${errorMsg}`);
      }
      return null;
    }
    
    // Decode URL-encoded characters in the title
    const decodedTitle = decodeURIComponent(title);
    console.log(`🔍 Fetching Wikipedia content for: ${decodedTitle}`);
    
    // Add a small delay before request to avoid rate limiting
    await delay(500); // 500ms delay
    
    // Wikipedia API requires User-Agent header
    const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&format=json&titles=${encodeURIComponent(decodedTitle)}`;
    
    const response = await fetchWithRetry(
      apiUrl,
      {
        method: 'GET',
        headers: {
          'User-Agent': 'Fastschool-Presentation-AI/1.0 (https://fastschool.ai; contact@fastschool.ai)',
          'Accept': 'application/json',
        },
      },
      3, // maxRetries: 3 attempts
      'wikipedia_api'
    );
    
    if (!response.ok) {
      let errorMsg = `Errore API Wikipedia: ${response.status}`;
      if (response.status === 429) {
        errorMsg = 'Errore API Wikipedia: 429 (Troppe richieste). Riprova tra qualche istante.';
      }
      if (strictMode) {
        throw new Error(`Errore durante l'elaborazione dell'URL di Wikipedia: ${errorMsg}`);
      }
      return null;
    }
    
    const data = (await response.json()) as {
      query: { pages: { [key: string]: { extract: string } } };
    };
    
    console.log("📊 Wikipedia API response:", data);
    
    const pages = data.query.pages;
    const pageId = Object.keys(pages)[0];
    
    if (!pageId || !pages[pageId] || pageId === "-1") {
      const errorMsg = "Pagina Wikipedia non trovata";
      if (strictMode) {
        throw new Error(`Errore durante l'elaborazione dell'URL di Wikipedia: ${errorMsg}`);
      }
      return null;
    }
    
    const extract = pages[pageId].extract;
    if (!extract || extract.trim().length === 0) {
      const errorMsg = "La pagina Wikipedia non ha contenuto";
      if (strictMode) {
        throw new Error(`Errore durante l'elaborazione dell'URL di Wikipedia: ${errorMsg}`);
      }
      return null;
    }
    
    // Clean and truncate content
    const content = extract
      .replace(/\n+/g, ' ') // Replace multiple newlines with single space
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim()
      .substring(0, 3500); // Limit to 3500 characters
    
    console.log(`✅ Wikipedia content processed: ${content.length} characters`);
    console.log(`📝 Content preview: ${content.substring(0, 100)}...`);
    
    return content;
  } catch (error) {
    console.error("Error fetching Wikipedia content:", error);
    if (strictMode) {
      const errorMsg = error instanceof Error ? error.message : 'Errore sconosciuto';
      // If error already contains our translated prefix, use it as-is
      if (errorMsg.includes("Errore durante l'elaborazione dell'URL di Wikipedia")) {
        throw new Error(errorMsg);
      }
      // Translate common error messages
      let translatedError = errorMsg;
      if (errorMsg.includes('Wikipedia API error: 429') || errorMsg.includes('429')) {
        translatedError = 'Errore API Wikipedia: 429 (Troppe richieste). Riprova tra qualche istante.';
      } else if (errorMsg.includes('Wikipedia API error')) {
        translatedError = errorMsg.replace('Wikipedia API error', 'Errore API Wikipedia');
      } else if (errorMsg.includes('Could not extract title')) {
        translatedError = 'Impossibile estrarre il titolo dall\'URL di Wikipedia';
      } else if (errorMsg.includes('No Wikipedia page found')) {
        translatedError = 'Pagina Wikipedia non trovata';
      } else if (errorMsg.includes('Wikipedia page has no content')) {
        translatedError = 'La pagina Wikipedia non ha contenuto';
      }
      throw new Error(`Errore durante l'elaborazione dell'URL di Wikipedia: ${translatedError}`);
    }
    return null;
  }
}

/**
 * Maximum number of pages Gemini should receive from a PDF.
 */
const MAX_PDF_PAGES = 5;

interface SelectedPdfPagesResult {
  /**
   * Zero-indexed page numbers to extract.
   */
  selectedPages: number[];
  /**
   * The original range requested after clamping to the document bounds.
   */
  requestedRange: { start: number; end: number };
  /**
   * Whether the pages were randomly sampled (true) or the full range was used (false).
   */
  randomized: boolean;
}

/**
 * Determines which PDF pages should be extracted and ensures Gemini never receives
 * more than MAX_PDF_PAGES pages. When the candidate range is larger than the limit,
 * a random subset of distinct pages is selected.
 */
function selectPdfPages(
  totalPages: number,
  startPage?: number,
  endPage?: number
): SelectedPdfPagesResult {
  if (totalPages <= 0) {
    throw new Error("PDF has no pages to extract");
  }

  const normalizedStart =
    startPage && startPage >= 1 ? Math.min(startPage, totalPages) : 1;

  const normalizedEnd =
    endPage && endPage >= normalizedStart
      ? Math.min(endPage, totalPages)
      : totalPages;

  const requestedPages: number[] = [];
  for (let page = normalizedStart; page <= normalizedEnd; page++) {
    requestedPages.push(page);
  }

  if (requestedPages.length === 0) {
    throw new Error("The requested PDF page range is empty");
  }

  if (requestedPages.length <= MAX_PDF_PAGES) {
    return {
      selectedPages: requestedPages.map((page) => page - 1),
      requestedRange: { start: normalizedStart, end: normalizedEnd },
      randomized: false,
    };
  }

  const sampledPages = new Set<number>();
  while (sampledPages.size < MAX_PDF_PAGES) {
    const randomIndex = randomInt(requestedPages.length);
    const pageNumber = requestedPages[randomIndex];
    if (pageNumber === undefined) {
      continue;
    }
    sampledPages.add(pageNumber);
  }

  const selectedPages = Array.from(sampledPages)
    .sort((a, b) => a - b)
    .map((page) => page - 1);

  console.log(
    `📄 Randomly sampled PDF pages for extraction: ${Array.from(sampledPages).sort(
      (a, b) => a - b
    ).join(", ")} (from requested range ${normalizedStart}-${normalizedEnd})`
  );

  return {
    selectedPages,
    requestedRange: { start: normalizedStart, end: normalizedEnd },
    randomized: true,
  };
}

/**
 * Processes a single PDF file and extracts text using Gemini API only
 * Removed problematic client-side extraction - using only Gemini for reliability
 * @param file - PDF file
 * @param startPage - Starting page (1-indexed, optional)
 * @param endPage - Ending page (1-indexed, optional)
 * @returns Extracted text content
 */
async function processPdfFile(
  file: File,
  startPage?: number,
  endPage?: number
): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let pdfBuffer = buffer;
    let selectedPageNumbers: number[] = [];
    let pagesRandomized = false;
    let requestedRange: { start: number; end: number } | null = null;

    // Always limit the PDF to the sampled pages before sending to Gemini.
    try {
      const { PDFDocument } = await import("pdf-lib");
      const sourcePdf = await PDFDocument.load(buffer);
      const totalPages = sourcePdf.getPageCount();

      const selection = selectPdfPages(totalPages, startPage, endPage);
      const { selectedPages } = selection;
      requestedRange = selection.requestedRange;
      pagesRandomized = selection.randomized;

      selectedPageNumbers = selectedPages.map((page) => page + 1);

      const targetPdf = await PDFDocument.create();
      const copiedPages = await targetPdf.copyPages(sourcePdf, selectedPages);
      copiedPages.forEach((page) => targetPdf.addPage(page));
      pdfBuffer = Buffer.from(await targetPdf.save());

      if (pagesRandomized) {
        console.log(
          `🎲 Gemini will receive ${selectedPageNumbers.length} randomly sampled pages (${selectedPageNumbers.join(
            ", "
          )}) from requested range ${requestedRange.start}-${requestedRange.end}`
        );
      } else {
        console.log(
          `📄 Gemini will receive all ${selectedPageNumbers.length} requested pages (${selectedPageNumbers.join(
            ", "
          )})`
        );
      }
    } catch (pdfLibError) {
      console.error(
        `❌ Failed to prepare limited PDF pages for extraction: ${pdfLibError}`
      );
      throw new Error(
        "Could not prepare PDF pages for extraction. Please try again with a different file or page range."
      );
    }
    
    // Convert PDF to base64 and send to Gemini for text extraction
    const base64Content = pdfBuffer.toString("base64");
    
    // Use Gemini to extract text from PDF
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const { env } = await import("@/env");
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    // Build prompt with page range if specified
    let prompt =
      "Extract all text content from the provided pages of this PDF document. These pages represent a sample of the full document. Return only the text content you receive without any additional commentary.";
    
    if (!pagesRandomized && requestedRange) {
      if (requestedRange.start === 1 && requestedRange.end === selectedPageNumbers.length) {
        // Whole document (≤ MAX_PDF_PAGES)
        prompt =
          "Extract all text content from the provided pages of this PDF document. Return only the text content without any formatting or additional commentary.";
      } else {
        prompt = `Extract text content from pages ${requestedRange.start} to ${requestedRange.end} of this PDF document. Return only the text content from these pages without any formatting or additional commentary.`;
      }
    }
    
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: "application/pdf",
          data: base64Content,
        },
      },
      prompt,
    ]);
    
    const extractedText = result.response.text();
    console.log(
      `✅ Gemini extraction successful: ${file.name} ` +
      (selectedPageNumbers.length > 0
        ? `(pages ${selectedPageNumbers.join(", ")})`
        : "(no page metadata)")
    );
    return extractedText;
  } catch (error) {
    console.error(`❌ Error extracting text from PDF ${file.name}:`, error);
    throw new Error(`Failed to extract text from PDF: ${file.name}. ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Processes uploaded files and returns combined content
 * @param files - Array of files
 * @param strictMode - If true, throws error on failure. If false, returns null on failure
 * @param startPage - Starting page for PDF extraction (1-indexed, optional)
 * @param endPage - Ending page for PDF extraction (1-indexed, optional)
 * @returns Combined file content or null if failed (in non-strict mode)
 * @throws Error if strictMode is true and processing fails
 */
async function processPdfFiles(
  files: File[],
  strictMode: boolean = true,
  startPage?: number,
  endPage?: number
): Promise<string | null> {
  if (files.length === 0 || files.every(f => !f || f.size === 0)) {
    const errorMsg = "Please upload a file";
    if (strictMode) {
      throw new Error(errorMsg);
    }
    return null;
  }
  
  try {
    const fileContents = await Promise.all(
      files.map(async (file) => {
        if (file.type === "application/pdf") {
          return await processPdfFile(file, startPage, endPage);
        } else {
          // For non-PDF files, return filename for now
          return `Content from file: ${file.name}`;
        }
      })
    );
    
    return fileContents.join("\n\n");
  } catch (error) {
    console.error("Error processing files:", error);
    if (strictMode) {
      throw new Error("Error processing uploaded files");
    }
    return null;
  }
}

export interface ProcessedContent {
  content: string;
  gradeLevel: string;
  language: string;
  isSpecialNeeds?: boolean;
  disabilityType?: string;
}

export async function processUniversalFormData(formData: FormData): Promise<ProcessedContent> {
  console.log("🔄 processUniversalFormData called");
  
  // Check if pre-extracted content is available (for faster processing)
  const extractedContent = formData.get("extractedContent") as string;
  const extractedGradeLevel = formData.get("extractedGradeLevel") as string;
  const extractedLanguage = formData.get("extractedLanguage") as string;
  const extractedIsSpecialNeeds = formData.get("extractedIsSpecialNeeds") as string;
  const extractedDisabilityType = formData.get("extractedDisabilityType") as string;

  if (extractedContent && extractedContent.trim().length > 0) {
    console.log("✅ Using pre-extracted content (skipping extraction)");
    console.log("📊 Pre-extracted content:", {
      contentLength: extractedContent.length,
      gradeLevel: extractedGradeLevel || formData.get("gradeLevel") as string || "secondary",
      language: extractedLanguage || formData.get("language") as string || "english",
      isSpecialNeeds: extractedIsSpecialNeeds === "true",
      disabilityType: extractedDisabilityType || undefined,
    });

    return {
      content: extractedContent,
      gradeLevel: extractedGradeLevel || formData.get("gradeLevel") as string || "secondary",
      language: extractedLanguage || formData.get("language") as string || "english",
      isSpecialNeeds: extractedIsSpecialNeeds === "true",
      disabilityType: extractedDisabilityType || undefined,
    };
  }

  // If no pre-extracted content, proceed with extraction
  console.log("📝 No pre-extracted content found, proceeding with extraction");
  
  const files = formData.getAll("files") as File[];
  const notes = formData.get("notes") as string;
  const youtubeUrl = formData.get("youtubeUrl") as string;
  const wikipediaLink = formData.get("wikipediaLink") as string;
  const gradeLevel = formData.get("gradeLevel") as string;
  const language = formData.get("language") as string;
  const startPage = formData.get("startPage") as string;
  const endPage = formData.get("endPage") as string;
  const isSpecialNeeds = formData.get("isSpecialNeeds") as string;
  const disabilityType = formData.get("disabilityType") as string;

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
    isSpecialNeeds,
    disabilityType,
  });

  // Debug: Log all form data keys
  console.log("All form data keys:", Array.from(formData.keys()));

  let content = "";

  // Get the step to determine which input type was selected
  const step = formData.get("step") as string;
  const activeStep = step ? parseInt(step, 10) : -1;

  // Helper function to check if a string has meaningful content
  const hasContent = (value: string | null | undefined): boolean => {
    return !!value && typeof value === 'string' && value.trim().length > 0;
  };

  console.log("📊 Active step:", activeStep, {
    step0: "Notes",
    step1: "Files",
    step2: "YouTube",
    step3: "Wikipedia"
  });

  // Process based on active step
  // If step is provided, only process that input type (strict mode)
  // Otherwise, check for content in priority order (fallback)
  let processed = false;

  // Process YouTube URL (step 2) - Strict mode
  if (activeStep === 2) {
    if (!hasContent(youtubeUrl)) {
      throw new Error("YouTube URL is required");
    }
    const youtubeContent = await processYouTubeUrl(youtubeUrl, true);
    if (!youtubeContent) {
      throw new Error("Failed to process YouTube URL");
    }
    content = youtubeContent;
    processed = true;
  }
  // Process Wikipedia Link (step 3) - Strict mode
  else if (activeStep === 3) {
    if (!hasContent(wikipediaLink)) {
      throw new Error("Wikipedia link is required");
    }
    const wikipediaContent = await processWikipediaLink(wikipediaLink, true);
    if (!wikipediaContent) {
      throw new Error("Failed to process Wikipedia link");
    }
    content = wikipediaContent;
    processed = true;
  }
  // Process uploaded files (step 1) - Strict mode
  else if (activeStep === 1) {
    // Parse page range from formData (silently limited to max 10 pages in backend)
    const parsedStartPage = startPage ? parseInt(startPage, 10) : undefined;
    const parsedEndPage = endPage ? parseInt(endPage, 10) : undefined;
    
    const filesContent = await processPdfFiles(
      files, 
      true, 
      parsedStartPage, 
      parsedEndPage
    );
    if (!filesContent) {
      throw new Error("Failed to process uploaded files");
    }
    content = filesContent;
    processed = true;
  }
  // Use text notes (step 0) - Strict mode
  else if (activeStep === 0) {
    if (!hasContent(notes)) {
      throw new Error("Notes are required");
    }
    console.log("📝 Using text notes as content");
    content = notes.trim();
    processed = true;
  }
  // Fallback: if no step provided, check for content in priority order
  else if (activeStep === -1) {
    console.log("=".repeat(60));
    console.log("🔄 [processUniversalFormData] Fallback mode (activeStep = -1)");
    console.log("=".repeat(60));
    
    // Try YouTube processing (non-strict mode)
    if (!processed && hasContent(youtubeUrl)) {
      console.log("📝 [processUniversalFormData] Found YouTube URL in fallback mode");
      const youtubeContent = await processYouTubeUrl(youtubeUrl, false);
      if (youtubeContent) {
        content = youtubeContent;
          processed = true;
      }
    }
    
    // Try Wikipedia processing (non-strict mode)
    if (!processed && hasContent(wikipediaLink)) {
      const wikipediaContent = await processWikipediaLink(wikipediaLink, false);
      if (wikipediaContent) {
        content = wikipediaContent;
                processed = true;
      }
    }
    
    // Try file processing (non-strict mode)
    if (!processed && files.length > 0 && !files.every(f => !f || f.size === 0)) {
      // Parse page range from formData (silently limited to max 10 pages in backend)
      const parsedStartPage = startPage ? parseInt(startPage, 10) : undefined;
      const parsedEndPage = endPage ? parseInt(endPage, 10) : undefined;
      
      const filesContent = await processPdfFiles(
        files, 
        false, 
        parsedStartPage, 
        parsedEndPage
      );
      if (filesContent) {
        content = filesContent;
        processed = true;
      }
    }
    
    // Try notes processing
    if (!processed && hasContent(notes)) {
      content = notes.trim();
      processed = true;
    }
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
    isSpecialNeeds: isSpecialNeeds === "true",
    disabilityType: disabilityType || undefined,
  };
  
  console.log("✅ processUniversalFormData completed:", {
    contentLength: result.content.length,
    gradeLevel: result.gradeLevel,
    language: result.language,
    isSpecialNeeds: result.isSpecialNeeds,
    disabilityType: result.disabilityType
  });

  return result;
}

