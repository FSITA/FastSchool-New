"use server";

import { type PlateSlide } from "@/components/presentation/utils/parser";
import { prisma } from "@/lib/prisma";
import { type InputJsonValue } from "@prisma/client/runtime/library";
import { createClient } from "@/lib/supabase/server";

// Helper function to ensure User exists in database
async function ensureUserExists(userId: string, email?: string | null, name?: string | null) {
  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      // Create user if doesn't exist
      await prisma.user.create({
        data: {
          id: userId,
          email: email || null,
          name: name || null,
        },
      });
      console.log('[createPresentation] Created User record:', userId);
    }
  } catch (error: any) {
    // If user already exists (race condition), that's fine
    if (error.code !== 'P2002') {
      console.error('[createPresentation] Error ensuring user exists:', error);
      throw error;
    }
  }
}

export async function createPresentation(
  content: {
    slides: PlateSlide[];
  },
  title: string,
  theme = "default",
  outline?: string[],
  imageModel?: string,
  presentationStyle?: string,
  language?: string
) {
  try {
    // Get authenticated user
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[createPresentation] Authentication error:', authError);
      return {
        success: false,
        message: "Authentication required",
      };
    }

    const userId = user.id;

    // Ensure User record exists in database
    await ensureUserExists(userId, user.email, user.user_metadata?.name || user.email?.split('@')[0]);

    const presentation = await prisma.baseDocument.create({
      data: {
        type: "PRESENTATION",
        documentType: "presentation",
        title: title ?? "Presentazione FastSchool senza titolo",
        userId,
        presentation: {
          create: {
            content: content as unknown as InputJsonValue,
            theme: theme,
            imageModel,
            presentationStyle,
            language,
            outline: outline,
          },
        },
      },
      include: {
        presentation: true,
      },
    });

    return {
      success: true,
      message: "Presentation created successfully",
      presentation,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Failed to create presentation",
    };
  }
}

export async function createEmptyPresentation(
  title: string,
  theme = "default"
) {
  const emptyContent: { slides: PlateSlide[] } = { slides: [] };

  return createPresentation(emptyContent, title, theme);
}

export async function updatePresentation({
  id,
  content,
  title,
  theme,
  outline,
  imageModel,
  presentationStyle,
  language,
}: {
  id: string;
  content?: {
    slides: PlateSlide[];
  };
  title?: string;
  theme?: string;
  outline?: string[];
  imageModel?: string;
  presentationStyle?: string;
  language?: string;
}) {
  // Skip authentication check - allow access without login

  try {
    console.log("[DIAGNOSTIC] updatePresentation: Called with params:", {
      id,
      title,
      theme,
      hasContent: !!content,
      slidesCount: (content as any)?.slides?.length,
      outlineLength: outline?.length,
    });
    
    // Log image data in slides if content exists
    if (content && (content as any).slides) {
      const slides = (content as any).slides;
      console.log("[DIAGNOSTIC] updatePresentation: Slides being saved:", slides.length);
      slides.forEach((slide: any, index: number) => {
        console.log(`[DIAGNOSTIC] updatePresentation: Slide ${index + 1} data:`, {
          hasRootImage: !!slide.rootImage,
          rootImageUrl: slide.rootImage?.url,
          rootImageQuery: slide.rootImage?.query,
          contentElements: slide.content?.map((el: any) => ({
            type: el.type,
            hasUrl: el.type === "img" ? !!el.url : undefined,
            hasQuery: el.type === "img" ? !!el.query : undefined,
          })) || [],
        });
      });
    }
    
    // Extract values from content if provided there
    const effectiveTheme = theme;
    console.log("[DIAGNOSTIC] updatePresentation: Effective theme being saved:", effectiveTheme);
    
    const effectiveImageModel = imageModel;
    const effectivePresentationStyle = presentationStyle;
    const effectiveLanguage = language;

    // Update base document with all presentation data
    const presentation = await prisma.baseDocument.update({
      where: { id },
      data: {
        title: title,
        presentation: {
          update: {
            content: content as unknown as InputJsonValue,
            theme: effectiveTheme,
            imageModel: effectiveImageModel,
            presentationStyle: effectivePresentationStyle,
            language: effectiveLanguage,
            outline,
          },
        },
      },
      include: {
        presentation: true,
      },
    });
    
    console.log("[DIAGNOSTIC] updatePresentation: Database update completed, saved theme:", presentation.presentation?.theme);

    return {
      success: true,
      message: "Presentation updated successfully",
      presentation,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Failed to update presentation",
    };
  }
}



// Get the presentation with the presentation content
export async function getPresentation(id: string) {
  // Skip authentication check - allow access without login

  try {
    const presentation = await prisma.baseDocument.findUnique({
      where: { id },
      include: {
        presentation: true,
      },
    });

    return {
      success: true,
      presentation,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Failed to fetch presentation",
    };
  }
}


export async function updatePresentationTheme(id: string, theme: string) {
  // Skip authentication check - allow access without login

  try {
    const presentation = await prisma.presentation.update({
      where: { id },
      data: { theme },
    });

    return {
      success: true,
      message: "Presentation theme updated successfully",
      presentation,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Failed to update presentation theme",
    };
  }
}
