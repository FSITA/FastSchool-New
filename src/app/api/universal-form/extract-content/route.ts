import { NextRequest, NextResponse } from 'next/server'
import { processUniversalFormData, ProcessedContent } from '@/lib/presentation/universal-form-processor'
import { verifyAuth } from '@/lib/auth/api-auth'

/**
 * POST /api/universal-form/extract-content
 * 
 * Extracts content from universal form data (PDF, YouTube, Wikipedia, Notes)
 * Does NOT call Gemini - only extraction
 * 
 * Request: FormData with universal form fields
 * Response: ProcessedContent JSON with extracted content
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (authResult instanceof Response) {
      return authResult;
    }

    console.log("🔄 [extract-content] Starting content extraction");
    
    const formData = await request.formData();
    
    console.log("📝 [extract-content] Form data keys:", Array.from(formData.keys()));
    
    // Process the universal form data to get content
    const processedData = await processUniversalFormData(formData);
    
    console.log("✅ [extract-content] Content extracted successfully:", {
      contentLength: processedData.content.length,
      gradeLevel: processedData.gradeLevel,
      language: processedData.language,
      isSpecialNeeds: processedData.isSpecialNeeds,
      disabilityType: processedData.disabilityType,
    });
    
    return NextResponse.json(processedData);
  } catch (error) {
    console.error('❌ [extract-content] Error processing universal form data:', error);
    
    const errorMsg = error instanceof Error ? error.message : 'Errore sconosciuto';
    // Translate common error messages (handle both English and already-translated Italian)
    let translatedError = errorMsg;
    if (errorMsg.includes('Error processing YouTube URL') || errorMsg.includes("Errore durante l'elaborazione dell'URL di YouTube")) {
      // Remove the prefix if present
      translatedError = errorMsg.replace(/^(Error processing YouTube URL|Errore durante l'elaborazione dell'URL di YouTube):?\s*/i, '');
    } else if (errorMsg.includes('Error processing Wikipedia URL') || errorMsg.includes("Errore durante l'elaborazione dell'URL di Wikipedia")) {
      // Remove the prefix if present
      translatedError = errorMsg.replace(/^(Error processing Wikipedia URL|Errore durante l'elaborazione dell'URL di Wikipedia):?\s*/i, '');
    } else if (errorMsg === 'Failed to extract content' || errorMsg.includes('Failed to extract')) {
      translatedError = 'Impossibile estrarre il contenuto';
    }
    
    return NextResponse.json(
      { 
        error: 'Impossibile estrarre il contenuto',
        details: translatedError
      },
      { status: 500 }
    );
  }
}
