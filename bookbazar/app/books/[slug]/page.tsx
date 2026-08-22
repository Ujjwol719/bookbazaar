import type { Metadata } from "next";
import Script from "next/script";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma"
import Navbar from "@/components/Navbar"
import Footer from "@/components/home/footer"
import Image from "next/image"
import Addtocart from "@/components/books/addtocart"
import BookQRCode from "@/components/books/BookQRCode"
import ReviewSection from "@/components/books/ReviewSection"
import BookViewTracker from "@/components/books/BookViewTracker"
import { getCanonicalUrl, SITE_NAME } from "@/lib/site";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { decrypt } from "@/app/lib/session";

async function getBook(slug: string) {
  return prisma.book.findFirst({
    where: { slug, isActive: true, store: { isActive: true } },
    include: {
      store: {
        select: {
          id: true,
          name: true,
          slug: true,
          phone: true,
          isVerified: true,
          isApproved: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  })
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const book = await getBook(slug);

  if (!book) {
    return {
      title: "Book Not Found",
      robots: { index: false, follow: false },
    };
  }

  const description = book.description?.slice(0, 160) || `${book.title} by ${book.author || "Unknown Author"} on ${SITE_NAME}.`;
  const canonical = getCanonicalUrl(`/books/${book.slug}`);

  return {
    title: book.title,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${book.title} | ${SITE_NAME}`,
      description,
      url: canonical,
      type: "book",
      images: book.imageUrl ? [{ url: book.imageUrl, width: 1200, height: 630, alt: book.title }] : ["/title.png"],
    },
    twitter: {
      card: "summary_large_image",
      title: `${book.title} | ${SITE_NAME}`,
      description,
      images: book.imageUrl ? [book.imageUrl] : ["/title.png"],
    },
  };
}

export default async function Book({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const book = await getBook(slug)

  if (!book) {
    notFound();
  }

  const reviews = await prisma.review.findMany({
    where: { bookId: book.id },
    include: { user: { select: { full_name: true } } },
    orderBy: { createdAt: "desc" }
  })

  const sessionCookie = (await cookies()).get("session")?.value
  const payload = sessionCookie ? await decrypt(sessionCookie) : null
  const initialWishlisted = payload
    ? Boolean(
        await prisma.wishlistItem.findUnique({
          where: { userId_bookId: { userId: payload.id as string, bookId: book.id } },
        })
      )
    : false

  const average = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0

  const relatedBooks = await prisma.book.findMany({
    where: {
      isActive: true,
      id: { not: book.id },
      store: { isActive: true },
      ...(book.categoryId ? { categoryId: book.categoryId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 4,
    select: {
      id: true,
      slug: true,
      title: true,
      author: true,
      price: true,
      imageUrl: true,
    },
  })

  const canonical = getCanonicalUrl(`/books/${book.slug}`);
  const bookJsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: book.title,
    description: book.description,
    author: {
      "@type": "Person",
      name: book.author || "Unknown Author",
    },
    image: book.imageUrl ? [book.imageUrl] : undefined,
    isbn: book.isbn || undefined,
    url: canonical,
    offers: {
      "@type": "Offer",
      url: canonical,
      priceCurrency: "NPR",
      price: book.price.toString(),
      availability: book.stockQty > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/UsedCondition",
    },
    aggregateRating: reviews.length
      ? {
          "@type": "AggregateRating",
          ratingValue: average.toFixed(1),
          reviewCount: reviews.length,
        }
      : undefined,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: getCanonicalUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Books",
        item: getCanonicalUrl("/books"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: book.title,
        item: canonical,
      },
    ],
  };

  return (
    <>
      <Navbar />
      <Script id="book-jsonld" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify([bookJsonLd, breadcrumbJsonLd])}
      </Script>
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-20">

          {/* Breadcrumb */}
          <div className="mb-10 flex items-center gap-2 text-sm text-slate-600">
            <a href="/" className="hover:text-indigo-600 transition">Home</a>
            <span>/</span>
            <a href="/books" className="hover:text-indigo-600 transition">Books</a>
            <span>/</span>
            <span className="text-slate-900 font-medium truncate">{book.title}</span>
          </div>

          {/* Main Content */}
          <div className="grid gap-12 md:grid-cols-5 lg:gap-16">

            {/* Book Cover */}
            <div className="md:col-span-2">
              <div className="sticky top-24 space-y-4">
                <div className="relative overflow-hidden rounded-3xl shadow-2xl w-full aspect-[2/3]">
                  {book.imageUrl ? (
                    <>
                      <Image
                        src={book.imageUrl}
                        alt={book.title}
                        fill
                        className="object-cover object-center"
                        sizes="(max-width: 768px) 100vw, 40vw"
                        priority
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    </>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
                      <div className="text-center">
                        <span className="text-8xl">📚</span>
                        <p className="mt-4 text-sm font-semibold text-white/80">No cover available</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className={`flex items-center gap-3 rounded-2xl border px-5 py-4 shadow-sm ${
                  book.stockQty > 0 ? "border-green-100 bg-green-50" : "border-red-100 bg-red-50"
                }`}>
                  <span className={`h-3 w-3 shrink-0 rounded-full ${book.stockQty > 0 ? "bg-green-500" : "bg-red-500"}`} />
                  <div>
                    <p className={`text-sm font-semibold ${book.stockQty > 0 ? "text-green-700" : "text-red-700"}`}>
                      {book.stockQty > 0 ? "In Stock" : "Out of Stock"}
                    </p>
                    {book.stockQty > 0 && (
                      <p className="text-xs text-green-600">{book.stockQty} copies available</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Book Details */}
            <div className="md:col-span-3 flex flex-col">

              {/* Real Rating */}
              <div className="mb-6 flex items-center gap-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-5 h-5 fill-current ${star <= Math.round(average) ? "text-yellow-400" : "text-slate-200"}`}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                    >
                      <path d="M13.849 4.22c-.684-1.626-3.014-1.626-3.698 0L8.397 8.387l-4.552.361c-1.775.14-2.495 2.331-1.142 3.477l3.468 2.937-1.06 4.392c-.413 1.713 1.472 3.067 2.992 2.149L12 19.35l3.897 2.354c1.52.918 3.405-.436 2.992-2.15l-1.06-4.39 3.468-2.938c1.353-1.146.633-3.336-1.142-3.477l-4.552-.36-1.754-4.17Z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm font-semibold text-slate-600">
                  {average > 0 ? `${average.toFixed(1)} (${reviews.length} reviews)` : "No reviews yet"}
                </span>
              </div>

              <h1 className="mb-3 text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
                {book.title}
              </h1>

              <p className="mb-6 text-lg text-slate-600">
                ✍️ By <span className="font-semibold text-indigo-600">{book.author || "Unknown Author"}</span>
              </p>

              <div className="mb-8 h-px bg-slate-200"></div>

              <div className="mb-8">
                <h2 className="mb-3 text-lg font-bold text-slate-900">About this book</h2>
                <p className="text-base leading-relaxed text-slate-700">
                  {book.description || "No description available for this book."}
                </p>
              </div>

              {/* Price */}
              <div className="mb-8 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 p-6 border border-indigo-100">
                <div className="flex items-end gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-2">Current Price</p>
                    <p className="text-5xl font-bold text-indigo-600">Rs. {book.price.toString()}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-xs text-slate-500 mb-1">Free Shipping</p>
                    <p className="text-lg font-semibold text-green-600">Save 10%</p>
                  </div>
                </div>
              </div>

              <BookViewTracker
                bookId={book.id}
                title={book.title}
                price={Number(book.price)}
                author={book.author}
                slug={book.slug}
              />

              <Addtocart bookID={book.id} bookTitle={book.title} bookPrice={Number(book.price)} initialWishlisted={initialWishlisted} />
              <BookQRCode path={`/books/${book.slug}`} />

              {/* Seller Info */}
              <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
                <a
                  href={book.store?.slug ? `/store/${book.store.slug}` : undefined}
                  className="flex items-center gap-4 transition hover:opacity-80"
                >
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl">
                    🏪
                  </div>
                 <div className="flex-grow">
  <h3 className="font-bold text-slate-900 hover:text-indigo-600">{book.store?.name}</h3>
  <p className={`text-sm font-medium ${book.store?.isVerified ? "text-purple-600" : "text-slate-400"}`}>
    {book.store?.isVerified ? "✓ Verified Seller" : "Unverified Seller"}
  </p>
  <p className="mt-1 text-xs font-semibold text-indigo-500">View storefront →</p>
</div>
                </a>

                {(() => {
                  const whatsappLink = buildWhatsAppLink(
                    book.store?.phone,
                    `Hi! I'm interested in "${book.title}" listed on BookMandu.`
                  );
                  return whatsappLink ? (
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 py-3 text-sm font-semibold text-green-700 transition hover:bg-green-100"
                    >
                      <span aria-hidden="true">💬</span> Message seller on WhatsApp
                    </a>
                  ) : null;
                })()}
              </div>

            </div>
          </div>

          {/* Review Section */}
          <ReviewSection bookId={book.id} initialReviews={reviews.map(r => ({
            id: r.id,
            rating: r.rating,
            comment: r.comment,
            createdAt: r.createdAt.toISOString(),
            user: { full_name: r.user.full_name }
          }))} initialAverage={average} initialTotal={reviews.length} />

          {relatedBooks.length > 0 && (
            <section className="mt-16">
              <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Related books</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">More to explore</h2>
                </div>
                {book.category?.slug && (
                  <a href={`/books?category=${book.category.slug}`} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                    View all {book.category.name.toLowerCase()} books
                  </a>
                )}
              </div>

              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {relatedBooks.map((relatedBook) => (
                  <a
                    key={relatedBook.id}
                    href={`/books/${relatedBook.slug}`}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden bg-linear-to-br from-indigo-100 to-purple-100">
                      {relatedBook.imageUrl ? (
                        <Image
                          src={relatedBook.imageUrl}
                          alt={relatedBook.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-5xl">📚</div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="line-clamp-2 text-base font-bold text-slate-900 group-hover:text-indigo-600">
                        {relatedBook.title}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">{relatedBook.author || "Unknown Author"}</p>
                      <p className="mt-3 text-sm font-semibold text-indigo-600">Rs. {relatedBook.price.toString()}</p>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}

        </div>
      </main>
      <Footer />
    </>
  )
}