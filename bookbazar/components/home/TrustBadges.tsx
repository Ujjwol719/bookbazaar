const badges = [
  {
    icon: "🛡️",
    title: "Verified Sellers",
    desc: "Every store is reviewed by our team before it can list a single book.",
  },
  {
    icon: "💵",
    title: "Pay on Delivery",
    desc: "Cash on Delivery, Nepal-wide — pay only once your books are in hand.",
  },
  {
    icon: "🔑",
    title: "Delivery Code Protection",
    desc: "Sellers only confirm delivery with the code you share at your door.",
  },
  {
    icon: "🚚",
    title: "Nationwide Delivery",
    desc: "From Kathmandu to Nepalgunj — sellers ship across the country.",
  },
]

export default function TrustBadges() {
  return (
    <section className="bg-slate-50 py-14">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {badges.map((badge) => (
            <div key={badge.title} className="flex flex-col items-start gap-3 rounded-2xl border border-slate-200 bg-white p-6">
              <span className="text-2xl" aria-hidden="true">{badge.icon}</span>
              <h3 className="font-bold text-slate-900">{badge.title}</h3>
              <p className="text-sm leading-relaxed text-slate-500">{badge.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
