import React from "react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="ensar-container py-16 text-center lg:py-24">
      <div className="ensar-card mx-auto max-w-lg p-8 sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-widest text-[#6F606C]">
          404
        </p>
        <h1 className="font-heading mt-2 text-[32px] font-medium text-[#241722]">
          Aradığınız Sayfa Bulunamadı
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[#5F505C]">
          Bu adres taşınmış veya kaldırılmış olabilir. Ana sayfaya dönebilir ya da
          Hediyeni Bul aracıyla ürünlere ulaşabilirsiniz.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center rounded-full bg-[#321B2D] px-6 text-sm font-semibold text-[#F7F3EB]"
          >
            Ana Sayfa
          </Link>
          <Link
            href="/kategoriler"
            className="inline-flex min-h-[44px] items-center rounded-full border border-[#321B2D] px-6 text-sm font-semibold text-[#321B2D]"
          >
            Kategoriler
          </Link>
        </div>
      </div>
    </div>
  );
}
