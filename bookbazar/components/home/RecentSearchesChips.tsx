import Link from "next/link"

// Modular and self-contained: fine to render with an empty list (parent
// just won't mount it then) — nothing here depends on where the queries
// came from beyond the array itself.
export default function RecentSearchesChips({ queries }: { queries: string[] }) {
  if (queries.length === 0) return null

  return (
    <section className="bg-white pt-6">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <p className="text-sm font-semibold text-slate-500">Your recent searches</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {queries.map((q) => (
            <Link
              key={q}
              href={`/books?search=${encodeURIComponent(q)}`}
              className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-sm text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
            >
              {q}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
