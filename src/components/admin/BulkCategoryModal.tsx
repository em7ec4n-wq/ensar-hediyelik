"use client";

import React, { useState } from "react";
import type { StoreData } from "@/types/store";
import { CloseIcon } from "@/components/Icons";

interface BulkCategoryModalProps {
  store: StoreData;
  isOpen: boolean;
  onClose: () => void;
  commitStore: (next: StoreData, msg?: string, cardId?: string, immediate?: boolean) => Promise<void>;
  showNotice: (msg: string) => void;
}

export function BulkCategoryModal({
  store,
  isOpen,
  onClose,
  commitStore,
  showNotice,
}: BulkCategoryModalProps) {
  const [sourceCat, setSourceCat] = useState("all");
  const [targetCat, setTargetCat] = useState(store.categories[0]?.slug || "yilbasi");

  if (!isOpen) return null;

  const countInSource =
    sourceCat === "all"
      ? store.products.length
      : store.products.filter(
          (p) =>
            p.categorySlug === sourceCat ||
            p.extraCategorySlugs?.includes(sourceCat)
        ).length;

  const handleApplyBulkMove = async () => {
    if (sourceCat === targetCat) {
      showNotice("Kaynak ve hedef kategori aynı olamaz.");
      return;
    }

    const next = structuredClone(store);
    const targetObj = store.categories.find((c) => c.slug === targetCat);
    const parentSlug = targetObj?.parentSlug;

    let movedCount = 0;
    for (const p of next.products) {
      const matchesSource =
        sourceCat === "all" ||
        p.categorySlug === sourceCat ||
        p.extraCategorySlugs?.includes(sourceCat);

      if (matchesSource) {
        p.categorySlug = targetCat;
        if (parentSlug) {
          p.extraCategorySlugs = [parentSlug];
        } else {
          p.extraCategorySlugs = [];
        }
        movedCount++;
      }
    }

    await commitStore(
      next,
      `✓ ${movedCount} ürün "${targetObj?.name || targetCat}" kategorisine taşındı!`,
      undefined,
      true
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="ensar-card w-full max-w-lg bg-[#F7F3EB] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#E5DCD0] pb-3">
          <h2 className="font-heading text-lg font-bold text-[#241722]">
            📂 Toplu Kategori Değiştirme
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-stone-200"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#241722]">
              1. Hangi Kategorideki Ürünler Taşınsın? (Kaynak)
            </label>
            <select
              value={sourceCat}
              onChange={(e) => setSourceCat(e.target.value)}
              className="ensar-select mt-1 h-11 w-full rounded-xl border border-[#DDD3C6] bg-white px-3 text-sm font-semibold"
            >
              <option value="all">Tüm Ürünler ({store.products.length} ürün)</option>
              {store.categories.map((c) => {
                const count = store.products.filter(
                  (p) =>
                    p.categorySlug === c.slug ||
                    p.extraCategorySlugs?.includes(c.slug)
                ).length;
                return (
                  <option key={c.slug} value={c.slug}>
                    {c.parentSlug ? `↳ ${c.name}` : c.name} ({count} ürün)
                  </option>
                );
              })}
            </select>
            <p className="mt-1 text-xs text-[#5F505C]">
              Seçilen kaynakta <strong>{countInSource}</strong> ürün bulunuyor.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#241722]">
              2. Hangi Kategoriye / Alt Kategoriye Taşınsın? (Hedef)
            </label>
            <select
              value={targetCat}
              onChange={(e) => setTargetCat(e.target.value)}
              className="ensar-select mt-1 h-11 w-full rounded-xl border border-[#DDD3C6] bg-white px-3 text-sm font-semibold text-[#321B2D]"
            >
              <optgroup label="─── ANA KATEGORİLER ───">
                {store.categories
                  .filter((c) => !c.parentSlug)
                  .map((c) => (
                    <option key={c.slug} value={c.slug}>
                      📁 {c.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="─── ALT KATEGORİLER ───">
                {store.categories
                  .filter((c) => Boolean(c.parentSlug))
                  .map((c) => {
                    const parent = store.categories.find(
                      (p) => p.slug === c.parentSlug
                    );
                    return (
                      <option key={c.slug} value={c.slug}>
                        ↳ {parent?.name || "Üst"} → {c.name}
                      </option>
                    );
                  })}
              </optgroup>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[42px] rounded-xl border border-[#DDD3C6] px-4 text-xs font-semibold text-[#5F505C]"
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={handleApplyBulkMove}
              className="min-h-[42px] rounded-xl bg-[#321B2D] px-5 text-xs font-bold text-[#F7F3EB] shadow hover:bg-[#44253D]"
            >
              ✓ {countInSource} Ürünü Hedefe Taşı
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
