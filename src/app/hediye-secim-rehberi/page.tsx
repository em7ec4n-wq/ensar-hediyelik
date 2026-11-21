import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRightIcon, GiftIcon } from "@/components/Icons";

export const metadata: Metadata = {
  title: "Hediye Seçim Rehberi",
  description:
    "Cam küre, müzik kutusu, kum saati veya ilginç kupa seçiminde kullanım amacına göre pratik hediye rehberi.",
  alternates: { canonical: "/hediye-secim-rehberi" },
};

const GUIDE_ITEMS = [
  {
    title: "Cam Küreler — Sıcak Atmosfer & Masaüstü Hatırası",
    when: "Doğum günü, yeni iş, mezuniyet ve gece lambası arayanlar için",
    desc: "Ahşap tabanlı USB'li ışıklı cam küreler ve püskürtmeli kar küreleri, çalışma masasına veya komodine yumuşak bir ışık katar. Günlük hayatta sürekli göz önünde duran, kalıcı bir hediye arıyorsanız ilk tercih olabilir.",
    href: "/kategori/cam-kureler",
    cta: "Cam Küreleri İncele",
    image: "/ensar-web/gorseller/kategori-cam-kure.webp",
  },
  {
    title: "Müzik Kutuları — Nostaljik ve Duygusal Anlar",
    when: "Sevgililer Günü, yıldönümü, Anneler Günü ve romantik sürprizler için",
    desc: "Kurmalı balerinli piyano ve oymalı ahşap müzik kutuları pil gerektirmeden klasik melodi çalar. Anlamlı bir notla birlikte verildiğinde yıllarca saklanan duygusal bir hatıraya dönüşür.",
    href: "/kategori/muzik-kutulari",
    cta: "Müzik Kutularını İncele",
    image: "/ensar-web/gorseller/kategori-muzik-kutusu.webp",
  },
  {
    title: "Kum Saatleri — Odaklanma ve Zamansız Ofis Dekoru",
    when: "Yeni iş tebriği, ev hediyesi ve sade tasarım sevenler için",
    desc: "5, 10, 15 ve 30 dakikalık metal gövdeli kum saatleri hem çalışma seanslarında odaklanmaya yardımcı olur hem de kitaplık veya ofis masasında şık bir duruş sergiler.",
    href: "/kategori/kum-saatleri",
    cta: "Kum Saatlerini İncele",
    image: "/ensar-web/gorseller/kategori-kum-saati.webp",
  },
  {
    title: "İlginç Kupalar — Günlük Kullanımda Gülümseten Hediye",
    when: "Arkadaş doğum günleri, yılbaşı çekilişleri ve kahve tutkunları için",
    desc: "Kabartma figürlü ve temalı porselen kupalar, her sabah kahve veya çay molasında hediye edeni hatırlatır. Samimi, işlevsel ve karakter sahibi bir seçimdir.",
    href: "/kategori/ilginc-kupalar",
    cta: "İlginç Kupaları İncele",
    image: "/ensar-web/gorseller/kategori-ilginc-kupa.webp",
  },
  {
    title: "Işıklı Hediyeler — İlk Bakışta Etkileyen Vitrin Parçaları",
    when: "Özel akşamlar, yıldönümleri ve sürpriz kutlamalar için",
    desc: "Cam fanus içinde peri ışıklı solmayan güller ve sıcak LED'li objeler, paketi açıldığı anda etkileyici bir görünüm sunar.",
    href: "/kategori/isikli-hediyeler",
    cta: "Işıklı Hediyeleri İncele",
    image: "/ensar-web/gorseller/vitrin-isikli-hediyeler.webp",
  },
];

export default function GiftGuidePage() {
  return (
    <div className="ensar-container py-8 lg:py-12">
      <div className="max-w-3xl">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#E9D9F1] px-3.5 py-1 text-xs font-semibold text-[#321B2D]">
          <GiftIcon size={15} />
          <span>Kullanım Amacına Göre Rehber</span>
        </span>
        <h1 className="font-heading mt-3 text-[32px] font-medium text-[#241722] lg:text-[44px]">
          Hediye Seçim Rehberi
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[#4C3C49]">
          Kime ve hangi gün için hediye seçeceğinize karar verirken cam küre,
          müzik kutusu, kum saati, kupa ve ışıklı hediye seçeneklerini kullanım
          amacına göre karşılaştırdık.
        </p>
      </div>

      <div className="mt-8 space-y-5">
        {GUIDE_ITEMS.map((item) => (
          <article
            key={item.href}
            className="ensar-card grid grid-cols-1 overflow-hidden md:grid-cols-12"
          >
            <div className="h-52 bg-[#241320] md:col-span-4 md:h-auto">
              <img
                src={item.image}
                alt={item.title}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-col justify-center p-6 md:col-span-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6F606C]">
                {item.when}
              </p>
              <h2 className="font-heading mt-1.5 text-[24px] font-medium text-[#241722]">
                {item.title}
              </h2>
              <p className="mt-2.5 text-sm leading-relaxed text-[#4C3C49]">
                {item.desc}
              </p>
              <div className="mt-5">
                <Link
                  href={item.href}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-[#321B2D] px-5 text-sm font-semibold text-[#F7F3EB] hover:bg-[#44253D]"
                >
                  <span>{item.cta}</span>
                  <ChevronRightIcon size={15} />
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-10 rounded-[16px] bg-[#E9D9F1] p-6 sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-2xl font-medium text-[#241722]">
            Hâlâ kararsız mısınız?
          </h2>
          <p className="mt-1 text-sm text-[#4C3C49]">
            Özel gün ve hediye türüne göre anında filtreleme yapın.
          </p>
        </div>
        <Link
          href="/#hediyeni-bul"
          className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-[#321B2D] px-6 text-sm font-semibold text-[#F7F3EB] sm:mt-0"
        >
          <span>Hediyeni Bul Aracına Git</span>
          <ChevronRightIcon size={15} />
        </Link>
      </div>
    </div>
  );
}
