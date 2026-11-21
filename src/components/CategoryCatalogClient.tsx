"use client";

import React, { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Category, Product } from "@/types/store";
import { ProductCard } from "./ProductCard";

interface CategoryCatalogClientProps {
  category: Category;
  parentCategory?: Category;
  subcategories: Category[];
  allCategoryProducts: Product[];
}

function CategoryCatalogInner({
  category,
  parentCategory,
  subcategories,
  allCategoryProducts,
}: CategoryCatalogClientProps) {
  const searchParams = useSearchParams();
  const isPreview = searchParams.get("onizleme") === "1";
  const [activeSubSlug, setActiveSubSlug] = useState<string>("all");

  const visibleProducts = useMemo(() => {
    const base = isPreview
      ? allCategoryProducts
      : allCategoryProducts.filter((p) => p.published);

    if (activeSubSlug === "all") return base;
    return base.filter((p) => p.categorySlug === activeSubSlug);
  }, [allCategoryProducts, isPreview, activeSubSlug]);

  const draftCount = useMemo(
    () => allCategoryProducts.filter((p) => !p.published).length,
    [allCategoryProducts]
  );

  return (
    <div className="ensar-container py-8 lg:py-12">
      <nav aria-label="Sayfa yolu" className="text-xs text-[#6F606C]">
        <Link href="/" className="hover:text-[#321B2D]">
          Ana Sayfa
        </Link>
        <span className="mx-2">/</span>
        <Link href="/kategoriler" className="hover:text-[#321B2D]">
          Kategoriler
        </Link>
        {parentCategory && (
          <>
            <span className="mx-2">/</span>
            <Link
              href={
                isPreview
                  ? `/kategori/${parentCategory.slug}?onizleme=1`
                  : `/kategori/${parentCategory.slug}`
              }
              className="hover:text-[#321B2D]"
            >
              {parentCategory.name}
            </Link>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="font-medium text-[#241722]">{category.name}</span>
      </nav>

      {isPreview && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#321B2D]/20 bg-[#E9D9F1]/70 px-4 py-3 text-sm text-[#321B2D]">
          <span>
            <strong>Yetkili Önizleme Modu:</strong> Bu görünümde taslak ürünler (
            {draftCount} adet) de listelenmektedir. Halka açık sitede yalnızca
            yayınlanmış ürünler görünür.
          </span>
          <Link
            href={`/kategori/${category.slug}`}
            className="rounded-full bg-[#321B2D] px-4 py-1.5 text-xs font-semibold text-[#F7F3EB]"
          >
            Önizlemeden Çık
          </Link>
        </div>
      )}

      <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="max-w-2xl">
          <h1 className="font-heading text-[32px] font-medium text-[#241722] lg:text-[42px]">
            {category.name}
          </h1>
          <p className="mt-2 text-[15px] text-[#5F505C]">
            {category.description}
          </p>
        </div>
        <p className="text-sm font-medium text-[#5F505C]">
          {visibleProducts.length} ürün listeleniyor
        </p>
      </div>

      {/* Subcategory filter pills (for parent categories like Yılbaşı) */}
      {subcategories.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveSubSlug("all")}
            className={`min-h-[40px] rounded-full px-4 py-1.5 text-xs font-semibold transition-colors sm:text-sm ${
              activeSubSlug === "all"
                ? "bg-[#321B2D] text-[#F7F3EB]"
                : "border border-[#DDD3C6] bg-[#FFFDF8] text-[#241722] hover:border-[#321B2D]"
            }`}
          >
            Tümü (
            {isPreview
              ? allCategoryProducts.length
              : allCategoryProducts.filter((p) => p.published).length}
            )
          </button>

          {subcategories.map((sub) => {
            const subCount = (
              isPreview
                ? allCategoryProducts
                : allCategoryProducts.filter((p) => p.published)
            ).filter((p) => p.categorySlug === sub.slug).length;

            return (
              <button
                key={sub.slug}
                type="button"
                onClick={() => setActiveSubSlug(sub.slug)}
                className={`min-h-[40px] rounded-full px-4 py-1.5 text-xs font-semibold transition-colors sm:text-sm ${
                  activeSubSlug === sub.slug
                    ? "bg-[#321B2D] text-[#F7F3EB]"
                    : "border border-[#DDD3C6] bg-[#FFFDF8] text-[#241722] hover:border-[#321B2D]"
                }`}
              >
                {sub.name} ({subCount})
              </button>
            );
          })}
        </div>
      )}

      {visibleProducts.length === 0 ? (
        <div className="ensar-card mt-8 p-8 text-center">
          <p className="text-base font-medium text-[#241722]">
            Bu kategoride şu anda yayınlanmış ürün bulunmamaktadır.
          </p>
          {draftCount > 0 && !isPreview && (
            <p className="mt-1.5 text-xs text-[#5F505C]">
              Bu kategoriye ait taslak ürünler yönetim panelinden fiyat ve stok
              onayı sonrası yayına alınacaktır.
            </p>
          )}
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              href="/kategoriler"
              className="inline-flex min-h-[44px] items-center rounded-full bg-[#321B2D] px-6 text-sm font-semibold text-[#F7F3EB]"
            >
              Tüm Kategorileri İncele
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:gap-5">
          {visibleProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              previewMode={isPreview}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CategoryCatalogClient(props: CategoryCatalogClientProps) {
  return (
    <Suspense
      fallback={
        <div className="ensar-container py-12">
          <p className="text-sm text-[#5F505C]">Kategori yükleniyor…</p>
        </div>
      }
    >
      <CategoryCatalogInner {...props} />
    </Suspense>
  );
}
