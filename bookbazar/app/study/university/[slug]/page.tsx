import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Footer from "@/components/home/footer";
import { getCanonicalUrl, SITE_NAME } from "@/lib/site";

async function getUniversity(slug: string) {
  return prisma.university.findFirst({
    where: { slug, isActive: true },
    include: { programs: { where: { isActive: true }, orderBy: { name: "asc" } } },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const university = await getUniversity((await params).slug);
  if (!university) return { title: "University Not Found", robots: { index: false, follow: false } };

  return {
    title: `${university.name} — Programs & Notes`,
    description: `Programs and study materials for ${university.name} on ${SITE_NAME}'s Study Hub.`,
    alternates: { canonical: getCanonicalUrl(`/study/university/${university.slug}`) },
  };
}

export default async function UniversityPage({ params }: { params: Promise<{ slug: string }> }) {
  const university = await getUniversity((await params).slug);
  if (!university) notFound();

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50 py-14">
        <div className="mx-auto max-w-4xl px-6">
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <Link href="/study/university" className="hover:text-indigo-600">University</Link>
            <span>/</span>
            <span className="text-slate-900 font-medium">{university.name}</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">{university.name}</h1>

          <div className="mt-8">
            {university.programs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <p className="text-slate-500">No programs added yet.</p>
                <Link href="/become-contributor" className="mt-3 inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                  Know this university? Volunteer to help build it out →
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {university.programs.map((p) => (
                  <Link
                    key={p.id}
                    href={`/study/university/${university.slug}/${p.slug}`}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg"
                  >
                    <h3 className="font-bold text-slate-900">{p.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">{p.totalSemesters} semester(s)</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
