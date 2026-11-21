"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLiveStore } from "./StoreProvider";
import { ProductCard } from "./ProductCard";
import { ChevronRightIcon } from "./Icons";
import { DEFAULT_STORE_DATA } from "@/lib/default-store";

const STATIC_CAT_SLUGS = new Set(
  DEFAULT_STORE_DATA.categories.map((c) => c.slug)
);

export function getCategoryHref(slug: string): string {
  if (STATIC_CAT_SLUGS.has(slug)) {
    return `/kategori/${slug}/`;
  }
  return `/kategori/detay/?slug=${encodeURIComponent(slug)}`;
}

export function CategoriesClient() {
  const { store } = useLiveStore();
  const [visibleLimit, setVisibleLimit] = useState(36);

  const publishedProducts = store.products.filter((p) => p.published);
  const topCategories = store.categories.filter((c) => !c.parentSlug);
  const yilbasiSubcategories = store.categories.filter(
    (c) => c.parentSlug === "yilbasi"
  );

  return (
    <div className="ensar-container py-8 lg:py-12">
      <div className="max-w-2xl">
        <h1 className="font-heading text-[32px] font-medium text-[#241722] lg:text-[42px]">
          Kategoriler
        </h1>
        <p className="mt-2 text-[15px] text-[#5F505C]">
          Özel günler ve sevdikleriniz için özenle seçilmiş hediyelik
          koleksiyonlarımızı inceleyin.
        </p>
      </div>

      {/* Main Categories */}
      <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-6">
        {topCategories.map((cat) => {
          const childSlugs = new Set(
            store.categories
              .filter((sub) => sub.parentSlug === cat.slug)
              .map((sub) => sub.slug)
          );
          const count = publishedProducts.filter(
            (p) =>
              p.categorySlug === cat.slug ||
              p.extraCategorySlugs?.includes(cat.slug) ||
              childSlugs.has(p.categorySlug)
          ).length;

          return (
            <Link
              key={cat.slug}
              href={getCategoryHref(cat.slug)}
              className="ensar-card group overflow-hidden transition-transform duration-300 hover:-translate-y-0.5"
            >
              <div className="aspect-square w-full overflow-hidden bg-white p-2">
                <img
                  src={cat.image}
                  alt={cat.imageAlt}
                  className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-3.5 text-center">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-[15px] font-medium text-[#241722]">
                    {cat.name}
                  </span>
                  <ChevronRightIcon size={15} className="text-[#5F505C]" />
                </div>
                <p className="mt-0.5 text-xs text-[#6F606C]">
                  {childSlugs.size > 0
                    ? `${childSlugs.size} alt kategori · ${count} ürün`
                    : `${count} ürün`}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Yılbaşı Subcategories */}
      {yilbasiSubcategories.length > 0 && (
        <section className="mt-10">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-heading text-[24px] font-medium text-[#241722] lg:text-[30px]">
              Yılbaşı Alt Kategorileri
            </h2>
            <Link
              href="/kategori/yilbasi/"
              className="text-sm font-semibold text-[#321B2D] hover:underline"
            >
              Yılbaşı Ana Kategorisi →
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {yilbasiSubcategories.map((sub) => (
              <Link
                key={sub.slug}
                href={getCategoryHref(sub.slug)}
                className="ensar-card flex items-center gap-3 p-2.5 transition-colors hover:border-[#321B2D]/40"
              >
                <img
                  src={sub.image}
                  alt={sub.imageAlt}
                  className="h-12 w-12 shrink-0 rounded-xl bg-[#FFFDF8] object-cover"
                />
                <span className="text-xs font-medium text-[#241722] sm:text-sm">
                  {sub.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-12 lg:mt-16">
        <h2 className="font-heading text-[26px] font-medium text-[#241722] lg:text-[32px]">
          Tüm Ürünler ({publishedProducts.length})
        </h2>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:gap-5">
          {publishedProducts.slice(0, visibleLimit).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        {publishedProducts.length > visibleLimit && (
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => setVisibleLimit((v) => v + 48)}
              className="inline-flex min-h-[44px] items-center rounded-full border border-[#321B2D] px-7 text-sm font-semibold text-[#321B2D] hover:bg-[#321B2D] hover:text-[#F7F3EB]"
            >
              Daha Fazla Ürün Göster ({publishedProducts.length - visibleLimit} ürün)
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
