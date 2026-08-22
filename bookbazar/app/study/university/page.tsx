import type { Metadata } from "next";
import Link from "next/link";
import prisma from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Footer from "@/components/home/footer";
import { getCanonicalUrl, SITE_NAME } from "@/lib/site";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "University Notes — Bachelor's & Master's",
  description: `Browse study materials by university and program on ${SITE_NAME}'s Study Hub.`,
  alternates: { canonical: getCanonicalUrl("/study/university") },
};

export default async function UniversityStudyHub() {
  const universities = await prisma.university.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: { _count: { select: { programs: true } } },
  });

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50 py-14">
        <div className="mx-auto max-w-5xl px-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Study Hub</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900 md:text-4xl">University Notes</h1>
          <p className="mt-2 text-slate-600">Pick a university to see its programs.</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {universities.map((u) => (
              <Link
                key={u.id}
                href={`/study/university/${u.slug}`}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg"
              >
                <h2 className="font-bold text-slate-900">{u.name}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {u._count.programs === 0 ? "Programs coming soon" : `${u._count.programs} program(s)`}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
