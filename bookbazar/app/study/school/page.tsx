import type { Metadata } from "next";
import Link from "next/link";
import prisma from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Footer from "@/components/home/footer";
import { getCanonicalUrl, SITE_NAME } from "@/lib/site";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "School Notes — Class 1 to 12",
  description: `Browse study materials by class on ${SITE_NAME}'s Study Hub.`,
  alternates: { canonical: getCanonicalUrl("/study/school") },
};

export default async function SchoolStudyHub() {
  const classes = await prisma.schoolClass.findMany({
    where: { isActive: true },
    orderBy: { level: "asc" },
  });

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50 py-14">
        <div className="mx-auto max-w-5xl px-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Study Hub</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900 md:text-4xl">School Notes</h1>
          <p className="mt-2 text-slate-600">Pick a class to see its subjects.</p>

          <div className="mt-8 grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            {classes.map((c) => (
              <Link
                key={c.id}
                href={`/study/school/${c.level}`}
                className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg"
              >
                <p className="text-lg font-bold text-slate-900">{c.name}</p>
                {c.hasStreams && <p className="mt-1 text-xs text-slate-400">has streams</p>}
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
