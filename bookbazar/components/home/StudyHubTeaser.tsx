import Link from "next/link"
import { getCreditSettings } from "@/lib/credits"

export default async function StudyHubTeaser() {
  const settings = await getCreditSettings()

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 p-8 text-white md:p-12">
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                🎓 Study Hub
              </span>
              <h2 className="mt-4 text-2xl font-bold md:text-3xl">Prepare for your exams with BookMandu</h2>
              <p className="mt-2 max-w-lg text-indigo-100">
                Study materials organized for your class, university and semester.
              </p>
              <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-amber-200">
                🪙 Volunteer to contribute notes — earn {settings.contributionReward} credits per approved upload.
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap gap-3">
              <Link
                href="/study"
                className="rounded-xl bg-white px-6 py-3 font-semibold text-indigo-700 shadow-lg transition hover:bg-indigo-50"
              >
                Explore Study Hub
              </Link>
              <Link
                href="/become-contributor"
                className="rounded-xl border border-white/40 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Become a Contributor
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
