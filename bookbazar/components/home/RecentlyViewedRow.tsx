import BookCard, { type BookCardData } from "@/components/books/BookCard"

export default function RecentlyViewedRow({ books, wishlistedIds }: { books: BookCardData[]; wishlistedIds: Set<string> }) {
  if (books.length === 0) return null

  return (
    <section className="bg-slate-50 py-10">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <h2 className="text-xl font-bold text-slate-900">Continue browsing</h2>
        <p className="mt-1 text-sm text-slate-500">Books you looked at recently.</p>
        <div className="mt-5 flex gap-5 overflow-x-auto pb-2 [scrollbar-width:thin]">
          {books.map((book) => (
            <div key={book.id} className="w-48 shrink-0">
              <BookCard book={book} initialWishlisted={wishlistedIds.has(book.id)} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
