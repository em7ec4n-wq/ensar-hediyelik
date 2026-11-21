"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { useLiveStore } from "@/components/StoreProvider";
import {
  encodeSiparisQuery,
  formatTRYExact,
  generateSiparisPdfBlob,
  type SiparisPayload,
} from "@/lib/order-pdf";
import { buildWhatsAppGeneralUrl } from "@/lib/format";
import { WhatsAppIcon } from "@/components/Icons";
import { getProductHref } from "@/components/ProductCard";

export default function CartPage() {
  const { items, subtotal, hydrated, updateQuantity, removeItem } = useCart();
  const { store } = useLiveStore();

  const [paymentNote, setPaymentNote] = useState("");
  const [addressNote, setAddressNote] = useState("");
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const catMap = new Map(store.categories.map((c) => [c.slug, c.name]));

  const buildCurrentPayload = (): SiparisPayload => ({
    createdAt: new Date().toLocaleString("tr-TR").slice(0, 16),
    payment: paymentNote.trim() || "-",
    address: addressNote.trim() || "-",
    entries: items.map((item) => {
      const prod = store.products.find((p) => p.id === item.productId);
      const catName = prod
        ? catMap.get(prod.categorySlug) || "HEDİYELİK"
        : "HEDİYELİK";
      return {
        sku: item.sku,
        name: item.name,
        categoryName: catName.toLocaleUpperCase("tr-TR"),
        image: item.image,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        selectedOption: item.selectedOption,
      };
    }),
  });

  const handleDownloadAndSharePdf = async () => {
    if (items.length === 0) return;
    setGeneratingPdf(true);
    try {
      const payload = buildCurrentPayload();
      const blob = await generateSiparisPdfBlob(
        payload,
        typeof window !== "undefined"
          ? `${window.location.origin}/siparis`
          : "https://ensar-hediyelik.onizlememerkezi.com/siparis"
      );
      const fileName = `Ensar-Hediyelik-Siparis-Listesi.pdf`;
      const pdfFile = new File([blob], fileName, { type: "application/pdf" });

      // Download PDF file
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);

      // On mobile phones supporting file sharing, open share sheet so user can tap WhatsApp directly with the PDF attached
      if (
        typeof navigator !== "undefined" &&
        navigator.canShare &&
        navigator.canShare({ files: [pdfFile] })
      ) {
        try {
          await navigator.share({
            title: "Sipariş Listesi",
            text: `Sipariş Listesi (${items.length} Ürün - ${formatTRYExact(subtotal)})`,
            files: [pdfFile],
          });
        } catch {
          // user closed share sheet
        }
      }
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleSendWhatsAppOrder = () => {
    if (items.length === 0) return;
    const payload = buildCurrentPayload();
    const encoded = encodeSiparisQuery({
      items,
      payment: payload.payment,
      address: payload.address,
    });
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://ensar-hediyelik.onizlememerkezi.com";
    const siparisUrl = `${origin}/siparis/?d=${encoded}`;

    const lines = [
      "Merhaba, Sipariş Listem aşağıdadır:",
      `📄 Görselli Sipariş Listesi (PDF): ${siparisUrl}`,
      "",
      `Ürün Sayısı: ${items.length}`,
      `Genel Toplam: ${formatTRYExact(subtotal)}`,
      `Ödeme: ${payload.payment}`,
      `Adres: ${payload.address}`,
      "",
      ...payload.entries.map(
        (e, idx) =>
          `${idx + 1}. ${e.name} [${e.sku}]\n   Fiyat: ${formatTRYExact(e.unitPrice)} | Adet: ${e.quantity} | Toplam: ${formatTRYExact(e.unitPrice * e.quantity)}`
      ),
    ];

    const waUrl = buildWhatsAppGeneralUrl(
      store.settings.whatsappNumber || "905413567162",
      lines.join("\n")
    );
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  if (!hydrated) {
    return (
      <div className="ensar-container py-12">
        <p className="text-sm text-[#5F505C]">Sepetiniz yükleniyor…</p>
      </div>
    );
  }

  return (
    <div className="ensar-container py-8 lg:py-12">
      {items.length === 0 ? (
        <div className="ensar-card mt-2 p-8 text-center">
          <h1 className="font-heading text-[28px] font-medium text-[#241722]">
            Sipariş Listeniz Boş
          </h1>
          <p className="mt-1.5 text-sm text-[#5F505C]">
            Kategorilere göz atarak beğendiğiniz ürünleri sipariş listenize
            ekleyebilirsiniz.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/kategori/yilbasi/"
              className="inline-flex min-h-[44px] items-center rounded-full bg-[#321B2D] px-6 text-sm font-semibold text-[#F7F3EB]"
            >
              Yılbaşı Kataloğunu İncele
            </Link>
            <Link
              href="/kategoriler/"
              className="inline-flex min-h-[44px] items-center rounded-full border border-[#321B2D] px-6 text-sm font-semibold text-[#321B2D]"
            >
              Tüm Kategoriler
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: Exact PDF-Style "Sipariş Listesi" Cards */}
          <div className="lg:col-span-8">
            <div className="rounded-2xl border border-[#E2E2E2] bg-white p-4 shadow-xs sm:p-6">
              {/* Centered Header just like the sample PDF */}
              <div className="border-b border-[#EFEFEF] pb-4 text-center">
                <h1 className="text-[24px] font-bold text-[#111111] sm:text-[28px]">
                  Sipariş Listesi
                </h1>
                <p className="mt-1 text-[15px] font-bold text-[#111111]">
                  Ürün Sayısı: {items.length}
                </p>
                <p className="mt-0.5 text-[17px] font-bold text-[#111111]">
                  Genel Toplam: {formatTRYExact(subtotal)}
                </p>
                <p className="mt-1 text-xs font-bold text-[#333333]">
                  Ödeme: {paymentNote.trim() || "-"}
                </p>
                <p className="text-xs font-bold text-[#333333]">
                  Adres: {addressNote.trim() || "-"}
                </p>
              </div>

              {/* Cards Stack */}
              <div className="mt-4 space-y-3">
                {items.map((item) => {
                  const prod = store.products.find(
                    (p) => p.id === item.productId
                  );
                  const catName = (
                    prod
                      ? catMap.get(prod.categorySlug) || "HEDİYELİK"
                      : "HEDİYELİK"
                  ).toLocaleUpperCase("tr-TR");

                  return (
                    <div
                      key={`${item.productId}-${item.selectedOption || ""}`}
                      className="flex flex-col gap-3 rounded-[12px] border border-[#E2E2E2] bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-3.5">
                        <Link
                          href={getProductHref(item.slug)}
                          className="h-[80px] w-[80px] shrink-0 overflow-hidden rounded-[10px] border border-[#F0F0F0] bg-white p-1"
                        >
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full object-contain"
                          />
                        </Link>
                        <div className="min-w-0 text-[13px] leading-[1.42] text-[#111111]">
                          <p className="text-[11px] font-bold uppercase tracking-wide text-[#757575]">
                            {catName} · {item.sku}
                          </p>
                          <Link
                            href={getProductHref(item.slug)}
                            className="block truncate text-[15px] font-bold text-[#111111] hover:text-[#321B2D]"
                          >
                            {item.name}
                            {item.selectedOption
                              ? ` (${item.selectedOption})`
                              : ""}
                          </Link>
                          <p className="font-bold">
                            Fiyat: {formatTRYExact(item.unitPrice)}
                          </p>
                          <p className="font-bold">Adet: {item.quantity}</p>
                          <p className="font-bold">
                            Toplam:{" "}
                            {formatTRYExact(item.unitPrice * item.quantity)}
                          </p>
                        </div>
                      </div>

                      {/* Quantity & Remove Controls */}
                      <div className="flex items-center justify-between gap-3 border-t border-[#F4F4F4] pt-2.5 sm:justify-end sm:border-t-0 sm:pt-0">
                        <div className="inline-flex items-center rounded-full border border-[#DDD3C6] bg-[#F7F3EB]">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.productId,
                                item.selectedOption,
                                item.quantity - 1
                              )
                            }
                            aria-label="Miktarı azalt"
                            className="flex h-9 w-9 items-center justify-center text-base font-bold text-[#241722]"
                          >
                            −
                          </button>
                          <span className="min-w-[28px] text-center text-xs font-bold text-[#241722]">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.productId,
                                item.selectedOption,
                                item.quantity + 1
                              )
                            }
                            aria-label="Miktarı artır"
                            className="flex h-9 w-9 items-center justify-center text-base font-bold text-[#241722]"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeItem(item.productId, item.selectedOption)
                          }
                          className="text-xs font-semibold text-rose-700 underline"
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: PDF Download & WhatsApp Order Panel */}
          <aside className="lg:col-span-4">
            <div className="ensar-card space-y-4 bg-white p-5 sm:p-6">
              <h2 className="font-heading text-2xl font-medium text-[#241722]">
                Siparişi Gönder / PDF Al
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#241722]">
                    Ödeme Notu (İsteğe Bağlı)
                  </label>
                  <input
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    placeholder="Örn: Havale / Nakit (Boşsa - görünür)"
                    className="mt-1 h-10 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3 text-xs text-[#241722]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#241722]">
                    Firma / Adres Notu (İsteğe Bağlı)
                  </label>
                  <input
                    value={addressNote}
                    onChange={(e) => setAddressNote(e.target.value)}
                    placeholder="Örn: İstanbul (Boşsa - görünür)"
                    className="mt-1 h-10 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3 text-xs text-[#241722]"
                  />
                </div>
              </div>

              <div className="rounded-xl bg-[#F7F3EB] p-3.5 text-sm">
                <div className="flex justify-between font-medium text-[#4C3C49]">
                  <span>Ürün Çeşidi</span>
                  <span className="font-bold text-[#241722]">
                    {items.length}
                  </span>
                </div>
                <div className="mt-1.5 flex justify-between border-t border-[#E5DCD0] pt-2 text-base font-bold text-[#321B2D]">
                  <span>Genel Toplam</span>
                  <span>{formatTRYExact(subtotal)}</span>
                </div>
              </div>

              {/* 1. Primary Action: Generate Real PDF & Share to WhatsApp */}
              <button
                type="button"
                onClick={handleDownloadAndSharePdf}
                disabled={generatingPdf}
                className="inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full bg-[#321B2D] px-6 text-[14px] font-semibold text-[#F7F3EB] shadow-sm transition-colors hover:bg-[#44253D] disabled:opacity-50"
              >
                <span>
                  {generatingPdf
                    ? "Sipariş PDF'i Hazırlanıyor…"
                    : "📄 Sipariş Listesi PDF İndir / Paylaş"}
                </span>
              </button>

              {/* 2. Secondary Action: Send Visual Order Link + List via WhatsApp */}
              <button
                type="button"
                onClick={handleSendWhatsAppOrder}
                className="inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full border-2 border-[#321B2D] bg-white px-6 text-[14px] font-semibold text-[#321B2D] transition-colors hover:bg-[#E9D9F1]"
              >
                <WhatsAppIcon size={18} />
                <span>WhatsApp&apos;tan Sipariş Gönder</span>
              </button>

              <Link
                href={`/siparis/?d=${encodeSiparisQuery({
                  items,
                  payment: paymentNote.trim() || "-",
                  address: addressNote.trim() || "-",
                })}`}
                className="block text-center text-xs font-semibold text-[#321B2D] underline"
              >
                Tam Sayfa Sipariş Listesi Görünümünü Aç →
              </Link>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
