import Link from "next/link"
import type { BookCardData } from "@/components/books/BookCard"
import BookCard from "@/components/books/BookCard"

export default function WishlistTeaser({ books }: { books: BookCardData[] }) {
  if (books.length === 0) return null

  return (
    <section className="bg-slate-50 py-10">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">From your wishlist</h2>
            <p className="mt-1 text-sm text-slate-500">Pick up where you left off.</p>
          </div>
          <Link href="/wishlist" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
            View all →
          </Link>
        </div>
        <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {books.slice(0, 4).map((book) => (
            <BookCard key={book.id} book={book} initialWishlisted />
          ))}
        </div>
      </div>
    </section>
  )
}
