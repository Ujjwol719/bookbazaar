'use client'

import axios from "axios"
import Link from "next/link"
import { useEffect, useState } from "react"

interface University {
  id: string
  name: string
  programs: { id: string; name: string }[]
}

interface SchoolClassOption {
  id: string
  level: number
  name: string
}

interface RequestRow {
  id: string
  status: "PENDING" | "APPROVED" | "REJECTED"
  createdAt: string
  schoolClass: { name: string } | null
  program: { name: string; university: { name: string } } | null
}

interface PermissionRow {
  id: string
  classSubject: { subject: { name: string }; schoolClass: { name: string }; stream: { name: string } | null } | null
  programSubject: { subject: { name: string }; semester: { program: { name: string; university: { name: string } } } } | null
}

type TargetKind = "school" | "university"

export default function BecomeContributor() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)
  const [universities, setUniversities] = useState<University[]>([])
  const [schoolClasses, setSchoolClasses] = useState<SchoolClassOption[]>([])
  const [kind, setKind] = useState<TargetKind>("school")
  const [schoolClassId, setSchoolClassId] = useState("")
  const [universityId, setUniversityId] = useState("")
  const [programId, setProgramId] = useState("")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState("")
  const [feedbackIsError, setFeedbackIsError] = useState(false)
  const [myRequests, setMyRequests] = useState<RequestRow[]>([])
  const [permissions, setPermissions] = useState<PermissionRow[]>([])
  const [reward, setReward] = useState<{ contributionReward: number; creditValueInRupees: string } | null>(null)

  const selectedUniversity = universities.find((u) => u.id === universityId)

  async function loadStatus() {
    try {
      const res = await axios.get("/api/contributor/my-requests")
      setMyRequests(res.data.requests)
      setPermissions(res.data.permissions)
      setLoggedIn(true)
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setLoggedIn(false)
      }
    }
  }

  useEffect(() => {
    axios.get<{ universities: University[] }>("/api/universities").then((res) => setUniversities(res.data.universities))
    axios.get<{ schoolClasses: SchoolClassOption[] }>("/api/school-classes").then((res) => setSchoolClasses(res.data.schoolClasses))
    axios.get("/api/credits/settings").then((res) => setReward(res.data))
    loadStatus()
  }, [])

  // Changing university clears the (now stale) program choice — a program
  // id from a different university would silently submit the wrong thing.
  useEffect(() => {
    setProgramId("")
  }, [universityId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const target = kind === "school" ? schoolClassId : programId
    if (!target) return
    setSubmitting(true)
    setFeedback("")
    try {
      const body = kind === "school" ? { schoolClassId, message: message || undefined } : { programId, message: message || undefined }
      const res = await axios.post("/api/contributor/request", body)
      setFeedbackIsError(false)
      setFeedback(res.data.message)
      setMessage("")
      setSchoolClassId("")
      setProgramId("")
      loadStatus()
    } catch (err) {
      setFeedbackIsError(true)
      setFeedback(axios.isAxiosError(err) ? err.response?.data?.message || "Couldn't send your request" : "Couldn't send your request")
    } finally {
      setSubmitting(false)
    }
  }

  if (loggedIn === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="max-w-sm text-center">
          <h1 className="text-2xl font-bold text-slate-900">Log in first</h1>
          <p className="mt-2 text-slate-500">You need a BookMandu account to request contributor access.</p>
          <Link href="/login" className="mt-6 inline-block rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700">
            Log in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-lg">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Study Hub</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Become a Contributor</h1>
          <p className="mt-3 text-slate-500">
            Pick the class or program you know best. Once an admin approves you and grants access to specific
            subjects, you can upload notes and question papers there.
          </p>

          <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <span className="text-2xl">🪙</span>
            <p className="text-sm font-semibold text-emerald-900">
              {reward
                ? <>Earn {reward.contributionReward} BookMandu Credits (≈ Rs. {Number(reward.creditValueInRupees) * reward.contributionReward}) for every approved upload</>
                : "Earn BookMandu Credits for every approved upload"}
              <span className="block text-xs font-normal text-emerald-700">Credits can be spent on any book at checkout.</span>
            </p>
          </div>

          <div className="mt-6 flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setKind("school")}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${kind === "school" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-white"}`}
            >
              School
            </button>
            <button
              type="button"
              onClick={() => setKind("university")}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${kind === "university" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-white"}`}
            >
              University
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {kind === "school" ? (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Class</label>
                <select
                  value={schoolClassId}
                  onChange={(e) => setSchoolClassId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                >
                  <option value="">Select a class...</option>
                  {schoolClasses.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">University</label>
                  <select
                    value={universityId}
                    onChange={(e) => setUniversityId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                  >
                    <option value="">Select a university...</option>
                    {universities.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Program</label>
                  <select
                    value={programId}
                    onChange={(e) => setProgramId(e.target.value)}
                    disabled={!universityId}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50 disabled:opacity-50"
                  >
                    <option value="">{universityId ? "Select a program..." : "Pick a university first"}</option>
                    {selectedUniversity?.programs.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Why you? (optional)</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="e.g. I'm a 5th-semester student in this program and have organized notes for most subjects."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
              />
            </div>

            {feedback && (
              <div className={`rounded-xl px-4 py-3 text-sm ${feedbackIsError ? "border border-red-200 bg-red-50 text-red-700" : "border border-green-200 bg-green-50 text-green-700"}`}>
                {feedback}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !(kind === "school" ? schoolClassId : programId)}
              className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white shadow-lg transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Sending..." : "Request Contributor Access"}
            </button>
          </form>
        </div>

        {(permissions.length > 0 || myRequests.length > 0) && (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Your status</h2>

            {permissions.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-green-600">You can upload to</p>
                <ul className="mt-2 space-y-1">
                  {permissions.map((p) => (
                    <li key={p.id} className="text-sm text-slate-700">
                      {p.classSubject && (
                        <>{p.classSubject.subject.name} — {p.classSubject.schoolClass.name}{p.classSubject.stream ? ` (${p.classSubject.stream.name})` : ""}</>
                      )}
                      {p.programSubject && (
                        <>{p.programSubject.subject.name} — {p.programSubject.semester.program.name}, {p.programSubject.semester.program.university.name}</>
                      )}
                    </li>
                  ))}
                </ul>
                <Link href="/contributor/dashboard" className="mt-3 inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                  Go to your Contributor Dashboard →
                </Link>
              </div>
            )}

            {myRequests.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Requests</p>
                <ul className="mt-2 space-y-2">
                  {myRequests.map((r) => (
                    <li key={r.id} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700">
                        {r.schoolClass ? r.schoolClass.name : `${r.program?.name} — ${r.program?.university.name}`}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          r.status === "PENDING"
                            ? "bg-amber-100 text-amber-700"
                            : r.status === "APPROVED"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {r.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
