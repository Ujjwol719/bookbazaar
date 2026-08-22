import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Footer from "@/components/home/footer";
import { getCanonicalUrl, SITE_NAME } from "@/lib/site";

export const revalidate = 60;

async function getData(programSubjectId: string) {
  const programSubject = await prisma.programSubject.findUnique({
    where: { id: programSubjectId },
    include: { subject: true, semester: { include: { program: { include: { university: true } } } } },
  });
  if (!programSubject) return null;

  const materials = await prisma.studyMaterial.findMany({
    where: { programSubjectId, status: "APPROVED" },
    include: { chapter: { select: { title: true } } },
    orderBy: [{ chapter: { sortOrder: "asc" } }, { createdAt: "desc" }],
  });

  return { programSubject, materials };
}

export async function generateMetadata({ params }: { params: Promise<{ programSubjectId: string }> }): Promise<Metadata> {
  const { programSubjectId } = await params;
  const data = await getData(programSubjectId);
  if (!data) return { title: "Not Found", robots: { index: false, follow: false } };
  const { programSubject } = data;

  return {
    title: `${programSubject.subject.name} — ${programSubject.semester.program.name} Notes`,
    description: `Notes and question papers for ${programSubject.subject.name}, ${programSubject.semester.program.name} at ${programSubject.semester.program.university.name} on ${SITE_NAME}'s Study Hub.`,
    alternates: { canonical: getCanonicalUrl(`/study/subject/program/${programSubjectId}`) },
  };
}

export default async function ProgramSubjectMaterialsPage({ params }: { params: Promise<{ programSubjectId: string }> }) {
  const { programSubjectId } = await params;
  const data = await getData(programSubjectId);
  if (!data) notFound();
  const { programSubject, materials } = data;
  const program = programSubject.semester.program;

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
            <Link href="/study/university" className="hover:text-indigo-600">University</Link>
            <span>/</span>
            <Link href={`/study/university/${program.university.slug}`} className="hover:text-indigo-600">{program.university.name}</Link>
            <span>/</span>
            <Link href={`/study/university/${program.university.slug}/${program.slug}`} className="hover:text-indigo-600">{program.name}</Link>
            <span>/</span>
            <span className="text-slate-900 font-medium">{programSubject.subject.name}</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">{programSubject.subject.name}</h1>
          <p className="mt-1 text-slate-500">{programSubject.semester.label}</p>

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
