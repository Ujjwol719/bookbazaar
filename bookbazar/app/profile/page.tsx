'use client'

import axios from "axios"
import Link from "next/link"
import { useEffect, useState } from "react"
import Navbar from "@/components/Navbar"
import Footer from "@/components/home/footer"

interface Profile {
  full_name: string
  email: string
  phone: string | null
  role: "BUYER" | "SELLER" | "ADMIN"
  isVerified: boolean
  avatarUrl: string | null
  created_at: string
  googleId: string | null
  githubId: string | null
  facebookId: string | null
  hasPassword: boolean
}

export default function ProfilePage() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    axios.get<{ profile: Profile }>("/api/profile").then((res) => {
      setProfile(res.data.profile)
      setFullName(res.data.profile.full_name)
      setPhone(res.data.profile.phone || "")
      setLoggedIn(true)
    }).catch((err) => {
      if (axios.isAxiosError(err) && err.response?.status === 401) setLoggedIn(false)
    })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage("")
    try {
      await axios.patch("/api/auth/update-profile", { full_name: fullName, phone })
      setIsError(false)
      setMessage("Profile updated")
      const res = await axios.get<{ profile: Profile }>("/api/profile")
      setProfile(res.data.profile)
    } catch (err) {
      setIsError(true)
      setMessage(axios.isAxiosError(err) ? err.response?.data?.message || "Unable to save" : "Unable to save")
    } finally {
      setSaving(false)
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

  const initials = profile?.full_name?.trim()?.slice(0, 1).toUpperCase() || "?"
  const linkedProviders = [
    profile?.googleId ? "Google" : null,
    profile?.githubId ? "GitHub" : null,
    profile?.facebookId ? "Facebook" : null,
  ].filter(Boolean)

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50 px-6 py-12">
        <div className="mx-auto max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Account</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">My Profile</h1>

          {profile && (
            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-2xl font-semibold text-white">
                  {initials}
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">{profile.full_name}</p>
                  <p className="text-sm text-slate-500">{profile.email}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">{profile.role}</span>
                    {profile.isVerified && <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">✓ Verified</span>}
                  </div>
                </div>
              </div>

              <form onSubmit={handleSave} className="mt-6 space-y-4 border-t border-slate-100 pt-6">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+977 98XXXXXXXX"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-500 outline-none"
                  />
                  <p className="mt-1 text-xs text-slate-400">Email can&apos;t be changed here.</p>
                </div>

                {message && (
                  <div className={`rounded-xl px-4 py-3 text-sm ${isError ? "border border-red-200 bg-red-50 text-red-700" : "border border-green-200 bg-green-50 text-green-700"}`}>
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving || fullName.trim().length < 2}
                  className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </form>

              <div className="mt-6 border-t border-slate-100 pt-4 text-sm text-slate-500">
                <p>Member since {new Date(profile.created_at).toLocaleDateString()}</p>
                {linkedProviders.length > 0 && <p className="mt-1">Signed in with: {linkedProviders.join(", ")}</p>}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
