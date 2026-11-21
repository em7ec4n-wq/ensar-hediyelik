import React from "react";
import type { Metadata } from "next";
import { readStore } from "@/lib/store-server";
import { buildWhatsAppGeneralUrl } from "@/lib/format";
import { PhoneIcon, WhatsAppIcon } from "@/components/Icons";

export const metadata: Metadata = {
  title: "İletişim",
  description:
    "Ensar Hediyelik iletişim bilgileri, WhatsApp sipariş ve ürün destek hattı.",
  alternates: { canonical: "/iletisim" },
};

export default function ContactPage() {
  const store = readStore();
  const { settings } = store;
  const waHref = buildWhatsAppGeneralUrl(
    settings.whatsappNumber,
    "Merhaba, Ensar Hediyelik iletişim sayfasından ulaşıyorum."
  );

  return (
    <div className="ensar-container py-8 lg:py-12">
      <div className="max-w-2xl">
        <h1 className="font-heading text-[32px] font-medium text-[#241722] lg:text-[42px]">
          İletişim
        </h1>
        <p className="mt-2 text-[15px] text-[#5F505C]">
          Ürünler, stok durumu, kurumsal toplu hediye siparişleri veya teslimat
          hakkında bize doğrudan ulaşabilirsiniz.
        </p>
      </div>

      <div className="mt-7 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="ensar-card space-y-5 p-6 lg:col-span-6">
          <h2 className="font-heading text-2xl font-medium text-[#241722]">
            Doğrudan İletişim Kanalları
          </h2>

          <div className="space-y-3 text-sm text-[#4C3C49]">
            <p>
              <strong className="block text-[#241722]">Telefon &amp; WhatsApp</strong>
              <a
                href={`tel:${settings.phoneDisplay.replace(/\s/g, "")}`}
                className="text-base font-semibold text-[#321B2D] hover:underline"
              >
                {settings.phoneDisplay}
              </a>
            </p>
            <p>
              <strong className="block text-[#241722]">E-posta</strong>
              <a
                href={`mailto:${settings.email}`}
                className="font-medium text-[#321B2D] hover:underline"
              >
                {settings.email}
              </a>
            </p>
            <p>
              <strong className="block text-[#241722]">Çalışma Saatleri</strong>
              {settings.workingHours}
            </p>
            <p>
              <strong className="block text-[#241722]">Adres</strong>
              {settings.address}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#321B2D] px-6 text-sm font-semibold text-[#F7F3EB] hover:bg-[#44253D]"
            >
              <WhatsAppIcon size={18} />
              <span>WhatsApp&apos;tan Yaz</span>
            </a>
            <a
              href={`tel:${settings.phoneDisplay.replace(/\s/g, "")}`}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[#321B2D] px-6 text-sm font-semibold text-[#321B2D] hover:bg-[#E9D9F1]"
            >
              <PhoneIcon size={18} />
              <span>Telefonla Ara</span>
            </a>
          </div>
        </div>

        <div className="ensar-card space-y-4 p-6 lg:col-span-6">
          <h2 className="font-heading text-2xl font-medium text-[#241722]">
            Sipariş &amp; Destek Bilgileri
          </h2>
          <div className="space-y-3 text-sm leading-relaxed text-[#4C3C49]">
            <p>
              <strong className="text-[#241722]">Teslimat:</strong>{" "}
              {settings.deliverySummary}
            </p>
            <p>
              <strong className="text-[#241722]">İade &amp; Değişim:</strong>{" "}
              {settings.returnSummary}
            </p>
            <p>
              <strong className="text-[#241722]">Ödeme Yöntemleri:</strong>{" "}
              {settings.paymentSummary}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
