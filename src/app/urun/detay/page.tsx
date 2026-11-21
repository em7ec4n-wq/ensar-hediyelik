"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLiveStore } from "@/components/StoreProvider";
import { ProductDetailClient } from "@/components/ProductDetailClient";

function DynamicProductInner() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug") || "";
  const id = searchParams.get("id") || "";
  const { store } = useLiveStore();

  const product = store.products.find(
    (p) => (slug && p.slug === slug) || (id && p.id === id)
  );

  if (!product) {
    return (
      <div className="ensar-container py-16 text-center">
        <div className="ensar-card mx-auto max-w-md p-8">
          <h1 className="font-heading text-2xl font-medium text-[#241722]">
            Ürün Bulunamadı
          </h1>
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

export default function DynamicProductPage() {
  return (
    <Suspense
      fallback={
        <div className="ensar-container py-12">
          <p className="text-sm text-[#5F505C]">Ürün yükleniyor…</p>
        </div>
      }
    >
      <DynamicProductInner />
    </Suspense>
  );
}
