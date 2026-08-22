import "server-only";

import slugify from "slugify";
import prisma from "@/lib/prisma";

export function generateSlug(title: string) {
  return slugify(title, {
    lower: true,
    strict: true,
    trim: true,
  }) || "book";
}

export async function generateUniqueSlug(title: string, excludeBookId?: string) {
  const baseSlug = generateSlug(title);
  let candidate = baseSlug;
  let suffix = 2;

  while (true) {
    const existingBook = await prisma.book.findFirst({
      where: {
        slug: candidate,
        ...(excludeBookId ? { id: { not: excludeBookId } } : {}),
      },
      select: { id: true },
    });

    if (!existingBook) {
      return candidate;
    }

    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

export async function generateUniqueStudyMaterialSlug(title: string, excludeId?: string) {
  const baseSlug = generateSlug(title);
  let candidate = baseSlug;
  let suffix = 2;

  while (true) {
    const existing = await prisma.studyMaterial.findFirst({
      where: {
        slug: candidate,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }

    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

export async function generateUniqueStoreSlug(name: string, excludeStoreId?: string) {
  const baseSlug = generateSlug(name);
  let candidate = baseSlug;
  let suffix = 2;

  while (true) {
    const existingStore = await prisma.store.findFirst({
      where: {
        slug: candidate,
        ...(excludeStoreId ? { id: { not: excludeStoreId } } : {}),
      },
      select: { id: true },
    });

    if (!existingStore) {
      return candidate;
    }

    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}