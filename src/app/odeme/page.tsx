"use client";

import React from "react";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { useLiveStore } from "@/components/StoreProvider";
import { formatPriceTRY, buildWhatsAppCartUrl } from "@/lib/format";
import { WhatsAppIcon } from "@/components/Icons";

export default function CheckoutRedirectPage() {
  const { items, subtotal } = useCart();
  const { store } = useLiveStore();

  const handleSendWhatsApp = () => {
    const waUrl = buildWhatsAppCartUrl({
      whatsappNumber: store.settings.whatsappNumber || "905413567162",
      items,
      subtotal,
      shippingFee: 0,
      total: subtotal,
      origin:
        typeof window !== "undefined" ? window.location.origin : undefined,
    });
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="ensar-container py-10 lg:py-14">
      <div className="ensar-card mx-auto max-w-xl p-6 text-center sm:p-8">
        <h1 className="font-heading text-[28px] font-medium text-[#241722] sm:text-[34px]">
          WhatsApp ile Hızlı Sipariş
        </h1>
        <p className="mt-2 text-sm text-[#5F505C]">
          Siparişlerinizi doğrudan WhatsApp hattımız üzerinden hızlıca
          tamamlayabilirsiniz. Sepetinizdeki ürün listesi hazır mesaj olarak
          iletilecektir.
        </p>

        {items.length > 0 ? (
          <>
            <div className="mt-5 rounded-xl bg-[#F7F3EB] p-4 text-left text-sm">
              <ul className="space-y-2">
                {items.map((item, idx) => (
                  <li key={idx} className="flex justify-between gap-2">
                    <span>
                      {item.name}{" "}
                      {item.selectedOption ? `(${item.selectedOption})` : ""} ×{" "}
                      {item.quantity}
                    </span>
                    <span className="shrink-0 font-semibold">
                      {formatPriceTRY(item.unitPrice * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex justify-between border-t border-[#E5DCD0] pt-3 text-base font-bold text-[#321B2D]">
                <span>Toplam</span>
                <span>{formatPriceTRY(subtotal)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="mt-6 inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full bg-[#321B2D] px-6 text-[15px] font-semibold text-[#F7F3EB] hover:bg-[#44253D]"
            >
              <WhatsAppIcon size={19} />
              <span>Sepeti WhatsApp&apos;tan Gönder</span>
            </button>
          </>
        ) : (
          <Link
            href="/kategori/yilbasi/"
            className="mt-6 inline-flex min-h-[46px] items-center rounded-full bg-[#321B2D] px-6 text-sm font-semibold text-[#F7F3EB]"
          >
            Ürünleri İncele
          </Link>
        )}
      </div>
    </div>
  );
}
