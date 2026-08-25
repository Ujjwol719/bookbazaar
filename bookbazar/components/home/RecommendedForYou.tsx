import BookCard, { type BookCardData } from "@/components/books/BookCard"

// Presentational and source-agnostic: it renders whatever `books` it's
// given, whether that came from real personalization signals or the
// newest-listings fallback — the caller (lib/recommendations.ts today,
// a real recommendation API later) decides which. Nothing here has to
// change when that source does.
export default function RecommendedForYou({
  books,
  wishlistedIds,
  personalized,
}: {
  books: BookCardData[]
  wishlistedIds: Set<string>
  personalized: boolean
}) {
  if (books.length === 0) return null

  return (
    <section className="bg-white py-10">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <h2 className="text-2xl font-bold text-slate-900">Recommended for you</h2>
        <p className="mt-1 text-sm text-slate-500">
          {personalized ? "Based on what you've bought and browsed." : "Popular picks to get you started."}
        </p>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {books.map((book) => (
            <BookCard key={book.id} book={book} initialWishlisted={wishlistedIds.has(book.id)} />
          ))}
        </div>
      </div>
    </section>
  )
}
