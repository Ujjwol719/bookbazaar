'use client'

import axios from "axios"
import Link from "next/link"
import { useEffect, useState } from "react"
import Navbar from "@/components/Navbar"
import Footer from "@/components/home/footer"

interface Profile {
  hasPassword: boolean
  email: string
}

export default function SettingsPage() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    axios.get<{ profile: Profile }>("/api/profile").then((res) => {
      setProfile(res.data.profile)
      setLoggedIn(true)
    }).catch((err) => {
      if (axios.isAxiosError(err) && err.response?.status === 401) setLoggedIn(false)
    })
  }, [])

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setMessage("")
    if (newPassword !== confirmPassword) {
      setIsError(true)
      setMessage("New passwords don't match")
      return
    }
    setSaving(true)
    try {
      await axios.post("/api/auth/change-password", { currentPassword, newPassword })
      setIsError(false)
      setMessage("Password updated")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err) {
      setIsError(true)
      setMessage(axios.isAxiosError(err) ? err.response?.data?.message || "Unable to update password" : "Unable to update password")
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

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50 px-6 py-12">
        <div className="mx-auto max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Account</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Settings</h1>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Password</h2>

            {profile && !profile.hasPassword ? (
              <p className="mt-3 text-sm text-slate-500">
                Your account signs in with Google, Facebook, or GitHub and doesn&apos;t have a BookMandu password to
                change.
              </p>
            ) : (
              <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Current password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">New password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Confirm new password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                  />
                </div>

                {message && (
                  <div className={`rounded-xl px-4 py-3 text-sm ${isError ? "border border-red-200 bg-red-50 text-red-700" : "border border-green-200 bg-green-50 text-green-700"}`}>
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving || !currentPassword || newPassword.length < 8}
                  className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Updating..." : "Update password"}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
