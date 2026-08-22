'use client'

import axios from "axios"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"

interface PermissionOption {
  key: string // "class:<classSubjectId>" or "program:<programSubjectId>"
  label: string
  subjectId: string
}

interface PermissionRow {
  classSubject: { id: string; subject: { id: string; name: string }; schoolClass: { name: string }; stream: { name: string } | null } | null
  programSubject: { id: string; subject: { id: string; name: string }; semester: { program: { name: string; university: { name: string } } } } | null
}

interface Chapter {
  id: string
  title: string
}

export default function ContributeUpload() {
  return (
    <Suspense>
      <ContributeUploadForm />
    </Suspense>
  )
}

function ContributeUploadForm() {
  const searchParams = useSearchParams()
  const resubmitMaterialId = searchParams.get("resubmit")

  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)
  const [options, setOptions] = useState<PermissionOption[]>([])
  const [selectedKey, setSelectedKey] = useState("")
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [chapterId, setChapterId] = useState("")
  const [suggestedChapterTitle, setSuggestedChapterTitle] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<"NOTES" | "QUESTION_PAPER">("NOTES")
  const [file, setFile] = useState<File | null>(null)
  const [thumbnail, setThumbnail] = useState<File | null>(null)
  const [ownershipConfirmed, setOwnershipConfirmed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState("")
  const [feedbackIsError, setFeedbackIsError] = useState(false)

  useEffect(() => {
    axios.get("/api/contributor/my-requests").then((res) => {
      setLoggedIn(true)
      const perms: PermissionRow[] = res.data.permissions
      const opts: PermissionOption[] = perms.map((p) => {
        if (p.classSubject) {
          const cs = p.classSubject
          return {
            key: `class:${cs.id}`,
            subjectId: cs.subject.id,
            label: `${cs.subject.name} — ${cs.schoolClass.name}${cs.stream ? ` (${cs.stream.name})` : ""}`,
          }
        }
        const ps = p.programSubject!
        return {
          key: `program:${ps.id}`,
          subjectId: ps.subject.id,
          label: `${ps.subject.name} — ${ps.semester.program.name}, ${ps.semester.program.university.name}`,
        }
      })
      setOptions(opts)
    }).catch((err) => {
      if (axios.isAxiosError(err) && err.response?.status === 401) setLoggedIn(false)
      else setLoggedIn(true)
    })
  }, [])

  // Pre-fill from a "fix and resubmit" link on the dashboard.
  useEffect(() => {
    if (!resubmitMaterialId) return
    axios.get("/api/contributor/materials").then((res) => {
      const material = res.data.materials.find((m: { id: string }) => m.id === resubmitMaterialId)
      if (!material) return
      setTitle(material.title)
      setDescription(material.description || "")
      setType(material.type)
      if (material.classSubjectId) setSelectedKey(`class:${material.classSubjectId}`)
      else if (material.programSubjectId) setSelectedKey(`program:${material.programSubjectId}`)
    })
  }, [resubmitMaterialId])

  useEffect(() => {
    setChapterId("")
    const opt = options.find((o) => o.key === selectedKey)
    if (!opt) {
      setChapters([])
      return
    }
    axios.get(`/api/chapters?subjectId=${opt.subjectId}`).then((res) => setChapters(res.data.chapters))
  }, [selectedKey, options])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedKey || !file || !ownershipConfirmed || !title.trim()) return

    setSubmitting(true)
    setFeedback("")
    try {
      const [kind, id] = selectedKey.split(":")
      const formData = new FormData()
      formData.append("title", title.trim())
      formData.append("description", description.trim())
      formData.append("type", type)
      formData.append(kind === "class" ? "classSubjectId" : "programSubjectId", id)
      if (chapterId) formData.append("chapterId", chapterId)
      if (!chapterId && suggestedChapterTitle.trim()) formData.append("suggestedChapterTitle", suggestedChapterTitle.trim())
      formData.append("ownershipConfirmed", "true")
      formData.append("file", file)
      if (thumbnail) formData.append("thumbnail", thumbnail)
      if (resubmitMaterialId) formData.append("resubmitMaterialId", resubmitMaterialId)

      const res = await axios.post("/api/contributor/upload", formData, { headers: { "Content-Type": "multipart/form-data" } })
      setFeedbackIsError(false)
      setFeedback(res.data.message)
      setTitle("")
      setDescription("")
      setFile(null)
      setThumbnail(null)
      setChapterId("")
      setSuggestedChapterTitle("")
      setOwnershipConfirmed(false)
    } catch (err) {
      setFeedbackIsError(true)
      setFeedback(axios.isAxiosError(err) ? err.response?.data?.message || "Upload failed" : "Upload failed")
    } finally {
      setSubmitting(false)
    }
  }

  if (loggedIn === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="max-w-sm text-center">
          <h1 className="text-2xl font-bold text-slate-900">Log in first</h1>
          <Link href="/login" className="mt-6 inline-block rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700">Log in</Link>
        </div>
      </div>
    )
  }

  if (loggedIn === true && options.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="max-w-sm text-center">
          <h1 className="text-2xl font-bold text-slate-900">No upload access yet</h1>
          <p className="mt-2 text-slate-500">You need contributor access to at least one subject before you can upload.</p>
          <Link href="/become-contributor" className="mt-6 inline-block rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700">
            Become a Contributor
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-lg">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Contributor</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Upload study material</h1>
          <p className="mt-3 text-slate-500">
            Submitted uploads go to an admin for review before they appear on Study Hub. You&apos;ll earn BookMandu
            Credits once it&apos;s approved.
          </p>

          {resubmitMaterialId && (
            <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
              Resubmitting a previous upload — please re-upload the corrected file below.
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Subject</label>
              <select
                value={selectedKey}
                onChange={(e) => setSelectedKey(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
              >
                <option value="">Select a subject you&apos;re permitted for...</option>
                {options.map((o) => (
                  <option key={o.key} value={o.key}>{o.label}</option>
                ))}
              </select>
            </div>

            {selectedKey && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Chapter (optional)</label>
                <select
                  value={chapterId}
                  onChange={(e) => setChapterId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                >
                  <option value="">No specific chapter</option>
                  {chapters.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
                {!chapterId && (
                  <input
                    type="text"
                    value={suggestedChapterTitle}
                    onChange={(e) => setSuggestedChapterTitle(e.target.value)}
                    placeholder="Don't see the right chapter? Suggest one (optional)"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                  />
                )}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Unit 3 — SQL Joins, worked examples"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
              />
            </div>

            <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button type="button" onClick={() => setType("NOTES")} className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${type === "NOTES" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-white"}`}>
                Notes
              </button>
              <button type="button" onClick={() => setType("QUESTION_PAPER")} className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${type === "QUESTION_PAPER" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-white"}`}>
                Question Paper
              </button>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">File (PDF, JPG, PNG, or WEBP — max 20MB)</label>
              <input
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-3 file:py-1.5 file:text-white"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Cover thumbnail (optional)</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-slate-200 file:px-3 file:py-1.5 file:text-slate-700"
              />
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <input
                type="checkbox"
                checked={ownershipConfirmed}
                onChange={(e) => setOwnershipConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-indigo-600"
              />
              <span className="text-sm text-slate-600">
                I confirm this is my own work (or I have the right to share it), and I understand BookMandu can remove it if that turns out not to be true.
              </span>
            </label>

            {feedback && (
              <div className={`rounded-xl px-4 py-3 text-sm ${feedbackIsError ? "border border-red-200 bg-red-50 text-red-700" : "border border-green-200 bg-green-50 text-green-700"}`}>
                {feedback}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !selectedKey || !file || !ownershipConfirmed || !title.trim()}
              className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white shadow-lg transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Uploading..." : "Submit for Review"}
            </button>
          </form>
        </div>

        <Link href="/contributor/dashboard" className="mt-4 block text-center text-sm font-semibold text-indigo-600 hover:text-indigo-700">
          View your submissions →
        </Link>
      </div>
    </div>
  )
}
