import React from "react";
import Link from "next/link";
import type { StoreSettings } from "@/types/store";
import { buildWhatsAppGeneralUrl } from "@/lib/format";
import { PhoneIcon, WhatsAppIcon } from "./Icons";

interface FooterProps {
  settings: StoreSettings;
}

export function Footer({ settings }: FooterProps) {
  const whatsappHref = buildWhatsAppGeneralUrl(
    settings.whatsappNumber,
    "Merhaba, Ensar Hediyelik ürünleri hakkında bilgi almak istiyorum."
  );

  return (
    <footer className="bg-[#321B2D] text-[#F7F3EB]">
      {/* Primary Footer Bar — matches reference design */}
      <div className="ensar-container py-6 lg:py-7">
        <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
          <Link
            href="/"
            className="flex min-h-[44px] items-center"
            aria-label={`${settings.brandName} Ana Sayfa`}
          >
            <img
              src={settings.logoDarkBg}
              alt={settings.brandName}
              className="h-[26px] w-auto object-contain lg:h-[30px]"
            />
          </Link>

          <div className="flex flex-wrap items-center gap-6 sm:gap-8">
            <Link
              href="/iletisim"
              className="flex min-h-[44px] items-center gap-2.5 text-[15px] font-medium text-[#F7F3EB] transition-opacity hover:opacity-85"
            >
              <PhoneIcon size={18} />
              <span>İletişim</span>
            </Link>

            <span
              className="hidden h-5 w-px bg-[#F7F3EB]/25 sm:inline-block"
              aria-hidden="true"
            />

            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[44px] items-center gap-2.5 text-[15px] font-medium text-[#F7F3EB] transition-opacity hover:opacity-85"
            >
              <WhatsAppIcon size={18} />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Legal & Store Policies Row */}
      <div className="border-t border-[#F7F3EB]/12">
        <div className="ensar-container flex flex-col gap-3 py-4 text-xs text-[#F7F3EB]/75 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link
              href="/yasal-bilgilendirme"
              className="transition-colors hover:text-[#FFFDF8]"
            >
              Yasal Bilgilendirme
            </Link>
            <Link
              href="/yasal-bilgilendirme#teslimat-iade"
              className="transition-colors hover:text-[#FFFDF8]"
            >
              Teslimat ve İade Politikası
            </Link>
            <Link
              href="/yasal-bilgilendirme#mesafeli-satis"
              className="transition-colors hover:text-[#FFFDF8]"
            >
              Mesafeli Satış &amp; Ödeme
            </Link>
            <Link
              href="/hesabim"
              className="transition-colors hover:text-[#FFFDF8]"
            >
              Hesabım
            </Link>
          </div>

          <p className="text-[#F7F3EB]/65">
            © {new Date().getFullYear()} {settings.brandName} · {settings.phoneDisplay} · Tasarım ve yazılım altyapısı: İlay Ajans
          </p>
        </div>
      </div>
    </footer>
  );
}
