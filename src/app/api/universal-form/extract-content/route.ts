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
    
    return NextResponse.json(
      { 
        error: 'Failed to extract content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
