"use client";

import React, { useState, useMemo } from "react";
import type { Category, StoreData } from "@/types/store";
import { SearchIcon, CloseIcon } from "@/components/Icons";

interface CategoryAssignModalProps {
  targetCategorySlug: string;
  store: StoreData;
  isOpen: boolean;
  onClose: () => void;
  commitStore: (next: StoreData, msg?: string, cardId?: string, immediate?: boolean) => Promise<void>;
  showNotice: (msg: string) => void;
}

export function CategoryAssignModal({
  targetCategorySlug,
  store,
  isOpen,
  onClose,
  commitStore,
  showNotice,
}: CategoryAssignModalProps) {
  const targetCategory = useMemo(
    () => store.categories.find((c) => c.slug === targetCategorySlug),
    [store.categories, targetCategorySlug]
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [filterSourceCat, setFilterSourceCat] = useState("all");
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const p of store.products) {
      if (p.categorySlug === targetCategorySlug) {
        initial.add(p.id);
      }
    }
    return initial;
  });

  // Re-sync initially when opening
  React.useEffect(() => {
    if (isOpen) {
      const initial = new Set<string>();
      for (const p of store.products) {
        if (
          p.categorySlug === targetCategorySlug ||
          p.extraCategorySlugs?.includes(targetCategorySlug)
        ) {
          initial.add(p.id);
        }
      }
      setSelectedProductIds(initial);
      setSearchTerm("");
      setFilterSourceCat("all");
    }
  }, [isOpen, targetCategorySlug, store.products]);

  const filteredProducts = useMemo(() => {
    const q = searchTerm.trim().toLocaleLowerCase("tr-TR");
    return store.products.filter((p) => {
      if (filterSourceCat !== "all" && p.categorySlug !== filterSourceCat) {
        return false;
      }
      if (q) {
        const hay = `${p.sku} ${p.name} ${p.shortName || ""} ${p.kaynakUrunAdi || ""}`.toLocaleLowerCase(
          "tr-TR"
        );
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [store.products, searchTerm, filterSourceCat]);

  if (!isOpen || !targetCategory) return null;

  const toggleProduct = (id: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      for (const p of filteredProducts) {
        next.add(p.id);
      }
      return next;
    });
  };

  const handleDeselectAllFiltered = () => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      for (const p of filteredProducts) {
        next.delete(p.id);
      }
      return next;
    });
  };

  const handleSaveAssignments = async () => {
    const next = structuredClone(store);
    const parentSlug = targetCategory.parentSlug;

    for (const p of next.products) {
      const isSelected = selectedProductIds.has(p.id);
      const isPrimaryIn = p.categorySlug === targetCategorySlug;
      const isExtraIn = Boolean(p.extraCategorySlugs?.includes(targetCategorySlug));
      const isCurrentlyIn = isPrimaryIn || isExtraIn;

      if (isSelected && !isCurrentlyIn) {
        const extraSet = new Set<string>(p.extraCategorySlugs || []);
        extraSet.add(targetCategorySlug);
        if (parentSlug) {
          extraSet.add(parentSlug);
        }
        extraSet.delete(p.categorySlug);
        p.extraCategorySlugs = Array.from(extraSet);
      } else if (!isSelected && isCurrentlyIn) {
        if (isExtraIn) {
          p.extraCategorySlugs = (p.extraCategorySlugs || []).filter(
            (s) => s !== targetCategorySlug
          );
        }
        if (isPrimaryIn) {
          p.categorySlug = parentSlug || "hediyelik-urunler";
          p.extraCategorySlugs = (p.extraCategorySlugs || []).filter(
            (s) => s !== p.categorySlug
          );
        }
      }
    }

    await commitStore(
      next,
      `✓ "${targetCategory.name}" kategorisine ürünler başarıyla atandı!`,
      undefined,
      true
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-5 backdrop-blur-xs">
      <div className="ensar-card flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden bg-[#F7F3EB] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5DCD0] bg-white px-5 py-4">
          <div>
            <h2 className="font-heading text-lg font-bold text-[#241722] sm:text-xl">
              📦 &ldquo;{targetCategory.name}&rdquo; Kategorisine Ürün Ata / Taşı
            </h2>
            <p className="mt-0.5 text-xs text-[#5F505C]">
              {targetCategory.parentSlug
                ? `Bu kategori "Kar Küreleri" gibi bir üst kategoriye bağlıdır. Buraya eklenen ürünler hem bu alt kategoride hem de ana kategoride görünür.`
                : `Bu ana kategoride listelenecek ürünleri seçin.`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-stone-100"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Filter controls */}
        <div className="border-b border-[#E5DCD0] bg-[#FFFDF8] p-4 space-y-3">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div className="relative">
              <SearchIcon
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#5F505C]"
              />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ürün adı, kodu (SKU) ara…"
                className="h-10 w-full rounded-xl border border-[#DDD3C6] bg-white pl-9 pr-3 text-xs focus:border-[#321B2D] focus:outline-none"
              />
            </div>

            <div>
              <select
                value={filterSourceCat}
                onChange={(e) => setFilterSourceCat(e.target.value)}
                className="ensar-select h-10 w-full rounded-xl border border-[#DDD3C6] bg-white px-3 text-xs focus:border-[#321B2D] focus:outline-none font-medium"
              >
                <option value="all">Tüm Kategorilerden Göster ({store.products.length} ürün)</option>
                <optgroup label="─── ANA KATEGORİLER ───">
                  {store.categories
                    .filter((c) => !c.parentSlug)
                    .map((c) => {
                      const count = store.products.filter(
                        (p) =>
                          p.categorySlug === c.slug ||
                          p.extraCategorySlugs?.includes(c.slug)
                      ).length;
                      return (
                        <option key={c.slug} value={c.slug}>
                          📁 {c.name} ({count} ürün)
                        </option>
                      );
                    })}
                </optgroup>
                <optgroup label="─── ALT KATEGORİLER ───">
                  {store.categories
                    .filter((c) => Boolean(c.parentSlug))
                    .map((c) => {
                      const parent = store.categories.find(
                        (p) => p.slug === c.parentSlug
                      );
                      const count = store.products.filter(
                        (p) => p.categorySlug === c.slug
                      ).length;
                      return (
                        <option key={c.slug} value={c.slug}>
                          ↳ {parent?.name || "Üst"} → {c.name} ({count} ürün)
                        </option>
                      );
                    })}
                </optgroup>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="rounded-lg bg-stone-200 px-2.5 py-1 font-semibold text-[#241722] hover:bg-stone-300"
              >
                Görünenleri Seç ({filteredProducts.length})
              </button>
              <button
                type="button"
                onClick={handleDeselectAllFiltered}
                className="rounded-lg border border-stone-300 px-2.5 py-1 font-semibold text-[#5F505C] hover:bg-stone-100"
              >
                Görünenleri Kaldır
              </button>
            </div>
            <span className="font-bold text-[#321B2D]">
              Toplam Seçili: {selectedProductIds.size} ürün
            </span>
          </div>
        </div>

        {/* Scrollable Products List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredProducts.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#5F505C]">
              Aramanıza uygun ürün bulunamadı.
            </div>
          ) : (
            filteredProducts.map((p) => {
              const isChecked = selectedProductIds.has(p.id);
              const currentCat = store.categories.find(
                (c) => c.slug === p.categorySlug
              );

              return (
                <label
                  key={p.id}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-2.5 transition-all ${
                    isChecked
                      ? "border-[#321B2D] bg-[#FFFDF8] shadow-xs"
                      : "border-[#E5DCD0] bg-white hover:border-stone-400"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleProduct(p.id)}
                      className="h-4 w-4 accent-[#321B2D]"
                    />
                    <img
                      src={p.image}
                      alt={p.name}
                      className="h-12 w-12 shrink-0 rounded-lg border border-[#E5DCD0] object-contain p-0.5"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-[#241722]">
                        {p.name}
                      </p>
                      <p className="text-[11px] text-[#5F505C]">
                        Kod: {p.sku} · Şu an:{" "}
                        <span className="font-medium text-[#321B2D]">
                          {currentCat?.name || p.categorySlug}
                        </span>
                      </p>
                    </div>
                  </div>

                  <span className="shrink-0 text-xs font-bold text-[#321B2D]">
                    {p.price !== null ? `${p.price} ₺` : "Fiyatsız"}
                  </span>
                </label>
              );
            })
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between border-t border-[#E5DCD0] bg-white p-4">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[42px] rounded-xl border border-[#DDD3C6] px-4 text-xs font-semibold text-[#5F505C] hover:bg-stone-100"
          >
            Vazgeç
          </button>

          <button
            type="button"
            onClick={handleSaveAssignments}
            className="min-h-[42px] rounded-xl bg-[#321B2D] px-6 text-xs font-bold text-[#F7F3EB] shadow hover:bg-[#44253D]"
          >
            ✓ Seçilen {selectedProductIds.size} Ürünü Bu Kategoriye Ata
          </button>
        </div>
      </div>
    </div>
  );
}
