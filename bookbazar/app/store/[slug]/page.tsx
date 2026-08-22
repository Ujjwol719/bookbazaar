import type { Metadata } from "next";
import Script from "next/script";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import prisma from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Footer from "@/components/home/footer";
import { getCanonicalUrl, SITE_NAME } from "@/lib/site";
import { buildWhatsAppLink } from "@/lib/whatsapp";

async function getStore(slug: string) {
  return prisma.store.findFirst({
    where: { slug, isActive: true, isApproved: true },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      logoUrl: true,
      bannerUrl: true,
      phone: true,
      isVerified: true,
      createdAt: true,
      books: {
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          slug: true,
          title: true,
          author: true,
          price: true,
          imageUrl: true,
          stockQty: true,
          reviews: { select: { rating: true } },
        },
      },
    },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStore(slug);

  if (!store) {
    return { title: "Store Not Found", robots: { index: false, follow: false } };
  }

  const description =
    store.description?.slice(0, 160) || `Browse books from ${store.name} on ${SITE_NAME}.`;
  const canonical = getCanonicalUrl(`/store/${store.slug}`);

  return {
    title: `${store.name} — Seller on ${SITE_NAME}`,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${store.name} | ${SITE_NAME}`,
      description,
      url: canonical,
      type: "website",
      images: store.bannerUrl ? [{ url: store.bannerUrl, width: 1200, height: 630, alt: store.name }] : ["/title.png"],
    },
  };
}

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await getStore(slug);

  if (!store) {
    notFound();
  }

  const allRatings = store.books.flatMap((book) => book.reviews.map((review) => review.rating));
  const averageRating = allRatings.length
    ? allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length
    : 0;

  const canonical = getCanonicalUrl(`/store/${store.slug}`);
  const storeJsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: store.name,
    description: store.description || undefined,
    url: canonical,
    image: store.logoUrl || undefined,
    ...(allRatings.length
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: averageRating.toFixed(1),
            reviewCount: allRatings.length,
          },
        }
      : {}),
  };

  return (
    <>
      <Navbar />
      <Script id="store-jsonld" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(storeJsonLd)}
      </Script>
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">

        {/* Banner */}
        <div className="relative h-40 w-full overflow-hidden bg-gradient-to-r from-indigo-500 to-purple-600 md:h-56">
          {store.bannerUrl && (
            <Image src={store.bannerUrl} alt="" fill className="object-cover" priority />
          )}
          <div className="absolute inset-0 bg-black/20" />
        </div>

        <div className="mx-auto max-w-6xl px-6">

          {/* Store header */}
          <div className="-mt-12 mb-10 flex flex-col items-start gap-4 sm:flex-row sm:items-end">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-lg">
              {store.logoUrl ? (
                <Image src={store.logoUrl} alt={store.name} width={96} height={96} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-3xl">
                  🏪
                </div>
              )}
            </div>

            <div className="flex-1 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">{store.name}</h1>
                {store.isVerified && (
                  <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                    ✓ Verified Seller
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                {allRatings.length > 0 ? (
                  <span>⭐ {averageRating.toFixed(1)} ({allRatings.length} reviews)</span>
                ) : (
                  <span>No reviews yet</span>
                )}
                <span>·</span>
                <span>{store.books.length} book{store.books.length === 1 ? "" : "s"} listed</span>
              </div>
            </div>
          </div>

          {store.description && (
            <p className="mb-6 max-w-3xl text-base leading-relaxed text-slate-700">{store.description}</p>
          )}

          {(() => {
            const whatsappLink = buildWhatsAppLink(store.phone, `Hi, I have a question about your store "${store.name}" on BookMandu.`);
            return whatsappLink ? (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-10 inline-flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-5 py-2.5 text-sm font-semibold text-green-700 transition hover:bg-green-100"
              >
                <span aria-hidden="true">💬</span> Message this seller on WhatsApp
              </a>
            ) : null;
          })()}

          {/* Book grid */}
          <section className="pb-20">
            <h2 className="mb-6 text-xl font-bold text-slate-900">Books from {store.name}</h2>

            {store.books.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <p className="text-slate-500">This seller hasn&apos;t listed any books yet.</p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {store.books.map((book) => (
                  <Link
                    key={book.id}
                    href={`/books/${book.slug}`}
                    className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="relative aspect-[4/5] w-full overflow-hidden bg-gradient-to-br from-indigo-100 to-indigo-200">
                      {book.imageUrl ? (
                        <Image
                          src={book.imageUrl}
                          alt={book.title}
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
                        {book.title}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">{book.author || "Unknown Author"}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm font-semibold text-indigo-600">Rs. {book.price.toString()}</span>
                        {book.stockQty === 0 && (
                          <span className="text-xs font-semibold text-red-500">Out of stock</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
