import { createClient } from '@/lib/supabase/server'
import { env } from '@/env'

const BUCKET_NAME = 'presentation-images'

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

export async function uploadToSupabaseStorage(
  file: Buffer | File,
  filename: string,
  contentType: string
): Promise<UploadResult> {
  try {
    // Check if Supabase is configured
    if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('[STORAGE] Supabase not configured, falling back to local storage')
      return { success: false, error: 'Supabase not configured' }
    }

    const supabase = createClient()
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, file, {
        contentType,
        upsert: false
      })

    if (error) {
      console.error('[STORAGE] Upload error:', error)
      return { success: false, error: error.message }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filename)

    return {
      success: true,
      url: urlData.publicUrl
    }
  } catch (error) {
    console.error('[STORAGE] Unexpected error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export async function deleteFromSupabaseStorage(filename: string): Promise<boolean> {
  try {
    if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return false
    }

    const supabase = createClient()
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filename])

    return !error
  } catch (error) {
    console.error('[STORAGE] Delete error:', error)
    return false
  }
}
