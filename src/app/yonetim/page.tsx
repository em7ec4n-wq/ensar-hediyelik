"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import type { Category, Order, Product, StoreData } from "@/types/store";
import { formatPriceTRY, buildWhatsAppGeneralUrl } from "@/lib/format";
import { uploadLosslessImage } from "@/lib/client-store";
import { useLiveStore } from "@/components/StoreProvider";
import { getProductHref } from "@/components/ProductCard";
import { getCategoryHref } from "@/components/CategoriesClient";
import { SearchIcon, WhatsAppIcon } from "@/components/Icons";

type TabKey =
  | "urunler"
  | "kategoriler"
  | "vitrin"
  | "siparisler"
  | "magaza";

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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // New Product Modal / Form state
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [newProdName, setNewProdName] = useState("");
  const [newProdSku, setNewProdSku] = useState("");
  const [newProdPrice, setNewProdPrice] = useState("");
  const [newProdCat, setNewProdCat] = useState("yilbasi");
  const [newProdDesc, setNewProdDesc] = useState("");
  const [newProdGallery, setNewProdGallery] = useState<string[]>([]);
  const [newProdNewArrival, setNewProdNewArrival] = useState(false);

  // Bulk price tool state
  const [showBulkPrice, setShowBulkPrice] = useState(false);
  const [bulkCat, setBulkCat] = useState("all");
  const [bulkMode, setBulkMode] = useState<"percent" | "add">("percent");
  const [bulkValue, setBulkValue] = useState("10");

  // New Category form state
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatParent, setNewCatParent] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [newCatImage, setNewCatImage] = useState("");
  const [newCatHome, setNewCatHome] = useState(false);

  // Confirm reset state
  const [confirmReset, setConfirmReset] = useState(false);

  const showNotice = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((prev) => (prev === msg ? "" : prev));
    }, 3500);
  };

  const commitStore = async (next: StoreData, message = "✓ Otomatik kaydedildi") => {
    await updateStore(next);
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

  // Lossless multi-file uploader helper
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
      showNotice(
        `✓ ${urls.length} fotoğraf orijinal kalitede (kayıpsız) yüklendi`
      );
    } catch {
      showNotice("Fotoğraf yüklenirken bir hata oluştu.");
    } finally {
      setUploadingId("");
    }
  };

  // Create new product
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newProdName.trim();
    if (!trimmedName) {
      showNotice("Lütfen ürün adını yazın.");
      return;
    }
    const sku =
      newProdSku.trim() ||
      `ENS-${Date.now().toString().slice(-5)}`;
    const baseSlug = slugifyTR(`${trimmedName}-${sku}`) || `urun-${Date.now()}`;
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
    const selectedCatObj = store.categories.find((cat) => cat.slug === newProdCat);
    const extraCats =
      selectedCatObj?.parentSlug ? [selectedCatObj.parentSlug] : [];

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
      newArrivalOrder: newProdNewArrival ? 1 : undefined,
      occasions: ["Doğum Günü", "Yılbaşı"],
      giftTypes: [selectedCatObj?.name || "Hediyelik"],
    };

    const next = structuredClone(store);
    next.products.unshift(created);
    await commitStore(next, `✓ "${trimmedName}" kataloğa eklendi ve yayınlandı!`);

    setNewProdName("");
    setNewProdSku("");
    setNewProdPrice("");
    setNewProdDesc("");
    setNewProdGallery([]);
    setNewProdNewArrival(false);
    setShowNewProduct(false);
  };

  // Apply bulk price update
  const handleApplyBulkPrice = async () => {
    const num = Number(bulkValue);
    if (Number.isNaN(num) || num === 0) {
      showNotice("Lütfen geçerli bir oran veya tutar girin.");
      return;
    }
    const subSlugs = new Set(
      store.categories
        .filter((c) => c.parentSlug === bulkCat)
        .map((c) => c.slug)
    );

    const next = structuredClone(store);
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
      `✓ ${updatedCount} ürünün fiyatı toplu olarak güncellendi`
    );
    setShowBulkPrice(false);
  };

  // Create new category
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
      image:
        newCatImage || "/ensar-web/gorseller/kategori-cam-kure.webp",
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

  // Export JSON backup
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

  // Import JSON backup
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
        await commitStore(parsed, "✓ Yedek dosyası başarıyla yüklendi!");
      } catch {
        showNotice("Yedek dosyası okunamadı.");
      }
    };
    reader.readAsText(files[0]);
  };

  if (!ready) {
    return (
      <div className="ensar-container py-12">
        <p className="text-sm text-[#5F505C]">Yönetim paneli hazırlanıyor…</p>
      </div>
    );
  }

  const publishedCount = store.products.filter((p) => p.published).length;
  const hiddenCount = store.products.length - publishedCount;

  return (
    <div className="ensar-container py-6 lg:py-10">
      {/* Sticky Top Control Bar */}
      <div className="sticky top-[60px] z-30 -mx-4 border-b border-[#E5DCD0] bg-[#F7F3EB]/95 px-4 py-3 backdrop-blur-md lg:top-[76px] lg:-mx-6 lg:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-heading text-[24px] font-medium text-[#241722] sm:text-[30px]">
                Mağaza Yönetimi
              </h1>
              <span className="rounded-full bg-emerald-900/10 px-3 py-1 text-xs font-semibold text-emerald-900">
                Orijinal Kalite Fotoğraf &amp; Otomatik Kayıt Aktif
              </span>
            </div>
            <p className="mt-0.5 text-xs text-[#5F505C] sm:text-sm">
              {store.products.length} ürün ({publishedCount} satışta
              {hiddenCount > 0 ? `, ${hiddenCount} gizli` : ""}) ·{" "}
              {store.categories.length} kategori · Yapılan her değişiklik anında
              kaydedilir
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {toast && (
              <span
                role="status"
                className="rounded-full bg-[#321B2D] px-4 py-2 text-xs font-semibold text-[#F7F3EB] shadow-sm"
              >
                {toast}
              </span>
            )}
            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[#321B2D] bg-[#FFFDF8] px-4 text-xs font-semibold text-[#321B2D] hover:bg-[#E9D9F1] sm:text-sm"
            >
              Siteyi Gör ↗
            </Link>
            <button
              type="button"
              onClick={() =>
                commitStore(store, "✓ Tüm değişiklikler kaydedildi!")
              }
              className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-[#321B2D] px-5 text-xs font-semibold text-[#F7F3EB] hover:bg-[#44253D] sm:text-sm"
            >
              Kaydet
            </button>
          </div>
        </div>

        {/* Navigation Tabs — Scrollable on mobile, zero clutter */}
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {(
            [
              ["urunler", `Ürünler (${store.products.length})`],
              ["kategoriler", `Kategoriler (${store.categories.length})`],
              ["vitrin", `Ana Sayfa Vitrin (3 Slayt)`],
              ["siparisler", `Siparişler (${store.orders.length})`],
              ["magaza", "Logo, İletişim & Yedek"],
            ] as [TabKey, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`min-h-[44px] shrink-0 rounded-full px-4 text-xs font-semibold transition-colors sm:px-5 sm:text-sm ${
                activeTab === key
                  ? "bg-[#321B2D] text-[#F7F3EB] shadow-xs"
                  : "border border-[#DDD3C6] bg-[#FFFDF8] text-[#241722] hover:border-[#321B2D]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: ÜRÜNLER (ADD PRODUCT, BULK PRICE, LOSSLESS PHOTOS) */}
      {/* ========================================================= */}
      {activeTab === "urunler" && (
        <div className="mt-6 space-y-5">
          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowNewProduct((v) => !v);
                  setShowBulkPrice(false);
                }}
                className="inline-flex min-h-[46px] items-center gap-2 rounded-full bg-[#321B2D] px-6 text-sm font-semibold text-[#F7F3EB] shadow-sm hover:bg-[#44253D]"
              >
                <span>{showNewProduct ? "− Formu Kapat" : "+ Yeni Ürün Ekle"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowBulkPrice((v) => !v);
                  setShowNewProduct(false);
                }}
                className="inline-flex min-h-[46px] items-center gap-2 rounded-full border border-[#321B2D] bg-[#FFFDF8] px-5 text-sm font-semibold text-[#321B2D] hover:bg-[#E9D9F1]"
              >
                <span>Toplu Fiyat Güncelle (%)</span>
              </button>
            </div>

            <p className="text-xs text-[#5F505C]">
              Yüklenen fotoğraflar sıkıştırılmaz, %100 orijinal kalitede
              kaydedilir.
            </p>
          </div>

          {/* + YENİ ÜRÜN EKLE DRAWER */}
          {showNewProduct && (
            <form
              onSubmit={handleCreateProduct}
              className="ensar-card space-y-5 border-2 border-[#321B2D] p-5 sm:p-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-2xl font-medium text-[#241722]">
                  Yeni Ürün Ekle
                </h2>
                <button
                  type="button"
                  onClick={() => setShowNewProduct(false)}
                  className="text-sm font-semibold text-[#5F505C] hover:text-[#241722]"
                >
                  Kapat ✕
                </button>
              </div>

              {/* Step 1: Lossless Photo Upload */}
              <div className="rounded-2xl border border-dashed border-[#321B2D]/40 bg-[#F7F3EB]/70 p-4">
                <p className="text-sm font-semibold text-[#241722]">
                  1. Ürün Fotoğrafları (Kalite Düşmez — Tek veya Çoklu Seçebilirsiniz)
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full bg-[#321B2D] px-5 text-sm font-semibold text-[#F7F3EB] hover:bg-[#44253D]">
                    <span>
                      {uploadingId === "new-prod"
                        ? "Yükleniyor…"
                        : "📷 Cihazdan Fotoğraf Seç"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) =>
                        handleFilesUpload(
                          e.target.files,
                          "new-prod",
                          (urls) =>
                            setNewProdGallery((prev) => [...prev, ...urls])
                        )
                      }
                    />
                  </label>
                  <span className="text-xs text-[#5F505C]">
                    JPG, PNG, WebP — Orijinal çözünürlük korunur
                  </span>
                </div>

                {newProdGallery.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {newProdGallery.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className="relative h-24 w-24 overflow-hidden rounded-xl border-2 border-[#321B2D] bg-[#FFFDF8]"
                      >
                        <img
                          src={imgUrl}
                          alt={`Yeni ürün fotoğraf ${idx + 1}`}
                          className="h-full w-full object-cover"
                        />
                        {idx === 0 && (
                          <span className="absolute bottom-1 left-1 rounded bg-[#321B2D] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                            Kapak
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setNewProdGallery((prev) =>
                              prev.filter((_, i) => i !== idx)
                            )
                          }
                          aria-label="Fotoğrafı kaldır"
                          className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-rose-700 text-xs font-bold text-white"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Step 2: Basic Details */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block text-xs font-semibold text-[#241722]">
                    Ürün Adı *
                  </label>
                  <input
                    required
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    placeholder="Örn: Işıklı Kar Küresi"
                    className="mt-1.5 h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3.5 text-sm focus:border-[#321B2D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#241722]">
                    Satış Fiyatı (TL) *
                  </label>
                  <input
                    required
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
                  <label className="block text-xs font-semibold text-[#241722]">
                    Kategori *
                  </label>
                  <select
                    value={newProdCat}
                    onChange={(e) => setNewProdCat(e.target.value)}
                    className="mt-1.5 h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3.5 text-sm focus:border-[#321B2D] focus:outline-none"
                  >
                    {store.categories.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.parentSlug ? `↳ ${c.name}` : c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#241722]">
                    Ürün Kodu (Boşsa otomatik)
                  </label>
                  <input
                    value={newProdSku}
                    onChange={(e) => setNewProdSku(e.target.value)}
                    placeholder="Örn: ENS-101"
                    className="mt-1.5 h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3.5 text-sm focus:border-[#321B2D] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#241722]">
                  Ürün Açıklaması (İsteğe Bağlı)
                </label>
                <textarea
                  rows={2}
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  placeholder="Ürün özelliklerini kısaca yazabilirsiniz…"
                  className="mt-1.5 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] p-3 text-sm focus:border-[#321B2D] focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                <label className="flex items-center gap-2.5 text-sm font-medium text-[#241722]">
                  <input
                    type="checkbox"
                    checked={newProdNewArrival}
                    onChange={(e) => setNewProdNewArrival(e.target.checked)}
                    className="h-4 w-4 accent-[#321B2D]"
                  />
                  <span>Ana Sayfada &ldquo;Yeni Gelenler&rdquo; Bölümünde Göster</span>
                </label>

                <button
                  type="submit"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#321B2D] px-8 text-sm font-semibold text-[#F7F3EB] hover:bg-[#44253D]"
                >
                  ✓ Ürünü Ekle ve Yayınla
                </button>
              </div>
            </form>
          )}

          {/* TOPLU FİYAT GÜNCELLEME PANELİ */}
          {showBulkPrice && (
            <div className="ensar-card space-y-4 border-2 border-[#321B2D] p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-xl font-medium text-[#241722]">
                  Toplu Fiyat Güncelleme
                </h2>
                <button
                  type="button"
                  onClick={() => setShowBulkPrice(false)}
                  className="text-xs font-semibold text-[#5F505C]"
                >
                  Kapat ✕
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                <div>
                  <label className="block text-xs font-semibold text-[#5F505C]">
                    Hangi Kategori?
                  </label>
                  <select
                    value={bulkCat}
                    onChange={(e) => setBulkCat(e.target.value)}
                    className="mt-1 h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3 text-sm"
                  >
                    <option value="all">Tüm Ürünler ({store.products.length})</option>
                    {store.categories.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.parentSlug ? `↳ ${c.name}` : c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5F505C]">
                    İşlem Türü
                  </label>
                  <select
                    value={bulkMode}
                    onChange={(e) =>
                      setBulkMode(e.target.value as "percent" | "add")
                    }
                    className="mt-1 h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3 text-sm"
                  >
                    <option value="percent">Yüzde (%) Artır / Azalt</option>
                    <option value="add">Sabit Tutar (TL) Ekle / Çıkar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5F505C]">
                    {bulkMode === "percent"
                      ? "Oran (% — İndirim için -10 yazın)"
                      : "Tutar (TL — İndirim için -50 yazın)"}
                  </label>
                  <input
                    type="number"
                    value={bulkValue}
                    onChange={(e) => setBulkValue(e.target.value)}
                    className="mt-1 h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3 text-sm"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleApplyBulkPrice}
                    className="h-11 w-full rounded-full bg-[#321B2D] px-5 text-sm font-semibold text-[#F7F3EB] hover:bg-[#44253D]"
                  >
                    Fiyatları Uygula
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SEARCH & FILTER BAR */}
          <div className="ensar-card grid grid-cols-1 gap-3 p-4 sm:grid-cols-12">
            <div className="relative sm:col-span-6">
              <SearchIcon
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6F606C]"
              />
              <input
                type="search"
                value={prodSearch}
                onChange={(e) => {
                  setProdSearch(e.target.value);
                  setVisibleLimit(24);
                }}
                placeholder="Ürün adı veya ürün kodu (örn. 6169, CH03) ile hızlı ara…"
                className="h-11 w-full rounded-full border border-[#DDD3C6] bg-[#FFFDF8] pl-10 pr-4 text-sm focus:border-[#321B2D] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-4">
              <select
                value={prodCatFilter}
                onChange={(e) => {
                  setProdCatFilter(e.target.value);
                  setVisibleLimit(24);
                }}
                className="h-11 w-full rounded-full border border-[#DDD3C6] bg-[#FFFDF8] px-4 text-sm focus:border-[#321B2D] focus:outline-none"
              >
                <option value="all">Tüm Kategoriler</option>
                {store.categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.parentSlug ? `↳ ${c.name}` : c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <select
                value={prodStatusFilter}
                onChange={(e) => {
                  setProdStatusFilter(
                    e.target.value as "all" | "published" | "hidden"
                  );
                  setVisibleLimit(24);
                }}
                className="h-11 w-full rounded-full border border-[#DDD3C6] bg-[#FFFDF8] px-3 text-sm focus:border-[#321B2D] focus:outline-none"
              >
                <option value="all">Tümü ({store.products.length})</option>
                <option value="published">Satışta ({publishedCount})</option>
                <option value="hidden">Gizli ({hiddenCount})</option>
              </select>
            </div>
          </div>

          <p className="text-xs font-medium text-[#5F505C]">
            {filteredProducts.length} ürün listeleniyor — Fiyatı veya fotoğrafı
            değiştirdiğiniz anda otomatik kaydedilir.
          </p>

          {/* PRODUCT CARDS LIST */}
          <div className="space-y-3.5">
            {filteredProducts
              .slice(0, visibleLimit)
              .map(({ product, originalIndex }) => {
                const isExpanded = expandedProductId === product.id;
                const gallery = product.gallery?.length
                  ? product.gallery
                  : [product.image];

                return (
                  <div
                    key={product.id}
                    className="ensar-card overflow-hidden p-4 transition-all sm:p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      {/* Left: Photo + Quick Photo Upload */}
                      <div className="flex items-start gap-4">
                        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-[#E5DCD0] bg-[#FFFDF8] sm:h-28 sm:w-28">
                          <img
                            src={product.image}
                            alt={product.imageAlt}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                          <span className="absolute bottom-1 right-1 rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-semibold text-white">
                            {gallery.length} foto
                          </span>
                        </div>

                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[#E9D9F1] px-2.5 py-0.5 text-[11px] font-semibold text-[#321B2D]">
                              Kod: {product.sku}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const next = structuredClone(store);
                                next.products[originalIndex].published =
                                  !product.published;
                                void commitStore(
                                  next,
                                  next.products[originalIndex].published
                                    ? "✓ Ürün satışa açıldı"
                                    : "✓ Ürün gizlendi"
                                );
                              }}
                              className={`rounded-full px-3 py-0.5 text-[11px] font-semibold ${
                                product.published
                                  ? "bg-emerald-900/15 text-emerald-950"
                                  : "bg-stone-200 text-stone-700"
                              }`}
                            >
                              {product.published ? "● Satışta" : "○ Gizli"}
                            </button>
                          </div>

                          {/* Product Name inline edit */}
                          <input
                            value={product.name}
                            aria-label="Ürün adı"
                            onChange={(e) => {
                              const next = structuredClone(store);
                              next.products[originalIndex].name =
                                e.target.value;
                              next.products[originalIndex].shortName =
                                e.target.value;
                              void commitStore(next);
                            }}
                            className="h-10 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3 text-sm font-medium text-[#241722] focus:border-[#321B2D] focus:outline-none sm:min-w-[280px]"
                          />

                          {/* Lossless Photo Upload Buttons */}
                          <div className="flex flex-wrap items-center gap-2 pt-0.5">
                            <label className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-full bg-[#321B2D] px-3.5 py-1.5 text-xs font-semibold text-[#F7F3EB] hover:bg-[#44253D]">
                              <span>
                                {uploadingId === product.id
                                  ? "Yükleniyor…"
                                  : "📷 Kapak Fotoğrafı Değiştir"}
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) =>
                                  handleFilesUpload(
                                    e.target.files,
                                    product.id,
                                    (urls) => {
                                      if (!urls[0]) return;
                                      const next = structuredClone(store);
                                      next.products[originalIndex].image =
                                        urls[0];
                                      next.products[originalIndex].gallery = [
                                        urls[0],
                                        ...(
                                          next.products[originalIndex]
                                            .gallery || []
                                        ).filter(
                                          (g) =>
                                            g !== product.image &&
                                            g !== urls[0]
                                        ),
                                      ];
                                      next.products[
                                        originalIndex
                                      ].isConceptImage = false;
                                      void commitStore(
                                        next,
                                        "✓ Kapak fotoğrafı orijinal kalitede güncellendi"
                                      );
                                    }
                                  )
                                }
                              />
                            </label>

                            <label className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-full border border-[#321B2D] bg-[#FFFDF8] px-3.5 py-1.5 text-xs font-semibold text-[#321B2D] hover:bg-[#E9D9F1]">
                              <span>➕ Galeriye Foto Ekle</span>
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={(e) =>
                                  handleFilesUpload(
                                    e.target.files,
                                    `${product.id}-gal`,
                                    (urls) => {
                                      const next = structuredClone(store);
                                      const currentGal = next.products[
                                        originalIndex
                                      ].gallery?.length
                                        ? next.products[originalIndex].gallery
                                        : [
                                            next.products[originalIndex]
                                              .image,
                                          ];
                                      next.products[originalIndex].gallery = [
                                        ...currentGal,
                                        ...urls,
                                      ];
                                      void commitStore(
                                        next,
                                        `✓ Galeriye ${urls.length} fotoğraf eklendi`
                                      );
                                      setExpandedProductId(product.id);
                                    }
                                  )
                                }
                              />
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Right: Big Price Input, Category, Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EFE7DC] pt-3 lg:justify-end lg:border-t-0 lg:pt-0">
                        {/* Price Input */}
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-semibold text-[#5F505C]">
                            Fiyat (TL):
                          </label>
                          <input
                            type="number"
                            min={0}
                            step="any"
                            value={product.price ?? ""}
                            placeholder="0"
                            onChange={(e) => {
                              const next = structuredClone(store);
                              next.products[originalIndex].price =
                                e.target.value === ""
                                  ? null
                                  : Number(e.target.value);
                              void commitStore(next);
                            }}
                            className="h-11 w-28 rounded-xl border-2 border-[#321B2D]/30 bg-[#FFFDF8] px-3 text-base font-bold text-[#321B2D] focus:border-[#321B2D] focus:outline-none"
                          />
                        </div>

                        {/* Category Select */}
                        <select
                          value={product.categorySlug}
                          aria-label="Ürün kategorisi"
                          onChange={(e) => {
                            const next = structuredClone(store);
                            const newSlug = e.target.value;
                            next.products[originalIndex].categorySlug = newSlug;
                            const catObj = store.categories.find(
                              (c) => c.slug === newSlug
                            );
                            if (catObj?.parentSlug) {
                              next.products[
                                originalIndex
                              ].extraCategorySlugs = [catObj.parentSlug];
                            }
                            void commitStore(
                              next,
                              "✓ Ürün kategorisi değiştirildi"
                            );
                          }}
                          className="h-11 max-w-[175px] rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3 text-xs font-medium text-[#241722]"
                        >
                          {store.categories.map((c) => (
                            <option key={c.slug} value={c.slug}>
                              {c.parentSlug ? `↳ ${c.name}` : c.name}
                            </option>
                          ))}
                        </select>

                        {/* Details & Preview Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedProductId(
                                isExpanded ? null : product.id
                              )
                            }
                            className="min-h-[40px] rounded-full border border-[#DDD3C6] bg-[#FFFDF8] px-3.5 text-xs font-semibold text-[#241722] hover:border-[#321B2D]"
                          >
                            {isExpanded ? "Detayı Gizle ▲" : "Galeri & Detay ▼"}
                          </button>

                          <Link
                            href={getProductHref(product.slug)}
                            className="inline-flex min-h-[40px] items-center rounded-full bg-[#E9D9F1] px-3.5 text-xs font-semibold text-[#321B2D] hover:bg-[#321B2D] hover:text-[#F7F3EB]"
                          >
                            Sitede Gör ↗
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Drawer: Multi-Image Gallery Strip, Description, SKU, Delete */}
                    {isExpanded && (
                      <div className="mt-4 space-y-4 border-t border-[#EFE7DC] pt-4">
                        <div>
                          <p className="text-xs font-semibold text-[#241722]">
                            Ürün Galerisi ({gallery.length} Fotoğraf — İstediğiniz
                            fotoğrafı &ldquo;Kapak Yap&rdquo; ile ana görsel
                            seçebilirsiniz)
                          </p>
                          <div className="mt-2.5 flex flex-wrap gap-3">
                            {gallery.map((imgUrl, gIdx) => {
                              const isCover = imgUrl === product.image;
                              return (
                                <div
                                  key={gIdx}
                                  className={`relative h-24 w-24 overflow-hidden rounded-xl border-2 bg-[#FFFDF8] ${
                                    isCover
                                      ? "border-[#321B2D]"
                                      : "border-[#DDD3C6]"
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
                                      onClick={() => {
                                        const next = structuredClone(store);
                                        next.products[originalIndex].image =
                                          imgUrl;
                                        void commitStore(
                                          next,
                                          "✓ Kapak fotoğrafı güncellendi"
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
                                      onClick={() => {
                                        const next = structuredClone(store);
                                        const filteredGal = gallery.filter(
                                          (_, i) => i !== gIdx
                                        );
                                        next.products[originalIndex].gallery =
                                          filteredGal;
                                        if (isCover && filteredGal[0]) {
                                          next.products[originalIndex].image =
                                            filteredGal[0];
                                        }
                                        void commitStore(
                                          next,
                                          "✓ Fotoğraf galeriden kaldırıldı"
                                        );
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
                            <label className="block text-xs font-semibold text-[#5F505C]">
                              Ürün Kodu (SKU)
                            </label>
                            <input
                              value={product.sku}
                              onChange={(e) => {
                                const next = structuredClone(store);
                                next.products[originalIndex].sku =
                                  e.target.value;
                                void commitStore(next);
                              }}
                              className="mt-1 h-10 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3 text-sm"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-[#5F505C]">
                              Ürün Açıklaması
                            </label>
                            <input
                              value={product.description}
                              onChange={(e) => {
                                const next = structuredClone(store);
                                next.products[originalIndex].description =
                                  e.target.value;
                                void commitStore(next);
                              }}
                              placeholder="Ürün açıklaması…"
                              className="mt-1 h-10 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3 text-sm"
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                          <label className="flex items-center gap-2 text-xs font-semibold text-[#241722]">
                            <input
                              type="checkbox"
                              checked={Boolean(product.isNewArrival)}
                              onChange={(e) => {
                                const next = structuredClone(store);
                                next.products[originalIndex].isNewArrival =
                                  e.target.checked;
                                void commitStore(next);
                              }}
                              className="h-4 w-4 accent-[#321B2D]"
                            />
                            <span>Ana Sayfa &ldquo;Yeni Gelenler&rdquo; vitrininde göster</span>
                          </label>

                          {confirmDeleteId === product.id ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-rose-700">
                                Silinsin mi?
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const next = structuredClone(store);
                                  next.products.splice(originalIndex, 1);
                                  setConfirmDeleteId(null);
                                  void commitStore(
                                    next,
                                    "✓ Ürün katalogdan silindi"
                                  );
                                }}
                                className="rounded-full bg-rose-700 px-3.5 py-1.5 text-xs font-semibold text-white"
                              >
                                Evet, Sil
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="rounded-full border border-[#DDD3C6] px-3 py-1.5 text-xs font-semibold"
                              >
                                Vazgeç
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(product.id)}
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
              })}
          </div>

          {filteredProducts.length > visibleLimit && (
            <div className="pt-3 text-center">
              <button
                type="button"
                onClick={() => setVisibleLimit((v) => v + 48)}
                className="inline-flex min-h-[46px] items-center rounded-full border border-[#321B2D] bg-[#FFFDF8] px-7 text-sm font-semibold text-[#321B2D] hover:bg-[#321B2D] hover:text-[#F7F3EB]"
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
        <div className="mt-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setShowNewCategory((v) => !v)}
              className="inline-flex min-h-[46px] items-center gap-2 rounded-full bg-[#321B2D] px-6 text-sm font-semibold text-[#F7F3EB] hover:bg-[#44253D]"
            >
              <span>
                {showNewCategory ? "− Formu Kapat" : "+ Yeni Kategori Ekle"}
              </span>
            </button>
          </div>

          {showNewCategory && (
            <form
              onSubmit={handleCreateCategory}
              className="ensar-card space-y-4 border-2 border-[#321B2D] p-5"
            >
              <h2 className="font-heading text-xl font-medium text-[#241722]">
                Yeni Kategori Oluştur
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-[#241722]">
                    Kategori Adı *
                  </label>
                  <input
                    required
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Örn: Ahşap Hediyelikler"
                    className="mt-1 h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#241722]">
                    Üst Kategori (Ana kategoriyse boş bırakın)
                  </label>
                  <select
                    value={newCatParent}
                    onChange={(e) => setNewCatParent(e.target.value)}
                    className="mt-1 h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3 text-sm"
                  >
                    <option value="">Ana Kategori</option>
                    {store.categories
                      .filter((c) => !c.parentSlug)
                      .map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#241722]">
                    Kapak Fotoğrafı (Orijinal Kalite)
                  </label>
                  <label className="mt-1 flex h-11 cursor-pointer items-center justify-center rounded-xl bg-[#321B2D] px-4 text-xs font-semibold text-[#F7F3EB]">
                    <span>
                      {newCatImage
                        ? "✓ Fotoğraf Seçildi (Değiştir)"
                        : "📷 Fotoğraf Seç"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleFilesUpload(
                          e.target.files,
                          "new-cat",
                          (urls) => urls[0] && setNewCatImage(urls[0])
                        )
                      }
                    />
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#241722]">
                  Kısa Açıklama
                </label>
                <input
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Kategori açıklaması…"
                  className="mt-1 h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3 text-sm"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
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
                  className="min-h-[44px] rounded-full bg-[#321B2D] px-6 text-sm font-semibold text-[#F7F3EB]"
                >
                  ✓ Kategoriyi Oluştur
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {store.categories.map((cat, idx) => (
              <div
                key={cat.slug}
                className="ensar-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
              >
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-[#E5DCD0] bg-[#FFFDF8]">
                  <img
                    src={cat.image}
                    alt={cat.imageAlt}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      value={cat.name}
                      onChange={(e) => {
                        const next = structuredClone(store);
                        next.categories[idx].name = e.target.value;
                        void commitStore(next);
                      }}
                      className="h-10 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3 text-sm font-semibold text-[#241722]"
                    />
                    <Link
                      href={getCategoryHref(cat.slug)}
                      className="shrink-0 rounded-full bg-[#E9D9F1] px-3 py-1.5 text-xs font-semibold text-[#321B2D]"
                    >
                      Gör ↗
                    </Link>
                  </div>

                  <input
                    value={cat.description}
                    onChange={(e) => {
                      const next = structuredClone(store);
                      next.categories[idx].description = e.target.value;
                      void commitStore(next);
                    }}
                    className="h-9 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3 text-xs text-[#4C3C49]"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                    <label className="inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-full bg-[#321B2D] px-3.5 py-1 text-xs font-semibold text-[#F7F3EB]">
                      <span>📷 Kapak Fotoğrafı Yükle</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleFilesUpload(
                            e.target.files,
                            `cat-${cat.slug}`,
                            (urls) => {
                              if (!urls[0]) return;
                              const next = structuredClone(store);
                              next.categories[idx].image = urls[0];
                              next.categories[idx].isConceptImage = false;
                              void commitStore(
                                next,
                                "✓ Kategori fotoğrafı güncellendi"
                              );
                            }
                          )
                        }
                      />
                    </label>

                    <label className="flex items-center gap-1.5 text-xs font-medium text-[#241722]">
                      <input
                        type="checkbox"
                        checked={cat.showOnHome}
                        onChange={(e) => {
                          const next = structuredClone(store);
                          next.categories[idx].showOnHome = e.target.checked;
                          void commitStore(next);
                        }}
                        className="accent-[#321B2D]"
                      />
                      <span>Ana sayfada göster</span>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: ANA SAYFA VİTRİN (3 AÇILIŞ SLAYTI)                 */}
      {/* ========================================================= */}
      {activeTab === "vitrin" && (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-[#5F505C]">
            Ana sayfadaki 3 büyük açılış vitrininin fotoğrafını, başlığını ve
            butonunu buradan değiştirebilirsiniz.
          </p>
          {store.heroSlides.map((slide, idx) => (
            <div
              key={slide.id}
              className="ensar-card grid grid-cols-1 gap-5 p-5 md:grid-cols-12"
            >
              <div className="md:col-span-4">
                <div className="aspect-[16/10] w-full overflow-hidden rounded-2xl bg-[#241320]">
                  <img
                    src={slide.image}
                    alt={slide.imageAlt}
                    className="h-full w-full object-cover"
                  />
                </div>
                <label className="mt-3 flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#321B2D] px-4 text-xs font-semibold text-[#F7F3EB] hover:bg-[#44253D]">
                  <span>📷 Vitrin Fotoğrafını Değiştir (Orijinal Kalite)</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      handleFilesUpload(
                        e.target.files,
                        slide.id,
                        (urls) => {
                          if (!urls[0]) return;
                          const next = structuredClone(store);
                          next.heroSlides[idx].image = urls[0];
                          next.heroSlides[idx].isConceptImage = false;
                          void commitStore(
                            next,
                            "✓ Vitrin fotoğrafı orijinal kalitede güncellendi"
                          );
                        }
                      )
                    }
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 md:col-span-8 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#241722]">
                    Vitrin Başlığı (Satırları / ile ayırın)
                  </label>
                  <input
                    value={slide.titleLines.join(" / ")}
                    onChange={(e) => {
                      const next = structuredClone(store);
                      next.heroSlides[idx].titleLines = e.target.value
                        .split("/")
                        .map((s) => s.trim())
                        .filter(Boolean);
                      void commitStore(next);
                    }}
                    className="mt-1.5 h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3.5 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#241722]">
                    Buton Yazısı
                  </label>
                  <input
                    value={slide.buttonLabel}
                    onChange={(e) => {
                      const next = structuredClone(store);
                      next.heroSlides[idx].buttonLabel = e.target.value;
                      void commitStore(next);
                    }}
                    className="mt-1.5 h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#241722]">
                    Tıklanınca Gideceği Sayfa
                  </label>
                  <select
                    value={slide.buttonHref}
                    onChange={(e) => {
                      const next = structuredClone(store);
                      next.heroSlides[idx].buttonHref = e.target.value;
                      void commitStore(next);
                    }}
                    className="mt-1.5 h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3.5 text-sm"
                  >
                    <option value="#hediyeni-bul">Hediyeni Bul Bölümü</option>
                    <option value="/kategoriler/">Tüm Kategoriler</option>
                    {store.categories.map((c) => (
                      <option key={c.slug} value={`/kategori/${c.slug}/`}>
                        Kategori: {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: SİPARİŞLER                                         */}
      {/* ========================================================= */}
      {activeTab === "siparisler" && (
        <div className="mt-6 space-y-4">
          {store.orders.length === 0 ? (
            <div className="ensar-card p-8 text-center text-sm text-[#5F505C]">
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
                      className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-[#321B2D] px-3.5 text-xs font-semibold text-[#321B2D]"
                    >
                      <WhatsAppIcon size={15} />
                      <span>Müşteriye Yaz</span>
                    </a>

                    <select
                      value={order.status}
                      onChange={(e) => {
                        const next = structuredClone(store);
                        next.orders[idx].status = e.target
                          .value as Order["status"];
                        void commitStore(next, "✓ Sipariş durumu güncellendi");
                      }}
                      className="h-10 rounded-full bg-[#321B2D] px-4 text-xs font-semibold text-[#F7F3EB]"
                    >
                      {[
                        "Yeni",
                        "Hazırlanıyor",
                        "Kargolandı",
                        "Teslim Edildi",
                        "İptal",
                      ].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="rounded-xl bg-[#F7F3EB] p-3 text-xs text-[#4C3C49]">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between py-0.5">
                      <span>
                        • {item.name}{" "}
                        {item.selectedOption ? `(${item.selectedOption})` : ""}{" "}
                        × {item.quantity}
                      </span>
                      <span className="font-semibold">
                        {formatPriceTRY(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  ))}
                  <div className="mt-2 flex justify-between border-t border-[#E5DCD0] pt-2 text-sm font-semibold text-[#321B2D]">
                    <span>Toplam</span>
                    <span>{formatPriceTRY(order.total)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: LOGO, İLETİŞİM & YEDEKLEME                         */}
      {/* ========================================================= */}
      {activeTab === "magaza" && (
        <div className="mt-6 space-y-6">
          {/* Logos */}
          <div className="ensar-card grid grid-cols-1 gap-6 p-6 sm:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-[#241722]">
                Üst Menü Logosu (Açık Zemin)
              </p>
              <div className="mt-2 flex h-20 items-center justify-center rounded-xl border border-[#E5DCD0] bg-[#F7F3EB] p-3">
                <img
                  src={store.settings.logoLightBg}
                  alt="Üst Menü Logosu"
                  className="max-h-12 w-auto object-contain"
                />
              </div>
              <label className="mt-3 inline-flex min-h-[42px] cursor-pointer items-center rounded-full bg-[#321B2D] px-5 text-xs font-semibold text-[#F7F3EB]">
                <span>📷 Yeni Logo Yükle (Orijinal Kalite)</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    handleFilesUpload(e.target.files, "logo-light", (urls) => {
                      if (!urls[0]) return;
                      const next = structuredClone(store);
                      next.settings.logoLightBg = urls[0];
                      void commitStore(next, "✓ Üst menü logosu güncellendi");
                    })
                  }
                />
              </label>
            </div>

            <div>
              <p className="text-sm font-semibold text-[#241722]">
                Alt Menü Logosu (Koyu Zemin)
              </p>
              <div className="mt-2 flex h-20 items-center justify-center rounded-xl bg-[#321B2D] p-3">
                <img
                  src={store.settings.logoDarkBg}
                  alt="Alt Menü Logosu"
                  className="max-h-12 w-auto object-contain"
                />
              </div>
              <label className="mt-3 inline-flex min-h-[42px] cursor-pointer items-center rounded-full bg-[#321B2D] px-5 text-xs font-semibold text-[#F7F3EB]">
                <span>📷 Yeni Koyu Zemin Logosu Yükle</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    handleFilesUpload(e.target.files, "logo-dark", (urls) => {
                      if (!urls[0]) return;
                      const next = structuredClone(store);
                      next.settings.logoDarkBg = urls[0];
                      void commitStore(next, "✓ Alt menü logosu güncellendi");
                    })
                  }
                />
              </label>
            </div>
          </div>

          {/* Contact & Shipping Settings */}
          <div className="ensar-card grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[#5F505C]">
                Telefon Numarası (Sitede Görünen)
              </label>
              <input
                value={store.settings.phoneDisplay}
                onChange={(e) => {
                  const next = structuredClone(store);
                  next.settings.phoneDisplay = e.target.value;
                  void commitStore(next);
                }}
                className="mt-1 h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5F505C]">
                WhatsApp Sipariş Hattı (905413567162 formatında)
              </label>
              <input
                value={store.settings.whatsappNumber}
                onChange={(e) => {
                  const next = structuredClone(store);
                  next.settings.whatsappNumber = e.target.value;
                  void commitStore(next);
                }}
                className="mt-1 h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5F505C]">
                Ücretsiz Kargo Alt Limiti (TL)
              </label>
              <input
                type="number"
                value={store.settings.shippingThreshold}
                onChange={(e) => {
                  const next = structuredClone(store);
                  next.settings.shippingThreshold =
                    Number(e.target.value) || 0;
                  void commitStore(next);
                }}
                className="mt-1 h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5F505C]">
                Standart Kargo Ücreti (TL)
              </label>
              <input
                type="number"
                value={store.settings.shippingFee}
                onChange={(e) => {
                  const next = structuredClone(store);
                  next.settings.shippingFee = Number(e.target.value) || 0;
                  void commitStore(next);
                }}
                className="mt-1 h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5F505C]">
                E-posta Adresi
              </label>
              <input
                value={store.settings.email}
                onChange={(e) => {
                  const next = structuredClone(store);
                  next.settings.email = e.target.value;
                  void commitStore(next);
                }}
                className="mt-1 h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5F505C]">
                Çalışma Saatleri
              </label>
              <input
                value={store.settings.workingHours}
                onChange={(e) => {
                  const next = structuredClone(store);
                  next.settings.workingHours = e.target.value;
                  void commitStore(next);
                }}
                className="mt-1 h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3.5 text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#5F505C]">
                Mağaza Açık Adresi
              </label>
              <input
                value={store.settings.address}
                onChange={(e) => {
                  const next = structuredClone(store);
                  next.settings.address = e.target.value;
                  void commitStore(next);
                }}
                className="mt-1 h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3.5 text-sm"
              />
            </div>
          </div>

          {/* Backup & Reset */}
          <div className="ensar-card flex flex-wrap items-center justify-between gap-4 p-6">
            <div>
              <h3 className="font-heading text-lg font-medium text-[#241722]">
                Yedekleme ve Sıfırlama
              </h3>
              <p className="mt-0.5 text-xs text-[#5F505C]">
                Tüm ürün ve fiyatlarınızı yedekleyebilir veya başka bir cihaza
                aktarabilirsiniz.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleExportBackup}
                className="min-h-[42px] rounded-full bg-[#321B2D] px-5 text-xs font-semibold text-[#F7F3EB]"
              >
                📥 Yedeği İndir (.json)
              </button>

              <label className="inline-flex min-h-[42px] cursor-pointer items-center rounded-full border border-[#321B2D] bg-[#FFFDF8] px-5 text-xs font-semibold text-[#321B2D]">
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
                    className="min-h-[42px] rounded-full bg-rose-700 px-4 text-xs font-semibold text-white"
                  >
                    Evet, Sıfırla
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="min-h-[42px] rounded-full border border-[#DDD3C6] px-4 text-xs font-semibold"
                  >
                    Vazgeç
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="min-h-[42px] rounded-full border border-rose-700/40 px-4 text-xs font-semibold text-rose-700"
                >
                  Fabrika Ayarlarına Dön
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
