import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/api-auth';
import { initializeTrial } from '@/lib/stripe/subscription-helpers';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;

    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const userId = body.userId || user.id;

    // Only allow users to initialize their own trial
    if (userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await initializeTrial(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error initializing trial:', error);
    return NextResponse.json(
      { error: 'Failed to initialize trial' },
      { status: 500 }
    );
  }
}

