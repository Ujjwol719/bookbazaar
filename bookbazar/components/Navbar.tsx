'use client'

import axios from 'axios'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { trackEvent } from '@/lib/analytics'

export default function Navbar() {
  const [user, setUser] = useState<{ email: string; role: "ADMIN" | "BUYER" | "SELLER" } | null>(null)
  const [wishlistCount, setWishlistCount] = useState(0)
  const [search, setSearch] = useState("")
  const router = useRouter()

  async function handleLogout() {
    await axios.post('/api/auth/logout')
    setUser(null)
  }

  function handleSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const query = search.trim()

    if (!query) {
      router.push("/books")
      return
    }

    trackEvent("search", {
      search_term: query,
    })

    router.push(`/books?search=${encodeURIComponent(query)}`)
  }

  useEffect(() => {
    async function getUser() {
      try {
        const res = await axios.get('/api/auth/me')
        setUser(res.data)

        if (res.data) {
          try {
            const wishlistRes = await axios.get('/api/wishlist/get')
            setWishlistCount(wishlistRes.data.length)
          } catch {
            // silently fail — the count badge just won't show
          }
        }
      } catch {
        setUser(null)
      }
    }
    getUser()
  }, [])

  const avatarLabel = user?.email?.split('@')[0]?.slice(0, 4).toUpperCase()

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 md:min-h-[62px] md:flex-row md:items-center md:justify-between md:px-6">

        {/* Logo */}
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex shrink-0 items-center gap-2 text-[17px] font-semibold text-indigo-700 tracking-tight">
            📚 BookMandu
          </Link>

          {!user && (
            <Link
              href="/login"
              className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 md:hidden"
            >
              Login
            </Link>
          )}
        </div>

        {/* Nav Links */}
        <nav className="hidden items-center gap-1 md:flex">
          <Link href="/" className="rounded-md px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
            Home
          </Link>
          <Link href="/books" className="rounded-md px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
            Books
          </Link>
          <Link href="/help" className="rounded-md px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
            How we function
          </Link>
          <Link href="/categories" className="rounded-md px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
            Categories
          </Link>
          <Link href="/study" className="rounded-md px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
            Study Hub
          </Link>
          {!user && (
            <Link href="/signup" className="rounded-md px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
              Become a seller
            </Link>
          )}
        </nav>

        <form
          onSubmit={handleSearch}
          className="relative flex min-w-0 flex-1 items-center md:max-w-md"
        >
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search books, authors, ISBN..."
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-12 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
          />
          <button
            type="submit"
            aria-label="Search books"
            className="absolute right-1.5 flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white transition hover:bg-indigo-700"
          >
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>
        </form>

        {/* Guest Actions */}
        {!user ? (
          <div className="hidden items-center gap-2 shrink-0 md:flex">
            <Link
              href="/login"
              className="rounded-md border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
            >
              Sign up
            </Link>
          </div>
        ) : (

          /* Logged-in Actions */
          <div className="flex flex-wrap items-center gap-1 shrink-0">

            {/* Utility links */}
            <Link href="/orders" className="rounded-md px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
              My orders
            </Link>
            {user.role === "BUYER" && (
              <Link href="/become-seller" className="rounded-md px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
                Become a Seller
              </Link>
            )}
            {user.role !== "ADMIN" && (
              <>
                <Link href="/become-contributor" className="rounded-md px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
                  Become a Contributor
                </Link>
                <Link href="/contributor/dashboard" className="rounded-md px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
                  My Contributions
                </Link>
              </>
            )}
            {/* <Link href="/cart-items" className="rounded-md px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
              History
            </Link> */}

            {/* Divider */}
            <div className="mx-2 h-5 w-px bg-slate-200" />

            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
            >
              ♡ Wishlist
              {wishlistCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-xs font-bold text-white">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className="flex items-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              🛒 Cart
            </Link>

            {/* Divider */}
            <div className="mx-2 h-5 w-px bg-slate-200" />

            {/* Avatar */}
            <div
              title={user.email}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-semibold text-white uppercase select-none cursor-default"
            >
              {avatarLabel}
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="rounded-md px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
