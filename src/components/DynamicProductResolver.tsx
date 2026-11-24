"use client";

import React from "react";
import Link from "next/link";
import { useLiveStore } from "@/components/StoreProvider";
import { ProductDetailClient } from "@/components/ProductDetailClient";

export function DynamicProductResolver({ slug }: { slug: string }) {
  const { store, ready } = useLiveStore();

  const product = store.products.find((p) => p.slug === slug);

  if (!product) {
    if (!ready) {
      return (
        <div className="ensar-container py-16 text-center">
          <p className="text-sm font-medium text-[#5F505C]">Ürün yükleniyor…</p>
        </div>
      );
    }

    return (
      <div className="ensar-container py-16 text-center">
        <div className="ensar-card mx-auto max-w-md p-8">
          <h1 className="font-heading text-2xl font-medium text-[#241722]">
            Ürün Bulunamadı
          </h1>
          <p className="mt-2 text-sm text-[#5F505C]">
            Aradığınız ürün mevcut değil veya kaldırılmış olabilir.
          </p>
          <Link
            href="/kategoriler"
            className="mt-5 inline-flex min-h-[44px] items-center rounded-full bg-[#321B2D] px-6 text-sm font-semibold text-[#F7F3EB]"
          >
            Kategorilere Dön
          </Link>
        </div>
      </div>
    );
  }

  const category = store.categories.find(
    (c) => c.slug === product.categorySlug
  );
  const parentCategory = category?.parentSlug
    ? store.categories.find((c) => c.slug === category.parentSlug)
    : undefined;

  return (
    <ProductDetailClient
      product={product}
      settings={store.settings}
      categoryName={category?.name || "Hediyelik"}
      parentCategorySlug={parentCategory?.slug}
      parentCategoryName={parentCategory?.name}
    />
  );
}
