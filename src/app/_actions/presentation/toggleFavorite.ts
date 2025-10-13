"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function addToFavorites(documentId: string) {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return { error: "Unauthorized" };
  }
  
  const userId = user.id;

  try {
    // Check if already favorited
    const existing = await prisma.favoriteDocument.findFirst({
      where: {
        documentId,
        userId,
      },
    });

    if (existing) {
      return { error: "Document is already in favorites" };
    }

    // Add to favorites
    await prisma.favoriteDocument.create({
      data: {
        documentId,
        userId,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error adding to favorites:", error);
    return { error: "Failed to add to favorites" };
  }
}

export async function removeFromFavorites(documentId: string) {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return { error: "Unauthorized" };
  }
  
  const userId = user.id;

  try {
    await prisma.favoriteDocument.deleteMany({
      where: {
        documentId,
        userId,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error removing from favorites:", error);
    return { error: "Failed to remove from favorites" };
  }
}
