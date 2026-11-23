import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { readStore } from "@/lib/store-server";
import { CartProvider } from "@/components/CartProvider";
import { StoreProvider } from "@/components/StoreProvider";
import { LiveAppShell } from "@/components/LiveAppShell";

const playfair = Playfair_Display({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600"],
  variable: "--font-playfair",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.ensarhediyelik.com.tr"),
  title: {
    default: "Ensar Hediyelik",
    template: "%s | Ensar Hediyelik",
  },
  description:
    "Değerli Müşterilerimiz, Firmamızda perakende satış bulunmamaktadır. Sadece toptan satış yapılmakta olup minimum sipariş tutarı 10.000₺ ve üzeridir.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon-96.png", sizes: "96x96", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.png", sizes: "255x255", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  alternates: {
    canonical: "https://www.ensarhediyelik.com.tr",
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: "https://www.ensarhediyelik.com.tr",
    siteName: "Ensar Hediyelik",
    title: "Ensar Hediyelik",
    description:
      "Değerli Müşterilerimiz, Firmamızda perakende satış bulunmamaktadır. Sadece toptan satış yapılmakta olup minimum sipariş tutarı 10.000₺ ve üzeridir.",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "Ensar Hediyelik",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Ensar Hediyelik",
    description:
      "Değerli Müşterilerimiz, Firmamızda perakende satış bulunmamaktadır. Sadece toptan satış yapılmakta olup minimum sipariş tutarı 10.000₺ ve üzeridir.",
    images: ["/icon-512.png"],
  },
};

const jsonLdData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WholesaleStore",
      "@id": "https://www.ensarhediyelik.com.tr/#organization",
      "name": "Ensar Hediyelik",
      "url": "https://www.ensarhediyelik.com.tr",
      "logo": "https://www.ensarhediyelik.com.tr/icon-512.png",
      "image": "https://www.ensarhediyelik.com.tr/icon-512.png",
      "description":
        "Değerli Müşterilerimiz, Firmamızda perakende satış bulunmamaktadır. Sadece toptan satış yapılmakta olup minimum sipariş tutarı 10.000₺ ve üzeridir.",
      "telephone": "+905413567162",
      "priceRange": "₺₺",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Şark Han Tomruk Sk. No:36/27 Tahtakale",
        "addressLocality": "Fatih",
        "addressRegion": "İstanbul",
        "postalCode": "34116",
        "addressCountry": "TR",
      },
    },
    {
      "@type": "WebSite",
      "@id": "https://www.ensarhediyelik.com.tr/#website",
      "url": "https://www.ensarhediyelik.com.tr",
      "name": "Ensar Hediyelik",
      "publisher": {
        "@id": "https://www.ensarhediyelik.com.tr/#organization",
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://www.ensarhediyelik.com.tr/arama?q={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "ItemList",
      "itemListElement": [
        {
          "@type": "SiteNavigationElement",
          "position": 1,
          "name": "İletişim",
          "description": "Şark Han Tomruk Sk No:36/27 Tahtakale 34116 Fatih İstanbul",
          "url": "https://www.ensarhediyelik.com.tr/iletisim",
        },
        {
          "@type": "SiteNavigationElement",
          "position": 2,
          "name": "Hediyelik Eşya",
          "description": "Değerli Müşterilerimiz, Firmamızda perakende satış bulunmamaktadır. Sadece toptan satış yapılmakta olup minimum sipariş tutarı 10.000₺ ve üzeridir.",
          "url": "https://www.ensarhediyelik.com.tr/kategori/hediyelik-urunler",
        },
        {
          "@type": "SiteNavigationElement",
          "position": 3,
          "name": "Kar Küreleri",
          "description": "Değerli Müşterilerimiz, Firmamızda perakende satış bulunmamaktadır. Sadece toptan satış yapılmakta olup minimum sipariş tutarı 10.000₺ ve üzeridir.",
          "url": "https://www.ensarhediyelik.com.tr/kategori/kar-kureleri",
        },
        {
          "@type": "SiteNavigationElement",
          "position": 4,
          "name": "Işıklı Grup",
          "description": "Değerli Müşterilerimiz, Firmamızda perakende satış bulunmamaktadır. Sadece toptan satış yapılmakta olup minimum sipariş tutarı 10.000₺ ve üzeridir.",
          "url": "https://www.ensarhediyelik.com.tr/kategori/isikli-hediyeler",
        },
        {
          "@type": "SiteNavigationElement",
          "position": 5,
          "name": "Müzik Kutuları",
          "description": "Değerli Müşterilerimiz, Firmamızda perakende satış bulunmamaktadır. Sadece toptan satış yapılmakta olup minimum sipariş tutarı 10.000₺ ve üzeridir.",
          "url": "https://www.ensarhediyelik.com.tr/kategori/muzik-kutulari",
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialStore = readStore();
  return (
    <html lang="tr" className={`${playfair.variable} ${dmSans.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="48x48" href="/icon-48.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/icon-96.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
      </head>
      <body className="flex min-h-screen flex-col bg-[#F7F3EB] text-[#241722] antialiased">
        <StoreProvider initialStore={initialStore}>
          <CartProvider>
            <LiveAppShell>{children}</LiveAppShell>
          </CartProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
