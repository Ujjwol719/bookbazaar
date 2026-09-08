import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import Analytics from "@/components/Analytics";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} | Buy & Sell Books in Nepal`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Buy and sell new & second hand books anywhere in Nepal — Kathmandu, Pokhara, Lalitpur, Bhaktapur, Biratnagar, Birgunj, and more. Nepal's trusted online book marketplace for cheap textbooks, novels & academic books.",
  keywords: [
    // Nationwide
    "buy books online Nepal",
    "sell books online Nepal",
    "second hand books Nepal",
    "used books Nepal",
    "book marketplace Nepal",
    "online bookstore Nepal",
    "cheap books Nepal",
    "buy sell books Nepal",
    "sell old books Nepal",
    "buy old books Nepal",
    "novels online Nepal",
    "academic books Nepal",
    "textbooks Nepal",
    "bookmandu",
    "book bazaar Nepal",
    "kitab kinne bechne nepal",
    // Kathmandu
    "second hand books Kathmandu",
    "used books Kathmandu",
    "buy sell books KTM",
    "textbooks online Kathmandu",
    // Pokhara
    "second hand books Pokhara",
    "used books Pokhara",
    "buy sell books Pokhara",
    "textbooks online Pokhara",
    // Other major cities
    "second hand books Lalitpur",
    "second hand books Bhaktapur",
    "second hand books Biratnagar",
    "second hand books Birgunj",
    "second hand books Dharan",
    "second hand books Butwal",
    "second hand books Bharatpur",
    "second hand books Nepalgunj",
    "second hand books Itahari",
    "second hand books Hetauda",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "Books & Literature",
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: SITE_URL,
    languages: {
      "en-NP": SITE_URL,
    },
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/icon.svg",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: SITE_NAME,
  },
  other: {
    "geo.region": "NP",
    "geo.placename": "Nepal",
    "geo.position": "28.3949;84.1240", // Nepal's geographic center
    "ICBM": "28.3949, 84.1240",
  },
  openGraph: {
    title: `${SITE_NAME} | Buy & Sell Books Anywhere in Nepal`,
    description:
      "Discover thousands of new and used books on BookMandu. Buy cheap textbooks, novels, and more or sell your old books and earn cash instantly — delivering across Kathmandu, Pokhara, and all of Nepal.",
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
    locale: "en_NP",
    images: [
      {
        url: "/title.png",
        width: 1200,
        height: 630,
        alt: "BookMandu - Buy & Sell Books Online Across Nepal",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | Buy & Sell Books Anywhere in Nepal`,
    description:
      "Buy and sell books easily on BookMandu. Best prices on textbooks, novels, comics, and more — Kathmandu, Pokhara & all of Nepal.",
    images: ["/title.png"],
    creator: "@bookmandu",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#163C7A",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

// JSON-LD structured data — tells Google exactly which areas you serve.
// Country-level areaServed as the primary signal, with the biggest
// cities called out explicitly for stronger local-intent matching.
const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "OnlineStore",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  areaServed: [
    {
      "@type": "Country",
      name: "Nepal",
    },
    { "@type": "City", name: "Kathmandu" },
    { "@type": "City", name: "Pokhara" },
    { "@type": "City", name: "Lalitpur" },
    { "@type": "City", name: "Bhaktapur" },
    { "@type": "City", name: "Biratnagar" },
    { "@type": "City", name: "Birgunj" },
    { "@type": "City", name: "Dharan" },
    { "@type": "City", name: "Butwal" },
    { "@type": "City", name: "Bharatpur" },
    { "@type": "City", name: "Nepalgunj" },
  ],
  address: {
    "@type": "PostalAddress",
    addressCountry: "NP",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 28.3949,
    longitude: 84.124,
  },
  sameAs: [
    // add real social links, e.g.
    // "https://www.facebook.com/bookmandu",
    // "https://www.instagram.com/bookmandu",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans"
      )}
    >
      <head>
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(localBusinessJsonLd),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <Suspense fallback={null}>
          <Analytics />
        </Suspense>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}