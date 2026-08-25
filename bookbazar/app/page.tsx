import type { Metadata } from "next";
import Script from "next/script";
import { cookies } from "next/headers";
import Footer from '@/components/home/footer';
import Hero from '@/components/home/hero';
import BannerCarousel from '@/components/home/BannerCarousel';
import CategoryStrip from '@/components/home/CategoryStrip';
import StudyHubTeaser from '@/components/home/StudyHubTeaser';
import TrustBadges from '@/components/home/TrustBadges';
import Feature from '@/components/home/featuresbook';
import Navbar from '@/components/Navbar';
import ChatBot from './chat/page';
import PersonalizedGreeting from '@/components/home/PersonalizedGreeting';
import RecentSearchesChips from '@/components/home/RecentSearchesChips';
import RecommendedForYou from '@/components/home/RecommendedForYou';
import RecentlyViewedRow from '@/components/home/RecentlyViewedRow';
import WishlistTeaser from '@/components/home/WishlistTeaser';
import prisma from "@/lib/prisma";
import { decrypt } from "@/app/lib/session";
import { getPersonalizedHomepageData } from "@/lib/recommendations";
import { getCanonicalUrl, SITE_NAME, SITE_URL, SITE_DESCRIPTION } from "@/lib/site";

// Without this the page is prerendered once at build time and a banner added
// in the admin panel wouldn't show up until the next deploy. Revalidate
// every minute instead so the homepage stays fast but still catches up.
export const revalidate = 60;

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} | Buy & Sell Books Online in Nepal`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: getCanonicalUrl("/"),
  },
  openGraph: {
    title: `${SITE_NAME} | Buy & Sell Books Online in Nepal`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
    locale: "en_IN",
    images: [
      {
        url: "/title.png",
        width: 1200,
        height: 630,
        alt: "BookMandu marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | Buy & Sell Books Online in Nepal`,
    description: SITE_DESCRIPTION,
    images: ["/title.png"],
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/title.png`,
  sameAs: [],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/books?search={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

async function getActiveBanners() {
  const banners = await prisma.banner.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, imageUrl: true, title: true, subtitle: true, linkUrl: true },
  });
  return banners;
}

// Logged-out visitors get exactly the homepage they always have — this
// only runs (and only adds sections) when there's a real session.
async function getLoggedInHomepageData() {
  const sessionCookie = (await cookies()).get("session")?.value;
  const payload = sessionCookie ? await decrypt(sessionCookie) : null;
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.id as string },
    select: { full_name: true, isBlocked: true },
  });
  if (!user || user.isBlocked) return null;

  const personalized = await getPersonalizedHomepageData(payload.id as string);
  return {
    firstName: user.full_name.trim().split(/\s+/)[0] || user.full_name,
    ...personalized,
  };
}

export default async function Page() {
  const [banners, homepageData] = await Promise.all([getActiveBanners(), getLoggedInHomepageData()]);

  return (
    <>
      <Script id="home-jsonld" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify([organizationSchema, websiteSchema])}
      </Script>
      <Navbar />
      {banners.length > 0 ? <BannerCarousel banners={banners} /> : <Hero />}

      {homepageData && (
        <>
          <PersonalizedGreeting firstName={homepageData.firstName} />
          <RecentSearchesChips queries={homepageData.recentSearches} />
        </>
      )}

      <CategoryStrip />
      <ChatBot />

      {homepageData && (
        <>
          <RecommendedForYou
            books={homepageData.recommended}
            wishlistedIds={homepageData.wishlistedIds}
            personalized={homepageData.hasPersonalizationSignal}
          />
          <RecentlyViewedRow books={homepageData.recentlyViewed} wishlistedIds={homepageData.wishlistedIds} />
          <WishlistTeaser books={homepageData.wishlistPreview} />
        </>
      )}

      <Feature />
      <StudyHubTeaser />
      <TrustBadges />
      <Footer />
    </>
  );
}