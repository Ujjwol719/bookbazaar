import Link from "next/link"
import Image from "next/image"
import WishlistHeartButton from "./WishlistHeartButton"

// Same visual design as the Featured Books grid (components/home/featuresbook.tsx),
// as a reusable, server-renderable card for the personalized homepage
// sections — with a wishlist heart and average rating added, since those
// sections need them and Featured Books didn't previously carry them.
export interface BookCardData {
  id: string
  slug: string
  title: string
  author: string | null
  price: number
  originalPrice: number | null
  stockQty: number
  imageUrl: string | null
  condition: string
  averageRating?: number | null
  reviewCount?: number
}

const conditionColors: Record<string, string> = {
  NEW: "bg-green-100 text-green-700",
  LIKE_NEW: "bg-emerald-100 text-emerald-700",
  GOOD: "bg-blue-100 text-blue-700",
  ACCEPTABLE: "bg-yellow-100 text-yellow-700",
  OLD: "bg-red-100 text-red-700",
}

const conditionLabels: Record<string, string> = {
  NEW: "New",
  LIKE_NEW: "Like New",
  GOOD: "Good",
  ACCEPTABLE: "Acceptable",
  OLD: "Old",
}

export default function BookCard({ book, initialWishlisted = false }: { book: BookCardData; initialWishlisted?: boolean }) {
  const discount = book.originalPrice && book.originalPrice > book.price
    ? Math.round(((book.originalPrice - book.price) / book.originalPrice) * 100)
    : null

  return (
    <Link
      href={`/books/${book.slug}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
    >
      <div className="relative h-56 w-full overflow-hidden bg-linear-to-br from-indigo-100 to-indigo-200">
        {book.imageUrl ? (
          <Image
            src={book.imageUrl}
            alt={book.title}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-6xl">📚</span>
          </div>
        )}

        {discount && (
          <div className="absolute left-3 top-3 rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white">
            {discount}% OFF
          </div>
        )}

        <div className={`absolute bottom-3 right-3 rounded-full px-2 py-1 text-xs font-semibold ${conditionColors[book.condition] || conditionColors.NEW}`}>
          {conditionLabels[book.condition] || "New"}
        </div>

        <WishlistHeartButton bookId={book.id} initialWishlisted={initialWishlisted} />
      </div>

      <div className="flex h-full flex-col p-5">
        <h3 className="line-clamp-2 text-base font-bold text-slate-900 transition-colors group-hover:text-indigo-600">
          {book.title}
        </h3>
        <p className="mt-1 text-sm font-medium text-slate-500">By {book.author || "Unknown Author"}</p>

        {typeof book.averageRating === "number" && book.reviewCount ? (
          <p className="mt-1 text-xs text-amber-600">⭐ {book.averageRating.toFixed(1)} ({book.reviewCount})</p>
        ) : null}

        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xl font-bold text-indigo-600">Rs. {book.price}</span>
              {book.originalPrice && book.originalPrice > book.price && (
                <span className="ml-2 text-xs text-slate-400 line-through">Rs. {book.originalPrice}</span>
              )}
            </div>
            {book.stockQty === 0 && <span className="text-xs font-semibold text-red-500">Out of stock</span>}
          </div>
        </div>
      </div>
    </Link>
  )
}
