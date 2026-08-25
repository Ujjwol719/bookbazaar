'use client'

import axios from "axios"
import { useState } from "react"
import { useRouter } from "next/navigation"

// A compact, icon-only variant of WishlistButton for overlaying on a book
// card's cover — same toggle endpoint and optimistic-update behavior,
// just sized for a corner badge instead of a full-width sidebar button.
export default function WishlistHeartButton({
  bookId,
  initialWishlisted = false,
}: {
  bookId: string
  initialWishlisted?: boolean
}) {
  const [wishlisted, setWishlisted] = useState(initialWishlisted)
  const [pending, setPending] = useState(false)
  const router = useRouter()

  async function handleToggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (pending) return
    setPending(true)

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
      className={`absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full shadow-md backdrop-blur transition disabled:cursor-not-allowed disabled:opacity-70 ${
        wishlisted ? "bg-rose-600 text-white" : "bg-white/90 text-slate-600 hover:text-rose-600"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-6.716-4.35-9.428-8.09C.94 10.02 1.67 6.5 4.6 5.09c2.29-1.1 4.86-.36 6.4 1.51C12.54 4.73 15.11 3.99 17.4 5.09c2.93 1.41 3.66 4.93 2.03 7.82C18.716 16.65 12 21 12 21Z" />
      </svg>
    </button>
  )
}
