"use client";

import React from "react";
import Link from "next/link";
import { useLiveStore } from "./StoreProvider";
import { formatPriceTRY } from "@/lib/format";
import { HeroCarousel } from "./HeroCarousel";
import { ChevronRightIcon, GiftIcon } from "./Icons";
import { getProductHref } from "./ProductCard";
import { getCategoryHref } from "./CategoriesClient";

export function HomeClient() {
  const { store } = useLiveStore();

  // Order categories cleanly with Yılbaşı Ürünleri and main categories stacked vertically & larger
  const allMainCategories = store.categories.filter((c) => !c.parentSlug);

  const newArrivals = store.products
    .filter((p) => p.published && p.isNewArrival)
    .sort((a, b) => (a.newArrivalOrder ?? 99) - (b.newArrivalOrder ?? 99))
    .slice(0, 3);

  return (
    <div className="pb-0">
      {/* 1. Three-Slide Hero */}
      <HeroCarousel slides={store.heroSlides} />

      {/* 2. Kategorileri Keşfet (Tek tek alt alta, büyük boy ve sade) */}
      <section
        aria-labelledby="kategorileri-kesfet-baslik"
        className="ensar-container pt-10 lg:pt-14"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="kategorileri-kesfet-baslik"
              className="font-heading text-[30px] font-medium text-[#241722] lg:text-[38px]"
            >
              Kategorileri Keşfet
            </h2>
            <p className="mt-1 text-sm text-[#5F505C]">
              İncelemek istediğiniz ürün grubunu seçin
            </p>
          </div>
        </div>

        {/* Tek tek alt alta (her satırda 1 büyük kategori kartı + varsa alt kategorileri) */}
        <div className="mx-auto mt-5 max-w-2xl grid grid-cols-1 gap-5">
          {allMainCategories.map((cat) => {
            const subcats = store.categories.filter(
              (sub) => sub.parentSlug === cat.slug
            );
            return (
              <div
                key={cat.slug}
                className="ensar-card overflow-hidden transition-transform duration-300 hover:-translate-y-0.5"
              >
                <Link href={getCategoryHref(cat.slug)} className="group block">
                  <div className="aspect-[16/10] w-full overflow-hidden bg-[#241320]">
                    <img
                      src={cat.image}
                      alt={cat.imageAlt}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex min-h-[56px] items-center justify-center gap-1.5 bg-[#FFFDF8] px-4 py-3.5 text-center">
                    <span className="text-[18px] font-medium text-[#241722] sm:text-[20px]">
                      {cat.name}
                    </span>
                    <ChevronRightIcon
                      size={18}
                      className="text-[#5F505C] transition-transform group-hover:translate-x-0.5"
                    />
                  </div>
                </Link>

                {subcats.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-2 border-t border-[#EFE7DC] bg-white px-4 py-3">
                    {subcats.map((sub) => (
                      <Link
                        key={sub.slug}
                        href={getCategoryHref(sub.slug)}
                        className="rounded-full border border-[#DDD3C6] bg-[#F7F3EB] px-3.5 py-1.5 text-xs font-semibold text-[#321B2D] transition-colors hover:bg-[#321B2D] hover:text-[#F7F3EB]"
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Yeni Gelenler */}
      <section
        id="yeni-gelenler"
        aria-labelledby="yeni-gelenler-baslik"
        className="ensar-container scroll-mt-24 pt-12 lg:pt-16"
      >
        <h2
          id="yeni-gelenler-baslik"
          className="font-heading text-[28px] font-medium text-[#241722] lg:text-[36px]"
        >
          Yeni Gelenler
        </h2>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-6">
          {newArrivals.map((product) => (
            <Link
              key={product.id}
              href={getProductHref(product.slug)}
              className="group overflow-hidden rounded-[16px] border border-[#E5DCD0] bg-white shadow-[0_6px_20px_rgba(36,23,34,0.06)] transition-transform duration-300 hover:-translate-y-0.5"
            >
              <div className="aspect-[4/3.2] w-full overflow-hidden bg-white p-2">
                <img
                  src={product.image}
                  alt={product.imageAlt}
                  loading="lazy"
                  className="h-full w-full rounded-xl object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-col items-center justify-center bg-white px-4 py-4 text-center">
                <h3 className="text-[16px] font-medium text-[#241722]">
                  {product.shortName || product.name}
                </h3>
                <p className="mt-1 text-sm font-bold text-[#321B2D]">
                  {formatPriceTRY(product.price)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Işıklı Hediyeler Vitrin */}
      <section
        aria-labelledby="isikli-hediyeler-baslik"
        className="ensar-container pt-12 lg:pt-16"
      >
        <div className="relative flex h-[200px] items-center justify-between overflow-hidden rounded-[16px] bg-[#321B2D] text-[#F7F3EB] lg:h-[320px]">
          <div className="relative z-10 flex max-w-[58%] flex-col items-start justify-center pl-5 pr-3 sm:pl-10 lg:max-w-[50%] lg:pl-14">
            <h2
              id="isikli-hediyeler-baslik"
              className="font-heading text-[26px] font-medium leading-tight text-[#F7F3EB] sm:text-[36px] lg:text-[50px]"
            >
              Işıklı Hediyeler
            </h2>
            <Link
              href="/kategori/isikli-hediyeler/"
              className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-[#F7F3EB] px-4 py-2 text-[13px] font-semibold text-[#241722] transition-colors hover:bg-[#FFFDF8] sm:px-6 sm:py-2.5 sm:text-[15px] lg:mt-6"
            >
              <span>Koleksiyonu İncele</span>
              <ChevronRightIcon size={16} />
            </Link>
          </div>

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
          </div>
        </div>
      </section>

      {/* 5. Misyonumuz & Vizyonumuz */}
      <section
        id="misyon-vizyon"
        aria-labelledby="misyon-vizyon-baslik"
        className="ensar-container scroll-mt-24 pt-12 lg:pt-16"
      >
        <div className="rounded-[20px] border border-[#E5DCD0] bg-white p-6 shadow-[0_6px_20px_rgba(36,23,34,0.05)] sm:p-8 lg:p-10">
          <div className="max-w-2xl">
            <span className="inline-block rounded-full bg-[#E9D9F1] px-3.5 py-1 text-xs font-semibold text-[#321B2D]">
              Ensar Hediyelik Hakkında
            </span>
            <h2
              id="misyon-vizyon-baslik"
              className="font-heading mt-3 text-[28px] font-medium text-[#241722] lg:text-[36px]"
            >
              Misyonumuz &amp; Vizyonumuz
            </h2>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-[#EFE7DC] bg-[#FFFDF8] p-6">
              <h3 className="font-heading text-[22px] font-medium text-[#321B2D]">
                Misyonumuz
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-[#4C3C49] sm:text-[15px]">
                Her özel günü ve anlamlı anı unutulmaz kılacak kaliteli, estetik
                ve özenle seçilmiş hediyelik ürünleri ulaşılabilir fiyatlarla
                müşterilerimize sunmak; hızlı iletişim ve güvenilir hizmet
                anlayışıyla alışverişin her adımında memnuniyet sağlamaktır.
              </p>
            </div>

            <div className="rounded-2xl border border-[#EFE7DC] bg-[#FFFDF8] p-6">
              <h3 className="font-heading text-[22px] font-medium text-[#321B2D]">
                Vizyonumuz
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-[#4C3C49] sm:text-[15px]">
                Cam kürelerden müzik kutularına, dekoratif objelerden sezonluk
                koleksiyonlara kadar Türkiye&apos;nin her noktasına yenilikçi ve
                zengin ürün çeşitliliğiyle ulaşan, hediyelik eşya sektöründe
                güven ve kalitenin ilk akla gelen öncü markası olmaktır.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Hediye Seçim Rehberi Bar */}
      <section
        aria-label="Hediye Seçim Rehberi"
        className="mt-10 border-t border-[#E5DCD0] bg-[#FFFDF8] lg:mt-14"
      >
        <div className="ensar-container">
          <Link
            href="/hediye-secim-rehberi/"
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
