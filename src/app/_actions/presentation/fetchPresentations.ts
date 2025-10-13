"use server";
import "server-only";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { type Prisma, DocumentType } from "@prisma/client";

export type PresentationDocument = Prisma.BaseDocumentGetPayload<{
  include: {
    presentation: true;
  };
}>;

const ITEMS_PER_PAGE = 10;

export async function fetchPresentations(page = 0) {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return {
      items: [],
      hasMore: false,
    };
  }
  
  const userId = user.id;

  const skip = page * ITEMS_PER_PAGE;

  const items = await prisma.baseDocument.findMany({
    where: {
      userId,
      type: DocumentType.PRESENTATION,
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: ITEMS_PER_PAGE,
    skip: skip,
    include: {
      presentation: true,
    },
  });

  const hasMore = items.length === ITEMS_PER_PAGE;

  return {
    items,
    hasMore,
  };
}

export async function fetchPublicPresentations(page = 0) {
  const skip = page * ITEMS_PER_PAGE;

  const [items, total] = await Promise.all([
    prisma.baseDocument.findMany({
      where: {
        type: DocumentType.PRESENTATION,
        isPublic: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: ITEMS_PER_PAGE,
      skip: skip,
      include: {
        presentation: true,
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    }),
    prisma.baseDocument.count({
      where: {
        type: DocumentType.PRESENTATION,
        isPublic: true,
      },
    }),
  ]);

  const hasMore = skip + ITEMS_PER_PAGE < total;

  return {
    items,
    hasMore,
  };
}

export async function fetchUserPresentations(userId: string, page = 0) {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  const currentUserId = error || !user ? null : user.id;

  const skip = page * ITEMS_PER_PAGE;

  const [items, total] = await Promise.all([
    prisma.baseDocument.findMany({
      where: {
        userId,
        type: DocumentType.PRESENTATION,
        OR: [
          { isPublic: true },
          ...(currentUserId ? [{ userId: currentUserId }] : []), // Include private presentations if the user is viewing their own
        ],
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: ITEMS_PER_PAGE,
      skip: skip,
      include: {
        presentation: true,
      },
    }),
    prisma.baseDocument.count({
      where: {
        userId,
        type: DocumentType.PRESENTATION,
        OR: [
          { isPublic: true },
          ...(currentUserId ? [{ userId: currentUserId }] : []),
        ],
      },
    }),
  ]);

  const hasMore = skip + ITEMS_PER_PAGE < total;

  return {
    items,
    hasMore,
  };
}
