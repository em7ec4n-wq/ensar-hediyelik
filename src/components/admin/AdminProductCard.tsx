"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { Product, StoreData } from "@/types/store";
import { getProductHref } from "@/components/ProductCard";
import { ChevronDownIcon } from "@/components/Icons";

interface AdminProductCardProps {
  product: Product;
  originalIndex: number;
  store: StoreData;
  isExpanded: boolean;
  onToggleExpand: () => void;
  commitStore: (next: StoreData, msg?: string, cardId?: string, immediate?: boolean) => Promise<void>;
  showNotice: (msg: string) => void;
  handleFilesUpload: (
    files: FileList | null,
    targetKey: string,
    onUrlsReady: (urls: string[]) => void
  ) => Promise<void>;
  uploadingId: string;
  savedCardId: string;
  onDeleteProduct: (index: number) => void;
  onEditProduct?: (product: Product) => void;
}

export function AdminProductCard({
  product,
  originalIndex,
  store,
  isExpanded,
  onToggleExpand,
  commitStore,
  showNotice,
  handleFilesUpload,
  uploadingId,
  savedCardId,
  onDeleteProduct,
  onEditProduct,
}: AdminProductCardProps) {
  // Local isolated draft states — typing here never triggers global re-renders or cursor jumping!
  const [name, setName] = useState(product.name);
  const [priceStr, setPriceStr] = useState(
    product.price !== null && product.price !== undefined ? String(product.price) : ""
  );
  const [sku, setSku] = useState(product.sku);
  const [description, setDescription] = useState(product.description || "");
  const [categorySlug, setCategorySlug] = useState(product.categorySlug);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Focus lock ref: Prevents external store updates from clobbering text while user is actively typing!
  const isInputFocusedRef = useRef(false);
  const prevProductIdRef = useRef(product.id);

  // Sync from props only when product ID changes, or when props change AND user is not focused on an input
  useEffect(() => {
    const isNewProduct = prevProductIdRef.current !== product.id;
    if (isNewProduct) {
      prevProductIdRef.current = product.id;
      setName(product.name);
      setPriceStr(
        product.price !== null && product.price !== undefined ? String(product.price) : ""
      );
      setSku(product.sku);
      setDescription(product.description || "");
      setCategorySlug(product.categorySlug);
    } else if (!isInputFocusedRef.current) {
      // Safe update only if not actively typing
      setName((prev) => (prev === product.name ? prev : product.name));
      const nextPriceStr =
        product.price !== null && product.price !== undefined ? String(product.price) : "";
      setPriceStr((prev) => (prev === nextPriceStr ? prev : nextPriceStr));
      setSku((prev) => (prev === product.sku ? prev : product.sku));
      setDescription((prev) => (prev === (product.description || "") ? prev : product.description || ""));
      setCategorySlug(product.categorySlug);
    }
  }, [product.id, product.name, product.price, product.sku, product.description, product.categorySlug]);

  const isJustSaved = savedCardId === product.id || isSaving;
  const gallery = product.gallery?.length ? product.gallery : [product.image];

  // Group categories for crystal-clear selection
  const mainCategories = store.categories.filter((c) => !c.parentSlug);
  const karKuresiSubcats = store.categories.filter((c) => c.parentSlug === "kar-kureleri");
  const otherSubcats = store.categories.filter(
    (c) => Boolean(c.parentSlug) && c.parentSlug !== "kar-kureleri"
  );

  const saveProductDraft = async (overrideCatSlug?: string) => {
    const next = structuredClone(store);
    const target = next.products.find((p) => p.id === product.id);
    if (!target) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      showNotice("Lütfen ürün adını boş bırakmayın.");
      return;
    }
    const trimmedSku = sku.trim() || target.sku;
    const trimmedDesc = description.trim();
    const finalCatSlug = overrideCatSlug || categorySlug;

    const catObj = store.categories.find((c) => c.slug === finalCatSlug);
    const extraCats = catObj?.parentSlug ? [catObj.parentSlug] : [];

    const parsedPrice = priceStr.trim() === "" ? null : Number(priceStr.replace(",", "."));
    const finalPrice = parsedPrice !== null && !isNaN(parsedPrice) ? Math.max(0, parsedPrice) : null;

    target.name = trimmedName;
    target.shortName = trimmedName;
    target.sku = trimmedSku;
    target.description = trimmedDesc;
    target.price = finalPrice;
    target.categorySlug = finalCatSlug;
    target.extraCategorySlugs = extraCats;

    setIsSaving(true);
    await commitStore(next, `✓ "${trimmedName}" kaydedildi`, product.id, true);
    setIsSaving(false);
  };

  const handleCategorySelectChange = async (newSlug: string) => {
    setCategorySlug(newSlug);
    await saveProductDraft(newSlug);
  };

  return (
    <div className="ensar-card overflow-hidden p-4 transition-all sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Image + Basic Info + Upload */}
        <div className="flex items-start gap-3.5 sm:gap-4">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-[#E5DCD0] bg-white p-1.5 sm:h-28 sm:w-28">
            <img
              src={product.image}
              alt={product.imageAlt}
              loading="lazy"
              className="h-full w-full object-contain"
            />
            <span className="absolute bottom-1 right-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {gallery.length} foto
            </span>
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-[#E9D9F1] px-2 py-0.5 text-[11px] font-bold text-[#321B2D]">
                Kod: {product.sku}
              </span>
              <button
                type="button"
                onClick={async () => {
                  const next = structuredClone(store);
                  next.products[originalIndex].published = !product.published;
                  await commitStore(
                    next,
                    next.products[originalIndex].published
                      ? "✓ Ürün satışa açıldı"
                      : "✓ Ürün gizlendi",
                    product.id
                  );
                }}
                className={`rounded-md px-2.5 py-0.5 text-[11px] font-bold ${
                  product.published
                    ? "bg-emerald-900/15 text-emerald-950"
                    : "bg-stone-200 text-stone-700"
                }`}
              >
                {product.published ? "● Satışta" : "○ Gizli"}
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#6F606C]">
                Ürün Adı
              </label>
              <input
                type="text"
                value={name}
                aria-label="Ürün adı"
                onFocus={() => {
                  isInputFocusedRef.current = true;
                }}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    void saveProductDraft();
                    e.currentTarget.blur();
                  }
                }}
                className="mt-0.5 h-10 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3 text-sm font-semibold text-[#241722] focus:border-[#321B2D] focus:outline-none sm:min-w-[280px]"
              />
            </div>

            {/* Photo buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <label className="inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-xl bg-[#321B2D] px-3 py-1.5 text-xs font-semibold text-[#F7F3EB] hover:bg-[#44253D]">
                <span>
                  {uploadingId === product.id ? "Yükleniyor…" : "📷 Fotoğraf Değiştir"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    handleFilesUpload(e.target.files, product.id, (urls) => {
                      if (!urls[0]) return;
                      const next = structuredClone(store);
                      next.products[originalIndex].image = urls[0];
                      next.products[originalIndex].gallery = [
                        urls[0],
                        ...(next.products[originalIndex].gallery || []).filter(
                          (g) => g !== product.image && g !== urls[0]
                        ),
                      ];
                      next.products[originalIndex].isConceptImage = false;
                      void commitStore(
                        next,
                        "✓ Fotoğraf orijinal kalitede kaydedildi",
                        product.id
                      );
                    })
                  }
                />
              </label>

              <label className="inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-xl border border-[#321B2D]/40 bg-[#FFFDF8] px-3 py-1.5 text-xs font-semibold text-[#321B2D] hover:bg-[#E9D9F1]">
                <span>＋ Ek Fotoğraf Ekle</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) =>
                    handleFilesUpload(e.target.files, `${product.id}-gal`, (urls) => {
                      const next = structuredClone(store);
                      const currentGal = next.products[originalIndex].gallery?.length
                        ? next.products[originalIndex].gallery
                        : [next.products[originalIndex].image];
                      next.products[originalIndex].gallery = [...currentGal, ...urls];
                      void commitStore(
                        next,
                        `✓ ${urls.length} ek fotoğraf kaydedildi`,
                        product.id
                      );
                      if (!isExpanded) onToggleExpand();
                    })
                  }
                />
              </label>
            </div>
          </div>
        </div>

        {/* Right: Price, Category Selector & Actions */}
        <div className="grid grid-cols-2 gap-2.5 border-t border-[#EFE7DC] pt-3 sm:flex sm:flex-wrap sm:items-end sm:justify-end lg:border-t-0 lg:pt-0">
          {/* Price */}
          <div>
            <label className="block text-[11px] font-bold text-[#6F606C]">
              Satış Fiyatı (TL)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={priceStr}
              placeholder="0"
              onFocus={() => {
                isInputFocusedRef.current = true;
              }}
              onChange={(e) => setPriceStr(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  void saveProductDraft();
                  e.currentTarget.blur();
                }
              }}
              className="mt-0.5 h-10 w-full rounded-xl border-2 border-[#321B2D]/35 bg-[#FFFDF8] px-3 text-base font-bold text-[#321B2D] focus:border-[#321B2D] focus:outline-none sm:w-28"
            />
          </div>

          {/* Categorized Category Select */}
          <div>
            <label className="block text-[11px] font-bold text-[#6F606C]">
              Kategorisi / Alt Kategorisi
            </label>
            <div className="relative mt-0.5">
              <select
                value={categorySlug}
                aria-label="Ürün kategorisi"
                onChange={(e) => void handleCategorySelectChange(e.target.value)}
                className="ensar-select h-10 w-full truncate rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] pl-2.5 pr-7 text-xs font-semibold text-[#241722] sm:w-48"
              >
                <optgroup label="─── ANA KATEGORİLER ───">
                  {mainCategories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      📁 {c.name}
                    </option>
                  ))}
                </optgroup>
                {karKuresiSubcats.length > 0 && (
                  <optgroup label="─── KAR KÜRELERİ ALT KATEGORİLERİ ───">
                    {karKuresiSubcats.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        ↳ Kar Küresi: {c.name}
                      </option>
                    ))}
                  </optgroup>
                )}
                {otherSubcats.length > 0 && (
                  <optgroup label="─── DİĞER ALT KATEGORİLER ───">
                    {otherSubcats.map((c) => {
                      const parent = store.categories.find((p) => p.slug === c.parentSlug);
                      return (
                        <option key={c.slug} value={c.slug}>
                          ↳ {parent?.name || "Üst"} → {c.name}
                        </option>
                      );
                    })}
                  </optgroup>
                )}
              </select>
              <ChevronDownIcon
                size={14}
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#5F505C]"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="col-span-2 flex flex-wrap items-center gap-2 pt-1 sm:pt-0">
            {onEditProduct && (
              <button
                type="button"
                onClick={() => onEditProduct(product)}
                className="min-h-[40px] rounded-xl bg-[#E9D9F1] px-3 text-xs font-bold text-[#321B2D] hover:bg-[#321B2D] hover:text-[#F7F3EB] transition-all"
                title="Ürünü tüm alanlarıyla düzenle"
              >
                ✏️ Düzenle
              </button>
            )}

            <button
              type="button"
              onClick={() => void saveProductDraft()}
              className={`min-h-[40px] flex-1 rounded-xl px-4 text-xs font-bold transition-all sm:flex-initial ${
                isJustSaved
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "bg-[#321B2D] text-[#F7F3EB] hover:bg-[#44253D]"
              }`}
            >
              {isJustSaved ? "✓ Kaydedildi" : "Kaydet"}
            </button>

            <button
              type="button"
              onClick={onToggleExpand}
              className="min-h-[40px] rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3 text-xs font-semibold text-[#241722] hover:border-[#321B2D]"
            >
              {isExpanded ? "Gizle ▲" : "Detay ▼"}
            </button>

            <Link
              href={getProductHref(product.slug)}
              className="inline-flex min-h-[40px] items-center rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3 text-xs font-semibold text-[#321B2D] hover:bg-[#321B2D] hover:text-[#F7F3EB]"
            >
              Gör ↗
            </Link>
          </div>
        </div>
      </div>

      {/* Expanded Drawer: Multi-Image Gallery Strip, Description, SKU, Delete */}
      {isExpanded && (
        <div className="mt-4 space-y-4 border-t border-[#EFE7DC] pt-4">
          <div>
            <p className="text-xs font-bold text-[#241722]">
              Ürün Fotoğrafları ({gallery.length} adet)
            </p>
            <div className="mt-2.5 flex flex-wrap gap-3">
              {gallery.map((imgUrl, gIdx) => {
                const isCover = imgUrl === product.image;
                return (
                  <div
                    key={gIdx}
                    className={`relative h-24 w-24 overflow-hidden rounded-xl border-2 bg-[#FFFDF8] ${
                      isCover ? "border-[#321B2D]" : "border-[#DDD3C6]"
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`${product.name} ${gIdx + 1}`}
                      className="h-full w-full object-cover"
                    />
                    {isCover ? (
                      <span className="absolute bottom-1 left-1 rounded bg-[#321B2D] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        Kapak
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={async () => {
                          const next = structuredClone(store);
                          next.products[originalIndex].image = imgUrl;
                          await commitStore(
                            next,
                            "✓ Kapak fotoğrafı güncellendi",
                            product.id
                          );
                        }}
                        className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white hover:bg-[#321B2D]"
                      >
                        Kapak Yap
                      </button>
                    )}
                    {gallery.length > 1 && (
                      <button
                        type="button"
                        onClick={async () => {
                          const next = structuredClone(store);
                          const filteredGal = gallery.filter((_, i) => i !== gIdx);
                          next.products[originalIndex].gallery = filteredGal;
                          if (isCover && filteredGal[0]) {
                            next.products[originalIndex].image = filteredGal[0];
                          }
                          await commitStore(next, "✓ Fotoğraf silindi", product.id);
                        }}
                        aria-label="Fotoğrafı sil"
                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-rose-700 text-xs font-bold text-white"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-[#5F505C]">
                Ürün Kodu (SKU)
              </label>
              <input
                type="text"
                value={sku}
                onFocus={() => {
                  isInputFocusedRef.current = true;
                }}
                onChange={(e) => setSku(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    void saveProductDraft();
                    e.currentTarget.blur();
                  }
                }}
                className="mt-1 h-10 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3 text-sm focus:border-[#321B2D] focus:outline-none uppercase"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#5F505C]">
                Ürün Açıklaması
              </label>
              <input
                type="text"
                value={description}
                onFocus={() => {
                  isInputFocusedRef.current = true;
                }}
                onChange={(e) => setDescription(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    void saveProductDraft();
                    e.currentTarget.blur();
                  }
                }}
                placeholder="Ürün açıklaması…"
                className="mt-1 h-10 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3 text-sm focus:border-[#321B2D] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <label className="flex items-center gap-2 text-xs font-semibold text-[#241722]">
              <input
                type="checkbox"
                checked={Boolean(product.isNewArrival)}
                onChange={async (e) => {
                  const next = structuredClone(store);
                  next.products[originalIndex].isNewArrival = e.target.checked;
                  await commitStore(
                    next,
                    e.target.checked
                      ? "✓ Yeni Gelenler vitrinine eklendi"
                      : "✓ Yeni Gelenler vitrininden çıkarıldı",
                    product.id
                  );
                }}
                className="h-4 w-4 accent-[#321B2D]"
              />
              <span>Ana Sayfa &ldquo;Yeni Gelenler&rdquo; vitrininde göster</span>
            </label>

            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-rose-700">Silinsin mi?</span>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmDelete(false);
                    onDeleteProduct(originalIndex);
                  }}
                  className="rounded-lg bg-rose-700 px-3.5 py-1.5 text-xs font-semibold text-white"
                >
                  Evet, Sil
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-lg border border-[#DDD3C6] px-3 py-1.5 text-xs font-semibold"
                >
                  Vazgeç
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="text-xs font-semibold text-rose-700 underline hover:text-rose-900"
              >
                Ürünü Sil
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
