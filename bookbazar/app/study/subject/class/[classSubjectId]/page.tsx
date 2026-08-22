import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Footer from "@/components/home/footer";
import { getCanonicalUrl, SITE_NAME } from "@/lib/site";

export const revalidate = 60;

async function getData(classSubjectId: string) {
  const classSubject = await prisma.classSubject.findUnique({
    where: { id: classSubjectId },
    include: { subject: true, schoolClass: true, stream: true },
  });
  if (!classSubject) return null;

  const materials = await prisma.studyMaterial.findMany({
    where: { classSubjectId, status: "APPROVED" },
    include: { chapter: { select: { title: true } } },
    orderBy: [{ chapter: { sortOrder: "asc" } }, { createdAt: "desc" }],
  });

  return { classSubject, materials };
}

export async function generateMetadata({ params }: { params: Promise<{ classSubjectId: string }> }): Promise<Metadata> {
  const { classSubjectId } = await params;
  const data = await getData(classSubjectId);
  if (!data) return { title: "Not Found", robots: { index: false, follow: false } };

  return {
    title: `${data.classSubject.subject.name} — ${data.classSubject.schoolClass.name} Notes`,
    description: `Notes and question papers for ${data.classSubject.subject.name}, ${data.classSubject.schoolClass.name} on ${SITE_NAME}'s Study Hub.`,
    alternates: { canonical: getCanonicalUrl(`/study/subject/class/${classSubjectId}`) },
  };
}

export default async function ClassSubjectMaterialsPage({ params }: { params: Promise<{ classSubjectId: string }> }) {
  const { classSubjectId } = await params;
  const data = await getData(classSubjectId);
  if (!data) notFound();
  const { classSubject, materials } = data;

  const grouped = new Map<string, typeof materials>();
  for (const m of materials) {
    const key = m.chapter?.title || "General";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(m);
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50 py-14">
        <div className="mx-auto max-w-3xl px-6">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <Link href="/study/school" className="hover:text-indigo-600">School</Link>
            <span>/</span>
            <Link href={`/study/school/${classSubject.schoolClass.level}`} className="hover:text-indigo-600">{classSubject.schoolClass.name}</Link>
            <span>/</span>
            <span className="text-slate-900 font-medium">{classSubject.subject.name}</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">
            {classSubject.subject.name}
            {classSubject.stream && <span className="ml-2 text-lg font-normal text-slate-400">({classSubject.stream.name})</span>}
          </h1>

          <div className="mt-8 space-y-8">
            {materials.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <p className="text-slate-500">No materials published for this subject yet.</p>
                <Link href="/become-contributor" className="mt-3 inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                  Be the first to contribute →
                </Link>
              </div>
            ) : (
              Array.from(grouped.entries()).map(([chapterTitle, items]) => (
                <div key={chapterTitle}>
                  <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">{chapterTitle}</h2>
                  <div className="space-y-3">
                    {items.map((m) => (
                      <Link
                        key={m.id}
                        href={`/study/materials/${m.slug}`}
                        className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-bold text-slate-900">{m.title}</p>
                            <p className="mt-1 text-xs text-slate-400">{m.type === "NOTES" ? "Notes" : "Question Paper"}</p>
                          </div>
                          <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Free</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
