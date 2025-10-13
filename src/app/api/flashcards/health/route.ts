import { NextResponse } from 'next/server'

export async function GET() {
  try {
    return NextResponse.json({
      status: 'healthy',
      version: '1.0.0',
      message: 'AI Flashcard Generator API is running'
    })
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Health check failed' 
      },
      { status: 500 }
    )
  }
}
