import Link from "next/link"

const categories = [
  { name: "Fiction", slug: "fiction", icon: "📖", tint: "bg-rose-50 text-rose-600 group-hover:bg-rose-100" },
  { name: "Non-Fiction", slug: "non-fiction", icon: "🧭", tint: "bg-amber-50 text-amber-600 group-hover:bg-amber-100" },
  { name: "Self Improvement", slug: "self-improvement", icon: "🌱", tint: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100" },
  { name: "Business", slug: "business", icon: "💼", tint: "bg-orange-50 text-orange-600 group-hover:bg-orange-100" },
  { name: "Technology", slug: "technology", icon: "💻", tint: "bg-sky-50 text-sky-600 group-hover:bg-sky-100" },
  { name: "Academic", slug: "academic", icon: "🎓", tint: "bg-violet-50 text-violet-600 group-hover:bg-violet-100" },
  { name: "Others", slug: "others", icon: "🗂️", tint: "bg-slate-100 text-slate-600 group-hover:bg-slate-200" },
]

export default function CategoryStrip() {
  return (
    <section className="border-b border-slate-100 bg-white py-14">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">Browse by Category</h2>
          <p className="mt-2 text-slate-500">Find exactly what you&apos;re looking for</p>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-4 sm:gap-4 sm:overflow-visible lg:grid-cols-7">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/books?category=${category.slug}`}
              className="group flex shrink-0 flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-white px-5 py-5 text-center shadow-sm transition hover:-translate-y-1 hover:border-indigo-100 hover:shadow-md sm:shrink"
            >
              <span className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl transition ${category.tint}`}>
                {category.icon}
              </span>
              <span className="whitespace-nowrap text-xs font-semibold text-slate-700 group-hover:text-indigo-700 sm:whitespace-normal">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
