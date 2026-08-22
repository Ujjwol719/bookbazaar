'use client'

import axios from 'axios'
import Link from 'next/link'
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { trackEvent } from "@/lib/analytics"
import { authErrorMessage } from "@/lib/auth-errors"
import BrandPanel from "@/components/auth/BrandPanel"
import AuthTabs from "@/components/auth/AuthTabs"
import SocialLoginRow from "@/components/auth/SocialLoginRow"

export default function Signup() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  )
}

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const oauthError = authErrorMessage(searchParams.get("error"))

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [role, setRole] = useState('')

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  async function handleForm(e: React.FormEvent) {
    e.preventDefault()

    setMessage('')

    if (!name.trim()) {
      setIsError(true)
      setMessage('Please enter your full name')
      return
    }

    if (!email.trim()) {
      setIsError(true)
      setMessage('Please enter your email')
      return
    }

    if (!/^\+?[0-9\s-]{7,15}$/.test(phone.trim())) {
      setIsError(true)
      setMessage('Please enter a valid phone number')
      return
    }

    if (!role) {
      setIsError(true)
      setMessage('Please select a role')
      return
    }

    if (password.length < 8) {
      setIsError(true)
      setMessage('Password must be at least 8 characters')
      return
    }

    if (password !== confirm) {
      setIsError(true)
      setMessage('Passwords do not match')
      return
    }

    try {
      setLoading(true)

      await axios.post('/api/auth/signup', {
        name,
        email,
        phone,
        password,
        role,
      })

      setIsError(false)
      setMessage('Signup successful. Please check your email for verification. It may be in Spam or Promotions.')

      trackEvent("sign_up", {
        method: "password",
        user_role: role,
      })

      setTimeout(() => {
        router.push('/login')
      }, 1500)
    } catch (error) {
      setIsError(true)

      setMessage(
        (axios.isAxiosError(error) && error.response?.data?.message) || 'Something went wrong'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="flex w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <BrandPanel />

        <div className="flex w-full flex-col p-8 md:p-10">
          <Link href="/" className="mb-6 flex items-center gap-2 text-lg font-bold text-indigo-700 lg:hidden">
            📚 BookMandu
          </Link>

          <AuthTabs active="signup" />

          <div className="mt-6">
            <h1 className="text-2xl font-bold text-slate-900">Create your account 🚀</h1>
            <p className="mt-1 text-sm text-slate-500">Join BookMandu and start your reading journey.</p>
          </div>

          {oauthError && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {oauthError}
            </div>
          )}

          <form onSubmit={handleForm} className="mt-5 space-y-3">

            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-3 text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />

            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-3 text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />

            <input
              type="tel"
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-3 text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />

            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-3 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            >
              <option value="">Select Role</option>
              <option value="BUYER">Buyer</option>
              <option value="SELLER">Seller</option>
            </select>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 pr-12 text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-3 flex items-center text-slate-500 transition hover:text-indigo-600"
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 3l18 18" />
                    <path d="M10.58 10.58A2 2 0 0 0 12 15a2 2 0 0 0 1.42-.58" />
                    <path d="M9.88 5.09A10.94 10.94 0 0 1 12 5c5.5 0 9.5 7 9.5 7a20.23 20.23 0 0 1-4.1 4.6" />
                    <path d="M6.61 6.61C3.85 8.7 2.5 12 2.5 12s2.5 7 9.5 7c1.56 0 2.96-.28 4.18-.74" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm Password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 pr-12 text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((current) => !current)}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                className="absolute inset-y-0 right-3 flex items-center text-slate-500 transition hover:text-indigo-600"
              >
                {showConfirmPassword ? (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 3l18 18" />
                    <path d="M10.58 10.58A2 2 0 0 0 12 15a2 2 0 0 0 1.42-.58" />
                    <path d="M9.88 5.09A10.94 10.94 0 0 1 12 5c5.5 0 9.5 7 9.5 7a20.23 20.23 0 0 1-4.1 4.6" />
                    <path d="M6.61 6.61C3.85 8.7 2.5 12 2.5 12s2.5 7 9.5 7c1.56 0 2.96-.28 4.18-.74" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            {message && (
              <div
                className={`rounded-xl p-3 text-sm ${
                  isError
                    ? "border border-red-200 bg-red-50 text-red-600"
                    : "border border-green-200 bg-green-50 text-green-600"
                }`}
              >
                {message}
              </div>
            )}

            <button
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 py-3 font-semibold text-white transition hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
            >
              {loading ? "Creating Account..." : (
                <>
                  Create Account
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </>
              )}
            </button>

          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs uppercase text-slate-400">or continue with</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <SocialLoginRow from="signup" />

          <p className="mt-3 text-center text-xs text-slate-400">
            Signing up with Google, Facebook, or GitHub creates a buyer account. Want to sell instead? Use the form above.
          </p>

          <div className="mt-4 flex items-start gap-3 rounded-2xl bg-indigo-50 p-4">
            <span className="text-2xl">🎁</span>
            <div>
              <p className="text-sm text-slate-700">
                Use code <span className="font-mono font-semibold text-indigo-600">FIRST10</span> at checkout for{" "}
                <span className="font-semibold text-indigo-600">10% off</span> your first order.
              </p>
            </div>
          </div>

          <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6l-8-4Z" /></svg>
            Your data is safe with us
          </p>
        </div>
      </div>
    </div>
  )
}
