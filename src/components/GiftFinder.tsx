"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import type { Product } from "@/types/store";
import { formatPriceTRY } from "@/lib/format";
import { GiftIcon, LightIcon, ChevronRightIcon } from "./Icons";

interface GiftFinderProps {
  products: Product[];
}

export function GiftFinder({ products }: GiftFinderProps) {
  const published = useMemo(
    () => products.filter((p) => p.published),
    [products]
  );

  const occasionOptions = useMemo(() => {
    const set = new Set<string>();
    published.forEach((p) => p.occasions.forEach((o) => set.add(o)));
    return Array.from(set);
  }, [published]);

  const giftTypeOptions = useMemo(() => {
    const set = new Set<string>();
    published.forEach((p) => p.giftTypes.forEach((g) => set.add(g)));
    return Array.from(set);
  }, [published]);

  // Initial visual reference preview state: "Doğum Günü" + "Işıklı Ürünler" + open "Astronot Cam Küre" with "Örnek" badge
  const defaultOccasion = occasionOptions.includes("Doğum Günü")
    ? "Doğum Günü"
    : "";
  const defaultGiftType = giftTypeOptions.includes("Işıklı Ürünler")
    ? "Işıklı Ürünler"
    : "";

  const [selectedOccasion, setSelectedOccasion] = useState(defaultOccasion);
  const [selectedGiftType, setSelectedGiftType] = useState(defaultGiftType);
  const [appliedOccasion, setAppliedOccasion] = useState(defaultOccasion);
  const [appliedGiftType, setAppliedGiftType] = useState(defaultGiftType);
  const [isPreviewMode, setIsPreviewMode] = useState(true);

  const matchedProducts = useMemo(() => {
    if (isPreviewMode) {
      const sample =
        published.find((p) => p.slug === "astronot-buyuk-boy-usbli-cam-kure") ||
        published[0];
      return sample ? [sample] : [];
    }
    return published.filter((p) => {
      const occMatch =
        !appliedOccasion || p.occasions.includes(appliedOccasion);
      const typeMatch =
        !appliedGiftType || p.giftTypes.includes(appliedGiftType);
      return occMatch && typeMatch;
    });
  }, [published, isPreviewMode, appliedOccasion, appliedGiftType]);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedOccasion(selectedOccasion);
    setAppliedGiftType(selectedGiftType);
    setIsPreviewMode(false);
  };

  const handleClear = () => {
    setSelectedOccasion("");
    setSelectedGiftType("");
    setAppliedOccasion("");
    setAppliedGiftType("");
    setIsPreviewMode(false);
  };

  return (
    <section
      id="hediyeni-bul"
      aria-labelledby="hediyeni-bul-baslik"
      className="ensar-container scroll-mt-24 pt-6 lg:pt-8"
    >
      <div className="rounded-[16px] bg-[#E9D9F1] p-4 sm:p-6 lg:px-7 lg:py-6">
        <form
          onSubmit={handleApply}
          className="flex flex-col gap-3.5 lg:flex-row lg:items-center lg:justify-between lg:gap-4"
        >
          <h2
            id="hediyeni-bul-baslik"
            className="font-heading text-[26px] font-medium leading-tight text-[#241722] lg:shrink-0 lg:text-[32px]"
          >
            Hediyeni Bul
          </h2>

          <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center lg:justify-end">
            <div className="grid grid-cols-2 gap-2 lg:flex lg:items-center lg:gap-3">
              {/* Filter 1: Occasion */}
              <div className="relative flex min-h-[44px] items-center rounded-full border border-[#DFD2E7] bg-[#FFFDF8] pl-3 pr-2 shadow-2xs">
                <GiftIcon
                  size={16}
                  className="pointer-events-none shrink-0 text-[#321B2D]"
                />
                <label htmlFor="gift-occasion" className="sr-only">
                  Kime veya hangi güne?
                </label>
                <select
                  id="gift-occasion"
                  value={selectedOccasion}
                  onChange={(e) => {
                    setSelectedOccasion(e.target.value);
                    setAppliedOccasion(e.target.value);
                    setIsPreviewMode(false);
                  }}
                  className="ensar-select h-11 w-full cursor-pointer truncate bg-transparent pl-1.5 pr-5 text-[12.5px] font-medium text-[#241722] focus:outline-none sm:text-sm lg:min-w-[165px]"
                >
                  <option value="">Kime veya hangi güne?</option>
                  {occasionOptions.map((occ) => (
                    <option key={occ} value={occ}>
                      {occ}
                    </option>
                  ))}
                </select>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute right-2.5 text-[11px] text-[#5F505C]"
                >
                  ▾
                </span>
              </div>

              {/* Filter 2: Gift Type */}
              <div className="relative flex min-h-[44px] items-center rounded-full border border-[#DFD2E7] bg-[#FFFDF8] pl-3 pr-2 shadow-2xs">
                <LightIcon
                  size={16}
                  className="pointer-events-none shrink-0 text-[#321B2D]"
                />
                <label htmlFor="gift-type" className="sr-only">
                  Ne tür bir hediye?
                </label>
                <select
                  id="gift-type"
                  value={selectedGiftType}
                  onChange={(e) => {
                    setSelectedGiftType(e.target.value);
                    setAppliedGiftType(e.target.value);
                    setIsPreviewMode(false);
                  }}
                  className="ensar-select h-11 w-full cursor-pointer truncate bg-transparent pl-1.5 pr-5 text-[12.5px] font-medium text-[#241722] focus:outline-none sm:text-sm lg:min-w-[165px]"
                >
                  <option value="">Ne tür bir hediye?</option>
                  {giftTypeOptions.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute right-2.5 text-[11px] text-[#5F505C]"
                >
                  ▾
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="inline-flex min-h-[44px] w-full shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#321B2D] px-6 py-2.5 text-[14px] font-semibold text-[#F7F3EB] transition-colors hover:bg-[#44253D] lg:w-auto"
            >
              <span>Sonuçları Gör</span>
              <ChevronRightIcon size={16} />
            </button>
          </div>
        </form>

        {/* Results Area */}
        <div className="mt-4 space-y-2.5" aria-live="polite">
          {matchedProducts.length === 0 ? (
            <div className="flex flex-col items-start justify-between gap-3 rounded-[14px] border border-[#E2D6E8] bg-[#FFFDF8] px-4 py-4 sm:flex-row sm:items-center">
              <p className="text-sm font-medium text-[#241722]">
                Bu seçimle eşleşen ürün bulunamadı.
              </p>
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex min-h-[44px] items-center rounded-full border border-[#321B2D] px-5 text-sm font-semibold text-[#321B2D] transition-colors hover:bg-[#321B2D] hover:text-[#F7F3EB]"
              >
                Filtreleri Temizle
              </button>
            </div>
          ) : (
            matchedProducts.map((product) => (
              <Link
                key={product.id}
                href={`/urun/${product.slug}`}
                className="group flex min-h-[68px] items-center justify-between gap-3 rounded-[14px] border border-[#E5DCD0] bg-[#FFFDF8] px-3 py-2.5 shadow-2xs transition-all hover:border-[#321B2D]/35 hover:shadow-sm sm:px-4"
              >
                <div className="flex min-w-0 items-center gap-3.5">
                  <div className="h-12 w-14 shrink-0 overflow-hidden rounded-xl bg-[#241320] sm:h-14 sm:w-16">
                    <img
                      src={
                        isPreviewMode
                          ? "/ensar-web/gorseller/hediye-sonuc.webp"
                          : product.image
                      }
                      alt={product.imageAlt}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-medium text-[#241722] sm:text-[17px]">
                      {isPreviewMode ? product.shortName : product.name}
                    </p>
                    {!isPreviewMode && (
                      <p className="mt-0.5 text-xs text-[#5F505C]">
                        {formatPriceTRY(product.price)} ·{" "}
                        {product.stock > 0 ? "Stokta var" : "Tükendi"}
                      </p>
                    )}
                  </div>
                </div>

                {isPreviewMode ? (
                  <span className="shrink-0 pr-1 text-sm italic text-[#6D5E6B]">
                    Örnek
                  </span>
                ) : (
                  <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-[#321B2D] sm:text-sm">
                    <span>İncele</span>
                    <ChevronRightIcon size={15} />
                  </span>
                )}
              </Link>
            ))
          )}

          {!isPreviewMode && (appliedOccasion || appliedGiftType) && (
            <div className="flex items-center justify-between pt-1 text-xs text-[#4C3C49]">
              <span>
                {matchedProducts.length} ürün listeleniyor
              </span>
              <button
                type="button"
                onClick={handleClear}
                className="font-semibold underline underline-offset-2 hover:text-[#241722]"
              >
                Filtreleri Temizle
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
