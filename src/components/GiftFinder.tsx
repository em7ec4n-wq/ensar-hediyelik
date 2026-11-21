"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import type { Product } from "@/types/store";
import { formatPriceTRY } from "@/lib/format";
import {
  GiftIcon,
  LightIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from "./Icons";

interface GiftFinderProps {
  products: Product[];
}

interface ModernDropdownProps {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  options: string[];
  icon: React.ReactNode;
  onChange: (val: string) => void;
}

function ModernFilterDropdown({
  id,
  label,
  placeholder,
  value,
  options,
  icon,
  onChange,
}: ModernDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        id={id}
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`flex min-h-[44px] w-full items-center justify-between gap-2 rounded-full border bg-[#FFFDF8] px-3.5 py-2 text-left shadow-[0_2px_10px_rgba(50,27,45,0.06)] transition-all duration-200 lg:min-w-[195px] ${
          open
            ? "border-[#321B2D] ring-2 ring-[#321B2D]/15"
            : "border-[#DDD0E6] hover:border-[#321B2D]/50"
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-[#321B2D]">{icon}</span>
          <span
            className={`truncate text-[13px] font-medium sm:text-[14px] ${
              value ? "text-[#241722]" : "text-[#6D5D6A]"
            }`}
          >
            {value || placeholder}
          </span>
        </span>
        <ChevronDownIcon
          size={15}
          className={`shrink-0 text-[#5F505C] transition-transform duration-200 ${
            open ? "rotate-180 text-[#321B2D]" : ""
          }`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-labelledby={id}
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 min-w-[210px] overflow-hidden rounded-[18px] border border-[#E5DCD0] bg-[#FFFDF8]/98 p-1.5 shadow-[0_16px_40px_rgba(36,23,34,0.14)] backdrop-blur-md"
        >
          <button
            type="button"
            role="option"
            aria-selected={value === ""}
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className={`flex min-h-[40px] w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[13.5px] transition-colors ${
              value === ""
                ? "bg-[#E9D9F1]/75 font-semibold text-[#321B2D]"
                : "text-[#5F505C] hover:bg-[#F7F3EB] hover:text-[#241722]"
            }`}
          >
            <span>Tümü ({placeholder})</span>
            {value === "" && (
              <span className="h-2 w-2 rounded-full bg-[#321B2D]" />
            )}
          </button>

          <div className="my-1 h-px bg-[#EFE7DC]" />

          <div className="max-h-[240px] space-y-0.5 overflow-y-auto">
            {options.map((opt) => {
              const selected = value === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  className={`flex min-h-[40px] w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[13.5px] transition-colors ${
                    selected
                      ? "bg-[#321B2D] font-medium text-[#F7F3EB]"
                      : "text-[#241722] hover:bg-[#F7F3EB]"
                  }`}
                >
                  <span className="truncate">{opt}</span>
                  {selected && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width={15}
                      height={15}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      className="shrink-0"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
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
      <div className="rounded-[18px] bg-[#E9D9F1] p-4 shadow-[0_6px_24px_rgba(50,27,45,0.06)] sm:p-6 lg:px-7 lg:py-6">
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
            <div className="grid grid-cols-2 gap-2.5 lg:flex lg:items-center lg:gap-3">
              <ModernFilterDropdown
                id="gift-occasion"
                label="Kime veya hangi güne?"
                placeholder="Özel gün seç"
                value={selectedOccasion}
                options={occasionOptions}
                icon={<GiftIcon size={16} />}
                onChange={(val) => {
                  setSelectedOccasion(val);
                  setAppliedOccasion(val);
                  setIsPreviewMode(false);
                }}
              />

              <ModernFilterDropdown
                id="gift-type"
                label="Ne tür bir hediye?"
                placeholder="Hediye türü"
                value={selectedGiftType}
                options={giftTypeOptions}
                icon={<LightIcon size={16} />}
                onChange={(val) => {
                  setSelectedGiftType(val);
                  setAppliedGiftType(val);
                  setIsPreviewMode(false);
                }}
              />
            </div>

            <button
              type="submit"
              className="inline-flex min-h-[44px] w-full shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#321B2D] px-6 py-2.5 text-[14px] font-semibold text-[#F7F3EB] shadow-[0_4px_14px_rgba(50,27,45,0.22)] transition-all hover:bg-[#44253D] lg:w-auto"
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
                        {typeof product.stock === "number" && product.stock > 0
                          ? "Stokta var"
                          : "Tükendi"}
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
              <span>{matchedProducts.length} ürün listeleniyor</span>
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
