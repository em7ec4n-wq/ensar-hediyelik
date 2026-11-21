import React from "react";
import Link from "next/link";
import { readStore } from "@/lib/store-server";
import { formatPriceTRY } from "@/lib/format";
import { HeroCarousel } from "@/components/HeroCarousel";
import { GiftFinder } from "@/components/GiftFinder";
import { ChevronRightIcon, GiftIcon } from "@/components/Icons";

export default function HomePage() {
  const store = readStore();
  const homeCategories = store.categories
    .filter((c) => c.showOnHome)
    .sort((a, b) => (a.homeOrder ?? 99) - (b.homeOrder ?? 99))
    .slice(0, 4);

  const newArrivals = store.products
    .filter((p) => p.published && p.isNewArrival)
    .sort((a, b) => (a.newArrivalOrder ?? 99) - (b.newArrivalOrder ?? 99))
    .slice(0, 3);

  return (
    <div className="pb-0">
      {/* 1. Three-Slide Hero */}
      <HeroCarousel slides={store.heroSlides} />

      {/* 2. Hediyeni Bul (Tool 1) */}
      <GiftFinder products={store.products} />

      {/* 3. Kategorileri Keşfet */}
      <section
        aria-labelledby="kategorileri-kesfet-baslik"
        className="ensar-container pt-10 lg:pt-14"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2
            id="kategorileri-kesfet-baslik"
            className="font-heading text-[28px] font-medium text-[#241722] lg:text-[36px]"
          >
            Kategorileri Keşfet
          </h2>
          <Link
            href="/kategori/yilbasi"
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-[#E9D9F1] px-4 py-1.5 text-xs font-semibold text-[#321B2D] transition-colors hover:bg-[#321B2D] hover:text-[#F7F3EB] sm:text-sm"
          >
            <span>Yılbaşı Koleksiyonu (230 Ürün)</span>
            <ChevronRightIcon size={15} />
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3.5 sm:gap-5 lg:grid-cols-4 lg:gap-6">
          {homeCategories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/kategori/${cat.slug}`}
              className="ensar-card group overflow-hidden transition-transform duration-300 hover:-translate-y-0.5"
            >
              <div className="aspect-[1/0.94] w-full overflow-hidden bg-[#241320]">
                <img
                  src={cat.image}
                  alt={cat.imageAlt}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex min-h-[48px] items-center justify-center gap-1 bg-[#FFFDF8] px-3 py-3 text-center">
                <span className="text-[14px] font-medium text-[#241722] sm:text-[16px]">
                  {cat.name}
                </span>
                <ChevronRightIcon
                  size={15}
                  className="text-[#5F505C] transition-transform group-hover:translate-x-0.5"
                />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Yeni Gelenler */}
      <section
        id="yeni-gelenler"
        aria-labelledby="yeni-gelenler-baslik"
        className="ensar-container scroll-mt-24 pt-10 lg:pt-14"
      >
        <h2
          id="yeni-gelenler-baslik"
          className="font-heading text-[28px] font-medium text-[#241722] lg:text-[36px]"
        >
          Yeni Gelenler
        </h2>

        {/* Mobile: 1st & 2nd side-by-side, 3rd full width. Desktop: 3 equal columns */}
        <div className="mt-5 grid grid-cols-2 gap-3.5 sm:gap-5 lg:grid-cols-3 lg:gap-6">
          {newArrivals.map((product, index) => (
            <Link
              key={product.id}
              href={`/urun/${product.slug}`}
              className={`ensar-card group overflow-hidden transition-transform duration-300 hover:-translate-y-0.5 ${
                index === 2 ? "col-span-2 lg:col-span-1" : ""
              }`}
            >
              <div
                className={`w-full overflow-hidden bg-[#241320] ${
                  index === 2
                    ? "aspect-[16/10] lg:aspect-[4/3.1]"
                    : "aspect-[4/3.4] lg:aspect-[4/3.1]"
                }`}
              >
                <img
                  src={product.image}
                  alt={product.imageAlt}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-col items-center justify-center bg-[#FFFDF8] px-3 py-3.5 text-center">
                <h3 className="text-[14px] font-medium text-[#241722] sm:text-[16px]">
                  {product.shortName}
                </h3>
                <p className="mt-0.5 text-xs font-medium text-[#5F505C]">
                  {formatPriceTRY(product.price)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 5. Işıklı Hediyeler Vitrin */}
      <section
        aria-labelledby="isikli-hediyeler-baslik"
        className="ensar-container pt-10 lg:pt-14"
      >
        <div className="relative flex h-[200px] items-center justify-between overflow-hidden rounded-[16px] bg-[#321B2D] text-[#F7F3EB] lg:h-[320px]">
          {/* Left Text + Button */}
          <div className="relative z-10 flex max-w-[58%] flex-col items-start justify-center pl-5 pr-3 sm:pl-10 lg:max-w-[50%] lg:pl-14">
            <h2
              id="isikli-hediyeler-baslik"
              className="font-heading text-[26px] font-medium leading-tight text-[#F7F3EB] sm:text-[36px] lg:text-[50px]"
            >
              Işıklı Hediyeler
            </h2>
            <Link
              href="/kategori/isikli-hediyeler"
              className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-[#F7F3EB] px-4 py-2 text-[13px] font-semibold text-[#241722] transition-colors hover:bg-[#FFFDF8] sm:px-6 sm:py-2.5 sm:text-[15px] lg:mt-6"
            >
              <span>Koleksiyonu İncele</span>
              <ChevronRightIcon size={16} />
            </Link>
          </div>

          {/* Right Glowing Rose Dome Photo */}
          <div className="relative h-full w-[46%] shrink-0 sm:w-[48%] lg:w-[50%]">
            <div
              className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#321B2D] to-transparent lg:w-28"
              aria-hidden="true"
            />
            <img
              src="/ensar-web/gorseller/vitrin-isikli-hediyeler.webp"
              alt="Ahşap tabanlı cam fanus içinde sıcak sarı LED ışıklı kırmızı solmayan gül"
              loading="lazy"
              className="h-full w-full object-cover object-center"
            />
            <span className="absolute bottom-2 right-3 z-10 rounded-full bg-black/45 px-2 py-0.5 text-[10px] italic text-[#F7F3EB]/85">
              Konsept görsel
            </span>
          </div>
        </div>
      </section>

      {/* 6. Hediye Seçim Rehberi Bar */}
      <section aria-label="Hediye Seçim Rehberi" className="mt-8 border-t border-[#E5DCD0] bg-[#FFFDF8] lg:mt-12">
        <div className="ensar-container">
          <Link
            href="/hediye-secim-rehberi"
            className="group flex min-h-[64px] items-center justify-between py-4 lg:min-h-[72px]"
          >
            <div className="flex items-center gap-4">
              <GiftIcon size={24} className="shrink-0 text-[#321B2D]" />
              <span className="h-6 w-px bg-[#DFD5C8]" aria-hidden="true" />
              <span className="font-heading text-[20px] font-medium text-[#241722] sm:text-[24px]">
                Hediye Seçim Rehberi
              </span>
            </div>
            <ChevronRightIcon
              size={20}
              className="text-[#321B2D] transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>
      </section>
    </div>
  );
}
