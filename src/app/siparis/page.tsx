"use client";

import React, { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { useLiveStore } from "@/components/StoreProvider";
import {
  decodeSiparisQuery,
  encodeSiparisQuery,
  formatTRYExact,
  generateSiparisPdfBlob,
  type SiparisPayload,
} from "@/lib/order-pdf";
import { buildWhatsAppGeneralUrl } from "@/lib/format";
import { WhatsAppIcon } from "@/components/Icons";

function SiparisListesiInner() {
  const searchParams = useSearchParams();
  const encodedData = searchParams.get("d") || "";
  const { items: cartItems } = useCart();
  const { store } = useLiveStore();
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const payload: SiparisPayload = useMemo(() => {
    if (encodedData) {
      const decoded = decodeSiparisQuery(
        encodedData,
        store.products,
        store.categories
      );
      if (decoded && decoded.entries.length > 0) {
        return decoded;
      }
    }

    const catMap = new Map(store.categories.map((c) => [c.slug, c.name]));
    return {
      createdAt: new Date().toLocaleString("tr-TR").slice(0, 16),
      payment: "-",
      address: "-",
      entries: cartItems.map((item) => {
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
    };
  }, [encodedData, store.products, store.categories, cartItems]);

  const grandTotal = payload.entries.reduce(
    (sum, e) => sum + e.unitPrice * e.quantity,
    0
  );

  const handleDownloadOrSharePdf = async () => {
    if (payload.entries.length === 0) return;
    setGeneratingPdf(true);
    try {
      const blob = await generateSiparisPdfBlob(
        payload,
        typeof window !== "undefined"
          ? `${window.location.origin}/siparis`
          : "https://ensar-hediyelik.onizlememerkezi.com/siparis"
      );
      const fileName = `Ensar-Hediyelik-Siparis-Listesi.pdf`;
      const pdfFile = new File([blob], fileName, { type: "application/pdf" });

      // Always trigger download so user has the PDF file
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);

      // On mobile browsers supporting Web Share API with files, also open native share sheet (WhatsApp!)
      if (
        typeof navigator !== "undefined" &&
        navigator.canShare &&
        navigator.canShare({ files: [pdfFile] })
      ) {
        try {
          await navigator.share({
            title: "Sipariş Listesi",
            text: `Sipariş Listesi (${payload.entries.length} Ürün - ${formatTRYExact(grandTotal)})`,
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

  const handleSendWhatsAppLink = () => {
    const code =
      encodedData ||
      encodeSiparisQuery({
        items: cartItems,
        payment: payload.payment,
        address: payload.address,
      });
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://ensar-hediyelik.onizlememerkezi.com";
    const visualUrl = `${origin}/siparis/?d=${code}`;

    const lines = [
      "Merhaba, Sipariş Listem aşağıdadır:",
      `📄 Görselli Sipariş Listesi & PDF: ${visualUrl}`,
      "",
      `Ürün Sayısı: ${payload.entries.length}`,
      `Genel Toplam: ${formatTRYExact(grandTotal)}`,
      `Ödeme: ${payload.payment}`,
      `Adres: ${payload.address}`,
      "",
      ...payload.entries.map(
        (e, idx) =>
          `${idx + 1}. ${e.name} [${e.sku}] — Adet: ${e.quantity} × ${formatTRYExact(e.unitPrice)} = ${formatTRYExact(e.unitPrice * e.quantity)}`
      ),
    ];

    const waUrl = buildWhatsAppGeneralUrl(
      store.settings.whatsappNumber || "905413567162",
      lines.join("\n")
    );
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  if (payload.entries.length === 0) {
    return (
      <div className="ensar-container py-14 text-center">
        <div className="ensar-card mx-auto max-w-md p-8">
          <h1 className="font-heading text-2xl font-medium text-[#241722]">
            Sipariş Listesi Boş
          </h1>
          <p className="mt-2 text-sm text-[#5F505C]">
            Sipariş listesi oluşturmak için önce sepetinize ürün ekleyin.
          </p>
          <Link
            href="/kategori/yilbasi/"
            className="mt-5 inline-flex min-h-[44px] items-center rounded-full bg-[#321B2D] px-6 text-sm font-semibold text-[#F7F3EB]"
          >
            Ürünleri İncele
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-6 text-[#111111] sm:py-10">
      <div className="mx-auto max-w-[820px] px-4 sm:px-8">
        {/* Top Action Bar (Hidden when printing) */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E5DCD0] bg-[#F7F3EB] p-3.5 print:hidden">
          <Link
            href="/sepet/"
            className="text-xs font-semibold text-[#321B2D] hover:underline sm:text-sm"
          >
            ← Sepete Dön
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadOrSharePdf}
              disabled={generatingPdf}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#321B2D] px-4 text-xs font-semibold text-[#F7F3EB] shadow-xs hover:bg-[#44253D] disabled:opacity-50 sm:text-sm"
            >
              <span>
                {generatingPdf
                  ? "PDF Hazırlanıyor…"
                  : "📄 PDF İndir / WhatsApp'ta Paylaş"}
              </span>
            </button>

            <button
              type="button"
              onClick={handleSendWhatsAppLink}
              className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-[#321B2D] bg-white px-4 text-xs font-semibold text-[#321B2D] hover:bg-[#E9D9F1] sm:text-sm"
            >
              <WhatsAppIcon size={16} />
              <span>WhatsApp&apos;tan Gönder</span>
            </button>
          </div>
        </div>

        {/* EXACT PDF HEADER LAYOUT */}
        <div className="text-center">
          <h1 className="text-[26px] font-bold tracking-tight text-[#111111] sm:text-[30px]">
            Sipariş Listesi
          </h1>
          <p className="mt-1.5 text-[16px] font-bold text-[#111111]">
            Ürün Sayısı: {payload.entries.length}
          </p>
          <p className="mt-0.5 text-[18px] font-bold text-[#111111]">
            Genel Toplam: {formatTRYExact(grandTotal)}
          </p>
          <p className="mt-1 text-[13px] font-bold text-[#222222]">
            Ödeme: {payload.payment || "-"}
          </p>
          <p className="text-[13px] font-bold text-[#222222]">
            Adres: {payload.address || "-"}
          </p>
        </div>

        {/* EXACT PDF PRODUCT CARDS LIST */}
        <div className="mt-6 space-y-3">
          {payload.entries.map((item, idx) => (
            <div
              key={`${item.sku}-${idx}`}
              className="flex items-center gap-4 rounded-[12px] border border-[#E2E2E2] bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
            >
              <div className="h-[84px] w-[84px] shrink-0 overflow-hidden rounded-[10px] border border-[#F0F0F0] bg-white p-1">
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="min-w-0 flex-1 text-[13px] leading-[1.45] text-[#111111]">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#757575]">
                  {item.categoryName}
                  {item.sku ? ` · ${item.sku}` : ""}
                </p>
                <p className="truncate text-[15px] font-bold text-[#111111]">
                  {item.name}
                  {item.selectedOption ? ` (${item.selectedOption})` : ""}
                </p>
                <p className="font-bold">
                  Fiyat: {formatTRYExact(item.unitPrice)}
                </p>
                <p className="font-bold">Adet: {item.quantity}</p>
                <p className="font-bold">
                  Toplam: {formatTRYExact(item.unitPrice * item.quantity)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* PDF Footer */}
        <div className="mt-8 flex items-center justify-between border-t border-[#EEEEEE] pt-4 text-xs text-[#888888]">
          <span>https://ensar-hediyelik.onizlememerkezi.com/siparis</span>
          <span>{payload.createdAt}</span>
        </div>
      </div>
    </div>
  );
}

export default function SiparisListesiPage() {
  return (
    <Suspense
      fallback={
        <div className="ensar-container py-12">
          <p className="text-sm text-[#5F505C]">Sipariş listesi hazırlanıyor…</p>
        </div>
      }
    >
      <SiparisListesiInner />
    </Suspense>
  );
}
