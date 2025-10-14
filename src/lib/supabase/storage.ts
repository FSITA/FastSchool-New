import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { env } from '@/env'

const BUCKET_NAME = 'presentation-images'

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

async function ensureBucketExists(supabase: any): Promise<boolean> {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('[STORAGE] Error listing buckets:', listError)
      return false
    }
    
    const bucketExists = buckets?.some((bucket: any) => bucket.name === BUCKET_NAME)
    
    if (!bucketExists) {
      console.log(`[STORAGE] Bucket ${BUCKET_NAME} does not exist, creating it...`)
      const { data, error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'],
        fileSizeLimit: 10485760 // 10MB
      })
      
      if (createError) {
        console.error('[STORAGE] Error creating bucket:', createError)
        return false
      }
      
      console.log(`[STORAGE] Bucket ${BUCKET_NAME} created successfully`)
    } else {
      console.log(`[STORAGE] Bucket ${BUCKET_NAME} already exists`)
    }
    
    return true
  } catch (error) {
    console.error('[STORAGE] Error ensuring bucket exists:', error)
    return false
  }
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

    // Create a client with service role key for storage operations
    const supabase = createSupabaseClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    console.log(`[STORAGE] Attempting to upload ${filename} to bucket ${BUCKET_NAME}`)
    console.log(`[STORAGE] File size: ${file instanceof Buffer ? file.length : file.size} bytes`)
    console.log(`[STORAGE] Content type: ${contentType}`)
    
    // Ensure bucket exists
    const bucketReady = await ensureBucketExists(supabase)
    if (!bucketReady) {
      console.error('[STORAGE] Failed to ensure bucket exists')
      return { success: false, error: 'Failed to ensure bucket exists' }
    }
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, file, {
        contentType,
        upsert: false
      })

    if (error) {
      console.error('[STORAGE] Upload error:', error)
      console.error('[STORAGE] Error details:', JSON.stringify(error, null, 2))
      return { success: false, error: error.message }
    }

    console.log(`[STORAGE] Upload successful, data:`, data)

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filename)

    console.log(`[STORAGE] Public URL generated: ${urlData.publicUrl}`)

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

    // Create a client with service role key for storage operations
    const supabase = createSupabaseClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filename])

    return !error
  } catch (error) {
    console.error('[STORAGE] Delete error:', error)
    return false
  }
}
