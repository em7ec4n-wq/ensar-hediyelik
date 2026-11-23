"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { Category, StoreData } from "@/types/store";
import { getCategoryHref } from "@/components/CategoriesClient";
import { ChevronDownIcon } from "@/components/Icons";

interface AdminCategoryCardProps {
  cat: Category;
  idx: number;
  store: StoreData;
  commitStore: (next: StoreData, msg?: string, cardId?: string, immediate?: boolean) => Promise<void>;
  showNotice: (msg: string) => void;
  handleFilesUpload: (
    files: FileList | null,
    targetKey: string,
    onUrlsReady: (urls: string[]) => void
  ) => Promise<void>;
  onAddProductToCat: (catSlug: string) => void;
  onAssignExistingToCat: (catSlug: string) => void;
  onDeleteCategory: (catSlug: string) => void;
  onViewCategoryProducts?: (catSlug: string) => void;
}

export function AdminCategoryCard({
  cat,
  idx,
  store,
  commitStore,
  showNotice,
  handleFilesUpload,
  onAddProductToCat,
  onAssignExistingToCat,
  onDeleteCategory,
  onViewCategoryProducts,
}: AdminCategoryCardProps) {
  // Local isolated draft states — typing here will NEVER jitter or cause cursor jump!
  const [name, setName] = useState(cat.name);
  const [description, setDescription] = useState(cat.description || "");
  const [parentSlug, setParentSlug] = useState(cat.parentSlug || "");
  const [showOnHome, setShowOnHome] = useState(cat.showOnHome);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const isInputFocusedRef = useRef(false);
  const prevCatSlugRef = useRef(cat.slug);

  useEffect(() => {
    const isNewCat = prevCatSlugRef.current !== cat.slug;
    if (isNewCat) {
      prevCatSlugRef.current = cat.slug;
      setName(cat.name);
      setDescription(cat.description || "");
      setParentSlug(cat.parentSlug || "");
      setShowOnHome(cat.showOnHome);
    } else if (!isInputFocusedRef.current) {
      setName((prev) => (prev === cat.name ? prev : cat.name));
      setDescription((prev) => (prev === (cat.description || "") ? prev : cat.description || ""));
      setParentSlug(cat.parentSlug || "");
      setShowOnHome(cat.showOnHome);
    }
  }, [cat.slug, cat.name, cat.description, cat.parentSlug, cat.showOnHome]);

  const parentCat = cat.parentSlug
    ? store.categories.find((c) => c.slug === cat.parentSlug)
    : null;

  const catProdCount = store.products.filter(
    (p) =>
      p.categorySlug === cat.slug ||
      p.extraCategorySlugs?.includes(cat.slug)
  ).length;

  const saveCategoryDraft = async (
    overrideParentSlug?: string,
    overrideShowOnHome?: boolean
  ) => {
    const next = structuredClone(store);
    const target = next.categories.find((c) => c.slug === cat.slug);
    if (!target) return;

    const trimmedName = name.trim() || target.name;
    const trimmedDesc = description.trim();
    const finalParent =
      overrideParentSlug !== undefined
        ? overrideParentSlug || undefined
        : parentSlug || undefined;
    const finalHome =
      overrideShowOnHome !== undefined ? overrideShowOnHome : showOnHome;

    target.name = trimmedName;
    target.description = trimmedDesc;
    target.parentSlug = finalParent;
    target.showOnHome = finalHome;

    await commitStore(next, `✓ "${trimmedName}" kategorisi kaydedildi`, undefined, true);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div
      className={`ensar-card flex flex-col gap-4 p-4 sm:flex-row sm:items-start ${
        cat.parentSlug ? "border-l-4 border-l-[#321B2D]" : ""
      }`}
    >
      {/* Category Image - Clickable to enter category products */}
      <button
        type="button"
        onClick={() => onViewCategoryProducts?.(cat.slug)}
        title="Bu kategorideki ürünleri listele ve düzenle"
        className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-[#E5DCD0] bg-[#FFFDF8] text-left transition-all hover:border-[#321B2D]"
      >
        <img
          src={cat.image}
          alt={cat.imageAlt}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
        <span className="absolute bottom-1 right-1 rounded-md bg-black/75 px-1.5 py-0.5 text-[10px] font-bold text-white group-hover:bg-[#321B2D]">
          {catProdCount} ürün ↗
        </span>
      </button>

      {/* Category Fields */}
      <div className="flex-1 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span
            className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
              parentCat
                ? "bg-[#321B2D] text-[#F7F3EB]"
                : "bg-[#E9D9F1] text-[#321B2D]"
            }`}
          >
            {parentCat
              ? `↳ Alt Kategori (${parentCat.name})`
              : "Ana Kategori"}
          </span>

          <div className="flex flex-wrap items-center gap-1.5">
            {onViewCategoryProducts && (
              <button
                type="button"
                onClick={() => onViewCategoryProducts(cat.slug)}
                className="rounded-xl bg-[#E9D9F1] px-2.5 py-1.5 text-xs font-bold text-[#321B2D] hover:bg-[#321B2D] hover:text-[#F7F3EB]"
                title="Bu kategorideki ürünleri yönetin"
              >
                📋 Ürünleri Gör ({catProdCount})
              </button>
            )}

            <button
              type="button"
              onClick={() => onAddProductToCat(cat.slug)}
              className="rounded-xl bg-[#321B2D] px-2.5 py-1.5 text-xs font-semibold text-[#F7F3EB] hover:bg-[#44253D]"
            >
              ＋ Yeni Ürün Ekle
            </button>

            <button
              type="button"
              onClick={() => onAssignExistingToCat(cat.slug)}
              className="rounded-xl border border-[#321B2D] bg-[#FFFDF8] px-2.5 py-1.5 text-xs font-semibold text-[#321B2D] hover:bg-[#E9D9F1]"
            >
              📦 Ürün Ata / Taşı
            </button>

            <Link
              href={getCategoryHref(cat.slug)}
              className="shrink-0 rounded-xl bg-stone-100 px-2.5 py-1.5 text-xs font-semibold text-[#5F505C] hover:bg-stone-200"
            >
              Sitede Gör ↗
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <label className="block text-[11px] font-bold text-[#6F606C]">
              Kategori Adı
            </label>
            <input
              value={name}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              onFocus={() => {
                isInputFocusedRef.current = true;
              }}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => {
                isInputFocusedRef.current = false;
                void saveCategoryDraft();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
              className="mt-0.5 h-10 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3 text-sm font-semibold text-[#241722] focus:border-[#321B2D] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#6F606C]">
              Üst Kategori (Alt kategori yapmak için seçin)
            </label>
            <div className="relative mt-0.5">
              <select
                value={parentSlug}
                onChange={async (e) => {
                  const val = e.target.value;
                  setParentSlug(val);
                  await saveCategoryDraft(val, showOnHome);
                }}
                className="ensar-select h-10 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] pl-2.5 pr-7 text-xs font-semibold text-[#241722]"
              >
                <option value="">Ana Kategori (Üst Yok)</option>
                {store.categories
                  .filter((c) => !c.parentSlug && c.slug !== cat.slug)
                  .map((c) => (
                    <option key={c.slug} value={c.slug}>
                      ↳ {c.name} Altında
                    </option>
                  ))}
              </select>
              <ChevronDownIcon
                size={14}
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#5F505C]"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-[#6F606C]">
            Kısa Açıklama
          </label>
          <input
            value={description}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            onFocus={() => {
              isInputFocusedRef.current = true;
            }}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => {
              isInputFocusedRef.current = false;
              void saveCategoryDraft();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
            placeholder="Kategori açıklaması…"
            className="mt-0.5 h-9 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3 text-xs text-[#4C3C49] focus:border-[#321B2D] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-xl bg-[#321B2D] px-3.5 py-1 text-xs font-semibold text-[#F7F3EB]">
              <span>📷 Fotoğraf Değiştir</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  handleFilesUpload(e.target.files, `cat-${cat.slug}`, (urls) => {
                    if (!urls[0]) return;
                    const next = structuredClone(store);
                    next.categories[idx].image = urls[0];
                    next.categories[idx].isConceptImage = false;
                    void commitStore(next, "✓ Kategori fotoğrafı kaydedildi");
                  })
                }
              />
            </label>

            <label className="flex items-center gap-1.5 text-xs font-medium text-[#241722]">
              <input
                type="checkbox"
                checked={showOnHome}
                onChange={async (e) => {
                  const checked = e.target.checked;
                  setShowOnHome(checked);
                  await saveCategoryDraft(parentSlug, checked);
                }}
                className="accent-[#321B2D]"
              />
              <span>Ana sayfada göster</span>
            </label>

            <button
              type="button"
              onClick={() => void saveCategoryDraft()}
              className={`min-h-[36px] rounded-xl px-3.5 text-xs font-semibold transition-all ${
                isSaved
                  ? "bg-emerald-700 text-white"
                  : "bg-stone-200 text-[#241722] hover:bg-stone-300"
              }`}
            >
              {isSaved ? "✓ Kaydedildi" : "Kaydet"}
            </button>
          </div>

          {confirmDelete ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-rose-700">Silinsin mi?</span>
              <button
                type="button"
                onClick={() => {
                  setConfirmDelete(false);
                  onDeleteCategory(cat.slug);
                }}
                className="rounded-lg bg-rose-700 px-3 py-1 text-xs font-semibold text-white"
              >
                Evet, Sil
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded-lg border border-[#DDD3C6] px-2.5 py-1 text-xs font-semibold"
              >
                Vazgeç
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="rounded-lg border border-rose-700/30 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-700 hover:text-white"
            >
              🗑 Kategoriyi Sil
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
