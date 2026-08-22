'use client'

import axios from "axios"
import { useState } from "react"

export default function ReportMaterialButton({ studyMaterialId }: { studyMaterialId: string }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState("")
  const [feedbackIsError, setFeedbackIsError] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!reason.trim()) return
    setSubmitting(true)
    try {
      const res = await axios.post("/api/study-materials/report", { studyMaterialId, reason: reason.trim() })
      setFeedbackIsError(false)
      setFeedback(res.data.message)
      setReason("")
    } catch (err) {
      setFeedbackIsError(true)
      setFeedback(
        axios.isAxiosError(err) && err.response?.status === 401
          ? "Log in to report a problem."
          : axios.isAxiosError(err)
          ? err.response?.data?.message || "Couldn't send your report"
          : "Couldn't send your report"
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-slate-400 underline decoration-dotted underline-offset-2 hover:text-slate-600"
      >
        Report a problem with this file
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="What's wrong with this material? (wrong content, broken file, not their own work, etc.)"
        rows={2}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
      />
      {feedback && (
        <p className={`mt-1.5 text-xs ${feedbackIsError ? "text-red-600" : "text-green-600"}`}>{feedback}</p>
      )}
      <div className="mt-2 flex gap-2">
        <button
          type="submit"
          disabled={submitting || !reason.trim()}
          className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Sending..." : "Submit report"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs font-medium text-slate-500 hover:text-slate-700">
          Cancel
        </button>
      </div>
    </form>
  )
}
