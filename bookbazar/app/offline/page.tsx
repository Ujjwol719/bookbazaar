import Link from "next/link";

export const metadata = {
  title: "You're offline",
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-600">
          Offline
        </p>
        <h1 className="mt-4 text-4xl font-bold text-slate-900">No internet connection</h1>
        <p className="mt-3 text-slate-600">
          It looks like you&apos;re offline. Check your connection and try again — pages you&apos;ve
          already visited may still be available.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white">
            Go home
          </Link>
          <Link href="/books" className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-700">
            Browse books
          </Link>
        </div>
      </div>
    </main>
  );
}
