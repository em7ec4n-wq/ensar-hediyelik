import type { MetadataRoute } from "next";
import { readStore } from "@/lib/store-server";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.ensarhediyelik.com.tr";
  const store = readStore();

  const staticRoutes = [
    "",
    "/kategoriler",
    "/arama",
    "/sepet",
    "/odeme",
    "/hesabim",
    "/hediye-secim-rehberi",
    "/iletisim",
    "/yasal-bilgilendirme",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
  }));

  const categoryRoutes = store.categories.map((c) => ({
    url: `${baseUrl}/kategori/${c.slug}`,
    lastModified: new Date(),
  }));

  const productRoutes = store.products
    .filter((p) => p.published)
    .map((p) => ({
      url: `${baseUrl}/urun/${p.slug}`,
      lastModified: new Date(),
    }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
