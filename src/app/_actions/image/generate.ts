"use server";

import { env } from "@/env";
import { GoogleGenAI } from "@google/genai"; // Correct package for Imagen
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { uploadToSupabaseStorage } from "@/lib/supabase/storage";

// Define the image model list type
export type ImageModelList = 
  | "black-forest-labs/FLUX1.1-pro"
  | "black-forest-labs/FLUX.1-schnell"
  | "black-forest-labs/FLUX.1-schnell-Free"
  | "black-forest-labs/FLUX.1-pro"
  | "black-forest-labs/FLUX.1-dev"
  | "imagen-4.0-fast-generate-001";

// Initialize the Google GenAI client with the API key
const genAI = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

export async function generateImageAction(prompt: string) {
  console.log("--- Starting Image Generation Action ---");
  console.log(`[LOG] Received prompt: "${prompt}"`);

  if (!prompt) {
    console.error("[ERROR] Prompt is empty or undefined.");
    return {
      success: false,
      error: "Prompt cannot be empty.",
    };
  }


  try {
    console.log("[LOG] Calling Gemini Imagen API...");
    console.log("[LOG] Model: imagen-4.0-fast-generate-001");

    // Call the Gemini Imagen model
    const response = await genAI.models.generateImages({
      model: 'imagen-4.0-fast-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1, // Generating one image for now
        aspectRatio: "16:9", // Default aspect ratio for presentations
      },
    });

    console.log("[LOG] Received response from Gemini API.");

    let imageBuffer: Buffer;
    let isPlaceholder = false;

    // Check if the API returned any images
    const firstImage = response.generatedImages?.[0];
    if (firstImage?.image?.imageBytes) {
      console.log("[LOG] Image data received successfully from Gemini.");
      const imageBytes = firstImage.image.imageBytes;
      imageBuffer = Buffer.from(imageBytes, "base64");
    } else {
      // Fallback: Generate a self-contained SVG placeholder if Gemini fails
      console.warn("[WARN] Gemini API did not return an image, likely due to safety filters. Generating a local SVG placeholder instead.");
      console.warn(`[WARN] Final prompt used: "${prompt}"`);
      
      // Create a more informative placeholder
      const truncatedPrompt = prompt.length > 50 ? prompt.substring(0, 47) + "..." : prompt;
      
      const svgContent = `
        <svg width="1024" height="768" viewBox="0 0 1024 768" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#4F46E5;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#7C3AED;stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#grad1)" />
          <circle cx="512" cy="300" r="80" fill="#FFFFFF" opacity="0.2" />
          <text x="50%" y="45%" font-family="Arial, sans-serif" font-size="36" fill="#FFFFFF" text-anchor="middle" dominant-baseline="middle" font-weight="bold">
            Image Generation Failed
          </text>
          <text x="50%" y="50%" dy="1.2em" font-family="Arial, sans-serif" font-size="20" fill="#E5E7EB" text-anchor="middle" dominant-baseline="middle">
            Safety filters may have blocked this content
          </text>
          <text x="50%" y="55%" dy="2.4em" font-family="Arial, sans-serif" font-size="16" fill="#D1D5DB" text-anchor="middle" dominant-baseline="middle">
            Prompt: "${truncatedPrompt}"
          </text>
          <text x="50%" y="60%" dy="3.6em" font-family="Arial, sans-serif" font-size="14" fill="#9CA3AF" text-anchor="middle" dominant-baseline="middle">
            Try rephrasing with professional, educational language
          </text>
        </svg>`;
      
      imageBuffer = Buffer.from(svgContent);
      isPlaceholder = true;
    }
    console.log(`[LOG] Processed image buffer. Buffer size: ${imageBuffer.length} bytes.`);

    // Generate a unique filename
    const fileExtension = isPlaceholder ? 'svg' : 'png';
    const filename = `${prompt.substring(0, 20).replace(/[^a-z0-9]/gi, "_")}_${Date.now()}.${fileExtension}`;
    console.log(`[LOG] Generated filename: ${filename}`);

    // Try to upload to Supabase Storage first
    const contentType = isPlaceholder ? 'image/svg+xml' : 'image/png';
    const uploadResult = await uploadToSupabaseStorage(imageBuffer, filename, contentType);

    let permanentUrl: string;

    if (uploadResult.success && uploadResult.url) {
      // Successfully uploaded to Supabase
      permanentUrl = uploadResult.url;
      console.log(`[LOG] Image uploaded to Supabase Storage: ${permanentUrl}`);
    } else {
      // Fallback to local storage if Supabase fails
      console.warn(`[WARN] Supabase upload failed: ${uploadResult.error}. Falling back to local storage.`);
      
      // Ensure the uploads directory exists
      const uploadsDir = join(process.cwd(), "public", "uploads");
      if (!existsSync(uploadsDir)) {
        console.log(`[LOG] Creating uploads directory at: ${uploadsDir}`);
        await mkdir(uploadsDir, { recursive: true });
      }

      // Save the image file to the public/uploads directory
      const filePath = join(uploadsDir, filename);
      await writeFile(filePath, imageBuffer);
      console.log(`[LOG] Image saved to local filesystem at: ${filePath}`);

      // Create the public URL for the saved image
      permanentUrl = `/uploads/${filename}`;
      console.log(`[LOG] Public URL for the image: ${permanentUrl}`);
    }

    // Store the image metadata in the database
    console.log("[LOG] Storing image metadata in the database...");
    const savedImage = await prisma.generatedImage.create({
      data: {
        url: permanentUrl,
        prompt: prompt,
        userId: "anonymous-user", // Using default user ID as per original logic
      },
    });
    console.log(`[LOG] Database record created with ID: ${savedImage.id}`);
    console.log("--- Image Generation Action Finished Successfully ---");

    return {
      success: true,
      image: savedImage,
    };
  } catch (error) {
    console.error("[FATAL ERROR] An error occurred during image generation:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred during image generation.",
    };
  }
}
