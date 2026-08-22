'use client'

import axios from "axios"
import Link from "next/link"
import { useEffect, useState } from "react"

interface PermissionRow {
  id: string
  classSubject: { subject: { name: string }; schoolClass: { name: string }; stream: { name: string } | null } | null
  programSubject: { subject: { name: string }; semester: { program: { name: string; university: { name: string } } } } | null
}

interface MaterialRow {
  id: string
  title: string
  type: "NOTES" | "QUESTION_PAPER"
  status: "PENDING" | "APPROVED" | "REJECTED" | "CHANGES_REQUESTED" | "UNPUBLISHED"
  reviewNote: string | null
  createdAt: string
  classSubjectId: string | null
  programSubjectId: string | null
}

interface Transaction {
  id: string
  amount: number
  type: string
  reason: string
  createdAt: string
}

const STATUS_STYLE: Record<MaterialRow["status"], string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  CHANGES_REQUESTED: "bg-orange-100 text-orange-700",
  UNPUBLISHED: "bg-slate-200 text-slate-600",
}

export default function ContributorDashboard() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)
  const [permissions, setPermissions] = useState<PermissionRow[]>([])
  const [materials, setMaterials] = useState<MaterialRow[]>([])
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])

  useEffect(() => {
    Promise.all([
      axios.get("/api/contributor/my-requests"),
      axios.get("/api/contributor/materials"),
      axios.get("/api/credits/wallet"),
    ]).then(([reqRes, matRes, walletRes]) => {
      setPermissions(reqRes.data.permissions)
      setMaterials(matRes.data.materials)
      setBalance(walletRes.data.balance)
      setTransactions(walletRes.data.transactions)
      setLoggedIn(true)
    }).catch((err) => {
      if (axios.isAxiosError(err) && err.response?.status === 401) setLoggedIn(false)
    })
  }, [])

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

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Contributor</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">Your Dashboard</h1>
          </div>
          <Link href="/contribute/upload" className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
            Upload material
          </Link>
        </div>

        {/* Wallet */}
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">BookMandu Credits</p>
          <p className="mt-1 text-4xl font-bold text-emerald-900">{balance}</p>
          <p className="mt-1 text-sm text-emerald-700">Earned from approved uploads — spend them at checkout on any book.</p>

          {transactions.length > 0 && (
            <div className="mt-4 divide-y divide-emerald-100 border-t border-emerald-100 pt-3">
              {transactions.slice(0, 8).map((t) => (
                <div key={t.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-emerald-900">{t.reason}</span>
                  <span className={`font-semibold ${t.amount > 0 ? "text-emerald-700" : "text-slate-600"}`}>
                    {t.amount > 0 ? "+" : ""}{t.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Permissions */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">You can upload to</h2>
          {permissions.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">
              No subjects granted yet. <Link href="/become-contributor" className="font-semibold text-indigo-600 hover:text-indigo-700">Request access →</Link>
            </p>
          ) : (
            <ul className="mt-3 space-y-1.5">
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
          )}
        </section>

        {/* Submissions */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Your submissions <span className="font-normal text-slate-400">({materials.length})</span></h2>
          {materials.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Nothing uploaded yet.</p>
          ) : (
            <div className="mt-3 divide-y divide-slate-100">
              {materials.map((m) => (
                <div key={m.id} className="py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900">{m.title}</p>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[m.status]}`}>{m.status.replace("_", " ")}</span>
                  </div>
                  <p className="text-xs text-slate-400">{m.type === "NOTES" ? "Notes" : "Question Paper"}</p>
                  {m.reviewNote && (m.status === "REJECTED" || m.status === "CHANGES_REQUESTED") && (
                    <p className="mt-1 text-sm italic text-slate-500">&quot;{m.reviewNote}&quot;</p>
                  )}
                  {(m.status === "CHANGES_REQUESTED" || m.status === "REJECTED") && (
                    <Link href={`/contribute/upload?resubmit=${m.id}`} className="mt-1 inline-block text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                      Fix and resubmit →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
