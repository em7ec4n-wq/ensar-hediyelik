"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import type { Category, Order, Product, StoreData } from "@/types/store";
import { formatPriceTRY, buildWhatsAppGeneralUrl } from "@/lib/format";
import { uploadLosslessImage } from "@/lib/client-store";
import { useLiveStore } from "@/components/StoreProvider";
import { getProductHref } from "@/components/ProductCard";
import { getCategoryHref } from "@/components/CategoriesClient";
import { SearchIcon, WhatsAppIcon, ChevronDownIcon } from "@/components/Icons";
import { AdminProductCard } from "@/components/admin/AdminProductCard";
import { AdminCategoryCard } from "@/components/admin/AdminCategoryCard";
import { StoreSettingsForm } from "@/components/admin/StoreSettingsForm";
import { CategoryAssignModal } from "@/components/admin/CategoryAssignModal";
import { BulkCategoryModal } from "@/components/admin/BulkCategoryModal";
import { HeroSlideCard } from "@/components/admin/HeroSlideCard";

type TabKey = "urunler" | "kategoriler" | "vitrin" | "siparisler" | "magaza";

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

export default function AdminPanelPage() {
  const { store, ready, updateStore, resetStore } = useLiveStore();
  const [activeTab, setActiveTab] = useState<TabKey>("urunler");
  const [toast, setToast] = useState<string>("");
  const [uploadingId, setUploadingId] = useState<string>("");
  const [savedCardId, setSavedCardId] = useState<string>("");

  // Product list filters
  const [prodSearch, setProdSearch] = useState("");
  const [prodCatFilter, setProdCatFilter] = useState("all");
  const [prodStatusFilter, setProdStatusFilter] = useState<
    "all" | "published" | "hidden"
  >("all");
  const [visibleLimit, setVisibleLimit] = useState(24);
  const [expandedProductId, setExpandedProductId] = useState<string | null>(
    null
  );

  // Modals state
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [showBulkPrice, setShowBulkPrice] = useState(false);
  const [showBulkCategory, setShowBulkCategory] = useState(false);
  const [assignModalCatSlug, setAssignModalCatSlug] = useState<string | null>(null);

  // New Product Modal fields
  const [newProdName, setNewProdName] = useState("");
  const [newProdSku, setNewProdSku] = useState("");
  const [newProdPrice, setNewProdPrice] = useState("");
  const [newProdCat, setNewProdCat] = useState("kar-kureleri");
  const [newProdDesc, setNewProdDesc] = useState("");
  const [newProdGallery, setNewProdGallery] = useState<string[]>([]);
  const [newProdNewArrival, setNewProdNewArrival] = useState(false);

  // Bulk price state
  const [bulkCat, setBulkCat] = useState("all");
  const [bulkMode, setBulkMode] = useState<"percent" | "add">("percent");
  const [bulkValue, setBulkValue] = useState("10");

  // New Category state
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatParent, setNewCatParent] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [newCatImage, setNewCatImage] = useState("");
  const [newCatHome, setNewCatHome] = useState(true);

  // Reset confirmation state
  const [confirmReset, setConfirmReset] = useState(false);

  const showNotice = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((prev) => (prev === msg ? "" : prev));
    }, 3000);
  };

  const commitStore = async (
    next: StoreData,
    message = "✓ Değişiklik kaydedildi",
    cardId?: string
  ) => {
    await updateStore(next);
    if (cardId) {
      setSavedCardId(cardId);
      setTimeout(() => {
        setSavedCardId((prev) => (prev === cardId ? "" : prev));
      }, 2200);
    }
    showNotice(message);
  };

  const filteredProducts = useMemo(() => {
    const q = prodSearch.trim().toLocaleLowerCase("tr-TR");
    const subSlugsOfFilter = new Set(
      store.categories
        .filter((c) => c.parentSlug === prodCatFilter)
        .map((c) => c.slug)
    );

    return store.products
      .map((product, originalIndex) => ({ product, originalIndex }))
      .filter(({ product }) => {
        if (prodStatusFilter === "published" && !product.published)
          return false;
        if (prodStatusFilter === "hidden" && product.published) return false;
        if (prodCatFilter !== "all") {
          const matchesCat =
            product.categorySlug === prodCatFilter ||
            product.extraCategorySlugs?.includes(prodCatFilter) ||
            subSlugsOfFilter.has(product.categorySlug);
          if (!matchesCat) return false;
        }
        if (q) {
          const hay = `${product.sku} ${product.name} ${product.shortName || ""} ${product.kaynakUrunAdi || ""}`.toLocaleLowerCase(
            "tr-TR"
          );
          if (!hay.includes(q)) return false;
        }
        return true;
      });
  }, [store, prodSearch, prodCatFilter, prodStatusFilter]);

  const handleFilesUpload = async (
    files: FileList | null,
    targetKey: string,
    onUrlsReady: (urls: string[]) => void
  ) => {
    if (!files || files.length === 0) return;
    setUploadingId(targetKey);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadLosslessImage(file);
        urls.push(url);
      }
      onUrlsReady(urls);
    } catch {
      showNotice("Fotoğraf yüklenemedi. Lütfen tekrar deneyin.");
    } finally {
      setUploadingId("");
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newProdName.trim();
    if (!trimmedName) {
      showNotice("Lütfen ürün adını yazın.");
      return;
    }
    const sku =
      newProdSku.trim().toUpperCase() ||
      `ENS-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const baseSlug = slugifyTR(trimmedName) || `urun-${Date.now()}`;
    const existingSlugs = new Set(store.products.map((p) => p.slug));
    let slug = baseSlug;
    let c = 2;
    while (existingSlugs.has(slug)) {
      slug = `${baseSlug}-${c++}`;
    }

    const cover =
      newProdGallery[0] ||
      "/ensar-web/gorseller/hero-astronot-cam-kure.webp";
    const gallery = newProdGallery.length > 0 ? newProdGallery : [cover];
    const selectedCatObj = store.categories.find(
      (cat) => cat.slug === newProdCat
    );
    const extraCats = selectedCatObj?.parentSlug
      ? [selectedCatObj.parentSlug]
      : [];

    const created: Product = {
      id: `custom-${Date.now()}`,
      sku,
      slug,
      name: trimmedName,
      shortName: trimmedName,
      categorySlug: newProdCat,
      extraCategorySlugs: extraCats,
      description: newProdDesc.trim(),
      price: newProdPrice !== "" ? Number(newProdPrice) : 0,
      stock: 99,
      published: true,
      image: cover,
      gallery,
      imageAlt: `${trimmedName} (${sku})`,
      isConceptImage: false,
      isNewArrival: newProdNewArrival,
      occasions: ["Hediye"],
      giftTypes: [selectedCatObj?.name || "Hediyelik"],
    };

    const next = structuredClone(store);
    next.products.unshift(created);
    await commitStore(next, `✓ "${trimmedName}" ürünü eklendi`);

    setNewProdName("");
    setNewProdSku("");
    setNewProdPrice("");
    setNewProdDesc("");
    setNewProdGallery([]);
    setNewProdNewArrival(false);
    setShowNewProduct(false);
  };

  const handleApplyBulkPrice = async () => {
    const num = Number(bulkValue);
    if (isNaN(num) || num === 0) {
      showNotice("Lütfen geçerli bir değer girin.");
      return;
    }

    const next = structuredClone(store);
    const subSlugs = new Set(
      store.categories
        .filter((c) => c.parentSlug === bulkCat)
        .map((c) => c.slug)
    );
    let updatedCount = 0;

    for (const p of next.products) {
      const inCat =
        bulkCat === "all" ||
        p.categorySlug === bulkCat ||
        p.extraCategorySlugs?.includes(bulkCat) ||
        subSlugs.has(p.categorySlug);
      if (!inCat || p.price === null) continue;

      if (bulkMode === "percent") {
        p.price = Math.max(1, Math.round(p.price * (1 + num / 100)));
      } else {
        p.price = Math.max(1, Math.round(p.price + num));
      }
      updatedCount++;
    }

    await commitStore(
      next,
      `✓ ${updatedCount} ürünün fiyatı güncellendi`
    );
    setShowBulkPrice(false);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) {
      showNotice("Lütfen kategori adını yazın.");
      return;
    }
    const baseSlug = slugifyTR(trimmed) || `kategori-${Date.now()}`;
    const existing = new Set(store.categories.map((c) => c.slug));
    let slug = baseSlug;
    let i = 2;
    while (existing.has(slug)) {
      slug = `${baseSlug}-${i++}`;
    }

    const created: Category = {
      slug,
      name: trimmed,
      description:
        newCatDesc.trim() || `${trimmed} koleksiyonundaki ürünler.`,
      image: newCatImage || "/ensar-web/gorseller/kategori-cam-kure.webp",
      imageAlt: trimmed,
      showOnHome: newCatHome,
      homeOrder: newCatHome ? 5 : undefined,
      parentSlug: newCatParent || undefined,
      isConceptImage: false,
    };

    const next = structuredClone(store);
    next.categories.push(created);
    await commitStore(next, `✓ "${trimmed}" kategorisi oluşturuldu`);

    setNewCatName("");
    setNewCatParent("");
    setNewCatDesc("");
    setNewCatImage("");
    setNewCatHome(false);
    setShowNewCategory(false);
  };

  const handleDeleteProduct = async (index: number) => {
    const next = structuredClone(store);
    const deleted = next.products.splice(index, 1)[0];
    await commitStore(next, `✓ "${deleted?.name || "Ürün"}" silindi`);
  };

  const handleDeleteCategory = async (catSlug: string) => {
    const next = structuredClone(store);
    const cat = next.categories.find((c) => c.slug === catSlug);
    const fallbackSlug = cat?.parentSlug || "hediyelik-urunler";

    next.categories = next.categories.filter((c) => c.slug !== catSlug);
    for (const c of next.categories) {
      if (c.parentSlug === catSlug) {
        c.parentSlug = undefined;
      }
    }
    for (const p of next.products) {
      if (p.categorySlug === catSlug) {
        p.categorySlug = fallbackSlug;
      }
      if (Array.isArray(p.extraCategorySlugs)) {
        p.extraCategorySlugs = p.extraCategorySlugs.filter((s) => s !== catSlug);
      }
    }
    await commitStore(next, `✓ "${cat?.name || catSlug}" kategorisi silindi`);
  };

  const handleExportBackup = () => {
    const blob = new Blob([JSON.stringify(store, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ensar-hediyelik-yedek-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotice("✓ Mağaza yedeği indirildi");
  };

  const handleImportBackup = (files: FileList | null) => {
    if (!files || !files[0]) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as StoreData;
        if (!parsed || !Array.isArray(parsed.products)) {
          showNotice("Geçersiz yedek dosyası.");
          return;
        }
        await commitStore(parsed, "✓ Yedek dosyası yüklendi!");
      } catch {
        showNotice("Yedek dosyası okunamadı.");
      }
    };
    reader.readAsText(files[0]);
  };

  // Group categories for dropdowns
  const mainCategories = store.categories.filter((c) => !c.parentSlug);
  const karKuresiSubcats = store.categories.filter((c) => c.parentSlug === "kar-kureleri");
  const otherSubcats = store.categories.filter(
    (c) => Boolean(c.parentSlug) && c.parentSlug !== "kar-kureleri"
  );

  return (
    <div className="ensar-container py-6 lg:py-10">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-[#321B2D] px-5 py-3 text-sm font-semibold text-[#F7F3EB] shadow-2xl transition-all">
          <span>{toast}</span>
        </div>
      )}

      {/* Admin Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading text-2xl font-bold text-[#241722] sm:text-3xl">
              Yönetim Paneli
            </h1>
            <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-800">
              Canlı Bulut Senkronizasyonu Aktif
            </span>
          </div>
          <p className="mt-1 text-xs text-[#5F505C]">
            Ürün fiyatları, kategoriler ve siparişler tüm cihazlarda eşzamanlı güncellenir.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="inline-flex min-h-[42px] items-center rounded-xl border border-[#DDD3C6] bg-white px-4 text-xs font-semibold text-[#241722] hover:bg-stone-50"
          >
            ← Mağazaya Dön
          </Link>
          <button
            type="button"
            onClick={handleExportBackup}
            className="inline-flex min-h-[42px] items-center rounded-xl border border-[#321B2D] bg-[#FFFDF8] px-4 text-xs font-semibold text-[#321B2D] hover:bg-[#321B2D] hover:text-[#F7F3EB]"
          >
            📥 Yedeği İndir
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="mt-6 flex flex-wrap gap-2 border-b border-[#E5DCD0] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("urunler")}
          className={`min-h-[44px] rounded-xl px-5 text-sm font-bold transition-all ${
            activeTab === "urunler"
              ? "bg-[#321B2D] text-[#F7F3EB] shadow"
              : "bg-white text-[#5F505C] hover:bg-stone-100"
          }`}
        >
          📦 Ürünler ({store.products.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("kategoriler")}
          className={`min-h-[44px] rounded-xl px-5 text-sm font-bold transition-all ${
            activeTab === "kategoriler"
              ? "bg-[#321B2D] text-[#F7F3EB] shadow"
              : "bg-white text-[#5F505C] hover:bg-stone-100"
          }`}
        >
          📂 Kategoriler ({store.categories.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("vitrin")}
          className={`min-h-[44px] rounded-xl px-5 text-sm font-bold transition-all ${
            activeTab === "vitrin"
              ? "bg-[#321B2D] text-[#F7F3EB] shadow"
              : "bg-white text-[#5F505C] hover:bg-stone-100"
          }`}
        >
          🖼️ Ana Sayfa Vitrin
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("siparisler")}
          className={`min-h-[44px] rounded-xl px-5 text-sm font-bold transition-all ${
            activeTab === "siparisler"
              ? "bg-[#321B2D] text-[#F7F3EB] shadow"
              : "bg-white text-[#5F505C] hover:bg-stone-100"
          }`}
        >
          🛍️ Siparişler ({store.orders.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("magaza")}
          className={`min-h-[44px] rounded-xl px-5 text-sm font-bold transition-all ${
            activeTab === "magaza"
              ? "bg-[#321B2D] text-[#F7F3EB] shadow"
              : "bg-white text-[#5F505C] hover:bg-stone-100"
          }`}
        >
          ⚙️ Mağaza Bilgileri
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: ÜRÜNLER                                            */}
      {/* ========================================================= */}
      {activeTab === "urunler" && (
        <div className="mt-5 space-y-4">
          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowNewProduct(true)}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#321B2D] px-5 text-xs font-bold text-[#F7F3EB] shadow hover:bg-[#44253D]"
              >
                <span>＋ Yeni Ürün Ekle</span>
              </button>

              <button
                type="button"
                onClick={() => setShowBulkPrice((v) => !v)}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[#321B2D] bg-white px-4 text-xs font-semibold text-[#321B2D] hover:bg-[#E9D9F1]"
              >
                <span>💰 Toplu Fiyat Güncelle</span>
              </button>

              <button
                type="button"
                onClick={() => setShowBulkCategory(true)}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[#321B2D] bg-[#FFFDF8] px-4 text-xs font-semibold text-[#321B2D] hover:bg-[#E9D9F1]"
              >
                <span>📂 Toplu Kategori Değiştir</span>
              </button>
            </div>

            <span className="text-xs font-semibold text-[#5F505C]">
              Toplam <strong>{filteredProducts.length}</strong> ürün listeleniyor
            </span>
          </div>

          {/* Bulk Price Dropdown Panel */}
          {showBulkPrice && (
            <div className="ensar-card p-4 space-y-3 bg-[#FFFDF8] border-2 border-[#321B2D]/20">
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-sm font-bold text-[#241722]">
                  Toplu Fiyat Güncelleme Aracı
                </h3>
                <button
                  type="button"
                  onClick={() => setShowBulkPrice(false)}
                  className="text-xs text-[#5F505C] hover:underline"
                >
                  Kapat ✕
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#6F606C]">
                    Hangi Kategori?
                  </label>
                  <select
                    value={bulkCat}
                    onChange={(e) => setBulkCat(e.target.value)}
                    className="ensar-select mt-1 h-10 w-full rounded-xl border border-[#DDD3C6] bg-white px-3 text-xs"
                  >
                    <option value="all">Tüm Kategoriler</option>
                    {store.categories.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#6F606C]">
                    İşlem Türü
                  </label>
                  <select
                    value={bulkMode}
                    onChange={(e) =>
                      setBulkMode(e.target.value as "percent" | "add")
                    }
                    className="ensar-select mt-1 h-10 w-full rounded-xl border border-[#DDD3C6] bg-white px-3 text-xs"
                  >
                    <option value="percent">Yüzde (%) Artır / Azalt</option>
                    <option value="add">Sabit Tutar (TL) Ekle / Çıkar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#6F606C]">
                    Değer (İndirim için eksi yazın, örn: -10)
                  </label>
                  <input
                    value={bulkValue}
                    onChange={(e) => setBulkValue(e.target.value)}
                    placeholder="Örn: 15 veya -10"
                    className="mt-1 h-10 w-full rounded-xl border border-[#DDD3C6] bg-white px-3 text-xs font-bold"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleApplyBulkPrice}
                    className="h-10 w-full rounded-xl bg-[#321B2D] px-4 text-xs font-bold text-[#F7F3EB] hover:bg-[#44253D]"
                  >
                    ✓ Fiyatları Uygula
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Filters Bar */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="relative">
              <SearchIcon
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#5F505C]"
              />
              <input
                value={prodSearch}
                onChange={(e) => setProdSearch(e.target.value)}
                placeholder="Ürün adı, SKU veya kod ara…"
                className="h-11 w-full rounded-xl border border-[#DDD3C6] bg-white pl-9 pr-3 text-xs focus:border-[#321B2D] focus:outline-none"
              />
            </div>

            <div>
              <select
                value={prodCatFilter}
                onChange={(e) => setProdCatFilter(e.target.value)}
                className="ensar-select h-11 w-full rounded-xl border border-[#DDD3C6] bg-white px-3 text-xs focus:border-[#321B2D] focus:outline-none font-medium"
              >
                <option value="all">Tüm Kategoriler ({store.products.length})</option>
                <optgroup label="─── ANA KATEGORİLER ───">
                  {mainCategories.map((c) => {
                    const count = store.products.filter(
                      (p) =>
                        p.categorySlug === c.slug ||
                        p.extraCategorySlugs?.includes(c.slug)
                    ).length;
                    return (
                      <option key={c.slug} value={c.slug}>
                        📁 {c.name} ({count})
                      </option>
                    );
                  })}
                </optgroup>
                {karKuresiSubcats.length > 0 && (
                  <optgroup label="─── KAR KÜRELERİ ALT KATEGORİLERİ ───">
                    {karKuresiSubcats.map((c) => {
                      const count = store.products.filter(
                        (p) => p.categorySlug === c.slug
                      ).length;
                      return (
                        <option key={c.slug} value={c.slug}>
                          ↳ Kar Küresi: {c.name} ({count})
                        </option>
                      );
                    })}
                  </optgroup>
                )}
                {otherSubcats.length > 0 && (
                  <optgroup label="─── DİĞER ALT KATEGORİLER ───">
                    {otherSubcats.map((c) => {
                      const count = store.products.filter(
                        (p) => p.categorySlug === c.slug
                      ).length;
                      return (
                        <option key={c.slug} value={c.slug}>
                          ↳ {c.name} ({count})
                        </option>
                      );
                    })}
                  </optgroup>
                )}
              </select>
            </div>

            <div>
              <select
                value={prodStatusFilter}
                onChange={(e) =>
                  setProdStatusFilter(
                    e.target.value as "all" | "published" | "hidden"
                  )
                }
                className="ensar-select h-11 w-full rounded-xl border border-[#DDD3C6] bg-white px-3 text-xs focus:border-[#321B2D] focus:outline-none font-medium"
              >
                <option value="all">Tüm Durumlar (Satışta + Gizli)</option>
                <option value="published">Sadece Satışta Olanlar</option>
                <option value="hidden">Sadece Gizli Olanlar</option>
              </select>
            </div>
          </div>

          {/* Active Category Filter Banner with Direct Actions */}
          {prodCatFilter !== "all" && (() => {
            const activeCat = store.categories.find((c) => c.slug === prodCatFilter);
            const parentCat = activeCat?.parentSlug
              ? store.categories.find((p) => p.slug === activeCat.parentSlug)
              : null;
            return (
              <div className="ensar-card flex flex-col gap-3.5 border-2 border-[#321B2D] bg-[#FFFDF8] p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#321B2D] text-lg text-white shadow-xs">
                    {parentCat ? "↳" : "📁"}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-heading text-base font-bold text-[#321B2D]">
                        {activeCat?.name || prodCatFilter}
                      </span>
                      {parentCat && (
                        <span className="rounded-md bg-[#E9D9F1] px-2 py-0.5 text-[11px] font-bold text-[#321B2D]">
                          ↳ {parentCat.name} Alt Kategorisi
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#5F505C]">
                      Şu an bu kategorideki <strong>{filteredProducts.length}</strong> ürün listeleniyor.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewProdCat(prodCatFilter);
                      setShowNewProduct(true);
                    }}
                    className="rounded-xl bg-[#321B2D] px-3.5 py-2 text-xs font-bold text-[#F7F3EB] shadow hover:bg-[#44253D]"
                  >
                    ＋ Bu Kategoriye Yeni Ürün Ekle
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignModalCatSlug(prodCatFilter)}
                    className="rounded-xl border border-[#321B2D] bg-white px-3.5 py-2 text-xs font-bold text-[#321B2D] hover:bg-[#E9D9F1]"
                  >
                    📦 Başka Kategorilerden Ürün Taşı / Ata
                  </button>
                  <button
                    type="button"
                    onClick={() => setProdCatFilter("all")}
                    className="rounded-xl border border-[#DDD3C6] bg-white px-3 py-2 text-xs font-semibold text-[#5F505C] hover:bg-stone-100"
                  >
                    ✕ Filtreyi Kaldır ({store.products.length} Ürün)
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Product Cards List */}
          <div className="space-y-3.5">
            {filteredProducts.length === 0 ? (
              <div className="ensar-card p-10 text-center text-sm text-[#5F505C]">
                Filtreye uygun ürün bulunamadı.
              </div>
            ) : (
              filteredProducts
                .slice(0, visibleLimit)
                .map(({ product, originalIndex }) => (
                  <AdminProductCard
                    key={product.id}
                    product={product}
                    originalIndex={originalIndex}
                    store={store}
                    isExpanded={expandedProductId === product.id}
                    onToggleExpand={() =>
                      setExpandedProductId((prev) =>
                        prev === product.id ? null : product.id
                      )
                    }
                    commitStore={commitStore}
                    showNotice={showNotice}
                    handleFilesUpload={handleFilesUpload}
                    uploadingId={uploadingId}
                    savedCardId={savedCardId}
                    onDeleteProduct={handleDeleteProduct}
                  />
                ))
            )}
          </div>

          {filteredProducts.length > visibleLimit && (
            <div className="pt-3 text-center">
              <button
                type="button"
                onClick={() => setVisibleLimit((v) => v + 48)}
                className="inline-flex min-h-[46px] items-center rounded-xl border border-[#321B2D] bg-[#FFFDF8] px-7 text-sm font-semibold text-[#321B2D] hover:bg-[#321B2D] hover:text-[#F7F3EB]"
              >
                Daha Fazla Ürün Göster ({filteredProducts.length - visibleLimit}{" "}
                ürün kaldı)
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: KATEGORİLER                                        */}
      {/* ========================================================= */}
      {activeTab === "kategoriler" && (
        <div className="mt-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setShowNewCategory((v) => !v)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#321B2D] px-5 text-xs font-bold text-[#F7F3EB] shadow hover:bg-[#44253D]"
            >
              <span>＋ Yeni Kategori Oluştur</span>
            </button>

            <span className="text-xs text-[#5F505C]">
              Toplam <strong>{store.categories.length}</strong> kategori
            </span>
          </div>

          {/* New Category Form Modal / Collapsible */}
          {showNewCategory && (
            <form
              onSubmit={handleCreateCategory}
              className="ensar-card p-5 space-y-4 bg-[#FFFDF8] border-2 border-[#321B2D]/25"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-sm font-bold text-[#241722]">
                  Yeni Kategori Ekle
                </h3>
                <button
                  type="button"
                  onClick={() => setShowNewCategory(false)}
                  className="text-xs text-[#5F505C] hover:underline"
                >
                  Vazgeç ✕
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-bold text-[#241722]">
                    Kategori Adı *
                  </label>
                  <input
                    required
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Örn: Ahşap Hediyelikler"
                    className="mt-1 h-11 w-full rounded-xl border border-[#DDD3C6] bg-white px-3 text-sm focus:border-[#321B2D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#241722]">
                    Üst Kategori (Alt kategoriyse seçin)
                  </label>
                  <div className="relative mt-1">
                    <select
                      value={newCatParent}
                      onChange={(e) => setNewCatParent(e.target.value)}
                      className="ensar-select h-11 w-full rounded-xl border border-[#DDD3C6] bg-white pl-3 pr-9 text-sm focus:border-[#321B2D] focus:outline-none"
                    >
                      <option value="">Ana Kategori (Üst Yok)</option>
                      {store.categories
                        .filter((c) => !c.parentSlug)
                        .map((c) => (
                          <option key={c.slug} value={c.slug}>
                            ↳ {c.name} Altında
                          </option>
                        ))}
                    </select>
                    <ChevronDownIcon
                      size={15}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#5F505C]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#241722]">
                    Kapak Fotoğrafı (Orijinal Kalite)
                  </label>
                  <label className="mt-1 flex h-11 cursor-pointer items-center justify-center rounded-xl bg-[#321B2D] px-4 text-xs font-semibold text-[#F7F3EB] hover:bg-[#44253D]">
                    <span>
                      {newCatImage
                        ? "✓ Fotoğraf Seçildi"
                        : "📷 Fotoğraf Seç"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleFilesUpload(
                          e.target.files,
                          "new-category",
                          (urls) => {
                            if (urls[0]) setNewCatImage(urls[0]);
                          }
                        )
                      }
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#241722]">
                  Kısa Açıklama
                </label>
                <input
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Kategori açıklaması…"
                  className="mt-1 h-11 w-full rounded-xl border border-[#DDD3C6] bg-white px-3 text-sm focus:border-[#321B2D] focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <label className="flex items-center gap-2 text-sm font-medium text-[#241722]">
                  <input
                    type="checkbox"
                    checked={newCatHome}
                    onChange={(e) => setNewCatHome(e.target.checked)}
                    className="h-4 w-4 accent-[#321B2D]"
                  />
                  <span>Ana Sayfada &ldquo;Kategorileri Keşfet&rdquo; vitrininde göster</span>
                </label>

                <button
                  type="submit"
                  className="min-h-[44px] rounded-xl bg-[#321B2D] px-6 text-sm font-semibold text-[#F7F3EB] shadow hover:bg-[#44253D]"
                >
                  ✓ Kategoriyi Kaydet
                </button>
              </div>
            </form>
          )}

          {/* Category Cards Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {store.categories.map((cat, idx) => (
              <AdminCategoryCard
                key={cat.slug}
                cat={cat}
                idx={idx}
                store={store}
                commitStore={commitStore}
                showNotice={showNotice}
                handleFilesUpload={handleFilesUpload}
                onViewCategoryProducts={(slug) => {
                  setProdCatFilter(slug);
                  setActiveTab("urunler");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                onAddProductToCat={(slug) => {
                  setNewProdCat(slug);
                  setProdCatFilter(slug);
                  setShowNewProduct(true);
                  setActiveTab("urunler");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                onAssignExistingToCat={(slug) => {
                  setAssignModalCatSlug(slug);
                }}
                onDeleteCategory={handleDeleteCategory}
              />
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: ANA SAYFA VİTRİN                                    */}
      {/* ========================================================= */}
      {activeTab === "vitrin" && (
        <div className="mt-5 space-y-4">
          <p className="text-sm text-[#5F505C]">
            Ana sayfadaki 3 büyük açılış vitrininin fotoğrafını, başlığını ve
            butonunu buradan kolayca değiştirebilirsiniz.
          </p>
          {store.heroSlides.map((slide, idx) => (
            <HeroSlideCard
              key={slide.id}
              slide={slide}
              idx={idx}
              store={store}
              commitStore={commitStore}
              handleFilesUpload={handleFilesUpload}
            />
          ))}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: SİPARİŞLER                                         */}
      {/* ========================================================= */}
      {activeTab === "siparisler" && (
        <div className="mt-5 space-y-4">
          {store.orders.length === 0 ? (
            <div className="ensar-card p-12 text-center text-sm text-[#5F505C]">
              Henüz siteden oluşturulmuş bir sipariş bulunmuyor.
            </div>
          ) : (
            store.orders.map((order, idx) => (
              <div key={order.id} className="ensar-card space-y-3 p-5 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-[#241722]">
                      Sipariş #{order.id} — {order.customerName}
                    </p>
                    <p className="mt-0.5 text-xs text-[#5F505C]">
                      Tel: {order.customerPhone} · {order.city} ·{" "}
                      {order.address}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={buildWhatsAppGeneralUrl(
                        order.customerPhone,
                        `Merhaba ${order.customerName}, Ensar Hediyelik #${order.id} numaralı siparişiniz hakkında bilgi veriyoruz.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#321B2D] px-3.5 text-xs font-semibold text-[#321B2D]"
                    >
                      <WhatsAppIcon size={15} />
                      <span>Müşteriye Yaz</span>
                    </a>

                    <select
                      value={order.status}
                      onChange={async (e) => {
                        const next = structuredClone(store);
                        next.orders[idx].status = e.target
                          .value as Order["status"];
                        await commitStore(next, "✓ Sipariş durumu güncellendi");
                      }}
                      className="h-10 rounded-xl bg-[#321B2D] px-4 text-xs font-semibold text-[#F7F3EB]"
                    >
                      <option value="Yeni">Yeni</option>
                      <option value="Hazırlanıyor">Hazırlanıyor</option>
                      <option value="Kargolandı">Kargolandı</option>
                      <option value="Teslim Edildi">Teslim Edildi</option>
                      <option value="İptal">İptal</option>
                    </select>
                  </div>
                </div>

                <div className="divide-y divide-[#ECE4D8] border-t border-[#ECE4D8] pt-2">
                  {order.items.map((item, itemIdx) => (
                    <div
                      key={itemIdx}
                      className="flex items-center justify-between py-2 text-xs"
                    >
                      <span>
                        {item.name} × {item.quantity} adet
                      </span>
                      <span className="font-semibold">
                        {formatPriceTRY(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2 text-xs font-bold text-[#321B2D]">
                    <span>Toplam Tutar:</span>
                    <span>{formatPriceTRY(order.total)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: MAĞAZA BİLGİLERİ                                   */}
      {/* ========================================================= */}
      {activeTab === "magaza" && (
        <div className="mt-5 space-y-6">
          <StoreSettingsForm
            settings={store.settings}
            store={store}
            commitStore={commitStore}
            handleFilesUpload={handleFilesUpload}
          />

          {/* Backup & Reset Card */}
          <div className="ensar-card flex flex-wrap items-center justify-between gap-4 p-6">
            <div>
              <h3 className="font-heading text-lg font-medium text-[#241722]">
                Yedekleme ve Sıfırlama
              </h3>
              <p className="mt-0.5 text-xs text-[#5F505C]">
                Tüm ürün ve fiyatlarınızı yedekleyebilir veya başka bir cihaza aktarabilirsiniz.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleExportBackup}
                className="min-h-[42px] rounded-xl bg-[#321B2D] px-5 text-xs font-semibold text-[#F7F3EB]"
              >
                📥 Yedeği İndir (.json)
              </button>

              <label className="inline-flex min-h-[42px] cursor-pointer items-center rounded-xl border border-[#321B2D] bg-[#FFFDF8] px-5 text-xs font-semibold text-[#321B2D]">
                <span>📤 Yedek Yükle</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(e) => handleImportBackup(e.target.files)}
                />
              </label>

              {confirmReset ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      await resetStore();
                      setConfirmReset(false);
                      showNotice("✓ İlk kurulum ayarlarına sıfırlandı");
                    }}
                    className="min-h-[42px] rounded-xl bg-rose-700 px-4 text-xs font-semibold text-white"
                  >
                    Evet, Sıfırla
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="min-h-[42px] rounded-xl border border-[#DDD3C6] px-4 text-xs font-semibold"
                  >
                    Vazgeç
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="min-h-[42px] rounded-xl border border-rose-300 bg-rose-50 px-4 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                >
                  Fabrika Ayarlarına Dön
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: YENİ ÜRÜN EKLE                                      */}
      {/* ========================================================= */}
      {showNewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="ensar-card max-h-[92vh] w-full max-w-xl overflow-y-auto bg-[#F7F3EB] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E5DCD0] pb-3">
              <h2 className="font-heading text-lg font-bold text-[#241722]">
                ＋ Yeni Ürün Ekle
              </h2>
              <button
                type="button"
                onClick={() => setShowNewProduct(false)}
                className="text-xs text-[#5F505C] hover:underline"
              >
                Kapat ✕
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#241722]">
                  1. Ürün Fotoğrafları * (Orijinal Kalite)
                </label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {newProdGallery.map((img, i) => (
                    <div
                      key={i}
                      className="relative h-16 w-16 overflow-hidden rounded-xl border border-[#DDD3C6] bg-white"
                    >
                      <img
                        src={img}
                        alt={`Yüklenen ${i + 1}`}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ))}
                  <label className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#321B2D]/40 bg-white hover:bg-stone-50">
                    <span className="text-xl">📷</span>
                    <span className="text-[10px] font-bold text-[#321B2D]">
                      Fotoğraf
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) =>
                        handleFilesUpload(
                          e.target.files,
                          "new-product",
                          (urls) => {
                            setNewProdGallery((prev) => [...prev, ...urls]);
                          }
                        )
                      }
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#241722]">
                  2. Ürün Adı *
                </label>
                <input
                  required
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="Örn: Işıklı Müzikli Kar Küresi"
                  className="mt-1.5 h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3.5 text-sm focus:border-[#321B2D] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-[#241722]">
                    3. Satış Fiyatı (TL)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    placeholder="Örn: 450"
                    className="mt-1.5 h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3.5 text-sm focus:border-[#321B2D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#241722]">
                    4. Hangi Kategoriye Eklensin? *
                  </label>
                  <div className="relative mt-1.5">
                    <select
                      value={newProdCat}
                      onChange={(e) => setNewProdCat(e.target.value)}
                      className="ensar-select h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] pl-3.5 pr-9 text-sm focus:border-[#321B2D] focus:outline-none"
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
                          {otherSubcats.map((c) => (
                            <option key={c.slug} value={c.slug}>
                              ↳ {c.name}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                    <ChevronDownIcon
                      size={16}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#5F505C]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#241722]">
                    Ürün Kodu (İsteğe Bağlı)
                  </label>
                  <input
                    value={newProdSku}
                    onChange={(e) => setNewProdSku(e.target.value)}
                    placeholder="Örn: ENS-102"
                    className="mt-1.5 h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3.5 text-sm focus:border-[#321B2D] focus:outline-none"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-xs font-semibold text-[#241722]">
                    <input
                      type="checkbox"
                      checked={newProdNewArrival}
                      onChange={(e) => setNewProdNewArrival(e.target.checked)}
                      className="h-4 w-4 accent-[#321B2D]"
                    />
                    <span>Yeni Gelenler vitrininde göster</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#241722]">
                  Ürün Açıklaması
                </label>
                <textarea
                  rows={3}
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  placeholder="Ürün özellikleri, ebatları, materyali…"
                  className="mt-1.5 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] p-3 text-sm focus:border-[#321B2D] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewProduct(false)}
                  className="min-h-[44px] rounded-xl border border-[#DDD3C6] px-5 text-xs font-semibold text-[#5F505C]"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] rounded-xl bg-[#321B2D] px-6 text-xs font-bold text-[#F7F3EB] shadow hover:bg-[#44253D]"
                >
                  ✓ Ürünü Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: TOPLU KATEGORİ DEĞİŞTİR                            */}
      {/* ========================================================= */}
      <BulkCategoryModal
        store={store}
        isOpen={showBulkCategory}
        onClose={() => setShowBulkCategory(false)}
        commitStore={commitStore}
        showNotice={showNotice}
      />

      {/* ========================================================= */}
      {/* MODAL: KATEGORİYE ÜRÜN ATA / TAŞI                         */}
      {/* ========================================================= */}
      {assignModalCatSlug && (
        <CategoryAssignModal
          targetCategorySlug={assignModalCatSlug}
          store={store}
          isOpen={Boolean(assignModalCatSlug)}
          onClose={() => setAssignModalCatSlug(null)}
          commitStore={commitStore}
          showNotice={showNotice}
        />
      )}
    </div>
  );
}
