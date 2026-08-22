import type { Metadata } from "next";
import Link from "next/link";
import prisma from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Footer from "@/components/home/footer";
import { getCanonicalUrl, SITE_NAME } from "@/lib/site";

// Same reasoning as the homepage: without this, new universities/classes
// added in Academic Management wouldn't show up here until a redeploy.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Study Hub — Notes & Question Papers",
  description: `Prepare for your exams with ${SITE_NAME}. Find notes and question papers organized for your class, university, program, and semester.`,
  alternates: { canonical: getCanonicalUrl("/study") },
};

async function getCounts() {
  const [schoolClasses, universities, materials] = await Promise.all([
    prisma.schoolClass.count({ where: { isActive: true } }),
    prisma.university.count({ where: { isActive: true } }),
    prisma.studyMaterial.count({ where: { status: "APPROVED" } }),
  ]);
  return { schoolClasses, universities, materials };
}

export default async function StudyHubLanding() {
  const counts = await getCounts();

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <section className="mx-auto max-w-5xl px-6 py-20 text-center">
          <span className="rounded-full bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700">
            🎓 Study Hub
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-tight text-slate-900 md:text-5xl">
            Prepare for your exams with {SITE_NAME}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
            Find notes, question papers and study materials organized for your class, university, program and semester.
          </p>

          <div className="mx-auto mt-10 grid max-w-2xl gap-4 sm:grid-cols-2">
            <Link
              href="/study/school"
              className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg"
            >
              <span className="text-3xl">🏫</span>
              <h2 className="mt-3 text-xl font-bold text-slate-900">School</h2>
              <p className="mt-1 text-sm text-slate-500">Classes 1–12</p>
            </Link>
            <Link
              href="/study/university"
              className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg"
            >
              <span className="text-3xl">🎓</span>
              <h2 className="mt-3 text-xl font-bold text-slate-900">University</h2>
              <p className="mt-1 text-sm text-slate-500">Bachelor&apos;s &amp; Master&apos;s</p>
            </Link>
          </div>

          <div className="mx-auto mt-6 flex max-w-2xl justify-center gap-8 text-sm text-slate-500">
            <span>{counts.schoolClasses} school classes</span>
            <span>·</span>
            <span>{counts.universities} universities</span>
            <span>·</span>
            <span>{counts.materials} materials published</span>
          </div>

          {counts.materials === 0 && (
            <p className="mx-auto mt-10 max-w-md text-sm text-slate-400">
              We&apos;re still building out the library — browse the structure below, and check back soon for notes and papers.
              Want to help? <Link href="/become-helper" className="font-semibold text-indigo-600 hover:text-indigo-700">Volunteer to maintain a program&apos;s notes</Link>.
            </p>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
