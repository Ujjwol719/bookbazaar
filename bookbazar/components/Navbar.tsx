'use client'

import axios from 'axios'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { FormEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { trackEvent } from '@/lib/analytics'

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/books", label: "Books" },
  { href: "/help", label: "How we function" },
  { href: "/categories", label: "Categories" },
  { href: "/study", label: "Study Hub" },
]

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
      <path d="M12 20.5s-7.5-4.6-10-9.3C0.3 7.6 2 4 5.7 4c2 0 3.5 1.1 4.3 2.6C10.8 5.1 12.3 4 14.3 4 18 4 19.7 7.6 22 11.2c-2.5 4.7-10 9.3-10 9.3Z" strokeLinejoin="round" />
    </svg>
  )
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  )
}

export default function Navbar() {
  const [user, setUser] = useState<{ email: string; role: "ADMIN" | "BUYER" | "SELLER"; full_name?: string } | null>(null)
  const [wishlistCount, setWishlistCount] = useState(0)
  const [search, setSearch] = useState("")
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  async function handleLogout() {
    await axios.post('/api/auth/logout')
    setUser(null)
    setDrawerOpen(false)
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

    if (user) {
      axios.post("/api/search-history", { query }).catch(() => {
        // Homepage "recent searches" chips just won't include this one.
      })
    }

    router.push(`/books?search=${encodeURIComponent(query)}`)
    setDrawerOpen(false)
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

  // Lock page scroll while the drawer is open, and let Escape close it.
  useEffect(() => {
    if (!drawerOpen) return
    document.body.style.overflow = "hidden"
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDrawerOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", onKey)
    }
  }, [drawerOpen])

  // Click anywhere outside the user menu (or Escape) closes it.
  useEffect(() => {
    if (!userMenuOpen) return
    function onClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setUserMenuOpen(false)
    }
    document.addEventListener("mousedown", onClickOutside)
    window.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onClickOutside)
      window.removeEventListener("keydown", onKey)
    }
  }, [userMenuOpen])

  const firstName = user?.full_name?.trim()?.split(/\s+/)[0] || user?.email?.split('@')[0] || ""
  const avatarLabel = (user?.full_name?.trim()?.slice(0, 1) || user?.email?.slice(0, 1) || "?").toUpperCase()

  const contributorLinks = user && user.role !== "ADMIN" ? (
    <>
      <Link href="/become-contributor" onClick={() => setDrawerOpen(false)} className="rounded-md px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors">
        Become a Contributor
      </Link>
      <Link href="/contributor/dashboard" onClick={() => setDrawerOpen(false)} className="rounded-md px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors">
        My Contributions
      </Link>
    </>
  ) : null

  return (
    <>
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 md:min-h-15.5 md:px-6">

        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2 text-[17px] font-semibold text-indigo-700 tracking-tight">
          📚 BookMandu
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-md px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
              {link.label}
            </Link>
          ))}
          {!user && (
            <Link href="/signup" className="rounded-md px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
              Become a seller
            </Link>
          )}
        </nav>

        {/* Search — desktop only; mobile search lives in the drawer */}
        <form onSubmit={handleSearch} className="relative hidden min-w-0 flex-1 items-center md:flex md:max-w-md">
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
            <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>
        </form>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {/* Desktop actions */}
          {!user ? (
            <div className="hidden items-center gap-2 md:flex">
              <Link href="/login" className="rounded-md border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                Login
              </Link>
              <Link href="/signup" className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
                Sign up
              </Link>
            </div>
          ) : (
            <div className="hidden items-center gap-1 md:flex">
              <Link href="/orders" className="rounded-md px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
                My orders
              </Link>
              {user.role === "BUYER" && (
                <Link href="/become-seller" className="rounded-md px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
                  Become a Seller
                </Link>
              )}
              {contributorLinks}

              <div className="mx-1.5 h-5 w-px bg-slate-200" />

              <Link
                href="/wishlist"
                aria-label="Wishlist"
                className="relative flex h-9 w-9 items-center justify-center rounded-full text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <HeartIcon filled={wishlistCount > 0} />
                {wishlistCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              <Link
                href="/cart"
                aria-label="Cart"
                className="flex h-9 w-9 items-center justify-center rounded-full text-indigo-700 hover:bg-indigo-50 transition-colors"
              >
                <CartIcon />
              </Link>

              <div className="mx-1.5 h-5 w-px bg-slate-200" />

              {/* User menu — click to toggle, click outside or Escape to close */}
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setUserMenuOpen((open) => !open)}
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen}
                  className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                >
                  <span title={user.email} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[13px] font-semibold text-white select-none">
                    {avatarLabel}
                  </span>
                  <span className="max-w-24 truncate">{firstName}</span>
                  <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                <div
                  role="menu"
                  className={`absolute right-0 top-full z-10 mt-2 w-52 origin-top-right rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg transition-all duration-150 ease-out ${
                    userMenuOpen ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none -translate-y-1 scale-95 opacity-0"
                  }`}
                >
                  <div className="border-b border-slate-100 px-3.5 pb-2 pt-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{user.full_name || firstName}</p>
                    <p className="truncate text-xs text-slate-400">{user.email}</p>
                  </div>
                  <Link href="/profile" onClick={() => setUserMenuOpen(false)} className="block px-3.5 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900">
                    My Profile
                  </Link>
                  <Link href="/wishlist" onClick={() => setUserMenuOpen(false)} className="block px-3.5 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900">
                    Wishlist
                  </Link>
                  <Link href="/settings" onClick={() => setUserMenuOpen(false)} className="block px-3.5 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900">
                    Settings
                  </Link>
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    onClick={() => { setUserMenuOpen(false); handleLogout() }}
                    className="block w-full px-3.5 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Mobile: quick wishlist/cart icons + hamburger */}
          <div className="flex items-center gap-1 md:hidden">
            {user && (
              <>
                <Link href="/wishlist" aria-label="Wishlist" className="relative flex h-9 w-9 items-center justify-center rounded-full text-rose-600">
                  <HeartIcon filled={wishlistCount > 0} />
                  {wishlistCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
                <Link href="/cart" aria-label="Cart" className="flex h-9 w-9 items-center justify-center rounded-full text-indigo-700">
                  <CartIcon />
                </Link>
              </>
            )}
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>

    {/* Mobile drawer — rendered as a header sibling, not a descendant: the
        header's backdrop-blur makes it a containing block for `fixed`
        children, which was collapsing this drawer down to the header's own
        ~60px height instead of the full viewport. */}
    {drawerOpen && (
        <div className="fixed inset-0 z-60 md:hidden">
          <button
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          />
          <div className="absolute right-0 top-0 flex h-full w-[85%] max-w-sm flex-col overflow-y-auto bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <span className="text-[17px] font-semibold text-indigo-700">📚 BookMandu</span>
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
              </button>
            </div>

            <form onSubmit={handleSearch} className="relative px-5 py-4">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search books, authors, ISBN..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-12 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />
              <button type="submit" aria-label="Search books" className="absolute right-6 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                </svg>
              </button>
            </form>

            {user && (
              <Link href="/wishlist" onClick={() => setDrawerOpen(false)} className="mx-5 mb-3 flex items-center justify-between rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-rose-700">
                <span className="flex items-center gap-2 text-sm font-semibold"><HeartIcon filled={wishlistCount > 0} /> Wishlist</span>
                {wishlistCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1.5 text-xs font-bold text-white">{wishlistCount}</span>}
              </Link>
            )}

            <nav className="flex flex-col gap-0.5 px-3">
              {NAV_LINKS.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setDrawerOpen(false)} className="rounded-md px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="my-3 mx-5 h-px bg-slate-100" />

            {user ? (
              <>
                <nav className="flex flex-col gap-0.5 px-3">
                  <Link href="/orders" onClick={() => setDrawerOpen(false)} className="rounded-md px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100">
                    My orders
                  </Link>
                  <Link href="/profile" onClick={() => setDrawerOpen(false)} className="rounded-md px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100">
                    My Profile
                  </Link>
                  <Link href="/settings" onClick={() => setDrawerOpen(false)} className="rounded-md px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100">
                    Settings
                  </Link>
                  {user.role === "BUYER" && (
                    <Link href="/become-seller" onClick={() => setDrawerOpen(false)} className="rounded-md px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100">
                      Become a Seller
                    </Link>
                  )}
                  {contributorLinks}
                </nav>

                <div className="mt-auto flex items-center gap-3 border-t border-slate-100 px-5 py-4">
                  <div title={user.email} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white uppercase">
                    {avatarLabel}
                  </div>
                  <p className="min-w-0 flex-1 truncate text-sm text-slate-600">{user.email}</p>
                  <button
                    onClick={handleLogout}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" />
                    </svg>
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-auto flex flex-col gap-2 border-t border-slate-100 px-5 py-4">
                <Link href="/signup" onClick={() => setDrawerOpen(false)} className="rounded-md px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100">
                  Become a seller
                </Link>
                <Link href="/login" onClick={() => setDrawerOpen(false)} className="rounded-xl border border-slate-200 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Login
                </Link>
                <Link href="/signup" onClick={() => setDrawerOpen(false)} className="rounded-xl bg-indigo-600 py-3 text-center text-sm font-semibold text-white hover:bg-indigo-700">
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
    )}
    </>
  )
}
