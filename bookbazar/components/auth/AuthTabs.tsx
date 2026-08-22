'use client'

import Link from "next/link"

export default function AuthTabs({ active }: { active: "login" | "signup" }) {
  return (
    <div className="flex border-b border-slate-200">
      <Link
        href="/login"
        className={`flex-1 border-b-2 py-3 text-center text-sm font-semibold transition ${
          active === "login" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"
        }`}
      >
        Login
      </Link>
      <Link
        href="/signup"
        className={`flex-1 border-b-2 py-3 text-center text-sm font-semibold transition ${
          active === "signup" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"
        }`}
      >
        Sign Up
      </Link>
    </div>
  )
}
