"use client";

import React, { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Category, Product } from "@/types/store";
import { useLiveStore } from "./StoreProvider";
import { ProductCard } from "./ProductCard";

interface CategoryCatalogClientProps {
  category: Category;
  parentCategory?: Category;
  subcategories: Category[];
  allCategoryProducts: Product[];
}

function CategoryCatalogInner({
  category: initialCategory,
}: CategoryCatalogClientProps) {
  const { store } = useLiveStore();
  const searchParams = useSearchParams();
  const onlyPublished = searchParams.get("yayinda") === "1";
  const [activeSubSlug, setActiveSubSlug] = useState<string>("all");

  const category =
    store.categories.find((c) => c.slug === initialCategory.slug) ||
    initialCategory;

  const parentCategory = category.parentSlug
    ? store.categories.find((c) => c.slug === category.parentSlug)
    : undefined;

  const subcategories = useMemo(
    () => store.categories.filter((c) => c.parentSlug === category.slug),
    [store.categories, category.slug]
  );

  const allCategoryProducts = useMemo(() => {
    const subSlugs = new Set(subcategories.map((s) => s.slug));
    return store.products.filter(
      (p) =>
        p.categorySlug === category.slug ||
        p.extraCategorySlugs?.includes(category.slug) ||
        subSlugs.has(p.categorySlug)
    );
  }, [store.products, category.slug, subcategories]);

  const visibleProducts = useMemo(() => {
    const base = onlyPublished
      ? allCategoryProducts.filter((p) => p.published)
      : allCategoryProducts.filter((p) => p.published);

    if (activeSubSlug === "all") return base;
    return base.filter((p) => p.categorySlug === activeSubSlug);
  }, [allCategoryProducts, onlyPublished, activeSubSlug]);

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
              href={`/kategori/${parentCategory.slug}`}
              className="hover:text-[#321B2D]"
            >
              {parentCategory.name}
            </Link>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="font-medium text-[#241722]">{category.name}</span>
      </nav>

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
            {allCategoryProducts.filter((p) => p.published).length}
            )
          </button>

          {subcategories.map((sub) => {
            const subCount = allCategoryProducts.filter(
              (p) => p.published && p.categorySlug === sub.slug
            ).length;

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
            Bu kategoride şu anda ürün bulunmamaktadır.
          </p>
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
            <ProductCard key={product.id} product={product} />
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
