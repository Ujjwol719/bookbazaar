'use client'

import axios from "axios"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function WishlistButton({
  bookId,
  initialWishlisted = false,
}: {
  bookId: string
  initialWishlisted?: boolean
}) {
  const [wishlisted, setWishlisted] = useState(initialWishlisted)
  const [pending, setPending] = useState(false)
  const router = useRouter()

  async function handleToggle() {
    if (pending) return
    setPending(true)

    // Optimistic — most toggles succeed, and this is a low-stakes action.
    const next = !wishlisted
    setWishlisted(next)

    try {
      await axios.post("/api/wishlist/toggle", { bookId })
    } catch (error) {
      setWishlisted(!next)
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        router.push("/login")
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={pending}
      aria-pressed={wishlisted}
      aria-label={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
      className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-4 font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
        wishlisted
          ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
          : "border-slate-300 text-slate-700 hover:border-rose-300 hover:text-rose-600"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill={wishlisted ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 21s-6.716-4.35-9.428-8.09C.94 10.02 1.67 6.5 4.6 5.09c2.29-1.1 4.86-.36 6.4 1.51C12.54 4.73 15.11 3.99 17.4 5.09c2.93 1.41 3.66 4.93 2.03 7.82C18.716 16.65 12 21 12 21Z"
        />
      </svg>
      <span className="hidden sm:inline">{wishlisted ? "Saved" : "Save"}</span>
    </button>
  )
}
