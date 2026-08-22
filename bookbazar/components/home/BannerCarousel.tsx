"use client"

import { useEffect, useRef, useState } from "react"

export interface HomeBanner {
  id: string
  imageUrl: string
  title: string | null
  subtitle: string | null
  linkUrl: string | null
}

export default function BannerCarousel({ banners }: { banners: HomeBanner[] }) {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const touchStartX = useRef<number | null>(null)

  useEffect(() => {
    if (banners.length < 2 || paused) return

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReducedMotion) return

    const timer = setInterval(() => {
      setActive((current) => (current + 1) % banners.length)
    }, 5500)

    return () => clearInterval(timer)
  }, [banners.length, paused])

  if (banners.length === 0) return null

  function goTo(index: number) {
    setActive(((index % banners.length) + banners.length) % banners.length)
  }

  return (
    <section
      className="relative overflow-hidden bg-slate-900"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return
        const delta = e.changedTouches[0].clientX - touchStartX.current
        if (delta > 50) goTo(active - 1)
        if (delta < -50) goTo(active + 1)
        touchStartX.current = null
      }}
    >
      <div className="relative h-[320px] w-full sm:h-[380px] md:h-[440px]">
        {banners.map((banner, index) => {
          const slide = (
            <div
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                index === active ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
              aria-hidden={index !== active}
            >
              {/* Blurred, scaled-up copy fills the frame behind the real image so
                  banners of any aspect ratio never look like they have empty bars. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={banner.imageUrl}
                alt=""
                aria-hidden="true"
                className="h-full w-full scale-110 object-cover opacity-60 blur-2xl"
              />
              {/* The real image, always shown whole — never cropped, whatever
                  dimensions the admin uploaded. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={banner.imageUrl}
                alt={banner.title || ""}
                className="absolute inset-0 h-full w-full object-contain"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

              {(banner.title || banner.subtitle) && (
                <div className="absolute inset-x-0 bottom-0 px-6 pb-10 md:px-12 md:pb-14">
                  <div className="mx-auto max-w-7xl">
                    {banner.title && (
                      <h2 className="max-w-xl text-2xl font-bold text-white drop-shadow md:text-4xl">
                        {banner.title}
                      </h2>
                    )}
                    {banner.subtitle && (
                      <p className="mt-2 max-w-lg text-sm text-white/90 drop-shadow md:text-base">
                        {banner.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )

          return banner.linkUrl ? (
            <a
              key={banner.id}
              href={banner.linkUrl}
              aria-label={banner.title || "Promotion"}
              tabIndex={index === active ? 0 : -1}
            >
              {slide}
            </a>
          ) : (
            <div key={banner.id}>{slide}</div>
          )
        })}

        {banners.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(active - 1)}
              aria-label="Previous banner"
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur transition hover:bg-black/50 md:left-6"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => goTo(active + 1)}
              aria-label="Next banner"
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur transition hover:bg-black/50 md:right-6"
            >
              ›
            </button>

            <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
              {banners.map((banner, index) => (
                <button
                  key={banner.id}
                  type="button"
                  onClick={() => goTo(index)}
                  aria-label={`Go to banner ${index + 1}`}
                  aria-current={index === active}
                  className={`h-1.5 rounded-full transition-all ${
                    index === active ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
