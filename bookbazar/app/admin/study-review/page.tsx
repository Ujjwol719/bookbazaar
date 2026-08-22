"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";

interface MaterialRow {
  id: string;
  title: string;
  description: string | null;
  type: "NOTES" | "QUESTION_PAPER";
  fileUrl: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CHANGES_REQUESTED" | "UNPUBLISHED";
  createdAt: string;
  possibleDuplicate: boolean;
  uploadedBy: { full_name: string; email: string };
  chapter: { title: string } | null;
  classSubject: { subject: { name: string }; schoolClass: { name: string }; stream: { name: string } | null } | null;
  programSubject: { subject: { name: string }; semester: { program: { name: string; university: { name: string } } } } | null;
}

function contextLabel(m: MaterialRow) {
  if (m.classSubject) return `${m.classSubject.subject.name} — ${m.classSubject.schoolClass.name}${m.classSubject.stream ? ` (${m.classSubject.stream.name})` : ""}`;
  if (m.programSubject) return `${m.programSubject.subject.name} — ${m.programSubject.semester.program.name}, ${m.programSubject.semester.program.university.name}`;
  return "—";
}

/* --------------------------------------------------------------------- */
/* Admin direct upload — publishes immediately, no review queue          */
/* --------------------------------------------------------------------- */

interface SchoolClassOption { id: string; name: string; hasStreams: boolean; }
interface ClassSubjectOption { id: string; subjectId: string; subject: { name: string }; stream: { id: string; name: string } | null; }
interface UniversityOption { id: string; name: string; programs: { id: string; name: string }[]; }
interface ProgramSubjectOption { id: string; subject: { id: string; name: string }; semester: { label: string }; }
interface ChapterOption { id: string; title: string; }

function AdminDirectUploadForm({ onPublished, onError }: { onPublished: () => void; onError: (msg: string) => void }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"school" | "university">("school");

  const [schoolClasses, setSchoolClasses] = useState<SchoolClassOption[]>([]);
  const [schoolClassId, setSchoolClassId] = useState("");
  const [classSubjects, setClassSubjects] = useState<ClassSubjectOption[]>([]);
  const [classSubjectId, setClassSubjectId] = useState("");

  const [universities, setUniversities] = useState<UniversityOption[]>([]);
  const [programId, setProgramId] = useState("");
  const [programSubjects, setProgramSubjects] = useState<ProgramSubjectOption[]>([]);
  const [programSubjectId, setProgramSubjectId] = useState("");

  const [chapters, setChapters] = useState<ChapterOption[]>([]);
  const [chapterId, setChapterId] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"NOTES" | "QUESTION_PAPER">("NOTES");
  const [file, setFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    axios.get<{ schoolClasses: SchoolClassOption[] }>("/api/school-classes").then((res) => setSchoolClasses(res.data.schoolClasses));
    axios.get<{ universities: UniversityOption[] }>("/api/universities").then((res) => setUniversities(res.data.universities));
  }, [open]);

  useEffect(() => {
    setClassSubjectId("");
    setClassSubjects([]);
    if (!schoolClassId) return;
    axios.get<{ classSubjects: ClassSubjectOption[] }>(`/api/admin/class-subjects?schoolClassId=${schoolClassId}`).then((res) => setClassSubjects(res.data.classSubjects));
  }, [schoolClassId]);

  useEffect(() => {
    setProgramSubjectId("");
    setProgramSubjects([]);
    if (!programId) return;
    axios.get<{ programSubjects: ProgramSubjectOption[] }>(`/api/admin/program-subjects?programId=${programId}`).then((res) => setProgramSubjects(res.data.programSubjects));
  }, [programId]);

  const selectedSubjectId =
    kind === "school"
      ? classSubjects.find((c) => c.id === classSubjectId)?.subjectId
      : programSubjects.find((p) => p.id === programSubjectId)?.subject.id;

  useEffect(() => {
    setChapterId("");
    setChapters([]);
    if (!selectedSubjectId) return;
    axios.get<{ chapters: ChapterOption[] }>(`/api/chapters?subjectId=${selectedSubjectId}`).then((res) => setChapters(res.data.chapters));
  }, [selectedSubjectId]);

  const canSubmit = title.trim() && file && (kind === "school" ? classSubjectId : programSubjectId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !file) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("type", type);
      if (kind === "school") formData.append("classSubjectId", classSubjectId);
      else formData.append("programSubjectId", programSubjectId);
      if (chapterId) formData.append("chapterId", chapterId);
      formData.append("file", file);
      if (thumbnail) formData.append("thumbnail", thumbnail);

      await axios.post("/api/admin/study-materials", formData, { headers: { "Content-Type": "multipart/form-data" } });
      onError("");
      setTitle(""); setDescription(""); setFile(null); setThumbnail(null);
      setSchoolClassId(""); setClassSubjectId(""); setProgramId(""); setProgramSubjectId(""); setChapterId("");
      onPublished();
    } catch (err) {
      onError(axios.isAxiosError(err) ? err.response?.data?.message || "Unable to publish" : "Unable to publish");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div>
          <h2 className="text-lg font-bold text-slate-900">Publish material directly</h2>
          <p className="text-sm text-slate-500">Goes live immediately — skips the contributor review queue.</p>
        </div>
        <span className="text-sm font-semibold text-indigo-600">{open ? "Hide" : "Open"}</span>
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="space-y-3 border-t border-slate-100 px-5 py-4">
          <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button type="button" onClick={() => setKind("school")} className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${kind === "school" ? "bg-indigo-600 text-white" : "text-slate-600"}`}>School</button>
            <button type="button" onClick={() => setKind("university")} className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${kind === "university" ? "bg-indigo-600 text-white" : "text-slate-600"}`}>University</button>
          </div>

          {kind === "school" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <select value={schoolClassId} onChange={(e) => setSchoolClassId(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                <option value="">Select class...</option>
                {schoolClasses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={classSubjectId} onChange={(e) => setClassSubjectId(e.target.value)} disabled={!schoolClassId} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm disabled:opacity-50">
                <option value="">Select subject...</option>
                {classSubjects.map((cs) => <option key={cs.id} value={cs.id}>{cs.subject.name}{cs.stream ? ` (${cs.stream.name})` : ""}</option>)}
              </select>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <select value={programId} onChange={(e) => setProgramId(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                <option value="">Select program...</option>
                {universities.map((u) => (
                  <optgroup key={u.id} label={u.name}>
                    {u.programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </optgroup>
                ))}
              </select>
              <select value={programSubjectId} onChange={(e) => setProgramSubjectId(e.target.value)} disabled={!programId} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm disabled:opacity-50">
                <option value="">Select subject...</option>
                {programSubjects.map((ps) => <option key={ps.id} value={ps.id}>{ps.subject.name} ({ps.semester.label})</option>)}
              </select>
            </div>
          )}

          {chapters.length > 0 && (
            <select value={chapterId} onChange={(e) => setChapterId(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <option value="">No specific chapter</option>
              {chapters.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          )}

          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" rows={2} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />

          <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button type="button" onClick={() => setType("NOTES")} className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${type === "NOTES" ? "bg-indigo-600 text-white" : "text-slate-600"}`}>Notes</button>
            <button type="button" onClick={() => setType("QUESTION_PAPER")} className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${type === "QUESTION_PAPER" ? "bg-indigo-600 text-white" : "text-slate-600"}`}>Question Paper</button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">File (PDF/image)</label>
              <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Thumbnail (optional)</label>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setThumbnail(e.target.files?.[0] || null)} className="w-full text-sm" />
            </div>
          </div>

          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Publishing..." : "Publish now"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function StudyReviewPage() {
  const [materials, setMaterials] = useState<MaterialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await axios.get<{ materials: MaterialRow[] }>("/api/admin/study-review");
      setMaterials(res.data.materials);
    } catch {
      setError("Unable to load the review queue");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function decide(id: string, decision: "APPROVE" | "REJECT" | "REQUEST_CHANGES") {
    setBusyId(id);
    try {
      await axios.patch(`/api/admin/study-review/${id}`, { decision, reviewNote: noteDraft[id] || undefined });
      setError("");
      await load();
    } catch (err) {
      setError(axios.isAxiosError(err) ? err.response?.data?.message || "Unable to update this submission" : "Unable to update this submission");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">← Admin Console</Link>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">Study Material Review</h1>
        <p className="mt-1 text-slate-500">Contributor uploads waiting for a decision. Approving awards BookMandu Credits automatically.</p>

        <div className="mt-6">
          <AdminDirectUploadForm onPublished={load} onError={setError} />
        </div>

        {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

        <h2 className="mt-8 text-lg font-bold text-slate-900">Review queue</h2>
        <div className="mt-3 space-y-4">
          {loading ? (
            <div className="h-24 animate-pulse rounded-2xl bg-white" />
          ) : materials.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
              Nothing waiting for review.
            </div>
          ) : (
            materials.map((m) => (
              <div key={m.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900">{m.title}</p>
                      {m.possibleDuplicate && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Possible duplicate</span>
                      )}
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{m.status.replace("_", " ")}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{contextLabel(m)}{m.chapter ? ` · ${m.chapter.title}` : ""}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      by {m.uploadedBy.full_name} ({m.uploadedBy.email}) · {m.type === "NOTES" ? "Notes" : "Question Paper"}
                    </p>
                    {m.description && <p className="mt-2 text-sm text-slate-600">{m.description}</p>}
                    <a href={m.fileUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                      View file →
                    </a>
                  </div>
                </div>

                <textarea
                  value={noteDraft[m.id] || ""}
                  onChange={(e) => setNoteDraft((cur) => ({ ...cur, [m.id]: e.target.value }))}
                  placeholder="Reviewer note (required for Request Changes, optional otherwise)"
                  rows={2}
                  className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:bg-white"
                />

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => decide(m.id, "APPROVE")}
                    disabled={busyId === m.id}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => decide(m.id, "REQUEST_CHANGES")}
                    disabled={busyId === m.id}
                    className="rounded-lg border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Request Changes
                  </button>
                  <button
                    onClick={() => decide(m.id, "REJECT")}
                    disabled={busyId === m.id}
                    className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
