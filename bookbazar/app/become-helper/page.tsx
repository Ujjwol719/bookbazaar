'use client'

import axios from "axios"
import Link from "next/link"
import { useEffect, useState } from "react"

interface University {
  id: string
  name: string
  programs: { id: string; name: string }[]
}

interface HelperRequestRow {
  id: string
  status: "PENDING" | "APPROVED" | "REJECTED"
  createdAt: string
  program: { name: string; university: { name: string } }
}

interface GrantedRow {
  id: string
  program: { name: string; university: { name: string } }
}

export default function BecomeHelper() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)
  const [universities, setUniversities] = useState<University[]>([])
  const [programId, setProgramId] = useState("")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState("")
  const [feedbackIsError, setFeedbackIsError] = useState(false)
  const [myRequests, setMyRequests] = useState<HelperRequestRow[]>([])
  const [granted, setGranted] = useState<GrantedRow[]>([])

  async function loadStatus() {
    try {
      const res = await axios.get("/api/helper/my-requests")
      setMyRequests(res.data.requests)
      setGranted(res.data.helperOf)
      setLoggedIn(true)
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setLoggedIn(false)
      }
    }
  }

  useEffect(() => {
    axios.get<{ universities: University[] }>("/api/universities").then((res) => setUniversities(res.data.universities))
    loadStatus()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!programId) return
    setSubmitting(true)
    setFeedback("")
    try {
      const res = await axios.post("/api/helper/request", { programId, message: message || undefined })
      setFeedbackIsError(false)
      setFeedback(res.data.message)
      setMessage("")
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
          <p className="mt-2 text-slate-500">You need a BookMandu account to request helper access.</p>
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
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Help maintain a program&apos;s notes</h1>
          <p className="mt-3 text-slate-500">
            Pick the program you know best. Once an admin approves you, you can add notes and question papers for that program — nothing else.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Program</label>
              <select
                value={programId}
                onChange={(e) => setProgramId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
              >
                <option value="">Select a program...</option>
                {universities.map((u) => (
                  <optgroup key={u.id} label={u.name}>
                    {u.programs.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

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
              disabled={submitting || !programId}
              className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white shadow-lg transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Sending..." : "Request Helper Access"}
            </button>
          </form>
        </div>

        {(granted.length > 0 || myRequests.length > 0) && (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Your status</h2>

            {granted.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-green-600">You&apos;re a helper for</p>
                <ul className="mt-2 space-y-1">
                  {granted.map((g) => (
                    <li key={g.id} className="text-sm text-slate-700">
                      {g.program.name} — {g.program.university.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {myRequests.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Requests</p>
                <ul className="mt-2 space-y-2">
                  {myRequests.map((r) => (
                    <li key={r.id} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700">{r.program.name} — {r.program.university.name}</span>
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
