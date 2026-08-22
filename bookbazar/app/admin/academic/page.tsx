"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// Drill-down panels (Programs, Semesters) render below a potentially long
// list — without this, selecting a row near the bottom scrolls nothing
// into view and looks like the click did nothing.
function useScrollIntoViewOnMount<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);
  return ref;
}

/* --------------------------------------------------------------------- */
/* Types                                                                  */
/* --------------------------------------------------------------------- */

interface University {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  _count: { programs: number };
}

interface Program {
  id: string;
  universityId: string;
  name: string;
  totalSemesters: number;
  isActive: boolean;
  _count: { semesters: number };
}

interface Semester {
  id: string;
  programId: string;
  number: number;
  label: string;
  isActive: boolean;
  _count: { programSubjects: number };
}

interface ProgramSubject {
  id: string;
  subject: { id: string; name: string };
}

interface Subject {
  id: string;
  name: string;
  isActive: boolean;
  _count: { classSubjects: number; programSubjects: number };
}

interface Stream {
  id: string;
  name: string;
  isActive: boolean;
  _count: { classSubjects: number };
}

interface SchoolClass {
  id: string;
  level: number;
  name: string;
  hasStreams: boolean;
  isActive: boolean;
  _count: { classSubjects: number };
}

interface ClassSubject {
  id: string;
  subject: { id: string; name: string };
  stream: { id: string; name: string } | null;
}

type Tab = "universities" | "school" | "subjects" | "contributors";

/* --------------------------------------------------------------------- */
/* Shared bits                                                            */
/* --------------------------------------------------------------------- */

function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
      {message}
    </div>
  );
}

function InlineAddForm({
  placeholder,
  buttonLabel,
  onSubmit,
}: {
  placeholder: string;
  buttonLabel: string;
  onSubmit: (value: string) => Promise<void>;
}) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim() || saving) return;
    setSaving(true);
    await onSubmit(value.trim());
    setValue("");
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
      />
      <button
        type="submit"
        disabled={saving || !value.trim()}
        className="shrink-0 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? "Adding..." : buttonLabel}
      </button>
    </form>
  );
}

/* --------------------------------------------------------------------- */
/* Page                                                                   */
/* --------------------------------------------------------------------- */

export default function AcademicManagementPage() {
  const [tab, setTab] = useState<Tab>("universities");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [pendingContributorCount, setPendingContributorCount] = useState(0);
  const [error, setError] = useState("");

  async function loadSubjects() {
    try {
      const res = await axios.get<{ subjects: Subject[] }>("/api/admin/subjects");
      setSubjects(res.data.subjects);
    } catch {
      // handled per-section
    }
  }

  async function refreshPendingContributorCount() {
    try {
      const res = await axios.get<{ requests: { status: string }[] }>("/api/admin/contributor-requests");
      setPendingContributorCount(res.data.requests.filter((r) => r.status === "PENDING").length);
    } catch {
      // badge just won't show
    }
  }

  useEffect(() => {
    loadSubjects();
    refreshPendingContributorCount();
  }, []);

  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: "universities", label: "Universities" },
    { key: "school", label: "School & Streams" },
    { key: "subjects", label: "Subjects" },
    { key: "contributors", label: "Contributor Requests", badge: pendingContributorCount },
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/admin" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
              ← Admin Console
            </Link>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">Academic Management</h1>
            <p className="mt-1 text-slate-500">
              Universities, programs, semesters, school classes, streams, and the subject catalog behind Study Hub.
            </p>
          </div>
        </div>

        <div className="mb-6 flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                tab === t.key ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {t.label}
              {!!t.badge && (
                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        <ErrorBanner message={error} />

        {tab === "universities" && <UniversitiesSection subjects={subjects} onError={setError} />}
        {tab === "school" && <SchoolSection subjects={subjects} onError={setError} />}
        {tab === "subjects" && <SubjectsSection subjects={subjects} onReload={loadSubjects} onError={setError} />}
        {tab === "contributors" && <ContributorRequestsSection onDecided={refreshPendingContributorCount} onError={setError} />}
      </div>
    </main>
  );
}

/* --------------------------------------------------------------------- */
/* Universities → Programs → Semesters → Subjects                        */
/* --------------------------------------------------------------------- */

function UniversitiesSection({
  subjects,
  onError,
}: {
  subjects: Subject[];
  onError: (msg: string) => void;
}) {
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await axios.get<{ universities: University[] }>("/api/admin/universities");
      setUniversities(res.data.universities);
    } catch {
      onError("Unable to load universities");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addUniversity(name: string) {
    try {
      await axios.post("/api/admin/universities", { name });
      onError("");
      load();
    } catch (err) {
      onError(axios.isAxiosError(err) ? err.response?.data?.message || "Unable to add university" : "Unable to add university");
    }
  }

  async function toggleActive(u: University) {
    try {
      await axios.patch(`/api/admin/universities/${u.id}`, { isActive: !u.isActive });
      setUniversities((cur) => cur.map((x) => (x.id === u.id ? { ...x, isActive: !u.isActive } : x)));
    } catch {
      onError("Unable to update university");
    }
  }

  async function deleteUniversity(u: University) {
    if (!window.confirm(`Delete ${u.name}? This only works if it has no study materials.`)) return;
    try {
      await axios.delete(`/api/admin/universities/${u.id}`);
      setUniversities((cur) => cur.filter((x) => x.id !== u.id));
      if (selectedUniversity?.id === u.id) setSelectedUniversity(null);
    } catch (err) {
      onError(axios.isAxiosError(err) ? err.response?.data?.message || "Unable to delete university" : "Unable to delete university");
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Add a university</h2>
        <InlineAddForm placeholder="e.g. Kathmandu University" buttonLabel="Add" onSubmit={addUniversity} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-900">
          Universities <span className="font-normal text-slate-400">({universities.length})</span>
        </h2>

        {loading ? (
          <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
        ) : (
          <div className="divide-y divide-slate-100">
            {universities.map((u) => (
              <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <button
                    onClick={() => setSelectedUniversity(u)}
                    className={`text-left font-semibold ${selectedUniversity?.id === u.id ? "text-indigo-600" : "text-slate-900 hover:text-indigo-600"}`}
                  >
                    {u.name}
                  </button>
                  <p className="text-xs text-slate-400">{u._count.programs} program(s){!u.isActive && " · hidden"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedUniversity(u)}
                    className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                  >
                    Manage Programs
                  </button>
                  <button
                    onClick={() => toggleActive(u)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    {u.isActive ? "Hide" : "Show"}
                  </button>
                  <button
                    onClick={() => deleteUniversity(u)}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {selectedUniversity && (
        <ProgramsPanel university={selectedUniversity} subjects={subjects} onError={onError} />
      )}
    </div>
  );
}

function ProgramsPanel({
  university,
  subjects,
  onError,
}: {
  university: University;
  subjects: Subject[];
  onError: (msg: string) => void;
}) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await axios.get<{ programs: Program[] }>(`/api/admin/programs?universityId=${university.id}`);
      setPrograms(res.data.programs);
    } catch {
      onError("Unable to load programs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setSelectedProgram(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [university.id]);

  async function addProgram(name: string) {
    try {
      await axios.post("/api/admin/programs", { universityId: university.id, name });
      onError("");
      load();
    } catch (err) {
      onError(axios.isAxiosError(err) ? err.response?.data?.message || "Unable to add program" : "Unable to add program");
    }
  }

  async function deleteProgram(p: Program) {
    if (!window.confirm(`Delete ${p.name}?`)) return;
    try {
      await axios.delete(`/api/admin/programs/${p.id}`);
      setPrograms((cur) => cur.filter((x) => x.id !== p.id));
      if (selectedProgram?.id === p.id) setSelectedProgram(null);
    } catch (err) {
      onError(axios.isAxiosError(err) ? err.response?.data?.message || "Unable to delete program" : "Unable to delete program");
    }
  }

  const panelRef = useScrollIntoViewOnMount<HTMLElement>();

  return (
    <section ref={panelRef} className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-6">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-indigo-600">Programs at</p>
      <h3 className="mb-4 text-lg font-bold text-slate-900">{university.name}</h3>

      <div className="mb-5 rounded-xl bg-white p-4">
        <InlineAddForm placeholder="e.g. Computer Engineering" buttonLabel="Add Program" onSubmit={addProgram} />
      </div>

      {loading ? (
        <div className="h-16 animate-pulse rounded-xl bg-white" />
      ) : programs.length === 0 ? (
        <p className="text-sm text-slate-500">No programs yet — add the first one above ↑</p>
      ) : (
        <div className="space-y-2">
          {programs.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white px-4 py-3">
              <div>
                <button
                  onClick={() => setSelectedProgram(p)}
                  className={`text-left font-semibold ${selectedProgram?.id === p.id ? "text-indigo-600" : "text-slate-900 hover:text-indigo-600"}`}
                >
                  {p.name}
                </button>
                <p className="text-xs text-slate-400">{p._count.semesters} semester(s) set up</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedProgram(p)}
                  className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                >
                  Manage Semesters
                </button>
                <button
                  onClick={() => deleteProgram(p)}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedProgram && (
        <div className="mt-5">
          <SemestersPanel program={selectedProgram} subjects={subjects} onError={onError} />
        </div>
      )}
    </section>
  );
}

function SemestersPanel({
  program,
  subjects,
  onError,
}: {
  program: Program;
  subjects: Subject[];
  onError: (msg: string) => void;
}) {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(null);
  const [newNumber, setNewNumber] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await axios.get<{ semesters: Semester[] }>(`/api/admin/semesters?programId=${program.id}`);
      setSemesters(res.data.semesters);
    } catch {
      onError("Unable to load semesters");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setSelectedSemester(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [program.id]);

  async function addSemester(e: React.FormEvent) {
    e.preventDefault();
    const number = Number(newNumber);
    if (!number || number < 1) return;
    try {
      await axios.post("/api/admin/semesters", { programId: program.id, number });
      setNewNumber("");
      onError("");
      load();
    } catch (err) {
      onError(axios.isAxiosError(err) ? err.response?.data?.message || "Unable to add semester" : "Unable to add semester");
    }
  }

  const panelRef = useScrollIntoViewOnMount<HTMLElement>();

  return (
    <section ref={panelRef} className="rounded-2xl border border-purple-100 bg-purple-50/50 p-5">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-purple-600">Semesters for</p>
      <h4 className="mb-4 font-bold text-slate-900">{program.name}</h4>

      <form onSubmit={addSemester} className="mb-4 flex gap-2">
        <input
          type="number"
          min={1}
          max={12}
          value={newNumber}
          onChange={(e) => setNewNumber(e.target.value)}
          placeholder="Semester #"
          className="w-32 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
        />
        <button
          type="submit"
          disabled={!newNumber}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add Semester
        </button>
      </form>

      {loading ? (
        <div className="h-14 animate-pulse rounded-xl bg-white" />
      ) : semesters.length === 0 ? (
        <p className="text-sm text-slate-500">No semesters yet — add one above ↑</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {semesters.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSemester(s)}
              className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                selectedSemester?.id === s.id
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300"
              }`}
            >
              {s.label} <span className="opacity-70">({s._count.programSubjects})</span>
            </button>
          ))}
        </div>
      )}

      {selectedSemester && (
        <div className="mt-5">
          <SubjectAssignmentPanel
            title={`Subjects in ${selectedSemester.label}`}
            subjects={subjects}
            fetchUrl={`/api/admin/program-subjects?semesterId=${selectedSemester.id}`}
            listKey="programSubjects"
            assignUrl="/api/admin/program-subjects"
            assignExtra={{ semesterId: selectedSemester.id }}
            removeUrlBase="/api/admin/program-subjects"
            onError={onError}
          />
        </div>
      )}
    </section>
  );
}

/* --------------------------------------------------------------------- */
/* Reusable "assign a subject from the catalog" list + picker            */
/* --------------------------------------------------------------------- */

function SubjectAssignmentPanel({
  title,
  subjects,
  fetchUrl,
  listKey,
  assignUrl,
  assignExtra,
  removeUrlBase,
  onError,
}: {
  title: string;
  subjects: Subject[];
  fetchUrl: string;
  listKey: "programSubjects" | "classSubjects";
  assignUrl: string;
  assignExtra: Record<string, string>;
  removeUrlBase: string;
  onError: (msg: string) => void;
}) {
  const [assigned, setAssigned] = useState<(ProgramSubject | ClassSubject)[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickSubjectId, setPickSubjectId] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await axios.get<Record<string, (ProgramSubject | ClassSubject)[]>>(fetchUrl);
      setAssigned(res.data[listKey] || []);
    } catch {
      onError("Unable to load subjects");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchUrl]);

  async function assign(e: React.FormEvent) {
    e.preventDefault();
    if (!pickSubjectId) return;
    try {
      await axios.post(assignUrl, { subjectId: pickSubjectId, ...assignExtra });
      setPickSubjectId("");
      onError("");
      load();
    } catch (err) {
      onError(axios.isAxiosError(err) ? err.response?.data?.message || "Unable to assign subject" : "Unable to assign subject");
    }
  }

  async function remove(id: string) {
    try {
      await axios.delete(`${removeUrlBase}/${id}`);
      setAssigned((cur) => cur.filter((x) => x.id !== id));
    } catch (err) {
      onError(axios.isAxiosError(err) ? err.response?.data?.message || "Unable to remove subject" : "Unable to remove subject");
    }
  }

  const availableSubjects = subjects.filter((s) => !assigned.some((a) => a.subject.id === s.id));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h5 className="mb-3 font-bold text-slate-900">{title}</h5>

      <form onSubmit={assign} className="mb-4 flex gap-2">
        <select
          value={pickSubjectId}
          onChange={(e) => setPickSubjectId(e.target.value)}
          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white"
        >
          <option value="">Choose a subject to assign...</option>
          {availableSubjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={!pickSubjectId}
          className="shrink-0 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Assign
        </button>
      </form>

      {subjects.length === 0 && (
        <p className="mb-3 text-xs text-amber-600">No subjects exist yet — add some in the Subjects tab first.</p>
      )}

      {loading ? (
        <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
      ) : assigned.length === 0 ? (
        <p className="text-sm text-slate-500">No subjects assigned yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {assigned.map((a) => (
            <span key={a.id} className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">
              {a.subject.name}
              {"stream" in a && a.stream && <span className="text-xs text-slate-400">· {a.stream.name}</span>}
              <button onClick={() => remove(a.id)} aria-label={`Remove ${a.subject.name}`} className="text-slate-400 hover:text-red-600">
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------------- */
/* School & Streams                                                       */
/* --------------------------------------------------------------------- */

function SchoolSection({
  subjects,
  onError,
}: {
  subjects: Subject[];
  onError: (msg: string) => void;
}) {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [schoolClasses, setSchoolClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<SchoolClass | null>(null);
  const [selectedStreamId, setSelectedStreamId] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [streamsRes, classesRes] = await Promise.all([
        axios.get<{ streams: Stream[] }>("/api/admin/streams"),
        axios.get<{ schoolClasses: SchoolClass[] }>("/api/admin/school-classes"),
      ]);
      setStreams(streamsRes.data.streams);
      setSchoolClasses(classesRes.data.schoolClasses);
    } catch {
      onError("Unable to load school data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addStream(name: string) {
    try {
      await axios.post("/api/admin/streams", { name });
      onError("");
      load();
    } catch (err) {
      onError(axios.isAxiosError(err) ? err.response?.data?.message || "Unable to add stream" : "Unable to add stream");
    }
  }

  function selectClass(c: SchoolClass) {
    setSelectedClass(c);
    setSelectedStreamId("");
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-lg font-bold text-slate-900">Streams</h2>
        <p className="mb-4 text-sm text-slate-500">Used by Class 11 &amp; 12 (Science, Management, Humanities, Education, ...).</p>
        <InlineAddForm placeholder="e.g. Science" buttonLabel="Add Stream" onSubmit={addStream} />

        {!loading && (
          <div className="mt-4 flex flex-wrap gap-2">
            {streams.map((s) => (
              <span key={s.id} className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">
                {s.name} <span className="text-xs text-slate-400">({s._count.classSubjects})</span>
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-900">School Classes</h2>

        {loading ? (
          <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {schoolClasses.map((c) => (
              <button
                key={c.id}
                onClick={() => selectClass(c)}
                className={`rounded-xl border px-3 py-3 text-center text-sm font-semibold transition ${
                  selectedClass?.id === c.id
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300"
                }`}
              >
                {c.name}
                {c.hasStreams && <div className="text-xs opacity-70">streams</div>}
              </button>
            ))}
          </div>
        )}
      </section>

      {selectedClass && (
        <section className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-6">
          <h3 className="mb-4 text-lg font-bold text-slate-900">{selectedClass.name}</h3>

          {selectedClass.hasStreams ? (
            <>
              <p className="mb-3 text-sm text-slate-600">Pick a stream to manage its subjects:</p>
              <div className="mb-5 flex flex-wrap gap-2">
                {streams.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStreamId(s.id)}
                    className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                      selectedStreamId === s.id
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300"
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>

              {selectedStreamId && (
                <SubjectAssignmentPanel
                  title={`${selectedClass.name} · ${streams.find((s) => s.id === selectedStreamId)?.name} subjects`}
                  subjects={subjects}
                  fetchUrl={`/api/admin/class-subjects?schoolClassId=${selectedClass.id}`}
                  listKey="classSubjects"
                  assignUrl="/api/admin/class-subjects"
                  assignExtra={{ schoolClassId: selectedClass.id, streamId: selectedStreamId }}
                  removeUrlBase="/api/admin/class-subjects"
                  onError={onError}
                />
              )}
            </>
          ) : (
            <SubjectAssignmentPanel
              title={`${selectedClass.name} subjects`}
              subjects={subjects}
              fetchUrl={`/api/admin/class-subjects?schoolClassId=${selectedClass.id}`}
              listKey="classSubjects"
              assignUrl="/api/admin/class-subjects"
              assignExtra={{ schoolClassId: selectedClass.id }}
              removeUrlBase="/api/admin/class-subjects"
              onError={onError}
            />
          )}
        </section>
      )}
    </div>
  );
}

/* --------------------------------------------------------------------- */
/* Subjects catalog                                                       */
/* --------------------------------------------------------------------- */

function SubjectsSection({
  subjects,
  onReload,
  onError,
}: {
  subjects: Subject[];
  onReload: () => void;
  onError: (msg: string) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function addSubject(name: string) {
    try {
      await axios.post("/api/admin/subjects", { name });
      onError("");
      onReload();
    } catch (err) {
      onError(axios.isAxiosError(err) ? err.response?.data?.message || "Unable to add subject" : "Unable to add subject");
    }
  }

  async function deleteSubject(s: Subject) {
    if (!window.confirm(`Delete ${s.name}?`)) return;
    try {
      await axios.delete(`/api/admin/subjects/${s.id}`);
      onError("");
      onReload();
    } catch (err) {
      onError(axios.isAxiosError(err) ? err.response?.data?.message || "Unable to delete subject" : "Unable to delete subject");
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-lg font-bold text-slate-900">Subject catalog</h2>
        <p className="mb-4 text-sm text-slate-500">
          Shared between school and university — create a subject once here, then assign it wherever it&apos;s taught.
        </p>
        <InlineAddForm placeholder="e.g. Database Management Systems" buttonLabel="Add Subject" onSubmit={addSubject} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-900">
          All subjects <span className="font-normal text-slate-400">({subjects.length})</span>
        </h2>

        {subjects.length === 0 ? (
          <p className="text-sm text-slate-500">No subjects yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {subjects.map((s) => (
              <div key={s.id} className="py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{s.name}</p>
                    <p className="text-xs text-slate-400">
                      {s._count.classSubjects} school assignment(s) · {s._count.programSubjects} university assignment(s)
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                      className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                    >
                      {expandedId === s.id ? "Hide chapters" : "Manage chapters"}
                    </button>
                    <button
                      onClick={() => deleteSubject(s)}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {expandedId === s.id && (
                  <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <ChaptersPanel subjectId={s.id} onError={onError} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* --------------------------------------------------------------------- */
/* Chapters (nested under a Subject)                                     */
/* --------------------------------------------------------------------- */

interface ChapterRow {
  id: string;
  title: string;
  sortOrder: number;
  isActive: boolean;
  _count: { studyMaterials: number };
}

interface ChapterSuggestionRow {
  id: string;
  title: string;
  note: string | null;
  createdAt: string;
  suggestedBy: { full_name: string; email: string };
}

function ChaptersPanel({ subjectId, onError }: { subjectId: string; onError: (msg: string) => void }) {
  const [chapters, setChapters] = useState<ChapterRow[]>([]);
  const [suggestions, setSuggestions] = useState<ChapterSuggestionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [chapRes, sugRes] = await Promise.all([
        axios.get<{ chapters: ChapterRow[] }>(`/api/admin/chapters?subjectId=${subjectId}`),
        axios.get<{ suggestions: ChapterSuggestionRow[] }>(`/api/admin/chapter-suggestions?subjectId=${subjectId}`),
      ]);
      setChapters(chapRes.data.chapters);
      setSuggestions(sugRes.data.suggestions);
    } catch {
      onError("Unable to load chapters");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId]);

  async function decideSuggestion(id: string, decision: "APPROVE" | "REJECT") {
    setBusyId(id);
    try {
      await axios.patch(`/api/admin/chapter-suggestions/${id}`, { decision });
      onError("");
      await load();
    } catch (err) {
      onError(axios.isAxiosError(err) ? err.response?.data?.message || "Unable to update suggestion" : "Unable to update suggestion");
    } finally {
      setBusyId(null);
    }
  }

  async function addChapter(title: string) {
    try {
      await axios.post("/api/admin/chapters", { subjectId, title, sortOrder: chapters.length });
      onError("");
      load();
    } catch (err) {
      onError(axios.isAxiosError(err) ? err.response?.data?.message || "Unable to add chapter" : "Unable to add chapter");
    }
  }

  async function toggleActive(chapter: ChapterRow) {
    setBusyId(chapter.id);
    try {
      await axios.patch(`/api/admin/chapters/${chapter.id}`, { isActive: !chapter.isActive });
      onError("");
      await load();
    } catch (err) {
      onError(axios.isAxiosError(err) ? err.response?.data?.message || "Unable to update chapter" : "Unable to update chapter");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(chapter: ChapterRow) {
    if (!window.confirm(`Delete "${chapter.title}"? Materials in this chapter will just become chapterless.`)) return;
    setBusyId(chapter.id);
    try {
      await axios.delete(`/api/admin/chapters/${chapter.id}`);
      onError("");
      await load();
    } catch (err) {
      onError(axios.isAxiosError(err) ? err.response?.data?.message || "Unable to delete chapter" : "Unable to delete chapter");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-3">
      <InlineAddForm placeholder="e.g. Chapter 3: SQL" buttonLabel="Add Chapter" onSubmit={addChapter} />

      {loading ? (
        <div className="h-10 animate-pulse rounded-lg bg-white" />
      ) : chapters.length === 0 ? (
        <p className="text-sm text-slate-500">No chapters yet — uploads to this subject will be chapterless until you add some.</p>
      ) : (
        <div className="space-y-1.5">
          {chapters.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2">
              <span className={`text-sm ${c.isActive ? "text-slate-700" : "text-slate-400 line-through"}`}>
                {c.title} <span className="text-xs text-slate-400">({c._count.studyMaterials})</span>
              </span>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => toggleActive(c)}
                  disabled={busyId === c.id}
                  className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                >
                  {c.isActive ? "Disable" : "Enable"}
                </button>
                <button
                  onClick={() => remove(c)}
                  disabled={busyId === c.id}
                  className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-700">
            Suggested by contributors ({suggestions.length})
          </p>
          <div className="space-y-2">
            {suggestions.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-slate-800">{s.title}</p>
                  <p className="text-xs text-slate-400">by {s.suggestedBy.full_name}{s.note ? ` — "${s.note}"` : ""}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => decideSuggestion(s.id, "APPROVE")}
                    disabled={busyId === s.id}
                    className="rounded-lg bg-green-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => decideSuggestion(s.id, "REJECT")}
                    disabled={busyId === s.id}
                    className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------------- */
/* Contributor Requests + subject-level access grants                    */
/* --------------------------------------------------------------------- */

interface ContributorRequestAdminRow {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  message: string | null;
  createdAt: string;
  user: { id: string; full_name: string; email: string };
  schoolClass: { id: string; name: string } | null;
  program: { id: string; name: string; university: { name: string } } | null;
}

function requestTargetLabel(r: ContributorRequestAdminRow): string {
  return r.schoolClass ? r.schoolClass.name : `${r.program?.name} — ${r.program?.university.name}`;
}

function ContributorRequestsSection({
  onDecided,
  onError,
}: {
  onDecided: () => void;
  onError: (msg: string) => void;
}) {
  const [requests, setRequests] = useState<ContributorRequestAdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await axios.get<{ requests: ContributorRequestAdminRow[] }>("/api/admin/contributor-requests");
      setRequests(res.data.requests);
    } catch {
      onError("Unable to load contributor requests");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function decide(id: string, decision: "APPROVE" | "REJECT") {
    setBusyId(id);
    try {
      await axios.patch(`/api/admin/contributor-requests/${id}`, { decision });
      onError("");
      await load();
      onDecided();
      if (decision === "APPROVE") setExpandedId(id);
    } catch (err) {
      onError(axios.isAxiosError(err) ? err.response?.data?.message || "Unable to update request" : "Unable to update request");
    } finally {
      setBusyId(null);
    }
  }

  const pending = requests.filter((r) => r.status === "PENDING");
  const approved = requests.filter((r) => r.status === "APPROVED");
  const rejected = requests.filter((r) => r.status === "REJECTED");

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-900">
          Pending requests <span className="font-normal text-slate-400">({pending.length})</span>
        </h2>

        {loading ? (
          <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
        ) : pending.length === 0 ? (
          <p className="text-sm text-slate-500">No pending requests.</p>
        ) : (
          <div className="space-y-3">
            {pending.map((r) => (
              <div key={r.id} className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{r.user.full_name} <span className="font-normal text-slate-500">({r.user.email})</span></p>
                    <p className="mt-0.5 text-sm text-slate-600">
                      wants to contribute to <span className="font-semibold">{requestTargetLabel(r)}</span>
                    </p>
                    {r.message && <p className="mt-2 text-sm italic text-slate-500">&quot;{r.message}&quot;</p>}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => decide(r.id, "APPROVE")}
                      disabled={busyId === r.id}
                      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => decide(r.id, "REJECT")}
                      disabled={busyId === r.id}
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {approved.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-bold text-slate-900">
            Approved <span className="font-normal text-slate-400">({approved.length})</span>
          </h2>
          <p className="mb-4 text-sm text-slate-500">
            Approving a request doesn&apos;t grant upload rights by itself — pick the exact subjects below.
          </p>
          <div className="space-y-3">
            {approved.map((r) => (
              <div key={r.id} className="rounded-xl border border-slate-200 p-4">
                <button
                  onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                  className="flex w-full flex-wrap items-center justify-between gap-3 text-left"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{r.user.full_name} <span className="font-normal text-slate-500">({r.user.email})</span></p>
                    <p className="text-sm text-slate-500">{requestTargetLabel(r)}</p>
                  </div>
                  <span className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
                    {expandedId === r.id ? "Hide" : "Manage subject access"}
                  </span>
                </button>

                {expandedId === r.id && (
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <GrantAccessPanel userId={r.user.id} schoolClassId={r.schoolClass?.id} programId={r.program?.id} onError={onError} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {rejected.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Rejected</h2>
          <div className="divide-y divide-slate-100">
            {rejected.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{r.user.full_name}</p>
                  <p className="text-xs text-slate-500">{requestTargetLabel(r)}</p>
                </div>
                <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">REJECTED</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/* --------------------------------------------------------------------- */
/* Grant / revoke subject-level ContributorPermission                    */
/* --------------------------------------------------------------------- */

interface CandidateSubject {
  id: string; // ClassSubject or ProgramSubject id
  label: string;
}

interface PermissionAdminRow {
  id: string;
  isActive: boolean;
  classSubject: { id: string } | null;
  programSubject: { id: string } | null;
}

function GrantAccessPanel({
  userId,
  schoolClassId,
  programId,
  onError,
}: {
  userId: string;
  schoolClassId?: string;
  programId?: string;
  onError: (msg: string) => void;
}) {
  const [candidates, setCandidates] = useState<CandidateSubject[]>([]);
  const [permissions, setPermissions] = useState<PermissionAdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      if (schoolClassId) {
        const [csRes, permRes] = await Promise.all([
          axios.get<{ classSubjects: { id: string; subject: { name: string }; stream: { name: string } | null }[] }>(
            `/api/admin/class-subjects?schoolClassId=${schoolClassId}`
          ),
          axios.get<{ permissions: PermissionAdminRow[] }>(`/api/admin/contributor-permissions?userId=${userId}`),
        ]);
        setCandidates(csRes.data.classSubjects.map((cs) => ({ id: cs.id, label: cs.stream ? `${cs.subject.name} (${cs.stream.name})` : cs.subject.name })));
        setPermissions(permRes.data.permissions);
      } else if (programId) {
        const [psRes, permRes] = await Promise.all([
          axios.get<{ programSubjects: { id: string; subject: { name: string }; semester: { label: string } }[] }>(
            `/api/admin/program-subjects?programId=${programId}`
          ),
          axios.get<{ permissions: PermissionAdminRow[] }>(`/api/admin/contributor-permissions?userId=${userId}`),
        ]);
        setCandidates(psRes.data.programSubjects.map((ps) => ({ id: ps.id, label: `${ps.subject.name} (${ps.semester.label})` })));
        setPermissions(permRes.data.permissions);
      }
    } catch {
      onError("Unable to load subjects for this target");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, schoolClassId, programId]);

  function findPermission(candidateId: string) {
    return permissions.find((p) => (schoolClassId ? p.classSubject?.id === candidateId : p.programSubject?.id === candidateId));
  }

  async function grant(candidateId: string) {
    setBusyKey(candidateId);
    try {
      await axios.post("/api/admin/contributor-permissions", schoolClassId ? { userId, classSubjectId: candidateId } : { userId, programSubjectId: candidateId });
      onError("");
      await load();
    } catch (err) {
      onError(axios.isAxiosError(err) ? err.response?.data?.message || "Unable to grant access" : "Unable to grant access");
    } finally {
      setBusyKey(null);
    }
  }

  async function toggle(permissionId: string, isActive: boolean) {
    setBusyKey(permissionId);
    try {
      await axios.patch(`/api/admin/contributor-permissions/${permissionId}`, { isActive });
      onError("");
      await load();
    } catch (err) {
      onError(axios.isAxiosError(err) ? err.response?.data?.message || "Unable to update access" : "Unable to update access");
    } finally {
      setBusyKey(null);
    }
  }

  if (loading) return <div className="h-16 animate-pulse rounded-xl bg-slate-100" />;
  if (candidates.length === 0) {
    return <p className="text-sm text-slate-500">No subjects assigned here yet — add subjects for this class/program first.</p>;
  }

  return (
    <div className="space-y-2">
      {candidates.map((c) => {
        const perm = findPermission(c.id);
        const busy = busyKey === c.id || (perm && busyKey === perm.id);
        return (
          <div key={c.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
            <span className="text-sm text-slate-700">{c.label}</span>
            {!perm ? (
              <button
                onClick={() => grant(c.id)}
                disabled={!!busy}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Grant
              </button>
            ) : perm.isActive ? (
              <button
                onClick={() => toggle(perm.id, false)}
                disabled={!!busy}
                className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Revoke
              </button>
            ) : (
              <button
                onClick={() => toggle(perm.id, true)}
                disabled={!!busy}
                className="rounded-lg border border-green-200 bg-white px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Restore
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
