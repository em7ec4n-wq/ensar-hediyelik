"use client";

import React, { useState, useMemo } from "react";
import type { Product, StoreData, Category } from "@/types/store";
import { ChevronDownIcon, CloseIcon } from "@/components/Icons";

interface EditProductModalProps {
  product: Product;
  store: StoreData;
  isOpen: boolean;
  onClose: () => void;
  commitStore: (
    next: StoreData,
    msg?: string,
    cardId?: string,
    immediate?: boolean
  ) => Promise<void>;
  showNotice: (msg: string) => void;
  handleFilesUpload: (
    files: FileList | null,
    targetKey: string,
    onUrlsReady: (urls: string[]) => void
  ) => Promise<void>;
  uploadingId: string;
}

function slugifyTR(input: string): string {
  return String(input || "")
    .replace(/Ğ/g, "g")
    .replace(/ğ/g, "g")
    .replace(/Ü/g, "u")
    .replace(/ü/g, "u")
    .replace(/Ş/g, "s")
    .replace(/ş/g, "s")
    .replace(/İ/g, "i")
    .replace(/I/g, "i")
    .replace(/ı/g, "i")
    .replace(/Ö/g, "o")
    .replace(/ö/g, "o")
    .replace(/Ç/g, "c")
    .replace(/ç/g, "c")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function EditProductModal({
  product,
  store,
  isOpen,
  onClose,
  commitStore,
  showNotice,
  handleFilesUpload,
  uploadingId,
}: EditProductModalProps) {
  // Determine initial main and sub category
  const initialCat = store.categories.find((c) => c.slug === product.categorySlug);
  const initialMainSlug = initialCat?.parentSlug || product.categorySlug || "kar-kureleri";
  const initialSubSlug = initialCat?.parentSlug ? product.categorySlug : "";

  const [name, setName] = useState(product.name);
  const [priceStr, setPriceStr] = useState(
    product.price !== null && product.price !== undefined ? String(product.price) : ""
  );
  const [sku, setSku] = useState(product.sku);
  const [description, setDescription] = useState(product.description || "");
  const [mainCatSlug, setMainCatSlug] = useState(initialMainSlug);
  const [subCatSlug, setSubCatSlug] = useState(initialSubSlug);
  const [isNewArrival, setIsNewArrival] = useState(Boolean(product.isNewArrival));
  const [published, setPublished] = useState(Boolean(product.published));

  const [gallery, setGallery] = useState<string[]>(
    product.gallery?.length ? product.gallery : [product.image]
  );
  const [coverImage, setCoverImage] = useState<string>(product.image);

  // Inline new subcategory state
  const [isAddingSubcat, setIsAddingSubcat] = useState(false);
  const [newSubcatName, setNewSubcatName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Group categories
  const mainCategories = useMemo(
    () => store.categories.filter((c) => !c.parentSlug),
    [store.categories]
  );

  const availableSubcats = useMemo(
    () => store.categories.filter((c) => c.parentSlug === mainCatSlug),
    [store.categories, mainCatSlug]
  );

  if (!isOpen) return null;

  const handleMainCatChange = (newMain: string) => {
    setMainCatSlug(newMain);
    // If the new main category has subcategories, we don't force one immediately; user can pick
    setSubCatSlug("");
  };

  const handleCreateSubcategoryInline = async () => {
    const trimmed = newSubcatName.trim();
    if (!trimmed) {
      showNotice("Lütfen alt kategori adını yazın.");
      return;
    }

    const baseSlug = slugifyTR(trimmed) || `alt-kat-${Date.now()}`;
    const existingSlugs = new Set(store.categories.map((c) => c.slug));
    let slug = baseSlug;
    let counter = 2;
    while (existingSlugs.has(slug)) {
      slug = `${baseSlug}-${counter++}`;
    }

    const parentCat = store.categories.find((c) => c.slug === mainCatSlug);

    const newCategory: Category = {
      slug,
      name: trimmed,
      parentSlug: mainCatSlug,
      image: parentCat?.image || "/ensar-web/gorseller/kategori-cam-kure.webp",
      imageAlt: `${trimmed} Kategorisi`,
      description: `${parentCat?.name || "Hediyelik"} alt kategorisi: ${trimmed}`,
      showOnHome: false,
    };

    const next = structuredClone(store);
    next.categories.push(newCategory);
    await commitStore(next, `✓ "${trimmed}" alt kategorisi oluşturuldu`, undefined, true);

    setSubCatSlug(slug);
    setNewSubcatName("");
    setIsAddingSubcat(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      showNotice("Lütfen ürün adını boş bırakmayın.");
      return;
    }

    const trimmedSku =
      sku.trim().toUpperCase() ||
      product.sku ||
      `ENS-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const parsedPrice =
      priceStr.trim() === "" ? null : Number(priceStr.replace(",", "."));
    const finalPrice =
      parsedPrice !== null && !isNaN(parsedPrice) ? Math.max(0, parsedPrice) : null;

    const finalCatSlug = subCatSlug || mainCatSlug;
    const catObj = store.categories.find((c) => c.slug === finalCatSlug);
    const extraCats = catObj?.parentSlug ? [catObj.parentSlug] : [];

    const finalCover = coverImage || gallery[0] || product.image;
    const finalGallery = gallery.length > 0 ? gallery : [finalCover];

    const next = structuredClone(store);
    const target = next.products.find((p) => p.id === product.id);
    if (!target) return;

    target.name = trimmedName;
    target.shortName = trimmedName;
    target.sku = trimmedSku;
    target.price = finalPrice;
    target.categorySlug = finalCatSlug;
    target.extraCategorySlugs = extraCats;
    target.description = description.trim();
    target.image = finalCover;
    target.gallery = finalGallery;
    target.imageAlt = `${trimmedName} (${trimmedSku})`;
    target.isNewArrival = isNewArrival;
    target.published = published;

    setIsSaving(true);
    await commitStore(next, `✓ "${trimmedName}" başarıyla güncellendi!`, product.id, true);
    setIsSaving(false);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-5 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="ensar-card flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden bg-[#F7F3EB] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5DCD0] bg-white px-5 py-4">
          <div>
            <h2 className="font-heading text-lg font-bold text-[#241722] sm:text-xl">
              ✏️ Ürünü Düzenle: {product.name}
            </h2>
            <p className="mt-0.5 text-xs text-[#5F505C]">
              Ürün adı, fiyatı, kategorisi, alt kategorisi ve fotoğraflarını buradan kolayca güncelleyin.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-[#241722] hover:bg-stone-200"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Photos Management */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#241722]">
                1. Ürün Fotoğrafları ({gallery.length} adet)
              </label>
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#321B2D] px-3 py-1.5 text-xs font-semibold text-[#F7F3EB] hover:bg-[#44253D]">
                <span>
                  {uploadingId === `modal-${product.id}` ? "Yükleniyor…" : "📷 Fotoğraf Ekle"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) =>
                    handleFilesUpload(e.target.files, `modal-${product.id}`, (urls) => {
                      setGallery((prev) => [...prev, ...urls]);
                      if (!coverImage && urls[0]) setCoverImage(urls[0]);
                    })
                  }
                />
              </label>
            </div>

            <div className="mt-2.5 flex flex-wrap gap-3">
              {gallery.map((imgUrl, idx) => {
                const isCover = imgUrl === coverImage;
                return (
                  <div
                    key={idx}
                    className={`relative h-24 w-24 overflow-hidden rounded-xl border-2 bg-white ${
                      isCover ? "border-[#321B2D] ring-2 ring-[#321B2D]/20" : "border-[#DDD3C6]"
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`Fotoğraf ${idx + 1}`}
                      className="h-full w-full object-contain"
                    />
                    {isCover ? (
                      <span className="absolute bottom-1 left-1 rounded bg-[#321B2D] px-1.5 py-0.5 text-[10px] font-bold text-white">
                        ★ Kapak
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setCoverImage(imgUrl)}
                        className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white hover:bg-[#321B2D]"
                      >
                        Kapak Yap
                      </button>
                    )}
                    {gallery.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const filtered = gallery.filter((_, i) => i !== idx);
                          setGallery(filtered);
                          if (isCover && filtered[0]) {
                            setCoverImage(filtered[0]);
                          }
                        }}
                        aria-label="Fotoğrafı sil"
                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-rose-700 text-xs font-bold text-white shadow-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Product Name */}
          <div>
            <label className="block text-xs font-bold text-[#241722]">
              2. Ürün Adı *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: Balina Kar Küresi Işıklı Müzikli"
              className="mt-1 h-11 w-full rounded-xl border border-[#DDD3C6] bg-white px-3.5 text-sm font-semibold text-[#241722] focus:border-[#321B2D] focus:outline-none"
            />
          </div>

          {/* Price & SKU */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-[#241722]">
                3. Satış Fiyatı (TL)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={priceStr}
                onChange={(e) => setPriceStr(e.target.value)}
                placeholder="Örn: 450"
                className="mt-1 h-11 w-full rounded-xl border-2 border-[#321B2D]/40 bg-white px-3.5 text-base font-bold text-[#321B2D] focus:border-[#321B2D] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#241722]">
                4. Ürün Kodu (SKU)
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Örn: ENS-102"
                className="mt-1 h-11 w-full rounded-xl border border-[#DDD3C6] bg-white px-3.5 text-sm font-semibold text-[#241722] focus:border-[#321B2D] focus:outline-none uppercase"
              />
            </div>
          </div>

          {/* Category & Subcategory Selection — Crystal Clear 2-Level Picker */}
          <div className="rounded-2xl border-2 border-[#321B2D]/15 bg-white p-4 space-y-3.5">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#321B2D] text-xs font-bold text-white">
                5
              </span>
              <span className="text-xs font-bold text-[#241722] uppercase tracking-wide">
                Kategori ve Alt Kategori Seçimi
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Ana Kategori */}
              <div>
                <label className="block text-[11px] font-bold text-[#6F606C]">
                  Ana Kategori *
                </label>
                <div className="relative mt-1">
                  <select
                    value={mainCatSlug}
                    onChange={(e) => handleMainCatChange(e.target.value)}
                    className="ensar-select h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] pl-3 pr-8 text-xs font-semibold text-[#241722] focus:border-[#321B2D] focus:outline-none"
                  >
                    {mainCategories.map((cat) => (
                      <option key={cat.slug} value={cat.slug}>
                        📁 {cat.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon
                    size={14}
                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5F505C]"
                  />
                </div>
              </div>

              {/* Alt Kategori */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-[#6F606C]">
                    Alt Kategori (İsteğe Bağlı)
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddingSubcat((v) => !v)}
                    className="text-[11px] font-bold text-[#321B2D] hover:underline"
                  >
                    {isAddingSubcat ? "✕ Vazgeç" : "＋ Yeni Alt Kategori"}
                  </button>
                </div>
                <div className="relative mt-1">
                  <select
                    value={subCatSlug}
                    onChange={(e) => setSubCatSlug(e.target.value)}
                    className="ensar-select h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] pl-3 pr-8 text-xs font-semibold text-[#241722] focus:border-[#321B2D] focus:outline-none"
                  >
                    <option value="">
                      — Alt Kategori Yok (Sadece {mainCategories.find((c) => c.slug === mainCatSlug)?.name || "Ana Kategori"}&apos;de kalsın) —
                    </option>
                    {availableSubcats.map((sub) => (
                      <option key={sub.slug} value={sub.slug}>
                        ↳ {sub.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon
                    size={14}
                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5F505C]"
                  />
                </div>
              </div>
            </div>

            {/* Inline Subcategory Creator */}
            {isAddingSubcat && (
              <div className="mt-2 rounded-xl border border-dashed border-[#321B2D] bg-[#F7F3EB] p-3 flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="text"
                  value={newSubcatName}
                  onChange={(e) => setNewSubcatName(e.target.value)}
                  placeholder={`"${mainCategories.find((c) => c.slug === mainCatSlug)?.name || "Bu kategori"}" altına eklenecek yeni alt kategori adı…`}
                  className="h-10 flex-1 rounded-xl border border-[#DDD3C6] bg-white px-3 text-xs font-medium text-[#241722] focus:border-[#321B2D] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCreateSubcategoryInline}
                  className="h-10 w-full sm:w-auto rounded-xl bg-[#321B2D] px-4 text-xs font-bold text-white hover:bg-[#44253D]"
                >
                  ✓ Alt Kategoriyi Ekle ve Seç
                </button>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-[#241722]">
              6. Ürün Açıklaması
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ürün ebatları, materyali veya özellikleri hakkında bilgi…"
              className="mt-1 w-full rounded-xl border border-[#DDD3C6] bg-white p-3 text-xs font-medium text-[#241722] focus:border-[#321B2D] focus:outline-none"
            />
          </div>

          {/* Settings: New Arrival & Status */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#E5DCD0] pt-4">
            <label className="flex items-center gap-2 text-xs font-semibold text-[#241722]">
              <input
                type="checkbox"
                checked={isNewArrival}
                onChange={(e) => setIsNewArrival(e.target.checked)}
                className="h-4 w-4 accent-[#321B2D]"
              />
              <span>Ana Sayfa &ldquo;Yeni Gelenler&rdquo; vitrininde göster</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold text-[#241722]">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="h-4 w-4 accent-[#321B2D]"
              />
              <span>● Ürün Sitede Satışta (Gizlemek için işareti kaldırın)</span>
            </label>
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-end gap-2.5 border-t border-[#E5DCD0] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] rounded-xl border border-[#DDD3C6] bg-white px-5 text-xs font-semibold text-[#5F505C] hover:bg-stone-100"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="min-h-[44px] rounded-xl bg-[#321B2D] px-7 text-xs font-bold text-[#F7F3EB] shadow-md transition-all hover:bg-[#44253D] disabled:opacity-50"
            >
              {isSaving ? "Kaydediliyor…" : "✓ Değişiklikleri Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
