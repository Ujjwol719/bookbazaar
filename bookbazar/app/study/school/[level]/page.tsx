import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Footer from "@/components/home/footer";
import { getCanonicalUrl, SITE_NAME } from "@/lib/site";

async function getClass(level: number) {
  const schoolClass = await prisma.schoolClass.findFirst({
    where: { level, isActive: true },
    include: { classSubjects: { include: { subject: true, stream: true } } },
  });
  if (!schoolClass) return null;

  const counts = await prisma.studyMaterial.groupBy({
    by: ["classSubjectId"],
    where: { classSubjectId: { in: schoolClass.classSubjects.map((cs) => cs.id) }, status: "APPROVED" },
    _count: true,
  });
  const countByClassSubjectId = new Map(counts.map((c) => [c.classSubjectId, c._count]));

  return {
    ...schoolClass,
    classSubjects: schoolClass.classSubjects.map((cs) => ({ ...cs, materialCount: countByClassSubjectId.get(cs.id) || 0 })),
  };
}

export async function generateMetadata({ params }: { params: Promise<{ level: string }> }): Promise<Metadata> {
  const level = Number((await params).level);
  const schoolClass = await getClass(level);
  if (!schoolClass) return { title: "Class Not Found", robots: { index: false, follow: false } };

  return {
    title: `${schoolClass.name} Notes & Question Papers`,
    description: `Subjects and study materials for ${schoolClass.name} on ${SITE_NAME}'s Study Hub.`,
    alternates: { canonical: getCanonicalUrl(`/study/school/${level}`) },
  };
}

export default async function SchoolClassPage({
  params,
  searchParams,
}: {
  params: Promise<{ level: string }>;
  searchParams: Promise<{ stream?: string }>;
}) {
  const level = Number((await params).level);
  const { stream: streamSlug } = await searchParams;

  const schoolClass = await getClass(level);
  if (!schoolClass || Number.isNaN(level)) notFound();

  const streams = schoolClass.hasStreams
    ? Array.from(
        new Map(
          schoolClass.classSubjects.filter((cs) => cs.stream).map((cs) => [cs.stream!.id, cs.stream!])
        ).values()
      )
    : [];

  const activeStream = streamSlug ? streams.find((s) => s.slug === streamSlug) : streams[0];

  const subjects = schoolClass.hasStreams
    ? schoolClass.classSubjects.filter((cs) => cs.stream?.id === activeStream?.id)
    : schoolClass.classSubjects.filter((cs) => !cs.stream);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50 py-14">
        <div className="mx-auto max-w-4xl px-6">
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <Link href="/study/school" className="hover:text-indigo-600">School</Link>
            <span>/</span>
            <span className="text-slate-900 font-medium">{schoolClass.name}</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">{schoolClass.name}</h1>

          {schoolClass.hasStreams && streams.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {streams.map((s) => (
                <Link
                  key={s.id}
                  href={`/study/school/${level}?stream=${s.slug}`}
                  className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                    activeStream?.id === s.id
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300"
                  }`}
                >
                  {s.name}
                </Link>
              ))}
            </div>
          )}

          <div className="mt-8">
            {subjects.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <p className="text-slate-500">
                  {schoolClass.hasStreams && !activeStream
                    ? "Pick a stream above to see its subjects."
                    : "No subjects added for this class yet."}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {subjects.map((cs) => (
                  <Link
                    key={cs.id}
                    href={`/study/subject/class/${cs.id}`}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
                  >
                    <h3 className="font-bold text-slate-900">{cs.subject.name}</h3>
                    <p className="mt-2 text-sm text-slate-400">
                      {cs.materialCount === 0 ? "No materials published yet." : `${cs.materialCount} material${cs.materialCount === 1 ? "" : "s"}`}
                    </p>
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
