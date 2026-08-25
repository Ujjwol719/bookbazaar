export default function PersonalizedGreeting({ firstName }: { firstName: string }) {
  return (
    <section className="bg-white pt-10">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Welcome back, {firstName} 👋</h1>
        <p className="mt-1 text-slate-500">Here&apos;s what&apos;s new for you today.</p>
      </div>
    </section>
  )
}
