"use client";

import React, { useState, useEffect } from "react";
import type { HeroSlide, StoreData } from "@/types/store";
import { ChevronDownIcon } from "@/components/Icons";

interface HeroSlideCardProps {
  slide: HeroSlide;
  idx: number;
  store: StoreData;
  commitStore: (next: StoreData, msg?: string) => Promise<void>;
  handleFilesUpload: (
    files: FileList | null,
    targetKey: string,
    onUrlsReady: (urls: string[]) => void
  ) => Promise<void>;
}

export function HeroSlideCard({
  slide,
  idx,
  store,
  commitStore,
  handleFilesUpload,
}: HeroSlideCardProps) {
  const [titleText, setTitleText] = useState(slide.titleLines.join(" / "));
  const [buttonLabel, setButtonLabel] = useState(slide.buttonLabel);
  const [buttonHref, setButtonHref] = useState(slide.buttonHref);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setTitleText(slide.titleLines.join(" / "));
    setButtonLabel(slide.buttonLabel);
    setButtonHref(slide.buttonHref);
  }, [slide.titleLines, slide.buttonLabel, slide.buttonHref]);

  const saveSlide = async (overrideHref?: string) => {
    const next = structuredClone(store);
    const parsedLines = titleText
      .split("/")
      .map((s) => s.trim())
      .filter(Boolean);
    next.heroSlides[idx].titleLines =
      parsedLines.length > 0 ? parsedLines : next.heroSlides[idx].titleLines;
    next.heroSlides[idx].buttonLabel = buttonLabel.trim() || next.heroSlides[idx].buttonLabel;
    next.heroSlides[idx].buttonHref = overrideHref || buttonHref;

    await commitStore(next, "✓ Vitrin slaytı kaydedildi");
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="ensar-card grid grid-cols-1 gap-5 p-5 md:grid-cols-12">
      <div className="md:col-span-4">
        <div className="aspect-[16/10] w-full overflow-hidden rounded-2xl bg-[#241320]">
          <img
            src={slide.image}
            alt={slide.imageAlt}
            className="h-full w-full object-cover"
          />
        </div>
        <label className="mt-3 flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#321B2D] px-4 text-xs font-semibold text-[#F7F3EB] hover:bg-[#44253D]">
          <span>📷 Vitrin Fotoğrafını Değiştir</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) =>
              handleFilesUpload(e.target.files, slide.id, (urls) => {
                if (!urls[0]) return;
                const next = structuredClone(store);
                next.heroSlides[idx].image = urls[0];
                next.heroSlides[idx].isConceptImage = false;
                void commitStore(next, "✓ Vitrin fotoğrafı kaydedildi");
              })
            }
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:col-span-8">
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-[#241722]">
            Vitrin Başlığı (Satırları / ile ayırın)
          </label>
          <input
            value={titleText}
            onChange={(e) => setTitleText(e.target.value)}
            onBlur={() => void saveSlide()}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
            className="mt-1.5 h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3.5 text-sm font-medium focus:border-[#321B2D] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#241722]">
            Buton Yazısı
          </label>
          <input
            value={buttonLabel}
            onChange={(e) => setButtonLabel(e.target.value)}
            onBlur={() => void saveSlide()}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
            className="mt-1.5 h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3.5 text-sm font-medium focus:border-[#321B2D] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#241722]">
            Buton Yönlendirme Linki
          </label>
          <div className="relative mt-1.5">
            <select
              value={buttonHref}
              onChange={async (e) => {
                const val = e.target.value;
                setButtonHref(val);
                await saveSlide(val);
              }}
              className="ensar-select h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] pl-3.5 pr-9 text-sm focus:border-[#321B2D] focus:outline-none"
            >
              <option value="#hediyeni-bul">Hediyeni Bul Bölümü</option>
              <option value="/kategoriler/">Tüm Kategoriler</option>
              {store.categories.map((c) => (
                <option key={c.slug} value={`/kategori/${c.slug}/`}>
                  Kategori: {c.name}
                </option>
              ))}
            </select>
            <ChevronDownIcon
              size={15}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#5F505C]"
            />
          </div>
        </div>

        <div className="sm:col-span-2 flex justify-end">
          <button
            type="button"
            onClick={() => void saveSlide()}
            className={`min-h-[40px] rounded-xl px-5 text-xs font-bold transition-all ${
              isSaved
                ? "bg-emerald-700 text-white"
                : "bg-[#321B2D] text-[#F7F3EB] hover:bg-[#44253D]"
            }`}
          >
            {isSaved ? "✓ Kaydedildi" : "Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}
