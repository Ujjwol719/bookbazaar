import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Footer from "@/components/home/footer";
import ReportMaterialButton from "@/components/study/ReportMaterialButton";
import { getCanonicalUrl, SITE_NAME } from "@/lib/site";

export const revalidate = 60;

async function getMaterial(slug: string) {
  return prisma.studyMaterial.findFirst({
    where: { slug, status: "APPROVED" },
    include: {
      uploadedBy: { select: { full_name: true } },
      chapter: { select: { title: true } },
      classSubject: { include: { subject: true, schoolClass: true, stream: true } },
      programSubject: { include: { subject: true, semester: { include: { program: { include: { university: true } } } } } },
    },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const material = await getMaterial(slug);
  if (!material) return { title: "Not Found", robots: { index: false, follow: false } };

  return {
    title: `${material.title} — ${SITE_NAME} Study Hub`,
    description: material.description || `${material.type === "NOTES" ? "Notes" : "Question paper"} on ${SITE_NAME}'s Study Hub.`,
    alternates: { canonical: getCanonicalUrl(`/study/materials/${slug}`) },
  };
}

export default async function MaterialPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const material = await getMaterial(slug);
  if (!material) notFound();

  // Best-effort view count — never blocks the page on a failed write.
  prisma.studyMaterial.update({ where: { id: material.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  const classCtx = material.classSubject;
  const programCtx = material.programSubject;

  const breadcrumb = classCtx
    ? [
        { label: "School", href: "/study/school" },
        { label: classCtx.schoolClass.name, href: `/study/school/${classCtx.schoolClass.level}` },
        { label: classCtx.subject.name, href: `/study/subject/class/${classCtx.id}` },
      ]
    : programCtx
    ? [
        { label: "University", href: "/study/university" },
        { label: programCtx.semester.program.university.name, href: `/study/university/${programCtx.semester.program.university.slug}` },
        { label: programCtx.semester.program.name, href: `/study/university/${programCtx.semester.program.university.slug}/${programCtx.semester.program.slug}` },
        { label: programCtx.subject.name, href: `/study/subject/program/${programCtx.id}` },
      ]
    : [];

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50 py-14">
        <div className="mx-auto max-w-3xl px-6">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            {breadcrumb.map((b) => (
              <span key={b.href} className="flex items-center gap-2">
                <Link href={b.href} className="hover:text-indigo-600">{b.label}</Link>
                <span>/</span>
              </span>
            ))}
            <span className="text-slate-900 font-medium">{material.title}</span>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                {material.type === "NOTES" ? "Notes" : "Question Paper"}
              </span>
              {material.chapter && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{material.chapter.title}</span>
              )}
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Free</span>
            </div>

            <h1 className="mt-4 text-3xl font-bold text-slate-900">{material.title}</h1>
            {material.description && <p className="mt-3 text-slate-600">{material.description}</p>}

            <p className="mt-4 text-sm text-slate-400">
              Uploaded by {material.uploadedBy.full_name} · {material.viewCount + 1} view{material.viewCount === 0 ? "" : "s"}
            </p>

            <a
              href={material.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-block rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-indigo-700"
            >
              {material.fileType === "PDF" ? "View / Download PDF" : "View Image"} →
            </a>

            <div className="mt-6 border-t border-slate-100 pt-4">
              <ReportMaterialButton studyMaterialId={material.id} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
