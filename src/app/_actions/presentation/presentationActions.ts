"use server";

import { type PlateSlide } from "@/components/presentation/utils/parser";
// Authentication removed - allow access without login
import { prisma } from "@/lib/prisma";
import { type InputJsonValue } from "@prisma/client/runtime/library";

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
  // Skip authentication check - allow access without login
  const userId = "anonymous-user"; // Default user ID since auth is disabled

  try {
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
