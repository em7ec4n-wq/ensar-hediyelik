import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { readStore } from "@/lib/store-server";
import { CartProvider } from "@/components/CartProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SplashOverlay } from "@/components/SplashOverlay";

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
    default: "Ensar Hediyelik | Her Anın Bir Hediyesi Var",
    template: "%s | Ensar Hediyelik",
  },
  description:
    "Cam küreler, müzik kutuları, kum saatleri, ilginç kupalar ve ışıklı hediyeler. Ensar Hediyelik ile her özel güne zarif ve anlamlı hediyeler keşfedin.",
  icons: {
    icon: "/ensar-web/logo/favicon.png",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "Ensar Hediyelik",
    title: "Ensar Hediyelik | Her Anın Bir Hediyesi Var",
    description:
      "Işıklı cam küreler, kurmalı müzik kutuları, solmayan gül fanusları ve özel tasarım hediyelikler.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const store = readStore();

  return (
    <html
      lang="tr"
      className={`${playfair.variable} ${dmSans.variable}`}
    >
      <body className="flex min-h-screen flex-col bg-[#F7F3EB] text-[#241722] antialiased">
        <CartProvider>
          <SplashOverlay
            logoSrc={store.settings.logoLightBg}
            brandName={store.settings.brandName}
          />
          <Header settings={store.settings} categories={store.categories} />
          <main className="flex-1">{children}</main>
          <Footer settings={store.settings} />
        </CartProvider>
      </body>
    </html>
  );
}
