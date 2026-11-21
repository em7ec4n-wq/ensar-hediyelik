"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Product, StoreSettings } from "@/types/store";
import { formatPriceTRY, buildWhatsAppProductUrl } from "@/lib/format";
import { useCart } from "./CartProvider";
import { useLiveStore } from "./StoreProvider";
import { BagIcon, WhatsAppIcon } from "./Icons";

interface ProductDetailClientProps {
  product: Product;
  settings: StoreSettings;
  categoryName: string;
  parentCategorySlug?: string;
  parentCategoryName?: string;
}

function ProductDetailInner({
  product: initialProduct,
  settings: initialSettings,
  categoryName: initialCategoryName,
  parentCategorySlug,
  parentCategoryName,
}: ProductDetailClientProps) {
  const { store } = useLiveStore();
  const product =
    store.products.find(
      (p) => p.id === initialProduct.id || p.slug === initialProduct.slug
    ) || initialProduct;
  const settings = store.settings || initialSettings;
  const categoryName =
    store.categories.find((c) => c.slug === product.categorySlug)?.name ||
    initialCategoryName;

  const searchParams = useSearchParams();
  const isPreview = searchParams.get("onizleme") === "1";

  const { addItem } = useCart();
  const gallery = product.gallery?.length ? product.gallery : [product.image];
  const [activeImage, setActiveImage] = useState(gallery[0]);

  React.useEffect(() => {
    setActiveImage(product.gallery?.[0] || product.image);
  }, [product.image, product.gallery]);

  const primaryOption = product.options?.[0];
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [quantityInput, setQuantityInput] = useState<string>("1");
  const [optionError, setOptionError] = useState<string>("");
  const [qtyError, setQtyError] = useState<string>("");
  const [addedFeedback, setAddedFeedback] = useState(false);

  const hasValidPrice =
    typeof product.price === "number" && product.price > 0;
  const canPurchase = hasValidPrice;

  const parseQuantity = (): number | null => {
    const parsed = Number(quantityInput);
    if (!Number.isInteger(parsed) || parsed < 1) {
      return null;
    }
    return parsed;
  };

  const validateSelection = (): { valid: boolean; qty: number } => {
    let valid = true;
    setOptionError("");
    setQtyError("");

    if (primaryOption?.required && !selectedOption) {
      setOptionError("Lütfen ürün seçeneğini belirleyin.");
      valid = false;
    }

    const qty = parseQuantity();
    if (qty === null) {
      setQtyError("Adet pozitif bir tam sayı olmalıdır.");
      valid = false;
      return { valid: false, qty: 1 };
    }

    return { valid, qty };
  };

  const handleAddToCart = () => {
    const { valid, qty } = validateSelection();
    if (!valid) return;

    if (!hasValidPrice || product.price === null) {
      setQtyError("Bu ürün için satış fiyatı henüz tanımlanmadı.");
      return;
    }

    addItem({
      productId: product.id,
      slug: product.slug,
      sku: product.sku,
      name: product.name,
      image: product.image,
      unitPrice: product.price,
      stock: typeof product.stock === "number" && product.stock > 0 ? product.stock : 999,
      quantity: qty,
      selectedOption: selectedOption || undefined,
    });
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 3000);
  };

  const handleWhatsAppAsk = () => {
    const { valid, qty } = validateSelection();
    if (!valid) return;

    const productUrl =
      typeof window !== "undefined"
        ? window.location.href
        : `https://www.ensarhediyelik.com.tr/urun/${product.slug}`;

    const waUrl = buildWhatsAppProductUrl({
      whatsappNumber: settings.whatsappNumber,
      productName: product.name,
      selectedOption: selectedOption || undefined,
      quantity: qty,
      productUrl,
    });

    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  const stepQty = (delta: number) => {
    const current = parseQuantity() ?? 1;
    const maxVal =
      typeof product.stock === "number" && product.stock > 0
        ? product.stock
        : 99;
    const next = Math.min(maxVal, Math.max(1, current + delta));
    setQuantityInput(String(next));
    setQtyError("");
  };

  const previewSuffix = isPreview ? "?onizleme=1" : "";

  return (
    <div className="ensar-container py-8 lg:py-12">
      {/* Breadcrumb */}
      <nav aria-label="Sayfa yolu" className="text-xs text-[#6F606C]">
        <Link href="/" className="hover:text-[#321B2D]">
          Ana Sayfa
        </Link>
        {parentCategorySlug && parentCategoryName && (
          <>
            <span className="mx-2">/</span>
            <Link
              href={`/kategori/${parentCategorySlug}${previewSuffix}`}
              className="hover:text-[#321B2D]"
            >
              {parentCategoryName}
            </Link>
          </>
        )}
        <span className="mx-2">/</span>
        <Link
          href={`/kategori/${product.categorySlug}${previewSuffix}`}
          className="hover:text-[#321B2D]"
        >
          {categoryName}
        </Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-[#241722]">{product.name}</span>
      </nav>

      {isPreview && !product.published && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#321B2D]/20 bg-[#E9D9F1]/75 px-4 py-3 text-sm text-[#321B2D]">
          <span>
            <strong>Taslak — Yetkili Önizleme:</strong> Bu ürün henüz halka açık
            katalogda yayınlanmamıştır. Satış fiyatı ve stok yönetim panelinden
            girildiğinde yayına alınabilir.
          </span>
          <Link
            href="/yonetim"
            className="rounded-full bg-[#321B2D] px-4 py-1.5 text-xs font-semibold text-[#F7F3EB]"
          >
            Yönetim Panelinde Düzenle
          </Link>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
        {/* Left: Gallery */}
        <div className="lg:col-span-6">
          <div className="ensar-card relative overflow-hidden bg-[#241320]">
            <div className="aspect-[4/3.6] w-full">
              <img
                src={activeImage}
                alt={product.imageAlt}
                className="h-full w-full object-contain bg-[#FFFDF8]"
              />
            </div>
            {product.isConceptImage && (
              <span className="absolute bottom-3 right-3 rounded-full bg-black/50 px-3 py-1 text-xs italic text-[#F7F3EB]">
                Konsept görsel
              </span>
            )}
          </div>

          {gallery.length > 1 && (
            <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
              {gallery.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImage(img)}
                  aria-label={`Ürün görseli ${i + 1}`}
                  className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-[#FFFDF8] transition-all ${
                    activeImage === img
                      ? "border-[#321B2D]"
                      : "border-[#E5DCD0] opacity-75 hover:opacity-100"
                  }`}
                >
                  <img
                    src={img}
                    alt={`${product.name} görünüm ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Info, Options, Cart & Tool 2 (WhatsApp) */}
        <div className="lg:col-span-6">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-[#E9D9F1] px-3 py-1 font-semibold text-[#321B2D]">
              {categoryName}
            </span>
            <span className="rounded-full border border-[#E5DCD0] bg-[#FFFDF8] px-3 py-1 font-medium text-[#5F505C]">
              Ürün Kodu: {product.sku}
            </span>
            {gallery.length > 1 && (
              <span className="rounded-full border border-[#E5DCD0] bg-[#FFFDF8] px-3 py-1 font-medium text-[#5F505C]">
                {gallery.length} Görsel
              </span>
            )}
          </div>

          <h1 className="font-heading mt-3 text-[30px] font-medium leading-tight text-[#241722] lg:text-[40px]">
            {product.name}
          </h1>

          {/* Verified Price */}
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <p
              className={`font-semibold ${
                hasValidPrice
                  ? "text-[28px] text-[#321B2D]"
                  : "text-base text-[#6F606C]"
              }`}
            >
              {formatPriceTRY(product.price)}
            </p>
          </div>

          {product.description && (
            <p className="mt-4 text-[15px] leading-relaxed text-[#4C3C49]">
              {product.description}
            </p>
          )}

          {/* Product Options */}
          {primaryOption && (
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-[#241722]">
                  {primaryOption.name}
                  {primaryOption.required && (
                    <span className="ml-1 text-rose-700">*</span>
                  )}
                </label>
                {selectedOption && (
                  <span className="text-xs font-medium text-[#5F505C]">
                    Seçili: {selectedOption}
                  </span>
                )}
              </div>

              <div className="mt-2.5 flex flex-wrap gap-2.5">
                {primaryOption.values.map((val) => {
                  const active = selectedOption === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        setSelectedOption(val);
                        setOptionError("");
                      }}
                      aria-pressed={active}
                      className={`min-h-[44px] rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                        active
                          ? "border-[#321B2D] bg-[#321B2D] text-[#F7F3EB]"
                          : "border-[#DDD3C6] bg-[#FFFDF8] text-[#241722] hover:border-[#321B2D]"
                      }`}
                    >
                      {val}
                    </button>
                  );
                })}
              </div>

              {optionError && (
                <p
                  role="alert"
                  className="mt-2 text-sm font-medium text-rose-700"
                >
                  {optionError}
                </p>
              )}
            </div>
          )}

          {/* Quantity Stepper */}
          <div className="mt-6">
            <label
              htmlFor="product-quantity"
              className="block text-sm font-semibold text-[#241722]"
            >
              Adet
            </label>
            <div className="mt-2 flex items-center gap-3">
              <div className="inline-flex items-center rounded-full border border-[#DDD3C6] bg-[#FFFDF8]">
                <button
                  type="button"
                  onClick={() => stepQty(-1)}
                  aria-label="Adeti azalt"
                  className="flex h-11 w-11 items-center justify-center rounded-l-full text-lg font-medium text-[#241722] hover:bg-[#F7F3EB]"
                >
                  −
                </button>
                <input
                  id="product-quantity"
                  type="number"
                  min={1}
                  step={1}
                  value={quantityInput}
                  onChange={(e) => {
                    setQuantityInput(e.target.value);
                    setQtyError("");
                  }}
                  className="h-11 w-14 bg-transparent text-center text-sm font-semibold text-[#241722] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => stepQty(1)}
                  aria-label="Adeti artır"
                  className="flex h-11 w-11 items-center justify-center rounded-r-full text-lg font-medium text-[#241722] hover:bg-[#F7F3EB]"
                >
                  +
                </button>
              </div>
            </div>
            {qtyError && (
              <p role="alert" className="mt-2 text-sm font-medium text-rose-700">
                {qtyError}
              </p>
            )}
          </div>

          {/* Primary Actions: Add to Cart + Tool 2 (WhatsApp'tan Sor) */}
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!canPurchase}
              className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full bg-[#321B2D] px-6 py-3 text-[15px] font-semibold text-[#F7F3EB] transition-colors hover:bg-[#44253D] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <BagIcon size={19} />
              <span>{hasValidPrice ? "Sepete Ekle" : "Fiyat Bekleniyor"}</span>
            </button>

            <button
              type="button"
              onClick={handleWhatsAppAsk}
              className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full border border-[#321B2D] bg-[#FFFDF8] px-6 py-3 text-[15px] font-semibold text-[#321B2D] transition-colors hover:bg-[#E9D9F1]"
            >
              <WhatsAppIcon size={19} />
              <span>WhatsApp&apos;tan Sor</span>
            </button>
          </div>

          {addedFeedback && (
            <div
              role="status"
              className="mt-4 flex items-center justify-between rounded-2xl border border-emerald-900/20 bg-emerald-50 px-4 py-3 text-sm text-emerald-950"
            >
              <span>Ürün sepetinize eklendi.</span>
              <Link
                href="/sepet"
                className="font-semibold underline underline-offset-2"
              >
                Sepete Git →
              </Link>
            </div>
          )}

          {/* Tags & Delivery Note */}
          <div className="ensar-card mt-7 space-y-3 p-4 text-sm text-[#4C3C49]">
            <p>
              <strong className="text-[#241722]">Teslimat:</strong>{" "}
              {settings.deliverySummary}
            </p>
            <p>
              <strong className="text-[#241722]">İade ve Değişim:</strong>{" "}
              {settings.returnSummary}
            </p>
            {product.occasions.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-xs font-semibold text-[#241722]">
                  Uygun Günler:
                </span>
                {product.occasions.map((o) => (
                  <span
                    key={o}
                    className="rounded-full bg-[#F7F3EB] px-2.5 py-0.5 text-xs text-[#4C3C49]"
                  >
                    {o}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductDetailClient(props: ProductDetailClientProps) {
  return (
    <Suspense
      fallback={
        <div className="ensar-container py-12">
          <p className="text-sm text-[#5F505C]">Ürün yükleniyor…</p>
        </div>
      }
    >
      <ProductDetailInner {...props} />
    </Suspense>
  );
}
