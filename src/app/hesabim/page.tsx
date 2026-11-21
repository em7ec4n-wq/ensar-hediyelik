"use client";

import React from "react";
import Link from "next/link";
import { useLiveStore } from "@/components/StoreProvider";
import { buildWhatsAppGeneralUrl } from "@/lib/format";
import { WhatsAppIcon } from "@/components/Icons";

export default function AccountPage() {
  const { store } = useLiveStore();
  const waHref = buildWhatsAppGeneralUrl(
    store.settings.whatsappNumber,
    "Merhaba, Ensar Hediyelik sipariş ve ürünler hakkında bilgi almak istiyorum."
  );

  return (
    <div className="ensar-container py-10 lg:py-14">
      <div className="ensar-card mx-auto max-w-xl p-6 text-center sm:p-8">
        <h1 className="font-heading text-[30px] font-medium text-[#241722] sm:text-[36px]">
          WhatsApp Sipariş &amp; Destek
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[#5F505C]">
          Beğendiğiniz ürünleri sepetinize ekleyip tek tuşla WhatsApp üzerinden
          bizimle paylaşabilir veya doğrudan müşteri temsilcimize
          yazabilirsiniz.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-[#321B2D] px-6 text-sm font-semibold text-[#F7F3EB] hover:bg-[#44253D]"
          >
            <WhatsAppIcon size={18} />
            <span>WhatsApp&apos;tan Bize Yazın</span>
          </a>

          <Link
            href="/sepet/"
            className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-[#321B2D] bg-[#FFFDF8] px-6 text-sm font-semibold text-[#321B2D] hover:bg-[#E9D9F1]"
          >
            Sepetime Git
          </Link>
        </div>
      </div>
    </div>
  );
}
