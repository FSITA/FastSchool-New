import { NextRequest, NextResponse } from 'next/server'
import { processUniversalFormData } from '@/lib/presentation/universal-form-processor'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    console.log("🔄 Processing universal form data on server side")
    
    // Process the universal form data to get content
    const processedData = await processUniversalFormData(formData)
    
    console.log("✅ Universal form data processed successfully:", {
      contentLength: processedData.content.length,
      gradeLevel: processedData.gradeLevel,
      language: processedData.language,
    })
    
    return NextResponse.json(processedData)
  } catch (error) {
    console.error('❌ Error processing universal form data:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to process content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
