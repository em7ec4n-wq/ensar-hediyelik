"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { formatPriceTRY, buildWhatsAppCartUrl } from "@/lib/format";
import { loadClientStore } from "@/lib/client-store";
import { WhatsAppIcon } from "@/components/Icons";
import type { StoreSettings } from "@/types/store";

export default function CartPage() {
  const { items, subtotal, hydrated, updateQuantity, removeItem } = useCart();
  const [settings, setSettings] = useState<StoreSettings | null>(null);

  useEffect(() => {
    setSettings(loadClientStore().settings);
  }, []);

  const shippingFee = 0;
  const total = subtotal;

  if (!hydrated) {
    return (
      <div className="ensar-container py-12">
        <p className="text-sm text-[#5F505C]">Sepetiniz yükleniyor…</p>
      </div>
    );
  }

  return (
    <div className="ensar-container py-8 lg:py-12">
      <h1 className="font-heading text-[32px] font-medium text-[#241722] lg:text-[42px]">
        Sepetim
      </h1>

      {items.length === 0 ? (
        <div className="ensar-card mt-6 p-8 text-center">
          <p className="text-base font-medium text-[#241722]">
            Sepetinizde henüz ürün bulunmuyor.
          </p>
          <p className="mt-1.5 text-sm text-[#5F505C]">
            Kategorilere göz atabilir veya Hediyeni Bul aracıyla hediyenizi seçebilirsiniz.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/#hediyeni-bul"
              className="inline-flex min-h-[44px] items-center rounded-full bg-[#321B2D] px-6 text-sm font-semibold text-[#F7F3EB]"
            >
              Hediyeni Bul
            </Link>
            <Link
              href="/kategoriler"
              className="inline-flex min-h-[44px] items-center rounded-full border border-[#321B2D] px-6 text-sm font-semibold text-[#321B2D]"
            >
              Kategorileri İncele
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Items List */}
          <div className="space-y-4 lg:col-span-8">
            {items.map((item) => (
              <div
                key={`${item.productId}-${item.selectedOption || ""}`}
                className="ensar-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-4">
                  <Link
                    href={`/urun/${item.slug}`}
                    className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#241320]"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </Link>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-[#6F606C]">
                      {item.sku}
                    </p>
                    <Link
                      href={`/urun/${item.slug}`}
                      className="text-[16px] font-medium text-[#241722] hover:text-[#321B2D]"
                    >
                      {item.name}
                    </Link>
                    {item.selectedOption && (
                      <p className="mt-0.5 text-xs text-[#5F505C]">
                        Seçenek: {item.selectedOption}
                      </p>
                    )}
                    <p className="mt-1 text-sm font-semibold text-[#321B2D]">
                      {formatPriceTRY(item.unitPrice)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 sm:justify-end">
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
                      className="flex h-11 w-10 items-center justify-center text-base font-medium text-[#241722]"
                    >
                      −
                    </button>
                    <span className="min-w-[32px] text-center text-sm font-semibold text-[#241722]">
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
                      className="flex h-11 w-10 items-center justify-center text-base font-medium text-[#241722]"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-semibold text-[#241722]">
                      {formatPriceTRY(item.unitPrice * item.quantity)}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        removeItem(item.productId, item.selectedOption)
                      }
                      className="mt-1 text-xs font-medium text-rose-700 underline underline-offset-2"
                    >
                      Kaldır
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <aside className="lg:col-span-4">
            <div className="ensar-card p-6">
              <h2 className="font-heading text-2xl font-medium text-[#241722]">
                Sipariş Özeti
              </h2>

              <div className="mt-4 space-y-2.5 text-sm">
                <div className="flex justify-between border-t border-[#E5DCD0] pt-3 text-base font-semibold text-[#241722]">
                  <span>Toplam</span>
                  <span>{formatPriceTRY(total)}</span>
                </div>
              </div>

              <p className="mt-3 text-xs text-[#5F505C]">
                Ödeme adımında ürün fiyatları ve stok durumu sunucudan otomatik olarak yeniden doğrulanır.
              </p>

              <Link
                href="/odeme"
                className="mt-5 inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-[#321B2D] px-6 text-[15px] font-semibold text-[#F7F3EB] transition-colors hover:bg-[#44253D]"
              >
                Ödemeye Geç
              </Link>

              <button
                type="button"
                onClick={() => {
                  const waUrl = buildWhatsAppCartUrl({
                    whatsappNumber: settings?.whatsappNumber || "905413567162",
                    items,
                    subtotal,
                    shippingFee,
                    total,
                    origin:
                      typeof window !== "undefined"
                        ? window.location.origin
                        : undefined,
                  });
                  window.open(waUrl, "_blank", "noopener,noreferrer");
                }}
                className="mt-2.5 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full border border-[#321B2D] bg-[#FFFDF8] px-6 text-[15px] font-semibold text-[#321B2D] transition-colors hover:bg-[#E9D9F1]"
              >
                <WhatsAppIcon size={18} />
                <span>Sepeti WhatsApp&apos;tan Paylaş</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
