import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/api-auth';
import { initializeTrial } from '@/lib/stripe/subscription-helpers';

export async function POST(request: NextRequest) {
  console.log('[INITIALIZE-TRIAL API] ========== REQUEST RECEIVED ==========');
  console.log('[INITIALIZE-TRIAL API] Timestamp:', new Date().toISOString());

  try {
    // Step 1: Verify authentication
    console.log('[INITIALIZE-TRIAL API] Step 1: Verifying authentication...');
    const authResult = await verifyAuth(request);
    
    if (authResult instanceof NextResponse) {
      console.error('[INITIALIZE-TRIAL API] ❌ Authentication failed');
      return authResult;
    }
    
    const { user } = authResult;
    console.log('[INITIALIZE-TRIAL API] ✅ Authentication successful:', {
      userId: user?.id,
      email: user?.email,
    });

    if (!user?.id) {
      console.error('[INITIALIZE-TRIAL API] ❌ User ID is missing');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Step 2: Parse request body
    console.log('[INITIALIZE-TRIAL API] Step 2: Parsing request body...');
    let body;
    try {
      body = await request.json();
      console.log('[INITIALIZE-TRIAL API] Request body:', body);
    } catch (parseError) {
      console.error('[INITIALIZE-TRIAL API] ❌ Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const userId = body.userId || user.id;
    console.log('[INITIALIZE-TRIAL API] User ID to initialize:', userId);

    // Only allow users to initialize their own trial
    if (userId !== user.id) {
      console.error('[INITIALIZE-TRIAL API] ❌ User ID mismatch:', {
        requested: userId,
        authenticated: user.id,
      });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Step 3: Initialize trial
    console.log('[INITIALIZE-TRIAL API] Step 3: Calling initializeTrial...');
    const subscription = await initializeTrial(userId);
    
    console.log('[INITIALIZE-TRIAL API] ✅✅✅ TRIAL INITIALIZED SUCCESSFULLY ✅✅✅');
    console.log('[INITIALIZE-TRIAL API] Subscription result:', {
      id: subscription.id,
      status: subscription.subscriptionStatus,
      trialEnd: subscription.trialEnd?.toISOString(),
    });

    return NextResponse.json({ 
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.subscriptionStatus,
        trialEnd: subscription.trialEnd?.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[INITIALIZE-TRIAL API] ❌❌❌ ERROR ❌❌❌');
    console.error('[INITIALIZE-TRIAL API] Error type:', typeof error);
    console.error('[INITIALIZE-TRIAL API] Error name:', error?.name);
    console.error('[INITIALIZE-TRIAL API] Error message:', error?.message);
    console.error('[INITIALIZE-TRIAL API] Error code:', error?.code);
    console.error('[INITIALIZE-TRIAL API] Error stack:', error?.stack);
    console.error('[INITIALIZE-TRIAL API] Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    return NextResponse.json(
      { 
        error: 'Failed to initialize trial',
        details: error?.message || 'Unknown error',
        code: error?.code,
      },
      { status: 500 }
    );
  }
}

