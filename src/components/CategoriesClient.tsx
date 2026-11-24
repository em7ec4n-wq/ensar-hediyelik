"use client";

import React from "react";
import Link from "next/link";
import { useLiveStore } from "./StoreProvider";
import { ChevronRightIcon } from "./Icons";
import { DEFAULT_STORE_DATA } from "@/lib/default-store";

const STATIC_CATEGORY_SLUGS = new Set(
  DEFAULT_STORE_DATA.categories.map((c) => c.slug)
);

export function getCategoryHref(slug: string): string {
  if (!slug) return "/kategoriler/";
  if (STATIC_CATEGORY_SLUGS.has(slug)) {
    return `/kategori/${encodeURIComponent(slug)}/`;
  }
  return `/kategori/detay/?slug=${encodeURIComponent(slug)}`;
}

export function CategoriesClient() {
  const { store } = useLiveStore();

  const publishedProducts = store.products.filter((p) => p.published);
  const topCategories = store.categories.filter((c) => !c.parentSlug);

  return (
    <div className="ensar-container py-8 lg:py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-heading text-[32px] font-medium text-[#241722] lg:text-[42px]">
          Kategoriler
        </h1>
        <p className="mt-2 text-[15px] text-[#5F505C]">
          İncelemek istediğiniz kategoriyi seçerek tüm ürünleri
          görüntüleyebilirsiniz.
        </p>

        {/* Tek tek alt alta büyük kategori kartları + alt kategorileri */}
        <div className="mx-auto mt-7 max-w-2xl grid grid-cols-1 gap-5">
          {topCategories.map((cat) => {
            const subcats = store.categories.filter(
              (sub) => sub.parentSlug === cat.slug
            );
            return (
              <div
                key={cat.slug}
                className="ensar-card overflow-hidden transition-transform duration-300 hover:-translate-y-0.5"
              >
                <Link href={getCategoryHref(cat.slug)} className="group block">
                  <div className="aspect-[16/10] w-full overflow-hidden bg-[#241320]">
                    <img
                      src={cat.image}
                      alt={cat.imageAlt}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex min-h-[56px] items-center justify-center gap-1.5 bg-[#FFFDF8] px-4 py-3.5 text-center">
                    <span className="text-[18px] font-medium text-[#241722] sm:text-[20px]">
                      {cat.name}
                    </span>
                    <ChevronRightIcon
                      size={18}
                      className="text-[#5F505C] transition-transform group-hover:translate-x-0.5"
                    />
                  </div>
                </Link>

                {subcats.length > 0 && (
                  <div className="space-y-1.5 border-t border-[#EFE7DC] bg-white p-4">
                    <p className="text-center text-xs font-bold uppercase tracking-wider text-[#6F606C]">
                      {cat.name} Alt Kategorileri
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {subcats.map((sub) => (
                        <Link
                          key={sub.slug}
                          href={getCategoryHref(sub.slug)}
                          className="flex min-h-[44px] items-center justify-between rounded-xl border border-[#E5DCD0] bg-[#FFFDF8] px-4 py-2 text-sm font-semibold text-[#321B2D] transition-colors hover:bg-[#321B2D] hover:text-[#F7F3EB]"
                        >
                          <span>• {sub.name}</span>
                          <ChevronRightIcon size={16} />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
