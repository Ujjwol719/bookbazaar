'use client'
import axios from "axios"
import { useState } from "react"
import Link  from "next/link"
import { useRouter } from "next/navigation"
import { trackEvent } from "@/lib/analytics"
export default function Login() {

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router= useRouter()
async function handleForm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorMessage("")
    setIsSubmitting(true)
    try {
      const response = await axios.post("/api/auth/login", {
        email,
        password,
      })

      if(response.data.role == "ADMIN") {
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

    } catch(error) {
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
  <div className="flex min-h-screen bg-slate-50">

    {/* LEFT LOGIN */}
    <div className="flex w-full items-center justify-center px-6 py-12 lg:w-[560px] lg:shrink-0 lg:px-16">
      <div className="w-full max-w-md">

        <Link href="/" className="mb-10 flex items-center gap-2 text-lg font-bold text-indigo-700 lg:hidden">
          📚 BookMandu
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">
            Welcome Back
          </h1>

          <p className="mt-2 text-slate-500">
            Login to continue your BookMandu journey.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">

          {errorMessage ? (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <form onSubmit={handleForm} className="space-y-5">

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Email Address
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-600 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 text-slate-900 placeholder-slate-600 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
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
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-600">
                <input type="checkbox" />
                Remember me
              </label>

           <Link
  href="/forgot-password"
  className="text-indigo-600 hover:text-indigo-700"
>
  Forgot Password?
</Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700"
            >
              {isSubmitting ? "Logging in..." : "Login"}
            </button>

          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs uppercase text-slate-400">
              or
            </span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <a
            href="/api/auth/google"
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 py-3 font-medium text-slate-700 transition hover:bg-slate-100 hover:border-slate-400"
          >
            <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6 29.6 4 24 4c-7.5 0-14 4.2-17.7 10.7z"/>
              <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.2-5.1l-6.6-5.4c-2 1.5-4.6 2.5-7.6 2.5-5.2 0-9.6-3.3-11.3-7.9l-6.6 5.1C9.9 39.7 16.4 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.5l6.6 5.4C41.4 35.8 44 30.4 44 24c0-1.3-.1-2.7-.4-3.5z"/>
            </svg>
            Continue with Google
          </a>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Sign Up
            </Link>
          </p>

        </div>
      </div>
    </div>

    {/* RIGHT BRANDING */}
    <div className="relative hidden overflow-hidden bg-linear-to-br from-indigo-700 via-indigo-800 to-slate-900 lg:flex lg:flex-1">

      <div className="absolute top-10 left-10 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl" />
      <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-purple-400/20 blur-3xl" />

      <div className="relative z-10 flex flex-col justify-center px-20 text-white">

        <div>
          <h1 className="text-5xl font-black">
            📚 BookMandu
          </h1>

          <p className="mt-3 max-w-xl text-lg text-slate-200">
            Discover books from trusted sellers and build your knowledge one page at a time.
          </p>
        </div>

        <div className="mt-10 space-y-3">

          <div className="flex items-start gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur-md">
            <span className="text-2xl">🛡️</span>
            <div>
              <h3 className="text-lg font-semibold">Verified sellers only</h3>
              <p className="mt-1 text-sm text-slate-300">
                Every store is reviewed by our team before it can list a book.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur-md">
            <span className="text-2xl">💵</span>
            <div>
              <h3 className="text-lg font-semibold">Pay on delivery</h3>
              <p className="mt-1 text-sm text-slate-300">
                Cash on Delivery, Nepal-wide — pay once your books arrive.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur-md">
            <span className="text-2xl">🎓</span>
            <div>
              <h3 className="text-lg font-semibold">Study Hub</h3>
              <p className="mt-1 text-sm text-slate-300">
                Notes and question papers for school and university, alongside the marketplace.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur-md">
            <span className="text-2xl">🏪</span>
            <div>
              <h3 className="text-lg font-semibold">Sell in minutes</h3>
              <p className="mt-1 text-sm text-slate-300">
                Open a store and list your first book once we approve you.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>

  </div>
)
}