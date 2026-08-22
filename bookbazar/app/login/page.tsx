'use client'
import axios from "axios"
import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { trackEvent } from "@/lib/analytics"
import { authErrorMessage } from "@/lib/auth-errors"
import BrandPanel from "@/components/auth/BrandPanel"
import AuthTabs from "@/components/auth/AuthTabs"
import SocialLoginRow from "@/components/auth/SocialLoginRow"

export default function Login() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const searchParams = useSearchParams()
  const oauthError = authErrorMessage(searchParams.get("error"))

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  async function handleForm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorMessage("")
    setIsSubmitting(true)
    try {
      const response = await axios.post("/api/auth/login", { email, password })

      if (response.data.role == "ADMIN") {
        trackEvent("login", { method: "password", user_role: response.data.role })
        router.push("/admin")
      }

      if (response.data.role === "SELLER") {
        trackEvent("login", { method: "password", user_role: response.data.role })
        if (response.data.hasStore) {
          router.push("/seller/dashboard")
        } else {
          router.push("/seller/onboard")
        }
      }

      if (response.data.role === "BUYER") {
        trackEvent("login", { method: "password", user_role: response.data.role })
        router.push("/")
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        const message = error.response?.data?.message

        if (status === 429) {
          setErrorMessage("Too many attempts. Please try again after a while.")
        } else if (status === 403) {
          setErrorMessage("Please verify your email. We've sent a new verification email to your inbox.")
        } else if (status === 404) {
          setErrorMessage(message ?? "No user found with that email.")
        } else if (status === 401) {
          setErrorMessage(message ?? "Wrong password.")
        } else {
          setErrorMessage("Login failed. Please try again.")
        }
      } else {
        setErrorMessage("Login failed. Please try again.")
      }
    } finally {
      setIsSubmitting(false)
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

          <AuthTabs active="login" />

          <div className="mt-6">
            <h1 className="text-2xl font-bold text-slate-900">Welcome back! 👋</h1>
            <p className="mt-1 text-sm text-slate-500">Login to continue your learning journey.</p>
          </div>

          {(errorMessage || oauthError) && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage || oauthError}
            </div>
          )}

          <form onSubmit={handleForm} className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Email or Username</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 6h16v12H4z" strokeLinejoin="round" /><path d="m4 7 8 6 8-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email or Username"
                  className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-12 text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
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
              <div className="mt-2 text-right text-sm">
                <Link href="/forgot-password" className="text-indigo-600 hover:text-indigo-700">
                  Forgot Password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 py-3 font-semibold text-white transition hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60"
            >
              {isSubmitting ? "Logging in..." : (
                <>
                  Login
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

          <SocialLoginRow from="login" />

          <div className="mt-6 flex items-start gap-3 rounded-2xl bg-indigo-50 p-4">
            <span className="text-2xl">🎁</span>
            <div>
              <p className="text-sm text-slate-700">
                <span className="font-semibold">New to BookMandu?</span> Sign up and get{" "}
                <span className="font-semibold text-indigo-600">10% off</span> your first order!
              </p>
              <Link href="/signup" className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                Create an account →
              </Link>
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
