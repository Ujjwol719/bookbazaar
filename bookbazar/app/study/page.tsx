import type { Metadata } from "next";
import Link from "next/link";
import prisma from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Footer from "@/components/home/footer";
import { getCanonicalUrl, SITE_NAME } from "@/lib/site";
import { getCreditSettings } from "@/lib/credits";

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

async function getTopContributors() {
  const grouped = await prisma.studyMaterial.groupBy({
    by: ["uploadedById"],
    where: { status: "APPROVED" },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 3,
  });
  if (grouped.length === 0) return [];

  const users = await prisma.user.findMany({
    where: { id: { in: grouped.map((g) => g.uploadedById) } },
    select: { id: true, full_name: true },
  });
  const nameById = new Map(users.map((u) => [u.id, u.full_name]));

  return grouped.map((g) => ({ name: nameById.get(g.uploadedById) || "A contributor", count: g._count.id }));
}

const MEDALS = ["🥇", "🥈", "🥉"];

export default async function StudyHubLanding() {
  const [counts, creditSettings, topContributors] = await Promise.all([getCounts(), getCreditSettings(), getTopContributors()]);
  const creditValue = Number(creditSettings.creditValueInRupees) * creditSettings.contributionReward;

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
            </p>
          )}
        </section>

        <section className="mx-auto max-w-4xl px-6 pb-20">
          <div className="flex flex-col items-center gap-6 rounded-3xl border border-indigo-100 bg-white p-8 text-center shadow-sm md:flex-row md:justify-between md:text-left">
            <div>
              <span className="text-3xl">🪙</span>
              <h2 className="mt-2 text-xl font-bold text-slate-900">Contribute notes, earn BookMandu Credits</h2>
              <p className="mt-1 max-w-md text-sm text-slate-500">
                Know a subject well? Volunteer to add notes or question papers — every approved upload earns you{" "}
                <span className="font-semibold text-slate-700">{creditSettings.contributionReward} credits (≈ Rs. {creditValue})</span>,
                spendable on any book at checkout.
              </p>
            </div>
            <Link
              href="/become-contributor"
              className="shrink-0 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-indigo-700"
            >
              Become a Contributor
            </Link>
          </div>
        </section>

        {topContributors.length > 0 && (
          <section className="mx-auto max-w-4xl px-6 pb-20">
            <div className="text-center">
              <span className="text-3xl">🏆</span>
              <h2 className="mt-2 text-xl font-bold text-slate-900">Top Contributors</h2>
              <p className="mt-1 text-sm text-slate-500">Thank you for helping build Study Hub!</p>
            </div>
            <div className="mx-auto mt-6 grid max-w-2xl gap-4 sm:grid-cols-3">
              {topContributors.map((c, i) => (
                <div key={c.name + i} className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
                  <span className="text-3xl">{MEDALS[i]}</span>
                  <p className="mt-2 truncate font-bold text-slate-900">{c.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{c.count} note{c.count === 1 ? "" : "s"} approved</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
