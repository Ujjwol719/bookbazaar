import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Footer from "@/components/home/footer";
import { getCanonicalUrl, SITE_NAME } from "@/lib/site";

async function getProgram(universitySlug: string, programSlug: string) {
  const university = await prisma.university.findFirst({ where: { slug: universitySlug, isActive: true } });
  if (!university) return null;

  return prisma.program.findFirst({
    where: { universityId: university.id, slug: programSlug, isActive: true },
    include: {
      university: true,
      semesters: {
        where: { isActive: true },
        orderBy: { number: "asc" },
        include: { programSubjects: { include: { subject: true } } },
      },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; programSlug: string }>;
}): Promise<Metadata> {
  const { slug, programSlug } = await params;
  const program = await getProgram(slug, programSlug);
  if (!program) return { title: "Program Not Found", robots: { index: false, follow: false } };

  return {
    title: `${program.name} — ${program.university.name} Notes`,
    description: `Semester-wise notes and question papers for ${program.name} at ${program.university.name} on ${SITE_NAME}'s Study Hub.`,
    alternates: { canonical: getCanonicalUrl(`/study/university/${slug}/${programSlug}`) },
  };
}

export default async function ProgramPage({
  params,
}: {
  params: Promise<{ slug: string; programSlug: string }>;
}) {
  const { slug, programSlug } = await params;
  const program = await getProgram(slug, programSlug);
  if (!program) notFound();

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50 py-14">
        <div className="mx-auto max-w-4xl px-6">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <Link href="/study/university" className="hover:text-indigo-600">University</Link>
            <span>/</span>
            <Link href={`/study/university/${slug}`} className="hover:text-indigo-600">{program.university.name}</Link>
            <span>/</span>
            <span className="text-slate-900 font-medium">{program.name}</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">{program.name}</h1>

          <div className="mt-8 space-y-6">
            {program.semesters.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <p className="text-slate-500">No semesters added yet.</p>
                <Link href="/become-helper" className="mt-3 inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                  Volunteer to help build this program out →
                </Link>
              </div>
            ) : (
              program.semesters.map((sem) => (
                <div key={sem.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="font-bold text-slate-900">{sem.label}</h2>
                  {sem.programSubjects.length === 0 ? (
                    <p className="mt-2 text-sm text-slate-400">No subjects added yet.</p>
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {sem.programSubjects.map((ps) => (
                        <span key={ps.id} className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">
                          {ps.subject.name}
                        </span>
                      ))}
                    </div>
                  )}
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
