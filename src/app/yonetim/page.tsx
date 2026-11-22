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
  const [newCatHome, setNewCatHome] = useState(true);
  const [confirmDeleteCatSlug, setConfirmDeleteCatSlug] = useState<string | null>(
    null
  );

  // Confirm reset state
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
      showNotice(`✓ Fotoğraf orijinal kalitede yüklendi`);
    } catch {
      showNotice("Fotoğraf yüklenirken bir hata oluştu.");
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
      newProdSku.trim() || `ENS-${Date.now().toString().slice(-5)}`;
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
      newArrivalOrder: newProdNewArrival ? 1 : undefined,
      occasions: ["Doğum Günü", "Yılbaşı"],
      giftTypes: [selectedCatObj?.name || "Hediyelik"],
    };

    const next = structuredClone(store);
    next.products.unshift(created);
    await commitStore(next, `✓ "${trimmedName}" eklendi ve yayınlandı!`);

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

    await commitStore(next, `✓ ${updatedCount} ürünün fiyatı güncellendi`);
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

  if (!ready) {
    return (
      <div className="ensar-container py-12">
        <p className="text-sm text-[#5F505C]">Yönetim paneli hazırlanıyor…</p>
      </div>
    );
  }

  const publishedCount = store.products.filter((p) => p.published).length;
  const hiddenCount = store.products.length - publishedCount;

  const MENU_TABS: { key: TabKey; title: string; count?: string }[] = [
    { key: "urunler", title: "Ürünler", count: `${store.products.length}` },
    {
      key: "kategoriler",
      title: "Kategoriler",
      count: `${store.categories.length}`,
    },
    { key: "vitrin", title: "Ana Vitrin", count: "3 Slayt" },
    { key: "magaza", title: "Ayarlar & Logo" },
  ];

  return (
    <div className="ensar-container py-5 lg:py-8">
      {/* Floating Toast Notification */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-2xl bg-[#321B2D] px-5 py-3 text-sm font-semibold text-[#F7F3EB] shadow-xl"
        >
          <span>{toast}</span>
        </div>
      )}

      {/* 1. CLEAN HEADER ROW */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5DCD0] pb-4">
        <div>
          <h1 className="font-heading text-[26px] font-medium text-[#241722] sm:text-[32px]">
            Mağaza Yönetim Paneli
          </h1>
          <p className="text-xs text-[#5F505C] sm:text-sm">
            Fotoğraflar kalite düşmeden yüklenir · Fiyat ve bilgi değişiklikleri
            anında kaydedilir
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-[#321B2D]/25 bg-[#FFFDF8] px-4 text-xs font-semibold text-[#321B2D] shadow-2xs hover:bg-[#E9D9F1] sm:text-sm"
        >
          <span>Mağazayı Görüntüle ↗</span>
        </Link>
      </div>

      {/* 2. SEGMENTED TAB BOX (4 clear tabs in a 2x2 mobile / 4-col desktop grid) */}
      <div className="mt-4 rounded-2xl border border-[#E5DCD0] bg-[#EFE9DF] p-1.5">
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {MENU_TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex min-h-[46px] items-center justify-between rounded-xl px-3.5 py-2 text-left transition-all ${
                  active
                    ? "bg-[#321B2D] text-[#F7F3EB] shadow-sm"
                    : "bg-[#FFFDF8]/70 text-[#241722] hover:bg-[#FFFDF8]"
                }`}
              >
                <span className="text-xs font-semibold sm:text-sm">
                  {tab.title}
                </span>
                {tab.count && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      active
                        ? "bg-[#F7F3EB]/20 text-[#F7F3EB]"
                        : "bg-[#E9D9F1] text-[#321B2D]"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: ÜRÜNLER                                            */}
      {/* ========================================================= */}
      {activeTab === "urunler" && (
        <div className="mt-5 space-y-5">
          {/* ACTION CARDS: 2 Clear Cards Side-by-Side */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                if (prodCatFilter !== "all" && !showNewProduct) {
                  setNewProdCat(prodCatFilter);
                }
                setShowNewProduct((v) => !v);
                setShowBulkPrice(false);
              }}
              className={`flex min-h-[64px] items-center justify-between rounded-2xl border p-4 text-left transition-all ${
                showNewProduct
                  ? "border-[#321B2D] bg-[#321B2D] text-[#F7F3EB]"
                  : "border-[#321B2D]/25 bg-[#FFFDF8] text-[#241722] shadow-2xs hover:border-[#321B2D]"
              }`}
            >
              <div>
                <p className="text-base font-bold">
                  {showNewProduct
                    ? "− Yeni Ürün Formunu Kapat"
                    : "＋ Yeni Ürün Ekle"}
                </p>
                <p
                  className={`mt-0.5 text-xs ${
                    showNewProduct ? "text-[#F7F3EB]/80" : "text-[#5F505C]"
                  }`}
                >
                  Cihazdan fotoğraf seçip isim ve fiyat girerek yeni ürün açın
                </p>
              </div>
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${
                  showNewProduct
                    ? "bg-[#F7F3EB]/20 text-[#F7F3EB]"
                    : "bg-[#321B2D] text-[#F7F3EB]"
                }`}
              >
                {showNewProduct ? "✕" : "＋"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowBulkPrice((v) => !v);
                setShowNewProduct(false);
              }}
              className={`flex min-h-[64px] items-center justify-between rounded-2xl border p-4 text-left transition-all ${
                showBulkPrice
                  ? "border-[#321B2D] bg-[#321B2D] text-[#F7F3EB]"
                  : "border-[#E5DCD0] bg-[#FFFDF8] text-[#241722] shadow-2xs hover:border-[#321B2D]"
              }`}
            >
              <div>
                <p className="text-base font-bold">
                  {showBulkPrice
                    ? "− Toplu Fiyat Aracını Kapat"
                    : "% Toplu Fiyat Güncelle"}
                </p>
                <p
                  className={`mt-0.5 text-xs ${
                    showBulkPrice ? "text-[#F7F3EB]/80" : "text-[#5F505C]"
                  }`}
                >
                  Tüm ürünlere veya seçili kategoriye tek tuşla zam/indirim yapın
                </p>
              </div>
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                  showBulkPrice
                    ? "bg-[#F7F3EB]/20 text-[#F7F3EB]"
                    : "bg-[#E9D9F1] text-[#321B2D]"
                }`}
              >
                %
              </span>
            </button>
          </div>

          {/* + YENİ ÜRÜN EKLE DRAWER */}
          {showNewProduct && (
            <form
              onSubmit={handleCreateProduct}
              className="ensar-card space-y-5 border-2 border-[#321B2D] p-5 sm:p-6"
            >
              <div className="flex items-center justify-between border-b border-[#EFE7DC] pb-3">
                <h2 className="font-heading text-2xl font-medium text-[#241722]">
                  Yeni Ürün Ekle
                </h2>
                <button
                  type="button"
                  onClick={() => setShowNewProduct(false)}
                  className="rounded-lg bg-[#F7F3EB] px-3 py-1.5 text-xs font-semibold text-[#241722]"
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
                  <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl bg-[#321B2D] px-5 text-sm font-semibold text-[#F7F3EB] hover:bg-[#44253D]">
                    <span>
                      {uploadingId === "new-prod"
                        ? "Yükleniyor…"
                        : "📷 Telefondan / Bilgisayardan Fotoğraf Seç"}
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
                  <label className="block text-xs font-bold text-[#241722]">
                    2. Ürün Adı *
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
                  <label className="block text-xs font-bold text-[#241722]">
                    3. Satış Fiyatı (TL) *
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
                  <label className="block text-xs font-bold text-[#241722]">
                    4. Hangi Kategoriye Eklensin? *
                  </label>
                  <div className="relative mt-1.5">
                    <select
                      value={newProdCat}
                      onChange={(e) => setNewProdCat(e.target.value)}
                      className="ensar-select h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] pl-3.5 pr-9 text-sm focus:border-[#321B2D] focus:outline-none"
                    >
                      {store.categories.map((c) => {
                        const parent = c.parentSlug
                          ? store.categories.find((p) => p.slug === c.parentSlug)
                          : null;
                        return (
                          <option key={c.slug} value={c.slug}>
                            {parent
                              ? `↳ ${parent.name} → ${c.name}`
                              : c.name}
                          </option>
                        );
                      })}
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
                    placeholder="Boşsa otomatik verilir"
                    className="mt-1.5 h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3.5 text-sm focus:border-[#321B2D] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#241722]">
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
                  className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#321B2D] px-8 text-sm font-semibold text-[#F7F3EB] hover:bg-[#44253D]"
                >
                  ✓ Ürünü Kaydet ve Yayınla
                </button>
              </div>
            </form>
          )}

          {/* TOPLU FİYAT GÜNCELLEME PANELİ */}
          {showBulkPrice && (
            <div className="ensar-card space-y-4 border-2 border-[#321B2D] p-5">
              <div className="flex items-center justify-between border-b border-[#EFE7DC] pb-3">
                <h2 className="font-heading text-xl font-medium text-[#241722]">
                  Toplu Fiyat Güncelleme
                </h2>
                <button
                  type="button"
                  onClick={() => setShowBulkPrice(false)}
                  className="rounded-lg bg-[#F7F3EB] px-3 py-1 text-xs font-semibold text-[#241722]"
                >
                  Kapat ✕
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                <div>
                  <label className="block text-xs font-bold text-[#241722]">
                    1. Hangi Kategori?
                  </label>
                  <div className="relative mt-1">
                    <select
                      value={bulkCat}
                      onChange={(e) => setBulkCat(e.target.value)}
                      className="ensar-select h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] pl-3 pr-9 text-sm"
                    >
                      <option value="all">
                        Tüm Ürünler ({store.products.length})
                      </option>
                      {store.categories.map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.parentSlug ? `↳ ${c.name}` : c.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon
                      size={16}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#5F505C]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#241722]">
                    2. İşlem Türü
                  </label>
                  <div className="relative mt-1">
                    <select
                      value={bulkMode}
                      onChange={(e) =>
                        setBulkMode(e.target.value as "percent" | "add")
                      }
                      className="ensar-select h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] pl-3 pr-9 text-sm"
                    >
                      <option value="percent">Yüzde (%) Zam / İndirim</option>
                      <option value="add">Sabit TL Ekle / Düş</option>
                    </select>
                    <ChevronDownIcon
                      size={16}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#5F505C]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#241722]">
                    3. {bulkMode === "percent" ? "Oran (%)" : "Tutar (TL)"}
                  </label>
                  <input
                    type="number"
                    value={bulkValue}
                    onChange={(e) => setBulkValue(e.target.value)}
                    placeholder="İndirim için başına - koyun"
                    className="mt-1 h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3 text-sm"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleApplyBulkPrice}
                    className="h-11 w-full rounded-xl bg-[#321B2D] px-5 text-sm font-semibold text-[#F7F3EB] hover:bg-[#44253D]"
                  >
                    ✓ Fiyatları Güncelle
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3. CRYSTAL-CLEAR SEARCH & FILTER BOX (With labels & custom chevrons!) */}
          <div className="ensar-card space-y-3.5 p-4 sm:p-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
              {/* Search Box */}
              <div className="sm:col-span-6">
                <label
                  htmlFor="admin-prod-search"
                  className="mb-1 block text-xs font-bold text-[#241722]"
                >
                  Ürün Ara (İsim veya Ürün Kodu)
                </label>
                <div className="relative">
                  <SearchIcon
                    size={17}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6F606C]"
                  />
                  <input
                    id="admin-prod-search"
                    type="search"
                    value={prodSearch}
                    onChange={(e) => {
                      setProdSearch(e.target.value);
                      setVisibleLimit(24);
                    }}
                    placeholder="Örn: Kar küresi, fanus, 6169, CH03…"
                    className="h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#F7F3EB]/60 pl-10 pr-4 text-sm text-[#241722] focus:border-[#321B2D] focus:bg-[#FFFDF8] focus:outline-none"
                  />
                </div>
              </div>

              {/* Category Select & Status Select side-by-side on mobile */}
              <div className="grid grid-cols-2 gap-2.5 sm:col-span-6">
                <div>
                  <label
                    htmlFor="admin-cat-select"
                    className="mb-1 block text-xs font-bold text-[#241722]"
                  >
                    Kategori Seçin
                  </label>
                  <div className="relative">
                    <select
                      id="admin-cat-select"
                      value={prodCatFilter}
                      onChange={(e) => {
                        setProdCatFilter(e.target.value);
                        setVisibleLimit(24);
                      }}
                      className="ensar-select h-11 w-full cursor-pointer truncate rounded-xl border border-[#DDD3C6] bg-[#F7F3EB]/60 pl-3 pr-8 text-xs font-semibold text-[#241722] focus:border-[#321B2D] focus:bg-[#FFFDF8] focus:outline-none sm:text-sm"
                    >
                      <option value="all">Tüm Kategoriler</option>
                      {store.categories.map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.parentSlug ? `↳ ${c.name}` : c.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon
                      size={15}
                      className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5F505C]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="admin-status-select"
                    className="mb-1 block text-xs font-bold text-[#241722]"
                  >
                    Satış Durumu
                  </label>
                  <div className="relative">
                    <select
                      id="admin-status-select"
                      value={prodStatusFilter}
                      onChange={(e) => {
                        setProdStatusFilter(
                          e.target.value as "all" | "published" | "hidden"
                        );
                        setVisibleLimit(24);
                      }}
                      className="ensar-select h-11 w-full cursor-pointer truncate rounded-xl border border-[#DDD3C6] bg-[#F7F3EB]/60 pl-3 pr-8 text-xs font-semibold text-[#241722] focus:border-[#321B2D] focus:bg-[#FFFDF8] focus:outline-none sm:text-sm"
                    >
                      <option value="all">
                        Tüm Ürünler ({store.products.length})
                      </option>
                      <option value="published">
                        Satışta Olanlar ({publishedCount})
                      </option>
                      <option value="hidden">
                        Gizlenenler ({hiddenCount})
                      </option>
                    </select>
                    <ChevronDownIcon
                      size={15}
                      className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5F505C]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick 1-Tap Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5">
              <span className="shrink-0 text-[11px] font-bold text-[#6F606C]">
                Hızlı Seç:
              </span>
              {[
                { slug: "all", label: "Tümü" },
                ...store.categories.map((c) => ({
                  slug: c.slug,
                  label: c.parentSlug ? `↳ ${c.name}` : c.name,
                })),
              ].map((chip) => (
                <button
                  key={chip.slug}
                  type="button"
                  onClick={() => {
                    setProdCatFilter(chip.slug);
                    if (chip.slug !== "all") {
                      setNewProdCat(chip.slug);
                    }
                    setVisibleLimit(24);
                  }}
                  className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                    prodCatFilter === chip.slug
                      ? "bg-[#321B2D] text-[#F7F3EB]"
                      : "bg-[#F7F3EB] text-[#241722] hover:bg-[#E9D9F1]"
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-semibold text-[#5F505C]">
              Toplam {filteredProducts.length} ürün bulundu
            </p>
            {(prodSearch || prodCatFilter !== "all" || prodStatusFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setProdSearch("");
                  setProdCatFilter("all");
                  setProdStatusFilter("all");
                }}
                className="text-xs font-bold text-[#321B2D] underline"
              >
                Filtreyi Temizle
              </button>
            )}
          </div>

          {/* PRODUCT CARDS LIST */}
          <div className="space-y-3.5">
            {filteredProducts
              .slice(0, visibleLimit)
              .map(({ product, originalIndex }) => {
                const isExpanded = expandedProductId === product.id;
                const isJustSaved = savedCardId === product.id;
                const gallery = product.gallery?.length
                  ? product.gallery
                  : [product.image];

                return (
                  <div
                    key={product.id}
                    className="ensar-card overflow-hidden p-4 transition-all sm:p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      {/* Left: Photo + Product Title + Photo Buttons */}
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
                              onClick={() => {
                                const next = structuredClone(store);
                                next.products[originalIndex].published =
                                  !product.published;
                                void commitStore(
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
                              value={product.name}
                              aria-label="Ürün adı"
                              onChange={(e) => {
                                const next = structuredClone(store);
                                next.products[originalIndex].name =
                                  e.target.value;
                                next.products[originalIndex].shortName =
                                  e.target.value;
                                void commitStore(
                                  next,
                                  "✓ Ürün adı kaydedildi",
                                  product.id
                                );
                              }}
                              className="mt-0.5 h-10 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3 text-sm font-semibold text-[#241722] focus:border-[#321B2D] focus:outline-none sm:min-w-[280px]"
                            />
                          </div>

                          {/* Lossless Photo Upload Buttons */}
                          <div className="flex flex-wrap items-center gap-2 pt-0.5">
                            <label className="inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-xl bg-[#321B2D] px-3 py-1.5 text-xs font-semibold text-[#F7F3EB] hover:bg-[#44253D]">
                              <span>
                                {uploadingId === product.id
                                  ? "Yükleniyor…"
                                  : "📷 Fotoğraf Değiştir"}
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
                                        "✓ Fotoğraf orijinal kalitede kaydedildi",
                                        product.id
                                      );
                                    }
                                  )
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
                                        `✓ ${urls.length} ek fotoğraf kaydedildi`,
                                        product.id
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

                      {/* Right: Clear Labeled Price, Category & Save/View Buttons */}
                      <div className="grid grid-cols-2 gap-2.5 border-t border-[#EFE7DC] pt-3 sm:flex sm:flex-wrap sm:items-end sm:justify-end lg:border-t-0 lg:pt-0">
                        {/* Price Input */}
                        <div>
                          <label className="block text-[11px] font-bold text-[#6F606C]">
                            Satış Fiyatı (TL)
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
                              void commitStore(
                                next,
                                "✓ Yeni fiyat kaydedildi",
                                product.id
                              );
                            }}
                            className="mt-0.5 h-10 w-full rounded-xl border-2 border-[#321B2D]/35 bg-[#FFFDF8] px-3 text-base font-bold text-[#321B2D] focus:border-[#321B2D] focus:outline-none sm:w-28"
                          />
                        </div>

                        {/* Category Select */}
                        <div>
                          <label className="block text-[11px] font-bold text-[#6F606C]">
                            Kategorisi
                          </label>
                          <div className="relative mt-0.5">
                            <select
                              value={product.categorySlug}
                              aria-label="Ürün kategorisi"
                              onChange={(e) => {
                                const next = structuredClone(store);
                                const newSlug = e.target.value;
                                next.products[originalIndex].categorySlug =
                                  newSlug;
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
                                  "✓ Kategori kaydedildi",
                                  product.id
                                );
                              }}
                              className="ensar-select h-10 w-full truncate rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] pl-2.5 pr-7 text-xs font-semibold text-[#241722] sm:w-40"
                            >
                              {store.categories.map((c) => {
                                const parent = c.parentSlug
                                  ? store.categories.find(
                                      (p) => p.slug === c.parentSlug
                                    )
                                  : null;
                                return (
                                  <option key={c.slug} value={c.slug}>
                                    {parent
                                      ? `↳ ${parent.name} → ${c.name}`
                                      : c.name}
                                  </option>
                                );
                              })}
                            </select>
                            <ChevronDownIcon
                              size={14}
                              className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#5F505C]"
                            />
                          </div>
                        </div>

                        {/* Explicit Save + Details + Preview Buttons */}
                        <div className="col-span-2 flex items-center gap-2 pt-1 sm:pt-0">
                          <button
                            type="button"
                            onClick={() =>
                              commitStore(
                                store,
                                `✓ "${product.name}" kaydedildi`,
                                product.id
                              )
                            }
                            className={`min-h-[40px] flex-1 rounded-xl px-4 text-xs font-bold transition-colors sm:flex-initial ${
                              isJustSaved
                                ? "bg-emerald-700 text-white"
                                : "bg-[#321B2D] text-[#F7F3EB] hover:bg-[#44253D]"
                            }`}
                          >
                            {isJustSaved ? "✓ Kaydedildi" : "Kaydet"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setExpandedProductId(
                                isExpanded ? null : product.id
                              )
                            }
                            className="min-h-[40px] rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3 text-xs font-semibold text-[#241722] hover:border-[#321B2D]"
                          >
                            {isExpanded ? "Gizle ▲" : "Detay ▼"}
                          </button>

                          <Link
                            href={getProductHref(product.slug)}
                            className="inline-flex min-h-[40px] items-center rounded-xl bg-[#E9D9F1] px-3 text-xs font-semibold text-[#321B2D] hover:bg-[#321B2D] hover:text-[#F7F3EB]"
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
                                          "✓ Fotoğraf silindi",
                                          product.id
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
                            <label className="block text-xs font-bold text-[#5F505C]">
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
                            <label className="block text-xs font-bold text-[#5F505C]">
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
                            <span>
                              Ana Sayfa &ldquo;Yeni Gelenler&rdquo; vitrininde
                              göster
                            </span>
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
                                className="rounded-lg bg-rose-700 px-3.5 py-1.5 text-xs font-semibold text-white"
                              >
                                Evet, Sil
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="rounded-lg border border-[#DDD3C6] px-3 py-1.5 text-xs font-semibold"
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
              className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-[#321B2D] px-6 text-sm font-semibold text-[#F7F3EB] hover:bg-[#44253D]"
            >
              <span>
                {showNewCategory ? "− Formu Kapat" : "＋ Yeni Kategori Ekle"}
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
                  <label className="block text-xs font-bold text-[#241722]">
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
                  <label className="block text-xs font-bold text-[#241722]">
                    Üst Kategori (Ana kategoriyse boş bırakın)
                  </label>
                  <div className="relative mt-1">
                    <select
                      value={newCatParent}
                      onChange={(e) => setNewCatParent(e.target.value)}
                      className="ensar-select h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] pl-3 pr-9 text-sm"
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
                <label className="block text-xs font-bold text-[#241722]">
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
                  <span>
                    Ana Sayfada &ldquo;Kategorileri Keşfet&rdquo; vitrininde
                    göster
                  </span>
                </label>
                <button
                  type="submit"
                  className="min-h-[44px] rounded-xl bg-[#321B2D] px-6 text-sm font-semibold text-[#F7F3EB]"
                >
                  ✓ Kategoriyi Kaydet
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {store.categories.map((cat, idx) => {
              const parentCat = cat.parentSlug
                ? store.categories.find((c) => c.slug === cat.parentSlug)
                : null;
              const catProdCount = store.products.filter(
                (p) =>
                  p.categorySlug === cat.slug ||
                  p.extraCategorySlugs?.includes(cat.slug)
              ).length;

              return (
                <div
                  key={cat.slug}
                  className={`ensar-card flex flex-col gap-4 p-4 sm:flex-row sm:items-start ${
                    cat.parentSlug ? "border-l-4 border-l-[#321B2D]" : ""
                  }`}
                >
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-[#E5DCD0] bg-[#FFFDF8]">
                    <img
                      src={cat.image}
                      alt={cat.imageAlt}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute bottom-1 right-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {catProdCount} ürün
                    </span>
                  </div>
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

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setNewProdCat(cat.slug);
                            setProdCatFilter(cat.slug);
                            setShowNewProduct(true);
                            setActiveTab("urunler");
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className="rounded-xl bg-[#321B2D] px-2.5 py-1.5 text-xs font-semibold text-[#F7F3EB] hover:bg-[#44253D]"
                        >
                          ＋ Bu Kategoriye Ürün Ekle
                        </button>
                        <Link
                          href={getCategoryHref(cat.slug)}
                          className="shrink-0 rounded-xl bg-[#E9D9F1] px-2.5 py-1.5 text-xs font-semibold text-[#321B2D]"
                        >
                          Gör ↗
                        </Link>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div>
                        <label className="block text-[11px] font-bold text-[#6F606C]">
                          Kategori Adı
                        </label>
                        <input
                          value={cat.name}
                          onChange={(e) => {
                            const next = structuredClone(store);
                            next.categories[idx].name = e.target.value;
                            void commitStore(next);
                          }}
                          className="mt-0.5 h-10 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3 text-sm font-semibold text-[#241722]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#6F606C]">
                          Üst Kategori (Alt kategori yapmak için seçin)
                        </label>
                        <div className="relative mt-0.5">
                          <select
                            value={cat.parentSlug || ""}
                            onChange={(e) => {
                              const next = structuredClone(store);
                              next.categories[idx].parentSlug =
                                e.target.value || undefined;
                              void commitStore(
                                next,
                                e.target.value
                                  ? "✓ Alt kategori olarak bağlandı"
                                  : "✓ Ana kategori yapıldı"
                              );
                            }}
                            className="ensar-select h-10 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] pl-2.5 pr-7 text-xs font-semibold text-[#241722]"
                          >
                            <option value="">Ana Kategori (Üst Yok)</option>
                            {store.categories
                              .filter(
                                (c) => !c.parentSlug && c.slug !== cat.slug
                              )
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

                    <input
                      value={cat.description}
                      onChange={(e) => {
                        const next = structuredClone(store);
                        next.categories[idx].description = e.target.value;
                        void commitStore(next);
                      }}
                      placeholder="Kategori açıklaması…"
                      className="h-9 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3 text-xs text-[#4C3C49]"
                    />

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-xl bg-[#321B2D] px-3.5 py-1 text-xs font-semibold text-[#F7F3EB]">
                          <span>📷 Fotoğraf Değiştir</span>
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
                                    "✓ Kategori fotoğrafı kaydedildi"
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
                              next.categories[idx].showOnHome =
                                e.target.checked;
                              void commitStore(next);
                            }}
                            className="accent-[#321B2D]"
                          />
                          <span>Ana sayfada göster</span>
                        </label>
                      </div>

                      {confirmDeleteCatSlug === cat.slug ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-rose-700">
                            Silinsin mi?
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const next = structuredClone(store);
                              const fallbackSlug =
                                cat.parentSlug ||
                                next.categories.find(
                                  (c) => c.slug !== cat.slug
                                )?.slug ||
                                "hediyelik-urunler";
                              next.categories = next.categories.filter(
                                (c) => c.slug !== cat.slug
                              );
                              for (const c of next.categories) {
                                if (c.parentSlug === cat.slug) {
                                  c.parentSlug = undefined;
                                }
                              }
                              for (const p of next.products) {
                                if (p.categorySlug === cat.slug) {
                                  p.categorySlug = fallbackSlug;
                                }
                                if (Array.isArray(p.extraCategorySlugs)) {
                                  p.extraCategorySlugs =
                                    p.extraCategorySlugs.filter(
                                      (s) => s !== cat.slug
                                    );
                                }
                              }
                              setConfirmDeleteCatSlug(null);
                              void commitStore(
                                next,
                                `✓ "${cat.name}" kategorisi silindi`
                              );
                            }}
                            className="rounded-lg bg-rose-700 px-3 py-1 text-xs font-semibold text-white"
                          >
                            Evet, Sil
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteCatSlug(null)}
                            className="rounded-lg border border-[#DDD3C6] px-2.5 py-1 text-xs font-semibold"
                          >
                            Vazgeç
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteCatSlug(cat.slug)}
                          className="rounded-lg border border-rose-700/30 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-700 hover:text-white"
                        >
                          🗑 Kategoriyi Sil
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: ANA SAYFA VİTRİN (3 AÇILIŞ SLAYTI)                 */}
      {/* ========================================================= */}
      {activeTab === "vitrin" && (
        <div className="mt-5 space-y-4">
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
                <label className="mt-3 flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#321B2D] px-4 text-xs font-semibold text-[#F7F3EB] hover:bg-[#44253D]">
                  <span>📷 Vitrin Fotoğrafını Değiştir</span>
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
                            "✓ Vitrin fotoğrafı kaydedildi"
                          );
                        }
                      )
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
                  <label className="block text-xs font-bold text-[#241722]">
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
                  <label className="block text-xs font-bold text-[#241722]">
                    Tıklanınca Gideceği Sayfa
                  </label>
                  <div className="relative mt-1.5">
                    <select
                      value={slide.buttonHref}
                      onChange={(e) => {
                        const next = structuredClone(store);
                        next.heroSlides[idx].buttonHref = e.target.value;
                        void commitStore(next);
                      }}
                      className="ensar-select h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] pl-3.5 pr-9 text-sm"
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
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: SİPARİŞLER                                         */}
      {/* ========================================================= */}
      {activeTab === "siparisler" && (
        <div className="mt-5 space-y-4">
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
                      className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#321B2D] px-3.5 text-xs font-semibold text-[#321B2D]"
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
                      className="h-10 rounded-xl bg-[#321B2D] px-4 text-xs font-semibold text-[#F7F3EB]"
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
        <div className="mt-5 space-y-6">
          <div className="ensar-card grid grid-cols-1 gap-6 p-6 sm:grid-cols-2">
            <div>
              <p className="text-sm font-bold text-[#241722]">
                Üst Menü Logosu (Açık Zemin)
              </p>
              <div className="mt-2 flex h-20 items-center justify-center rounded-xl border border-[#E5DCD0] bg-[#F7F3EB] p-3">
                <img
                  src={store.settings.logoLightBg}
                  alt="Üst Menü Logosu"
                  className="max-h-12 w-auto object-contain"
                />
              </div>
              <label className="mt-3 inline-flex min-h-[42px] cursor-pointer items-center rounded-xl bg-[#321B2D] px-5 text-xs font-semibold text-[#F7F3EB]">
                <span>📷 Yeni Logo Yükle</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    handleFilesUpload(e.target.files, "logo-light", (urls) => {
                      if (!urls[0]) return;
                      const next = structuredClone(store);
                      next.settings.logoLightBg = urls[0];
                      void commitStore(next, "✓ Üst menü logosu kaydedildi");
                    })
                  }
                />
              </label>
            </div>

            <div>
              <p className="text-sm font-bold text-[#241722]">
                Alt Menü Logosu (Koyu Zemin)
              </p>
              <div className="mt-2 flex h-20 items-center justify-center rounded-xl bg-[#321B2D] p-3">
                <img
                  src={store.settings.logoDarkBg}
                  alt="Alt Menü Logosu"
                  className="max-h-12 w-auto object-contain"
                />
              </div>
              <label className="mt-3 inline-flex min-h-[42px] cursor-pointer items-center rounded-xl bg-[#321B2D] px-5 text-xs font-semibold text-[#F7F3EB]">
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
                      void commitStore(next, "✓ Alt menü logosu kaydedildi");
                    })
                  }
                />
              </label>
            </div>
          </div>

          <div className="ensar-card grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-[#241722]">
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
              <label className="block text-xs font-bold text-[#241722]">
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
              <label className="block text-xs font-bold text-[#241722]">
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
              <label className="block text-xs font-bold text-[#241722]">
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
              <label className="block text-xs font-bold text-[#241722]">
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
                  className="min-h-[42px] rounded-xl border border-rose-700/40 px-4 text-xs font-semibold text-rose-700"
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
