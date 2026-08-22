'use client'

import axios from "axios"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

type Me = { id: string; email: string; role: "ADMIN" | "BUYER" | "SELLER" } | null

export default function BecomeSeller() {
  const router = useRouter()
  const [me, setMe] = useState<Me>(null)
  const [checked, setChecked] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    axios
      .get<Me>("/api/auth/me")
      .then((res) => setMe(res.data))
      .finally(() => setChecked(true))
  }, [])

  async function handleUpgrade() {
    setSubmitting(true)
    setError("")
    try {
      await axios.post("/api/auth/become-seller")
      router.push("/seller/onboard")
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Couldn't switch your account. Try again.")
      } else {
        setError("Couldn't switch your account. Try again.")
      }
      setSubmitting(false)
    }
  }

  if (checked && !me) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="max-w-sm text-center">
          <h1 className="text-2xl font-bold text-slate-900">Log in first</h1>
          <p className="mt-2 text-slate-500">You need a BookMandu account before you can start selling.</p>
          <Link href="/login" className="mt-6 inline-block rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700">
            Log in
          </Link>
        </div>
      </div>
    )
  }

  if (checked && me?.role === "SELLER") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="max-w-sm text-center">
          <h1 className="text-2xl font-bold text-slate-900">You&apos;re already a seller</h1>
          <p className="mt-2 text-slate-500">Head to your dashboard to manage your store and listings.</p>
          <Link href="/seller/dashboard" className="mt-6 inline-block rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700">
            Go to dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (checked && me?.role === "ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="max-w-sm text-center">
          <h1 className="text-2xl font-bold text-slate-900">Not available for admin accounts</h1>
          <p className="mt-2 text-slate-500">Create a separate buyer account if you&apos;d like to sell on BookMandu.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-16">
      <div className="w-full max-w-lg">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">For buyers</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Start selling on BookMandu</h1>
          <p className="mt-3 text-slate-500">
            Same account, same login — you&apos;ll keep your order history and just gain a seller dashboard.
          </p>

          <ul className="mt-6 space-y-3">
            <li className="flex gap-3 text-sm text-slate-700">
              <span className="text-lg">🏪</span>
              <span>Set up your store name, description, and phone number.</span>
            </li>
            <li className="flex gap-3 text-sm text-slate-700">
              <span className="text-lg">🪪</span>
              <span>Upload a government ID so we can verify you before you list books.</span>
            </li>
            <li className="flex gap-3 text-sm text-slate-700">
              <span className="text-lg">✅</span>
              <span>Our team reviews every store — you can list books once approved.</span>
            </li>
          </ul>

          {error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleUpgrade}
            disabled={submitting || !checked}
            className="mt-8 w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white shadow-lg transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Setting up your store..." : "Get Started"}
          </button>

          <p className="mt-4 text-center text-xs text-slate-400">
            You can keep buying books as usual — nothing about your account changes except this.
          </p>
        </div>
      </div>
    </div>
  )
}
