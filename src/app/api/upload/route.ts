import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { uploadToSupabaseStorage } from "@/lib/supabase/storage";

export async function POST(request: NextRequest) {
  try {
    // Skip authentication check - allow access without login

    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file size (4MB limit)
    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    // Validate file type (images only)
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only images are allowed" }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}_${randomString}.${fileExtension}`;
    
    // Try to upload to Supabase Storage first
    const uploadResult = await uploadToSupabaseStorage(file, fileName, file.type);

    let fileUrl: string;

    if (uploadResult.success && uploadResult.url) {
      // Successfully uploaded to Supabase
      fileUrl = uploadResult.url;
      console.log(`[UPLOAD] File uploaded to Supabase Storage: ${fileUrl}`);
    } else {
      // Fallback to local storage if Supabase fails
      console.warn(`[UPLOAD] Supabase upload failed: ${uploadResult.error}. Falling back to local storage.`);
      
      // Save file to public/uploads directory
      const filePath = join(uploadsDir, fileName);
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      await writeFile(filePath, buffer);

      // Return the public URL
      fileUrl = `/uploads/${fileName}`;
    }

    return NextResponse.json({
      success: true,
      file: {
        name: file.name,
        size: file.size,
        type: file.type,
        url: fileUrl,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
