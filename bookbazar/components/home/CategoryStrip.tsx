import Link from "next/link"

const categories = [
  { name: "Fiction", slug: "fiction", icon: "📖" },
  { name: "Non-Fiction", slug: "non-fiction", icon: "🧭" },
  { name: "Self Improvement", slug: "self-improvement", icon: "🌱" },
  { name: "Business", slug: "business", icon: "💼" },
  { name: "Technology", slug: "technology", icon: "💻" },
  { name: "Academic", slug: "academic", icon: "🎓" },
  { name: "Others", slug: "others", icon: "🗂️" },
]

export default function CategoryStrip() {
  return (
    <section className="border-b border-slate-100 bg-white py-8">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-4 sm:gap-4 sm:overflow-visible lg:grid-cols-7">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/books?category=${category.slug}`}
              className="group flex shrink-0 flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-center transition hover:border-indigo-200 hover:bg-indigo-50 sm:shrink"
            >
              <span className="text-2xl transition group-hover:scale-110">{category.icon}</span>
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
