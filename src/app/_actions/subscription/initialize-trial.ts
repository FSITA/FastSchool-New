'use server'

import { initializeTrial } from '@/lib/stripe/subscription-helpers'

export async function initializeUserTrial(userId: string) {
  try {
    await initializeTrial(userId)
    return { success: true }
  } catch (error) {
    console.error('Error initializing trial:', error)
    return { success: false, error: 'Failed to initialize trial' }
  }
}

