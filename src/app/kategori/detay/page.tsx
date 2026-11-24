"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLiveStore } from "@/components/StoreProvider";
import { CategoryCatalogClient } from "@/components/CategoryCatalogClient";

function DynamicCategoryInner() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug") || "";
  const { store, ready } = useLiveStore();

  const category = store.categories.find((c) => c.slug === slug);

  if (!category) {
    if (!ready) {
      return (
        <div className="ensar-container py-16 text-center">
          <p className="text-sm font-medium text-[#5F505C]">Kategori yükleniyor…</p>
        </div>
      );
    }

    return (
      <div className="ensar-container py-16 text-center">
        <div className="ensar-card mx-auto max-w-md p-8">
          <h1 className="font-heading text-2xl font-medium text-[#241722]">
            Kategori Bulunamadı
          </h1>
          <p className="mt-2 text-sm text-[#5F505C]">
            Aradığınız kategori henüz mevcut değil veya kaldırılmış olabilir.
          </p>
          <Link
            href="/kategoriler"
            className="mt-5 inline-flex min-h-[44px] items-center rounded-full bg-[#321B2D] px-6 text-sm font-semibold text-[#F7F3EB]"
          >
            Tüm Kategoriler
          </Link>
        </div>
      </div>
    );
  }

  const parentCategory = category.parentSlug
    ? store.categories.find((c) => c.slug === category.parentSlug)
    : undefined;
  const subcategories = store.categories.filter(
    (c) => c.parentSlug === category.slug
  );

  return (
    <CategoryCatalogClient
      category={category}
      parentCategory={parentCategory}
      subcategories={subcategories}
      allCategoryProducts={[]}
    />
  );
}

export default function DynamicCategoryPage() {
  return (
    <Suspense
      fallback={
        <div className="ensar-container py-12">
          <p className="text-sm text-[#5F505C]">Kategori yükleniyor…</p>
        </div>
      }
    >
      <DynamicCategoryInner />
    </Suspense>
  );
}
