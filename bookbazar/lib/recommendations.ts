import "server-only"
import prisma from "@/lib/prisma"
import type { BookCardData } from "@/components/books/BookCard"

type BookWithReviews = {
  id: string
  slug: string
  title: string
  author: string | null
  price: unknown
  originalPrice: unknown
  stockQty: number
  imageUrl: string | null
  condition: string
  reviews: { rating: number }[]
}

function toBookCardData(book: BookWithReviews): BookCardData {
  const ratings = book.reviews.map((r) => r.rating)
  return {
    id: book.id,
    slug: book.slug,
    title: book.title,
    author: book.author,
    price: Number(book.price),
    originalPrice: book.originalPrice ? Number(book.originalPrice) : null,
    stockQty: book.stockQty,
    imageUrl: book.imageUrl,
    condition: book.condition,
    averageRating: ratings.length ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : null,
    reviewCount: ratings.length,
  }
}

const BOOK_WITH_REVIEWS_SELECT = {
  id: true,
  slug: true,
  title: true,
  author: true,
  price: true,
  originalPrice: true,
  stockQty: true,
  imageUrl: true,
  condition: true,
  reviews: { select: { rating: true } as const },
} as const

/**
 * Everything the personalized homepage needs, built entirely from real
 * signals this user actually generated — wishlist, purchase history,
 * recently-viewed books, recent searches. Nothing here is invented.
 *
 * "Recommended for you": books in the same categories as what the user
 * has bought or viewed, newest first, excluding anything they've already
 * bought or viewed. New users (no signal yet) fall back to the newest
 * active listings platform-wide — the same "general" pool a logged-out
 * visitor already sees in Featured Books, not a separate fake list.
 */
export async function getPersonalizedHomepageData(userId: string) {
  const [wishlistRows, allWishlistedIds, recentlyViewedRows, searchRows, purchasedItems] = await Promise.all([
    prisma.wishlistItem.findMany({
      where: { userId },
      orderBy: { addedAt: "desc" },
      take: 8,
      select: { book: { select: BOOK_WITH_REVIEWS_SELECT } },
    }),
    // Separate from the capped preview above — this is so a book showing
    // up in Recommended/Recently Viewed still renders its heart correctly
    // filled even if it's wishlisted but didn't make the top-8 preview.
    prisma.wishlistItem.findMany({ where: { userId }, select: { bookId: true } }),
    prisma.recentlyViewedBook.findMany({
      where: { userId },
      orderBy: { viewedAt: "desc" },
      take: 8,
      select: { book: { select: { ...BOOK_WITH_REVIEWS_SELECT, categoryId: true } } },
    }),
    prisma.searchHistoryEntry.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { query: true },
    }),
    prisma.orderItem.findMany({
      where: { order: { buyerId: userId } },
      select: { bookId: true, book: { select: { categoryId: true } } },
    }),
  ])

  // Dedupe recent search queries case-insensitively, most recent first.
  const seenQueries = new Set<string>()
  const recentSearches: string[] = []
  for (const row of searchRows) {
    const q = row.query.trim()
    const key = q.toLowerCase()
    if (!q || seenQueries.has(key)) continue
    seenQueries.add(key)
    recentSearches.push(q)
    if (recentSearches.length >= 5) break
  }

  const purchasedBookIds = purchasedItems.map((i) => i.bookId)
  const viewedBookIds = recentlyViewedRows.map((r) => r.book.id)
  const excludeIds = [...new Set([...purchasedBookIds, ...viewedBookIds])]

  const categoryIds = [
    ...new Set(
      [...purchasedItems.map((i) => i.book.categoryId), ...recentlyViewedRows.map((r) => r.book.categoryId)].filter(
        (id): id is string => !!id
      )
    ),
  ]

  let recommendedRows: BookWithReviews[] = []
  if (categoryIds.length > 0) {
    recommendedRows = await prisma.book.findMany({
      where: {
        categoryId: { in: categoryIds },
        isActive: true,
        id: { notIn: excludeIds },
        store: { isActive: true, isApproved: true },
      },
      select: BOOK_WITH_REVIEWS_SELECT,
      orderBy: { createdAt: "desc" },
      take: 8,
    })
  }

  const hasPersonalizationSignal = categoryIds.length > 0

  if (recommendedRows.length < 8) {
    const fallback = await prisma.book.findMany({
      where: {
        isActive: true,
        id: { notIn: [...excludeIds, ...recommendedRows.map((b) => b.id)] },
        store: { isActive: true, isApproved: true },
      },
      select: BOOK_WITH_REVIEWS_SELECT,
      orderBy: { createdAt: "desc" },
      take: 8 - recommendedRows.length,
    })
    recommendedRows = [...recommendedRows, ...fallback]
  }

  const wishlistedIdSet = new Set(allWishlistedIds.map((w) => w.bookId))

  return {
    wishlistPreview: wishlistRows.map((w) => toBookCardData(w.book)),
    recentlyViewed: recentlyViewedRows.map((r) => toBookCardData(r.book)),
    recentSearches,
    recommended: recommendedRows.map(toBookCardData),
    hasPersonalizationSignal,
    wishlistedIds: wishlistedIdSet,
  }
}
